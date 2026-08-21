import { app, BrowserWindow, ipcMain } from 'electron';
import path, { dirname } from 'path';
import { db } from './db.ts';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  const win = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    win.loadURL('http://localhost:3000');
  } else {
    const appPath = path.join(__dirname, '../.next/standalone');
    win.loadURL('http://localhost:3000');
  }

  mainWindow = win;
}

app.whenReady().then(createWindow);

ipcMain.handle('db:all', (_event, sql: string, params?: unknown[]) => {
  const stmt = db.prepare(sql);
  return stmt.all(...(params ?? []));
});

ipcMain.handle('db:get', (_event, sql: string, params?: unknown[]) => {
  const stmt = db.prepare(sql);
  return stmt.get(...(params ?? []));
});