import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { useSearchParams } from "react-router-dom";

type FilterValue = string | number | boolean | undefined;

interface FilterState {
  [key: string]: FilterValue;
}

interface FilterContextType {
  filters: FilterState;
  setFilter: (key: string, value: FilterValue) => void;
  setFilters: (newFilters: FilterState) => void;
  clearFilters: () => void;
  clearFilter: (key: string) => void;
  activeFilterCount: number;
}

const FilterContext = createContext<FilterContextType | null>(null);

export const FilterProvider = ({
  children,
  syncWithUrl = false,
}: {
  children: React.ReactNode;
  syncWithUrl?: boolean;
}) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [filters, setFiltersState] = useState<FilterState>(() => {
    if (!syncWithUrl) return {};
    const initial: FilterState = {};
    searchParams.forEach((value, key) => {
      initial[key] = value;
    });
    return initial;
  });

  // Sync filters back to URL
  useEffect(() => {
    if (!syncWithUrl) return;
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        params.set(key, String(value));
      }
    });
    setSearchParams(params, { replace: true });
  }, [filters, syncWithUrl, setSearchParams]);

  const setFilter = useCallback((key: string, value: FilterValue) => {
    setFiltersState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const setFilters = useCallback((newFilters: FilterState) => {
    setFiltersState(newFilters);
  }, []);

  const clearFilter = useCallback((key: string) => {
    setFiltersState((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setFiltersState({});
  }, []);

  const activeFilterCount = Object.values(filters).filter(
    (v) => v !== undefined && v !== ""
  ).length;

  return (
    <FilterContext.Provider
      value={{
        filters,
        setFilter,
        setFilters,
        clearFilters,
        clearFilter,
        activeFilterCount,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
};

export const useFilters = (): FilterContextType => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error("useFilters must be used within a FilterProvider");
  }
  return context;
};
