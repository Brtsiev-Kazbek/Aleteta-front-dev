import { AuthShell } from "@/components/auth/AuthShell";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata = {
  title: "Регистрация — Алетейя",
};

/** Внутренний путь: параметр приходит из строки запроса, доверять ему нельзя. */
function safeNext(value: string | string[] | undefined): string {
  const next = Array.isArray(value) ? value[0] : value;
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/dashboard";
  return next;
}

export default function RegisterPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const email = Array.isArray(searchParams.email)
    ? searchParams.email[0]
    : searchParams.email;

  return (
    <AuthShell
      eyebrow="Первый вход"
      heading="Своё пространство — за минуту, без настройки"
      points={[
        "Пространство, типы объектов и шаблоны заводятся сами",
        "Приглашения, отправленные на вашу почту, принимаются сразу",
        "Реквизиты организации подставляются в документы вместо ручного ввода",
      ]}
      footnote="Регистрация ничего не запускает и ни к чему не обязывает: пространство создаётся пустым, наполняете его вы."
    >
      <RegisterForm
        nextPath={safeNext(searchParams.next)}
        invitedEmail={email ?? ""}
      />
    </AuthShell>
  );
}
