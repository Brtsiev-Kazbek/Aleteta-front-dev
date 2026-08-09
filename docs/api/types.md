[aleteya](index.md) / types

# types

## Interfaces

### Case

#### Properties

##### id

```ts
id: string;
```

###### Defined in

[types/index.ts:8](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L8)

##### title

```ts
title: string;
```

###### Defined in

[types/index.ts:9](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L9)

##### status

```ts
status: CaseStatus;
```

###### Defined in

[types/index.ts:10](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L10)

##### tags

```ts
tags: string[];
```

###### Defined in

[types/index.ts:11](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L11)

##### createdAt

```ts
createdAt: string;
```

###### Defined in

[types/index.ts:12](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L12)

##### description

```ts
description: string;
```

###### Defined in

[types/index.ts:13](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L13)

##### contextFile

```ts
contextFile: string;
```

Файл, который AI-ассистент держит в контексте этого дела.

###### Defined in

[types/index.ts:15](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L15)

***

### Entity

Значения реквизитов хранятся строками: грид редактирует их инлайн,
а шаблоны документов подставляют как есть.

#### Properties

##### id

```ts
id: string;
```

###### Defined in

[types/index.ts:60](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L60)

##### caseId

```ts
caseId: string;
```

###### Defined in

[types/index.ts:61](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L61)

##### type

```ts
type: string;
```

Идентификатор схемы — встроенной или пользовательской.

###### Defined in

[types/index.ts:63](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L63)

##### data

```ts
data: Record<string, string>;
```

###### Defined in

[types/index.ts:64](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L64)

##### validationErrors

```ts
validationErrors: string[];
```

Человекочитаемые ошибки валидации, пересчитываются при изменении.

###### Defined in

[types/index.ts:66](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L66)

***

### EntityFieldSchema

#### Properties

##### key

```ts
key: string;
```

###### Defined in

[types/index.ts:70](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L70)

##### label

```ts
label: string;
```

###### Defined in

[types/index.ts:71](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L71)

##### required

```ts
required: boolean;
```

###### Defined in

[types/index.ts:72](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L72)

##### placeholder

```ts
placeholder: string;
```

###### Defined in

[types/index.ts:73](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L73)

##### width

```ts
width: number;
```

###### Defined in

[types/index.ts:74](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L74)

##### pattern?

```ts
optional pattern: RegExp;
```

Проверка формата — применяется только к непустому значению.

###### Defined in

[types/index.ts:76](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L76)

##### patternError?

```ts
optional patternError: string;
```

###### Defined in

[types/index.ts:77](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L77)

***

### EntitySchema

#### Properties

##### id

```ts
id: string;
```

###### Defined in

[types/index.ts:81](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L81)

##### label

```ts
label: string;
```

###### Defined in

[types/index.ts:82](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L82)

##### hint

```ts
hint: string;
```

Пояснение в списке выбора типа.

###### Defined in

[types/index.ts:84](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L84)

##### isCustom

```ts
isCustom: boolean;
```

Создана пользователем, а не встроена в систему.

###### Defined in

[types/index.ts:86](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L86)

##### fields

```ts
fields: EntityFieldSchema[];
```

###### Defined in

[types/index.ts:87](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L87)

##### templates

```ts
templates: string[];
```

Документы, которые формируются для сущностей этого типа.

###### Defined in

[types/index.ts:89](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L89)

***

### Document

#### Properties

##### id

```ts
id: string;
```

###### Defined in

[types/index.ts:252](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L252)

##### caseId

```ts
caseId: string;
```

###### Defined in

[types/index.ts:253](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L253)

##### title

```ts
title: string;
```

###### Defined in

[types/index.ts:254](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L254)

##### type

```ts
type: string;
```

###### Defined in

[types/index.ts:255](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L255)

##### status

```ts
status: DocumentStatus;
```

###### Defined in

[types/index.ts:256](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L256)

##### url

```ts
url: string;
```

###### Defined in

[types/index.ts:257](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L257)

##### createdAt

```ts
createdAt: string;
```

###### Defined in

[types/index.ts:258](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L258)

***

### RiskFinding

Карточка находки, которую ассистент рендерит вместо простого текста.

#### Properties

##### id

```ts
id: string;
```

###### Defined in

[types/index.ts:291](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L291)

##### level

```ts
level: RiskLevel;
```

###### Defined in

[types/index.ts:292](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L292)

##### title

```ts
title: string;
```

###### Defined in

[types/index.ts:293](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L293)

##### description

```ts
description: string;
```

###### Defined in

[types/index.ts:294](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L294)

##### clause

```ts
clause: string;
```

Пункт договора, к которому относится находка.

###### Defined in

[types/index.ts:296](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L296)

***

### Citation

Ссылка на источник ответа. Ассистент обязан показывать, откуда взял
формулировку: документ, пункт и страница — иначе ответ не проверить.

#### Properties

##### id

```ts
id: string;
```

###### Defined in

[types/index.ts:304](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L304)

##### document

```ts
document: string;
```

###### Defined in

[types/index.ts:305](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L305)

