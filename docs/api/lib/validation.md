[aleteya](../index.md) / lib/validation

# lib/validation

## Interfaces

### EntityValidation

#### Properties

##### errors

```ts
errors: string[];
```

Человекочитаемые ошибки — попадают в Entity.validationErrors.

###### Defined in

[lib/validation.ts:10](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/validation.ts#L10)

##### fieldErrors

```ts
fieldErrors: Record<string, string>;
```

Ошибки по ключу поля — нужны гриду для красной подсветки ячейки.

###### Defined in

[lib/validation.ts:12](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/validation.ts#L12)

##### isValid

```ts
isValid: boolean;
```

###### Defined in

[lib/validation.ts:13](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/validation.ts#L13)

## Functions

### findSchema()

```ts
function findSchema(customSchemas, typeId): EntitySchema
```

Находит схему по идентификатору среди встроенных и пользовательских.
Если тип неизвестен (например, схему удалили), откатываемся к участку,
чтобы грид не падал на «осиротевшей» сущности.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `customSchemas` | [`EntitySchema`](../types.md#entityschema)[] |
| `typeId` | `string` |

#### Returns

[`EntitySchema`](../types.md#entityschema)

#### Defined in

[lib/validation.ts:21](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/validation.ts#L21)

***

### validateEntity()

```ts
function validateEntity(entity, schema): EntityValidation
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `entity` | [`Entity`](../types.md#entity) |
| `schema` | [`EntitySchema`](../types.md#entityschema) |

#### Returns

[`EntityValidation`](validation.md#entityvalidation)

#### Defined in

[lib/validation.ts:32](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/validation.ts#L32)

***

### withValidation()

```ts
function withValidation(entity, schema): Entity
```

Пересчитывает validationErrors, не мутируя исходный объект.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `entity` | [`Entity`](../types.md#entity) |
| `schema` | [`EntitySchema`](../types.md#entityschema) |

#### Returns

[`Entity`](../types.md#entity)

#### Defined in

[lib/validation.ts:63](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/validation.ts#L63)

***

### findFirstInvalidCell()

```ts
function findFirstInvalidCell(entities, customSchemas): {
  entityId: string;
  field: string;
 } | null
```

Первая невалидная ячейка — для кнопки «Исправить».

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `entities` | [`Entity`](../types.md#entity)[] |
| `customSchemas` | [`EntitySchema`](../types.md#entityschema)[] |

#### Returns

\{
  `entityId`: `string`;
  `field`: `string`;
 \} \| `null`

#### Defined in

[lib/validation.ts:68](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/validation.ts#L68)

***

### validateInn()

```ts
function validateInn(value): string | null
```

ИНН: 10 знаков у организации, 12 у предпринимателя. Проверяем и контрольные цифры.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `string` |

#### Returns

`string` \| `null`

#### Defined in

[lib/validation.ts:86](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/validation.ts#L86)
