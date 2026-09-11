import { Button } from '@/components/ui/button';

import type { TableInfo } from './types';

type TableSelectorProps = {
  tables: TableInfo[];
  selectedTable: string | null;
  onSelectTable: (tableName: string) => void;
};

export function TableSelector({
  tables,
  selectedTable,
  onSelectTable,
}: TableSelectorProps) {
  if (tables.length === 0) {
    return null;
  }

  return (
    <div className="mb-4 flex w-full flex-nowrap gap-2 overflow-x-auto pb-2">
      {tables.map((table) => (
        <Button
          key={table.name}
          className="shrink-0"
          variant={selectedTable === table.name ? 'default' : 'outline'}
          size="sm"
          onClick={() => onSelectTable(table.name)}
        >
          {table.name}
        </Button>
      ))}
    </div>
  );
}
