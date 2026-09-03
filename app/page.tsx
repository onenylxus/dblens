'use client';

import { DatabaseEmptyState } from '@/components/DatabaseEmptyState';
import { DataTable } from '@/components/DataTable';
import { DatabaseHeader } from '@/components/DatabaseHeader';
import { PaginationControls } from '@/components/PaginationControls';
import { SearchPanel } from '@/components/SearchPanel';
import { TableSelector } from '@/components/TableSelector';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useDatabase } from '../hooks/useDatabase';

export default function Home() {
  const {
    databasePath,
    tables,
    selectedTable,
    columns,
    rows,
    total,
    page,
    loading,
    choosingDatabase,
    error,
    searchMode,
    setSearchMode,
    basicInput,
    setBasicInput,
    advancedInput,
    setAdvancedInput,
    chooseDatabase,
    selectTable,
    applySearch,
    clearSearch,
    setPage,
    pageSize,
  } = useDatabase();

  function displayValue(value: unknown) {
    if (value === null || value === undefined) return 'NULL';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }

  const pageCount = Math.ceil(total / pageSize);

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
