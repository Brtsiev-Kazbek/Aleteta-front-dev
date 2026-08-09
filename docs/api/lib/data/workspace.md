[aleteya](../../index.md) / lib/data/workspace

# lib/data/workspace

## Interfaces

### SettingsMember

Данные страницы настроек.

Собираются одним заходом: страница всё равно ждёт самый долгий запрос, а не
их сумму, и лишние круги к базе тут ничего не дают.

#### Properties

##### userId

```ts
userId: string;
```

###### Defined in

[lib/data/workspace.ts:15](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/data/workspace.ts#L15)

##### fullName

```ts
fullName: string;
```

###### Defined in

[lib/data/workspace.ts:16](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/data/workspace.ts#L16)

##### email

```ts
email: string;
```

###### Defined in

[lib/data/workspace.ts:17](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/data/workspace.ts#L17)

##### jobTitle

```ts
jobTitle: null | string;
```

###### Defined in

[lib/data/workspace.ts:18](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/data/workspace.ts#L18)

##### role

```ts
role: WorkspaceRole;
```

###### Defined in

[lib/data/workspace.ts:19](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/data/workspace.ts#L19)

##### isSelf

```ts
isSelf: boolean;
```

Это вы: себя нельзя исключить кнопкой «Исключить».

###### Defined in

[lib/data/workspace.ts:21](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/data/workspace.ts#L21)

***

### SettingsInvite

#### Properties

##### id

```ts
id: string;
```

###### Defined in

[lib/data/workspace.ts:25](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/data/workspace.ts#L25)

##### email

```ts
email: string;
```

###### Defined in

[lib/data/workspace.ts:26](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/data/workspace.ts#L26)

##### role

```ts
role: WorkspaceRole;
```

###### Defined in

[lib/data/workspace.ts:27](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/data/workspace.ts#L27)

##### expiresAt

```ts
expiresAt: string;
```

###### Defined in

[lib/data/workspace.ts:28](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/data/workspace.ts#L28)

##### createdAt

```ts
createdAt: string;
```

###### Defined in

[lib/data/workspace.ts:29](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/data/workspace.ts#L29)

***

### SettingsWorkspace

#### Properties

##### id

```ts
id: string;
```

###### Defined in

[lib/data/workspace.ts:33](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/data/workspace.ts#L33)

##### name

```ts
name: string;
```

###### Defined in

[lib/data/workspace.ts:34](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/data/workspace.ts#L34)

##### legalName

```ts
legalName: string;
```

###### Defined in

[lib/data/workspace.ts:35](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/data/workspace.ts#L35)

##### inn

```ts
inn: string;
```

###### Defined in

[lib/data/workspace.ts:36](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/data/workspace.ts#L36)

##### address

```ts
address: string;
```

###### Defined in

[lib/data/workspace.ts:37](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/data/workspace.ts#L37)

##### plan

```ts
plan: string;
```

###### Defined in

[lib/data/workspace.ts:38](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/data/workspace.ts#L38)

***

### SettingsSnapshot

#### Properties

##### profile

```ts
profile: {
  id: string;
  email: string;
  fullName: string;
  jobTitle: string;
  avatarPath: null | string;
  isPlatformAdmin: boolean;
};
```

###### id

```ts
id: string;
```

###### email

```ts
email: string;
```

###### fullName

```ts
fullName: string;
```

###### jobTitle

```ts
jobTitle: string;
```

###### avatarPath

```ts
avatarPath: null | string;
```

###### isPlatformAdmin

```ts
isPlatformAdmin: boolean;
```

###### Defined in

[lib/data/workspace.ts:42](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/data/workspace.ts#L42)

##### workspace

```ts
workspace: SettingsWorkspace;
```

###### Defined in

[lib/data/workspace.ts:50](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/data/workspace.ts#L50)

##### myRole

```ts
myRole: WorkspaceRole;
```

Роль текущего пользователя в этом пространстве.

###### Defined in

[lib/data/workspace.ts:52](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/data/workspace.ts#L52)

##### members

```ts
members: SettingsMember[];
```

###### Defined in

[lib/data/workspace.ts:53](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/data/workspace.ts#L53)

##### invites

```ts
invites: SettingsInvite[];
```

###### Defined in

[lib/data/workspace.ts:54](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/data/workspace.ts#L54)

##### workspaces

```ts
workspaces: {
  id: string;
  name: string;
  role: WorkspaceRole;
 }[];
```

Все пространства, где человек состоит, — для переключателя.

###### Defined in

[lib/data/workspace.ts:56](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/data/workspace.ts#L56)

## Functions

### loadSettings()

```ts
function loadSettings(): Promise<SettingsSnapshot>
```

#### Returns

`Promise`\<[`SettingsSnapshot`](workspace.md#settingssnapshot)\>

#### Defined in

[lib/data/workspace.ts:59](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/data/workspace.ts#L59)