##### clause

```ts
clause: string;
```

###### Defined in

[types/index.ts:306](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L306)

##### page

```ts
page: number;
```

###### Defined in

[types/index.ts:307](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L307)

##### quote

```ts
quote: string;
```

###### Defined in

[types/index.ts:308](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L308)

***

### ChatMessage

#### Properties

##### id

```ts
id: string;
```

###### Defined in

[types/index.ts:312](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L312)

##### role

```ts
role: "user" | "assistant";
```

###### Defined in

[types/index.ts:313](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L313)

##### text

```ts
text: string;
```

###### Defined in

[types/index.ts:314](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L314)

##### findings?

```ts
optional findings: RiskFinding[];
```

Если заполнено — сообщение рендерится как набор UI-карточек.

###### Defined in

[types/index.ts:316](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L316)

##### citations?

```ts
optional citations: Citation[];
```

Источники ответа — пункт и страница конкретного файла дела.

###### Defined in

[types/index.ts:318](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L318)

##### timestamp

```ts
timestamp: string;
```

###### Defined in

[types/index.ts:319](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L319)

***

### ContractParagraph

#### Properties

##### id

```ts
id: string;
```

###### Defined in

[types/index.ts:356](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L356)

##### clause

```ts
clause: string;
```

###### Defined in

[types/index.ts:357](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L357)

##### text

```ts
text: string;
```

###### Defined in

[types/index.ts:358](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L358)

***

### CourtPractice

Судебный акт, найденный по спорному пункту договора.

#### Properties

##### id

```ts
id: string;
```

###### Defined in

[types/index.ts:363](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L363)

##### court

```ts
court: string;
```

###### Defined in

[types/index.ts:364](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L364)

##### number

```ts
number: string;
```

###### Defined in

[types/index.ts:365](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L365)

##### year

```ts
year: string;
```

###### Defined in

[types/index.ts:366](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L366)

##### holding

```ts
holding: string;
```

###### Defined in

[types/index.ts:367](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L367)

##### side

```ts
side: "against" | "favor";
```

Трактует ли суд условие против вас или в вашу пользу.

###### Defined in

[types/index.ts:369](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L369)

***

### DocumentRisk

#### Properties

##### id

```ts
id: string;
```

###### Defined in

[types/index.ts:373](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L373)

##### level

```ts
level: RiskLevel;
```

###### Defined in

[types/index.ts:374](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L374)

##### title

```ts
title: string;
```

###### Defined in

[types/index.ts:375](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L375)

##### description

```ts
description: string;
```

###### Defined in

[types/index.ts:376](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L376)

##### recommendation

```ts
recommendation: string;
```

###### Defined in

[types/index.ts:377](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L377)

##### paragraphId

```ts
paragraphId: string;
```

id абзаца в левой панели, который подсвечивается при клике.

###### Defined in

[types/index.ts:379](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L379)

##### practice?

```ts
optional practice: CourtPractice[];
```

Практика по этому пункту — подбирается автоматически.

###### Defined in

[types/index.ts:381](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L381)

***

### BatchReviewResult

Результат проверки одного документа в пакетном разборе.

#### Properties

##### documentId

```ts
documentId: string;
```

###### Defined in

[types/index.ts:386](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L386)

##### title

```ts
title: string;
```

###### Defined in

[types/index.ts:387](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L387)

##### critical

```ts
critical: number;
```

###### Defined in

[types/index.ts:388](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L388)

##### warning

```ts
warning: number;
```

###### Defined in

[types/index.ts:389](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L389)

***

### ExtractedField

#### Properties

##### key

```ts
key: string;
```

Ключ поля в схеме сущности — по нему значение попадает в карточку.

###### Defined in

[types/index.ts:405](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L405)

##### label

```ts
label: string;
```

###### Defined in

[types/index.ts:406](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L406)

##### value

```ts
value: string;
```

###### Defined in

[types/index.ts:407](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L407)

##### uncertain

```ts
uncertain: boolean;
```

Значение распознано неуверенно: подставляется, но помечается на
проверку — как и обещано на лендинге.

###### Defined in

[types/index.ts:412](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L412)

***

### ExtractionRecipe

Правило разбора: какой файл во что превращается.

#### Properties

##### id

```ts
id: string;
```

###### Defined in

[types/index.ts:417](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L417)

##### match

```ts
match: string[];
```

Подстроки в имени файла, по которым узнаём тип документа.

###### Defined in

[types/index.ts:419](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L419)

##### schemaId

```ts
schemaId: BuiltinEntityType;
```

Тип сущности, в карточку которого переносятся реквизиты.

###### Defined in

[types/index.ts:421](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L421)

##### targetLabel

```ts
targetLabel: string;
```

Как называется карточка-приёмник в интерфейсе.

###### Defined in

[types/index.ts:423](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L423)

##### fields

```ts
fields: ExtractedField[];
```

###### Defined in

[types/index.ts:424](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L424)

***

### ExtractionState

#### Properties

##### file

```ts
file: {
  name: string;
  sizeBytes: number;
};
```

###### name

