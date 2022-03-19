import { Collection, DB, _ } from "../deps.ts";

/**
 * Simple and easy to use key-v Sqlite Provider for deno
 * @param databaseFilePath The filepath for the `.sqlite` file.
 * @param tablename The name of the table for storing data.
 * ```ts
 * const db = new DB("./database.sqlite", "userinfo")
 * ```
 */
export class SqliteProvider {
  private db: DB;
  collection: Collection;
  private tablename: string;

  constructor(databaseFilePath: string, tablename: string) {
    this.db = new DB(databaseFilePath);
    this.db.query(
      `CREATE TABLE IF NOT EXISTS ${tablename}(id INTEGER PRIMARY KEY AUTOINCREMENT, key TEXT, value TEXT)`
    );
    this.tablename = tablename;
    this.collection = new Collection();
  }

  /**
   * Initiate the database.
   * ```ts
   * db.init();
   * ```
   */
  init() {
    [
      ...this.db.query(`SELECT * FROM ${this.tablename}`).asObjects(),
    ].forEach((row) => this.collection.set(row.key, row.value));
  }
  /**
   * Delete a value in the database
   * @param key Key to be deleted
   * ```ts
   * db.delete("john");
   * ```
   */
  delete(key: string) {
    this.db.query(`DELETE FROM ${this.tablename} WHERE key = ?`, [key])
    this.collection.delete(key);
  }

  /**
   * Set a value to the database
   * @param key The key to the value
   * @param value The value
   * @returns The updated value in the database.
   * ```ts
   * db.set("john.gender", "male");
   * ```
   */
  set(key: string, value: any) {
    const unparsed = key.split(".");
    key = `${unparsed.shift()}`;

    const cachedData = this.collection.get(key) || {};
    let lodashedData = _.set(
      cachedData,
      unparsed.length > 1 ? unparsed : key,
      value
    );

    if (unparsed.length > 1) {
      this.collection.set(key, lodashedData);
    } else {
      this.collection.set(key, value);
      lodashedData = value;
    }

    let fetchQuery = [
      ...this.db
        .query(`SELECT * FROM ${this.tablename} WHERE key = ?`, [key])
        .asObjects(),
    ];

    if (fetchQuery.length < 0) {
      this.db.query(
        `INSERT INTO ${this.tablename} (key, value) VALUES (?, ?)`,
        [key, JSON.stringify(lodashedData)]
      );
      fetchQuery = [
        ...this.db
          .query(`SELECT * FROM ${this.tablename} WHERE key = ?`, [key])
          .asObjects(),
      ];
    }
    this.db.query(`UPDATE ${this.tablename} SET value = ? WHERE key = ?`, [
      JSON.stringify(lodashedData),
      key,
    ]);
    return [
      ...this.db
        .query(`SELECT * FROM ${this.tablename} WHERE key = ?`, [key])
        .asObjects(),
    ][0];
  }

  /**
   * Get a value from the database
   * @param  key The value you want to get.
   * @param default The default value to get if the original key wasnt found.
   * @returns  The value fetched from the database.
   * ```ts
   * const john = db.get("john")
   * ```
   */
  get(key: string, defaultValue: any = "") {
    let data;
    let collection;

    if (key.includes(".")) {
      const array = key.split(".");
      collection = this.collection.get(array[0]);
      const exists = this.collection.has(array[0]);
      array.shift();
      const prop = array.join(".");
      if (!exists) {
        this.set(key, defaultValue);
      }
      data = _.get(collection, prop, null);
    } else {
      const exists = this.collection.has(key);
      if (!exists) {
        this.set(key, defaultValue);
      }
      data = this.collection.get(key);
    }

    return data;
  }

  /**
   * Alias to the `.get` method.
   */
  fetch(key: string, defaultValue: any = "") {
    this.get(key, defaultValue);
  }

  /**
   * Push a item to a array. If the array does not exist, then it will make a new array!
   * @param key The key to the array in the database.
   * @param value The value to add in the array.
   * @returns The updated value of the key
   * ```ts
   * db.push("john.children", "Suzy");
   * ```
   */
  push(key: string, ...value: any[]) {
    const fetched = this.get(key);
    for (let v in value) {
      v = value[v];
      if (!fetched) {
        const array = [];
        array.push(v);
        this.set(key, array);
      } else {
        if (!Array.isArray(fetched)) {
          const array = [];
          array.push(fetched);
          array.push(v);
          this.set(key, array);
        } else {
          fetched.push(v);
          this.set(key, fetched);
        }
      }
    }

    return this.get(key);
  }

  /**
   * Select all keys from the database!
   * @returns All the data in the database
   * ```ts
   * const all = db.all();
   * ```
   */
  all() {
    const fetched = [
      ...this.db.query(`SELECT * FROM ${this.tablename}`).asObjects(),
    ];
    const data = new Map();
    for (const o of fetched) data.set(o.key, JSON.parse(o.value));
    return Object.fromEntries(data);
  }

  /**
   * Check if the database contains a specific value or not!
   * @param key - The value to check.
   * @return Whether the database has the key or not
   * ```ts
   * const result = db.has("john");
   * ```
   */
  has(key: string) {
    if (key.includes(".")) {
      const split = key.split(".");
      const collection = this.get(`${split.shift()}`);
      const prop = split.join(".");
      return _.has(collection, prop);
    }
    return this.collection.has(key);
  }


}
