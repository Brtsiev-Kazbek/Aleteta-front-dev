[aleteya](../../index.md) / lib/auth/validation

# lib/auth/validation

## Interfaces

### PasswordStrength

#### Properties

##### score

```ts
score: 0 | 1 | 2 | 3;
```

0 — пусто, 1 — слабый, 2 — средний, 3 — надёжный.

###### Defined in

[lib/auth/validation.ts:53](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/auth/validation.ts#L53)

##### label

```ts
label: string;
```

###### Defined in

[lib/auth/validation.ts:54](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/auth/validation.ts#L54)

## Variables

### PASSWORD\_MIN\_LENGTH

```ts
const PASSWORD_MIN_LENGTH: 8 = 8;
```

Минимальная длина пароля. Supabase допускает 6, мы требуем больше.

#### Defined in

[lib/auth/validation.ts:11](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/auth/validation.ts#L11)

## Functions

### validateEmail()

```ts
function validateEmail(value): string | null
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `string` |

#### Returns

`string` \| `null`

#### Defined in

[lib/auth/validation.ts:20](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/auth/validation.ts#L20)

***

### validatePassword()

```ts
function validatePassword(value): string | null
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `string` |

#### Returns

`string` \| `null`

#### Defined in

[lib/auth/validation.ts:28](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/auth/validation.ts#L28)

***

### validateFullName()

```ts
function validateFullName(value): string | null
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `string` |

#### Returns

`string` \| `null`

#### Defined in

[lib/auth/validation.ts:43](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/auth/validation.ts#L43)

***

### measurePassword()

```ts
function measurePassword(value): PasswordStrength
```

Оценка пароля для полоски под полем. Считает не «сложность по формуле», а
то, что действительно мешает перебору: длину и разнообразие символов.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `string` |

#### Returns

[`PasswordStrength`](validation.md#passwordstrength)

#### Defined in

[lib/auth/validation.ts:61](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/auth/validation.ts#L61)
