-- Пометка «модель не уверена» снимается, когда значение поправили руками.
--
-- Реквизиты, извлечённые из файла, приходят с оценкой уверенности. Те, что
-- ниже порога, попадают в `uncertain_fields` и подсвечиваются в таблице
-- янтарным: значение подставлено, но сверить его должен человек.
--
-- Дальше пометку надо снимать, иначе она бессмысленна: подсветка, которая не
-- гаснет после проверки, через неделю перестаёт что-либо значить и её
-- перестают замечать — вместе с теми полями, где она была по делу.
--
-- ПОЧЕМУ В ТРИГГЕРЕ, А НЕ В СЕРВЕРНОМ ДЕЙСТВИИ. Путей правки объекта уже два —
-- ячейка в таблице и пачка реквизитов, — и будут ещё: перенос из другого
-- документа, массовая замена, правка из ассистента. Сложить снятие пометки в
-- каждый из них значит однажды забыть про новый. Триггер видит все записи
-- одинаково: изменилось значение — пометка ушла.
--
-- Сравниваем именно значения, а не факт того, что ключ упомянут в запросе:
-- сохранение формы без единой правки не должно молча объявлять всё
-- проверенным.

create or replace function app.entities_before_write()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  type_fields jsonb;
  case_workspace uuid;
begin
  -- Пространство берётся из дела, а не из запроса: иначе объект можно было бы
  -- приписать к чужому пространству, подставив его идентификатор.
  select c.workspace_id into case_workspace
    from public.cases c
   where c.id = new.case_id;

  if case_workspace is null then
    raise exception 'Дело % не найдено', new.case_id;
  end if;

  new.workspace_id := case_workspace;

  select t.fields into type_fields
    from public.entity_types t
   where t.id = new.type_id
     and (t.workspace_id is null or t.workspace_id = case_workspace);

  if type_fields is null then
    raise exception 'Тип объекта % недоступен в этом пространстве', new.type_id;
  end if;

  new.validation_errors := app.validate_entity(new.data, type_fields);

  /*
   * Ключи, значения которых изменились этой записью, из списка неуверенных
   * выбывают. Только на update: при вставке помечает исполнитель, и снимать
   * там нечего.
   *
   * Список строится от прежнего значения, а присланное клиентом игнорируется.
   * Это заодно закрывает возможность объявить поле проверенным, ничего не
   * проверив: единственный способ снять пометку — поправить значение.
   */
  if tg_op = 'UPDATE' and coalesce(array_length(old.uncertain_fields, 1), 0) > 0
  then
    new.uncertain_fields := coalesce(
      (
        select array_agg(key order by key)
          from unnest(old.uncertain_fields) as key
         where new.data -> key is not distinct from old.data -> key
      ),
      '{}'::text[]
    );
  end if;

  new.updated_at := now();

  return new;
end;
$$;

comment on function app.entities_before_write() is
  'Проставляет пространство из дела, пересчитывает ошибки валидации и снимает '
  'пометку «модель не уверена» с тех реквизитов, значение которых изменилось.';
