[aleteya](../../index.md) / app/actions/workspace

# app/actions/workspace

## Interfaces

### ProfilePatch

Профиль, реквизиты организации и состав участников.

Всё, что здесь пишется, ограничено политиками в базе: роль участника меняет
владелец или админ, реквизиты — они же, свой профиль — сам человек. Проверки
в этом файле не заменяют политики, а дают внятный отказ вместо сухого
«нарушение политики доступа» от драйвера.

#### Properties

##### fullName

```ts
fullName: string;
```

###### Defined in

[app/actions/workspace.ts:34](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/app/actions/workspace.ts#L34)

##### jobTitle?

```ts
optional jobTitle: string;
```

###### Defined in

[app/actions/workspace.ts:35](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/app/actions/workspace.ts#L35)

***

### WorkspacePatch

#### Properties

##### name

```ts
name: string;
```

###### Defined in

[app/actions/workspace.ts:94](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/app/actions/workspace.ts#L94)

##### legalName?

```ts
optional legalName: string;
```

###### Defined in

[app/actions/workspace.ts:95](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/app/actions/workspace.ts#L95)

##### inn?

```ts
optional inn: string;
```

###### Defined in

[app/actions/workspace.ts:96](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/app/actions/workspace.ts#L96)

##### address?

```ts
optional address: string;
```

###### Defined in

[app/actions/workspace.ts:97](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/app/actions/workspace.ts#L97)

***

### InviteResult

#### Properties

##### email

```ts
email: string;
```

###### Defined in

[app/actions/workspace.ts:149](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/app/actions/workspace.ts#L149)

##### emailSent

```ts
emailSent: boolean;
```

Письмо ушло. Без служебного ключа приглашение всё равно создаётся.

###### Defined in

[app/actions/workspace.ts:151](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/app/actions/workspace.ts#L151)

## Functions

### updateProfileAction()

```ts
function updateProfileAction(patch): Promise<ActionResult<null>>
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `patch` | [`ProfilePatch`](workspace.md#profilepatch) |

#### Returns

`Promise`\<[`ActionResult`](../../lib/actions/result.md#actionresultt)\<`null`\>\>

#### Defined in

[app/actions/workspace.ts:38](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/app/actions/workspace.ts#L38)

***

### switchWorkspaceAction()

```ts
function switchWorkspaceAction(workspaceId): Promise<ActionResult<null>>
```

Переключение текущего пространства — для тех, кого позвали в чужое.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `workspaceId` | `string` |

#### Returns

`Promise`\<[`ActionResult`](../../lib/actions/result.md#actionresultt)\<`null`\>\>

#### Defined in

[app/actions/workspace.ts:67](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/app/actions/workspace.ts#L67)

***

### updateWorkspaceAction()

```ts
function updateWorkspaceAction(patch): Promise<ActionResult<null>>
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `patch` | [`WorkspacePatch`](workspace.md#workspacepatch) |

#### Returns

`Promise`\<[`ActionResult`](../../lib/actions/result.md#actionresultt)\<`null`\>\>

#### Defined in

[app/actions/workspace.ts:100](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/app/actions/workspace.ts#L100)

***

### inviteMemberAction()

```ts
function inviteMemberAction(email, role): Promise<ActionResult<InviteResult>>
```

Приглашение в пространство.

Строка приглашения — источник истины: по ней членство выдаётся и при
регистрации нового человека, и при первом входе уже зарегистрированного.
Письмо — только уведомление, поэтому его неудача не отменяет приглашение.

#### Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `email` | `string` | `undefined` |
| `role` | [`WorkspaceRole`](../../types/database.md#workspacerole) | `"member"` |

#### Returns

`Promise`\<[`ActionResult`](../../lib/actions/result.md#actionresultt)\<[`InviteResult`](workspace.md#inviteresult)\>\>

#### Defined in

[app/actions/workspace.ts:161](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/app/actions/workspace.ts#L161)

***

### cancelInviteAction()

```ts
function cancelInviteAction(inviteId): Promise<ActionResult<null>>
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `inviteId` | `string` |

#### Returns

`Promise`\<[`ActionResult`](../../lib/actions/result.md#actionresultt)\<`null`\>\>

#### Defined in

[app/actions/workspace.ts:258](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/app/actions/workspace.ts#L258)

***

### updateMemberRoleAction()

```ts
function updateMemberRoleAction(userId, role): Promise<ActionResult<null>>
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `userId` | `string` |
| `role` | [`WorkspaceRole`](../../types/database.md#workspacerole) |

#### Returns

`Promise`\<[`ActionResult`](../../lib/actions/result.md#actionresultt)\<`null`\>\>

#### Defined in

[app/actions/workspace.ts:279](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/app/actions/workspace.ts#L279)

***

### removeMemberAction()

```ts
function removeMemberAction(userId): Promise<ActionResult<null>>
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `userId` | `string` |

#### Returns

`Promise`\<[`ActionResult`](../../lib/actions/result.md#actionresultt)\<`null`\>\>

#### Defined in

[app/actions/workspace.ts:315](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/app/actions/workspace.ts#L315)

***

### prepareAvatarUploadAction()

```ts
function prepareAvatarUploadAction(fileName): Promise<ActionResult<{
  bucket: string;
  path: string;
}>>
```

Путь для аватара. Как и с документами, файл кладёт браузер, а путь считает
сервер: первый сегмент — идентификатор пользователя, по нему хранилище и
решает, кому разрешена запись.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `fileName` | `string` |

#### Returns

`Promise`\<[`ActionResult`](../../lib/actions/result.md#actionresultt)\<\{
  `bucket`: `string`;
  `path`: `string`;
 \}\>\>

#### Defined in

[app/actions/workspace.ts:354](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/app/actions/workspace.ts#L354)

***

### saveAvatarPathAction()

```ts
function saveAvatarPathAction(path): Promise<ActionResult<null>>
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | `string` |

#### Returns

`Promise`\<[`ActionResult`](../../lib/actions/result.md#actionresultt)\<`null`\>\>

#### Defined in

[app/actions/workspace.ts:375](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/app/actions/workspace.ts#L375)

***

### leaveWorkspaceAction()

```ts
function leaveWorkspaceAction(): Promise<ActionResult<null>>
```

#### Returns

`Promise`\<[`ActionResult`](../../lib/actions/result.md#actionresultt)\<`null`\>\>

#### Defined in

[app/actions/workspace.ts:404](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/app/actions/workspace.ts#L404)
