import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { env } from "../env.js";

export interface Sql {
  <T = Record<string, unknown>>(strings: TemplateStringsArray, ...values: unknown[]): Promise<T[]>;
  query<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<T[]>;
}

type Run = <T>(text: string, params: unknown[]) => Promise<T[]>;

function toSql(run: Run): Sql {
  const sql = (async <T = Record<string, unknown>>(strings: TemplateStringsArray, ...values: unknown[]) => {
    let text = strings[0];
    for (let i = 0; i < values.length; i += 1) text += `$${i + 1}${strings[i + 1]}`;
    return run<T>(text, values);
  }) as unknown as Sql;
  sql.query = <T = Record<string, unknown>>(text: string, params: unknown[] = []) => run<T>(text, params);
  return sql;
}

async function createRunner(): Promise<{ run: Run; exec: (text: string) => Promise<void> }> {
  if (env.databaseUrl) {
    const { default: pg } = await import("pg");
    const pool = new pg.Pool({ connectionString: env.databaseUrl });
    return {
      run: async <T,>(text: string, params: unknown[]) => (await pool.query(text, params)).rows as T[],
      exec: async (text) => {
        await pool.query(text);
      },
    };
  }
  const { PGlite } = await import("@electric-sql/pglite");
  const db = new PGlite("./.pglite");
  return {
    run: async <T,>(text: string, params: unknown[]) => (await db.query(text, params)).rows as T[],
    exec: async (text) => {
      await db.exec(text);
    },
  };
}

async function migrate(run: Run, exec: (t: string) => Promise<void>) {
  await exec("CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())");
  const applied = new Set((await run<{ name: string }>("SELECT name FROM _migrations", [])).map((r) => r.name));
  const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "migrations");
  const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();
  for (const name of files) {
    if (applied.has(name)) continue;
    await exec(await readFile(join(dir, name), "utf8"));
    await run("INSERT INTO _migrations (name) VALUES ($1)", [name]);
    console.log(`[db] applied ${name}`);
  }
}

let ready: Promise<Sql> | undefined;

/** Connects once, applies pending migrations, returns the tagged-template SQL helper. */
export function getSql(): Promise<Sql> {
  ready ??= (async () => {
    const { run, exec } = await createRunner();
    await migrate(run, exec);
    console.log(`[db] ready (${env.databaseUrl ? "postgres" : "pglite"})`);
    return toSql(run);
  })().catch((err) => {
    ready = undefined; // allow retry after a failed init
    throw err;
  });
  return ready;
}
