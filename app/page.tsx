'use client';

import { useEffect, useState } from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

type Column = { name: string; type: string };
type Row = Record<string, unknown>;
type TableInfo = { name: string };
type SearchMode = 'basic' | 'advanced';

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
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>SQLite database</CardTitle>
              <CardDescription>
                {databasePath ?? 'Choose a database file to begin'}
              </CardDescription>
            </div>
            {databasePath && (
              <Button
                variant="outline"
                onClick={chooseDatabase}
                disabled={choosingDatabase}
              >
                Choose database
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!databasePath && (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <p className="text-muted-foreground">No database loaded.</p>
              <Button onClick={chooseDatabase} disabled={choosingDatabase}>
                {choosingDatabase ? 'Opening chooser...' : 'Choose database'}
              </Button>
            </div>
          )}

          {databasePath && tables.length === 0 && !error && (
            <p className="text-muted-foreground">No tables found.</p>
          )}

          {tables.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {tables.map((table) => (
                <Button
                  key={table.name}
                  variant={selectedTable === table.name ? 'default' : 'outline'}
                  onClick={() => selectTable(table.name)}
                >
                  {table.name}
                </Button>
              ))}
            </div>
          )}

          {selectedTable && (
            <div className="mb-4 rounded-md border p-3">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Button
                  variant={searchMode === 'basic' ? 'default' : 'outline'}
                  onClick={() => setSearchMode('basic')}
                  size="sm"
                >
                  Basic mode
                </Button>
                <Button
                  variant={searchMode === 'advanced' ? 'default' : 'outline'}
                  onClick={() => setSearchMode('advanced')}
                  size="sm"
                >
                  Advanced mode
                </Button>
              </div>

              {searchMode === 'basic' ? (
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    className="h-9 w-full rounded-md border bg-background px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    placeholder="Search any column by keyword (partial matches supported)"
                    value={basicInput}
                    onChange={(event) => setBasicInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') applySearch();
                    }}
                  />
                  <div className="flex gap-2">
                    <Button onClick={applySearch} disabled={loading}>
                      Search
                    </Button>
                    <Button
                      variant="outline"
                      onClick={clearSearch}
                      disabled={loading}
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <input
                    className="h-9 w-full rounded-md border bg-background px-3 text-sm font-mono outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    placeholder='Example: SELECT * FROM "table_name" WHERE status = "active"'
                    value={advancedInput}
                    onChange={(event) => setAdvancedInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') applySearch();
                    }}
                  />
                  <div className="flex gap-2">
                    <Button onClick={applySearch} disabled={loading}>
                      Run query
                    </Button>
                    <Button
                      variant="outline"
                      onClick={clearSearch}
                      disabled={loading}
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {selectedTable && (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {columns.map((column) => (
                      <TableHead key={column.name}>{column.name}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell
                        colSpan={Math.max(columns.length, 1)}
                        className="h-24 text-center text-muted-foreground"
                      >
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : rows.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={Math.max(columns.length, 1)}
                        className="h-24 text-center text-muted-foreground"
                      >
                        No rows found
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((row, rowIndex) => (
                      <TableRow key={rowIndex}>
                        {columns.map((column) => (
                          <TableCell key={column.name}>
                            {displayValue(row[column.name])}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
          {selectedTable && pageCount > 1 && (
            <div className="mt-4 flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">
                Page {page + 1} of {pageCount} ({total} rows)
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={page === 0 || loading}
                  onClick={() => setPage((value) => value - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  disabled={page + 1 >= pageCount || loading}
                  onClick={() => setPage((value) => value + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
