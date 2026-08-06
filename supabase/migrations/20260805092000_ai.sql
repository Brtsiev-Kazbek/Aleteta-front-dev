-- Работа с моделью: задания, результаты разбора, судебная практика, куски
-- документов для поиска.
--
-- Одна таблица заданий на все AI-операции. Из неё же считается статистика и
-- берётся ответ при повторе того же запроса — тот самый лог, который потом
-- станет эталонным набором для сравнения моделей.

create extension if not exists "vector" with schema extensions;

/* ------------------------------------------------------------------ */
/*  ЗАДАНИЯ                                                            */
/* ------------------------------------------------------------------ */

create type public.ai_task as enum (
  'ocr',        -- распознавание текста скана
  'extract',    -- перенос реквизитов в карточку объекта
  'review',     -- разбор договора по пунктам
  'assistant',  -- ответ ассистента по материалам дела
  'freeform',   -- документ по свободному запросу
  'bulk',       -- документ сразу в несколько дел
  'package',    -- пакет по шаблонам (без модели, но с тем же учётом)
  'embed'       -- векторизация кусков документа
);

create type public.job_status as enum ('queued', 'running', 'done', 'failed', 'cancelled');

create table public.ai_jobs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  case_id uuid references public.cases (id) on delete cascade,
  document_id uuid references public.documents (id) on delete set null,
  task public.ai_task not null,
  status public.job_status not null default 'queued',
  progress smallint not null default 0 check (progress between 0 and 100),

  -- Чем считали. `provider` — маршрутизатор или прямой API, `model` — что
  -- он в итоге выбрал. Держим оба: по ним сравниваются варианты на одних и
  -- тех же данных.
  provider text,
  model text,
  prompt_version text,

  -- Полный вход и выход. Это и есть будущий обучающий набор, поэтому
  -- сохраняем целиком, а не только результат.
  input jsonb not null default '{}'::jsonb,
  output jsonb,
  -- Отпечаток входа: по нему повторный запрос отдаётся из лога вместо нового
  -- вызова модели. В разработке это снимает почти весь расход.
  input_hash text check (input_hash is null or input_hash ~ '^[a-f0-9]{64}$'),

  tokens_in integer check (tokens_in is null or tokens_in >= 0),
  tokens_out integer check (tokens_out is null or tokens_out >= 0),
  cost_usd numeric(12, 6) check (cost_usd is null or cost_usd >= 0),

  error text,
  -- Правка, внесённая человеком после ответа модели. Самая ценная разметка:
  -- показывает, где модель ошиблась, и достаётся бесплатно.
  correction jsonb,

  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz
);

create index ai_jobs_workspace_idx on public.ai_jobs (workspace_id, created_at desc);
create index ai_jobs_case_idx on public.ai_jobs (case_id, created_at desc);
create index ai_jobs_status_idx on public.ai_jobs (status) where status in ('queued', 'running');
-- Поиск готового ответа на такой же вход.
create index ai_jobs_cache_idx on public.ai_jobs (task, model, input_hash) where status = 'done';

comment on table public.ai_jobs is
  'Единый журнал AI-операций: очередь, результат, стоимость и правки человека.';

alter table public.chat_messages
  add constraint chat_messages_ai_job_fkey
  foreign key (ai_job_id) references public.ai_jobs (id) on delete set null;

/* ------------------------------------------------------------------ */
/*  РАЗБОР ДОГОВОРА                                                    */
/* ------------------------------------------------------------------ */

create table public.document_reviews (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  case_id uuid references public.cases (id) on delete cascade,
  document_id uuid not null references public.documents (id) on delete cascade,
  ai_job_id uuid references public.ai_jobs (id) on delete set null,
  status public.job_status not null default 'queued',
  -- Абзацы исходного текста с номерами пунктов: левая панель сплит-вью.
  paragraphs jsonb not null default '[]'::jsonb,
  critical_count integer not null default 0,
  warning_count integer not null default 0,
  info_count integer not null default 0,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  finished_at timestamptz
);

create index document_reviews_document_idx on public.document_reviews (document_id, created_at desc);
create index document_reviews_case_idx on public.document_reviews (case_id, created_at desc);

