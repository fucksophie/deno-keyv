import { Pool, PoolClient, _, Collection, QueryObjectResult } from "../deps.ts";


/**
 * Simple and easy to use key-v PostgreSQL provider for Deno.
 * @param tablename The name of the table in the database
 * @param user The name of the user of the database
 * @param database The name of the database
 * @param hostname The name of the host
 * @param password The password to the user
 * @param port The port on which the database is hosted
 * ```ts
 * const db = new DB("userinfo", "postgres", "denokeyv", "localhost", "somepassword");
 * ```
 */
export class PostgresProvider {
  private db: Pool;
  private collection: Collection;
  private tablename: string;
  private clientOptions = {};

  constructor(
    tablename: string,
    user: string,
    database: string,
    hostname: string,
    password: string,
    port?: number
  ) {
    this.clientOptions = {
      user,
      database,
      hostname,
      password,
      port: port || 5432,
    };
    this.tablename = tablename;
    this.collection = new Collection();
    this.db = new Pool(this.clientOptions, 20);
  }

  private async runQuery(query: string, ...args: any[]) {
    const client: PoolClient = await this.db.connect();
    const dbResult: QueryObjectResult<Record<string, string>> = await client.queryObject(query, ...args);
    client.release();
    return dbResult.rows;
  }
  
  /**
   * Delete a value in the database
   * @param key Key to be deleted
   * ```ts
   * await db.delete("john");
   * ```
   */
   async delete(key: string) {
    await this.runQuery(
      `DELETE FROM ${this.tablename} WHERE key = $1;`,
      key
    )
    this.collection.delete(key);
  }

  /**
   * Initiate the database.
   * ```ts
   * await db.init();
   * ```
   */
  async init() {
    await this.runQuery(
      `CREATE TABLE IF NOT EXISTS ${this.tablename}(key TEXT, value TEXT)`
    );
    const all = await this.runQuery(
      `SELECT * FROM ${this.tablename}`
    );
    for (const row of all) {
      this.collection.set(row.key, row.value);
    }
  }

  /**
   * Set a value to the database
   * @param key The key to the value
   * @param value The value
   * @returns The updated value in the database.
   * ```ts
   * await db.set("john.gender", "male");
   * ```
   */
  async set(key: string, value: any) {
    let unparsed;
    if (key.includes(".")) {
      const split = key.split(".");
      key = split[0];
      split.shift();
      unparsed = split;
    }

    const cachedData = this.collection.get(key) || {};
    let lodashedData = _.set(cachedData, unparsed || key, value);

    if (unparsed) {
      this.collection.set(key, lodashedData);
    } else {
      this.collection.set(key, value);
      lodashedData = value;
    }

    let fetchQuery = (
      await this.runQuery(
        `SELECT * FROM ${this.tablename} WHERE key = $1;`,
        key
      )
    );

    if (fetchQuery.length <= 0) {
      await this.runQuery(
        `INSERT INTO ${this.tablename} (key, value) VALUES ($1, $2);`,
        key,
        JSON.stringify(lodashedData)
      );
      fetchQuery = await this.runQuery(
        `SELECT * FROM ${this.tablename} WHERE key = $1`,
        key
      );
    }
    await this.runQuery(
      `UPDATE ${this.tablename} SET value = $1 WHERE key = $2`,
      JSON.stringify(lodashedData),
      key
    );
    return (
      await this.runQuery(`SELECT * FROM ${this.tablename} WHERE key = $1`, key)
    )[0];
  }

  /**
   * Get a value from the database
   * @param  key The value you want to get.
   * @param default The default value to get if the original key wasnt found.
   * @returns  The value fetched from the database.
   * ```ts
   * const john = await db.get("john")
   * ```
   */
  async get(key: string, defaultValue?: string) {
    let data;
    let collection;

    if (key.includes(".")) {
      const array = key.split(".");
      collection = this.collection.get(array[0]);
      const exists = this.collection.has(array[0]);
      array.shift();
      const prop = array.join(".");
      if (!exists) {
        await this.set(key, defaultValue || "");
      }
      data = _.get(collection, prop, null);
    } else {
      const exists = this.collection.has(key);
      if (!exists) {
        await this.set(key, defaultValue || "");
      }
      data = this.collection.get(key);
    }

    return data;
  }

  /**
   * Alias to the `.get` method.
   */
  async fetch(key: string, defaultValue?: string) {
    if (defaultValue) {
      await this.get(key, defaultValue);
      return;
    }
    await this.get(key);
  }

  /**
   * Push a item to a array. If the array does not exist, then it will make a new array!
   * @param key The key to the array in the database.
   * @param value The value to add in the array.
   * @returns The updated value of the key
   * ```ts
   * await db.push("john.children", "Suzy");
   * ```
   */
  async push(key: string, ...value: any[]) {
    const fetched = await this.get(key);
    console.log(`fetched: ${fetched}`);
    console.log(`value: ${value}`);
    for (let v in value) {
      v = value[v];
      if (!fetched) {
        const array = [];
        array.push(v);
        console.log(array);
        await this.set(key, array);
      } else {
        if (!Array.isArray(fetched)) {
          const array = [];
          array.push(fetched);
          array.push(v);
          await this.set(key, array);
        } else {
          fetched.push(v);
          await this.set(key, fetched);
        }
      }
    }

    return await this.get(key);
  }

  /**
   * Select all keys from the database!
   * @returns All the data in the database
   * ```ts
   * const all = await db.all();
   * ```
   */
  async all() {
    const fetched = await this.runQuery(`SELECT * FROM ${this.tablename}`);

    const data = new Map();
    fetched.forEach(o => {
      const value = JSON.parse(o["value"]);
      data.set(o.key, value);
    })
    return Object.fromEntries(data);
  }

  /**
   * Check if the database contains a specific value or not!
   * @param key - The value to check.
   * @return Whether the database has the key or not
   * ```ts
   * const result = await db.has("john");
   * ```
   */
  async has(key: string) {
    if (key.includes(".")) {
      const split = key.split(".");
      const first = split[0];
      const collection = await this.get(first);
      split.shift();
      const prop = split.join(".");
      return _.has(collection, prop);
    }
    return this.collection.has(key);
  }
}
