-- Распознанный текст документа: платим за файл один раз.
--
-- До этой миграции разбор реквизитов отправлял страницы картинками модели при
-- каждом обращении. Так делать нельзя: страница картинкой стоит примерно как
-- тысяча токенов текста, а один и тот же договор смотрят многократно — сперва
-- извлекают реквизиты, потом разбирают по пунктам, потом ищут в нём условие.
--
-- Теперь распознавание — отдельная операция, ровно одна на файл. Её результат
-- ложится сюда, а все прочие операции читают уже текст.

/* ------------------------------------------------------------------ */
/*  СТРАНИЦЫ                                                           */
/* ------------------------------------------------------------------ */

create table public.document_pages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  document_id uuid not null references public.documents (id) on delete cascade,
  -- Нумерация с единицы, как её видит человек в просмотрщике.
  page integer not null check (page >= 1),
  text text not null,
  -- Чем распознавали: при смене модели видно, что стоит перечитать.
  model text,
  -- Уверенность распознавания, если поставщик её вернул.
  confidence real check (confidence is null or (confidence >= 0 and confidence <= 1)),
  created_at timestamptz not null default now(),
  unique (document_id, page)
);

create index document_pages_document_idx on public.document_pages (document_id, page);

comment on table public.document_pages is
  'Распознанный текст постранично. Распознавание оплачивается один раз на файл, дальше читается отсюда.';

/*
 * Пространство наследуется от документа, а не принимается от клиента — тот же
 * приём, что у объектов и сообщений: иначе строку можно приписать к чужому
 * пространству, подставив его идентификатор.
 */
create or replace function app.inherit_workspace_from_document()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  doc_workspace uuid;
begin
  select d.workspace_id into doc_workspace
    from public.documents d
   where d.id = new.document_id;

  if doc_workspace is null then
    raise exception 'Документ % не найден', new.document_id;
  end if;

  new.workspace_id := doc_workspace;
  return new;
end;
$$;

create trigger document_pages_inherit_workspace
  before insert on public.document_pages
  for each row execute function app.inherit_workspace_from_document();

alter table public.document_pages enable row level security;

create policy document_pages_select on public.document_pages
  for select using (app.is_member(workspace_id) or app.is_platform_admin());

-- Пишет только исполнитель со служебным ключом: текст должен быть тем, что
-- вернула модель, а не тем, что прислал клиент.
grant select on public.document_pages to authenticated;

/* ------------------------------------------------------------------ */
/*  СОСТОЯНИЕ РАСПОЗНАВАНИЯ У ДОКУМЕНТА                                */
/* ------------------------------------------------------------------ */

create type public.ocr_status as enum ('pending', 'running', 'done', 'failed', 'skipped');

alter table public.documents
  add column if not exists ocr_status public.ocr_status not null default 'pending',
  add column if not exists page_count integer check (page_count is null or page_count >= 0),
  add column if not exists pages_done integer not null default 0,
  add column if not exists text_source text;

comment on column public.documents.ocr_status is
  'Состояние распознавания. skipped — текстовый файл, картинки читать не нужно.';
comment on column public.documents.pages_done is
  'Сколько страниц распознано. Позволяет продолжить с места обрыва, а не начинать заново.';
comment on column public.documents.text_source is
  'Откуда взят текст: vision — модель по картинкам, embedded — текстовый слой PDF, docx — разбор файла.';

/* ------------------------------------------------------------------ */
/*  ПОВТОРНАЯ ЗАГРУЗКА ТОГО ЖЕ ФАЙЛА                                   */
/* ------------------------------------------------------------------ */

/*
 * Один и тот же типовой договор юристы загружают в десяток дел. Распознавать
 * его десять раз — значит десять раз заплатить за одно и то же.
 *
 * Функция ищет уже распознанный файл с тем же содержимым в пределах
 * пространства и копирует страницы. Границу по пространству не убирать: текст
 * чужого документа — это чужие персональные данные, и совпадение отпечатка не
 * даёт права их прочитать.
 */
create or replace function app.reuse_document_text(target_document uuid)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  target public.documents;
  source_id uuid;
  copied integer := 0;
begin
  select * into target from public.documents where id = target_document;

  if target.id is null or target.sha256 is null then
    return 0;
  end if;

  select d.id into source_id
    from public.documents d
   where d.workspace_id = target.workspace_id
     and d.sha256 = target.sha256
     and d.id <> target.id
     and d.ocr_status = 'done'
   order by d.created_at
   limit 1;

  if source_id is null then
    return 0;
  end if;

  insert into public.document_pages (document_id, page, text, model, confidence)
  select target.id, p.page, p.text, p.model, p.confidence
    from public.document_pages p
   where p.document_id = source_id
  on conflict (document_id, page) do nothing;

  get diagnostics copied = row_count;

  update public.documents
     set ocr_status = 'done',
         pages_done = copied,
         page_count = copied,
         text_source = 'reused'
   where id = target.id;

  return copied;
end;
$$;

comment on function app.reuse_document_text(uuid) is
  'Копирует распознанный текст с файла с тем же содержимым в этом же пространстве.';

revoke execute on function app.reuse_document_text(uuid) from public, anon, authenticated;

/* ------------------------------------------------------------------ */
/*  ЗАПИСЬ СТРАНИЦЫ                                                    */
/* ------------------------------------------------------------------ */

/*
 * Страница пишется по одной, сразу после распознавания. Тогда обрыв на
 * семидесятой странице из восьмидесяти не обесценивает работу: повтор задания
 * начнёт с семьдесят первой.
 *
 * Здесь же двигается прогресс — интерфейс показывает «страница 34 из 80», а
 * не полоску, ползущую по таймеру.
 */
create or replace function app.save_document_page(
  target_document uuid,
  page_number integer,
  page_text text,
  used_model text default null,
  page_confidence real default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.document_pages (document_id, page, text, model, confidence)
  values (target_document, page_number, page_text, used_model, page_confidence)
  on conflict (document_id, page) do update
    set text = excluded.text,
        model = excluded.model,
        confidence = excluded.confidence;

  update public.documents
     set pages_done = (
           select count(*) from public.document_pages p
            where p.document_id = target_document
         ),
         ocr_status = case
           when page_count is not null
            and (select count(*) from public.document_pages p
                  where p.document_id = target_document) >= page_count
           then 'done'::public.ocr_status
           else 'running'::public.ocr_status
         end
   where id = target_document;
end;
$$;

revoke execute on function app.save_document_page(uuid, integer, text, text, real)
  from public, anon, authenticated;

/* ------------------------------------------------------------------ */
/*  ТЕКСТ ЦЕЛИКОМ                                                      */
/* ------------------------------------------------------------------ */

/*
 * Собранный текст для операций, которым нужен весь документ: извлечение
 * реквизитов из короткой выписки, поиск по фрагментам. Для длинных документов
 * вызывающий берёт не всё сразу, а диапазон страниц.
 */
create or replace function public.document_text(
  target_document uuid,
  from_page integer default 1,
  to_page integer default 10000
)
returns text
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select string_agg(p.text, E'\n\n' order by p.page)
    from public.document_pages p
   where p.document_id = target_document
     and p.page between from_page and to_page
$$;

comment on function public.document_text(uuid, integer, integer) is
  'Распознанный текст документа или диапазона его страниц. Читается под правами вызывающего.';

grant execute on function public.document_text(uuid, integer, integer) to authenticated;
