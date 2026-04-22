import { useState, useMemo } from "react";

export function usePagination(total: number, pageSize = 50) {
  const [page, setPage] = useState(1);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / pageSize)),
    [total, pageSize]
  );

  const goToPage = (p: number) => {
    setPage(Math.max(1, Math.min(p, totalPages)));
  };

  const nextPage = () => goToPage(page + 1);
  const prevPage = () => goToPage(page - 1);
  const firstPage = () => goToPage(1);
  const lastPage = () => goToPage(totalPages);

  return {
    page,
    totalPages,
    pageSize,
    goToPage,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}
