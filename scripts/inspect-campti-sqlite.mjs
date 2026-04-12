import Database from "better-sqlite3";

const path = process.argv[2] || "c:/Users/User/Downloads/campti_census.sqlite";
const db = new Database(path, { readonly: true });
const tables = db
  .prepare(
    "SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
  )
  .all();
for (const t of tables) {
  console.log("---", t.name, "---");
  console.log(t.sql);
  const n = db.prepare(`SELECT COUNT(*) as c FROM "${t.name}"`).get();
  console.log("rows:", n.c);
}
db.close();
