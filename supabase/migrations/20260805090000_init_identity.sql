-- Основание: пользователи, рабочие пространства, роли.
--
-- Здесь же лежат вспомогательные функции, на которые опираются все политики
-- доступа. Вынесены в отдельную схему `app`, чтобы наружу через API они не
-- публиковались и чтобы при переезде на другой Postgres менять пришлось одно
-- место, а не сотню политик.

create extension if not exists "pgcrypto" with schema extensions;

create schema if not exists app;

comment on schema app is
  'Внутренняя кухня: вспомогательные функции доступа и валидации. Через REST не публикуется.';

/* ------------------------------------------------------------------ */
/*  ПЕРЕЧИСЛЕНИЯ                                                       */
/* ------------------------------------------------------------------ */

-- Роль внутри рабочего пространства. Порядок значим: чем дальше, тем меньше прав.
create type public.workspace_role as enum ('owner', 'admin', 'member', 'viewer');

comment on type public.workspace_role is
  'owner — владелец, единственный может удалить пространство; admin — приглашает людей; member — работает с делами; viewer — только чтение.';

-- Роль на уровне всей установки. Нужна для админ-панели и сводной статистики.
create type public.platform_role as enum ('user', 'admin');

/* ------------------------------------------------------------------ */
/*  ТЕКУЩИЙ ПОЛЬЗОВАТЕЛЬ                                               */
/* ------------------------------------------------------------------ */

/*
 * Единственная точка, которая знает про Supabase Auth. Все политики и триггеры
 * обращаются сюда, поэтому смена механизма аутентификации — правка одной
 * функции, а не всех политик разом.
 */
