-- Предел попыток у зависших заданий.
--
-- ЧТО СЛУЧИЛОСЬ. `release_stale_jobs` возвращала в очередь любое задание,
-- пролежавшее в работе дольше пятнадцати минут, и делала это без счёта. Если
-- исполнитель падает на каждом заходе — а он падал, маршрутизатор отвергал
-- ключ, — получается вечный круг: взял, замолчал, вернули, взял. На боевом
-- проекте два задания намотали по семьдесят две попытки за девятнадцать часов,
-- и каждая попытка — это деньги и место в очереди перед живыми заданиями.
--
-- Предел ставится здесь, а не в исполнителе, ровно потому, что исполнитель до
-- этого места и не доживает: он молчит, а не отвечает отказом.
--
-- ПОЧЕМУ ПЯТЬ. Три мало: перевыкладка исполнителя и разовый обрыв сети дают две
-- потери подряд, и задание умерло бы на ровном месте. Десять — это уже десять
-- оплаченных заходов на заведомо сломанной настройке. Пять переживает случайное
-- и не переживает систематическое.

create or replace function app.release_stale_jobs(
  older_than interval default '00:15:00'::interval
)
returns integer
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $$
declare
  released integer;
  MAX_ATTEMPTS constant smallint := 5;
begin
  /*
   * Сначала хороним безнадёжные. Порядок важен: если сперва вернуть в очередь,
   * то в этом же вызове они уйдут на новый круг, и предел не сработает никогда.
   */
  update public.ai_jobs
     set status = 'failed',
         finished_at = now(),
         locked_at = null,
         locked_by = null,
         error = 'Исполнитель не ответил ' || attempts || ' раз подряд. ' ||
                 'Задание снято; проверьте выкладку и ключ исполнителя.'
   where status = 'running'
     and locked_at < now() - older_than
     and attempts >= MAX_ATTEMPTS;

  with back as (
    update public.ai_jobs
       set status = 'queued',
           locked_at = null,
           locked_by = null,
           error = 'Исполнитель не ответил, задание возвращено в очередь'
     where status = 'running'
       and locked_at < now() - older_than
       and attempts < MAX_ATTEMPTS
    returning 1
  )
  select count(*) into released from back;

  return released;
end;
$$;
