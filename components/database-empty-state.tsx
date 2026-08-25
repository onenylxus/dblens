import { Button } from '@/components/ui/button';

type DatabaseEmptyStateProps = {
  choosingDatabase: boolean;
  onChooseDatabase: () => void;
};

export function DatabaseEmptyState({
  choosingDatabase,
  onChooseDatabase,
}: DatabaseEmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <p className="text-muted-foreground">No database loaded.</p>
      <Button onClick={onChooseDatabase} disabled={choosingDatabase}>
        {choosingDatabase ? 'Opening chooser...' : 'Choose database'}
      </Button>
    </div>
  );
}
