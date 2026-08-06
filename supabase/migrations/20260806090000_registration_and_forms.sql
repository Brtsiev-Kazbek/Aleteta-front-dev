-- Регистрация и формы приложения.
--
-- Что появилось в интерфейсе и чего не хватало базе:
--   * форма регистрации спрашивает должность и название организации — они
--     приходят в метаданных пользователя и должны попадать в профиль и в
--     название пространства, а не теряться;
--   * почту можно менять в настройках, а `profiles.email` до сих пор
--     заполнялся один раз при регистрации и после смены расходился с `auth`;
--   * приглашение принималось только при регистрации: уже зарегистрированный
--     человек, которого позвали в чужое пространство, не получал ничего;
--   * `last_workspace_id` принимался от клиента как есть — можно было
--     записать чужое пространство и получить ошибку на каждой странице.

/* ------------------------------------------------------------------ */
/*  РЕГИСТРАЦИЯ                                                        */
/* ------------------------------------------------------------------ */

/*
 * Отличие от прежней версии — три поля из формы регистрации: имя, должность и
 * название организации. Название идёт в имя пространства; слаг по-прежнему
 * собирается из почты, потому что организацию называют кириллицей, а слаг
 * ограничен латиницей.
 */
create or replace function app.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  display_name text;
  job_title text;
  workspace_name text;
  workspace_slug text;
  new_workspace_id uuid;
begin
  display_name := coalesce(
    nullif(btrim(meta ->> 'full_name'), ''),
    split_part(new.email, '@', 1)
  );

  job_title := nullif(btrim(meta ->> 'job_title'), '');

  workspace_name := coalesce(
    nullif(btrim(meta ->> 'workspace_name'), ''),
    display_name || ' — рабочее пространство'
  );

  insert into public.profiles (id, email, full_name, job_title)
  values (new.id, new.email, display_name, job_title);

  -- Слаг из почты плюс хвост от идентификатора: без хвоста два «ivan@…»
  -- из разных доменов столкнутся на уникальном индексе.
  workspace_slug := regexp_replace(lower(split_part(new.email, '@', 1)), '[^a-z0-9]+', '-', 'g');
  workspace_slug := btrim(workspace_slug, '-');
  if length(workspace_slug) < 2 then
    workspace_slug := 'ws';
  end if;
  workspace_slug := left(workspace_slug, 32) || '-' || left(replace(new.id::text, '-', ''), 6);

  insert into public.workspaces (name, slug, created_by)
  values (left(workspace_name, 120), workspace_slug, new.id)
  returning id into new_workspace_id;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (new_workspace_id, new.id, 'owner');

  update public.profiles
     set last_workspace_id = new_workspace_id
   where id = new.id;

  -- Незакрытые приглашения на этот адрес.
  insert into public.workspace_members (workspace_id, user_id, role, invited_by)
  select i.workspace_id, new.id, i.role, i.invited_by
    from public.workspace_invites i
   where lower(i.email) = lower(new.email)
     and i.accepted_at is null
     and i.expires_at > now()
  on conflict (workspace_id, user_id) do nothing;

  update public.workspace_invites
     set accepted_at = now(),
         accepted_by = new.id
   where lower(email) = lower(new.email)
     and accepted_at is null
     and expires_at > now();

  return new;
end;
$$;

/* ------------------------------------------------------------------ */
/*  СМЕНА ПОЧТЫ                                                        */
/* ------------------------------------------------------------------ */

/*
 * Почта меняется в `auth.users` — после подтверждения по ссылке из письма.
 * В профиле она нужна для списков участников и поиска приглашений, поэтому
 * держим копию в актуальном состоянии триггером, а не надеемся на то, что
 * приложение не забудет обновить обе таблицы.
 */
create or replace function app.sync_profile_email()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.profiles
     set email = new.email
   where id = new.id
     and email is distinct from new.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_updated on auth.users;

create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row execute function app.sync_profile_email();

/* ------------------------------------------------------------------ */
/*  ПРИГЛАШЕНИЯ ДЛЯ УЖЕ ЗАРЕГИСТРИРОВАННЫХ                             */
/* ------------------------------------------------------------------ */

/*
 * Триггер регистрации закрывает приглашения только новым пользователям.
 * Если человек уже в системе, вставить себе членство он не может: политика
 * на `workspace_members` требует роль владельца или админа в этом
 * пространстве, а её у него как раз нет.
 *
 * Отсюда security definer: функция сверяет почту приглашения с почтой
 * вошедшего и только на этом основании добавляет членство. Приглашение
 * найти нельзя — можно только принять то, что адресовано тебе.
 */
create or replace function public.accept_pending_invites()
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  me uuid := app.current_user_id();
  my_email text;
  accepted integer := 0;
begin
  if me is null then
    return 0;
  end if;

  select email into my_email from public.profiles where id = me;
  if my_email is null then
    return 0;
  end if;

  insert into public.workspace_members (workspace_id, user_id, role, invited_by)
  select i.workspace_id, me, i.role, i.invited_by
    from public.workspace_invites i
   where lower(i.email) = lower(my_email)
     and i.accepted_at is null
     and i.expires_at > now()
  on conflict (workspace_id, user_id) do nothing;

  with closed as (
    update public.workspace_invites
       set accepted_at = now(),
           accepted_by = me
     where lower(email) = lower(my_email)
       and accepted_at is null
       and expires_at > now()
    returning 1
  )
  select count(*) into accepted from closed;

  return accepted;
end;
$$;

comment on function public.accept_pending_invites() is
  'Принимает приглашения, адресованные почте вошедшего. Вызывается после входа.';

revoke all on function public.accept_pending_invites() from public, anon;
grant execute on function public.accept_pending_invites() to authenticated;

/* ------------------------------------------------------------------ */
/*  ТЕКУЩЕЕ ПРОСТРАНСТВО                                               */
/* ------------------------------------------------------------------ */

/*
 * Политика разрешает править свою строку профиля целиком, а значит и записать
 * в `last_workspace_id` пространство, куда доступа нет. Читать чужие данные
 * это не даст — их закроют политики, — но каждая страница будет падать на
 * попытке открыть недоступное пространство. Проверяем членство здесь.
 */
create or replace function app.protect_last_workspace()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.last_workspace_id is not null
     and new.last_workspace_id is distinct from old.last_workspace_id
     and not exists (
       select 1
         from public.workspace_members m
        where m.workspace_id = new.last_workspace_id
          and m.user_id = new.id
     ) then
    raise exception 'Нельзя выбрать пространство, в котором вы не состоите';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_protect_last_workspace on public.profiles;

create trigger profiles_protect_last_workspace
  before update on public.profiles
  for each row execute function app.protect_last_workspace();

/* ------------------------------------------------------------------ */
/*  ПОЧТА УЧАСТНИКА В СПИСКЕ                                           */
/* ------------------------------------------------------------------ */

/*
 * Список участников выбирается связкой workspace_members → profiles. Связь по
 * внешнему ключу уже есть, но PostgREST выбирает её по имени ограничения —
 * фиксируем имя явно, чтобы вложенная выборка не сломалась при следующей
 * генерации типов.
 */
comment on constraint workspace_members_user_id_fkey on public.workspace_members is
  'Связь для вложенной выборки профиля участника: workspace_members → profiles.';
