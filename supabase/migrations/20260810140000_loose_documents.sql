/*
 * Документ без дела.
 *
 * До сих пор документ существовал только внутри дела: нельзя было положить
 * файл, не заведя папку. Для основной работы это верно — документ, ни к чему
 * не относящийся, юристу не нужен. Но у распознавания есть отдельный,
 * совершенно законный сценарий: человеку надо прочитать один скан. Один раз.
 * Не заводя дела, не придумывая ему названия и не убирая потом за собой.
 *
 * Поэтому `case_id` становится необязательным. Пространство при этом остаётся
 * обязательным всегда: именно оно решает, кому файл виден, и подменить его
 * по-прежнему нельзя.
 */

alter table public.documents
  alter column case_id drop not null;

comment on column public.documents.case_id is
  'Дело, к которому относится файл. Пусто — файл загружен сам по себе, ради распознавания.';

/* ------------------------------------------------------------------ */
/*  ПРАВО НА ЗАПИСЬ                                                    */
/* ------------------------------------------------------------------ */

/*
 * Старое правило требовало дела, в котором можно писать. Теперь дела может не
 * быть — тогда проверяем право на запись прямо в пространстве.
 *
 * Порядок ветвей важен. Если дело указано, право проверяется по нему, а не по
 * присланному `workspace_id`: иначе файл можно было бы приписать к чужому делу,
 * оставив своё пространство в поле.
 */
drop policy if exists documents_insert on public.documents;

create policy documents_insert on public.documents
  for insert with check (
    case
      when case_id is null then app.can_write(workspace_id)
      else exists (
        select 1 from public.cases c
         where c.id = case_id and app.can_write(c.workspace_id)
      )
    end
  );

/* ------------------------------------------------------------------ */
/*  ПРОСТРАНСТВО ПРИ ПУСТОМ ДЕЛЕ                                       */
/* ------------------------------------------------------------------ */

/*
 * Триггер наследования и раньше пропускал строки без дела — но тогда таких
 * строк не бывало, и `workspace_id` всегда приходил из `cases`. Теперь он
 * приходит от клиента, а верить клиенту в этом поле нельзя.
 *
 * Сверяем с членством: пространство, в котором отправитель не состоит,
 * отвергаем.
 *
 * Проверка касается только сессий браузера — тех, у кого есть `auth.uid()`.
 * Исполнитель со служебным ключом, миграции и восстановление из дампа идут
 * мимо: у них пользователя нет и членства быть не может, а требовать его
 * значило бы сделать дамп невосстановимым.
 */
create or replace function app.guard_loose_document()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.case_id is not null then
    return new;
  end if;

  if new.workspace_id is null then
    raise exception 'У документа без дела должно быть пространство';
  end if;

  if auth.uid() is null then
    return new;
  end if;

  if not app.is_member(new.workspace_id) then
    raise exception 'Пространство % недоступно', new.workspace_id;
  end if;

  return new;
end;
$$;

comment on function app.guard_loose_document() is
  'Проверяет пространство у документа без дела: наследовать его неоткуда.';

create trigger documents_guard_loose
  before insert or update on public.documents
  for each row execute function app.guard_loose_document();
