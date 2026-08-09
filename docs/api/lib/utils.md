[aleteya](../index.md) / lib/utils

# lib/utils

## Functions

### cn()

```ts
function cn(...inputs): string
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| ...`inputs` | `ClassValue`[] |

#### Returns

`string`

#### Defined in

[lib/utils.ts:4](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/utils.ts#L4)

***

### formatFileSize()

```ts
function formatFileSize(bytes): string
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `bytes` | `number` |

#### Returns

`string`

#### Defined in

[lib/utils.ts:8](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/utils.ts#L8)

***

### formatDate()

```ts
function formatDate(iso): string
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `iso` | `string` |

#### Returns

`string`

#### Defined in

[lib/utils.ts:27](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/utils.ts#L27)

***

### formatDateTime()

```ts
function formatDateTime(iso): string
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `iso` | `string` |

#### Returns

`string`

#### Defined in

[lib/utils.ts:31](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/utils.ts#L31)

***

### plural()

```ts
function plural(
   count, 
   one, 
   few, 
   many): string
```

Склонение русских существительных: (1, "ошибка", "ошибки", "ошибок").

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `count` | `number` |
| `one` | `string` |
| `few` | `string` |
| `many` | `string` |

#### Returns

`string`

#### Defined in

[lib/utils.ts:36](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/utils.ts#L36)
