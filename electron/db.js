import Database from 'better-sqlite3';
import path from 'node:path';
import { app } from 'electron';

const dbPath = path.join(app.getPath('userData'), 'dblens-dummy.db');

export const db = new Database(dbPath, { readonly: false });

db.pragma('journal_mode = WAL');
db.pragma(`mmap_size = ${2 ** 28}`);
