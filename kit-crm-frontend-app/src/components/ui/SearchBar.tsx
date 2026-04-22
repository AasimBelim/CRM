import { useState, useEffect, useRef } from "react";
import { Input, InputGroup, InputGroupText, Spinner } from "reactstrap";
import { Search, X } from "lucide-react";

interface SearchBarProps {
  value?: string;
  placeholder?: string;
  debounceMs?: number;
  loading?: boolean;
  onSearch: (value: string) => void;
}

const SearchBar = ({
  value: controlledValue,
  placeholder = "Search...",
  debounceMs = 300,
  loading = false,
  onSearch,
}: SearchBarProps) => {
  const [internalValue, setInternalValue] = useState(controlledValue ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    if (controlledValue !== undefined) {
      setInternalValue(controlledValue);
    }
  }, [controlledValue]);

  const handleChange = (val: string) => {
    setInternalValue(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onSearch(val);
    }, debounceMs);
  };

  const handleClear = () => {
    setInternalValue("");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    onSearch("");
  };

  return (
    <InputGroup>
      <InputGroupText className="bg-white">
        {loading ? (
          <Spinner size="sm" color="secondary" />
        ) : (
          <Search size={16} />
        )}
      </InputGroupText>
      <Input
        type="text"
        value={internalValue}
        placeholder={placeholder}
        onChange={(e) => handleChange(e.target.value)}
      />
      {internalValue && (
        <InputGroupText
          className="bg-white cursor-pointer"
          role="button"
          onClick={handleClear}
        >
          <X size={16} />
        </InputGroupText>
      )}
    </InputGroup>
  );
};

export default SearchBar;
