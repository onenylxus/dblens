import { CardDescription, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type DatabaseHeaderProps = {
  databasePath: string | null;
  choosingDatabase: boolean;
  onChooseDatabase: () => void;
};

export function DatabaseHeader({
  databasePath,
  choosingDatabase,
  onChooseDatabase,
}: DatabaseHeaderProps) {
  return (
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
          onClick={onChooseDatabase}
          disabled={choosingDatabase}
        >
          Choose database
        </Button>
      )}
    </div>
  );
}
