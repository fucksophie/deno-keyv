# PostgreSQL Provider

---

```ts
import {PostgresProvider} from "https://deno.land/x/keyv/mod.ts";
```

### new PostgresProvider(tableName, user, database, hostname, password, port?)

This returns a instance of the DB class.

```ts
const db = new DB("userinfo", "postgres", "denokeyv", "localhost", "somepassword");
```
Port is optional and defaults to 5432.

---

- ### `async` #init()

Adding this method after you create a new instance of the database is very important as without this, the data won't be synced properly.

```ts
db.init();
```

---

- ### `async` #set(key, value)

This sets a value to the database and returns the new value of the key.

```ts
const data = await db.set("user", { money: 100 });
```

---

- ### `async` #get(key, defaultValue)

This fetches the value from the database and returns it.

```ts
const data = await db.get("user"); // -> {"money": 100}
const money = await db.get("user.money"); // -> 100
```

You can also define a default value to return if the provided key was not found.

```ts
const items = await db.get("user.items", "No Items Found"); // -> "No Items Found"
```

---

- ### `async` #fetch(key, defaultValue)

An alias to the `#get` method.

---

- ### `async` #push(key, value)

Pushes a item to the array. It will create a new array if the target value is not a array.

```ts
// Data -> {"money": 100, "items": [], "armour": "Chestplate"}
await db.push("user.items", "Apple");
// Data -> {"money": 100, "items": ['Apple'], "armour": "Chestplate"}
await db.push("user.armour", "Helmet");
// Data -> {"money": 100, "items": ['Apple'], "armour": ["Chestplate", "Helmet"]}
await db.push("user.weapons", "Sword");
// Data -> {"money": 100, "items": ['Apple'], "armour": ["Chestplate", "Helmet"],"weapons": ['Sword']}
```

You can also push mulitple value to the key.

```ts
await db.push("user.items", "Banana", "Magic Book");
// Data -> {"money": 100, "items": ["Apple", "Banana", "Magic Book"], "armour": ["Chestplate", "Helmet"],"weapons": ['Sword']}
```

---

- ### `async` #all()

Returns all the data in the database.

```ts
await db.all();
// -> {'user': {"money": 100, "items": ['Apple'], "armour": ["Chestplate", "Helmet"],"weapons": ['Sword']}}
```

---

- ### `async` #has()

Checks if the database has a key.

```ts
await db.has("user"); // -> true
await db.has("bird"); // -> false
await db.has("user.money"); // -> true
```
