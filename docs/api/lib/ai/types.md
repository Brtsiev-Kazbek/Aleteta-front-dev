[aleteya](../../index.md) / lib/ai/types

# lib/ai/types

## References

### AiTask

Re-exports [AiTask](../../types/database.md#aitask)

### JobStatus

Re-exports [JobStatus](../../types/database.md#jobstatus)

## Interfaces

### ExtractInput

#### Properties

##### documentId

```ts
documentId: string;
```

Документ, из которого читаем. Файл исполнитель возьмёт из хранилища сам.

###### Defined in

[lib/ai/types.ts:22](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/ai/types.ts#L22)

##### caseId

```ts
caseId: string;
```

Дело, в которое ляжет объект.

###### Defined in

[lib/ai/types.ts:24](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/ai/types.ts#L24)

##### typeId

```ts
typeId: string;
```

Тип объекта: его описание реквизитов уходит в промпт. Благодаря этому
пользовательские типы работают без единой правки кода.

###### Defined in

[lib/ai/types.ts:29](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/ai/types.ts#L29)

***

### ExtractedField

#### Properties

##### key

```ts
key: string;
```

Ключ реквизита из `entity_types.fields`.

###### Defined in

[lib/ai/types.ts:34](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/ai/types.ts#L34)

##### value

```ts
value: string;
```

###### Defined in

[lib/ai/types.ts:35](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/ai/types.ts#L35)

##### confidence

```ts
confidence: number;
```

Уверенность от 0 до 1. Ниже порога значение подставляется, но помечается
как требующее подтверждения — человек видит, что именно проверить.

###### Defined in

[lib/ai/types.ts:40](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/ai/types.ts#L40)

##### page?

```ts
optional page: number;
```

Страница исходного файла: по ней интерфейс показывает, откуда взято.

###### Defined in

[lib/ai/types.ts:42](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/ai/types.ts#L42)

***

### ExtractOutput

#### Properties

##### fields

```ts
fields: ExtractedField[];
```

###### Defined in

[lib/ai/types.ts:46](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/ai/types.ts#L46)

##### missing

```ts
missing: string[];
```

Что модель прочитать не смогла — показываем человеку прямо.

###### Defined in

[lib/ai/types.ts:48](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/ai/types.ts#L48)

***

### ReviewInput

#### Properties

##### documentId

```ts
documentId: string;
```

###### Defined in

[lib/ai/types.ts:56](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/ai/types.ts#L56)

##### caseId

```ts
caseId: string;
```

###### Defined in

[lib/ai/types.ts:57](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/ai/types.ts#L57)

***

### ReviewFinding

#### Properties

##### level

```ts
level: "critical" | "warning" | "info";
```

###### Defined in

[lib/ai/types.ts:61](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/ai/types.ts#L61)

##### title

```ts
title: string;
```

###### Defined in

[lib/ai/types.ts:62](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/ai/types.ts#L62)

##### description

```ts
description: string;
```

###### Defined in

[lib/ai/types.ts:63](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/ai/types.ts#L63)

##### recommendation?

```ts
optional recommendation: string;
```

###### Defined in

[lib/ai/types.ts:64](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/ai/types.ts#L64)

##### clause?

```ts
optional clause: string;
```

Номер пункта договора: по нему подсвечивается текст слева.

###### Defined in

[lib/ai/types.ts:66](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/ai/types.ts#L66)

##### paragraphId?

```ts
optional paragraphId: string;
```

###### Defined in

[lib/ai/types.ts:67](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/ai/types.ts#L67)

***

### ReviewOutput

#### Properties

##### paragraphs

```ts
paragraphs: {
  id: string;
  clause: string;
  text: string;
 }[];
```

###### Defined in

[lib/ai/types.ts:71](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/ai/types.ts#L71)

##### findings

```ts
findings: ReviewFinding[];
```

###### Defined in

[lib/ai/types.ts:72](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/ai/types.ts#L72)

***

### AssistantInput

#### Properties

##### caseId

```ts
caseId: string;
```

###### Defined in

[lib/ai/types.ts:80](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/ai/types.ts#L80)

##### question

```ts
question: string;
```

###### Defined in

[lib/ai/types.ts:81](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/ai/types.ts#L81)

***

### AssistantOutput

#### Properties

##### answer

```ts
answer: string;
```

###### Defined in

[lib/ai/types.ts:85](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/ai/types.ts#L85)

##### citations

```ts
citations: {
  documentId: string;
  chunkId: string;
  quote: string;
 }[];
```

Фрагменты, на которых основан ответ. Без них ответу нельзя верить.

###### Defined in

[lib/ai/types.ts:87](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/ai/types.ts#L87)

***

### EmbedInput

#### Properties

##### documentId

```ts
documentId: string;
```

###### Defined in

[lib/ai/types.ts:95](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/ai/types.ts#L95)

##### caseId

```ts
caseId: string;
```

###### Defined in

[lib/ai/types.ts:96](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/ai/types.ts#L96)

***

### EmbedOutput

#### Properties

##### chunks

```ts
chunks: number;
```

Сколько фрагментов проиндексировано.

###### Defined in

[lib/ai/types.ts:101](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/ai/types.ts#L101)

***

### TaskShapes

Карта задач. Исполнитель по ней понимает, что разбирать, приложение — что
присылать. Задача без записи здесь не поставится: TypeScript не даст.

#### Properties

##### extract

```ts
extract: {
  input: ExtractInput;
  output: ExtractOutput;
};
```

###### input

```ts
input: ExtractInput;
```

###### output

```ts
output: ExtractOutput;
```

###### Defined in

[lib/ai/types.ts:113](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/ai/types.ts#L113)

##### review

```ts
review: {
  input: ReviewInput;
  output: ReviewOutput;
};
```

###### input

```ts
input: ReviewInput;
```

###### output

```ts
output: ReviewOutput;
```

###### Defined in

[lib/ai/types.ts:114](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/ai/types.ts#L114)

##### assistant

```ts
assistant: {
  input: AssistantInput;
  output: AssistantOutput;
};
```

###### input

```ts
input: AssistantInput;
```

###### output

```ts
output: AssistantOutput;
```

###### Defined in

[lib/ai/types.ts:115](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/ai/types.ts#L115)

##### embed

```ts
embed: {
  input: EmbedInput;
  output: EmbedOutput;
};
```

###### input

```ts
input: EmbedInput;
```

###### output

```ts
output: EmbedOutput;
```

###### Defined in

[lib/ai/types.ts:116](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/ai/types.ts#L116)

***

### JobState\<T\>

Состояние задания для интерфейса: форма опрашивает его, пока идёт работа.

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` *extends* [`TypedTask`](types.md#typedtask) | [`TypedTask`](types.md#typedtask) |

#### Properties

##### id

```ts
id: string;
```

###### Defined in

[lib/ai/types.ts:127](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/ai/types.ts#L127)

##### task

```ts
task: T;
```

###### Defined in

[lib/ai/types.ts:128](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/ai/types.ts#L128)

##### status

```ts
status: JobStatus;
```

###### Defined in

[lib/ai/types.ts:129](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/ai/types.ts#L129)

##### progress

```ts
progress: number;
```

0–100. Обработчик обновляет по мере прохождения этапов.

###### Defined in

[lib/ai/types.ts:131](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/ai/types.ts#L131)

##### output

```ts
output: null | TaskOutput<T>;
```

###### Defined in

[lib/ai/types.ts:132](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/ai/types.ts#L132)

##### error

```ts
error: null | string;
```

###### Defined in

[lib/ai/types.ts:133](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/ai/types.ts#L133)

## Type Aliases

### TypedTask

```ts
type TypedTask: keyof TaskShapes;
```

Задачи, для которых описан вход и выход. Остальные значения `ai_task` — заготовки.

#### Defined in

[lib/ai/types.ts:120](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/ai/types.ts#L120)

***

### TaskInput\<T\>

```ts
type TaskInput<T>: TaskShapes[T]["input"];
```

#### Type Parameters

| Type Parameter |
| ------ |
| `T` *extends* [`TypedTask`](types.md#typedtask) |

#### Defined in

[lib/ai/types.ts:122](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/ai/types.ts#L122)

***

### TaskOutput\<T\>

```ts
type TaskOutput<T>: TaskShapes[T]["output"];
```

#### Type Parameters

| Type Parameter |
| ------ |
| `T` *extends* [`TypedTask`](types.md#typedtask) |

#### Defined in

[lib/ai/types.ts:123](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/ai/types.ts#L123)
