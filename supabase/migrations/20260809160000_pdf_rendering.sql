-- Настоящий рендер PDF: страница за страницей, с перерывами.
--
-- До этой миграции распознавание считало любой файл одностраничным — рендера
-- PDF в картинки не было, и в модель уходила ссылка на сам файл. Теперь
-- страницы рисуются движком PDFium, и появились три вещи, которых схема не
-- умела описать.
--
-- Первая: у страницы есть источник. В одном документе легко встречается и
-- набранный текст, и вклеенный скан — договор с приложением-выпиской. Мы
-- решаем по каждой странице отдельно, и по какой заплатили модели, а какую
-- прочитали даром, должно быть видно.
--
-- Вторая: расход надо записывать по ходу дела. Раньше он записывался один раз
-- в конце, и обрыв на семидесятой странице терял всё, что уже потрачено.
--
-- Третья: задание должно уметь прерваться и продолжиться. Edge Function
-- отводится две секунды процессорного времени на запуск, а страница рисуется
-- примерно за десятую долю секунды — восьмидесятистраничный документ за один
-- запуск не осилить, и это не авария, а нормальный ход работы.

/* ------------------------------------------------------------------ */
/*  ИСТОЧНИК СТРАНИЦЫ                                                  */
/* ------------------------------------------------------------------ */

alter table public.document_pages
  add column if not exists source text;

comment on column public.document_pages.source is
  'Откуда взят текст страницы: embedded — текстовый слой файла, vision — модель по картинке, blank — пустой лист, reused — копия с того же файла.';

/*
 * Старая версия остаётся в базе как отдельная перегрузка и делает вызов
 * неоднозначным, поэтому её убираем явно.
 */
drop function if exists app.save_document_page(uuid, integer, text, text, real);

