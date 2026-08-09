[aleteya](../../index.md) / lib/data/session

# lib/data/session

## Interfaces

### SessionContext

#### Properties

##### userId

```ts
userId: string;
```

###### Defined in

[lib/data/session.ts:8](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/data/session.ts#L8)

##### email

```ts
email: string;
```

###### Defined in

[lib/data/session.ts:9](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/data/session.ts#L9)

##### fullName

```ts
fullName: string;
```

###### Defined in

[lib/data/session.ts:10](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/data/session.ts#L10)

##### workspaceId

```ts
workspaceId: string;
```

###### Defined in

[lib/data/session.ts:11](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/data/session.ts#L11)

##### workspaceName

```ts
workspaceName: string;
```

###### Defined in

[lib/data/session.ts:12](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/data/session.ts#L12)

## Functions

### requireSession()

```ts
function requireSession(): Promise<SessionContext>
```

Текущий пользователь и его рабочее пространство.

Пространство создаётся триггером при регистрации, поэтому у вошедшего оно
есть всегда. Если его вдруг нет — это сломанные данные, а не обычный случай,
и притворяться, что всё хорошо, вредно: лучше упасть явно.

#### Returns

`Promise`\<[`SessionContext`](session.md#sessioncontext)\>

#### Defined in

[lib/data/session.ts:22](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/data/session.ts#L22)

***

### getOptionalSession()

```ts
function getOptionalSession(): Promise<SessionContext | null>
```

Сессия там, где отсутствие входа — не ошибка (лендинг, публичные страницы).

#### Returns

`Promise`\<[`SessionContext`](session.md#sessioncontext) \| `null`\>

#### Defined in

[lib/data/session.ts:75](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/data/session.ts#L75)
