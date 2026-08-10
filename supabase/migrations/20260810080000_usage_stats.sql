-- Учёт расхода: кто, по какому делу и на сколько обратился к модели.
--
-- Журнал заданий вёлся с самого начала, но прочитать его было нельзя: он
-- строчный. Вопрос «сколько за месяц потратил Иванов» требовал выгрузки и
-- таблицы в стороннем редакторе — а это ровно тот вопрос, который задают
-- каждый месяц.
--
-- Здесь три исправления, и первые два — предпосылки для третьего.

/* ------------------------------------------------------------------ */
/*  ВАЛЮТА                                                             */
/* ------------------------------------------------------------------ */

/*
 * `cost_usd` хранит не доллары.
 *
 * Имя досталось от первого поставщика, а маршрутизатор, на котором проект
 * работает, считает в рублях. Пока колонку никто не читал, это была мелкая
 * неточность; в отчёте о расходах она стала бы ложью в заголовке столбца.
 *
 * Переименовываем сейчас, пока таблица пуста и это ничего не стоит. Валюта —
 * та, в которой считает маршрутизатор, и это единственно честное определение:
 * приложение не знает курсов и знать не должно.
 */
alter table public.ai_jobs rename column cost_usd to cost;

comment on column public.ai_jobs.cost is
  'Стоимость задания в валюте маршрутизатора. У RouterAI — рубли.';

create or replace function app.finish_job(
  job_id uuid,
  result jsonb,
  tokens_in integer default null,
  tokens_out integer default null,
  cost numeric default null
)
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  update public.ai_jobs
     set status = 'done',
         progress = 100,
         output = result,
         tokens_in = coalesce(finish_job.tokens_in, ai_jobs.tokens_in),
         tokens_out = coalesce(finish_job.tokens_out, ai_jobs.tokens_out),
         cost = coalesce(finish_job.cost, ai_jobs.cost),
         error = null,
         locked_at = null,
         locked_by = null,
         finished_at = now()
   where id = job_id;
$$;

create or replace function app.record_job_spend(
  job_id uuid,
  tokens_in integer default null,
  tokens_out integer default null,
  cost numeric default null
)
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  update public.ai_jobs
     set tokens_in = case
           when record_job_spend.tokens_in is null then ai_jobs.tokens_in
           else coalesce(ai_jobs.tokens_in, 0) + record_job_spend.tokens_in
         end,
         tokens_out = case
           when record_job_spend.tokens_out is null then ai_jobs.tokens_out
           else coalesce(ai_jobs.tokens_out, 0) + record_job_spend.tokens_out
         end,
         cost = case
           when record_job_spend.cost is null then ai_jobs.cost
           else coalesce(ai_jobs.cost, 0) + record_job_spend.cost
         end
   where id = job_id;
$$;

/* ------------------------------------------------------------------ */
/*  ДЕЛО У ЗАДАНИЯ                                                     */
/* ------------------------------------------------------------------ */

/*
 * Распознавание ставится по документу, а дело при этом не указывается — оно
 * вызывающему и не нужно. Но в отчёте о расходах такие задания провалились бы
 * мимо всех дел, а это самая дорогая операция во всём приложении.
 *
 * Достаём дело из документа триггером, а не в коде: так его нельзя забыть
 * указать, откуда бы задание ни пришло.
 */
create or replace function app.inherit_case_from_document()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.case_id is null and new.document_id is not null then
    select d.case_id into new.case_id
      from public.documents d
     where d.id = new.document_id;
  end if;

  return new;
end;
$$;

/*
 * Порядок важен: это должно случиться до наследования пространства, которое
 * выводит `workspace_id` как раз из дела.
 */
drop trigger if exists ai_jobs_inherit_case on public.ai_jobs;

create trigger ai_jobs_inherit_case
  before insert on public.ai_jobs
  for each row execute function app.inherit_case_from_document();

/* ------------------------------------------------------------------ */
/*  ОТЧЁТЫ                                                             */
/* ------------------------------------------------------------------ */

/*
 * Обе функции — `security invoker`, и это не мелочь.
 *
 * Считать они будут ровно по тем заданиям, которые видны вызывающему по
 * политикам: своё пространство и ничего больше. Сделай их `security definer` —
 * и любой участник получил бы сводку расходов по чужим организациям.
 */

create or replace function public.ai_usage_by_member(
  from_date timestamptz default now() - interval '30 days',
  to_date timestamptz default now() + interval '1 day'
)
returns table (
  member_id uuid,
  full_name text,
  email text,
  requests bigint,
  failed bigint,
  tokens_in bigint,
  tokens_out bigint,
  cost numeric
)
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select
    j.created_by,
    /*
     * Задание без автора поставил не человек, а исполнитель — так бывает у
     * работы, порождённой другой работой. Показывать его пустой строкой
     * нельзя: расход-то настоящий.
     */
    case
      when j.created_by is null then 'Исполнитель'
      else coalesce(p.full_name, 'Участник')
    end,
    coalesce(p.email, ''),
    count(*),
    count(*) filter (where j.status = 'failed'),
    coalesce(sum(j.tokens_in), 0),
    coalesce(sum(j.tokens_out), 0),
    coalesce(sum(j.cost), 0)
  from public.ai_jobs j
  left join public.profiles p on p.id = j.created_by
  where j.created_at >= from_date
    and j.created_at < to_date
  group by j.created_by, p.full_name, p.email
  order by coalesce(sum(j.cost), 0) desc, count(*) desc
$$;

comment on function public.ai_usage_by_member(timestamptz, timestamptz) is
  'Расход по участникам за период. Считается по видимым вызывающему заданиям.';

create or replace function public.ai_usage_by_case(
  from_date timestamptz default now() - interval '30 days',
  to_date timestamptz default now() + interval '1 day'
)
returns table (
  case_id uuid,
  title text,
  requests bigint,
  failed bigint,
  documents bigint,
  tokens_in bigint,
  tokens_out bigint,
  cost numeric
)
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select
    c.id,
    c.title,
    count(*),
    count(*) filter (where j.status = 'failed'),
    count(distinct j.document_id),
    coalesce(sum(j.tokens_in), 0),
    coalesce(sum(j.tokens_out), 0),
    coalesce(sum(j.cost), 0)
  from public.ai_jobs j
  join public.cases c on c.id = j.case_id
  where j.created_at >= from_date
    and j.created_at < to_date
  group by c.id, c.title
  order by coalesce(sum(j.cost), 0) desc, count(*) desc
$$;

comment on function public.ai_usage_by_case(timestamptz, timestamptz) is
  'Расход по делам за период. Дело у задания проставляет триггер, даже если его не указали.';

revoke execute on function public.ai_usage_by_member(timestamptz, timestamptz)
  from public, anon;
revoke execute on function public.ai_usage_by_case(timestamptz, timestamptz)
  from public, anon;

grant execute on function public.ai_usage_by_member(timestamptz, timestamptz)
  to authenticated;
grant execute on function public.ai_usage_by_case(timestamptz, timestamptz)
  to authenticated;

/*
 * Выборка за период по журналу заданий: без него отчёт за месяц на растущей
 * таблице пойдёт последовательным чтением.
 */
create index if not exists ai_jobs_created_at_idx
  on public.ai_jobs (created_at desc);