create or replace function app.current_user_id()
returns uuid
language sql
stable
as $$
  select nullif(
    coalesce(
      current_setting('request.jwt.claim.sub', true),
      (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
    ),
    ''
  )::uuid
$$;

comment on function app.current_user_id() is
  'Идентификатор текущего пользователя. Единственное место, знающее про формат токена.';

/* ------------------------------------------------------------------ */
/*  ПРОФИЛИ                                                            */
/* ------------------------------------------------------------------ */

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  -- Не `position`: это ключевое слово SQL, и в части выражений его пришлось бы
  -- экранировать кавычками.
  job_title text,
  avatar_path text,
  platform_role public.platform_role not null default 'user',
  -- Последнее пространство, в котором работал пользователь: восстанавливаем
  -- контекст при следующем входе.
  last_workspace_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Публичные данные пользователя. auth.users наружу не отдаётся.';
comment on column public.profiles.avatar_path is 'Путь в бакете, не URL: полный адрес ломается при переезде проекта.';

/* ------------------------------------------------------------------ */
/*  РАБОЧИЕ ПРОСТРАНСТВА                                               */
/* ------------------------------------------------------------------ */

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 1 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$'),
  -- Реквизиты организации подставляются в документы вместо ручного ввода.
  legal_name text,
  inn text check (inn is null or inn ~ '^\d{10}(\d{2})?$'),
  address text,
  plan text not null default 'free',
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

comment on table public.workspaces is
  'Арендатор. Все данные продукта принадлежат пространству, а не пользователю напрямую.';

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.workspace_role not null default 'member',
  invited_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create index workspace_members_user_idx on public.workspace_members (user_id);

create table public.workspace_invites (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  email text not null,
  role public.workspace_role not null default 'member',
  -- Секрет приглашения: попадает только в письмо, наружу через API не отдаётся.
  token text not null unique default encode(extensions.gen_random_bytes(24), 'hex'),
  invited_by uuid references public.profiles (id) on delete set null,
  expires_at timestamptz not null default (now() + interval '14 days'),
  accepted_at timestamptz,
  accepted_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create unique index workspace_invites_pending_idx
  on public.workspace_invites (workspace_id, lower(email))
  where accepted_at is null;

create index workspace_invites_email_idx on public.workspace_invites (lower(email));

alter table public.profiles
  add constraint profiles_last_workspace_fkey
  foreign key (last_workspace_id) references public.workspaces (id) on delete set null;

/* ------------------------------------------------------------------ */
/*  ПРОВЕРКИ ДОСТУПА                                                   */
/* ------------------------------------------------------------------ */

/*
 * SECURITY DEFINER здесь обязателен, а не для удобства: политика на
 * `workspace_members` не может сама читать `workspace_members` — Postgres уйдёт
 * в бесконечную рекурсию. Функция выполняется с правами владельца и потому
 * читает таблицу в обход политик.
 */
create or replace function app.is_member(target_workspace uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.workspace_members m
    where m.workspace_id = target_workspace
      and m.user_id = app.current_user_id()
  )
$$;

create or replace function app.has_workspace_role(
  target_workspace uuid,
  allowed public.workspace_role[]
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.workspace_members m
    where m.workspace_id = target_workspace
      and m.user_id = app.current_user_id()
      and m.role = any (allowed)
  )
$$;

comment on function app.has_workspace_role(uuid, public.workspace_role[]) is
  'Проверка роли в пространстве. Пример: app.has_workspace_role(ws, array[''owner'',''admin'']::public.workspace_role[]).';

-- Право менять данные: смотреть может и viewer, писать — нет.
create or replace function app.can_write(target_workspace uuid)
returns boolean
language sql
stable
as $$
  select app.has_workspace_role(
    target_workspace,
    array['owner', 'admin', 'member']::public.workspace_role[]
  )
$$;

create or replace function app.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = app.current_user_id()
      and p.platform_role = 'admin'
  )
$$;

comment on function app.is_platform_admin() is
  'Администратор установки. Видит сводную статистику и все пространства в админ-панели.';

/* ------------------------------------------------------------------ */
/*  СЛУЖЕБНЫЕ ТРИГГЕРЫ                                                 */
/* ------------------------------------------------------------------ */

create or replace function app.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_touch
  before update on public.profiles
  for each row execute function app.touch_updated_at();

create trigger workspaces_touch
  before update on public.workspaces
  for each row execute function app.touch_updated_at();

/*
 * Регистрация: на каждого нового пользователя заводим профиль и личное
 * пространство, где он владелец. Иначе после подтверждения почты человек
 * попадает в приложение, где ему некуда положить дело.
 *
 * Приглашения, отправленные на его адрес до регистрации, принимаются здесь же —
 * человек сразу видит пространства, куда его звали.
 */
create or replace function app.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  display_name text;
  workspace_slug text;
  new_workspace_id uuid;
begin
  display_name := coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
    split_part(new.email, '@', 1)
  );

  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, display_name);

  -- Слаг из почты плюс хвост от идентификатора: без хвоста два «ivan@…»
  -- из разных доменов столкнутся на уникальном индексе.
  workspace_slug := regexp_replace(lower(split_part(new.email, '@', 1)), '[^a-z0-9]+', '-', 'g');
  workspace_slug := btrim(workspace_slug, '-');
  if length(workspace_slug) < 2 then
    workspace_slug := 'ws';
  end if;
  workspace_slug := left(workspace_slug, 32) || '-' || left(replace(new.id::text, '-', ''), 6);

  insert into public.workspaces (name, slug, created_by)
  values (display_name || ' — рабочее пространство', workspace_slug, new.id)
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

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function app.handle_new_user();

/*
 * Владелец у пространства должен быть всегда. Понижение или удаление
 * последнего владельца оставило бы пространство без того, кто может им
 * распоряжаться.
 */
create or replace function app.protect_last_owner()
returns trigger
language plpgsql
as $$
declare
  owners_left integer;
begin
  if tg_op = 'UPDATE' and old.role = 'owner' and new.role <> 'owner' then
    select count(*) into owners_left
      from public.workspace_members
     where workspace_id = old.workspace_id and role = 'owner';
    if owners_left <= 1 then
      raise exception 'Нельзя снять роль владельца с последнего владельца пространства';
    end if;
  end if;

  if tg_op = 'DELETE' and old.role = 'owner' then
    select count(*) into owners_left
      from public.workspace_members
     where workspace_id = old.workspace_id and role = 'owner';
    if owners_left <= 1 then
      raise exception 'Нельзя удалить последнего владельца пространства';
    end if;
  end if;

  return coalesce(new, old);
end;
$$;

create trigger workspace_members_protect_owner
  before update or delete on public.workspace_members
  for each row execute function app.protect_last_owner();
