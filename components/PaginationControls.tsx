import { Button } from '@/components/ui/button';

type PaginationControlsProps = {
  page: number;
  pageCount: number;
  total: number;
  loading: boolean;
  onPrevious: () => void;
  onNext: () => void;
};

export function PaginationControls({
  page,
  pageCount,
  total,
  loading,
  onPrevious,
  onNext,
}: PaginationControlsProps) {
  if (pageCount <= 1) {
    return null;
  }

  return (
    <div className="mt-4 flex items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground">
        Page {page + 1} of {pageCount} ({total} rows)
      </span>
      <div className="flex gap-2">
        <Button
          variant="outline"
          disabled={page === 0 || loading}
          onClick={onPrevious}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          disabled={page + 1 >= pageCount || loading}
          onClick={onNext}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
