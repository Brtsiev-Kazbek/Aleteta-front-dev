import { AuthShell } from "@/components/auth/AuthShell";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata = {
  title: "Восстановление пароля — Алетейя",
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      eyebrow="Доступ"
      heading="Пароль восстанавливается по почте"
      points={[
        "Ссылка действует час и срабатывает один раз",
        "Пока не задан новый пароль, старый продолжает работать",
        "Дела и документы остаются на месте",
      ]}
      footnote="Ссылка приходит на почту, указанную при регистрации. Если доступа к ней нет — писать придётся администратору пространства."
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
