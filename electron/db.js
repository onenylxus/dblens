import Database from 'better-sqlite3';

let database = null;

export function openDatabase(dbPath) {
  database?.close();
  database = new Database(dbPath, { readonly: true });
  database.pragma(`mmap_size = ${2 ** 28}`);
}

export function getDatabase() {
  if (!database) throw new Error('No database has been selected');
  return database;
}

export function closeDatabase() {
  database?.close();
  database = null;
}
