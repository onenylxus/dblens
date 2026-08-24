import { app, BrowserWindow, ipcMain } from 'electron';
import net from 'net';
import path, { dirname } from 'path';
import { spawn } from 'child_process';
import { db } from './db.js';
import { fileURLToPath } from 'url';

// Directory aliases
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Constants
const HOST = '127.0.0.1';
const PORT = Number(process.env.PORT) || 3000;
const RETRY_LIMIT = 150;
const RETRY_INTERVAL = 100;

const CSP = [
  "default-src 'self'",
  `script-src 'self' http://${HOST}:${PORT}`,
  "style-src 'self' 'unsafe-inline'",
  `connect-src 'self' http://${HOST}:${PORT} ws://${HOST}:${PORT}`,
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

  win.loadURL(`http://${HOST}:${PORT}`);
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

  const command = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
  const mode = app.isPackaged ? 'start' : 'dev';
  const port = String(PORT);
  nextProcess.current = spawn(command, ['exec', 'next', mode, '-p', port], {
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
ipcMain.handle('db:all', (_event, sql, params) => {
  const stmt = db.prepare(sql);
  return stmt.all(...(params ?? []));
});

ipcMain.handle('db:get', (_event, sql, params) => {
  const stmt = db.prepare(sql);
  return stmt.get(...(params ?? []));
});
