import type { Column, Row, TableInfo } from '@/components/types';

declare global {
  interface Window {
    dbAPI: {
      chooseDatabase(): Promise<string | null>;
      tables(): Promise<TableInfo[]>;
      tableData(
        tableName: string,
        limit: number,
        offset: number,
      ): Promise<{
        columns: Column[];
        rows: Row[];
        total: number;
      }>;
      searchData(
        tableName: string,
        limit: number,
        offset: number,
        keyword: string,
      ): Promise<{
        columns: Column[];
        rows: Row[];
        total: number;
      }>;
      sqlData(
        sql: string,
        limit: number,
        offset: number,
      ): Promise<{
        columns: Column[];
        rows: Row[];
        total: number;
      }>;
    };
  }
}

export {};
