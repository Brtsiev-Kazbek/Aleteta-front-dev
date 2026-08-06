/**
 * Проверки полей входа и регистрации.
 *
 * Живут отдельно от форм, потому что нужны в двух местах: браузеру — чтобы
 * подсветить ошибку до отправки, и серверному действию — чтобы отказать, если
 * запрос пришёл мимо интерфейса. Одна реализация на оба случая: разойтись они
 * не смогут.
 */

/** Минимальная длина пароля. Supabase допускает 6, мы требуем больше. */
export const PASSWORD_MIN_LENGTH = 8;

/*
 * Намеренно нестрогое выражение: полная проверка адреса по RFC невозможна, а
 * попытки приблизиться к ней отсекают действующие адреса. Настоящая проверка —
 * письмо со ссылкой, и оно всё равно отправляется.
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateEmail(value: string): string | null {
  const email = value.trim();
  if (!email) return "Укажите почту.";
  if (email.length > 254) return "Адрес слишком длинный.";
  if (!EMAIL_PATTERN.test(email)) return "Проверьте адрес: похоже, в нём опечатка.";
  return null;
}

export function validatePassword(value: string): string | null {
  if (!value) return "Придумайте пароль.";
  if (value.length < PASSWORD_MIN_LENGTH) {
    return `Пароль короче ${PASSWORD_MIN_LENGTH} знаков.`;
  }
  if (value.length > 72) {
    // Ограничение bcrypt: всё, что длиннее, молча отбрасывается.
    return "Пароль длиннее 72 знаков.";
  }
  if (!/[a-zа-яё]/i.test(value) || !/\d/.test(value)) {
    return "Добавьте в пароль хотя бы одну букву и одну цифру.";
  }
  return null;
}

export function validateFullName(value: string): string | null {
  const name = value.trim();
  if (!name) return "Укажите, как к вам обращаться.";
  if (name.length < 2) return "Слишком короткое имя.";
  if (name.length > 120) return "Слишком длинное имя.";
  return null;
}

export interface PasswordStrength {
  /** 0 — пусто, 1 — слабый, 2 — средний, 3 — надёжный. */
  score: 0 | 1 | 2 | 3;
  label: string;
}

/**
 * Оценка пароля для полоски под полем. Считает не «сложность по формуле», а
 * то, что действительно мешает перебору: длину и разнообразие символов.
 */
export function measurePassword(value: string): PasswordStrength {
  if (!value) return { score: 0, label: "" };

  let points = 0;
  if (value.length >= PASSWORD_MIN_LENGTH) points += 1;
  if (value.length >= 12) points += 1;
  if (/[a-zа-яё]/i.test(value) && /\d/.test(value)) points += 1;
  if (/[^\p{L}\d]/u.test(value)) points += 1;

  if (points <= 1) return { score: 1, label: "Слабый" };
  if (points <= 2) return { score: 2, label: "Средний" };
  return { score: 3, label: "Надёжный" };
}
