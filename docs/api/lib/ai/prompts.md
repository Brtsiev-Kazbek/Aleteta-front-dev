[aleteya](../../index.md) / lib/ai/prompts

# lib/ai/prompts

## Interfaces

### FieldSpec

#### Properties

##### key

```ts
key: string;
```

###### Defined in

[lib/ai/prompts.ts:37](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/ai/prompts.ts#L37)

##### label

```ts
label: string;
```

###### Defined in

[lib/ai/prompts.ts:38](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/ai/prompts.ts#L38)

##### required

```ts
required: boolean;
```

###### Defined in

[lib/ai/prompts.ts:39](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/ai/prompts.ts#L39)

##### pattern?

```ts
optional pattern: string;
```

Шаблон формата в виде регулярного выражения POSIX, если он задан у типа.

###### Defined in

[lib/ai/prompts.ts:41](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/ai/prompts.ts#L41)

##### placeholder?

```ts
optional placeholder: string;
```

###### Defined in

[lib/ai/prompts.ts:42](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/ai/prompts.ts#L42)

## Variables

### PROMPT\_VERSIONS

```ts
const PROMPT_VERSIONS: Record<TypedTask, number>;
```

Версия промпта. Меняется при каждой правке текста.

#### Defined in

[lib/ai/prompts.ts:20](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/ai/prompts.ts#L20)

***

### REVIEW\_PROMPT

```ts
const REVIEW_PROMPT: "Ты юрист, который разбирает договор по пунктам и ищет условия,\nневыгодные стороне, обратившейся за проверкой.\n\nПравила:\n1. Разбирай только то, что есть в тексте. Отсутствие условия — тоже находка,\n   но помечай её отдельно и объясняй, чем грозит пробел.\n2. Каждой находке присвой уровень: critical — прямая угроза деньгам или\n   правам; warning — риск при неблагоприятном развитии; info — замечание.\n3. К каждой находке дай рекомендацию: какую формулировку предложить взамен.\n4. Указывай номер пункта договора, к которому относится находка.\n\nОтвет — JSON: {\"paragraphs\":[...],\"findings\":[...]}";
```

#### Defined in

[lib/ai/prompts.ts:87](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/ai/prompts.ts#L87)

***

### ASSISTANT\_PROMPT

```ts
const ASSISTANT_PROMPT: "Ты помощник юриста и отвечаешь по материалам одного дела.\n\nПравила:\n1. Отвечай только по приведённым фрагментам документов. Если ответа в них нет,\n   так и скажи — догадка здесь дороже молчания.\n2. К каждому утверждению давай ссылку на фрагмент, из которого оно взято.\n3. Не пересказывай закон по памяти: если нужна норма, укажи, что её следует\n   проверить, и назови реквизиты акта из фрагментов.";
```

#### Defined in

[lib/ai/prompts.ts:104](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/ai/prompts.ts#L104)

## Functions

### promptVersion()

```ts
function promptVersion(task): string
```

Строка версии для отпечатка: `extract@1`.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `task` | keyof [`TaskShapes`](types.md#taskshapes) |

#### Returns

`string`

#### Defined in

[lib/ai/prompts.ts:28](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/ai/prompts.ts#L28)

***

### buildExtractPrompt()

```ts
function buildExtractPrompt(typeLabel, fields): string
```

Промпт извлечения строится из описания реквизитов конкретного типа объекта.

Поэтому пользовательские типы работают без правки кода: человек завёл свой
тип «Транспортное средство» с полями «VIN» и «Госномер» — модель получает
ровно их и ищет в документе именно это.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `typeLabel` | `string` |
| `fields` | [`FieldSpec`](prompts.md#fieldspec)[] |

#### Returns

`string`

#### Defined in

[lib/ai/prompts.ts:52](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/ai/prompts.ts#L52)
