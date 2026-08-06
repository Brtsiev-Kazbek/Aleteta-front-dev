-- Предметная область: дела, типы объектов, объекты, документы, переписка,
-- лента активности.
--
-- Структура повторяет типы фронта (types/index.ts), чтобы стыковка не
-- превратилась в перевод одной модели данных в другую.

/* ------------------------------------------------------------------ */
/*  ПЕРЕЧИСЛЕНИЯ                                                       */
/* ------------------------------------------------------------------ */

create type public.case_status as enum ('in_progress', 'collecting', 'active', 'archived');
create type public.document_status as enum ('draft', 'ready', 'signed', 'generating');
create type public.risk_level as enum ('critical', 'warning', 'info');
create type public.chat_role as enum ('user', 'assistant');
create type public.activity_kind as enum ('upload', 'ai', 'edit', 'create', 'generate');

-- Откуда взялся документ. Нужен и для интерфейса, и для статистики: видно,
-- какая доля файлов сгенерирована, а какая загружена руками.
create type public.document_source as enum ('upload', 'template', 'freeform', 'bulk', 'review');

/* ------------------------------------------------------------------ */
/*  ТИПЫ ОБЪЕКТОВ                                                      */
/* ------------------------------------------------------------------ */

/*
 * workspace_id = NULL означает встроенный тип, общий для всех: участок,
 * контрагент, физлицо. Пользовательские типы принадлежат пространству и,
 * как и решили, видны во всех его делах, а не в одном.
 */
create table public.entity_types (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces (id) on delete cascade,
  key text not null,
  label text not null check (length(btrim(label)) between 1 and 120),
  hint text,
  is_custom boolean not null default true,
  -- Массив описаний реквизитов: key, label, required, placeholder, width,
  -- pattern, patternError. Форма совпадает с EntityFieldSchema во фронте.
  fields jsonb not null default '[]'::jsonb,
  templates text[] not null default '{}',
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint entity_types_fields_is_array check (jsonb_typeof(fields) = 'array'),
  constraint entity_types_builtin_not_custom check (workspace_id is not null or is_custom = false)
);

-- Ключ уникален внутри пространства; у встроенных типов пространства нет.
create unique index entity_types_workspace_key_idx
  on public.entity_types (workspace_id, key)
  where workspace_id is not null;

create unique index entity_types_builtin_key_idx
  on public.entity_types (key)
  where workspace_id is null;

comment on table public.entity_types is
  'Типы объектов. NULL в workspace_id — встроенный тип, доступный всем пространствам.';

/* ------------------------------------------------------------------ */
/*  ДЕЛА                                                               */
/* ------------------------------------------------------------------ */

