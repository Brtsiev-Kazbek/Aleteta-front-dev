-- Хранилище файлов.
--
-- Раскладка путей: <workspace_id>/<case_id>/<uuid>-<имя файла>. Первый сегмент
-- — идентификатор пространства, и именно по нему работают политики: право на
-- файл выводится из членства, а не из отдельной таблицы разрешений.
--
-- Бакеты заводятся миграцией, а не кнопкой в панели: иначе при переезде на
-- self-hosted они просто не появятся, и приложение сломается на первой загрузке.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'case-documents',
    'case-documents',
    false,
    52428800, -- 50 МБ
    array[
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/tiff'
    ]
  ),
  (
    'avatars',
    'avatars',
    true,
    2097152, -- 2 МБ
    array['image/jpeg', 'image/png', 'image/webp']
  )
on conflict (id) do nothing;

/* ------------------------------------------------------------------ */
/*  ДОКУМЕНТЫ ДЕЛ                                                      */
/* ------------------------------------------------------------------ */

-- Первый сегмент пути — пространство. Приводим к uuid явно: путь приходит
-- строкой, и без приведения сравнение с идентификатором не сработает.
create or replace function app.storage_workspace(object_name text)
returns uuid
language sql
immutable
as $$
  select case
    when split_part(object_name, '/', 1) ~ '^[0-9a-f-]{36}$'
      then split_part(object_name, '/', 1)::uuid
    else null
  end
$$;

create policy "case documents readable by members"
  on storage.objects for select
  using (
    bucket_id = 'case-documents'
    and app.is_member(app.storage_workspace(name))
  );

create policy "case documents writable by members"
  on storage.objects for insert
  with check (
    bucket_id = 'case-documents'
    and app.can_write(app.storage_workspace(name))
  );

create policy "case documents updatable by members"
  on storage.objects for update
  using (
    bucket_id = 'case-documents'
    and app.can_write(app.storage_workspace(name))
  )
  with check (
    bucket_id = 'case-documents'
    and app.can_write(app.storage_workspace(name))
  );

create policy "case documents deletable by members"
  on storage.objects for delete
  using (
    bucket_id = 'case-documents'
    and app.can_write(app.storage_workspace(name))
  );

/* ------------------------------------------------------------------ */
/*  АВАТАРЫ                                                            */
/* ------------------------------------------------------------------ */

-- Бакет публичный на чтение, запись — только в свою папку <user_id>/…
create policy "avatars readable by anyone"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "avatars writable by owner"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and split_part(name, '/', 1) = app.current_user_id()::text
  );

create policy "avatars updatable by owner"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and split_part(name, '/', 1) = app.current_user_id()::text
  );

create policy "avatars deletable by owner"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and split_part(name, '/', 1) = app.current_user_id()::text
  );
