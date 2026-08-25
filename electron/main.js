import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import net from 'net';
import path, { dirname } from 'path';
import { spawn } from 'child_process';
import { closeDatabase, getDatabase, openDatabase } from './db.js';
import { fileURLToPath } from 'url';

// Directory aliases
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Constants
const HOST = '127.0.0.1';
const PORT = Number(process.env.PORT) || 3000;
const HTTP_URL = `http://${HOST}:${PORT}`;
const WS_URL = `ws://${HOST}:${PORT}`;
const RETRY_LIMIT = 150;
const RETRY_INTERVAL = 100;

const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${app.isPackaged ? '' : " 'unsafe-eval'"} ${HTTP_URL}`,
  "style-src 'self' 'unsafe-inline'",
  `connect-src 'self' ${HTTP_URL} ${WS_URL}`,
].join('; ');

// Variables
const nextProcess = { current: null };

// Functions

/**
 * Creates the main application window and loads the Next.js application.
 */
function createWindow() {
  const win = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [CSP],
      },
    });
  });

  win.loadURL(HTTP_URL);
}

/**
 * Checks if the Next.js server is ready to receive requests.
 *
 * @returns A promise that resolves to true if the server is ready, false otherwise.
 */
function isServerReady() {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: HOST, port: PORT });
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('error', () => resolve(false));
  });
}

/**
 * Starts the Next.js server if it is not running.
 *
 * @throws If the server does not start within the retry limit.
 */
async function startNextServer() {
  if (await isServerReady()) return;

  const mode = app.isPackaged ? 'start' : 'dev';
  const port = String(PORT);
  const isWindows = process.platform === 'win32';
  const command = isWindows ? process.env.ComSpec || 'cmd.exe' : 'pnpm';
  const args = isWindows
    ? ['/d', '/s', '/c', `pnpm exec next ${mode} -p ${port}`]
    : ['exec', 'next', mode, '-p', port];

  nextProcess.current = spawn(command, args, {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, PORT: port },
    stdio: 'inherit',
  });

  for (let attempt = 0; attempt < RETRY_LIMIT; attempt++) {
    if (await isServerReady()) return;
    await new Promise((resolve) => setTimeout(resolve, RETRY_INTERVAL));
  }

  throw new Error(`Next.js server did not start on port ${PORT}`);
}

/**
 * Stops the Next.js server if it is running.
 */
function stopNextServer() {
  nextProcess.current?.kill();
  nextProcess.current = null;
}

// Lifecycle
app.whenReady().then(async () => {
  await startNextServer();
  createWindow();
});

app.on('before-quit', stopNextServer);

// IPC Handlers
ipcMain.handle('db:choose', async () => {
  const result = await dialog.showOpenDialog({
    title: 'Choose a SQLite database',
    properties: ['openFile'],
    filters: [
      { name: 'SQLite databases', extensions: ['db', 'sqlite', 'sqlite3'] },
      { name: 'All files', extensions: ['*'] },
    ],
  });

  if (result.canceled || result.filePaths.length === 0) return null;

  openDatabase(result.filePaths[0]);
  return result.filePaths[0];
});

ipcMain.handle('db:tables', () => {
  return getDatabase()
    .prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
    )
    .all();
});

ipcMain.handle('db:table-data', (_event, tableName, limit, offset) => {
  const database = getDatabase();
  const escapedName = `"${String(tableName).replaceAll('"', '""')}"`;
  const columns = database.prepare(`PRAGMA table_info(${escapedName})`).all();
  const rows = database
    .prepare(`SELECT * FROM ${escapedName} LIMIT ? OFFSET ?`)
    .all(limit, offset);
  const total = database
    .prepare(`SELECT COUNT(*) AS count FROM ${escapedName}`)
    .get().count;

  return { columns, rows, total };
});

ipcMain.handle(
  'db:search-data',
  (_event, tableName, limit, offset, keyword) => {
    const database = getDatabase();
    const escapedName = `"${String(tableName).replaceAll('"', '""')}"`;
    const columns = database.prepare(`PRAGMA table_info(${escapedName})`).all();
    const term = `%${String(keyword ?? '').trim()}%`;

    // Build a WHERE clause that checks every column for a partial text match.
    const whereClause =
      columns.length === 0
        ? '1 = 0'
        : columns
            .map((column) => {
              const escapedColumn = `"${String(column.name).replaceAll('"', '""')}"`;
              return `CAST(${escapedColumn} AS TEXT) LIKE ?`;
            })
            .join(' OR ');

    const queryParams = new Array(columns.length).fill(term);
    const rows = database
      .prepare(
        `SELECT * FROM ${escapedName} WHERE ${whereClause} LIMIT ? OFFSET ?`,
      )
      .all(...queryParams, limit, offset);
    const total = database
      .prepare(
        `SELECT COUNT(*) AS count FROM ${escapedName} WHERE ${whereClause}`,
      )
      .get(...queryParams).count;

    return { columns, rows, total };
  },
);

ipcMain.handle('db:sql-data', (_event, sql, limit, offset) => {
  const trimmedSql = String(sql ?? '').trim();
  if (!/^select\b/i.test(trimmedSql)) {
    throw new Error('Advanced mode only supports SELECT queries.');
  }

  const database = getDatabase();
  const baseSql = trimmedSql.replace(/;\s*$/, '');
  const pagedSql = `SELECT * FROM (${baseSql}) AS query LIMIT ? OFFSET ?`;
  const countSql = `SELECT COUNT(*) AS count FROM (${baseSql}) AS query`;

  const rows = database.prepare(pagedSql).all(limit, offset);
  const columnDetails = database.prepare(baseSql).columns();
  const columns = columnDetails.map((column) => ({
    name: column.name,
    type: 'query',
  }));
  const total = database.prepare(countSql).get().count;

  return { columns, rows, total };
});

ipcMain.handle('db:all', (_event, sql, params) => {
  const stmt = getDatabase().prepare(sql);
  return stmt.all(...(params ?? []));
});

ipcMain.handle('db:get', (_event, sql, params) => {
  const stmt = getDatabase().prepare(sql);
  return stmt.get(...(params ?? []));
});

app.on('will-quit', closeDatabase);
