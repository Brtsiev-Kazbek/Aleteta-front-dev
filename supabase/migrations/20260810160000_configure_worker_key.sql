/*
 * Служебный ключ для расписания — одним вызовом, без SQL-редактора.
 *
 * Расписание раз в минуту будит исполнителя, и для этого ему нужен служебный
 * ключ. Лежит он в `vault`, а не в теле функции: иначе оказался бы в дампе
 * базы и в истории репозитория.
 *
 * Класть его туда приходилось руками, запросом в веб-панели. Шаг мелкий, но он
 * последний в цепочке и потому самый пропускаемый: всё выложено, всё настроено,
 * а распознавание молчит — и непонятно почему.
 *
 * Эта функция позволяет сделать то же самое из установочного скрипта.
 *
 * ПОЧЕМУ ЭТО НЕ ДЫРА. Вызвать её может только служебная роль — то есть тот, у
 * кого служебный ключ и так уже есть. Обычный пользователь, даже владелец
 * пространства, получит отказ: право выдано ровно одной роли, а `vault` из
 * PostgREST не виден вовсе.
 */

create or replace function public.configure_worker_key(new_key text)
returns text
language plpgsql
security definer
set search_path = public, vault, pg_temp
as $$
declare
  existing uuid;
begin
  if new_key is null or length(trim(new_key)) < 20 then
    raise exception 'Ключ пустой или слишком короткий';
  end if;

  select id into existing
  from vault.secrets
  where name = 'service_role_key'
  limit 1;

  -- Заводим или обновляем: скрипт запускают повторно, и это нормально.
  if existing is null then
    perform vault.create_secret(
      trim(new_key),
      'service_role_key',
      'Служебный ключ, которым расписание будит исполнителя'
    );
    return 'ключ сохранён';
  end if;

  perform vault.update_secret(existing, trim(new_key));
  return 'ключ обновлён';
end;
$$;

comment on function public.configure_worker_key(text) is
  'Кладёт служебный ключ в vault для расписания. Доступна только служебной роли.';

revoke all on function public.configure_worker_key(text) from public;
revoke all on function public.configure_worker_key(text) from anon, authenticated;
grant execute on function public.configure_worker_key(text) to service_role;
