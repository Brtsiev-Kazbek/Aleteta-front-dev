[aleteya](../../index.md) / app/actions/auth

# app/actions/auth

## Interfaces

### SignUpInput

Вход, регистрация и восстановление пароля.

Всё делается на сервере, а не из браузера, по двум причинам. Первая: cookie
сессии ставится заголовком ответа — при входе из браузера серверные
компоненты на этой же навигации отрисовались бы ещё гостю. Вторая: проверки
полей нельзя оставлять только в браузере, их обходит любой прямой запрос.

#### Properties

##### fullName

```ts
fullName: string;
```

###### Defined in

[app/actions/auth.ts:25](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/app/actions/auth.ts#L25)

##### email

```ts
email: string;
```

###### Defined in

[app/actions/auth.ts:26](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/app/actions/auth.ts#L26)

##### password

```ts
password: string;
```

###### Defined in

[app/actions/auth.ts:27](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/app/actions/auth.ts#L27)

##### jobTitle?

```ts
optional jobTitle: string;
```

Должность попадает в профиль и подставляется в документы.

###### Defined in

[app/actions/auth.ts:29](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/app/actions/auth.ts#L29)

##### workspaceName?

```ts
optional workspaceName: string;
```

Название организации становится именем рабочего пространства.

###### Defined in

[app/actions/auth.ts:31](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/app/actions/auth.ts#L31)

##### next?

```ts
optional next: string;
```

Куда вести после регистрации. Письма и подтверждения нет — путь нужен
только форме, которая сама переносит человека после ответа.

###### Defined in

[app/actions/auth.ts:36](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/app/actions/auth.ts#L36)

***

### SignUpResult

#### Properties

##### needsConfirmation

```ts
needsConfirmation: boolean;
```

Проект требует подтверждения почты — сессии пока нет.

###### Defined in

[app/actions/auth.ts:41](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/app/actions/auth.ts#L41)

##### email

```ts
email: string;
```

###### Defined in

[app/actions/auth.ts:42](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/app/actions/auth.ts#L42)

## Functions

### signUpAction()

```ts
function signUpAction(input): Promise<ActionResult<SignUpResult>>
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | [`SignUpInput`](auth.md#signupinput) |

#### Returns

`Promise`\<[`ActionResult`](../../lib/actions/result.md#actionresultt)\<[`SignUpResult`](auth.md#signupresult)\>\>

#### Defined in

[app/actions/auth.ts:45](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/app/actions/auth.ts#L45)

***

### signInAction()

```ts
function signInAction(email, password): Promise<ActionResult<null>>
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `email` | `string` |
| `password` | `string` |

#### Returns

`Promise`\<[`ActionResult`](../../lib/actions/result.md#actionresultt)\<`null`\>\>

#### Defined in

[app/actions/auth.ts:124](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/app/actions/auth.ts#L124)

***

### resendConfirmationAction()

```ts
function resendConfirmationAction(email): Promise<ActionResult<null>>
```

Повторное письмо с подтверждением адреса.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `email` | `string` |

#### Returns

`Promise`\<[`ActionResult`](../../lib/actions/result.md#actionresultt)\<`null`\>\>

#### Defined in

[app/actions/auth.ts:154](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/app/actions/auth.ts#L154)

***

### requestPasswordResetAction()

```ts
function requestPasswordResetAction(email): Promise<ActionResult<null>>
```

Письмо со ссылкой на смену пароля.

Ответ одинаков и для существующего адреса, и для незнакомого: иначе форма
превращается в способ проверять, зарегистрирован ли человек.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `email` | `string` |

#### Returns

`Promise`\<[`ActionResult`](../../lib/actions/result.md#actionresultt)\<`null`\>\>

#### Defined in

[app/actions/auth.ts:184](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/app/actions/auth.ts#L184)

***

### updatePasswordAction()

```ts
function updatePasswordAction(password): Promise<ActionResult<null>>
```

Новый пароль по ссылке из письма: сессия восстановления уже в cookie.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `password` | `string` |

#### Returns

`Promise`\<[`ActionResult`](../../lib/actions/result.md#actionresultt)\<`null`\>\>

#### Defined in

[app/actions/auth.ts:209](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/app/actions/auth.ts#L209)

***

### changePasswordAction()

```ts
function changePasswordAction(currentPassword, nextPassword): Promise<ActionResult<null>>
```

Смена пароля из настроек.

Текущий пароль спрашиваем не для формальности: сессия может быть открыта на
чужом незаблокированном ноутбуке, и без этой проверки пароль меняет любой,
кто до него дошёл.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `currentPassword` | `string` |
| `nextPassword` | `string` |

#### Returns

`Promise`\<[`ActionResult`](../../lib/actions/result.md#actionresultt)\<`null`\>\>

#### Defined in

[app/actions/auth.ts:245](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/app/actions/auth.ts#L245)

***

### changeEmailAction()

```ts
function changeEmailAction(email): Promise<ActionResult<null>>
```

Смена почты. Адрес меняется не сразу: Supabase шлёт письмо на новый адрес,
и до перехода по ссылке в профиле остаётся прежний.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `email` | `string` |

#### Returns

`Promise`\<[`ActionResult`](../../lib/actions/result.md#actionresultt)\<`null`\>\>

#### Defined in

[app/actions/auth.ts:284](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/app/actions/auth.ts#L284)
