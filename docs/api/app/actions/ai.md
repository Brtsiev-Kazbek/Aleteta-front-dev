[aleteya](../../index.md) / app/actions/ai

# app/actions/ai

## Functions

### isAiAvailableAction()

```ts
function isAiAvailableAction(): Promise<boolean>
```

Настроена ли работа с моделью — интерфейс прячет кнопки, если нет.

#### Returns

`Promise`\<`boolean`\>

#### Defined in

[app/actions/ai.ts:23](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/app/actions/ai.ts#L23)

***

### extractFromDocumentAction()

```ts
function extractFromDocumentAction(input): Promise<ActionResult<{
  jobId: string;
  fromCache: boolean;
}>>
```

Разбор файла: реквизиты в карточку объекта.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | [`ExtractInput`](../../lib/ai/types.md#extractinput) |

#### Returns

`Promise`\<[`ActionResult`](../../lib/actions/result.md#actionresultt)\<\{
  `jobId`: `string`;
  `fromCache`: `boolean`;
 \}\>\>

#### Defined in

[app/actions/ai.ts:28](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/app/actions/ai.ts#L28)

***

### getJobStateAction()

```ts
function getJobStateAction<T>(jobId): Promise<ActionResult<JobState<T> | null>>
```

Состояние задания. Форма опрашивает его, пока работа идёт.

Опрос, а не подписка: заданий у человека единицы, а живое соединение стоит
дороже и рвётся на мобильной сети. Когда операций станет много, здесь
появится realtime — интерфейсу это изменение не видно.

#### Type Parameters

| Type Parameter |
| ------ |
| `T` *extends* keyof [`TaskShapes`](../../lib/ai/types.md#taskshapes) |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `jobId` | `string` |

#### Returns

`Promise`\<[`ActionResult`](../../lib/actions/result.md#actionresultt)\<[`JobState`](../../lib/ai/types.md#jobstatet)\<`T`\> \| `null`\>\>

#### Defined in

[app/actions/ai.ts:53](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/app/actions/ai.ts#L53)

***

### recordCorrectionAction()

```ts
function recordCorrectionAction(jobId, correction): Promise<ActionResult<null>>
```

Правка человека поверх ответа модели — она же разметка для обучения.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `jobId` | `string` |
| `correction` | `unknown` |

#### Returns

`Promise`\<[`ActionResult`](../../lib/actions/result.md#actionresultt)\<`null`\>\>

#### Defined in

[app/actions/ai.ts:64](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/app/actions/ai.ts#L64)
