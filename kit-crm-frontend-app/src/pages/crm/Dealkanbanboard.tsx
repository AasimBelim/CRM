import { useState } from "react";
import {
    DollarSign,
    Calendar,

    User,
    Eye,
    Edit,
    Trash2,
    MoreVertical,
} from "lucide-react";
import { toast } from "react-toastify";
import dealService from "@/services/dealService";
import type { DealResponse } from "@/types/deal.types";

interface DealKanbanBoardProps {
    deals: DealResponse[];
    onEditDeal: (id: number) => void;
    onDeleteDeal: (deal: DealResponse) => void;
    onViewDeal: (id: number) => void;
    onRefresh: () => void;
}

type DealStatus = "pending" | "partial" | "won" | "lost";

const DealKanbanBoard = ({
    deals,
    onEditDeal,
    onDeleteDeal,
    onViewDeal,
    onRefresh,
}: DealKanbanBoardProps) => {
    const [draggedDealId, setDraggedDealId] = useState<number | null>(null);
    const [dragOverColumn, setDragOverColumn] = useState<DealStatus | null>(null);

    const columns: Array<{
        status: DealStatus;
        title: string;
        color: string;
        bgColor: string;
        borderColor: string;
    }> = [
            {
                status: "pending",
                title: "Pending",
                color: "text-yellow-700",
                bgColor: "bg-yellow-50",
                borderColor: "border-yellow-200",
            },
            {
                status: "partial",
                title: "Partial",
                color: "text-blue-700",
                bgColor: "bg-blue-50",
                borderColor: "border-blue-200",
            },
            {
                status: "won",
                title: "Won",
                color: "text-green-700",
                bgColor: "bg-green-50",
                borderColor: "border-green-200",
            },
            {
                status: "lost",
                title: "Lost",
                color: "text-red-700",
                bgColor: "bg-red-50",
                borderColor: "border-red-200",
            },
        ];

    const getDealsByStatus = (status: DealStatus) => {
        return deals.filter((deal) => deal.status === status);
    };

    const formatCurrency = (value: number | string) => {
        if (!value) return "$0";
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 0,
        }).format(numValue);
    };

    const formatDate = (date: string | null) => {
        if (!date) return "—";
        return new Date(date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    const handleDragStart = (dealId: number) => {
        setDraggedDealId(dealId);
    };

    const handleDragEnd = () => {
        setDraggedDealId(null);
        setDragOverColumn(null);
    };

    const handleDragOver = (e: React.DragEvent, status: DealStatus) => {
        e.preventDefault();
        setDragOverColumn(status);
    };

    const handleDragLeave = () => {
        setDragOverColumn(null);
    };

    const handleDrop = async (e: React.DragEvent, newStatus: DealStatus) => {
        e.preventDefault();
        setDragOverColumn(null);

        if (!draggedDealId) return;

        const deal = deals.find((d) => d.id === draggedDealId);
        if (!deal) return;

        if (deal.status === newStatus) {
            setDraggedDealId(null);
            return;
        }

        try {
            await dealService.updateDeal(draggedDealId, { status: newStatus });
            toast.success(`Deal moved to ${newStatus}`);
            onRefresh();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to update deal");
        } finally {
            setDraggedDealId(null);
        }
    };

    return (
        <div className="p-3 sm:p-4 bg-white">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
                {columns.map((column) => {
                    const columnDeals = getDealsByStatus(column.status);
                    const isDragOver = dragOverColumn === column.status;

                    return (
                        <div
                            key={column.status}
                            className={`flex flex-col rounded-lg border-2 ${column.borderColor} ${column.bgColor} transition-all ${isDragOver ? "ring-2 ring-indigo-500 ring-opacity-50 scale-[1.02]" : ""
                                }`}
                            onDragOver={(e) => handleDragOver(e, column.status)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, column.status)}
                        >
                            {/* Column Header */}
                            <div className="px-3 sm:px-4 py-3 border-b border-gray-200 bg-white/50 rounded-t-lg">
                                <div className="flex items-center justify-between">
                                    <h3 className={`font-semibold text-sm sm:text-base ${column.color}`}>
                                        {column.title}
                                    </h3>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${column.bgColor} ${column.color} border ${column.borderColor}`}>
                                        {columnDeals.length}
                                    </span>
                                </div>
                            </div>

                            {/* Column Content */}
                            <div className="flex-1 p-2 sm:p-3 space-y-2 sm:space-y-3 overflow-y-auto max-h-[calc(100vh-300px)] min-h-[200px]">
                                {columnDeals.length === 0 ? (
                                    <div className="flex items-center justify-center h-32 text-gray-400">
                                        <p className="text-xs sm:text-sm">No {column.title.toLowerCase()} deals</p>
                                    </div>
                                ) : (
                                    columnDeals.map((deal) => (
                                        <DealCard
                                            key={deal.id}
                                            deal={deal}
                                            onDragStart={handleDragStart}
                                            onDragEnd={handleDragEnd}
                                            isDragging={draggedDealId === deal.id}
                                            onEdit={onEditDeal}
                                            onDelete={onDeleteDeal}
                                            onView={onViewDeal}
                                            formatCurrency={formatCurrency}
                                            formatDate={formatDate}
                                        />
                                    ))
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// Deal Card Component
interface DealCardProps {
    deal: DealResponse;
    onDragStart: (id: number) => void;
    onDragEnd: () => void;
    isDragging: boolean;
    onEdit: (id: number) => void;
    onDelete: (deal: DealResponse) => void;
    onView: (id: number) => void;
    formatCurrency: (value: number | string) => string;
    formatDate: (date: string | null) => string;
}

const DealCard = ({
    deal,
    onDragStart,
    onDragEnd,
    isDragging,
    onEdit,
    onDelete,
    onView,
    formatCurrency,
    formatDate,
}: DealCardProps) => {
    const [showMenu, setShowMenu] = useState(false);

    return (
        <div
            draggable
            onDragStart={() => onDragStart(deal.id)}
            onDragEnd={onDragEnd}
            className={`bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-all cursor-move ${isDragging
                ? "opacity-50 scale-95 cursor-grabbing"
                : "opacity-100 cursor-grab !cursor-grab"
                }`}
        >
            {/* Company Name & Menu */}
            <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: "#1e2d6b" }}
                    >
                        <span className="text-white font-semibold text-xs">
                            {deal.companyName?.substring(0, 2).toUpperCase() || "DE"}
                        </span>
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 text-sm truncate">
                            {deal.companyName || "Unknown Company"}
                        </p>
                        {deal.contactName && (
                            <p className="text-xs text-gray-500 truncate">{deal.contactName}</p>
                        )}
                    </div>
                </div>

                {/* Three-dot menu */}
                <div className="relative">
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                    >
                        <MoreVertical size={16} className="text-gray-400" />
                    </button>

                    {showMenu && (
                        <>
                            <div
                                className="fixed inset-0 z-10"
                                onClick={() => setShowMenu(false)}
                            />
                            <div className="absolute right-0 top-6 z-20 bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-32">
                                <button
                                    onClick={() => {
                                        onView(deal.id);
                                        setShowMenu(false);
                                    }}
                                    className="w-full px-3 py-1.5 text-left text-xs hover:bg-gray-50 flex items-center gap-2"
                                >
                                    <Eye size={12} />
                                    View
                                </button>
                                <button
                                    onClick={() => {
                                        onEdit(deal.id);
                                        setShowMenu(false);
                                    }}
                                    className="w-full px-3 py-1.5 text-left text-xs hover:bg-gray-50 flex items-center gap-2"
                                >
                                    <Edit size={12} />
                                    Edit
                                </button>
                                <button
                                    onClick={() => {
                                        onDelete(deal);
                                        setShowMenu(false);
                                    }}
                                    className="w-full px-3 py-1.5 text-left text-xs hover:bg-gray-50 flex items-center gap-2 text-red-600"
                                >
                                    <Trash2 size={12} />
                                    Delete
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Deal Value */}
            <div className="flex items-center gap-1.5 mb-2">
                <DollarSign size={14} className="text-green-600 flex-shrink-0" />
                <span className="font-bold text-green-700 text-sm">
                    {formatCurrency(deal.dealValue)}
                </span>
            </div>

            {/* Additional Info */}
            <div className="space-y-1.5 text-xs text-gray-600">
                {deal.closedDate && (
                    <div className="flex items-center gap-1.5">
                        <Calendar size={12} className="flex-shrink-0" />
                        <span className="truncate">{formatDate(deal.closedDate)}</span>
                    </div>
                )}
                {deal.createdByName && (
                    <div className="flex items-center gap-1.5">
                        <User size={12} className="flex-shrink-0" />
                        <span className="truncate">{deal.createdByName}</span>
                    </div>
                )}
                {deal.paymentTerms && (
                    <div className="pt-1.5 border-t border-gray-100">
                        <p className="text-xs text-gray-500 line-clamp-2">{deal.paymentTerms}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DealKanbanBoard;