create table public.review_findings (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.document_reviews (id) on delete cascade,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  level public.risk_level not null,
  title text not null,
  description text not null,
  recommendation text,
  -- Номер пункта и идентификатор абзаца: по ним интерфейс подсвечивает текст
  -- слева при нажатии на замечание.
  clause text,
  paragraph_id text,
  -- Порядок вывода. Не `position` — это ключевое слово SQL.
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index review_findings_review_idx on public.review_findings (review_id, sort_order);

/* ------------------------------------------------------------------ */
/*  СУДЕБНАЯ ПРАКТИКА                                                  */
/* ------------------------------------------------------------------ */

/*
 * `source` разводит демонстрационные акты и будущего лицензированного
 * поставщика. Пока источник один — 'demo'; подключение реального API не
 * потребует менять ни схему, ни интерфейс.
 *
 * Часть лицензий запрещает хранить тексты у себя. На этот случай `holding`
 * допускает NULL: тогда в базе остаются только ссылка и реквизиты акта,
 * а текст подтягивается на лету.
 */
create table public.court_practice (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'demo',
  external_id text,
  court text not null,
  number text not null,
  year text not null,
  holding text,
  url text,
  -- Трактует ли акт условие против вас или в вашу пользу.
  side text not null check (side in ('against', 'favor')),
  created_at timestamptz not null default now()
);

create unique index court_practice_source_external_idx
  on public.court_practice (source, external_id)
  where external_id is not null;

create table public.finding_practice (
  finding_id uuid not null references public.review_findings (id) on delete cascade,
  practice_id uuid not null references public.court_practice (id) on delete cascade,
  relevance real,
  primary key (finding_id, practice_id)
);

/* ------------------------------------------------------------------ */
/*  КУСКИ ДОКУМЕНТОВ ДЛЯ ПОИСКА                                        */
/* ------------------------------------------------------------------ */

/*
 * Ассистент отвечает не по всему делу целиком, а по найденным фрагментам —
 * иначе длинный договор не помещается в запрос и стоит дорого.
 *
 * Размерность вектора привязана к выбранной модели эмбеддингов: 1024 — это
 * bge-m3 и совместимые. Смена модели потребует миграции и переиндексации,
 * поэтому в строке хранится ещё и имя модели: видно, чем считали.
 */
create table public.document_chunks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  case_id uuid not null references public.cases (id) on delete cascade,
  document_id uuid not null references public.documents (id) on delete cascade,
  chunk_index integer not null,
  text text not null,
  page integer,
  clause text,
  embedding extensions.vector(1024),
  embedding_model text,
  -- Для точных совпадений: номер, ИНН, фамилия. Векторный поиск на них
  -- регулярно промахивается, полнотекстовый — нет.
  tsv tsvector generated always as (to_tsvector('russian', text)) stored,
  created_at timestamptz not null default now(),
  unique (document_id, chunk_index)
);

create index document_chunks_case_idx on public.document_chunks (case_id);
create index document_chunks_tsv_idx on public.document_chunks using gin (tsv);
create index document_chunks_embedding_idx
  on public.document_chunks
  using hnsw (embedding extensions.vector_cosine_ops);

comment on table public.document_chunks is
  'Фрагменты документов с векторами и полнотекстовым индексом. Поиск всегда гибридный.';

/* ------------------------------------------------------------------ */
/*  СОГЛАСОВАННОСТЬ ПРОСТРАНСТВА                                       */
/* ------------------------------------------------------------------ */

create trigger ai_jobs_inherit_workspace
  before insert on public.ai_jobs
  for each row
  when (new.case_id is not null)
  execute function app.inherit_workspace_from_case();

create trigger document_reviews_inherit_workspace
  before insert on public.document_reviews
  for each row
  when (new.case_id is not null)
  execute function app.inherit_workspace_from_case();

create trigger document_chunks_inherit_workspace
  before insert on public.document_chunks
  for each row execute function app.inherit_workspace_from_case();

-- У замечаний своего дела нет — пространство наследуется от разбора.
create or replace function app.inherit_workspace_from_review()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  review_workspace uuid;
begin
  select r.workspace_id into review_workspace
    from public.document_reviews r
   where r.id = new.review_id;

  if review_workspace is null then
    raise exception 'Разбор % не найден', new.review_id;
  end if;

  new.workspace_id := review_workspace;
  return new;
end;
$$;

create trigger review_findings_inherit_workspace
  before insert on public.review_findings
  for each row execute function app.inherit_workspace_from_review();

/* ------------------------------------------------------------------ */
/*  ГИБРИДНЫЙ ПОИСК ПО ДЕЛУ                                            */
/* ------------------------------------------------------------------ */

/*
 * Векторный и полнотекстовый поиск объединяются взаимным рангом (RRF):
 * фрагмент, попавший в оба списка, поднимается наверх. По отдельности каждый
 * способ проваливает половину запросов — смысловой не находит точный номер,
 * текстовый не находит перефразированное.
 *
 * Фильтр по делу обязателен: без него в ответе по одному делу всплывут
 * документы другого.
 */
create or replace function public.search_case_chunks(
  target_case uuid,
  query_text text,
  query_embedding extensions.vector(1024) default null,
  match_count integer default 8
)
returns table (
  id uuid,
  document_id uuid,
  text text,
  page integer,
  clause text,
  score real
)
language sql
stable
security invoker
set search_path = public, extensions, pg_temp
as $$
  with semantic as (
    select c.id, row_number() over (order by c.embedding <=> query_embedding) as rank
      from public.document_chunks c
     where c.case_id = target_case
       and query_embedding is not null
       and c.embedding is not null
     limit 30
  ),
  lexical as (
    select c.id,
           row_number() over (
             order by ts_rank_cd(c.tsv, websearch_to_tsquery('russian', query_text)) desc
           ) as rank
      from public.document_chunks c
     where c.case_id = target_case
       and query_text is not null
       and c.tsv @@ websearch_to_tsquery('russian', query_text)
     limit 30
  ),
  merged as (
    select coalesce(s.id, l.id) as id,
           -- 60 — сглаживающая константа RRF: не даёт первому месту одного
           -- списка перевесить согласие обоих.
           (1.0 / (60 + coalesce(s.rank, 1000)))::real
             + (1.0 / (60 + coalesce(l.rank, 1000)))::real as score
      from semantic s
      full outer join lexical l on l.id = s.id
  )
  select c.id, c.document_id, c.text, c.page, c.clause, m.score
    from merged m
    join public.document_chunks c on c.id = m.id
   order by m.score desc
   limit greatest(match_count, 1)
$$;

comment on function public.search_case_chunks is
  'Гибридный поиск фрагментов внутри одного дела: вектора плюс полнотекст, объединение по RRF.';
