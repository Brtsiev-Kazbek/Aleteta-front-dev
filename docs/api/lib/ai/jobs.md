[aleteya](../../index.md) / lib/ai/jobs

# lib/ai/jobs

## Interfaces

### EnqueueResult

#### Properties

##### jobId

```ts
jobId: string;
```

###### Defined in

[lib/ai/jobs.ts:56](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/ai/jobs.ts#L56)

##### fromCache

```ts
fromCache: boolean;
```

Ответ нашёлся в журнале — задание уже готово, ждать нечего.

###### Defined in

[lib/ai/jobs.ts:58](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/ai/jobs.ts#L58)

## Functions

### fingerprint()

```ts
function fingerprint(
   task, 
   input, 
   model): string
```

Отпечаток входа: по нему повторный запрос берётся из журнала вместо нового
вызова модели.

В отпечаток входит не только сам вход, но и версия промпта с именем модели.
Иначе после правки промпта исполнитель отдал бы старый ответ, и правку
невозможно было бы проверить.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `task` | keyof [`TaskShapes`](types.md#taskshapes) |
| `input` | `unknown` |
| `model` | `string` |

#### Returns

`string`

#### Defined in

[lib/ai/jobs.ts:41](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/ai/jobs.ts#L41)

***

### enqueueJob()

```ts
function enqueueJob<T>(
   task, 
   input, 
context): Promise<EnqueueResult>
```

Ставит задание в очередь.

Возвращает управление сразу: считать будет исполнитель. Форма получает
идентификатор и опрашивает состояние, пока задание не закончится.

#### Type Parameters

| Type Parameter |
| ------ |
| `T` *extends* keyof [`TaskShapes`](types.md#taskshapes) |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `task` | `T` |
| `input` | [`TaskInput`](types.md#taskinputt)\<`T`\> |
| `context` | `object` |
| `context.caseId`? | `string` |
| `context.documentId`? | `string` |

#### Returns

`Promise`\<[`EnqueueResult`](jobs.md#enqueueresult)\>

#### Defined in

[lib/ai/jobs.ts:67](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/ai/jobs.ts#L67)

***

### readJob()

```ts
function readJob<T>(jobId): Promise<JobState<T> | null>
```

Состояние задания для опроса из формы.

Читается под правами пользователя: чужое задание просто не найдётся.

#### Type Parameters

| Type Parameter |
| ------ |
| `T` *extends* keyof [`TaskShapes`](types.md#taskshapes) |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `jobId` | `string` |

#### Returns

`Promise`\<[`JobState`](types.md#jobstatet)\<`T`\> \| `null`\>

#### Defined in

[lib/ai/jobs.ts:143](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/ai/jobs.ts#L143)

***

### recordCorrection()

```ts
function recordCorrection(jobId, correction): Promise<void>
```

Правка человека поверх ответа модели.

Самая ценная разметка, какая бывает: показывает, где именно модель ошиблась,
и достаётся бесплатно — человек всё равно исправляет ошибку, надо лишь
записать, что он исправил. Из этого потом собирается набор для сравнения
моделей.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `jobId` | `string` |
| `correction` | `unknown` |

#### Returns

`Promise`\<`void`\>

#### Defined in

[lib/ai/jobs.ts:175](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/ai/jobs.ts#L175)
