[aleteya](../../index.md) / lib/data/queries

# lib/data/queries

## Functions

### listCases()

```ts
function listCases(workspaceId): Promise<Case[]>
```

Чтение предметных данных.

Все запросы идут под правами вошедшего: политики доступа сами отсекают чужие
пространства, поэтому фильтр по workspace_id здесь — не защита, а способ
не тянуть лишнее, когда пространств у человека несколько.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `workspaceId` | `string` |

#### Returns

`Promise`\<[`Case`](../../types.md#case)[]\>

#### Defined in

[lib/data/queries.ts:20](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/data/queries.ts#L20)

***

### getCase()

```ts
function getCase(caseId): Promise<Case | null>
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `caseId` | `string` |

#### Returns

`Promise`\<[`Case`](../../types.md#case) \| `null`\>

#### Defined in

[lib/data/queries.ts:34](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/data/queries.ts#L34)

***

### listEntitySchemas()

```ts
function listEntitySchemas(workspaceId): Promise<EntitySchema[]>
```

Типы объектов: встроенные (workspace_id IS NULL) плюс созданные в этом
пространстве. Встроенные видны всем — поэтому условие через `or`.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `workspaceId` | `string` |

#### Returns

`Promise`\<[`EntitySchema`](../../types.md#entityschema)[]\>

#### Defined in

[lib/data/queries.ts:51](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/data/queries.ts#L51)

***

### listEntities()

```ts
function listEntities(workspaceId): Promise<Entity[]>
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `workspaceId` | `string` |

#### Returns

`Promise`\<[`Entity`](../../types.md#entity)[]\>

#### Defined in

[lib/data/queries.ts:68](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/data/queries.ts#L68)

***

### listCaseEntities()

```ts
function listCaseEntities(caseId): Promise<Entity[]>
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `caseId` | `string` |

#### Returns

`Promise`\<[`Entity`](../../types.md#entity)[]\>

#### Defined in

[lib/data/queries.ts:81](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/data/queries.ts#L81)

***

### listDocuments()

```ts
function listDocuments(workspaceId): Promise<Document[]>
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `workspaceId` | `string` |

#### Returns

`Promise`\<[`Document`](../../types.md#document)[]\>

#### Defined in

[lib/data/queries.ts:94](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/data/queries.ts#L94)
