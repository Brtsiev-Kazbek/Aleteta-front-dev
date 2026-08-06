-- Политики доступа.
--
-- Правило одно и повторяется везде: строку видно, если ты участник её
-- пространства; менять можешь, если роль не `viewer`. Администратор установки
-- видит всё — это нужно админ-панели.
--
-- RLS включается на каждой таблице без исключений. Таблица без политики
-- недоступна вообще — это безопасное состояние по умолчанию, но именно поэтому
-- новую таблицу нельзя забыть добавить сюда.

/* ------------------------------------------------------------------ */
/*  ПРОФИЛИ                                                            */
/* ------------------------------------------------------------------ */

alter table public.profiles enable row level security;

-- Видно себя, коллег по любому общему пространству и всех — администратору.
create policy profiles_select on public.profiles
  for select using (
    id = app.current_user_id()
    or app.is_platform_admin()
    or exists (
      select 1
        from public.workspace_members mine
        join public.workspace_members theirs
          on theirs.workspace_id = mine.workspace_id
       where mine.user_id = app.current_user_id()
         and theirs.user_id = public.profiles.id
    )
  );

create policy profiles_update_self on public.profiles
  for update using (id = app.current_user_id())
  with check (id = app.current_user_id());

create policy profiles_admin_update on public.profiles
  for update using (app.is_platform_admin())
  with check (app.is_platform_admin());

/*
 * Повышение себя до администратора установки через обычный UPDATE закрыто:
 * политика разрешает править свою строку, но не эту колонку. Роль меняется
 * только другим администратором или напрямую в базе.
 */
create or replace function app.protect_platform_role()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.platform_role is distinct from old.platform_role
     and not app.is_platform_admin() then
    raise exception 'Роль на уровне установки меняет только администратор';
  end if;
  return new;
end;
$$;

create trigger profiles_protect_platform_role
  before update on public.profiles
  for each row execute function app.protect_platform_role();

/* ------------------------------------------------------------------ */
/*  ПРОСТРАНСТВА И УЧАСТНИКИ                                           */
/* ------------------------------------------------------------------ */

alter table public.workspaces enable row level security;

create policy workspaces_select on public.workspaces
  for select using (app.is_member(id) or app.is_platform_admin());

-- Создать пространство может любой вошедший; себя же он записывает владельцем
-- отдельным запросом (см. политику вставки участников).
create policy workspaces_insert on public.workspaces
  for insert with check (
    app.current_user_id() is not null
    and created_by = app.current_user_id()
  );

create policy workspaces_update on public.workspaces
  for update using (
    app.has_workspace_role(id, array['owner', 'admin']::public.workspace_role[])
  )
  with check (
    app.has_workspace_role(id, array['owner', 'admin']::public.workspace_role[])
  );

create policy workspaces_delete on public.workspaces
  for delete using (
    app.has_workspace_role(id, array['owner']::public.workspace_role[])
  );

alter table public.workspace_members enable row level security;

create policy workspace_members_select on public.workspace_members
  for select using (app.is_member(workspace_id) or app.is_platform_admin());

/*
 * Две ситуации в одной политике: создатель записывает себя владельцем в
 * только что созданное пространство, либо владелец/админ добавляет других.
 */
create policy workspace_members_insert on public.workspace_members
  for insert with check (
    (
      user_id = app.current_user_id()
      and exists (
        select 1 from public.workspaces w
         where w.id = workspace_id
           and w.created_by = app.current_user_id()
      )
    )
    or app.has_workspace_role(workspace_id, array['owner', 'admin']::public.workspace_role[])
  );

create policy workspace_members_update on public.workspace_members
  for update using (
    app.has_workspace_role(workspace_id, array['owner', 'admin']::public.workspace_role[])
  )
  with check (
    app.has_workspace_role(workspace_id, array['owner', 'admin']::public.workspace_role[])
  );

-- Уйти из пространства можно самому; исключить другого — только владельцу или админу.
create policy workspace_members_delete on public.workspace_members
  for delete using (
    user_id = app.current_user_id()
    or app.has_workspace_role(workspace_id, array['owner', 'admin']::public.workspace_role[])
  );

alter table public.workspace_invites enable row level security;

create policy workspace_invites_select on public.workspace_invites
  for select using (
    app.has_workspace_role(workspace_id, array['owner', 'admin']::public.workspace_role[])
    or app.is_platform_admin()
  );

create policy workspace_invites_write on public.workspace_invites
  for all using (
    app.has_workspace_role(workspace_id, array['owner', 'admin']::public.workspace_role[])
  )
  with check (
    app.has_workspace_role(workspace_id, array['owner', 'admin']::public.workspace_role[])
  );

/* ------------------------------------------------------------------ */
/*  ТИПЫ ОБЪЕКТОВ                                                      */
/* ------------------------------------------------------------------ */

alter table public.entity_types enable row level security;

-- Встроенные типы читают все вошедшие, пользовательские — участники пространства.
create policy entity_types_select on public.entity_types
  for select using (
    (workspace_id is null and app.current_user_id() is not null)
    or app.is_member(workspace_id)
    or app.is_platform_admin()
  );

-- Встроенные типы через API не создаются и не правятся: они приходят миграцией.
create policy entity_types_insert on public.entity_types
  for insert with check (workspace_id is not null and app.can_write(workspace_id));

create policy entity_types_update on public.entity_types
  for update using (workspace_id is not null and app.can_write(workspace_id))
  with check (workspace_id is not null and app.can_write(workspace_id));

create policy entity_types_delete on public.entity_types
  for delete using (
    workspace_id is not null
    and app.has_workspace_role(workspace_id, array['owner', 'admin']::public.workspace_role[])
  );

