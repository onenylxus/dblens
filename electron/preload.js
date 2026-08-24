import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('dbAPI', {
  chooseDatabase: () => ipcRenderer.invoke('db:choose'),
  tables: () => ipcRenderer.invoke('db:tables'),
  tableData: (tableName, limit, offset) =>
    ipcRenderer.invoke('db:table-data', tableName, limit, offset),
  all: (sql, params) => ipcRenderer.invoke('db:all', sql, params),
  get: (sql, params) => ipcRenderer.invoke('db:get', sql, params),
});