```ts
name: string;
```

###### sizeBytes

```ts
sizeBytes: number;
```

###### Defined in

[types/index.ts:428](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L428)

##### recipe

```ts
recipe: ExtractionRecipe;
```

###### Defined in

[types/index.ts:429](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L429)

##### step

```ts
step: number;
```

−1 — ещё не начали, далее индекс текущего шага, 3 — разбор закончен.

###### Defined in

[types/index.ts:431](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L431)

##### status

```ts
status: GenerationStatus;
```

###### Defined in

[types/index.ts:432](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L432)

##### applied

```ts
applied: boolean;
```

Реквизиты уже перенесены в карточку.

###### Defined in

[types/index.ts:434](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L434)

***

### GeneratedDocument

#### Properties

##### id

```ts
id: string;
```

###### Defined in

[types/index.ts:447](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L447)

##### name

```ts
name: string;
```

###### Defined in

[types/index.ts:448](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L448)

##### entityId

```ts
entityId: string;
```

id сущности либо CUSTOM_REQUEST_GROUP для свободного запроса.

###### Defined in

[types/index.ts:450](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L450)

##### entityName

```ts
entityName: string;
```

###### Defined in

[types/index.ts:451](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L451)

***

### TemplateMatch

#### Properties

##### found

```ts
found: boolean;
```

Нашёлся ли готовый шаблон под запрос.

###### Defined in

[types/index.ts:467](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L467)

##### name

```ts
name: string;
```

Название шаблона, если нашёлся.

###### Defined in

[types/index.ts:469](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L469)

## Type Aliases

### CaseStatus

```ts
type CaseStatus: "in_progress" | "collecting" | "active" | "archived";
```

#### Defined in

[types/index.ts:5](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L5)

***

### BuiltinEntityType

```ts
type BuiltinEntityType: "real_estate" | "legal_entity" | "individual";
```

#### Defined in

[types/index.ts:53](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L53)

***

### DocumentStatus

```ts
type DocumentStatus: "draft" | "ready" | "signed" | "generating";
```

#### Defined in

[types/index.ts:249](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L249)

***

### RiskLevel

```ts
type RiskLevel: "critical" | "warning" | "info";
```

#### Defined in

[types/index.ts:287](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L287)

***

### GenerationStatus

```ts
type GenerationStatus: "idle" | "running" | "done";
```

#### Defined in

[types/index.ts:441](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L441)

***

### FreeformStage

```ts
type FreeformStage: "idle" | "searching" | "composing" | "done";
```

Свободный запрос проходит две видимые стадии: сначала система ищет
подходящий шаблон, потом составляет документ. Пользователю важно знать,
подставились реквизиты в готовую форму или документ собран с нуля.

#### Defined in

[types/index.ts:463](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L463)

## Variables

### CASE\_STATUS\_META

```ts
const CASE_STATUS_META: Record<CaseStatus, {
  label: string;
  badgeClassName: string;
  dotClassName: string;
}>;
```

Статусы дела набираются как рубрики лендинга: моноширинная строка на
прозрачном фоне, цветом отмечена только точка. Плашки с заливкой на
продуктовых экранах спорят с содержимым таблиц.

#### Defined in

[types/index.ts:23](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L23)

***

### REAL\_ESTATE\_SCHEMA

```ts
const REAL_ESTATE_SCHEMA: EntitySchema;
```

#### Defined in

[types/index.ts:92](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L92)

***

### LEGAL\_ENTITY\_SCHEMA

```ts
const LEGAL_ENTITY_SCHEMA: EntitySchema;
```

#### Defined in

[types/index.ts:145](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L145)

***

### INDIVIDUAL\_SCHEMA

```ts
const INDIVIDUAL_SCHEMA: EntitySchema;
```

#### Defined in

[types/index.ts:194](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L194)

***

### BUILTIN\_SCHEMAS

```ts
const BUILTIN_SCHEMAS: EntitySchema[];
```

#### Defined in

[types/index.ts:239](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L239)

***

### DOCUMENT\_STATUS\_META

```ts
const DOCUMENT_STATUS_META: Record<DocumentStatus, {
  label: string;
  className: string;
}>;
```

#### Defined in

[types/index.ts:261](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L261)

***

### RISK\_LEVEL\_META

```ts
const RISK_LEVEL_META: Record<RiskLevel, {
  label: string;
  cardClassName: string;
  badgeClassName: string;
  iconClassName: string;
}>;
```

#### Defined in

[types/index.ts:322](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L322)

***

### EXTRACTION\_STEPS

```ts
const EXTRACTION_STEPS: readonly ["Распознавание текста", "Поиск реквизитов", "Сверка форматов"];
```

Шаги разбора — те же, что показаны на лендинге.

#### Defined in

[types/index.ts:397](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L397)

***

### CUSTOM\_REQUEST\_GROUP

```ts
const CUSTOM_REQUEST_GROUP: "custom-request" = "custom-request";
```

Псевдо-группа для документов, созданных свободным запросом.

#### Defined in

[types/index.ts:444](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/index.ts#L444)
