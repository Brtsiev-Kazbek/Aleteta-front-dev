-- Демонстрационные данные для локальной разработки.
--
-- Ровно те же три дела и объекты, что лежат сейчас во фронте в
-- data/mock-data.ts. Это сделано намеренно: когда интерфейс переключится с
-- моков на базу, он должен выглядеть точно так же. Любое расхождение —
-- ошибка в API, и её видно сразу, а не через неделю.
--
-- Все паспорта, СНИЛС и ИНН здесь выдуманные. Настоящих персональных данных
-- в проекте нет и на облачном хостинге быть не должно.
--
-- Файл выполняется при `supabase db reset` и в продакшене не применяется.

/* ------------------------------------------------------------------ */
/*  ПОЛЬЗОВАТЕЛЬ                                                       */
/* ------------------------------------------------------------------ */

-- Вход: demo@aleteya.local / demo1234
-- Профиль и личное пространство создаст триггер app.handle_new_user().
insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values (
  '00000000-0000-0000-0000-000000000000',
  '11111111-1111-1111-1111-111111111111',
  'authenticated',
  'authenticated',
  'demo@aleteya.local',
  extensions.crypt('demo1234', extensions.gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Казбек Б."}'::jsonb,
  now(),
  now()
)
on conflict (id) do nothing;

/*
 * Идентификатор пространства не задаётся руками: его выдал триггер при
 * регистрации, и переписать первичный ключ нельзя — на него уже ссылается
 * запись участника. Поэтому берём выданный и подставляем в остальные вставки.
 */
do $seed$
declare
  demo_user constant uuid := '11111111-1111-1111-1111-111111111111';
  ws uuid;
  case_land uuid;
  case_city uuid;
  case_edu uuid;
  type_real_estate uuid;
  type_legal_entity uuid;
  type_individual uuid;
begin
  select id into ws
    from public.workspaces
   where created_by = demo_user
   order by created_at
   limit 1;

  if ws is null then
    raise notice 'Демо-пользователь не создан, сиды пропущены';
    return;
  end if;

  update public.profiles
     set job_title = 'Юрист-партнёр',
         platform_role = 'admin'
   where id = demo_user;

  update public.workspaces
     set name = 'Алетейя Лигал',
         slug = 'aleteya-legal',
         legal_name = 'ООО «Алетейя Лигал»',
         inn = '1513000000',
         address = 'г. Владикавказ, ул. Мира, д. 10'
   where id = ws;

  select id into type_real_estate
    from public.entity_types where key = 'real_estate' and workspace_id is null;
  select id into type_legal_entity
    from public.entity_types where key = 'legal_entity' and workspace_id is null;
  select id into type_individual
    from public.entity_types where key = 'individual' and workspace_id is null;

  /* ---------------------------------------------------------------- */
  /*  ДЕЛА                                                             */
  /* ---------------------------------------------------------------- */

  insert into public.cases (workspace_id, title, status, tags, description, created_by, created_at)
  values (
    ws,
    'Оценка и межевание земельного участка (440 кв.м., г. Владикавказ)',
    'in_progress',
    array['Недвижимость', 'Межевание', 'Росреестр'],
    'Подготовка пакета документов для постановки участка на кадастровый учёт и последующей сделки купли-продажи.',
    demo_user,
    '2026-07-28T09:00:00Z'
  )
  returning id into case_land;

  insert into public.cases (workspace_id, title, status, tags, description, created_by, created_at)
  values (
    ws,
    'Проект: Формирование комфортной городской среды (г. Владикавказ)',
    'collecting',
    array['Муниципальный контракт', 'Благоустройство'],
    'Сбор и проверка документации подрядчиков по муниципальной программе благоустройства дворовых территорий.',
    demo_user,
    '2026-07-15T11:30:00Z'
  )
  returning id into case_city;

  insert into public.cases (workspace_id, title, status, tags, description, created_by, created_at)
  values (
    ws,
    'Кафедра публично-правовых дисциплин: Проверка курсовых работ',
    'active',
    array['Образование', 'Проверка', 'Антиплагиат'],
    'Массовая проверка курсовых работ студентов на соответствие методическим требованиям кафедры.',
    demo_user,
    '2026-06-02T08:15:00Z'
  )
  returning id into case_edu;

  /* ---------------------------------------------------------------- */
  /*  ОБЪЕКТЫ                                                          */
  /* ---------------------------------------------------------------- */

  -- У второго участка намеренно пустое «Назначение земель»: на нём видно
  -- красную подсветку ячейки и счётчик «готово 1 из 2». Ошибку проставит
  -- триггер валидации — вручную её тут писать не нужно.
  insert into public.entities (workspace_id, case_id, type_id, data, created_by)
  values
    (ws, case_land, type_real_estate, '{
      "name": "Земельный участок №12",
      "cadastralNumber": "15:09:0000000:0000",
      "area": "440 кв.м.",
      "owner": "Брциев К. Р.",
      "landUse": "Для индивидуального жилищного строительства"
    }'::jsonb, demo_user),
    (ws, case_land, type_real_estate, '{
      "name": "Земельный участок №14",
      "cadastralNumber": "15:09:0000000:0001",
      "area": "612 кв.м.",
      "owner": "Брциев К. Р.",
      "landUse": ""
    }'::jsonb, demo_user),
    (ws, case_city, type_legal_entity, '{
      "name": "ООО «Альфа-Консалт»",
      "inn": "1513000000",
      "kpp": "151301001",
      "address": "г. Владикавказ, ул. Мира, д. 10",
      "director": "Иванов И. И."
    }'::jsonb, demo_user),
    (ws, case_edu, type_individual, '{
      "name": "Петров Сергей Сергеевич",
      "passport": "90 12 345678",
      "snils": "123-456-789 00",
      "registrationAddress": "г. Москва, ул. Тверская, д. 4"
    }'::jsonb, demo_user);

  /* ---------------------------------------------------------------- */
  /*  ДОКУМЕНТЫ                                                        */
  /* ---------------------------------------------------------------- */

  -- Записи без файлов в хранилище: карточки в списке видно, скачивание вернёт
  -- ошибку. Для проверки интерфейса этого достаточно, настоящие файлы кладём
  -- через загрузку.
  insert into public.documents (workspace_id, case_id, title, kind, status, source, created_by, created_at)
  values
    (ws, case_land, 'Выписка_ЕГРН_440квм.pdf', 'Выписка ЕГРН', 'ready', 'upload', demo_user, '2026-07-28T09:14:00Z'),
    (ws, case_land, 'Договор купли-продажи (черновик).docx', 'Договор', 'draft', 'template', demo_user, '2026-07-30T13:20:00Z'),
    (ws, case_land, 'Межевой план.pdf', 'Межевой план', 'signed', 'upload', demo_user, '2026-08-01T10:05:00Z'),
    (ws, case_city, 'Техническое_задание_КГС.pdf', 'Техническое задание', 'ready', 'upload', demo_user, '2026-07-15T12:00:00Z'),
    (ws, case_edu, 'Методические_указания_2026.pdf', 'Методические указания', 'ready', 'upload', demo_user, '2026-06-02T08:30:00Z');

  /* ---------------------------------------------------------------- */
  /*  ЛЕНТА АКТИВНОСТИ                                                 */
  /* ---------------------------------------------------------------- */

  insert into public.activity (workspace_id, case_id, kind, text, actor_id, created_at)
  values
    (ws, case_land, 'ai', 'Ассистент распознал реквизиты в выписке ЕГРН', demo_user, '2026-08-01T15:46:00Z'),
    (ws, case_land, 'upload', 'Загружен файл «Межевой план.pdf»', demo_user, '2026-08-01T15:45:00Z'),
    (ws, case_land, 'edit', 'Изменено назначение земель у участка №12', demo_user, '2026-07-30T13:22:00Z'),
    (ws, case_land, 'create', 'Дело создано', demo_user, '2026-07-28T09:00:00Z'),
    (ws, case_city, 'upload', 'Загружено техническое задание', demo_user, '2026-07-15T12:00:00Z'),
    (ws, case_city, 'create', 'Дело создано', demo_user, '2026-07-15T11:30:00Z'),
    (ws, case_edu, 'create', 'Дело создано', demo_user, '2026-06-02T08:15:00Z');

  /* ---------------------------------------------------------------- */
  /*  ПЕРВОЕ СООБЩЕНИЕ АССИСТЕНТА                                      */
  /* ---------------------------------------------------------------- */

  insert into public.chat_messages (workspace_id, case_id, role, text)
  select ws, c.id, 'assistant',
         'Я прочитал файлы дела и вижу его объекты. Могу найти формулировку по всем документам, заполнить пустые реквизиты из загруженных файлов или разобрать договор по пунктам. На каждый ответ покажу источник — документ, пункт и страницу.'
    from public.cases c
   where c.workspace_id = ws;
end;
$seed$;

/* ------------------------------------------------------------------ */
/*  СУДЕБНАЯ ПРАКТИКА                                                  */
/* ------------------------------------------------------------------ */

-- Практика не принадлежит пространству, поэтому вне блока выше.
-- Источник помечен явно: при подключении лицензированного поставщика
-- эти записи отличаются от настоящих одним полем.
insert into public.court_practice (source, court, number, year, holding, side)
values
  ('demo', 'Верховный Суд РФ', '305-ЭС21-11556', '2021', 'Общая отсылка к закону не заменяет согласованный размер неустойки: взыскание возможно только по ст. 395 ГК РФ по ключевой ставке.', 'against'),
  ('demo', 'АС Северо-Кавказского округа', 'А61-4412/2022', '2022', 'Договорная неустойка, согласованная сторонами, взыскивается без доказывания размера убытков.', 'favor'),
  ('demo', 'Верховный Суд РФ', '307-ЭС20-2237', '2020', 'Отсутствие кадастрового номера при наличии иных идентифицирующих признаков не влечёт незаключённости договора.', 'favor'),
  ('demo', 'АС Московского округа', 'А40-118923/2021', '2021', 'Регистрация приостановлена: описание объекта не позволяло однозначно установить предмет сделки.', 'against');
