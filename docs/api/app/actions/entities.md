[aleteya](../../index.md) / app/actions/entities

# app/actions/entities

## Functions

### addEntityAction()

```ts
function addEntityAction(caseId, typeId): Promise<ActionResult<Entity>>
```

Работа с объектами дела.

validation_errors на запись не передаём никогда: их считает триггер в базе.
Иначе клиент смог бы объявить объект валидным и обойти проверку реквизитов —
ту самую, ради которой продукт и существует.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `caseId` | `string` |
| `typeId` | `string` |

#### Returns

`Promise`\<[`ActionResult`](../../lib/actions/result.md#actionresultt)\<[`Entity`](../../types.md#entity)\>\>

#### Defined in

[app/actions/entities.ts:24](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/app/actions/entities.ts#L24)

***

### updateEntityDataAction()

```ts
function updateEntityDataAction(entityId, patch): Promise<ActionResult<Entity>>
```

Правка нескольких реквизитов разом.

Нужна там, где значения приходят пачкой: перенос распознанного из файла,
заполнение пустых полей моделью. Поштучные запросы в этом случае не просто
медленнее — между ними объект успевает побывать в наполовину заполненном
состоянии, и лента активности пишет по строке на каждое поле.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `entityId` | `string` |
| `patch` | `Record`\<`string`, `string`\> |

#### Returns

`Promise`\<[`ActionResult`](../../lib/actions/result.md#actionresultt)\<[`Entity`](../../types.md#entity)\>\>

#### Defined in

[app/actions/entities.ts:61](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/app/actions/entities.ts#L61)

***

### updateEntityFieldAction()

```ts
function updateEntityFieldAction(
   entityId, 
   field, 
value): Promise<ActionResult<Entity>>
```

Правка одной ячейки. Возвращает объект с пересчитанной валидацией.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `entityId` | `string` |
| `field` | `string` |
| `value` | `string` |

#### Returns

`Promise`\<[`ActionResult`](../../lib/actions/result.md#actionresultt)\<[`Entity`](../../types.md#entity)\>\>

#### Defined in

[app/actions/entities.ts:99](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/app/actions/entities.ts#L99)

***

### deleteEntityAction()

```ts
function deleteEntityAction(entityId): Promise<ActionResult<null>>
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `entityId` | `string` |

#### Returns

`Promise`\<[`ActionResult`](../../lib/actions/result.md#actionresultt)\<`null`\>\>

#### Defined in

[app/actions/entities.ts:133](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/app/actions/entities.ts#L133)

***

### duplicateEntityAction()

```ts
function duplicateEntityAction(entityId): Promise<ActionResult<Entity>>
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `entityId` | `string` |

#### Returns

`Promise`\<[`ActionResult`](../../lib/actions/result.md#actionresultt)\<[`Entity`](../../types.md#entity)\>\>

#### Defined in

[app/actions/entities.ts:156](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/app/actions/entities.ts#L156)

***

### createEntitySchemaAction()

```ts
function createEntitySchemaAction(label, fields): Promise<ActionResult<EntitySchema>>
```

Создание пользовательского типа объекта. Тип общий для пространства.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `label` | `string` |
| `fields` | \{ `label`: `string`; `required`: `boolean`; \}[] |

#### Returns

`Promise`\<[`ActionResult`](../../lib/actions/result.md#actionresultt)\<[`EntitySchema`](../../types.md#entityschema)\>\>

#### Defined in

[app/actions/entities.ts:207](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/app/actions/entities.ts#L207)

***

### archiveEntitySchemaAction()

```ts
function archiveEntitySchemaAction(schemaId): Promise<ActionResult<null>>
```

Удаление пользовательского типа.

Тип не стирается из базы, а помечается архивным. Причин две. Первая: на него
ссылаются объекты, и внешний ключ стоит с `on delete restrict` — стереть
строку всё равно не выйдет, пока жив хоть один объект. Вторая: удаление типа
с уже заполненными объектами — не то действие, которое стоит делать
необратимым по одному нажатию.

Объекты этого типа удаляются: держать их без описания реквизитов негде,
в интерфейсе они превращаются в строки без колонок.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `schemaId` | `string` |

#### Returns

`Promise`\<[`ActionResult`](../../lib/actions/result.md#actionresultt)\<`null`\>\>

#### Defined in

[app/actions/entities.ts:279](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/app/actions/entities.ts#L279)
