[aleteya](../../index.md) / lib/supabase/config

# lib/supabase/config

## Functions

### isSupabaseConfigured()

```ts
function isSupabaseConfigured(): boolean
```

Настроен ли Supabase.

Приложение должно открываться и без базы: демонстрационный стенд работает на
встроенных данных, и это не аварийный режим, а поддерживаемый. Проверка нужна
страницам, чтобы решить, идти ли в базу или показать демонстрационный набор.

#### Returns

`boolean`

#### Defined in

[lib/supabase/config.ts:8](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/supabase/config.ts#L8)
