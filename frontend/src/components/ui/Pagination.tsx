import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./Button";

interface Props {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, total, limit, onPageChange }: Props) {
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <nav className="pagination" aria-label="Pagination">
      <span>
        Showing {from}-{to} of {total}
      </span>
      <div className="pagination__controls">
        <Button
          variant="secondary"
          className="btn--sm"
          icon={<ChevronLeft size={16} />}
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>
        <span>
          Page {page} of {Math.max(1, totalPages)}
        </span>
        <Button
          variant="secondary"
          className="btn--sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
          <ChevronRight size={16} />
        </Button>
      </div>
    </nav>
  );
}