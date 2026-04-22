import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Handshake,
    DollarSign,
    Calendar,
    Building2,
    User,
    FileText,
    Edit,
    Trash2,
    AlertTriangle,
    Clock,
    TrendingUp,
    TrendingDown,
    Minus,
    Mail,
    Briefcase,
    Send,
    CheckCircle,
    Edit2,
} from "lucide-react";
import { toast } from "react-toastify";
import dealService from "@/services/dealService";
import noteService from "@/services/noteService";
import taskService from "@/services/taskService";
import type { DealResponse } from "@/types/deal.types";
import type { NoteResponse } from "@/types/note.types";
import DealFormSlider from "./DealFormSlider";
import { useAuth } from "@/hooks/useAuth";

const DealDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [deal, setDeal] = useState<DealResponse | null>(null);
    const [loading, setLoading] = useState(false);

    const [isSliderOpen, setIsSliderOpen] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Notes state
    const [notes, setNotes] = useState<NoteResponse[]>([]);
    const [noteContent, setNoteContent] = useState("");
    const [isSavingNote, setIsSavingNote] = useState(false);

    // Follow-up task state
    const [showFollowupForm, setShowFollowupForm] = useState(false);
    const [followupDays, setFollowupDays] = useState<2 | 3 | 4 | 5>(2);
    const [isCreatingFollowup, setIsCreatingFollowup] = useState(false);

    // Note editing state
    const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
    const [editContent, setEditContent] = useState("");
    const [savingEdit, setSavingEdit] = useState(false);
    const [deleteNoteId, setDeleteNoteId] = useState<number | null>(null);

    const { user } = useAuth();
    const role = user?.role?.toLowerCase();
    const userId = (user as any)?.userId || (user as any)?.id;

    // Check if user is Data Analyst - can only manage notes
    const isDataAnalyst = role?.includes("data analyst");
    const canManageNote = (noteCreatedBy: number) => {
        return isDataAnalyst ? noteCreatedBy === userId : true;
    };

    useEffect(() => {
        if (id) {
            fetchDeal();
            fetchNotes();
        }
    }, [id]);

    const fetchDeal = async () => {
        try {
            setLoading(true);
            const response = await dealService.getDeal(Number(id));
            if (response.data) setDeal(response.data);
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            toast.error(err.response?.data?.message || "Failed to fetch deal");
            navigate("/deals");
        } finally {
            setLoading(false);
        }
    };

    const fetchNotes = async () => {
        try {
            if (!id) return;
            const response = await noteService.getNotes({
                entityType: "deal",
                entityId: Number(id),
            });
            setNotes(response.data || []);
        } catch (error) {
            console.error("Error fetching notes:", error);
        }
    };

    const handleSaveNote = async () => {
        if (!noteContent.trim()) {
            toast.error("Please enter a note");
            return;
        }

        try {
            setIsSavingNote(true);
            await noteService.createNote({
                entity_type: "deal",
                entity_id: Number(id),
                content: noteContent.trim(),
            });
            toast.success("Note saved successfully");
            setNoteContent("");
            fetchNotes();
        } catch (error) {
            console.error("Error saving note:", error);
            toast.error("Failed to save note");
        } finally {
            setIsSavingNote(false);
        }
    };

    const handleEditNote = (note: NoteResponse) => {
        setEditingNoteId(note.id);
        setEditContent(note.content);
    };

    const handleUpdateNote = async () => {
        if (!editContent.trim()) {
            toast.error("Note cannot be empty");
            return;
        }

        try {
            setSavingEdit(true);
            await noteService.updateNote(editingNoteId!, {
                content: editContent.trim(),
            });
            toast.success("Note updated successfully");
            setEditingNoteId(null);
            setEditContent("");
            fetchNotes();
        } catch {
            toast.error("Failed to update note");
        } finally {
            setSavingEdit(false);
        }
    };

    const openDeleteModal = (id: number) => {
        setDeleteNoteId(id);
    };

    const confirmDeleteNote = async () => {
        if (!deleteNoteId) return;

        try {
            await noteService.deleteNote(deleteNoteId);
            toast.success("Note deleted successfully");
            fetchNotes();
        } catch {
            toast.error("Failed to delete note");
        } finally {
            setDeleteNoteId(null);
        }
    };

    const calculateFollowupDate = (days: number): Date => {
        const dueDate = new Date();
        let count = 0;

        while (count < days) {
            dueDate.setDate(dueDate.getDate() + 1);
            const dayOfWeek = dueDate.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                count++;
            }
        }

        return dueDate;
    };

    const handleCreateFollowup = async () => {
        try {
            setIsCreatingFollowup(true);
            const dueDate = calculateFollowupDate(followupDays);

            await taskService.createTask({
                entity_type: "deal",
                entity_id: Number(id),
                title: `Follow up on ${deal?.companyName}`,
                description: noteContent.trim() || `Follow up task for deal: ${deal?.companyName}`,
                task_type: "follow_up",
                priority: "medium",
                due_date: dueDate.toISOString(),
                assigned_to: userId,
            });

            toast.success(`Follow-up task created for ${followupDays} days ahead`);
            setShowFollowupForm(false);
            setFollowupDays(2);
        } catch (error) {
            console.error("Error creating follow-up task:", error);
            toast.error("Failed to create follow-up task");
        } finally {
            setIsCreatingFollowup(false);
        }
    };

    const handleSliderClose = (saved: boolean = false) => {
        setIsSliderOpen(false);
        if (saved) fetchDeal();
    };

    const handleDeleteConfirm = async () => {
        try {
            setIsDeleting(true);
            await dealService.deleteDeal(Number(id));
            toast.success("Deal deleted successfully");
            navigate("/deals");
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            toast.error(err.response?.data?.message || "Failed to delete deal");
        } finally {
            setIsDeleting(false);
            setShowDeleteModal(false);
        }
    };

    // ── Helpers ────────────────────────────────────────────────────────────────
    const formatCurrency = (value: number | string | null | undefined) => {
        if (!value) return "$0";
        const n = typeof value === "string" ? parseFloat(value) : value;
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 0,
        }).format(n);
    };

    const formatDate = (date: Date | string | null | undefined) => {
        if (!date) return "—";
        return new Date(date).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
        });
    };

    const getStatusConfig = (status: string) => {
        const map: Record<string, { label: string; bg: string; text: string; border: string; icon: React.ReactNode }> = {
            won: { label: "Won", bg: "bg-green-50", text: "text-green-700", border: "border-green-200", icon: <TrendingUp size={14} /> },
            lost: { label: "Lost", bg: "bg-red-50", text: "text-red-700", border: "border-red-200", icon: <TrendingDown size={14} /> },
            pending: { label: "Pending", bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200", icon: <Clock size={14} /> },
            partial: { label: "Partial", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", icon: <Minus size={14} /> },
        };
        return map[status] ?? { label: status, bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200", icon: null };
    };

    // ── Loading skeleton ───────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="space-y-4 animate-pulse">
                <div className="h-8 w-48 bg-gray-200 rounded-lg" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 space-y-3">
                        <div className="h-32 bg-gray-200 rounded-xl" />
                        <div className="h-48 bg-gray-200 rounded-xl" />
                    </div>
                    <div className="space-y-3">
                        <div className="h-32 bg-gray-200 rounded-xl" />
                        <div className="h-32 bg-gray-200 rounded-xl" />
                    </div>
                </div>
            </div>
        );
    }

    if (!deal) return null;

    const statusConfig = getStatusConfig(deal.status);

    return (
        <>
            <div className="space-y-3 sm:space-y-4">

                {/* ── Back + Actions header ── */}
                <div className="flex items-center justify-between gap-3">
                    <button
                        onClick={() => navigate("/deals")}
                        className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-500 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft size={16} />
                        <span>Back to Deals</span>
                    </button>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsSliderOpen(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 border border-gray-200 rounded-lg text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            <Edit size={14} />
                            <span className="hidden xs:inline">Edit</span>
                        </button>
                        <button
                            onClick={() => setShowDeleteModal(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 border border-red-200 rounded-lg text-xs sm:text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                        >
                            <Trash2 size={14} />
                            <span className="hidden xs:inline">Delete</span>
                        </button>
                    </div>
                </div>

                {/* ── Hero card ── */}
                <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center gap-3">
                            {/* Avatar */}
                            <div
                                className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
                                style={{ backgroundColor: "#1e2d6b" }}
                            >
                                <span className="text-white font-bold text-base sm:text-lg">
                                    {deal.companyName?.substring(0, 2).toUpperCase() ?? "DE"}
                                </span>
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h1 className="text-base sm:text-xl font-bold text-gray-900 truncate">
                                        {deal.companyName ?? "Unknown Company"}
                                    </h1>
                                    {/* Status badge */}
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                                        {statusConfig.icon}
                                        {statusConfig.label}
                                    </span>
                                </div>
                                {deal.contactName && (
                                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{deal.contactName}</p>
                                )}
                            </div>
                        </div>

                        {/* Deal value — hero number */}
                        <div className="sm:text-right">
                            <p className="text-xs text-gray-500 mb-0.5">Deal Value</p>
                            <p className="text-2xl sm:text-3xl font-bold " style={{ color: "#1e2d6b" }}>
                                {formatCurrency(deal.dealValue)}
                            </p>
                            {deal.opportunityExpectedValue && (
                                <p className="text-xs text-gray-400 mt-0.5">
                                    Expected: {formatCurrency(deal.opportunityExpectedValue)}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Two-column detail layout ── */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">

                    {/* LEFT — main details (2/3) */}
                    <div className="md:col-span-2 space-y-3 sm:space-y-4">

                        {/* Company & Contact */}
                        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                            <div className="px-4 sm:px-5 py-3 border-b border-gray-100 bg-gray-50">
                                <h3 className="text-xs sm:text-sm font-semibold text-gray-900 flex items-center gap-2">
                                    <Building2 size={15} className="text-indigo-500" />
                                    Company & Contact
                                </h3>
                            </div>
                            <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-3">
                                    <DetailRow
                                        icon={<Building2 size={14} className="text-gray-400" />}
                                        label="Company"
                                        value={deal.companyName}
                                    />
                                    <DetailRow
                                        icon={<Briefcase size={14} className="text-gray-400" />}
                                        label="Industry"
                                        value={(deal as any).companyIndustry}
                                    />
                                </div>
                                <div className="space-y-3">
                                    <DetailRow
                                        icon={<User size={14} className="text-gray-400" />}
                                        label="Contact"
                                        value={deal.contactName}
                                    />
                                    <DetailRow
                                        icon={<Mail size={14} className="text-gray-400" />}
                                        label="Email"
                                        value={(deal as any).contactEmail}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Notes Section */}
                        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                            <div className="px-4 sm:px-5 py-3 border-b border-gray-100 bg-gray-50">
                                <h3 className="text-xs sm:text-sm font-semibold text-gray-900 flex items-center gap-2">
                                    <FileText size={15} className="text-indigo-500" />
                                    Notes
                                </h3>
                            </div>

                            <div className="p-4 sm:p-5 space-y-4">
                                {/* Add Note Form */}
                                <div className="space-y-3">
                                    <textarea
                                        value={noteContent}
                                        onChange={(e) => setNoteContent(e.target.value)}
                                        placeholder="Add a note..."
                                        rows={4}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs xs:text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-50 resize-none"
                                    />

                                    <div className="flex items-center gap-2 flex-wrap">
                                        <button
                                            onClick={handleSaveNote}
                                            disabled={isSavingNote || !noteContent.trim()}
                                            className="inline-flex items-center gap-1.5 px-3 xs:px-4 py-1.5 xs:py-2 bg-[#1e2d6b] text-white rounded-lg hover:bg-[#1a255a] transition-colors text-xs xs:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isSavingNote ? (
                                                <>
                                                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                    Saving...
                                                </>
                                            ) : (
                                                <>
                                                    <Send size={14} />
                                                    Save Note
                                                </>
                                            )}
                                        </button>

                                        {!showFollowupForm && !isDataAnalyst ? (
                                            <button
                                                onClick={() => setShowFollowupForm(true)}
                                                className="inline-flex items-center gap-1.5 px-3 xs:px-4 py-1.5 xs:py-2 bg-green-50 border border-green-200 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-xs xs:text-sm font-medium"
                                            >
                                                <Clock size={14} />
                                                Create Follow-up
                                            </button>
                                        ) : null}
                                    </div>
                                </div>

                                {/* Follow-up Task Form */}
                                {showFollowupForm && (
                                    <div className="p-3 xs:p-4 bg-green-50 border border-green-200 rounded-lg space-y-3">
                                        <div>
                                            <label className="block text-xs xs:text-sm font-medium text-gray-700 mb-1.5">
                                                Follow-up in (days)
                                            </label>
                                            <select
                                                value={followupDays}
                                                onChange={(e) => setFollowupDays(Number(e.target.value) as 2 | 3 | 4 | 5)}
                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs xs:text-sm focus:outline-none focus:border-green-500"
                                            >
                                                <option value={2}>2 Days</option>
                                                <option value={3}>3 Days</option>
                                                <option value={4}>4 Days</option>
                                                <option value={5}>5 Days</option>
                                            </select>
                                            <p className="text-xs text-gray-500 mt-1.5">
                                                Weekends will be skipped automatically
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={handleCreateFollowup}
                                                disabled={isCreatingFollowup}
                                                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 xs:px-4 py-1.5 xs:py-2 bg-[#1e2d6b] text-white rounded-lg hover:bg-[#1a255a] transition-colors text-xs xs:text-sm font-medium disabled:opacity-50"
                                            >
                                                {isCreatingFollowup ? (
                                                    <>
                                                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                        Creating...
                                                    </>
                                                ) : (
                                                    "Create Follow-up Task"
                                                )}
                                            </button>
                                            <button
                                                onClick={() => setShowFollowupForm(false)}
                                                className="px-3 xs:px-4 py-1.5 xs:py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-xs xs:text-sm font-medium"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Notes List */}
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {notes.length > 0 ? (
                                        notes.map((note) => (
                                            <div key={note.id} className="p-2.5 xs:p-3 bg-gray-50 border border-gray-200 rounded-lg transition-all hover:border-gray-300">
                                                {editingNoteId === note.id ? (
                                                    // Edit Mode
                                                    <div className="space-y-2.5">
                                                        <textarea
                                                            value={editContent}
                                                            onChange={(e) => setEditContent(e.target.value)}
                                                            placeholder="Edit note..."
                                                            rows={3}
                                                            className="w-full px-3 py-2 border border-indigo-200 rounded-lg text-xs xs:text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 resize-none bg-white transition-colors"
                                                        />

                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={handleUpdateNote}
                                                                disabled={savingEdit || !editContent.trim()}
                                                                className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 xs:px-3 py-1.5 xs:py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-xs xs:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                                            >
                                                                {savingEdit ? (
                                                                    <>
                                                                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                                        <span className="hidden xs:inline">Saving...</span>
                                                                        <span className="xs:hidden">Save</span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <CheckCircle size={14} />
                                                                        <span className="hidden xs:inline">Save Changes</span>
                                                                        <span className="xs:hidden">Save</span>
                                                                    </>
                                                                )}
                                                            </button>

                                                            <button
                                                                onClick={() => setEditingNoteId(null)}
                                                                disabled={savingEdit}
                                                                className="flex-1 px-2.5 xs:px-3 py-1.5 xs:py-2 border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-xs xs:text-sm font-medium disabled:opacity-50"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    // View Mode
                                                    <>
                                                        <div className="flex items-start justify-between gap-2">
                                                            <p className="text-xs xs:text-sm text-gray-900 leading-relaxed break-words flex-1">
                                                                {note.content}
                                                            </p>
                                                            {canManageNote(note.createdBy) && (
                                                                <div className="flex-shrink-0 flex gap-1">
                                                                    <button
                                                                        onClick={() => handleEditNote(note)}
                                                                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                                                                        title="Edit note"
                                                                    >
                                                                        <Edit2 size={14} />
                                                                    </button>

                                                                    <button
                                                                        onClick={() => openDeleteModal(note.id)}
                                                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                                                                        title="Delete note"
                                                                    >
                                                                        <Trash2 size={14} />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200">
                                                            <span className="text-xs text-gray-500">
                                                                <span className="font-medium text-gray-700">{note.createdByName}</span> • {new Date(note.createdAt).toLocaleDateString("en-GB")}
                                                            </span>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-xs text-gray-500 text-center py-4">No notes yet</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Contract Dates */}
                        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                            <div className="px-4 sm:px-5 py-3 border-b border-gray-100 bg-gray-50">
                                <h3 className="text-xs sm:text-sm font-semibold text-gray-900 flex items-center gap-2">
                                    <Calendar size={15} className="text-indigo-500" />
                                    Timeline
                                </h3>
                            </div>
                            <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <DateCard
                                    label="Closed Date"
                                    value={formatDate(deal.closedDate)}
                                    highlight
                                />
                                <DateCard
                                    label="Contract Start"
                                    value={formatDate(deal.contractStartDate)}
                                />
                                <DateCard
                                    label="Contract End"
                                    value={formatDate(deal.contractEndDate)}
                                />
                            </div>
                        </div>

                        {/* Payment Terms */}
                        {deal.paymentTerms && (
                            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                                <div className="px-4 sm:px-5 py-3 border-b border-gray-100 bg-gray-50">
                                    <h3 className="text-xs sm:text-sm font-semibold text-gray-900 flex items-center gap-2">
                                        <FileText size={15} className="text-indigo-500" />
                                        Payment Terms
                                    </h3>
                                </div>
                                <div className="p-4 sm:p-5">
                                    <p className="text-xs sm:text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                                        {deal.paymentTerms}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Lost Reason */}
                        {deal.status === "lost" && deal.lostReasonText && (
                            <div className="bg-red-50 border border-red-200 rounded-xl overflow-hidden">
                                <div className="px-4 sm:px-5 py-3 border-b border-red-100">
                                    <h3 className="text-xs sm:text-sm font-semibold text-red-700 flex items-center gap-2">
                                        <TrendingDown size={15} />
                                        Lost Reason
                                    </h3>
                                </div>
                                <div className="p-4 sm:p-5">
                                    <p className="text-xs sm:text-sm text-red-700">{deal.lostReasonText}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT — meta sidebar (1/3) */}
                    <div className="md:col-span-1 space-y-3 sm:space-y-4">

                        {/* Deal Info */}
                        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                            <div className="px-4 sm:px-5 py-3 border-b border-gray-100 bg-gray-50">
                                <h3 className="text-xs sm:text-sm font-semibold text-gray-900 flex items-center gap-2">
                                    <Handshake size={15} className="text-indigo-500" />
                                    Deal Info
                                </h3>
                            </div>
                            <div className="p-4 sm:p-5 space-y-3">
                                <SidebarRow label="Deal ID" value={`#${deal.id}`} />
                                <SidebarRow label="Opportunity" value={`#${deal.opportunityId}`} />
                                <SidebarRow
                                    label="Status"
                                    value={
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                                            {statusConfig.icon}
                                            {statusConfig.label}
                                        </span>
                                    }
                                />
                                <SidebarRow
                                    label="Created By"
                                    value={deal.createdByName ?? "—"}
                                    icon={<User size={12} className="text-gray-400" />}
                                />
                            </div>
                        </div>

                        {/* Financial */}
                        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                            <div className="px-4 sm:px-5 py-3 border-b border-gray-100 bg-gray-50">
                                <h3 className="text-xs sm:text-sm font-semibold text-gray-900 flex items-center gap-2">
                                    <DollarSign size={15} className="text-indigo-500" />
                                    Financials
                                </h3>
                            </div>
                            <div className="p-4 sm:p-5 space-y-3">
                                <div>
                                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Deal Value</p>
                                    <p className="text-lg font-bold " style={{ color: "#1e2d6b" }}>{formatCurrency(deal.dealValue)}</p>
                                </div>
                                {deal.opportunityExpectedValue && (
                                    <div>
                                        <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Expected Value</p>
                                        <p className="text-sm font-semibold text-gray-700">{formatCurrency(deal.opportunityExpectedValue)}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Timestamps */}
                        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                            <div className="px-4 sm:px-5 py-3 border-b border-gray-100 bg-gray-50">
                                <h3 className="text-xs sm:text-sm font-semibold text-gray-900 flex items-center gap-2">
                                    <Clock size={15} className="text-indigo-500" />
                                    Activity
                                </h3>
                            </div>
                            <div className="p-4 sm:p-5 space-y-3">
                                <SidebarRow label="Created" value={formatDate(deal.createdAt)} />
                                <SidebarRow label="Updated" value={formatDate(deal.updatedAt)} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Deal Modal */}
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
                                <span className="font-semibold">{deal.companyName ?? "this deal"}</span>?
                            </p>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
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
                                        <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Deleting...</>
                                    ) : (
                                        <><Trash2 size={16} /> Delete</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Note Modal */}
            {deleteNoteId && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                                    <AlertTriangle size={24} className="text-red-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Delete Note</h3>
                                    <p className="text-sm text-gray-500">This action cannot be undone</p>
                                </div>
                            </div>
                            <p className="text-sm text-gray-700 mb-6">
                                Are you sure you want to delete this note? It will be permanently removed.
                            </p>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setDeleteNoteId(null)}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDeleteNote}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center gap-2"
                                >
                                    <Trash2 size={16} /> Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <DealFormSlider isOpen={isSliderOpen} onClose={handleSliderClose} dealId={Number(id)} />
        </>
    );
};

// ── Sub-components ─────────────────────────────────────────────────────────────

const DetailRow = ({
    icon,
    label,
    value,
}: {
    icon?: React.ReactNode;
    label: string;
    value?: string | null;
}) => (
    <div className="flex items-start gap-2">
        {icon && <span className="mt-0.5 flex-shrink-0">{icon}</span>}
        <div className="min-w-0">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">{label}</p>
            <p className="text-xs sm:text-sm font-medium text-gray-800 truncate">{value ?? "—"}</p>
        </div>
    </div>
);

const DateCard = ({
    label,
    value,
    highlight = false,
}: {
    label: string;
    value: string;
    highlight?: boolean;
}) => (
    <div className={`rounded-lg p-3 ${highlight ? "bg-indigo-50 border border-indigo-100" : "bg-gray-50 border border-gray-100"}`}>
        <p className={`text-[10px] uppercase tracking-wider mb-1 ${highlight ? "text-indigo-500" : "text-gray-400"}`}>
            {label}
        </p>
        <p className={`text-xs sm:text-sm font-semibold ${highlight ? "text-indigo-700" : "text-gray-700"}`}>
            {value}
        </p>
    </div>
);

const SidebarRow = ({
    label,
    value,
    icon,
}: {
    label: string;
    value: React.ReactNode;
    icon?: React.ReactNode;
}) => (
    <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-gray-500 flex items-center gap-1 flex-shrink-0">
            {icon}
            {label}
        </span>
        <span className="text-xs font-medium text-gray-800 text-right">{value}</span>
    </div>
);

export default DealDetailPage;