import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('dbAPI', {
  all: (sql, params) => ipcRenderer.invoke('db:all', sql, params),
  get: (sql, params) => ipcRenderer.invoke('db:get', sql, params),
});