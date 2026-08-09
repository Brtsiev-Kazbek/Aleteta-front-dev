[aleteya](../../index.md) / lib/actions/result

# lib/actions/result

## Interfaces

### ActionResult\<T\>

Ответ серверного действия.

Исключения через границу «сервер → клиент» в продакшен-сборке приходят
обезличенными: React прячет текст ошибки, чтобы наружу не утекли внутренности.
Поэтому ожидаемые отказы — занятая почта, недостаточно прав, непройденная
проверка — возвращаются значением, а не выбрасываются.

#### Type Parameters

| Type Parameter |
| ------ |
| `T` |

#### Properties

##### ok

```ts
ok: boolean;
```

###### Defined in

[lib/actions/result.ts:10](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/actions/result.ts#L10)

##### data?

```ts
optional data: T;
```

###### Defined in

[lib/actions/result.ts:11](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/actions/result.ts#L11)

##### error?

```ts
optional error: string;
```

###### Defined in

[lib/actions/result.ts:12](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/actions/result.ts#L12)

## Functions

### actionOk()

```ts
function actionOk<T>(data): ActionResult<T>
```

#### Type Parameters

| Type Parameter |
| ------ |
| `T` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `data` | `T` |

#### Returns

[`ActionResult`](result.md#actionresultt)\<`T`\>

#### Defined in

[lib/actions/result.ts:15](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/actions/result.ts#L15)

***

### actionFail()

```ts
function actionFail<T>(error): ActionResult<T>
```

#### Type Parameters

| Type Parameter |
| ------ |
| `T` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `error` | `string` |

#### Returns

[`ActionResult`](result.md#actionresultt)\<`T`\>

#### Defined in

[lib/actions/result.ts:19](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/actions/result.ts#L19)

***

### actionError()

```ts
function actionError<T>(caught, fallback): ActionResult<T>
```

Превращает неизвестное исключение в текст для человека.

`requireSession()` выбрасывает при сломанных данных, драйвер Supabase — при
сетевых сбоях. И то и другое должно доехать до формы строкой, а не уронить
страницу.

#### Type Parameters

| Type Parameter |
| ------ |
| `T` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `caught` | `unknown` |
| `fallback` | `string` |

#### Returns

[`ActionResult`](result.md#actionresultt)\<`T`\>

#### Defined in

[lib/actions/result.ts:30](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/actions/result.ts#L30)
