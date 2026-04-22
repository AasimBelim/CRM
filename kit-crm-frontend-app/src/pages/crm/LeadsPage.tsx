import { useState, useEffect } from "react";
import { Target, Plus, Search, Filter, Edit2, Trash2, Eye, ChevronLeft, ChevronRight, AlertCircle, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import leadService from "@/services/leadService";
import companyService from "@/services/companyService";
import userService from "@/services/userService";
import type { LeadResponse, LeadStatus, LeadQueryParams } from "@/types/lead.types";
import type { Company } from "@/types/company.types";
import type { UsersTableViewData } from "@/types/Users";
import LeadFormSlider from "./Leadformslider";
import { useAuth } from "@/hooks/useAuth";

const LeadsPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const isAdmin = user?.role?.toLowerCase() === "admin";

    const [leads, setLeads] = useState<LeadResponse[]>([]);
    const [leadStatuses, setLeadStatuses] = useState<LeadStatus[]>([]);
    const [, setCompanies] = useState<Company[]>([]);
    const [users, setUsers] = useState<UsersTableViewData[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalPages, setTotalPages] = useState(1);
    const [currentPage, setCurrentPage] = useState(1);
    const [isActionMenuOpen, setIsActionMenuOpen] = useState<number | null>(null);

    // Lazy loading flags
    const [statusesLoaded, setStatusesLoaded] = useState(false);
    const [companiesLoaded, setCompaniesLoaded] = useState(false);

    const [searchInput, setSearchInput] = useState("");

    // Filters
    const [filters, setFilters] = useState<LeadQueryParams>({
        search: "",
        leadStatusId: undefined,
        assignedTo: undefined,
        priority: undefined,
        // page: 1,
    });
    const [showFilters, setShowFilters] = useState(false);

    // Slider state
    const [sliderMode, setSliderMode] = useState<"add" | "edit" | null>(null);
    const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
    const [isLoadingForm, setIsLoadingForm] = useState(false);

    // Delete modal state
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; leadId: number | null; leadName: string }>({
        isOpen: false,
        leadId: null,
        leadName: "",
    });

    // Fetch leads
    const fetchLeads = async () => {
        try {
            setLoading(true);

            const userRole = user?.role?.toLowerCase();
            let params: any = {};

            // ✅ Apply filters FIRST
            Object.assign(params, filters);
            const userId = user?.userId;

            console.log("USER 👉", user);
            console.log("ROLE 👉", userRole);
            console.log("USER ID 👉", userId);

            if (userRole?.includes("business development")) {
                console.log("BDE DETECTED ✅");

                if (userId) {
                    params.createdBy = userId;
                    params.assignedTo = userId;
                }
            }

            // ✅ DA → ONLY createdBy
            else if (userRole?.includes("data analyst")) {
                if (userId) {
                    params.createdBy = userId;
                }
            }



            // Clean empty search
            if (!params.search) {
                delete params.search;
            }
            params.page = currentPage;

            console.log("FINAL PARAMS 👉", params); // 👈 ADD THIS

            const response = await leadService.getLeads(params);

            setLeads(response.data || []);
            setTotalPages(response.pagination?.totalPages || 1);

        } catch (error) {
            console.error("Error fetching leads:", error);
            toast.error("Failed to fetch leads");
        } finally {
            setLoading(false);
        }
    };

    // Lazy load lead statuses
    const loadLeadStatuses = async () => {
        if (statusesLoaded) return;

        try {
            const response = await leadService.getLeadStatuses();
            setLeadStatuses(response?.data || []);
            setStatusesLoaded(true);
        } catch (error) {
            console.error("Error loading statuses:", error);
        }
    };

    const loadUsers = async () => {
        if (users.length > 0) return;

        try {
            const res = await userService.getUsers({
                page: 1,
                limit: 1000
            });

            const usersArray = res?.data?.users || [];
            setUsers(usersArray);
        } catch (err) {
            console.error("Error loading users:", err);
        }
    };

    // Lazy load companies
    const loadCompanies = async () => {
        if (companiesLoaded) return;

        try {
            const response = await companyService.getCompanies({ page: 1, limit: 1000, search: "" });
            setCompanies(response?.data || []);
            setCompaniesLoaded(true);
        } catch (error) {
            console.error("Error loading companies:", error);
        }
    };

    useEffect(() => {
        fetchLeads();
    }, [
        currentPage,
        filters.search,
        filters.leadStatusId,
        filters.priority,
        filters.assignedTo
    ]);

    // Debounced search - only call API after 3 characters or if search is cleared
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchInput.length === 0 || searchInput.length >= 3) {
                setFilters((prev) => ({
                    ...prev,
                    search: searchInput
                }));
                setCurrentPage(1);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchInput]);

    const handleSliderClose = (saved?: boolean) => {
        setSliderMode(null);
        setSelectedLeadId(null);
        setIsActionMenuOpen(null);
        if (saved) {
            fetchLeads();
        }
    };

    const handleView = (e: React.MouseEvent, leadId: number) => {
        e.stopPropagation();
        navigate(`/leads/${leadId}`);
    };

    const handleEdit = async (e: React.MouseEvent, leadId: number) => {
        e.stopPropagation();

        await loadCompanies();
        await loadLeadStatuses();

        if (isAdmin) {
            await loadUsers();
        }

        setSelectedLeadId(leadId);
        setSliderMode("edit");
        setIsActionMenuOpen(null);
    };

    const handleDeleteClick = (e: React.MouseEvent, leadId: number, leadName: string) => {
        e.stopPropagation();
        setDeleteModal({
            isOpen: true,
            leadId,
            leadName,
        });
        setIsActionMenuOpen(null);
    };

    const confirmDelete = async () => {
        if (!deleteModal.leadId) return;

        try {
            await leadService.deleteLead(deleteModal.leadId);
            toast.success("Lead deleted successfully");
            setDeleteModal({ isOpen: false, leadId: null, leadName: "" });
            fetchLeads();
        } catch (error) {
            console.error("Error deleting lead:", error);
            toast.error("Failed to delete lead");
        }
    };

    const getPriorityBadge = (priority?: string | null) => {
        if (!priority) return null;
        const colors = {
            low: "bg-blue-100 text-blue-700",
            medium: "bg-yellow-100 text-yellow-700",
            high: "bg-red-100 text-red-700",
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${colors[priority as keyof typeof colors] || "bg-gray-100 text-gray-700"}`}>
                {priority.charAt(0).toUpperCase() + priority.slice(1)}
            </span>
        );
    };

    const handleAddClick = async () => {
        setIsLoadingForm(true);
        await loadCompanies();
        await loadLeadStatuses();

        if (isAdmin) {
            await loadUsers();
        }

        setSliderMode("add");
        setIsLoadingForm(false);
    };

    return (
        <div className="space-y-0 p-0">
            {/* Header - Add Lead button inline with title */}
            <div className="flex items-center justify-between gap-2 xs:gap-3 px-3 sm:px-4 md:px-6 py-3 mt-[-30px]">
                <div className="flex items-center gap-2 xs:gap-3 min-w-0 flex-1">
                    <div className="p-2 rounded-lg flex-shrink-0" style={{ backgroundColor: "#1e2d6b" }}>
                        <Target className="text-white" size={20} />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-lg xs:text-xl sm:text-2xl font-bold text-gray-900">Leads</h1>
                        <p className="text-xs text-gray-500">Manage your lead pipeline</p>
                    </div>
                </div>
                <button
                    onClick={handleAddClick}
                    disabled={isLoadingForm}
                    className="inline-flex items-center justify-center gap-1.5 px-2.5 xs:px-3.5 py-2 text-white rounded-lg transition-colors text-xs xs:text-sm font-medium whitespace-nowrap flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: "#1e2d6b" }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#24357a"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#1e2d6b"}                >
                    {isLoadingForm ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span className="hidden xs:inline">Loading...</span>
                        </>
                    ) : (
                        <>
                            <Plus size={16} />
                            <span className="hidden xs:inline">Add Lead</span>
                            <span className="xs:hidden">Add</span>
                        </>
                    )}
                </button>
            </div>

            {/* Search & Filters */}
            <div className="bg-white border-b border-gray-200 shadow-sm overflow-hidden px-3 sm:px-4 md:px-6">
                {/* Search Bar */}
                <div className="p-3 border-b border-gray-200 mt-[-12px]">
                    <div className="flex gap-2">
                        {/* Search */}
                        <div className="relative flex-1 min-w-0">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                            <input
                                type="text"
                                placeholder="Search by company name..."
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-xs xs:text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-50"
                            />
                        </div>

                        {/* Filters button */}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-1.5 px-2.5 xs:px-3 py-2 border rounded-lg transition-colors text-xs xs:text-sm whitespace-nowrap flex-shrink-0 ${showFilters ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "border-gray-200 hover:bg-gray-50"
                                }`}
                        >
                            <Filter size={14} />
                            <span className="hidden xs:inline">Filter</span>
                        </button>
                    </div>

                    {/* Helper text for search */}
                    {searchInput && searchInput.length > 0 && searchInput.length < 3 && (
                        <p className="text-orange-600 text-xs mt-1.5 xs:mt-2">Type at least 3 characters to search</p>
                    )}

                    {/* Advanced Filters */}
                    {showFilters && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {/* Status */}
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Status</label>
                                    <select
                                        value={filters.leadStatusId || ""}
                                        onChange={(e) => {
                                            setFilters({ ...filters, leadStatusId: e.target.value ? Number(e.target.value) : undefined });
                                            setCurrentPage(1);
                                        }}
                                        onFocus={loadLeadStatuses}
                                        onClick={loadLeadStatuses}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
                                    >
                                        <option value="">All Statuses</option>
                                        {leadStatuses.map((status) => (
                                            <option key={status.id} value={status.id}>
                                                {status.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Priority */}
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Priority</label>
                                    <select
                                        value={filters.priority || ""}
                                        onChange={(e) => {
                                            setFilters({ ...filters, priority: e.target.value || undefined });
                                            setCurrentPage(1);
                                        }}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
                                    >
                                        <option value="">All Priorities</option>
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                    </select>
                                </div>

                                {/* Assigned To - only on sm and up */}
                                {isAdmin && (
                                    <div className="hidden sm:block">
                                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Assigned To</label>
                                        <select
                                            value={filters.assignedTo || ""}
                                            onChange={(e) => {
                                                setFilters({ ...filters, assignedTo: e.target.value ? Number(e.target.value) : undefined });
                                                setCurrentPage(1);
                                            }}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
                                        >
                                            <option value="">All Users</option>
                                            {users.map((user) => (
                                                <option key={user.userId} value={user.userId}>
                                                    {user.firstName} {user.lastName}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>

                            {/* Assigned To on full width for mobile */}
                            {isAdmin && (
                                <div className="sm:hidden mt-2">
                                    <label className="block text-xs font-medium text-gray-700 mb-2">Assigned To</label>
                                    <select
                                        value={filters.assignedTo || ""}
                                        onChange={(e) => {
                                            setFilters({ ...filters, assignedTo: e.target.value ? Number(e.target.value) : undefined });
                                            setCurrentPage(1);
                                        }}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-indigo-500"
                                    >
                                        <option value="">All Users</option>
                                        {users.map((user) => (
                                            <option key={user.userId} value={user.userId}>
                                                {user.firstName} {user.lastName}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Table/Cards Container */}
                <div className="overflow-hidden max-h-[calc(100vh-140px)]">
                    {loading ? (
                        <div className="p-8 text-center text-gray-500">
                            <div className="flex items-center justify-center gap-2">
                                <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                                Loading leads...
                            </div>
                        </div>
                    ) : leads.length === 0 ? (
                        <div className="p-8 text-center">
                            <Target size={40} className="mx-auto text-gray-300 mb-2" />
                            <p className="text-gray-500 text-sm">No leads found</p>
                        </div>
                    ) : (
                        <>
                            {/* Desktop Table View */}
                            <div className="hidden sm:block overflow-auto max-h-[calc(100vh-140px)]">
                                <table className="w-full text-xs sm:text-sm">
                                    <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                                        <tr>
                                            <th className="px-3 py-2 xs:py-3 text-left font-semibold text-gray-600 uppercase">Company</th>
                                            <th className="hidden md:table-cell px-3 py-2 xs:py-3 text-left font-semibold text-gray-600 uppercase">
                                                Contact
                                            </th>
                                            <th className="px-3 py-2 xs:py-3 text-left font-semibold text-gray-600 uppercase">Status</th>
                                            <th className="hidden lg:table-cell px-3 py-2 xs:py-3 text-left font-semibold text-gray-600 uppercase">
                                                Priority
                                            </th>
                                            <th className="hidden lg:table-cell px-3 py-2 xs:py-3 text-left font-semibold text-gray-600 uppercase">
                                                Assigned To
                                            </th>
                                            <th className="px-3 py-2 xs:py-3 text-center font-semibold text-gray-600 uppercase">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {leads.map((lead) => (
                                            <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-3 py-2 xs:py-3">
                                                    <div className="flex items-center gap-2 max-w-[200px]">
                                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#1e2d6b" }}>
                                                            
                                                            <span className="text-white font-semibold text-xs">
                                                                {lead.companyName?.substring(0, 2).toUpperCase() || "L"}
                                                            </span>
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-medium text-gray-900 truncate text-xs xs:text-sm">{lead.companyName || "—"}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="hidden md:table-cell px-3 py-2 xs:py-3">
                                                    <span className="text-gray-700 text-xs sm:text-sm truncate">{lead.contactName || "—"}</span>
                                                </td>
                                                <td className="px-3 py-2 xs:py-3">
                                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 whitespace-nowrap">
                                                        {lead.leadStatusName || "—"}
                                                    </span>
                                                </td>
                                                <td className="hidden lg:table-cell px-3 py-2 xs:py-3">
                                                    {getPriorityBadge(lead.priority)}
                                                </td>
                                                <td className="hidden lg:table-cell px-3 py-2 xs:py-3 text-gray-700 text-xs sm:text-sm">
                                                    {lead.assignedToName || "—"}
                                                </td>
                                                <td className="px-3 py-2 xs:py-3">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button
                                                            onClick={(e) => handleView(e, lead.id)}
                                                            className="p-1 xs:p-1.5 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                                            title="View"
                                                        >
                                                            <Eye size={14} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => handleEdit(e, lead.id)}
                                                            className="p-1 xs:p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                            title="Edit"
                                                        >
                                                            <Edit2 size={14} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => handleDeleteClick(e, lead.id, lead.companyName || "Lead")}
                                                            className="p-1 xs:p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Card View */}
                            <div className="sm:hidden space-y-3 p-0 px-3 overflow-auto max-h-[calc(100vh-140px)]">
                                {leads.map((lead) => (
                                    <div
                                        key={lead.id}
                                        className="bg-white border border-gray-200 rounded-lg p-3 space-y-2 hover:bg-gray-50 transition-colors"
                                    >
                                        {/* Company Avatar + Name */}
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#1e2d6b" }}>
                                                <span className="text-white font-semibold text-xs">
                                                    {lead.companyName?.substring(0, 2).toUpperCase() || "L"}
                                                </span>
                                            </div>
                                            <p className="font-medium text-gray-900 text-sm truncate">{lead.companyName || "—"}</p>
                                        </div>

                                        {/* Status Badge */}
                                        <div>
                                            <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                                {lead.leadStatusName || "—"}
                                            </span>
                                        </div>

                                        {/* Priority + Contact on same line */}
                                        {/* Contact BELOW priority */}
                                        {lead.contactName && (
                                            <div className="text-xs">
                                                <span className="text-gray-500">Contact: </span>
                                                <span className="font-medium text-gray-900 whitespace-nowrap">
                                                    {lead.contactName}
                                                </span>
                                            </div>
                                        )}
                                        {/* Priority */}
                                        <div className="text-xs">
                                            <span className="text-gray-500">Priority: </span>
                                            <span className="font-medium text-gray-900">
                                                {lead.priority ? lead.priority.charAt(0).toUpperCase() + lead.priority.slice(1) : "—"}
                                            </span>
                                        </div>



                                        {/* Action Buttons */}
                                        <div className="flex items-center gap-1.5 pt-2 border-t border-gray-200">
                                            <button
                                                onClick={(e) => handleView(e, lead.id)}
                                                className="flex-1 flex items-center justify-center py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded text-xs font-medium transition-colors"
                                                title="View"
                                            >
                                                <Eye size={14} />
                                            </button>
                                            <button
                                                onClick={(e) => handleEdit(e, lead.id)}
                                                className="flex-1 flex items-center justify-center py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded text-xs font-medium transition-colors"
                                                title="Edit"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button
                                                onClick={(e) => handleDeleteClick(e, lead.id, lead.companyName || "Lead")}
                                                className="flex-1 flex items-center justify-center py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded text-xs font-medium transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-3 xs:px-4 py-3 border-t border-gray-200 flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2 xs:gap-3 text-xs xs:text-sm">
                        <p className="text-gray-600">
                            Page {currentPage} of {totalPages}
                        </p>

                        <div className="flex items-center justify-center gap-1 flex-wrap">
                            <button
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-1.5 xs:p-2 border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                            >
                                <ChevronLeft size={14} />
                            </button>

                            <span className="px-2 xs:px-3 text-xs xs:text-sm text-gray-700 min-w-[50px] text-center">
                                {currentPage} / {totalPages}
                            </span>

                            <button
                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-1.5 xs:p-2 border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                            >
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {deleteModal.isOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm flex items-center justify-center p-3">
                    <div className="bg-white rounded-lg shadow-xl max-w-sm w-full">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-200">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                                    <AlertCircle size={20} className="text-red-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">Delete Lead</h3>
                            </div>
                            <button
                                onClick={() => setDeleteModal({ isOpen: false, leadId: null, leadName: "" })}
                                className="p-1 text-gray-400 hover:text-gray-600 rounded"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-4 space-y-4">
                            <p className="text-gray-600 text-sm">
                                Are you sure you want to delete the lead <span className="font-semibold text-gray-900">"{deleteModal.leadName}"</span>? This action cannot be undone.
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200">
                            <button
                                onClick={() => setDeleteModal({ isOpen: false, leadId: null, leadName: "" })}
                                className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Lead Slider */}
            {sliderMode === "add" && (

                <>
                    <LeadFormSlider
                        isOpen={true}
                        onClose={handleSliderClose}
                    />
                    {/* {companies.length === 0 || leadStatuses.length === 0 ? (
                        <div className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm flex items-center justify-center">
                            <div className="bg-white rounded-lg p-6 shadow-xl">
                                <p className="text-gray-700">Loading form data...</p>
                            </div>
                        </div>
                    ) : (
                        <LeadFormSlider
                            mode="add"
                            onClose={handleSliderClose}
                            companies={companies}
                            leadStatuses={leadStatuses}
                            users={users}
                        />
                    )} */}
                </>
            )}

            {/* Edit Lead Slider */}
            {sliderMode === "edit" && selectedLeadId && (
                <>
                    <LeadFormSlider
                        isOpen={true}
                        leadId={selectedLeadId}
                        onClose={handleSliderClose}
                    />
                    {/* {companies.length === 0 || leadStatuses.length === 0 ? (
                        <div className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm flex items-center justify-center">
                            <div className="bg-white rounded-lg p-6 shadow-xl">
                                <p className="text-gray-700">Loading form data...</p>
                            </div>
                        </div>
                    ) : (
                        <LeadFormSlider
                            mode="edit"
                            leadId={selectedLeadId}
                            onClose={handleSliderClose}
                            companies={companies}
                            leadStatuses={leadStatuses}
                            users={users}
                        />
                    )} */}
                </>
            )}

            {/* Mobile menu backdrop */}
            {isActionMenuOpen && (
                <div
                    className="fixed inset-0 z-40 sm:hidden"
                    onClick={() => setIsActionMenuOpen(null)}
                />
            )}
        </div>
    );
};

export default LeadsPage;