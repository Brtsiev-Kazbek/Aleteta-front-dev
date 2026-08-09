[aleteya](../../index.md) / lib/ai/config

# lib/ai/config

## Type Aliases

### ModelTier

```ts
type ModelTier: "fast" | "smart" | "vision" | "embedding";
```

Класс модели под задачу. Дешёвая — на механику, сильная — на рассуждение.

#### Defined in

[lib/ai/config.ts:16](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/ai/config.ts#L16)

***

### LlmMode

```ts
type LlmMode: "replay" | "live";
```

Как работать с моделью.

`replay` — ответы берутся из журнала `ai_jobs` по отпечатку входа, обращений
к модели нет вообще. Режим разработки: сто перезапусков стоят ноль.
`live` — обычные вызовы.

#### Defined in

[lib/ai/config.ts:25](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/ai/config.ts#L25)

## Variables

### EMBEDDING\_DIMENSIONS

```ts
const EMBEDDING_DIMENSIONS: 1024 = 1024;
```

Размерность вектора эмбеддингов.

Привязана к колонке `document_chunks.embedding` — 1024 у bge-m3 и
совместимых. Смена модели эмбеддингов потребует миграции и переиндексации
всех фрагментов, поэтому число вынесено сюда: видно, что оно не произвольное.

#### Defined in

[lib/ai/config.ts:64](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/ai/config.ts#L64)

## Functions

### getLlmMode()

```ts
function getLlmMode(): LlmMode
```

#### Returns

[`LlmMode`](config.md#llmmode)

#### Defined in

[lib/ai/config.ts:27](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/ai/config.ts#L27)

***

### getModel()

```ts
function getModel(tier): string
```

Имя модели под класс задачи.

Возвращает пустую строку, если переменная не задана: приложение обязано
открываться и без настроенной модели — демонстрационный стенд работает на
встроенных данных. Проверка «а настроено ли» делается там, где ставится
задание, и превращается в понятный отказ, а не в падение при импорте.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `tier` | [`ModelTier`](config.md#modeltier) |

#### Returns

`string`

#### Defined in

[lib/ai/config.ts:39](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/ai/config.ts#L39)

***

### isLlmConfigured()

```ts
function isLlmConfigured(): boolean
```

Настроена ли работа с моделью. Без этого задания ставить бессмысленно.

#### Returns

`boolean`

#### Defined in

[lib/ai/config.ts:53](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/ai/config.ts#L53)
