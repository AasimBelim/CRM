import type { ReactNode } from "react";
import { Table, Input, Button } from "reactstrap";
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import EmptyState from "./EmptyState";
import SkeletonLoader from "./SkeletonLoader";
import type { PaginationMeta } from "@/types/common.types";

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  render?: (row: T, index: number) => ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  pagination?: PaginationMeta;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  onSort?: (key: string) => void;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;

  // Row selection
  selectable?: boolean;
  selectedRows?: number[];
  onSelectionChange?: (selectedIds: number[]) => void;
  rowIdKey?: string;

  // Empty / loading
  emptyTitle?: string;
  emptyMessage?: string;
  emptyAction?: ReactNode;

  // Row actions
  onRowClick?: (row: T) => void;
  striped?: boolean;
  hover?: boolean;
}

function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  loading = false,
  pagination,
  sortBy,
  sortOrder,
  onSort,
  onPageChange,
  onPageSizeChange,
  selectable = false,
  selectedRows = [],
  onSelectionChange,
  rowIdKey = "id",
  emptyTitle,
  emptyMessage,
  emptyAction,
  onRowClick,
  striped = true,
  hover = true,
}: DataTableProps<T>) {
  const allSelected =
    data.length > 0 &&
    data.every((row) =>
      selectedRows.includes(row[rowIdKey] as number)
    );

  const handleSelectAll = () => {
    if (!onSelectionChange) return;
    if (allSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(data.map((row) => row[rowIdKey] as number));
    }
  };

  const handleSelectRow = (id: number) => {
    if (!onSelectionChange) return;
    if (selectedRows.includes(id)) {
      onSelectionChange(selectedRows.filter((r) => r !== id));
    } else {
      onSelectionChange([...selectedRows, id]);
    }
  };

  const renderSortIcon = (key: string) => {
    if (!onSort) return null;
    if (sortBy === key) {
      return sortOrder === "asc" ? (
        <ChevronUp size={14} />
      ) : (
        <ChevronDown size={14} />
      );
    }
    return <ChevronsUpDown size={14} className="text-muted" />;
  };

  if (loading) {
    return <SkeletonLoader variant="table" rows={5} columns={columns.length} />;
  }

  if (!data.length) {
    return (
      <EmptyState
        title={emptyTitle}
        message={emptyMessage}
        action={emptyAction}
      />
    );
  }

  return (
    <div>
      <div className="table-responsive">
        <Table striped={striped} hover={hover} className="mb-0 align-middle">
          <thead className="table-light">
            <tr>
              {selectable && (
                <th style={{ width: "40px" }}>
                  <Input
                    type="checkbox"
                    checked={allSelected}
                    onChange={handleSelectAll}
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{ width: col.width, cursor: col.sortable ? "pointer" : "default" }}
                  onClick={() => col.sortable && onSort?.(col.key)}
                  className={col.sortable ? "user-select-none" : ""}
                >
                  <span className="d-inline-flex align-items-center gap-1">
                    {col.label}
                    {col.sortable && renderSortIcon(col.key)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => {
              const rowId = row[rowIdKey] as number;
              return (
                <tr
                  key={rowId ?? index}
                  onClick={() => onRowClick?.(row)}
                  className={onRowClick ? "cursor-pointer" : ""}
                >
                  {selectable && (
                    <td onClick={(e) => e.stopPropagation()}>
                      <Input
                        type="checkbox"
                        checked={selectedRows.includes(rowId)}
                        onChange={() => handleSelectRow(rowId)}
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.key}>
                      {col.render
                        ? col.render(row, index)
                        : (row[col.key] as ReactNode) ?? "—"}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </Table>
      </div>

      {pagination && onPageChange && (() => {
        const page = pagination.page ?? 1;
        const limit = pagination.limit ?? 10;
        const total = pagination.total ?? 0;

        const start = (page - 1) * limit + 1;
        const end = Math.min(page * limit, total);
        const totalPages = Math.ceil(total / limit) || 1;

        return (
          <div className="d-flex align-items-center justify-content-between px-3 py-2 border-top">
            <div className="d-flex align-items-center gap-2 text-muted small">
              <span>
                Showing {start}–{end} of {total}
              </span>

              {onPageSizeChange && (
                <Input
                  type="select"
                  bsSize="sm"
                  value={limit}
                  onChange={(e) => onPageSizeChange(Number(e.target.value))}
                  style={{ width: "auto" }}
                >
                  {[10, 25, 50, 100].map((size) => (
                    <option key={size} value={size}>
                      {size} / page
                    </option>
                  ))}
                </Input>
              )}
            </div>

            <div className="d-flex gap-1">
              <Button
                size="sm"
                outline
                color="secondary"
                disabled={page <= 1}
                onClick={() => onPageChange(1)}
              >
                <ChevronsLeft size={14} />
              </Button>

              <Button
                size="sm"
                outline
                color="secondary"
                disabled={page <= 1}
                onClick={() => onPageChange(page - 1)}
              >
                <ChevronLeft size={14} />
              </Button>

              <span className="d-flex align-items-center px-2 small">
                Page {page} of {totalPages}
              </span>

              <Button
                size="sm"
                outline
                color="secondary"
                disabled={page >= totalPages}
                onClick={() => onPageChange(page + 1)}
              >
                <ChevronRight size={14} />
              </Button>

              <Button
                size="sm"
                outline
                color="secondary"
                disabled={page >= totalPages}
                onClick={() => onPageChange(totalPages)}
              >
                <ChevronsRight size={14} />
              </Button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

export default DataTable;
