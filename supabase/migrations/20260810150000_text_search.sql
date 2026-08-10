/*
 * Поиск по распознанному тексту.
 *
 * Расшифровка уже хранится постранично в `document_pages` — этой миграцией она
 * становится ещё и находимой. Смысл не в удобстве: юрист ищет не документ, а
 * условие. «Где у нас про неустойку в размере 0,1 %» — вопрос не к списку
 * файлов, а к их содержимому, и без поиска на него отвечают, открывая договоры
 * по одному.
 *
 * Ищем по страницам, а не по документам, и возвращаем фрагмент с подсветкой.
 * Ответ «нашлось в договоре аренды» бесполезен, если в договоре сорок страниц;
 * полезен ответ «страница 12, вот эта строка».
 *
 * СЛОВАРЬ. `russian` умеет приводить слова к основе: «неустойки» находится по
 * запросу «неустойка», «начисленных» — по «начислить». Для документов на другом
 * языке основы не сработают, но точные слова найдутся всё равно.
 */

/* ------------------------------------------------------------------ */
/*  ИНДЕКС                                                             */
/* ------------------------------------------------------------------ */

/*
 * Вычисляемый столбец, а не триггер: так значение не может разойтись с текстом
 * — его попросту нельзя записать отдельно.
 */
alter table public.document_pages
  add column if not exists search tsvector
  generated always as (to_tsvector('russian'::regconfig, text)) stored;

comment on column public.document_pages.search is
  'Разобранный на слова текст страницы. Заполняется сама, отдельной записи не подлежит.';

create index if not exists document_pages_search_idx
  on public.document_pages using gin (search);

/* ------------------------------------------------------------------ */
/*  ПОИСК                                                              */
/* ------------------------------------------------------------------ */

/*
 * `security invoker` — намеренно. Функция видит ровно то, что видит
 * вызывающий: политики `document_pages` и `documents` продолжают работать, и
 * чужая страница не найдётся, даже если слово в ней есть. Делать здесь
 * `security definer` значило бы писать проверку прав заново — и однажды
 * ошибиться в ней.
 */
create or replace function public.search_document_text(
  query text,
  target_document uuid default null,
  limit_count integer default 40
)
returns table (
  document_id uuid,
  document_title text,
  page integer,
  fragment text,
  rank real
)
language sql
stable
security invoker
set search_path = public, pg_catalog
as $$
  with request as (
    -- websearch_to_tsquery понимает кавычки и «-» как исключение, и, что важнее,
    -- не падает на любой строке, которую человек ввёл в поле поиска.
    select websearch_to_tsquery('russian'::regconfig, query) as tsq
  )
  select
    p.document_id,
    d.title,
    p.page,
    ts_headline(
      'russian'::regconfig,
      p.text,
      r.tsq,
      'StartSel=<mark>, StopSel=</mark>, MaxFragments=2, FragmentDelimiter=" … ", MinWords=7, MaxWords=22'
    ),
    ts_rank(p.search, r.tsq)
  from public.document_pages p
  join public.documents d on d.id = p.document_id
  cross join request r
  where r.tsq is not null
    and p.search @@ r.tsq
    and (target_document is null or p.document_id = target_document)
  order by ts_rank(p.search, r.tsq) desc, p.document_id, p.page
  limit least(greatest(limit_count, 1), 200);
$$;

comment on function public.search_document_text(text, uuid, integer) is
  'Поиск по распознанному тексту: страница и фрагмент с подсветкой. Права проверяются политиками.';

revoke all on function public.search_document_text(text, uuid, integer) from public;
grant execute on function public.search_document_text(text, uuid, integer) to authenticated;
