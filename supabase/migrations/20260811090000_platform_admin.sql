-- Панель администратора установки: чтение и управление.
--
-- ПОЧЕМУ ФУНКЦИИ, А НЕ СЛУЖЕБНЫЙ КЛЮЧ. Первая версия раздела ходила в базу
-- служебным ключом, обходящим политики. Работало, но требовало держать ключ в
-- переменных площадки и означало: любая ошибка в коде страницы — это утечка
-- всех арендаторов сразу. Здесь наоборот: право проверяет база, в одном месте,
-- одинаково для всех вызовов, и приложению служебный ключ больше не нужен.
--
-- Каждая функция начинается с `app.is_platform_admin()`. Проверка внутри
-- `security definer` — единственный способ дать администратору видеть поверх
-- политик, не открывая при этом дверь всем.
--
-- ЧТО ИСПРАВЛЕНО ПО ДОРОГЕ. Прежние `platform_overview` и `platform_workspaces`
-- ссылались на `ai_jobs.cost_usd` — колонку, переименованную в `cost` ещё в
-- миграции про стоимость. То есть раздел упал бы на первом же открытии.

/* ------------------------------------------------------------------ */
/*  ЧТЕНИЕ                                                             */
/* ------------------------------------------------------------------ */

/*
 * Три функции из миграции 20260805094000 переписаны с другим набором колонок,
 * поэтому сначала снимаем прежние: Postgres не даёт менять тип возврата на
 * месте. `platform_signups` уходит совсем — ряд регистраций по дням поглощён
 * более общим `platform_spend_daily`, а держать два похожих отчёта, из которых
 * применяется один, значит однажды поправить не тот.
 */
drop function if exists public.platform_overview();
drop function if exists public.platform_workspaces(text, integer, integer);
drop function if exists public.platform_signups(integer);

create or replace function public.platform_overview()
returns table (
  users bigint,
  users_new_7d bigint,
  workspaces bigint,
  workspaces_archived bigint,
  cases bigint,
  documents bigint,
  entities bigint,
  pages bigint,
  storage_bytes numeric,
  jobs_30d bigint,
  cost_30d numeric,
  tokens_in_30d bigint,
  tokens_out_30d bigint,
  failure_rate real
)
language plpgsql
stable
security definer
set search_path to 'public', 'pg_temp'
as $$
begin
  if not app.is_platform_admin() then
    raise exception 'Доступно только администратору установки';
  end if;

  return query
  select
    (select count(*) from public.profiles),
    (select count(*) from public.profiles where created_at >= now() - interval '7 days'),
    (select count(*) from public.workspaces where archived_at is null),
    (select count(*) from public.workspaces where archived_at is not null),
    (select count(*) from public.cases where archived_at is null),
    (select count(*) from public.documents where deleted_at is null),
    (select count(*) from public.entities),
    (select count(*) from public.document_pages),
    (select coalesce(sum(size_bytes), 0)::numeric from public.documents where deleted_at is null),
    (select count(*) from public.ai_jobs where created_at >= now() - interval '30 days'),
    (select coalesce(sum(cost), 0)::numeric from public.ai_jobs where created_at >= now() - interval '30 days'),
    (select coalesce(sum(tokens_in), 0)::bigint from public.ai_jobs where created_at >= now() - interval '30 days'),
    (select coalesce(sum(tokens_out), 0)::bigint from public.ai_jobs where created_at >= now() - interval '30 days'),
    (
      select case
        when count(*) = 0 then 0::real
        else (count(*) filter (where status = 'failed'))::real / count(*)::real
      end
      from public.ai_jobs
      where created_at >= now() - interval '30 days'
    );
end;
$$;

comment on function public.platform_overview() is
  'Сводка по установке целиком. Только для администратора установки.';

/* Очередь по состояниям — за всё время, а не за окно отчёта: задание,
   застрявшее два месяца назад, ровно то, ради чего сюда и заходят. */
create or replace function public.platform_queue()
returns table (status public.job_status, jobs bigint, oldest timestamptz)
language plpgsql
stable
security definer
set search_path to 'public', 'pg_temp'
as $$
begin
  if not app.is_platform_admin() then
    raise exception 'Доступно только администратору установки';
  end if;

  return query
  select j.status, count(*), min(j.created_at)
    from public.ai_jobs j
   group by j.status
   order by 2 desc;
end;
$$;

