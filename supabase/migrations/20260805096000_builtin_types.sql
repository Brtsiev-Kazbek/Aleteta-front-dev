-- Встроенные типы объектов.
--
-- Это не демонстрационные данные, а часть продукта: участок, контрагент и
-- физлицо нужны каждому пространству. Поэтому они приходят миграцией и
-- переживают сброс базы, в отличие от сидов.
--
-- Состав полей и регулярные выражения повторяют types/index.ts. Ключи полей
-- (`cadastralNumber`, `landUse`) оставлены в том же виде, в каком их пишет
-- фронт: они лежат в jsonb как есть, и переименование сломало бы стыковку.

insert into public.entity_types (workspace_id, key, label, hint, is_custom, fields, templates)
values
  (
    null,
    'real_estate',
    'Земельный участок',
    'Кадастровый номер, площадь, назначение земель',
    false,
    '[
      {
        "key": "name",
        "label": "Название",
        "required": true,
        "placeholder": "Земельный участок №12",
        "width": 280
      },
      {
        "key": "cadastralNumber",
        "label": "Кадастровый номер",
        "required": true,
        "placeholder": "15:09:0000000:0000",
        "width": 210,
        "pattern": "^[0-9]{2}:[0-9]{2}:[0-9]{6,7}:[0-9]{1,4}$",
        "patternError": "Неверный формат. Пример: 15:09:0000000:0000"
      },
      {
        "key": "area",
        "label": "Площадь",
        "required": true,
        "placeholder": "440 кв.м.",
        "width": 150,
        "pattern": "[0-9]",
        "patternError": "Площадь должна содержать число. Пример: 440 кв.м."
      },
      {
        "key": "owner",
        "label": "Правообладатель",
        "required": true,
        "placeholder": "Брциев К. Р.",
        "width": 220
      },
      {
        "key": "landUse",
        "label": "Назначение земель",
        "required": true,
        "placeholder": "Для индивидуального жилищного строительства",
        "width": 300
      }
    ]'::jsonb,
    array[
      'Договор купли-продажи земельного участка',
      'Акт приёма-передачи',
      'Заявление в Росреестр'
    ]
  ),
  (
    null,
    'legal_entity',
    'Контрагент (юрлицо)',
    'ИНН, КПП, адрес, директор',
    false,
    '[
      {
        "key": "name",
        "label": "Наименование",
        "required": true,
        "placeholder": "ООО «Альфа-Консалт»",
        "width": 280
      },
      {
        "key": "inn",
        "label": "ИНН",
        "required": true,
        "placeholder": "1513000000",
        "width": 170,
        "pattern": "^[0-9]{10}$",
        "patternError": "ИНН юрлица состоит из 10 цифр"
      },
      {
        "key": "kpp",
        "label": "КПП",
        "required": true,
        "placeholder": "151301001",
        "width": 170,
        "pattern": "^[0-9]{9}$",
        "patternError": "КПП состоит из 9 цифр"
      },
      {
        "key": "address",
        "label": "Адрес",
        "required": true,
        "placeholder": "г. Владикавказ, ул. Мира, д. 10",
        "width": 280
      },
      {
        "key": "director",
        "label": "Директор",
        "required": true,
        "placeholder": "Иванов И. И.",
        "width": 220
      }
    ]'::jsonb,
    array['Договор оказания услуг', 'Карточка контрагента']
  ),
  (
    null,
    'individual',
    'Правообладатель (физлицо)',
    'Паспорт, СНИЛС, адрес регистрации',
    false,
    '[
      {
        "key": "name",
        "label": "ФИО",
        "required": true,
        "placeholder": "Петров Сергей Сергеевич",
        "width": 280
      },
      {
        "key": "passport",
        "label": "Паспорт",
        "required": true,
        "placeholder": "90 12 345678",
        "width": 190,
        "pattern": "^[0-9]{2} [0-9]{2} [0-9]{6}$",
        "patternError": "Формат паспорта: 90 12 345678"
      },
      {
        "key": "snils",
        "label": "СНИЛС",
        "required": true,
        "placeholder": "123-456-789 00",
        "width": 190,
        "pattern": "^[0-9]{3}-[0-9]{3}-[0-9]{3} [0-9]{2}$",
        "patternError": "Формат СНИЛС: 123-456-789 00"
      },
      {
        "key": "registrationAddress",
        "label": "Адрес регистрации",
        "required": true,
        "placeholder": "г. Москва, ул. Тверская, д. 4",
        "width": 280
      }
    ]'::jsonb,
    array['Трудовой договор', 'Согласие на обработку персональных данных']
  )
on conflict do nothing;