create or replace function app.save_document_page(
  target_document uuid,
  page_number integer,
  page_text text,
  used_model text default null,
  page_confidence real default null,
  page_source text default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.document_pages (document_id, page, text, model, confidence, source)
  values (target_document, page_number, page_text, used_model, page_confidence, page_source)
  on conflict (document_id, page) do update
    set text = excluded.text,
        model = excluded.model,
        confidence = excluded.confidence,
        source = excluded.source;

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

comment on function app.save_document_page(uuid, integer, text, text, real, text) is
  'Записывает одну распознанную страницу и двигает прогресс документа.';

revoke execute on function app.save_document_page(uuid, integer, text, text, real, text)
  from public, anon, authenticated;

/*
 * Копия распознанного файла переносит и источник: иначе страница, прочитанная
 * из текстового слоя, после копирования выглядела бы как оплаченная.
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

  insert into public.document_pages (document_id, page, text, model, confidence, source)
  select target.id, p.page, p.text, p.model, p.confidence, coalesce(p.source, 'reused')
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

revoke execute on function app.reuse_document_text(uuid) from public, anon, authenticated;

/* ------------------------------------------------------------------ */
/*  РАСХОД ПО ХОДУ ДЕЛА                                                */
/* ------------------------------------------------------------------ */

/*
 * Потраченное записывается сразу после страницы, а не в конце задания.
 *
 * Деньги за семьдесят распознанных страниц потрачены независимо от того, чем
 * кончится семьдесят первая. Журнал, в котором упавшее задание стоит ноль,
 * врёт — и врёт в приятную сторону, что хуже всего.
 */
create or replace function app.record_job_spend(
  job_id uuid,
  tokens_in integer default null,
  tokens_out integer default null,
  cost numeric default null
)
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  update public.ai_jobs
     set tokens_in = case
           when record_job_spend.tokens_in is null then ai_jobs.tokens_in
           else coalesce(ai_jobs.tokens_in, 0) + record_job_spend.tokens_in
         end,
         tokens_out = case
           when record_job_spend.tokens_out is null then ai_jobs.tokens_out
           else coalesce(ai_jobs.tokens_out, 0) + record_job_spend.tokens_out
         end,
         cost_usd = case
           when record_job_spend.cost is null then ai_jobs.cost_usd
           else coalesce(ai_jobs.cost_usd, 0) + record_job_spend.cost
         end
   where id = job_id;
$$;

comment on function app.record_job_spend(uuid, integer, integer, numeric) is
  'Прибавляет израсходованное к заданию. Вызывается по ходу работы, а не в конце.';

revoke execute on function app.record_job_spend(uuid, integer, integer, numeric)
  from public, anon, authenticated;

/* ------------------------------------------------------------------ */
/*  ПЕРЕРЫВ                                                            */
/* ------------------------------------------------------------------ */

/*
 * Задание сделало сколько успело и возвращается в очередь.
 *
 * Это не ошибка, поэтому счётчик попыток обнуляется: иначе документ на
 * двести страниц исчерпал бы три попытки на первой сотне и был бы объявлен
 * неудачным ровно в тот момент, когда всё шло хорошо.
 *
 * Откуда продолжать, спрашивать не нужно: страницы пишутся по одной и по
 * порядку, так что `pages_done` документа и есть точка возврата.
 */
create or replace function app.requeue_job(
  job_id uuid,
  progress_value smallint default null
)
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  update public.ai_jobs
     set status = 'queued',
         attempts = 0,
         locked_at = null,
         locked_by = null,
         next_retry_at = null,
         error = null,
         progress = coalesce(progress_value, ai_jobs.progress)
   where id = job_id;
$$;

comment on function app.requeue_job(uuid, smallint) is
  'Возвращает незаконченное задание в очередь без потери попыток: работа продолжится следующим запуском.';

revoke execute on function app.requeue_job(uuid, smallint) from public, anon, authenticated;

/* ------------------------------------------------------------------ */
/*  ДОСТУП ИСПОЛНИТЕЛЯ К ОЧЕРЕДИ                                       */
/* ------------------------------------------------------------------ */

/*
 * Исполнитель ходит в базу через тот же HTTP-интерфейс, что и приложение, а
 * тот показывает наружу только схему `public`. Вся кухня очереди живёт в
 * `app` — и правильно живёт: показывать её клиенту незачем. Значит, нужны
 * тонкие обёртки: имя в `public`, тело в `app`, право вызвать — только у
 * служебной роли.
 *
 * Без них исполнитель не работал вовсе: каждый вызов возвращал «функция не
 * найдена». Обнаружиться это могло лишь на живом задании, а живых заданий до
 * сих пор не было — модель не подключена.
 */

create or replace function public.claim_job(worker text)
returns public.ai_jobs
language plpgsql
security definer
set search_path = app, public, pg_temp
as $$
declare
  job public.ai_jobs;
begin
  job := app.claim_job(worker);
  return job;
end;
$$;

create or replace function public.finish_job(
  job_id uuid,
  result jsonb,
  tokens_in integer default null,
  tokens_out integer default null,
  cost numeric default null
)
returns void
language sql
security definer
set search_path = app, public, pg_temp
as $$
  select app.finish_job(job_id, result, tokens_in, tokens_out, cost);
$$;

create or replace function public.fail_job(
  job_id uuid,
  reason text,
  max_attempts smallint default 3
)
returns void
language sql
security definer
set search_path = app, public, pg_temp
as $$
  select app.fail_job(job_id, reason, max_attempts);
$$;

create or replace function public.release_stale_jobs(
  older_than interval default interval '15 minutes'
)
returns integer
language sql
security definer
set search_path = app, public, pg_temp
as $$
  select app.release_stale_jobs(older_than);
$$;

create or replace function public.requeue_job(
  job_id uuid,
  progress_value smallint default null
)
returns void
language sql
security definer
set search_path = app, public, pg_temp
as $$
  select app.requeue_job(job_id, progress_value);
$$;

create or replace function public.record_job_spend(
  job_id uuid,
  tokens_in integer default null,
  tokens_out integer default null,
  cost numeric default null
)
returns void
language sql
security definer
set search_path = app, public, pg_temp
as $$
  select app.record_job_spend(job_id, tokens_in, tokens_out, cost);
$$;

create or replace function public.reuse_document_text(target_document uuid)
returns integer
language sql
security definer
set search_path = app, public, pg_temp
as $$
  select app.reuse_document_text(target_document);
$$;

create or replace function public.save_document_page(
  target_document uuid,
  page_number integer,
  page_text text,
  used_model text default null,
  page_confidence real default null,
  page_source text default null
)
returns void
language sql
security definer
set search_path = app, public, pg_temp
as $$
  select app.save_document_page(
    target_document, page_number, page_text, used_model, page_confidence, page_source
  );
$$;

/*
 * Право вызвать — только у служебной роли. Обычному пользователю эти функции
 * дали бы возможность объявить задание выполненным и подставить свой текст
 * вместо распознанного.
 */
do $$
declare
  signature text;
begin
  foreach signature in array array[
    'public.claim_job(text)',
    'public.finish_job(uuid, jsonb, integer, integer, numeric)',
    'public.fail_job(uuid, text, smallint)',
    'public.release_stale_jobs(interval)',
    'public.requeue_job(uuid, smallint)',
    'public.record_job_spend(uuid, integer, integer, numeric)',
    'public.reuse_document_text(uuid)',
    'public.save_document_page(uuid, integer, text, text, real, text)'
  ] loop
    execute format('revoke execute on function %s from public, anon, authenticated', signature);
    execute format('grant execute on function %s to service_role', signature);
  end loop;
end;
$$;

/*
 * Заодно закрываем чтение текста для неаутентифицированных. Строки всё равно
 * закрыты политиками, но право звать функцию у роли `anon` осталось от
 * умолчания Postgres, а не от чьего-то решения.
 */
revoke execute on function public.document_text(uuid, integer, integer) from public, anon;
