import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    TrendingUp,
    Plus,
    Search,
    Filter,
    Eye,
    Edit,
    Trash2,
    DollarSign,
    Calendar,
    BarChart3,
    ChevronLeft,
    ChevronRight,
    AlertTriangle,
} from "lucide-react";
import { toast } from "react-toastify";
import apiCall from "@/utils/axios";
import type { OpportunityResponse, OpportunityQueryParams } from "@/types/opportunity.types";
import type { OpportunityStage } from "@/types/opportunity.types";
import type { PaginationMeta } from "@/types/common.types";
import OpportunityFormSlider from "./OpportunityFormSlider"
import { useAuth } from "@/hooks/useAuth";

const OpportunitiesPage = () => {
    const navigate = useNavigate();
    const [opportunities, setOpportunities] = useState<OpportunityResponse[]>([]);
    const [allOpportunities, setAllOpportunities] = useState<OpportunityResponse[]>([]);
    const [pagination, setPagination] = useState<PaginationMeta | null>(null);
    const [loading, setLoading] = useState(false);

    // Delete modal state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingOpportunityId, setDeletingOpportunityId] = useState<number | null>(null);
    const [deletingOpportunityName, setDeletingOpportunityName] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);

    // Slider state
    const [isSliderOpen, setIsSliderOpen] = useState(false);
    const [editingOpportunityId, setEditingOpportunityId] = useState<number | null>(null);

    const { user } = useAuth();

    const role = user?.role?.toLowerCase();
    const userId = (user as any)?.id || (user as any)?.userId;

    const isBDE =
        role === "bde person" ||
        role === "bde" ||
        role === "business development executive";

    // Filters
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState<OpportunityQueryParams>({
        search: "",
        stageId: undefined,
        minValue: undefined,
        maxValue: undefined,
        sortBy: "createdAt",
        sortOrder: "desc",
    });
    const [stages, setStages] = useState<OpportunityStage[]>([]);
    // const [activeFilters, setActiveFilters] = useState<string[]>([]);

    const loadAllOpportunities = async () => {
        try {
            setLoading(true);

            let url = "/opportunities?page=1";

            if (isBDE && userId) {
                url = `/opportunities?createdBy=${userId}&page=1`;
            }

            const response = await apiCall.get(url);

            const { status, data } = response.data;

            if (!status) {
                toast.error("Failed to fetch opportunities");
                setAllOpportunities([]);
                setOpportunities([]);
                return;
            }

            const opportunitiesData = data || [];
            setAllOpportunities(opportunitiesData);
            setOpportunities(opportunitiesData);

        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to fetch opportunities");
            setAllOpportunities([]);
            setOpportunities([]);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...allOpportunities];

        if (filters.stageId && typeof filters.stageId === 'number') {
            filtered = filtered.filter(opp => opp.stageId === filters.stageId);
        }

        if (filters.minValue !== undefined) {
            filtered = filtered.filter(opp => {
                const value = opp.expectedValue ? parseFloat(String(opp.expectedValue)) : 0;
                return value >= filters.minValue!;
            });
        }

        if (filters.maxValue !== undefined) {
            filtered = filtered.filter(opp => {
                const value = opp.expectedValue ? parseFloat(String(opp.expectedValue)) : 0;
                return value <= filters.maxValue!;
            });
        }

        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            filtered = filtered.filter(opp =>
                opp.stageName?.toLowerCase().includes(searchLower) ||
                opp.leadCompanyName?.toLowerCase().includes(searchLower) ||
                opp.leadContactName?.toLowerCase().includes(searchLower) ||
                opp.description?.toLowerCase().includes(searchLower)
            );
        }

        setOpportunities(filtered);
        setPagination(prev => prev ? {
            ...prev,
            currentPage: 1,
            totalPages: Math.ceil(filtered.length / 10) || 1,
            totalItems: filtered.length,
            hasNextPage: false,
            hasPreviousPage: false,
        } : null);
    };

    const fetchStages = async () => {
        try {
            const response = await apiCall.get("/opportunities/stages");
            const { status, data } = response.data;
            if (status && data) {
                setStages(data);
            }
        } catch (error) {
            console.error("Error fetching stages:", error);
        }
    };

    useEffect(() => {
        loadAllOpportunities();
        fetchStages();
    }, []);

    useEffect(() => {
        applyFilters();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters, allOpportunities]);

    const handleSearch = (value: string) => {
        setFilters((prev) => ({ ...prev, search: value }));
    };

    const handleFilterChange = (key: string, value: any) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

    const clearFilters = () => {
        setFilters({
            search: "",
            stageId: undefined,
            minValue: undefined,
            maxValue: undefined,
            sortBy: "createdAt",
            sortOrder: "desc",
        });
        // setActiveFilters([]);
    };

    const handleDeleteClick = (opportunity: OpportunityResponse) => {
        setDeletingOpportunityId(opportunity.id);
        setDeletingOpportunityName(opportunity.leadCompanyName || "Opportunity");
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (!deletingOpportunityId) return;

        try {
            setIsDeleting(true);
            await apiCall.delete(`/opportunities/${deletingOpportunityId}`);
            toast.success("Opportunity deleted successfully");
            setShowDeleteModal(false);
            loadAllOpportunities();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to delete opportunity");
        } finally {
            setIsDeleting(false);
            setDeletingOpportunityId(null);
            setDeletingOpportunityName("");
        }
    };

    const handleDeleteCancel = () => {
        setShowDeleteModal(false);
        setDeletingOpportunityId(null);
        setDeletingOpportunityName("");
    };

    const handleAddClick = () => {
        setEditingOpportunityId(null);
        setIsSliderOpen(true);
    };

    const handleEditClick = (id: number) => {
        setEditingOpportunityId(id);
        setIsSliderOpen(true);
    };

    const handleSliderClose = (saved: boolean = false) => {
        setIsSliderOpen(false);
        setEditingOpportunityId(null);
        if (saved) {
            loadAllOpportunities();
        }
    };

    const handleViewClick = (id: number) => {
        navigate(`/opportunities/${id}`);
    };

    const getStageBadgeColor = (stageName: string | null | undefined) => {
        const colors: Record<string, string> = {
            "Prospecting": "bg-blue-100 text-blue-700",
            "Qualification": "bg-indigo-100 text-indigo-700",
            "Proposal": "bg-purple-100 text-purple-700",
            "Negotiation": "bg-yellow-100 text-yellow-700",
            "Won": "bg-green-100 text-green-700",
            "Lost": "bg-red-100 text-red-700",
        };
        return stageName ? colors[stageName] || "bg-gray-100 text-gray-700" : "bg-gray-100 text-gray-700";
    };

    const formatCurrency = (value: number | string | null | undefined) => {
        if (!value) return "$0";
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 0,
        }).format(numValue);
    };

    return (
        <>
            <div className="space-y-0 p-0">
                {/* Header */}
                <div className="flex items-center justify-between gap-2 xs:gap-3 px-3 sm:px-4 md:px-6 py-2 mt-[-20px]">
                    <div className="flex items-center gap-2 xs:gap-3 min-w-0 flex-1">
                        <div className="p-2 rounded-lg flex-shrink-0" style={{ backgroundColor: "#1e2d6b" }}>
                            <TrendingUp className="text-white" size={20} />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-lg xs:text-xl font-bold text-gray-900 truncate">Opportunities</h1>
                            <p className="text-xs text-gray-500">Manage sales pipeline</p>
                        </div>
                    </div>
                    <button
                        onClick={handleAddClick}
                        className="inline-flex items-center justify-center gap-1.5 px-2.5 xs:px-3.5 py-2 text-white rounded-lg   transition-colors text-xs xs:text-sm font-medium whitespace-nowrap flex-shrink-0 shadow-sm hover:shadow-md"
                        style={{ backgroundColor: "#1e2d6b" }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#24357a"}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#1e2d6b"}
                    >
                        <Plus size={16} />
                        <span className="hidden xs:inline">Add Opportunity</span>
                        <span className="xs:hidden">Add</span>
                    </button>
                </div>

                {/* Search & Filters */}
                <div className="bg-white border-b border-gray-200 shadow-sm overflow-hidden px-3 sm:px-4 md:px-6">
                    {/* Search Bar */}
                    <div className="p-3 border-b border-gray-200">
                        <div className="flex gap-2">
                            <div className="relative flex-1 min-w-0">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                <input
                                    type="text"
                                    placeholder="Search opportunities..."
                                    value={filters.search}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-xs xs:text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-50"
                                />
                            </div>

                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`flex items-center gap-1.5 px-2.5 xs:px-3 py-2 border rounded-lg transition-colors text-xs xs:text-sm whitespace-nowrap flex-shrink-0 ${showFilters ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "border-gray-200 hover:bg-gray-50"
                                    }`}
                            >
                                <Filter size={14} />
                            </button>
                        </div>

                        {/* Filter Panel */}
                        {showFilters && (
                            <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                                <div className="grid grid-cols-2 gap-2">
                                    <select
                                        value={filters.stageId || ""}
                                        onChange={(e) => handleFilterChange("stageId", e.target.value ? parseInt(e.target.value) : undefined)}
                                        className="px-3 py-2 border border-gray-200 rounded-lg text-xs xs:text-sm focus:outline-none focus:border-indigo-500"
                                    >
                                        <option value="">All Stages</option>
                                        {stages.map((stage) => (
                                            <option key={stage.id} value={stage.id}>
                                                {stage.name}
                                            </option>
                                        ))}
                                    </select>

                                    <select
                                        value={
                                            filters.minValue !== undefined && filters.maxValue !== undefined
                                                ? `${filters.minValue}-${filters.maxValue}`
                                                : filters.minValue !== undefined
                                                    ? `${filters.minValue}`
                                                    : ""
                                        }
                                        onChange={(e) => {
                                            const value = e.target.value;

                                            if (!value) {
                                                handleFilterChange("minValue", undefined);
                                                handleFilterChange("maxValue", undefined);
                                                return;
                                            }

                                            if (value.includes("-")) {
                                                const [min, max] = value.split("-").map(Number);
                                                handleFilterChange("minValue", min);
                                                handleFilterChange("maxValue", max);
                                            } else {
                                                handleFilterChange("minValue", Number(value));
                                                handleFilterChange("maxValue", undefined);
                                            }
                                        }}
                                        className="px-3 py-2 border border-gray-200 rounded-lg text-xs xs:text-sm focus:outline-none focus:border-indigo-500"
                                    >
                                        <option value="">All Values</option>
                                        <option value="0-10000">$0 - $10K</option>
                                        <option value="10000-50000">$10K - $50K</option>
                                        <option value="50000-100000">$50K - $100K</option>
                                        <option value="100000">$100K+</option>
                                    </select>
                                </div>

                                {(filters.stageId || filters.minValue || filters.maxValue) && (
                                    <div className="flex items-center gap-2">
                                        <button onClick={clearFilters} className="text-xs text-gray-600 hover:text-gray-900 underline">
                                            Clear filters
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Opportunities List */}
                    <div className="overflow-hidden max-h-[calc(100vh-260px)]">
                        {loading ? (
                            <div className="p-8 text-center text-gray-500">
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                                    Loading...
                                </div>
                            </div>
                        ) : opportunities.length === 0 ? (
                            <div className="p-8 text-center">
                                <TrendingUp size={40} className="mx-auto text-gray-300 mb-2" />
                                <p className="text-gray-500 text-sm">No opportunities found</p>
                            </div>
                        ) : (
                            <>
                                {/* Desktop Table View */}
                                <div className="hidden sm:block overflow-auto max-h-[calc(100vh-260px)]">
                                    <table className="w-full text-xs xs:text-sm">
                                        <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                                            <tr>
                                                <th className="px-3 py-2 xs:py-3 text-left font-semibold text-gray-600 uppercase">Company</th>
                                                <th className="px-3 py-2 xs:py-3 text-left font-semibold text-gray-600 uppercase hidden md:table-cell">Stage</th>
                                                <th className="px-3 py-2 xs:py-3 text-left font-semibold text-gray-600 uppercase hidden lg:table-cell">Value</th>
                                                <th className="px-3 py-2 xs:py-3 text-left font-semibold text-gray-600 uppercase hidden lg:table-cell">Close Date</th>
                                                <th className="px-3 py-2 xs:py-3 text-left font-semibold text-gray-600 uppercase hidden xl:table-cell">Probability</th>
                                                <th className="px-3 py-2 xs:py-3 text-center font-semibold text-gray-600 uppercase">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {opportunities.map((opportunity) => (
                                                <tr key={opportunity.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-3 py-2 xs:py-3">
                                                        <div className="flex items-center gap-2 max-w-[200px]">
                                                            <div className="w-8 h-8  rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#1e2d6b" }}>
                                                                <span className="text-white font-semibold text-xs">
                                                                    {opportunity.leadCompanyName?.substring(0, 2).toUpperCase() || "OP"}
                                                                </span>
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="font-medium text-gray-900 truncate text-xs xs:text-sm">
                                                                    {opportunity.leadCompanyName || "Unknown Company"}
                                                                </p>
                                                                <p className="text-xs text-gray-500 truncate">
                                                                    {opportunity.leadContactName || "No contact"}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-2 xs:py-3 hidden md:table-cell">
                                                        {opportunity.stageName && (
                                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${getStageBadgeColor(opportunity.stageName)}`}>
                                                                <BarChart3 size={10} />
                                                                {opportunity.stageName}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-2 xs:py-3 hidden lg:table-cell">
                                                        <div className="flex items-center gap-1 text-xs text-gray-600">
                                                            {/* <DollarSign size={12} className="flex-shrink-0" /> */}
                                                            <span>{formatCurrency(opportunity.expectedValue)}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-2 xs:py-3 hidden lg:table-cell">
                                                        <div className="flex items-center gap-1 text-xs text-gray-600">
                                                            <Calendar size={12} className="flex-shrink-0" />
                                                            <span>
                                                                {opportunity.expectedCloseDate
                                                                    ? new Date(opportunity.expectedCloseDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                                                                    : "—"}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-2 xs:py-3 hidden xl:table-cell">
                                                        <span className="text-xs text-gray-600">{opportunity.probability || 0}%</span>
                                                    </td>
                                                    <td className="px-3 py-2 xs:py-3">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <button onClick={() => handleViewClick(opportunity.id)} className="p-1 xs:p-1.5 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded transition-colors" title="View">
                                                                <Eye size={14} />
                                                            </button>
                                                            <button onClick={() => handleEditClick(opportunity.id)} className="p-1 xs:p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Edit">
                                                                <Edit size={14} />
                                                            </button>
                                                            <button onClick={() => handleDeleteClick(opportunity)} className="p-1 xs:p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Delete">
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile Card View - IMPROVED */}
                                <div className="sm:hidden space-y-3 p-3 overflow-auto max-h-[calc(100vh-260px)]">
                                    {opportunities.map((opportunity) => (
                                        <div key={opportunity.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2.5 hover:bg-gray-100 transition-colors">
                                            {/* Header: Avatar + Company Name + Stage Badge */}
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                                    <div className="w-9 h-9 bg-gradient-to-br rounded-lg flex items-center justify-center flex-shrink-0"
                                                        style={{ backgroundColor: "#1e2d6b" }}
                                                    >
                                                        <span className="text-white font-semibold text-xs">
                                                            {opportunity.leadCompanyName?.substring(0, 2).toUpperCase() || "OP"}
                                                        </span>
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="font-medium text-gray-900 text-sm leading-tight">
                                                            {opportunity.leadCompanyName || "Unknown Company"}
                                                        </p>
                                                        <p className="text-xs text-gray-500 truncate mt-0.5">
                                                            {opportunity.leadContactName || "No contact"}
                                                        </p>
                                                    </div>
                                                </div>
                                                {/* {opportunity.stageName && (
                                                    <span className={`text-xs font-medium px-2 py-1 rounded whitespace-nowrap flex-shrink-0 ${getStageBadgeColor(opportunity.stageName)}`}>
                                                        {opportunity.stageName}
                                                    </span>
                                                )} */}
                                            </div>



                                            {/* Value - Prominent */}
                                            <div className="flex items-center gap-1.5 text-sm font-semibold text-green-600">
                                                <DollarSign size={14} className="flex-shrink-0" />
                                                <span>{formatCurrency(opportunity.expectedValue)}</span>
                                            </div>

                                            {/* Date & Probability Grid */}
                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                {opportunity.expectedCloseDate && (
                                                    <div className="flex items-center gap-1">
                                                        <Calendar size={12} className="text-gray-500 flex-shrink-0" />
                                                        <span className="text-gray-700 truncate">
                                                            {new Date(opportunity.expectedCloseDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                                        </span>
                                                    </div>
                                                )}
                                                {opportunity.probability !== null && opportunity.probability !== undefined && (
                                                    <div className="flex items-center gap-1">
                                                        <BarChart3 size={12} className="text-gray-500 flex-shrink-0" />
                                                        <span className="text-gray-700">{opportunity.probability}%</span>
                                                    </div>
                                                )}
                                            </div>


                                            {/* Stage Badge BELOW date & probability */}
                                            {opportunity.stageName && (
                                                <div className="flex items-center justify-start">
                                                    <span
                                                        className={`text-xs font-medium px-2 py-1 rounded whitespace-nowrap ${getStageBadgeColor(opportunity.stageName)}`}
                                                    >
                                                        {opportunity.stageName}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Action Buttons - Responsive with Icons Only on Small Screens */}
                                            <div className="flex items-center gap-1.5 pt-2 border-t border-gray-200">
                                                <button onClick={() => handleViewClick(opportunity.id)} className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-green-50 hover:bg-green-100 text-green-600 rounded text-xs font-medium transition-colors" title="View">
                                                    <Eye size={14} />
                                                    <span className="hidden xs:inline">View</span>
                                                </button>
                                                <button onClick={() => handleEditClick(opportunity.id)} className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded text-xs font-medium transition-colors" title="Edit">
                                                    <Edit size={14} />
                                                    <span className="hidden xs:inline">Edit</span>
                                                </button>
                                                <button onClick={() => handleDeleteClick(opportunity)} className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-red-50 hover:bg-red-100 text-red-600 rounded text-xs font-medium transition-colors" title="Delete">
                                                    <Trash2 size={14} />
                                                    <span className="hidden xs:inline">Delete</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Pagination */}
                    {pagination && pagination.totalPages > 1 && (
                        <div className="px-3 xs:px-4 py-3 border-t border-gray-200 flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2 xs:gap-3 text-xs xs:text-sm">
                            <p className="text-gray-600">
                                Page {pagination.currentPage} of {pagination.totalPages} · {pagination.totalItems} total
                            </p>
                            <div className="flex items-center justify-center gap-1 flex-wrap">
                                <button onClick={() => setPagination(prev => prev ? { ...prev, currentPage: Math.max(1, prev.currentPage - 1) } : prev)} disabled={!pagination.hasPreviousPage} className="p-1.5 xs:p-2 border border-gray-200 rounded-lg text-xs xs:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors" title="Previous">
                                    <ChevronLeft size={14} />
                                </button>
                                <span className="px-1.5 xs:px-3 text-xs xs:text-sm text-gray-700 min-w-[40px] xs:min-w-[50px] text-center">
                                    {pagination.currentPage} / {pagination.totalPages}
                                </span>
                                <button onClick={() => setPagination(prev => prev ? { ...prev, currentPage: prev.currentPage + 1 } : prev)} disabled={!pagination.hasNextPage} className="p-1.5 xs:p-2 border border-gray-200 rounded-lg text-xs xs:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors" title="Next">
                                    <ChevronRight size={14} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                                    <AlertTriangle size={24} className="text-red-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Delete Opportunity</h3>
                                    <p className="text-sm text-gray-500">This action cannot be undone</p>
                                </div>
                            </div>
                            <p className="text-sm text-gray-700 mb-6">
                                Are you sure you want to delete the opportunity for <span className="font-semibold">{deletingOpportunityName}</span>?
                            </p>
                            <div className="flex items-center gap-3">
                                <button onClick={handleDeleteCancel} disabled={isDeleting} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium disabled:opacity-50">
                                    Cancel
                                </button>
                                <button onClick={handleDeleteConfirm} disabled={isDeleting} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                                    {isDeleting ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Deleting...
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 size={16} />
                                            Delete
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <OpportunityFormSlider isOpen={isSliderOpen} onClose={handleSliderClose} opportunityId={editingOpportunityId} />
        </>
    );
};

export default OpportunitiesPage;