/* ------------------------------------------------------------------ */
/*  ДЕЛА, ОБЪЕКТЫ, ДОКУМЕНТЫ, ПЕРЕПИСКА, АКТИВНОСТЬ                    */
/* ------------------------------------------------------------------ */

alter table public.cases enable row level security;

create policy cases_select on public.cases
  for select using (app.is_member(workspace_id) or app.is_platform_admin());

create policy cases_insert on public.cases
  for insert with check (app.can_write(workspace_id));

create policy cases_update on public.cases
  for update using (app.can_write(workspace_id))
  with check (app.can_write(workspace_id));

create policy cases_delete on public.cases
  for delete using (
    app.has_workspace_role(workspace_id, array['owner', 'admin']::public.workspace_role[])
  );

alter table public.entities enable row level security;

create policy entities_select on public.entities
  for select using (app.is_member(workspace_id) or app.is_platform_admin());

/*
 * В проверке вставки опираемся на дело, а не на workspace_id строки: его
 * значение всё равно перезапишет триггер, и доверять присланному нельзя.
 */
create policy entities_insert on public.entities
  for insert with check (
    exists (
      select 1 from public.cases c
       where c.id = case_id and app.can_write(c.workspace_id)
    )
  );

create policy entities_update on public.entities
  for update using (app.can_write(workspace_id))
  with check (app.can_write(workspace_id));

create policy entities_delete on public.entities
  for delete using (app.can_write(workspace_id));

alter table public.documents enable row level security;

create policy documents_select on public.documents
  for select using (app.is_member(workspace_id) or app.is_platform_admin());

create policy documents_insert on public.documents
  for insert with check (
    exists (
      select 1 from public.cases c
       where c.id = case_id and app.can_write(c.workspace_id)
    )
  );

create policy documents_update on public.documents
  for update using (app.can_write(workspace_id))
  with check (app.can_write(workspace_id));

create policy documents_delete on public.documents
  for delete using (app.can_write(workspace_id));

alter table public.chat_messages enable row level security;

create policy chat_messages_select on public.chat_messages
  for select using (app.is_member(workspace_id) or app.is_platform_admin());

create policy chat_messages_insert on public.chat_messages
  for insert with check (
    exists (
      select 1 from public.cases c
       where c.id = case_id and app.can_write(c.workspace_id)
    )
  );

create policy chat_messages_delete on public.chat_messages
  for delete using (app.can_write(workspace_id));

alter table public.activity enable row level security;

create policy activity_select on public.activity
  for select using (app.is_member(workspace_id) or app.is_platform_admin());

create policy activity_insert on public.activity
  for insert with check (app.is_member(workspace_id));

/* ------------------------------------------------------------------ */
/*  AI-ЗАДАНИЯ И РЕЗУЛЬТАТЫ                                            */
/* ------------------------------------------------------------------ */

alter table public.ai_jobs enable row level security;

create policy ai_jobs_select on public.ai_jobs
  for select using (app.is_member(workspace_id) or app.is_platform_admin());

create policy ai_jobs_insert on public.ai_jobs
  for insert with check (app.can_write(workspace_id));

/*
 * Обновляет задание тот, кто его выполняет, — служебная роль по ключу
 * `service_role`, которая политики обходит. Обычному пользователю оставлена
 * только правка `correction`: это его пометка «модель ошиблась вот здесь».
 */
create policy ai_jobs_update_correction on public.ai_jobs
  for update using (app.can_write(workspace_id))
  with check (app.can_write(workspace_id));

alter table public.document_reviews enable row level security;

create policy document_reviews_select on public.document_reviews
  for select using (app.is_member(workspace_id) or app.is_platform_admin());

create policy document_reviews_insert on public.document_reviews
  for insert with check (
    exists (
      select 1 from public.documents d
       where d.id = document_id and app.can_write(d.workspace_id)
    )
  );

create policy document_reviews_delete on public.document_reviews
  for delete using (app.can_write(workspace_id));

alter table public.review_findings enable row level security;

create policy review_findings_select on public.review_findings
  for select using (app.is_member(workspace_id) or app.is_platform_admin());

alter table public.finding_practice enable row level security;

create policy finding_practice_select on public.finding_practice
  for select using (
    exists (
      select 1 from public.review_findings f
       where f.id = finding_id and app.is_member(f.workspace_id)
    )
    or app.is_platform_admin()
  );

alter table public.court_practice enable row level security;

-- Практика общая для всех: она не принадлежит пространству.
create policy court_practice_select on public.court_practice
  for select using (app.current_user_id() is not null);

alter table public.document_chunks enable row level security;

create policy document_chunks_select on public.document_chunks
  for select using (app.is_member(workspace_id) or app.is_platform_admin());

/* ------------------------------------------------------------------ */
/*  ПРАВА РОЛЕЙ API                                                    */
/* ------------------------------------------------------------------ */

/*
 * Схема `app` не публикуется через REST (её нет в списке схем API), но право
 * `usage` нужно обеим ролям: политики вызывают её функции от имени того, кто
 * делает запрос. Без права анонимный запрос падал бы с ошибкой доступа вместо
 * пустого ответа — а это разные вещи для клиента.
 */
revoke all on schema app from anon, authenticated;
grant usage on schema app to anon, authenticated;

revoke all on all tables in schema public from anon;

grant select, insert, update, delete on all tables in schema public to authenticated;
-- Вставка встроенных типов и правка чужих ролей идут мимо API.
revoke insert, update, delete on public.court_practice from authenticated;

grant execute on function public.search_case_chunks(uuid, text, extensions.vector, integer) to authenticated;
