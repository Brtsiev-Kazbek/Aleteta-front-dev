[aleteya](../../index.md) / lib/data/bootstrap

# lib/data/bootstrap

## Functions

### loadWorkspaceSnapshot()

```ts
function loadWorkspaceSnapshot(): Promise<StoreSnapshot | null>
```

Данные рабочей области для первой отрисовки.

Возвращает null, когда базы нет или человек не вошёл: в этом случае
интерфейс остаётся на встроенном наборе. Так стенд открывается и на свежем
клоне без переменных окружения.

#### Returns

`Promise`\<[`StoreSnapshot`](../../store/useAppStore.md#storesnapshot) \| `null`\>

#### Defined in

[lib/data/bootstrap.ts:20](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/data/bootstrap.ts#L20)
