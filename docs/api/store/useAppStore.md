[aleteya](../index.md) / store/useAppStore

# store/useAppStore

## Interfaces

### EditingCell

#### Properties

##### entityId

```ts
entityId: string;
```

###### Defined in

[store/useAppStore.ts:54](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/store/useAppStore.ts#L54)

##### field

```ts
field: string;
```

###### Defined in

[store/useAppStore.ts:55](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/store/useAppStore.ts#L55)

***

### CustomSchemaDraft

Черновик пользовательской схемы из диалога создания типа.

#### Properties

##### label

```ts
label: string;
```

###### Defined in

[store/useAppStore.ts:60](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/store/useAppStore.ts#L60)

##### fields

```ts
fields: {
  label: string;
  required: boolean;
 }[];
```

###### Defined in

[store/useAppStore.ts:61](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/store/useAppStore.ts#L61)

***

### BulkGenerationResult

Результат массовой генерации по нескольким делам сразу.

#### Properties

##### id

```ts
id: string;
```

###### Defined in

[store/useAppStore.ts:66](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/store/useAppStore.ts#L66)

##### caseId

```ts
caseId: string;
```

###### Defined in

[store/useAppStore.ts:67](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/store/useAppStore.ts#L67)

##### caseTitle

```ts
caseTitle: string;
```

###### Defined in

[store/useAppStore.ts:68](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/store/useAppStore.ts#L68)

##### name

```ts
name: string;
```

###### Defined in

[store/useAppStore.ts:69](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/store/useAppStore.ts#L69)

***

### UploadedFile

Файл, добавляемый в документы дела.

#### Properties

##### name

```ts
name: string;
```

###### Defined in

[store/useAppStore.ts:74](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/store/useAppStore.ts#L74)

##### sizeBytes

```ts
sizeBytes: number;
```

###### Defined in

[store/useAppStore.ts:75](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/store/useAppStore.ts#L75)

##### file?

```ts
optional file: File;
```

Само содержимое. Есть только у файла, выбранного человеком: на
демонстрационных примерах его нет, и в хранилище такой файл не уезжает.

###### Defined in

[store/useAppStore.ts:80](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/store/useAppStore.ts#L80)

***

### Viewer

Вошедший пользователь: имя в меню и название текущего пространства.

#### Properties

##### fullName

```ts
fullName: string;
```

###### Defined in

[store/useAppStore.ts:236](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/store/useAppStore.ts#L236)

##### email

```ts
email: string;
```

###### Defined in

[store/useAppStore.ts:237](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/store/useAppStore.ts#L237)

##### workspaceName

```ts
workspaceName: string;
```

###### Defined in

[store/useAppStore.ts:238](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/store/useAppStore.ts#L238)

***

### StoreSnapshot

Срез данных, приходящий с сервера. Отсутствующие части остаются как есть.

#### Properties

##### viewer?

```ts
optional viewer: Viewer;
```

###### Defined in

[store/useAppStore.ts:243](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/store/useAppStore.ts#L243)

##### cases?

```ts
optional cases: Case[];
```

###### Defined in

[store/useAppStore.ts:244](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/store/useAppStore.ts#L244)

##### entities?

```ts
optional entities: Entity[];
```

###### Defined in

[store/useAppStore.ts:245](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/store/useAppStore.ts#L245)

##### documents?

```ts
optional documents: Document[];
```

###### Defined in

[store/useAppStore.ts:246](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/store/useAppStore.ts#L246)

##### customSchemas?

```ts
optional customSchemas: EntitySchema[];
```

###### Defined in

[store/useAppStore.ts:247](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/store/useAppStore.ts#L247)

## Type Aliases

### CaseTab

```ts
type CaseTab: "overview" | "documents" | "entities";
```

#### Defined in

[store/useAppStore.ts:51](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/store/useAppStore.ts#L51)

## Functions

### useAppStore()

#### useAppStore()

```ts
function useAppStore(): AppState
```

##### Returns

`AppState`

##### Defined in

[store/useAppStore.ts:450](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/store/useAppStore.ts#L450)

#### useAppStore(selector)

```ts
function useAppStore<U>(selector): U
```

##### Type Parameters

| Type Parameter |
| ------ |
| `U` |

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `selector` | (`state`) => `U` |

##### Returns

`U`

##### Defined in

[store/useAppStore.ts:450](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/store/useAppStore.ts#L450)

#### useAppStore(selector, equalityFn)

```ts
function useAppStore<U>(selector, equalityFn): U
```

##### Type Parameters

| Type Parameter |
| ------ |
| `U` |

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `selector` | (`state`) => `U` |
| `equalityFn` | (`a`, `b`) => `boolean` |

##### Returns

`U`

##### Deprecated

Use `createWithEqualityFn` from 'zustand/traditional'

##### Defined in

[store/useAppStore.ts:450](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/store/useAppStore.ts#L450)
