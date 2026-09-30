import type { ReactNode } from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  sortKey?: string; // set to make the column sortable
}

export interface SortState {
  key: string;
  order: "asc" | "desc";
}

interface Props<T> {
  columns: Column<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  loading?: boolean;
  skeletonRows?: number;
  sort?: SortState;
  onSortChange?: (sortKey: string) => void;
  onRowClick?: (row: T) => void;
  emptyTitle?: string;
  emptyMessage?: string;
}

export function DataTable<T>({
  columns,
  rows,
  getRowId,
  loading = false,
  skeletonRows = 8,
  sort,
  onSortChange,
  onRowClick,
  emptyTitle = "No results",
  emptyMessage = "Try adjusting your search or filters.",
}: Props<T>) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            {columns.map((col) => {
              const active = !!col.sortKey && sort?.key === col.sortKey;
              const ariaSort = active ? (sort?.order === "asc" ? "ascending" : "descending") : undefined;
              return (
                <th key={col.key} scope="col" aria-sort={ariaSort}>
                  {col.sortKey && onSortChange ? (
                    <button type="button" className="table__sort" onClick={() => onSortChange(col.sortKey as string)}>
                      {col.header}
                      {active ? (
                        sort?.order === "asc" ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                      ) : (
                        <ChevronsUpDown size={14} />
                      )}
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: skeletonRows }, (_, i) => (
                <tr key={i}>
                  {columns.map((col) => (
                    <td key={col.key}>
                      <span className="skeleton" />
                    </td>
                  ))}
                </tr>
              ))
            : rows.map((row) => (
                <tr
                  key={getRowId(row)}
                  className={onRowClick ? "is-clickable" : undefined}
                  tabIndex={onRowClick ? 0 : undefined}
                  onClick={() => onRowClick?.(row)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onRowClick?.(row);
                  }}
                >
                  {columns.map((col) => (
                    <td key={col.key}>{col.render(row)}</td>
                  ))}
                </tr>
              ))}
        </tbody>
      </table>
      {!loading && rows.length === 0 && (
        <div className="empty">
          <h3>{emptyTitle}</h3>
          <p>{emptyMessage}</p>
        </div>
      )}
    </div>
  );
}