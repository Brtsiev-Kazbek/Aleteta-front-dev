[aleteya](../../index.md) / app/actions/documents

# app/actions/documents

## Interfaces

### UploadTarget

#### Properties

##### bucket

```ts
bucket: string;
```

###### Defined in

[app/actions/documents.ts:54](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/app/actions/documents.ts#L54)

##### path

```ts
path: string;
```

###### Defined in

[app/actions/documents.ts:55](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/app/actions/documents.ts#L55)

***

### RegisterDocumentInput

#### Properties

##### caseId

```ts
caseId: string;
```

###### Defined in

[app/actions/documents.ts:89](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/app/actions/documents.ts#L89)

##### title

```ts
title: string;
```

###### Defined in

[app/actions/documents.ts:90](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/app/actions/documents.ts#L90)

##### kind?

```ts
optional kind: string;
```

Человеческое описание вида: «Выписка ЕГРН», «Скан».

###### Defined in

[app/actions/documents.ts:92](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/app/actions/documents.ts#L92)

##### path

```ts
path: string;
```

Путь, выданный `prepareDocumentUploadAction`.

###### Defined in

[app/actions/documents.ts:94](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/app/actions/documents.ts#L94)

##### mimeType?

```ts
optional mimeType: string;
```

###### Defined in

[app/actions/documents.ts:95](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/app/actions/documents.ts#L95)

##### sizeBytes?

```ts
optional sizeBytes: number;
```

###### Defined in

[app/actions/documents.ts:96](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/app/actions/documents.ts#L96)

## Functions

### prepareDocumentUploadAction()

```ts
function prepareDocumentUploadAction(caseId, fileName): Promise<ActionResult<UploadTarget>>
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `caseId` | `string` |
| `fileName` | `string` |

#### Returns

`Promise`\<[`ActionResult`](../../lib/actions/result.md#actionresultt)\<[`UploadTarget`](documents.md#uploadtarget)\>\>

#### Defined in

[app/actions/documents.ts:58](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/app/actions/documents.ts#L58)

***

### registerDocumentAction()

```ts
function registerDocumentAction(input): Promise<ActionResult<Document>>
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | [`RegisterDocumentInput`](documents.md#registerdocumentinput) |

#### Returns

`Promise`\<[`ActionResult`](../../lib/actions/result.md#actionresultt)\<[`Document`](../../types.md#document)\>\>

#### Defined in

[app/actions/documents.ts:99](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/app/actions/documents.ts#L99)

***

### deleteDocumentAction()

```ts
function deleteDocumentAction(documentId): Promise<ActionResult<null>>
```

Удаление документа: строка помечается удалённой, файл убирается из бакета.

Строку оставляем ради истории и статистики, файл — нет: он занимает место и
содержит персональные данные, которых после удаления храниться не должно.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `documentId` | `string` |

#### Returns

`Promise`\<[`ActionResult`](../../lib/actions/result.md#actionresultt)\<`null`\>\>

#### Defined in

[app/actions/documents.ts:163](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/app/actions/documents.ts#L163)

***

### createDocumentUrlAction()

```ts
function createDocumentUrlAction(documentId): Promise<ActionResult<string>>
```

Ссылка на скачивание.

Бакет закрытый, постоянного адреса у файла нет — выдаём временную ссылку.
Час: этого хватает открыть файл и переслать коллеге, но недостаточно, чтобы
ссылка жила в переписке месяцами.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `documentId` | `string` |

#### Returns

`Promise`\<[`ActionResult`](../../lib/actions/result.md#actionresultt)\<`string`\>\>

#### Defined in

[app/actions/documents.ts:208](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/app/actions/documents.ts#L208)
