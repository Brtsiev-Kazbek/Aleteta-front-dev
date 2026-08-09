"use server";

import { revalidatePath } from "next/cache";

import { actionError, actionFail, actionOk, type ActionResult } from "@/lib/actions/result";
import { describeAuthError } from "@/lib/auth/messages";
import { getSiteUrl } from "@/lib/auth/site-url";
import {
  validateEmail,
  validateFullName,
  validatePassword,
} from "@/lib/auth/validation";
import { createClient } from "@/lib/supabase/server";

/**
 * Вход, регистрация и восстановление пароля.
 *
 * Всё делается на сервере, а не из браузера, по двум причинам. Первая: cookie
 * сессии ставится заголовком ответа — при входе из браузера серверные
 * компоненты на этой же навигации отрисовались бы ещё гостю. Вторая: проверки
 * полей нельзя оставлять только в браузере, их обходит любой прямой запрос.
 */

export interface SignUpInput {
  fullName: string;
  email: string;
  password: string;
  /** Должность попадает в профиль и подставляется в документы. */
  jobTitle?: string;
  /** Название организации становится именем рабочего пространства. */
  workspaceName?: string;
  /**
   * Куда вести после регистрации. Письма и подтверждения нет — путь нужен
   * только форме, которая сама переносит человека после ответа.
   */
  next?: string;
}

export interface SignUpResult {
  /** Проект требует подтверждения почты — сессии пока нет. */
  needsConfirmation: boolean;
  email: string;
}

export async function signUpAction(
  input: SignUpInput
): Promise<ActionResult<SignUpResult>> {
  const fullName = input.fullName.trim();
  const email = input.email.trim().toLowerCase();
  // Пароль не тримим: пробелы по краям — часть пароля, и обрезка сломала бы
  // вход тем, у кого они есть.
  const password = input.password;

  const nameError = validateFullName(fullName);
  if (nameError) return actionFail(nameError);

  const emailError = validateEmail(email);
  if (emailError) return actionFail(emailError);

  const passwordError = validatePassword(password);
  if (passwordError) return actionFail(passwordError);

  try {
    const supabase = createClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        /*
         * Метаданные читает триггер `app.handle_new_user`: из них собираются
         * профиль и первое рабочее пространство. Профиль не пишем отсюда
         * запросом — пользователя в этот момент ещё нет, а после
         * подтверждения почты этот код уже не выполняется.
         */
        data: {
          full_name: fullName,
          ...(input.jobTitle?.trim() ? { job_title: input.jobTitle.trim() } : {}),
          ...(input.workspaceName?.trim()
            ? { workspace_name: input.workspaceName.trim() }
            : {}),
        },
        /*
         * emailRedirectTo намеренно нет: подтверждение адреса выключено, и
         * ссылке в письме неоткуда взяться. Регистрация заканчивается сразу
         * сессией — человек попадает в приложение с последнего нажатия.
         */
      },
    });

    if (error) return actionFail(describeAuthError(error.message));

    /*
     * Повторная регистрация на занятый адрес не считается ошибкой: Supabase
     * намеренно отвечает так же, как на новую, чтобы по форме нельзя было
     * проверять, зарегистрирован ли адрес. Отличие — пустой список
     * идентификаторов.
     */
    if (data.user && data.user.identities?.length === 0) {
      return actionFail(
        "Такой пользователь уже есть. Войдите или восстановите пароль."
      );
    }

    if (data.session) {
      await acceptPendingInvites();
      revalidatePath("/", "layout");
      return actionOk({ needsConfirmation: false, email });
    }

    /*
     * Сессии нет — значит в проекте всё ещё включено подтверждение почты.
     * Это настройка Supabase, кодом её не обойти, поэтому говорим прямо, а не
     * показываем экран «проверьте почту», которого быть не должно.
     */
    return actionFail(
      "Регистрация не завершена: в проекте включено подтверждение почты. Выключите его в Supabase → Authentication → Sign In / Providers → Confirm email."
    );
  } catch (caught) {
    return actionError(caught, "Не удалось зарегистрироваться.");
  }
}

export async function signInAction(
  email: string,
  password: string
): Promise<ActionResult<null>> {
  const address = email.trim().toLowerCase();
  if (!address || !password) {
    return actionFail("Заполните почту и пароль.");
  }

  try {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: address,
      password,
    });

    if (error) return actionFail(describeAuthError(error.message));

    // Приглашения, пришедшие уже зарегистрированному: триггер регистрации их
    // не видел, принимаем при первом же входе.
    await acceptPendingInvites();
    revalidatePath("/", "layout");

    return actionOk(null);
  } catch (caught) {
    return actionError(caught, "Не удалось войти.");
  }
}

