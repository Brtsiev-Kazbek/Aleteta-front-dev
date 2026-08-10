/*
 * Расписание исполнителя.
 *
 * Задание в очередь кладёт серверное действие, и оно же сразу дёргает
 * исполнителя — чтобы человек не ждал минуту на пустом месте. Но на один
 * немедленный вызов полагаться нельзя: приложение могло не достучаться,
 * исполнителя могли погасить посреди работы, длинный документ возвращается в
 * очередь сам. Расписание — это страховка, а не основной путь.
 *
 * Раз в минуту здесь происходит две вещи: зависшие задания возвращаются в
 * очередь, и, если в очереди что-то есть, будится исполнитель.
 *
 * ПОЧЕМУ КЛЮЧ В ХРАНИЛИЩЕ, А НЕ В ТЕКСТЕ. Вызов Edge Function требует
 * служебного ключа — того самого, что обходит все политики доступа. В теле
 * функции он оказался бы в открытом виде: в дампе базы, в выдаче
 * `pg_get_functiondef`, в истории миграций репозитория. Поэтому ключ лежит в
 * `vault` и читается на каждом тике.
 *
 * Ключ надо положить туда один раз, вручную:
 *
 *   select vault.create_secret('<служебный ключ>', 'service_role_key');
 *
 * Пока его нет, расписание просто ничего не делает — молча, без ошибок в
 * журнале раз в минуту.
 */

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

/* ------------------------------------------------------------------ */
/*  БУДИЛЬНИК                                                          */
/* ------------------------------------------------------------------ */

create or replace function app.wake_worker()
returns void
language plpgsql
security definer
set search_path = app, public, net, vault
as $$
declare
  pending integer;
  service_key text;
  project_url text;
begin
  -- Возвращаем в очередь то, что зависло: исполнителя могли погасить.
  perform app.release_stale_jobs();

  /*
   * Пустая очередь — не будим никого. Тик раз в минуту стоит одного счёта по
   * индексу, а поднятый впустую исполнитель стоит холодного старта.
   */
  select count(*) into pending
  from public.ai_jobs
  where status = 'queued'
    and (next_retry_at is null or next_retry_at <= now());

  if pending = 0 then
    return;
  end if;

  select decrypted_secret into service_key
  from vault.decrypted_secrets
  where name = 'service_role_key'
  limit 1;

  select decrypted_secret into project_url
  from vault.decrypted_secrets
  where name = 'project_url'
  limit 1;

  -- Ключа или адреса нет — расписание ещё не настроено. Это не ошибка.
  if service_key is null or project_url is null then
    return;
  end if;

  /*
   * Ответа не ждём. Исполнитель работает до двух минут, а тик расписания
   * должен закончиться сразу: иначе следующий тик встанет в очередь за этим.
   */
  perform net.http_post(
    url := project_url || '/functions/v1/ai-worker',
    headers := jsonb_build_object(
      'content-type', 'application/json',
      'authorization', 'Bearer ' || service_key
    ),
    body := jsonb_build_object('source', 'cron'),
    timeout_milliseconds := 5000
  );
end;
$$;

comment on function app.wake_worker() is
  'Тик расписания: вернуть зависшие задания и разбудить исполнителя, если очередь не пуста.';

revoke all on function app.wake_worker() from public;

/* ------------------------------------------------------------------ */
/*  РАСПИСАНИЕ                                                         */
/* ------------------------------------------------------------------ */

/*
 * Пересоздаём, а не создаём: миграцию могут прогнать повторно, и второе
 * задание с тем же именем ошибкой не станет — станет двумя тиками в минуту.
 */
select cron.unschedule('wake-ai-worker')
where exists (select 1 from cron.job where jobname = 'wake-ai-worker');

select cron.schedule('wake-ai-worker', '* * * * *', 'select app.wake_worker()');
