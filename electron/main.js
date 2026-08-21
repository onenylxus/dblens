import { app, BrowserWindow, ipcMain } from 'electron';
import path, { dirname } from 'node:path';
import { db } from './db.js';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CSP = [
  "default-src 'self'",
  "script-src 'self' http://localhost:3000",
  "style-src 'self' 'unsafe-inline'",
  "connect-src 'self' http://localhost:3000",
].join('; ');

function createWindow() {
  const win = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
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

  win.loadURL('http://localhost:3000');
}

app.whenReady().then(createWindow);

ipcMain.handle('db:all', (_event, sql, params) => {
  const stmt = db.prepare(sql);
  return stmt.all(...(params ?? []));
});

ipcMain.handle('db:get', (_event, sql, params) => {
  const stmt = db.prepare(sql);
  return stmt.get(...(params ?? []));
});
