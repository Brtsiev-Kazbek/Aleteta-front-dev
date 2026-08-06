-- Статистика.
--
-- Два уровня: показатели своего пространства видит любой участник, сводка по
-- всей установке — только администратор. Разделение сделано представлениями с
-- `security_invoker`, то есть политики доступа применяются к тому, кто
-- спрашивает, а не к владельцу представления. Без этого флага представление
-- обходит RLS и показало бы чужие данные.

/* ------------------------------------------------------------------ */
/*  ПОКАЗАТЕЛИ ПРОСТРАНСТВА                                            */
/* ------------------------------------------------------------------ */

create view public.workspace_stats
with (security_invoker = true)
as
select
  w.id as workspace_id,
  w.name,
  w.plan,
  (select count(*) from public.workspace_members m where m.workspace_id = w.id) as members,
  (select count(*) from public.cases c where c.workspace_id = w.id and c.archived_at is null) as cases,
  (select count(*) from public.entities e where e.workspace_id = w.id) as entities,
  (
    select count(*)
      from public.entities e
     where e.workspace_id = w.id
       and cardinality(e.validation_errors) = 0
  ) as entities_ready,
  (
    select count(*)
      from public.documents d
     where d.workspace_id = w.id and d.deleted_at is null
  ) as documents,
  (
    select coalesce(sum(d.size_bytes), 0)
      from public.documents d
     where d.workspace_id = w.id and d.deleted_at is null
  ) as storage_bytes,
  (
    select count(*)
      from public.entity_types t
     where t.workspace_id = w.id and t.archived_at is null
  ) as custom_types,
  (select count(*) from public.ai_jobs j where j.workspace_id = w.id) as ai_jobs,
  (
    select coalesce(sum(j.cost_usd), 0)
      from public.ai_jobs j
     where j.workspace_id = w.id
       and j.created_at >= date_trunc('month', now())
  ) as ai_cost_usd_month,
  w.created_at
from public.workspaces w;

comment on view public.workspace_stats is
  'Показатели пространства. Строки отфильтрованы политиками: видно только свои.';

/* ------------------------------------------------------------------ */
/*  РАСХОД НА МОДЕЛЬ ПО ДНЯМ                                           */
/* ------------------------------------------------------------------ */

/*
 * Разрез по задаче и модели — именно то, ради чего заводился журнал заданий:
 * видно, что после правки промпта расход по конкретной операции вырос втрое,
 * а не просто «стало дороже».
 */
create view public.ai_usage_daily
with (security_invoker = true)
as
select
  j.workspace_id,
  date_trunc('day', j.created_at)::date as day,
  j.task,
  j.provider,
  j.model,
  count(*) as runs,
  count(*) filter (where j.status = 'failed') as failed,
  count(*) filter (where j.correction is not null) as corrected,
  coalesce(sum(j.tokens_in), 0) as tokens_in,
  coalesce(sum(j.tokens_out), 0) as tokens_out,
  coalesce(sum(j.cost_usd), 0) as cost_usd,
  avg(extract(epoch from (j.finished_at - j.started_at)))
    filter (where j.finished_at is not null and j.started_at is not null) as avg_seconds
from public.ai_jobs j
group by 1, 2, 3, 4, 5;

comment on view public.ai_usage_daily is
  'Расход на модель по дням, задачам и моделям. Доля исправленных ответов — грубая метрика качества.';

/* ------------------------------------------------------------------ */
/*  СВОДКА ПО УСТАНОВКЕ                                                */
/* ------------------------------------------------------------------ */

/*
 * Функция, а не представление: проверка администратора здесь явная, и её
 * видно в одном месте, а не размазанной по условиям политик.
 */
create or replace function public.platform_overview()
returns table (
  users bigint,
  users_new_7d bigint,
  workspaces bigint,
  cases bigint,
  documents bigint,
  entities bigint,
  storage_bytes numeric,
  ai_jobs_30d bigint,
  ai_cost_usd_30d numeric,
  ai_failure_rate real
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
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
    (select count(*) from public.cases where archived_at is null),
    (select count(*) from public.documents where deleted_at is null),
    (select count(*) from public.entities),
    (select coalesce(sum(size_bytes), 0)::numeric from public.documents where deleted_at is null),
    (select count(*) from public.ai_jobs where created_at >= now() - interval '30 days'),
    (select coalesce(sum(cost_usd), 0)::numeric from public.ai_jobs where created_at >= now() - interval '30 days'),
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
  'Сводка по всей установке для админ-панели. Не администратору — исключение.';

/*
 * Список пространств для админ-панели: кто владелец, сколько людей и дел,
 * когда последняя активность.
 */
create or replace function public.platform_workspaces(
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
  ai_cost_usd_30d numeric,
  last_activity_at timestamptz,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
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
    (
      select coalesce(sum(j.cost_usd), 0)
        from public.ai_jobs j
       where j.workspace_id = w.id
         and j.created_at >= now() - interval '30 days'
    ),
    (select max(a.created_at) from public.activity a where a.workspace_id = w.id),
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

/*
 * Регистрации по дням: график роста в админ-панели.
 */
create or replace function public.platform_signups(days integer default 30)
returns table (day date, signups bigint)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if not app.is_platform_admin() then
    raise exception 'Доступно только администратору установки';
  end if;

  return query
  select d::date, count(p.id)
    from generate_series(
           date_trunc('day', now()) - make_interval(days => greatest(days, 1) - 1),
           date_trunc('day', now()),
           interval '1 day'
         ) as d
    left join public.profiles p
      on date_trunc('day', p.created_at) = d
   group by d
   order by d;
end;
$$;

grant execute on function public.platform_overview() to authenticated;
grant execute on function public.platform_workspaces(text, integer, integer) to authenticated;
grant execute on function public.platform_signups(integer) to authenticated;
grant select on public.workspace_stats, public.ai_usage_daily to authenticated;
