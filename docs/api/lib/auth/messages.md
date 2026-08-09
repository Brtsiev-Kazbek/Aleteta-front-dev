[aleteya](../../index.md) / lib/auth/messages

# lib/auth/messages

## Functions

### describeAuthError()

```ts
function describeAuthError(message): string
```

Человеческие формулировки вместо англоязычных сообщений Supabase.

Показывать пользователю «Invalid login credentials» — значит перекладывать на
него перевод. Сообщения службы аутентификации приходят строками, поэтому
разбираем их по подстрокам; неизвестное отдаём как есть, чтобы не потерять
подробность при разборе жалобы.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `message` | `string` |

#### Returns

`string`

#### Defined in

[lib/auth/messages.ts:9](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/auth/messages.ts#L9)

***

### describeCallbackError()

```ts
function describeCallbackError(code): string
```

Причины неудачного перехода по ссылке из письма — в понятных словах.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `code` | `string` |

#### Returns

`string`

#### Defined in

[lib/auth/messages.ts:50](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/auth/messages.ts#L50)
