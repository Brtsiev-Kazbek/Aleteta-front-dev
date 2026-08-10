/*
 * Расписание будит исполнителя публичным ключом, если служебного нет.
 *
 * ПОЧЕМУ ЭТО ВООБЩЕ ЗАКОННО. Исполнитель не пользуется ключом вызывающего.
 * К базе он обращается своим служебным ключом, который Supabase подставляет
 * ему в окружение; от того, кто его разбудил, требуется одно — пройти проверку
 * JWT на входе. Публичный ключ проекта такую проверку проходит: это настоящий
 * подписанный токен, просто с ролью `anon`.
 *
 * Что это даёт злоумышленнику, знающему публичный ключ, — а знает его любой,
 * кто открыл сайт. Он может заставить исполнителя разобрать очередь раньше
 * времени. Ровно то же делает расписание раз в минуту. Заданий он не создаёт,
 * чужого не читает, денег сверх уже поставленных заданий не тратит: пустая
 * очередь означает, что запуск завершится ничем.
 *
 * ЗАЧЕМ ТОГДА СЛУЖЕБНЫЙ. Он остаётся предпочтительным и берётся первым, если
 * положен в хранилище. Разница не в правах, а в том, что публичный ключ — общий
 * для всего проекта, и однажды его смена не должна тихо ломать расписание.
 *
 * Смысл правки в другом: расписание перестало зависеть от шага настройки,
 * который человек делает вручную и потому пропускает. Пять заданий, простоявших
 * в очереди весь вечер, — цена одного невыполненного `vault.create_secret`.
 */

create or replace function app.wake_worker()
returns void
language plpgsql
security definer
set search_path = app, public, net, vault
as $$
declare
  pending integer;
  call_key text;
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

  /*
   * Служебный ключ, если он есть; иначе публичный. Порядок именно такой:
   * служебный задают осознанно, и раз задали — им и пользуемся.
   */
  select decrypted_secret into call_key
  from vault.decrypted_secrets
  where name = 'service_role_key'
  limit 1;

  if call_key is null then
    select decrypted_secret into call_key
    from vault.decrypted_secrets
    where name = 'worker_call_key'
    limit 1;
  end if;

  select decrypted_secret into project_url
  from vault.decrypted_secrets
  where name = 'project_url'
  limit 1;

  -- Ни одного ключа нет — расписание ещё не настроено. Это не ошибка.
  if call_key is null or project_url is null then
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
      'authorization', 'Bearer ' || call_key
    ),
    body := jsonb_build_object('source', 'cron'),
    timeout_milliseconds := 5000
  );
end;
$$;

comment on function app.wake_worker() is
  'Тик расписания: вернуть зависшие задания и разбудить исполнителя, если очередь не пуста.';

revoke all on function app.wake_worker() from public;
