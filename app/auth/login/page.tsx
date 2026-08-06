import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata = {
  title: "Вход — Алетейя",
};

/** Внутренний путь: параметр приходит из строки запроса, доверять ему нельзя. */
function safeNext(value: string | string[] | undefined): string {
  const next = Array.isArray(value) ? value[0] : value;
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/dashboard";
  return next;
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  return (
    <AuthShell
      eyebrow="Рабочее пространство"
      heading="Документы, реквизиты и проверки — в одном месте"
      points={[
        "Проверка обязательных реквизитов до генерации",
        "Пакет документов на все объекты дела одним действием",
        "Разбор договора по пунктам с судебной практикой",
      ]}
    >
      {/*
        Параметры читает страница, а не форма: с useSearchParams форму
        пришлось бы прятать за Suspense, и вместо неё при загрузке мелькала бы
        серая заглушка.
      */}
      <LoginForm
        nextPath={safeNext(searchParams.next)}
        callbackError={first(searchParams.error)}
        notice={first(searchParams.notice)}
      />
    </AuthShell>
  );
}
