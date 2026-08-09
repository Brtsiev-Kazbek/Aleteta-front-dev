-- Очередь заданий к модели.
--
-- До этой миграции `ai_jobs` была журналом: строка заводилась и кем-то
-- заполнялась. Для очереди этого мало — нужны три вещи, которых не было:
--
--   * взятие задания без гонки. Два исполнителя, запущенных одновременно,
--     возьмут одну работу дважды, и вы заплатите за неё дважды;
--   * повторы с растущей паузой. Модель отвечает 429 не потому, что запрос
--     плохой, а потому, что её сейчас много просят — через минуту тот же
--     запрос проходит;
--   * возврат зависших. Исполнитель, убитый посреди работы, оставляет
--     задание в `running` навсегда, и оно не достанется никому.

/* ------------------------------------------------------------------ */
/*  ПОЛЯ ОЧЕРЕДИ                                                       */
/* ------------------------------------------------------------------ */

alter table public.ai_jobs
  add column if not exists attempts smallint not null default 0,
  add column if not exists locked_at timestamptz,
  add column if not exists locked_by text,
  add column if not exists next_retry_at timestamptz;

comment on column public.ai_jobs.attempts is
  'Сколько раз задание уже пытались выполнить. После третьей попытки — failed.';
comment on column public.ai_jobs.locked_by is
  'Кто взял задание. Имя процесса-исполнителя: по нему видно, чей запуск завис.';

-- Выборка очереди: только ждущие своего часа.
create index if not exists ai_jobs_queue_idx
  on public.ai_jobs (created_at)
  where status = 'queued';

/* ------------------------------------------------------------------ */
/*  ВЗЯТИЕ ЗАДАНИЯ                                                     */
/* ------------------------------------------------------------------ */

/*
 * `for update skip locked` — то самое, ради чего функция существует. Строка
 * блокируется на время транзакции, а параллельный исполнитель не ждёт её, а
 * пропускает и берёт следующую. Без этого пришлось бы городить внешний
 * замок, который переживает не всякий перезапуск.
 *
 * SECURITY DEFINER: функцию зовёт исполнитель со служебным ключом, но право
 * менять чужие строки должно быть у функции, а не у роли — так безопаснее,
 * если ключ однажды попадёт не туда.
 */
create or replace function app.claim_job(worker text)
returns public.ai_jobs
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  job public.ai_jobs;
begin
  select *
    into job
    from public.ai_jobs j
   where j.status = 'queued'
     and (j.next_retry_at is null or j.next_retry_at <= now())
   order by j.created_at
   limit 1
     for update skip locked;

  if job.id is null then
    return null;
  end if;

  update public.ai_jobs
     set status = 'running',
         attempts = attempts + 1,
         locked_at = now(),
         locked_by = worker,
         started_at = coalesce(started_at, now())
   where id = job.id
   returning * into job;

  return job;
end;
$$;

comment on function app.claim_job(text) is
  'Атомарно забирает одно задание из очереди. Параллельные исполнители не столкнутся.';

/* ------------------------------------------------------------------ */
/*  ЗАВЕРШЕНИЕ                                                         */
/* ------------------------------------------------------------------ */

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
         cost_usd = coalesce(finish_job.cost, ai_jobs.cost_usd),
         error = null,
         locked_at = null,
         locked_by = null,
         finished_at = now()
   where id = job_id;
$$;

/*
 * Неудача. Пока попытки не исчерпаны, задание возвращается в очередь с
 * паузой: полминуты, две минуты, десять. Растущая — потому что причина обычно
 * временная, но повторять раз в секунду значит добить и без того занятую
 * модель.
 */
create or replace function app.fail_job(
  job_id uuid,
  reason text,
  max_attempts smallint default 3
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  tries smallint;
begin
  select attempts into tries from public.ai_jobs where id = job_id;

  if tries >= max_attempts then
    update public.ai_jobs
       set status = 'failed',
           error = reason,
           locked_at = null,
           locked_by = null,
           finished_at = now()
     where id = job_id;
  else
    update public.ai_jobs
       set status = 'queued',
           error = reason,
           locked_at = null,
           locked_by = null,
           next_retry_at = now() + (case tries
             when 1 then interval '30 seconds'
             when 2 then interval '2 minutes'
             else interval '10 minutes'
           end)
     where id = job_id;
  end if;
end;
$$;

/*
 * Возврат зависших. Исполнитель мог упасть, потерять сеть или быть убитым
 * при выкатке новой версии — задание останется в `running` навсегда.
 * Пятнадцать минут выбраны с запасом: разбор длинного договора идёт минуты,
 * но не четверть часа.
 */
create or replace function app.release_stale_jobs(older_than interval default interval '15 minutes')
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  released integer;
begin
  with back as (
    update public.ai_jobs
       set status = 'queued',
           locked_at = null,
           locked_by = null,
           error = 'Исполнитель не ответил, задание возвращено в очередь'
     where status = 'running'
       and locked_at < now() - older_than
    returning 1
  )
  select count(*) into released from back;

  return released;
end;
$$;

/* ------------------------------------------------------------------ */
/*  ПРАВА                                                              */
/* ------------------------------------------------------------------ */

/*
 * Очередь — дело исполнителя, а он ходит со служебным ключом и политики
 * обходит. Обычному пользователю эти функции не нужны: он ставит задание
 * обычной вставкой и читает результат по политике на `ai_jobs`.
 */
revoke execute on function app.claim_job(text) from public, anon, authenticated;
revoke execute on function app.finish_job(uuid, jsonb, integer, integer, numeric)
  from public, anon, authenticated;
revoke execute on function app.fail_job(uuid, text, smallint)
  from public, anon, authenticated;
revoke execute on function app.release_stale_jobs(interval)
  from public, anon, authenticated;

/*
 * Правка человека поверх ответа модели — единственное, что пользователю
 * разрешено менять в задании. Всё остальное пишет исполнитель.
 *
 * Политика на запись уже есть (`ai_jobs_update_correction`), но она пускала
 * к любым колонкам. Триггер сужает её до `correction`: иначе клиент мог бы
 * объявить задание выполненным и подставить свой результат.
 */
create or replace function app.protect_job_fields()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  -- Служебная роль пишет что угодно: это и есть исполнитель.
  if current_setting('request.jwt.claims', true) is null then
    return new;
  end if;

  if new.status is distinct from old.status
     or new.output is distinct from old.output
     or new.cost_usd is distinct from old.cost_usd
     or new.tokens_in is distinct from old.tokens_in
     or new.tokens_out is distinct from old.tokens_out
     or new.model is distinct from old.model then
    raise exception 'В задании можно менять только correction';
  end if;

  return new;
end;
$$;

drop trigger if exists ai_jobs_protect_fields on public.ai_jobs;

create trigger ai_jobs_protect_fields
  before update on public.ai_jobs
  for each row execute function app.protect_job_fields();