/* Расход по дням: ряд дат строится генератором, иначе дни без заданий
   пропадут и график соврёт — провал будет выглядеть как отсутствие разрыва. */
create or replace function public.platform_spend_daily(days integer default 30)
returns table (
  day date,
  jobs bigint,
  failed bigint,
  tokens_in bigint,
  tokens_out bigint,
  cost numeric
)
language plpgsql
stable
security definer
set search_path to 'public', 'pg_temp'
as $$
begin
  if not app.is_platform_admin() then
    raise exception 'Доступно только администратору установки';
  end if;

  return query
  select
    d::date,
    count(j.id),
    count(j.id) filter (where j.status = 'failed'),
    coalesce(sum(j.tokens_in), 0)::bigint,
    coalesce(sum(j.tokens_out), 0)::bigint,
    coalesce(sum(j.cost), 0)::numeric
  from generate_series(
         date_trunc('day', now()) - make_interval(days => greatest(days, 1) - 1),
         date_trunc('day', now()),
         interval '1 day'
       ) as d
  left join public.ai_jobs j
    on date_trunc('day', j.created_at) = d
  group by d
  order by d;
end;
$$;

create function public.platform_workspaces(
  search text default null,
  limit_count integer default 50,
  offset_count integer default 0
)
returns table (
  workspace_id uuid,
  name text,
  slug text,
  plan text,
  owner_email text,
  members bigint,
  cases bigint,
  documents bigint,
  storage_bytes numeric,
  cost_30d numeric,
  last_activity_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path to 'public', 'pg_temp'
as $$
begin
  if not app.is_platform_admin() then
    raise exception 'Доступно только администратору установки';
  end if;

  return query
  select
    w.id,
    w.name,
    w.slug,
    w.plan,
    (
      select p.email
        from public.workspace_members m
        join public.profiles p on p.id = m.user_id
       where m.workspace_id = w.id and m.role = 'owner'
       order by m.created_at
       limit 1
    ),
    (select count(*) from public.workspace_members m where m.workspace_id = w.id),
    (select count(*) from public.cases c where c.workspace_id = w.id and c.archived_at is null),
    (select count(*) from public.documents d where d.workspace_id = w.id and d.deleted_at is null),
    (select coalesce(sum(d.size_bytes), 0)::numeric from public.documents d where d.workspace_id = w.id and d.deleted_at is null),
    (
      select coalesce(sum(j.cost), 0)
        from public.ai_jobs j
       where j.workspace_id = w.id
         and j.created_at >= now() - interval '30 days'
    ),
    (select max(a.created_at) from public.activity a where a.workspace_id = w.id),
    w.archived_at,
    w.created_at
  from public.workspaces w
  where search is null
     or w.name ilike '%' || search || '%'
     or w.slug ilike '%' || search || '%'
  order by w.created_at desc
  limit greatest(coalesce(limit_count, 50), 1)
  offset greatest(coalesce(offset_count, 0), 0);
end;
$$;

create or replace function public.platform_users(
  search text default null,
  limit_count integer default 50,
  offset_count integer default 0
)
returns table (
  user_id uuid,
  email text,
  full_name text,
  job_title text,
  platform_role public.platform_role,
  workspaces bigint,
  owns bigint,
  last_activity_at timestamptz,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path to 'public', 'pg_temp'
as $$
begin
  if not app.is_platform_admin() then
    raise exception 'Доступно только администратору установки';
  end if;

  return query
  select
    p.id,
    p.email,
    p.full_name,
    p.job_title,
    p.platform_role,
    (select count(*) from public.workspace_members m where m.user_id = p.id),
    (select count(*) from public.workspace_members m where m.user_id = p.id and m.role = 'owner'),
    (select max(a.created_at) from public.activity a where a.actor_id = p.id),
    p.created_at
  from public.profiles p
  where search is null
     or p.email ilike '%' || search || '%'
     or coalesce(p.full_name, '') ilike '%' || search || '%'
  order by p.created_at desc
  limit greatest(coalesce(limit_count, 50), 1)
  offset greatest(coalesce(offset_count, 0), 0);
end;
$$;

create or replace function public.platform_jobs(
  status_filter public.job_status default null,
  task_filter public.ai_task default null,
  limit_count integer default 50,
  offset_count integer default 0
)
returns table (
  job_id uuid,
  task public.ai_task,
  status public.job_status,
  workspace_id uuid,
  workspace_name text,
  actor_email text,
  model text,
  attempts smallint,
  progress smallint,
  tokens_in integer,
  tokens_out integer,
  cost numeric,
  error text,
  created_at timestamptz,
  started_at timestamptz,
  finished_at timestamptz
)
language plpgsql
stable
security definer
set search_path to 'public', 'pg_temp'
as $$
begin
  if not app.is_platform_admin() then
    raise exception 'Доступно только администратору установки';
  end if;

  return query
  select
    j.id,
    j.task,
    j.status,
    j.workspace_id,
    w.name,
    p.email,
    j.model,
    j.attempts,
    j.progress,
    j.tokens_in,
    j.tokens_out,
    j.cost,
    j.error,
    j.created_at,
    j.started_at,
    j.finished_at
  from public.ai_jobs j
  left join public.workspaces w on w.id = j.workspace_id
  left join public.profiles p on p.id = j.created_by
  where (status_filter is null or j.status = status_filter)
    and (task_filter is null or j.task = task_filter)
  order by j.created_at desc
  limit greatest(coalesce(limit_count, 50), 1)
  offset greatest(coalesce(offset_count, 0), 0);
end;
$$;

/* ------------------------------------------------------------------ */
/*  УПРАВЛЕНИЕ                                                         */
/* ------------------------------------------------------------------ */

/*
 * Роль установки.
 *
 * Две защиты, и обе от одной и той же ошибки — остаться без администраторов.
 * Первая: нельзя снять роль с себя (самый частый способ запереть себя снаружи).
 * Вторая: нельзя снять роль с последнего администратора, даже чужими руками.
 * Восстановить потом можно будет только руками в базе.
 */
create or replace function public.platform_set_role(
  target_user uuid,
  new_role public.platform_role
)
returns void
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $$
declare
  admins integer;
begin
  if not app.is_platform_admin() then
    raise exception 'Доступно только администратору установки';
  end if;

  if target_user = app.current_user_id() and new_role <> 'admin' then
    raise exception 'Нельзя снять права администратора с себя';
  end if;

  if new_role <> 'admin' then
    select count(*) into admins from public.profiles where platform_role = 'admin';
    if admins <= 1 then
      raise exception 'Это последний администратор установки — снять роль нельзя';
    end if;
  end if;

  update public.profiles set platform_role = new_role where id = target_user;

  if not found then
    raise exception 'Пользователь не найден';
  end if;
end;
$$;

create or replace function public.platform_set_plan(
  target_workspace uuid,
  new_plan text
)
returns void
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $$
begin
  if not app.is_platform_admin() then
    raise exception 'Доступно только администратору установки';
  end if;

  if new_plan not in ('free', 'pro', 'team') then
    raise exception 'Неизвестный тариф: %', new_plan;
  end if;

  update public.workspaces set plan = new_plan where id = target_workspace;

  if not found then
    raise exception 'Пространство не найдено';
  end if;
end;
$$;

/*
 * Архив пространства — мягкое отключение, а не удаление. Данные остаются на
 * месте: администратор установки не должен иметь кнопки, стирающей чужую
 * работу одним нажатием.
 */
create or replace function public.platform_set_workspace_archived(
  target_workspace uuid,
  archived boolean
)
returns void
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $$
begin
  if not app.is_platform_admin() then
    raise exception 'Доступно только администратору установки';
  end if;

  update public.workspaces
     set archived_at = case when archived then now() else null end
   where id = target_workspace;

  if not found then
    raise exception 'Пространство не найдено';
  end if;
end;
$$;

/*
 * Перезапуск задания.
 *
 * Счётчик попыток сбрасывается намеренно: администратор перезапускает то, что
 * упало по внешней причине — не выложен исполнитель, кончился ключ, отвалился
 * маршрутизатор. Оставить старые попытки значило бы, что задание умрёт снова
 * через одну, не дойдя до работы.
 */
create or replace function public.platform_requeue_job(target_job uuid)
returns void
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $$
begin
  if not app.is_platform_admin() then
    raise exception 'Доступно только администратору установки';
  end if;

  perform set_config('app.job_admin', 'on', true);

  update public.ai_jobs
     set status = 'queued',
         progress = 0,
         attempts = 0,
         error = null,
         locked_at = null,
         locked_by = null,
         next_retry_at = null,
         started_at = null,
         finished_at = null
   where id = target_job;

  if not found then
    raise exception 'Задание не найдено';
  end if;
end;
$$;

create or replace function public.platform_cancel_job(target_job uuid)
returns void
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $$
begin
  if not app.is_platform_admin() then
    raise exception 'Доступно только администратору установки';
  end if;

  perform set_config('app.job_admin', 'on', true);

  update public.ai_jobs
     set status = 'cancelled',
         finished_at = now(),
         locked_at = null,
         locked_by = null
   where id = target_job
     and status in ('queued', 'running');

  if not found then
    raise exception 'Отменить можно только задание в очереди или в работе';
  end if;
end;
$$;

/*
 * Массовый перезапуск всех упавших. Отдельной функцией, а не циклом на
 * стороне приложения: четырнадцать упавших заданий — это четырнадцать
 * запросов и четырнадцать шансов оборваться на середине.
 */
create or replace function public.platform_requeue_failed(
  task_filter public.ai_task default null
)
returns integer
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $$
declare
  touched integer;
begin
  if not app.is_platform_admin() then
    raise exception 'Доступно только администратору установки';
  end if;

  perform set_config('app.job_admin', 'on', true);

  update public.ai_jobs
     set status = 'queued',
         progress = 0,
         attempts = 0,
         error = null,
         locked_at = null,
         locked_by = null,
         next_retry_at = null,
         started_at = null,
         finished_at = null
   where status = 'failed'
     and (task_filter is null or task = task_filter);

  get diagnostics touched = row_count;
  return touched;
end;
$$;

/* ------------------------------------------------------------------ */

grant execute on function public.platform_overview() to authenticated;
grant execute on function public.platform_queue() to authenticated;
grant execute on function public.platform_spend_daily(integer) to authenticated;
grant execute on function public.platform_workspaces(text, integer, integer) to authenticated;
grant execute on function public.platform_users(text, integer, integer) to authenticated;
grant execute on function public.platform_jobs(public.job_status, public.ai_task, integer, integer) to authenticated;
grant execute on function public.platform_set_role(uuid, public.platform_role) to authenticated;
grant execute on function public.platform_set_plan(uuid, text) to authenticated;
grant execute on function public.platform_set_workspace_archived(uuid, boolean) to authenticated;
grant execute on function public.platform_requeue_job(uuid) to authenticated;
grant execute on function public.platform_cancel_job(uuid) to authenticated;
grant execute on function public.platform_requeue_failed(public.ai_task) to authenticated;

/* ------------------------------------------------------------------ */
/*  ПОМЕТКА ДЛЯ СТОРОЖА ЗАДАНИЙ                                        */
/* ------------------------------------------------------------------ */

/*
 * `app.protect_job_fields` запрещает вошедшему менять в задании что-либо кроме
 * `correction`: состояние, стоимость и результат пишет только исполнитель со
 * служебным ключом. Правило верное — без него любой пользователь объявил бы
 * своё задание выполненным, — но оно же закрывает и администратора установки,
 * которому перезапуск упавшего нужен по работе.
 *
 * Открывать сторожа по признаку «администратор установки» нельзя: тогда тот же
 * администратор смог бы править задания напрямую из браузера, минуя функции с
 * их проверками. Вместо этого функции ниже поднимают отметку в текущей
 * транзакции, и сторож пропускает изменение только при ней.
 *
 * Поставить отметку снаружи невозможно: `set_config` живёт в `pg_catalog`,
 * наружу через API не выставлен, а сами функции спрашивают право первым делом.
 */
create or replace function app.protect_job_fields()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $$
declare
  claims text := current_setting('request.jwt.claims', true);
  actor text := '';
begin
  if claims is not null and claims <> '' then
    actor := coalesce(claims::jsonb ->> 'role', '');
  end if;

  if actor = '' or actor = 'service_role' then
    return new;
  end if;

  -- Отметку ставит только `platform_*`, и только проверив право.
  if coalesce(current_setting('app.job_admin', true), '') = 'on' then
    return new;
  end if;

  if new.status is distinct from old.status
     or new.output is distinct from old.output
     or new.cost is distinct from old.cost
     or new.tokens_in is distinct from old.tokens_in
     or new.tokens_out is distinct from old.tokens_out
     or new.model is distinct from old.model then
    raise exception 'В задании можно менять только correction';
  end if;

  return new;
end;
$$;
