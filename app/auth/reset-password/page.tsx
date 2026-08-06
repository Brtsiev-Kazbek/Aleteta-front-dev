import { AuthShell } from "@/components/auth/AuthShell";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata = {
  title: "Новый пароль — Алетейя",
};

/*
 * Страница всегда динамическая: наличие сессии восстановления читается из
 * cookie, и закешированный ответ показал бы одному человеку состояние другого.
 */
export const dynamic = "force-dynamic";

export default async function ResetPasswordPage() {
  let hasSession = false;

  if (isSupabaseConfigured()) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    hasSession = Boolean(user);
  }

  return (
    <AuthShell
      eyebrow="Доступ"
      heading="Задайте новый пароль"
      points={[
        "Минимум восемь знаков, буквы и цифры",
        "Ссылка из письма срабатывает один раз",
        "После сохранения вы сразу окажетесь в приложении",
      ]}
    >
      <ResetPasswordForm hasSession={hasSession} />
    </AuthShell>
  );
}
