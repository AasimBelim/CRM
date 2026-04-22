import { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, X } from "lucide-react";

interface Option {
    value: number | string;
    label: string;
    sublabel?: string;
}

interface SearchableSelectProps {
    options: Option[];
    value: number | string | null | undefined;
    onChange: (value: number | null) => void;
    placeholder?: string;
    label?: string;
    disabled?: boolean;
    error?: string;
    loading?: boolean;
    required?: boolean;
}

const SearchableSelect = ({
    options,
    value,
    onChange,
    placeholder = "Select...",
    label,
    disabled = false,
    error,
    loading = false,
    required = false,
}: SearchableSelectProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const selectedOption = options.find((opt) => opt.value === value);

    const filteredOptions = options.filter((option) => {
        const label = option?.label || "";
        const sublabel = option?.sublabel || "";

        return (
            label.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sublabel.toLowerCase().includes(searchTerm.toLowerCase())
        );
    });
    

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchTerm("");
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const handleSelect = (option: Option) => {
        onChange(Number(option.value));
        setIsOpen(false);
        setSearchTerm("");
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(null);
        setSearchTerm("");
    };

    return (
        <div className="w-full">
            {label && (
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}

            <div ref={dropdownRef} className="relative">
                {/* Trigger Button */}
                <button
                    type="button"
                    onClick={() => !disabled && !loading && setIsOpen(!isOpen)}
                    disabled={disabled || loading}
                    className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 text-left bg-white border rounded-lg text-xs sm:text-sm transition-colors ${error
                            ? "border-red-300 focus:border-red-500 focus:ring-red-50"
                            : "border-gray-300 focus:border-indigo-500 focus:ring-indigo-50"
                        } ${disabled || loading
                            ? "bg-gray-50 text-gray-400 cursor-not-allowed"
                            : "hover:border-gray-400"
                        } focus:outline-none focus:ring-2`}
                >
                    <div className="flex items-center justify-between gap-2">
                        <span className={`truncate ${selectedOption ? "text-gray-900" : "text-gray-500"}`}>
                            {loading ? "Loading..." : selectedOption ? selectedOption.label : placeholder}
                        </span>
                        <div className="flex items-center gap-1 flex-shrink-0">
                            {selectedOption && !disabled && !loading && (
                                <X
                                    size={14}
                                    className="text-gray-400 hover:text-gray-600"
                                    onClick={handleClear}
                                />
                            )}
                            <ChevronDown
                                size={16}
                                className={`text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                            />
                        </div>
                    </div>
                </button>

                {/* Dropdown */}
                {isOpen && !disabled && !loading && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-hidden">
                        {/* Search Input */}
                        <div className="p-2 border-b border-gray-200 sticky top-0 bg-white">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search..."
                                    className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded text-xs sm:text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-50"
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                        </div>

                        {/* Options List */}
                        <div className="max-h-48 overflow-y-auto">
                            {filteredOptions.length === 0 ? (
                                <div className="px-4 py-3 text-xs sm:text-sm text-gray-500 text-center">
                                    No results found
                                </div>
                            ) : (
                                filteredOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => handleSelect(option)}
                                        className={`w-full px-4 py-2 text-left text-xs sm:text-sm hover:bg-indigo-50 transition-colors ${option.value === value ? "bg-indigo-50 text-indigo-700 font-medium" : "text-gray-900"
                                            }`}
                                    >
                                        <div>
                                            <div className="font-medium">{option.label}</div>
                                            {option.sublabel && (
                                                <div className="text-xs text-gray-500 mt-0.5">{option.sublabel}</div>
                                            )}
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Error Message */}
            {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
        </div>
    );
};

export default SearchableSelect;