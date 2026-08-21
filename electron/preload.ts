import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('dbAPI', {
  all: (sql: string, params?: unknown[]) =>
    ipcRenderer.invoke('db:all', sql, params),

  get: (sql: string, params?: unknown[]) =>
    ipcRenderer.invoke('db:get', sql, params),
});
