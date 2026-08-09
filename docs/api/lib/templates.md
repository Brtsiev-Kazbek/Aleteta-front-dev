[aleteya](../index.md) / lib/templates

# lib/templates

## Functions

### matchFreeformTemplate()

```ts
function matchFreeformTemplate(prompt): TemplateMatch
```

Ищет готовую форму под свободный запрос. Совпадения нет — это не ошибка:
документ в таком случае составляется с нуля, и пользователю об этом
сообщается прямо.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `prompt` | `string` |

#### Returns

[`TemplateMatch`](../types.md#templatematch)

#### Defined in

[lib/templates.ts:9](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/templates.ts#L9)
