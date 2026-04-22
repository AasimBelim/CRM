import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Handshake,
    Plus,
    Trash2,
    DollarSign,
    ChevronLeft,
    ChevronRight,
    AlertTriangle,
    TrendingUp,
    TrendingDown,
    Clock,
} from "lucide-react";
import { toast } from "react-toastify";
import dealService from "@/services/dealService";
import type { DealResponse, DealQueryParams, DealStats } from "@/types/deal.types";
import type { PaginationMeta } from "@/types/common.types";
import DealFormSlider from "./DealFormSlider";
import DealKanbanBoard from "./Dealkanbanboard";
import { useAuth } from "@/hooks/useAuth";

type ViewMode = "kanban" | "list";

const DealsPage = () => {
    const navigate = useNavigate();
    const [deals, setDeals] = useState<DealResponse[]>([]);
    const [stats, setStats] = useState<DealStats | null>(null);
    const [pagination, setPagination] = useState<PaginationMeta | null>(null);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [viewMode] = useState<ViewMode>("kanban");

    const [isSliderOpen, setIsSliderOpen] = useState(false);
    const [editingDealId, setEditingDealId] = useState<number | null>(null);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingDealId, setDeletingDealId] = useState<number | null>(null);
    const [deletingDealName, setDeletingDealName] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    const { user } = useAuth();
    const userRole = user?.role?.toLowerCase() || "";
    const userId = (user as any)?.userId || (user as any)?.id;

    const [filters] = useState<DealQueryParams>({
        status: undefined,
        minValue: undefined,
        maxValue: undefined,
        sortBy: "createdAt",
        sortOrder: "desc",
    });

    const fetchDeals = async (pageNum: number = 1) => {
        try {
            setLoading(true);

            const params: Record<string, unknown> = {};

            // ✅ FIRST add createdBy
            if (userRole === "business development executive") {
                params.createdBy = Number(userId);
            }

            // ✅ THEN add other params
            Object.assign(params, {
                ...filters,
                page: pageNum,
            });

            const response = await dealService.getDeals({
                ...(params as DealQueryParams),
            });

            setDeals(response.data);

            if (response.pagination) {
                const p = response.pagination;
                setPagination({
                    currentPage: p.page ?? 1,
                    totalPages: p.totalPages ?? 1,
                    totalItems: p.total ?? 0,
                    hasNextPage: (p.page ?? 1) < (p.totalPages ?? 1),
                    hasPreviousPage: (p.page ?? 1) > 1,
                });
            }
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            toast.error(err.response?.data?.message || "Failed to fetch deals");
        } finally {
            setLoading(false);
        }

    };

    const fetchStats = async () => {
        try {
            let params = {};

            if (userRole === "business development executive") {
                params = { createdBy: Number(userId) };
            }

            const response = await dealService.getStats(params);

            if (response.data) setStats(response.data);
        } catch (error) {
            console.error("Error fetching stats:", error);
        }
    };

    useEffect(() => {
        fetchDeals(currentPage);
        fetchStats();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage]);

    const handleDeleteClick = (deal: DealResponse) => {
        setDeletingDealId(deal.id);
        setDeletingDealName(deal.companyName ?? "Deal");
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (!deletingDealId) return;
        try {
            setIsDeleting(true);
            await dealService.deleteDeal(deletingDealId);
            toast.success("Deal deleted successfully");
            setShowDeleteModal(false);
            fetchDeals(currentPage);
            fetchStats();
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            toast.error(err.response?.data?.message || "Failed to delete deal");
        } finally {
            setIsDeleting(false);
            setDeletingDealId(null);
            setDeletingDealName("");
        }
    };

    const handleDeleteCancel = () => {
        setShowDeleteModal(false);
        setDeletingDealId(null);
        setDeletingDealName("");
    };

    const handleAddClick = () => {
        setEditingDealId(null);
        setIsSliderOpen(true);
    };

    const handleEditClick = (id: number) => {
        setEditingDealId(id);
        setIsSliderOpen(true);
    };

    const handleSliderClose = (saved: boolean = false) => {
        setIsSliderOpen(false);
        setEditingDealId(null);
        if (saved) {
            fetchDeals(currentPage);
            fetchStats();
        }
    };

    const handleViewClick = (id: number) => {
        navigate(`/deals/${id}`);
    };

    const formatCurrency = (value: number | string) => {
        if (!value) return "$0";
        const numValue = typeof value === "string" ? parseFloat(value) : value;
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
                        <div
                            className="p-2 rounded-lg flex-shrink-0"
                            style={{ backgroundColor: "#1e2d6b" }}
                        >
                            <Handshake className="text-white" size={20} />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-lg xs:text-xl font-bold text-gray-900 truncate">Deals</h1>
                            <p className="text-xs text-gray-500">Manage closed opportunities</p>
                        </div>
                    </div>
                    <button
                        onClick={handleAddClick}
                        className="inline-flex items-center justify-center gap-1.5 px-2.5 xs:px-3.5 py-2 text-white rounded-lg transition-colors text-xs xs:text-sm font-medium whitespace-nowrap flex-shrink-0 shadow-sm hover:shadow-md"
                        style={{ backgroundColor: "#1e2d6b" }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#24357a")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#1e2d6b")}
                    >
                        <Plus size={16} />
                        <span className="hidden xs:inline">Add Deal</span>
                        <span className="xs:hidden">Add</span>
                    </button>
                </div>

                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 px-3 sm:px-4 md:px-6 py-3">
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3 xs:p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-green-600 font-medium">Won Deals</span>
                                <TrendingUp size={16} className="text-green-600" />
                            </div>
                            <p className="text-xl xs:text-2xl font-bold text-green-700">{formatCurrency(stats.wonValue)}</p>
                            <p className="text-xs text-green-600 mt-1">{stats.wonDeals} deals</p>
                        </div>
                        <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-200 rounded-lg p-3 xs:p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-yellow-600 font-medium">Pending</span>
                                <Clock size={16} className="text-yellow-600" />
                            </div>
                            <p className="text-xl xs:text-2xl font-bold text-yellow-700">{formatCurrency(stats.pendingValue)}</p>
                            <p className="text-xs text-yellow-600 mt-1">{stats.pendingDeals} deals</p>
                        </div>
                        <div className="bg-gradient-to-br from-red-50 to-rose-50 border border-red-200 rounded-lg p-3 xs:p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-red-600 font-medium">Lost Deals</span>
                                <TrendingDown size={16} className="text-red-600" />
                            </div>
                            <p className="text-xl xs:text-2xl font-bold text-red-700">{formatCurrency(stats.lostValue)}</p>
                            <p className="text-xs text-red-600 mt-1">{stats.lostDeals} deals</p>
                        </div>
                        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-3 xs:p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-purple-600 font-medium">Total Value</span>
                                <DollarSign size={16} className="text-purple-600" />
                            </div>
                            <p className="text-xl xs:text-2xl font-bold text-purple-700">{formatCurrency(stats.totalValue)}</p>
                            <p className="text-xs text-purple-600 mt-1">{stats.totalDeals} deals</p>
                        </div>
                    </div>
                )}

                {/* Kanban / List content */}
                <div className="bg-white border-b border-gray-200 shadow-sm overflow-hidden px-3 sm:px-4 md:px-6">
                    <div className="overflow-hidden">
                        {loading ? (
                            <div className="p-8 text-center text-gray-500">
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                                    Loading...
                                </div>
                            </div>
                        ) : viewMode === "kanban" ? (
                            <DealKanbanBoard
                                deals={deals}
                                onEditDeal={handleEditClick}
                                onDeleteDeal={handleDeleteClick}
                                onViewDeal={handleViewClick}
                                onRefresh={() => { fetchDeals(currentPage); fetchStats(); }}
                            />
                        ) : (
                            <div className="overflow-auto max-h-[calc(100vh-400px)]" />
                        )}
                    </div>

                    {pagination && pagination.totalPages > 1 && viewMode === "list" && (
                        <div className="px-3 xs:px-4 py-3 border-t border-gray-200 flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2 xs:gap-3">
                            <p className="text-xs text-gray-600">
                                Page {pagination.currentPage} of {pagination.totalPages} · {pagination.totalItems} total
                            </p>
                            <div className="flex items-center justify-center gap-1">
                                <button
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    disabled={!pagination.hasPreviousPage}
                                    className="p-1.5 xs:p-2 border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                                >
                                    <ChevronLeft size={14} />
                                </button>
                                <span className="px-3 text-xs text-gray-700">
                                    {pagination.currentPage} / {pagination.totalPages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage((p) => p + 1)}
                                    disabled={!pagination.hasNextPage}
                                    className="p-1.5 xs:p-2 border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                                >
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
                                    <h3 className="text-lg font-semibold text-gray-900">Delete Deal</h3>
                                    <p className="text-sm text-gray-500">This action cannot be undone</p>
                                </div>
                            </div>
                            <p className="text-sm text-gray-700 mb-6">
                                Are you sure you want to delete the deal for{" "}
                                <span className="font-semibold">{deletingDealName}</span>?
                            </p>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleDeleteCancel}
                                    disabled={isDeleting}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteConfirm}
                                    disabled={isDeleting}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isDeleting ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Deleting...
                                        </>
                                    ) : (
                                        <><Trash2 size={16} /> Delete</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <DealFormSlider isOpen={isSliderOpen} onClose={handleSliderClose} dealId={editingDealId} />
        </>
    );
};

export default DealsPage;