create table public.cases (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  title text not null check (length(btrim(title)) between 1 and 300),
  status public.case_status not null default 'collecting',
  tags text[] not null default '{}',
  description text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create index cases_workspace_idx on public.cases (workspace_id, created_at desc);
create index cases_status_idx on public.cases (workspace_id, status);
create index cases_tags_idx on public.cases using gin (tags);

/* ------------------------------------------------------------------ */
/*  ОБЪЕКТЫ ДЕЛА                                                       */
/* ------------------------------------------------------------------ */

/*
 * workspace_id дублируется из дела намеренно: политики доступа проверяют
 * принадлежность одним сравнением, без соединения с cases на каждой строке.
 * Согласованность держит триггер ниже.
 */
create table public.entities (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  case_id uuid not null references public.cases (id) on delete cascade,
  type_id uuid not null references public.entity_types (id) on delete restrict,
  data jsonb not null default '{}'::jsonb,
  -- Пересчитывается триггером, руками не пишется: клиент не должен уметь
  -- объявить объект валидным.
  validation_errors text[] not null default '{}',
  -- Реквизиты, извлечённые из файла неуверенно: подставлены, но требуют
  -- подтверждения человеком.
  uncertain_fields text[] not null default '{}',
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint entities_data_is_object check (jsonb_typeof(data) = 'object')
);

create index entities_case_idx on public.entities (case_id);
create index entities_workspace_idx on public.entities (workspace_id);
create index entities_data_idx on public.entities using gin (data);

/* ------------------------------------------------------------------ */
/*  ДОКУМЕНТЫ                                                          */
/* ------------------------------------------------------------------ */

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  case_id uuid not null references public.cases (id) on delete cascade,
  title text not null check (length(btrim(title)) between 1 and 300),
  -- Человеческое описание вида документа: «Выписка ЕГРН», «Договор».
  kind text,
  status public.document_status not null default 'ready',
  source public.document_source not null default 'upload',
  -- Бакет и путь, а не URL: полный адрес с доменом проекта ломается
  -- при переезде на self-hosted.
  bucket text not null default 'case-documents',
  path text,
  mime_type text,
  size_bytes bigint check (size_bytes is null or size_bytes >= 0),
  -- Отпечаток содержимого: по нему повторный разбор того же файла берётся
  -- из кэша вместо нового вызова модели.
  sha256 text check (sha256 is null or sha256 ~ '^[a-f0-9]{64}$'),
  -- Объект, из которого документ сгенерирован; NULL для загруженных файлов.
  entity_id uuid references public.entities (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index documents_case_idx on public.documents (case_id, created_at desc);
create index documents_workspace_idx on public.documents (workspace_id);
create index documents_sha_idx on public.documents (sha256) where sha256 is not null;

comment on column public.documents.path is
  'Путь внутри бакета. URL не храним — он привязан к адресу проекта.';

/* ------------------------------------------------------------------ */
/*  ПЕРЕПИСКА С АССИСТЕНТОМ                                            */
/* ------------------------------------------------------------------ */

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  case_id uuid not null references public.cases (id) on delete cascade,
  role public.chat_role not null,
  text text not null,
  -- Карточки находок и ссылки на источники в том же виде, в каком их рисует
  -- интерфейс: RiskFinding[] и Citation[].
  findings jsonb,
  citations jsonb,
  -- Задание, породившее ответ: по нему видно модель, токены и стоимость.
  ai_job_id uuid,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index chat_messages_case_idx on public.chat_messages (case_id, created_at);

/* ------------------------------------------------------------------ */
/*  ЛЕНТА АКТИВНОСТИ                                                   */
/* ------------------------------------------------------------------ */

create table public.activity (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  case_id uuid references public.cases (id) on delete cascade,
  kind public.activity_kind not null,
  text text not null,
  actor_id uuid references public.profiles (id) on delete set null,
  -- Свободные подробности: что именно поменялось, какой файл загружен.
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index activity_case_idx on public.activity (case_id, created_at desc);
create index activity_workspace_idx on public.activity (workspace_id, created_at desc);

/* ------------------------------------------------------------------ */
/*  СЕРВЕРНАЯ ВАЛИДАЦИЯ РЕКВИЗИТОВ                                     */
/* ------------------------------------------------------------------ */

/*
 * Повторяет lib/validation.ts, но исполняется в базе. Раньше проверка жила
 * только в браузере — то есть её можно было обойти, отправив запрос мимо
 * интерфейса. Теперь она не обходится: результат пересчитывается триггером
 * при каждой записи.
 */
create or replace function app.validate_entity(data jsonb, fields jsonb)
returns text[]
language plpgsql
immutable
as $$
declare
  field jsonb;
  value text;
  pattern text;
  errors text[] := '{}';
begin
  for field in select * from jsonb_array_elements(coalesce(fields, '[]'::jsonb))
  loop
    value := btrim(coalesce(data ->> (field ->> 'key'), ''));

    if value = '' then
      if coalesce((field ->> 'required')::boolean, false) then
        errors := errors || format('Не заполнено поле «%s»', field ->> 'label');
      end if;
      continue;
    end if;

    pattern := field ->> 'pattern';
    if pattern is not null and pattern <> '' and value !~ pattern then
      errors := errors || coalesce(
        nullif(field ->> 'patternError', ''),
        format('Неверный формат поля «%s»', field ->> 'label')
      );
    end if;
  end loop;

  return errors;
end;
$$;

comment on function app.validate_entity(jsonb, jsonb) is
  'Проверка обязательных полей и форматов. Серверное зеркало lib/validation.ts.';

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
  new.updated_at := now();

  return new;
end;
$$;

create trigger entities_validate
  before insert or update on public.entities
  for each row execute function app.entities_before_write();

/*
 * Правка списка реквизитов у типа делает валидность всех его объектов
 * устаревшей — пересчитываем разом.
 */
create or replace function app.revalidate_type_entities()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.fields is distinct from old.fields then
    update public.entities
       set validation_errors = app.validate_entity(data, new.fields),
           updated_at = now()
     where type_id = new.id;
  end if;
  return new;
end;
$$;

create trigger entity_types_revalidate
  after update on public.entity_types
  for each row execute function app.revalidate_type_entities();

/* ------------------------------------------------------------------ */
/*  СОГЛАСОВАННОСТЬ ПРОСТРАНСТВА                                       */
/* ------------------------------------------------------------------ */

-- Тот же приём, что и для объектов: workspace_id проставляется из дела,
-- а не принимается на веру от клиента.
create or replace function app.inherit_workspace_from_case()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  case_workspace uuid;
begin
  if new.case_id is null then
    return new;
  end if;

  select c.workspace_id into case_workspace
    from public.cases c
   where c.id = new.case_id;

  if case_workspace is null then
    raise exception 'Дело % не найдено', new.case_id;
  end if;

  new.workspace_id := case_workspace;
  return new;
end;
$$;

create trigger documents_inherit_workspace
  before insert or update on public.documents
  for each row execute function app.inherit_workspace_from_case();

create trigger chat_messages_inherit_workspace
  before insert on public.chat_messages
  for each row execute function app.inherit_workspace_from_case();

/* ------------------------------------------------------------------ */
/*  ОТМЕТКИ ВРЕМЕНИ                                                    */
/* ------------------------------------------------------------------ */

create trigger cases_touch
  before update on public.cases
  for each row execute function app.touch_updated_at();

create trigger documents_touch
  before update on public.documents
  for each row execute function app.touch_updated_at();

create trigger entity_types_touch
  before update on public.entity_types
  for each row execute function app.touch_updated_at();
