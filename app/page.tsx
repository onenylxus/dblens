'use client';

import { useEffect, useState } from 'react';
import { DatabaseEmptyState } from '@/components/database-empty-state';
import { DataTable } from '@/components/data-table';
import { DatabaseHeader } from '@/components/database-header';
import { PaginationControls } from '@/components/pagination-controls';
import { SearchPanel } from '@/components/search-panel';
import { TableSelector } from '@/components/table-selector';
import type {
  Column,
  Row,
  SearchMode,
  TableInfo,
} from '@/components/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

const PAGE_SIZE = 50;

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

export default function Home() {
  const [databasePath, setDatabasePath] = useState<string | null>(null);
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [columns, setColumns] = useState<Column[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [choosingDatabase, setChoosingDatabase] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchMode, setSearchMode] = useState<SearchMode>('basic');
  const [basicInput, setBasicInput] = useState('');
  const [advancedInput, setAdvancedInput] = useState('');
  const [appliedBasicSearch, setAppliedBasicSearch] = useState('');
  const [appliedAdvancedSql, setAppliedAdvancedSql] = useState('');

  useEffect(() => {
    if (!selectedTable) return;
    const tableName = selectedTable;
    let cancelled = false;

    async function loadTable() {
      setLoading(true);
      setError(null);
      try {
        const offset = page * PAGE_SIZE;
        const result = appliedAdvancedSql.trim()
          ? await window.dbAPI.sqlData(appliedAdvancedSql, PAGE_SIZE, offset)
          : appliedBasicSearch.trim()
            ? await window.dbAPI.searchData(
                tableName,
                PAGE_SIZE,
                offset,
                appliedBasicSearch,
              )
            : await window.dbAPI.tableData(tableName, PAGE_SIZE, offset);

        if (!cancelled) {
          setColumns(result.columns);
          setRows(result.rows);
          setTotal(result.total);
        }
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadTable();
    return () => {
      cancelled = true;
    };
  }, [selectedTable, page, appliedBasicSearch, appliedAdvancedSql]);

  async function chooseDatabase() {
    setChoosingDatabase(true);
    setError(null);
    try {
      const path = await window.dbAPI.chooseDatabase();
      if (!path) return;
      const nextTables = await window.dbAPI.tables();
      setDatabasePath(path);
      setTables(nextTables);
      setSelectedTable(null);
      setRows([]);
      setColumns([]);
      setPage(0);
      setSearchMode('basic');
      setBasicInput('');
      setAdvancedInput('');
      setAppliedBasicSearch('');
      setAppliedAdvancedSql('');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setChoosingDatabase(false);
    }
  }

  function selectTable(tableName: string) {
    setSelectedTable(tableName);
    setPage(0);
    setBasicInput('');
    setAppliedBasicSearch('');
    const defaultSql = `SELECT * FROM "${tableName.replaceAll('"', '""')}"`;
    setAdvancedInput(defaultSql);
    setAppliedAdvancedSql('');
  }

  function applySearch() {
    if (!selectedTable) return;

    setError(null);
    setPage(0);
    if (searchMode === 'basic') {
      setAppliedBasicSearch(basicInput.trim());
      setAppliedAdvancedSql('');
      return;
    }

    const sql = advancedInput.trim();
    if (!sql) {
      setError('Enter a SELECT query for advanced mode.');
      return;
    }

    setAppliedAdvancedSql(sql);
    setAppliedBasicSearch('');
  }

  function clearSearch() {
    setError(null);
    setPage(0);
    setBasicInput('');
    setAppliedBasicSearch('');
    setAppliedAdvancedSql('');
    if (selectedTable) {
      setAdvancedInput(
        `SELECT * FROM "${selectedTable.replaceAll('"', '""')}"`,
      );
    } else {
      setAdvancedInput('');
    }
  }

  function displayValue(value: unknown) {
    if (value === null || value === undefined) return 'NULL';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }

  const pageCount = Math.ceil(total / PAGE_SIZE);

  return (
    <main className="min-h-screen bg-background p-6">
      <Card className="mx-auto max-w-6xl">
        <CardHeader>
          <DatabaseHeader
            databasePath={databasePath}
            choosingDatabase={choosingDatabase}
            onChooseDatabase={chooseDatabase}
          />
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!databasePath && (
            <DatabaseEmptyState
              choosingDatabase={choosingDatabase}
              onChooseDatabase={chooseDatabase}
            />
          )}

          {databasePath && tables.length === 0 && !error && (
            <p className="text-muted-foreground">No tables found.</p>
          )}

          <TableSelector
            tables={tables}
            selectedTable={selectedTable}
            onSelectTable={selectTable}
          />

          {selectedTable && (
            <SearchPanel
              searchMode={searchMode}
              setSearchMode={setSearchMode}
              basicInput={basicInput}
              setBasicInput={setBasicInput}
              advancedInput={advancedInput}
              setAdvancedInput={setAdvancedInput}
              onApplySearch={applySearch}
              onClearSearch={clearSearch}
              loading={loading}
            />
          )}

          {selectedTable && (
            <DataTable
              columns={columns}
              rows={rows}
              loading={loading}
              displayValue={displayValue}
            />
          )}
          {selectedTable && (
            <PaginationControls
              page={page}
              pageCount={pageCount}
              total={total}
              loading={loading}
              onPrevious={() => setPage((value) => value - 1)}
              onNext={() => setPage((value) => value + 1)}
            />
          )}
        </CardContent>
      </Card>
    </main>
  );
}
