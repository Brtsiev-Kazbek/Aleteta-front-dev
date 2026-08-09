[aleteya](../../index.md) / lib/auth/site-url

# lib/auth/site-url

## Functions

### getSiteUrl()

```ts
function getSiteUrl(): string
```

Адрес, на который возвращают ссылки из писем.

Жёстко прописать нельзя: тот же код работает на localhost, на превью-сборке
Netlify и на боевом домене. Сначала смотрим переменную окружения — она нужна
для писем, отправляемых вне запроса, — иначе собираем адрес из заголовков
текущего запроса.

#### Returns

`string`

#### Defined in

[lib/auth/site-url.ts:13](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/auth/site-url.ts#L13)

***

### safeNextPath()

```ts
function safeNextPath(value): string
```

Внутренний путь для возврата после входа.

Принимаем только относительные пути: адрес приходит из строки запроса, и без
проверки страница входа превращается в открытый редирект — удобную площадку
для фишинга под нашим доменом.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `undefined` \| `null` \| `string` |

#### Returns

`string`

#### Defined in

[lib/auth/site-url.ts:35](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/auth/site-url.ts#L35)
