import { Suspense } from "react";

import { AdminFailureNotice } from "@/components/admin/AdminFailureNotice";
import { JobsTable } from "@/components/admin/JobsTable";
import {
  isFailure,
  loadJobs,
  type AiTask,
  type JobStatus,
} from "@/lib/data/admin";

export const dynamic = "force-dynamic";

/**
 * Журнал заданий.
 *
 * Фильтры приходят из адреса и проверяются здесь: в строку запроса можно
 * написать что угодно, а функция базы ждёт значение перечисления и на чужом
 * слове упадёт. Неизвестное значение молча считаем отсутствующим — показать
 * весь список правильнее, чем страницу ошибки из-за опечатки в ссылке.
 */
const STATUSES = ["queued", "running", "done", "failed", "cancelled"];
const TASKS = [
  "ocr",
  "extract",
  "review",
  "assistant",
  "freeform",
  "bulk",
  "package",
  "embed",
];

export default async function AdminJobsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; task?: string }>;
}) {
  const params = await searchParams;

  const status = STATUSES.includes(params.status ?? "")
    ? (params.status as JobStatus)
    : undefined;
  const task = TASKS.includes(params.task ?? "")
    ? (params.task as AiTask)
    : undefined;

  const jobs = await loadJobs({ status, task });

  return (
    <div className="relative z-10 -mt-8">
      {isFailure(jobs) ? (
        <AdminFailureNotice reason={jobs.reason} />
      ) : (
        <Suspense>
          <JobsTable jobs={jobs} />
        </Suspense>
      )}
    </div>
  );
}
