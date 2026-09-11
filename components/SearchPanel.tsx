import type { Dispatch, SetStateAction } from 'react';

import { Button } from '@/components/ui/button';

import type { SearchMode } from './types';

type SearchPanelProps = {
  searchMode: SearchMode;
  setSearchMode: Dispatch<SetStateAction<SearchMode>>;
  basicInput: string;
  setBasicInput: Dispatch<SetStateAction<string>>;
  advancedInput: string;
  setAdvancedInput: Dispatch<SetStateAction<string>>;
  onApplySearch: () => void;
  onClearSearch: () => void;
  loading: boolean;
};

export function SearchPanel({
  searchMode,
  setSearchMode,
  basicInput,
  setBasicInput,
  advancedInput,
  setAdvancedInput,
  onApplySearch,
  onClearSearch,
  loading,
}: SearchPanelProps) {
  return (
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
        <div className="ml-auto flex gap-2">
          <Button onClick={onApplySearch} disabled={loading}>
            {searchMode === 'basic' ? 'Search' : 'Run query'}
          </Button>
          <Button variant="outline" onClick={onClearSearch} disabled={loading}>
            Clear
          </Button>
        </div>
      </div>

      {searchMode === 'basic' ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            className="h-9 w-full rounded-md border bg-background px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            placeholder="Search any column by keyword (partial matches supported)"
            spellCheck={false}
            value={basicInput}
            onChange={(event) => setBasicInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') onApplySearch();
            }}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <textarea
            className="min-h-24 w-full resize-y rounded-md border bg-background px-3 py-2 text-sm font-mono outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            placeholder='Example: SELECT * FROM "table_name" WHERE status = "active"'
            spellCheck={false}
            value={advancedInput}
            onChange={(event) => setAdvancedInput(event.target.value)}
          />
        </div>
      )}
    </div>
  );
}
