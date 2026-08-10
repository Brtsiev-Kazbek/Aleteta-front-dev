import "server-only";

import { createClient } from "@/lib/supabase/server";

/**
 * Отчёт о расходе на модель.
 *
 * Считает база, а не приложение: складывать тысячи строк журнала на сервере
 * приложения — значит тащить их туда по сети целиком ради одной суммы.
 *
 * Обе функции в базе объявлены `security invoker`, поэтому фильтровать по
 * пространству здесь не нужно и не следует: политики на `ai_jobs` сами
 * покажут только своё. Добавь мы сюда ещё один фильтр — он бы дублировал
 * защиту и однажды разошёлся бы с ней.
 */

export interface MemberUsage {
  memberId: string | null;
  fullName: string;
  email: string;
  requests: number;
  failed: number;
  tokensIn: number;
  tokensOut: number;
  cost: number;
}

export interface CaseUsage {
  caseId: string;
  title: string;
  requests: number;
  failed: number;
  documents: number;
  tokensIn: number;
  tokensOut: number;
  cost: number;
}

export interface UsageReport {
  /** За сколько дней собран отчёт. */
  days: number;
  members: MemberUsage[];
  cases: CaseUsage[];
  totals: {
    requests: number;
    failed: number;
    tokensIn: number;
    tokensOut: number;
    cost: number;
  };
}

export async function loadUsage(days = 30): Promise<UsageReport> {
  const supabase = createClient();

  const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const to = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const [byMember, byCase] = await Promise.all([
    supabase.rpc("ai_usage_by_member", { from_date: from, to_date: to }),
    supabase.rpc("ai_usage_by_case", { from_date: from, to_date: to }),
  ]);

  if (byMember.error) {
    throw new Error(`Не удалось собрать расход по участникам: ${byMember.error.message}`);
  }
  if (byCase.error) {
    throw new Error(`Не удалось собрать расход по делам: ${byCase.error.message}`);
  }

  const members: MemberUsage[] = (byMember.data ?? []).map((row) => ({
    memberId: row.member_id,
    fullName: row.full_name ?? "Участник",
    email: row.email ?? "",
    requests: Number(row.requests),
    failed: Number(row.failed),
    tokensIn: Number(row.tokens_in),
    tokensOut: Number(row.tokens_out),
    cost: Number(row.cost),
  }));

  const cases: CaseUsage[] = (byCase.data ?? []).map((row) => ({
    caseId: row.case_id,
    title: row.title,
    requests: Number(row.requests),
    failed: Number(row.failed),
    documents: Number(row.documents),
    tokensIn: Number(row.tokens_in),
    tokensOut: Number(row.tokens_out),
    cost: Number(row.cost),
  }));

  /*
   * Итог берём по участникам, а не по делам: у задания может не быть дела
   * (например, у операции над всем пространством), и такая строка в разрезе
   * по делам не появится вовсе. Автор же есть у всего, что поставил человек.
   */
  const totals = members.reduce(
    (sum, member) => ({
      requests: sum.requests + member.requests,
      failed: sum.failed + member.failed,
      tokensIn: sum.tokensIn + member.tokensIn,
      tokensOut: sum.tokensOut + member.tokensOut,
      cost: sum.cost + member.cost,
    }),
    { requests: 0, failed: 0, tokensIn: 0, tokensOut: 0, cost: 0 }
  );

  return { days, members, cases, totals };
}
