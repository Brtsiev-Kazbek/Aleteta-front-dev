[aleteya](../../index.md) / lib/data/mappers

# lib/data/mappers

## Functions

### toCase()

```ts
function toCase(row): Case
```

Перевод строк базы в типы интерфейса.

Схема специально повторяет форму фронта, поэтому перевод сводится к смене
стиля имён. Держим его в одном месте: когда появится ещё одно поле, менять
придётся здесь, а не в каждом компоненте.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `row` | [`CaseRow`](../../types/database.md#caserow) |

#### Returns

[`Case`](../../types.md#case)

#### Defined in

[lib/data/mappers.ts:17](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/data/mappers.ts#L17)

***

### toEntitySchema()

```ts
function toEntitySchema(row): EntitySchema
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `row` | [`EntityTypeRow`](../../types/database.md#entitytyperow) |

#### Returns

[`EntitySchema`](../../types.md#entityschema)

#### Defined in

[lib/data/mappers.ts:30](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/data/mappers.ts#L30)

***

### toEntity()

```ts
function toEntity(row): Entity
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `row` | [`EntityRow`](../../types/database.md#entityrow) |

#### Returns

[`Entity`](../../types.md#entity)

#### Defined in

[lib/data/mappers.ts:68](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/data/mappers.ts#L68)

***

### toDocument()

```ts
function toDocument(row): Document
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `row` | [`DocumentRow`](../../types/database.md#documentrow) |

#### Returns

[`Document`](../../types.md#document)

#### Defined in

[lib/data/mappers.ts:78](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/data/mappers.ts#L78)
