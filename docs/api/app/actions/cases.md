[aleteya](../../index.md) / app/actions/cases

# app/actions/cases

## References

### ActionResult

Re-exports [ActionResult](../../lib/actions/result.md#actionresultt)

## Interfaces

### CasePatch

#### Properties

##### title?

```ts
optional title: string;
```

###### Defined in

[app/actions/cases.ts:73](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/app/actions/cases.ts#L73)

##### description?

```ts
optional description: string;
```

###### Defined in

[app/actions/cases.ts:74](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/app/actions/cases.ts#L74)

##### status?

```ts
optional status: CaseStatus;
```

###### Defined in

[app/actions/cases.ts:75](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/app/actions/cases.ts#L75)

##### tags?

```ts
optional tags: string[];
```

###### Defined in

[app/actions/cases.ts:76](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/app/actions/cases.ts#L76)

## Functions

### createCaseAction()

```ts
function createCaseAction(title): Promise<ActionResult<Case>>
```

Создание дела.

workspace_id берём из сессии, а не из аргументов: иначе клиент смог бы
подсунуть чужое пространство. Политики доступа это отсекут, но полагаться
на последний рубеж вместо первого — плохая привычка.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `title` | `string` |

#### Returns

`Promise`\<[`ActionResult`](../../lib/actions/result.md#actionresultt)\<[`Case`](../../types.md#case)\>\>

#### Defined in

[app/actions/cases.ts:30](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/app/actions/cases.ts#L30)

***

### updateCaseAction()

```ts
function updateCaseAction(caseId, patch): Promise<ActionResult<Case>>
```

Правка карточки дела: название, описание, статус, метки.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `caseId` | `string` |
| `patch` | [`CasePatch`](cases.md#casepatch) |

#### Returns

`Promise`\<[`ActionResult`](../../lib/actions/result.md#actionresultt)\<[`Case`](../../types.md#case)\>\>

#### Defined in

[app/actions/cases.ts:80](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/app/actions/cases.ts#L80)

***

### deleteCaseAction()

```ts
function deleteCaseAction(caseId): Promise<ActionResult<null>>
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `caseId` | `string` |

#### Returns

`Promise`\<[`ActionResult`](../../lib/actions/result.md#actionresultt)\<`null`\>\>

#### Defined in

[app/actions/cases.ts:138](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/app/actions/cases.ts#L138)
