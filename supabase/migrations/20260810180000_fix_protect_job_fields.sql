/*
 * Починка сторожа полей задания.
 *
 * Из-за него распознавание не работало вовсе: каждая попытка взять задание из
 * очереди падала с «record "new" has no field "cost_usd"», исполнитель получал
 * от PostgREST 400 и честно отвечал «взял 0 заданий». Снаружи это выглядело
 * как «файл висит в очереди», и по виду интерфейса причина не опознавалась
 * никак.
 *
 * Ошибок оказалось две, и вторая нашлась бы только после починки первой.
 *
 * ПЕРВАЯ: столбец `cost_usd` был переименован в `cost` миграцией об учёте
 * расхода — там он хранил рубли, а не доллары, — но тело этого триггера
 * осталось со старым именем. Postgres не проверяет тела plpgsql при
 * переименовании столбца, поэтому ошибка дождалась первого же выполнения.
 * Урок общий: переименование столбца требует поиска по всем телам функций, а
 * не только по запросам.
 *
 * ВТОРАЯ: пропуск для исполнителя был написан неверно. Условие
 * «`request.jwt.claims` пуст» задумывалось как «это не браузер», но служебный
 * ключ — тоже JWT, и claims у него заполнены. То есть исполнитель, законно
 * переводящий задание в `running`, упирался бы в «в задании можно менять
 * только correction» сразу после починки первой ошибки.
 *
 * Теперь смотрим на роль в claims. Пусто — вызов внутренний: миграция,
 * расписание, ручной запрос в редакторе. `service_role` — исполнитель. Всё
 * остальное — браузер, и ему по-прежнему можно менять только `correction`:
 * иначе клиент объявил бы задание выполненным и подставил свой результат.
 */

create or replace function app.protect_job_fields()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  claims text := current_setting('request.jwt.claims', true);
  actor text := '';
begin
  if claims is not null and claims <> '' then
    actor := coalesce(claims::jsonb ->> 'role', '');
  end if;

  /*
   * Пусто — вызов не из браузера: миграция, расписание, запрос в редакторе.
   * `service_role` — исполнитель, он и обязан менять статус и расход.
   */
  if actor = '' or actor = 'service_role' then
    return new;
  end if;

  if new.status is distinct from old.status
     or new.output is distinct from old.output
     or new.cost is distinct from old.cost
     or new.tokens_in is distinct from old.tokens_in
     or new.tokens_out is distinct from old.tokens_out
     or new.model is distinct from old.model then
    raise exception 'В задании можно менять только correction';
  end if;

  return new;
end;
$$;

comment on function app.protect_job_fields() is
  'Браузеру в задании разрешена только correction. Исполнитель и внутренние вызовы пишут всё.';