/** Повторное письмо с подтверждением адреса. */
export async function resendConfirmationAction(
  email: string
): Promise<ActionResult<null>> {
  const address = email.trim().toLowerCase();
  const emailError = validateEmail(address);
  if (emailError) return actionFail(emailError);

  try {
    const supabase = createClient();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: address,
      options: {
        emailRedirectTo: `${getSiteUrl()}/auth/callback?next=%2Fdashboard`,
      },
    });

    if (error) return actionFail(describeAuthError(error.message));
    return actionOk(null);
  } catch (caught) {
    return actionError(caught, "Не удалось отправить письмо.");
  }
}

/**
 * Письмо со ссылкой на смену пароля.
 *
 * Ответ одинаков и для существующего адреса, и для незнакомого: иначе форма
 * превращается в способ проверять, зарегистрирован ли человек.
 */
export async function requestPasswordResetAction(
  email: string
): Promise<ActionResult<null>> {
  const address = email.trim().toLowerCase();
  const emailError = validateEmail(address);
  if (emailError) return actionFail(emailError);

  try {
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(address, {
      redirectTo: `${getSiteUrl()}/auth/callback?next=%2Fauth%2Freset-password`,
    });

    // Ограничение частоты показываем: это подсказка «письмо уже в пути».
    if (error && /rate limit|too many|security purposes/i.test(error.message)) {
      return actionFail(describeAuthError(error.message));
    }

    return actionOk(null);
  } catch (caught) {
    return actionError(caught, "Не удалось отправить письмо.");
  }
}

/** Новый пароль по ссылке из письма: сессия восстановления уже в cookie. */
export async function updatePasswordAction(
  password: string
): Promise<ActionResult<null>> {
  const passwordError = validatePassword(password);
  if (passwordError) return actionFail(passwordError);

  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return actionFail(
        "Ссылка устарела или уже использована. Запросите новую."
      );
    }

    const { error } = await supabase.auth.updateUser({ password });
    if (error) return actionFail(describeAuthError(error.message));

    revalidatePath("/", "layout");
    return actionOk(null);
  } catch (caught) {
    return actionError(caught, "Не удалось сменить пароль.");
  }
}

/**
 * Смена пароля из настроек.
 *
 * Текущий пароль спрашиваем не для формальности: сессия может быть открыта на
 * чужом незаблокированном ноутбуке, и без этой проверки пароль меняет любой,
 * кто до него дошёл.
 */
export async function changePasswordAction(
  currentPassword: string,
  nextPassword: string
): Promise<ActionResult<null>> {
  const passwordError = validatePassword(nextPassword);
  if (passwordError) return actionFail(passwordError);
  if (currentPassword === nextPassword) {
    return actionFail("Новый пароль совпадает с текущим.");
  }

  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) return actionFail("Сессия не найдена. Войдите заново.");

    const { error: checkError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (checkError) return actionFail("Текущий пароль неверен.");

    const { error } = await supabase.auth.updateUser({ password: nextPassword });
    if (error) return actionFail(describeAuthError(error.message));

    return actionOk(null);
  } catch (caught) {
    return actionError(caught, "Не удалось сменить пароль.");
  }
}

/**
 * Смена почты. Адрес меняется не сразу: Supabase шлёт письмо на новый адрес,
 * и до перехода по ссылке в профиле остаётся прежний.
 */
export async function changeEmailAction(
  email: string
): Promise<ActionResult<null>> {
  const address = email.trim().toLowerCase();
  const emailError = validateEmail(address);
  if (emailError) return actionFail(emailError);

  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return actionFail("Сессия не найдена. Войдите заново.");
    if (user.email?.toLowerCase() === address) {
      return actionFail("Это и есть текущий адрес.");
    }

    const { error } = await supabase.auth.updateUser(
      { email: address },
      { emailRedirectTo: `${getSiteUrl()}/auth/callback?next=%2Fdashboard%2Fsettings` }
    );

    if (error) return actionFail(describeAuthError(error.message));
    return actionOk(null);
  } catch (caught) {
    return actionError(caught, "Не удалось сменить почту.");
  }
}

/**
 * Приглашения, адресованные почте вошедшего.
 *
 * Вставить себе членство обычным запросом нельзя — политика требует роль
 * владельца в том пространстве, куда зовут. Поэтому приём вынесен в функцию
 * базы, которая сверяет адрес приглашения с адресом вошедшего.
 */
async function acceptPendingInvites(): Promise<void> {
  try {
    const supabase = createClient();
    await supabase.rpc("accept_pending_invites");
  } catch {
    // Неудача здесь не должна мешать входу: приглашение примется при
    // следующем, а человек уже внутри своего пространства.
  }
}
