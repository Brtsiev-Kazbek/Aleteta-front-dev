-- Права на исполнение функций и фиксация search_path.
--
-- Postgres по умолчанию раздаёт право `execute` роли `public`, то есть всем,
-- включая анонимного посетителя. На функциях админ-панели это не приводило к
-- утечке — каждая первым делом проверяет `app.is_platform_admin()` и без прав
-- падает с исключением, — но полагаться на проверку внутри там, где можно
-- просто не пускать, неправильно: следующая функция может оказаться без такой
-- проверки, и заметить это будет некому.
--
-- Вторая половина файла закрывает предупреждение линтера о «подвижном»
-- search_path. Функция без фиксированного пути ищет таблицы по списку схем
-- вызывающего, и тот, кто умеет создавать схемы, может подсунуть свою таблицу
-- вместо ожидаемой. Все обращения внутри и так написаны с указанием схемы,
-- поэтому фиксация ничего не меняет в поведении.

/* ------------------------------------------------------------------ */
/*  ФУНКЦИИ АДМИН-ПАНЕЛИ                                               */
/* ------------------------------------------------------------------ */

revoke execute on function public.platform_overview() from public, anon;
revoke execute on function public.platform_workspaces(text, integer, integer) from public, anon;
revoke execute on function public.platform_signups(integer) from public, anon;

-- Вошедшему право оставляем: администратор — это тоже `authenticated`,
-- а остальных отсекает проверка внутри функции.
grant execute on function public.platform_overview() to authenticated;
grant execute on function public.platform_workspaces(text, integer, integer) to authenticated;
grant execute on function public.platform_signups(integer) to authenticated;

-- Поиск по делу вызывает вошедший; анонимному он ни к чему.
revoke execute on function public.search_case_chunks(uuid, text, extensions.vector, integer)
  from public, anon;
grant execute on function public.search_case_chunks(uuid, text, extensions.vector, integer)
  to authenticated;

/* ------------------------------------------------------------------ */
/*  ФИКСИРОВАННЫЙ ПУТЬ ПОИСКА                                          */
/* ------------------------------------------------------------------ */

alter function app.current_user_id() set search_path = public, pg_temp;
alter function app.can_write(uuid) set search_path = public, pg_temp;
alter function app.touch_updated_at() set search_path = public, pg_temp;
alter function app.protect_last_owner() set search_path = public, pg_temp;
alter function app.validate_entity(jsonb, jsonb) set search_path = public, pg_temp;
alter function app.storage_workspace(text) set search_path = public, pg_temp;
