-- Смерть задания переводит документ из работы в отказ.
--
-- ЧТО СЛУЧИЛОСЬ. Состояние документа (`documents.ocr_status`) пишет исполнитель:
-- взял задание — поставил `running`, закончил — `done`. Пока он жив, всё верно.
-- Но если его убивают на полпути — площадка сняла по пределу процессорного
-- времени, администратор отменил задание из панели, сторож зависших пометил
-- отказом, — писать оказывается некому, и документ остаётся в работе навсегда.
--
-- Для человека это худший из исходов: страница показывает «распознаётся, 0 из
-- 24» и будет показывать это вечно. Ошибка честнее вечного ожидания: с ошибкой
-- понятно, что делать.
--
-- ПОЧЕМУ ТРИГГЕР, А НЕ ПРАВКА В КАЖДОМ МЕСТЕ. Путей смерти задания четыре, и
-- они в разных слоях: обработчик в исполнителе, `release_stale_jobs`,
-- `platform_cancel_job`, ручная правка в базе. Держать в согласии четыре
-- одинаковые строки нельзя — однажды добавится пятый путь и про него забудут.
-- Триггер стоит на самой таблице и ловит все.

create or replace function app.sync_document_on_job_death()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $$
begin
  /* Интересует только переход в смерть и только у распознавания. */
  if new.task <> 'ocr' then
    return new;
  end if;

  if new.status not in ('failed', 'cancelled') then
    return new;
  end if;

  if old.status = new.status then
    return new;
  end if;

  if new.document_id is null then
    return new;
  end if;

  /*
   * Документ, успевший дочитаться, не трогаем: задание могло упасть на
   * последнем шаге — записи расхода, отметке о завершении, — а текст при этом
   * уже лежит в `document_pages` и полностью пригоден.
   */
  update public.documents
     set ocr_status = 'failed'
   where id = new.document_id
     and ocr_status in ('pending', 'running');

  return new;
end;
$$;

drop trigger if exists sync_document_on_job_death on public.ai_jobs;

create trigger sync_document_on_job_death
after update of status on public.ai_jobs
for each row
execute function app.sync_document_on_job_death();
