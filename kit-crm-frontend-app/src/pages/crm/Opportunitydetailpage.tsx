import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    TrendingUp,
    Edit,
    Trash2,
    ArrowLeft,
    Building2,
    User,
    Calendar,
    DollarSign,
    BarChart3,
    FileText,
    AlertCircle,
    Target,
    CheckCircle,
    XCircle,
    Send,
    Clock,
    Edit2,
} from "lucide-react";
import { toast } from "react-toastify";
import apiCall from "@/utils/axios";
import noteService from "@/services/noteService";
import taskService from "@/services/taskService";
import type { OpportunityResponse } from "@/types/opportunity.types";
import type { NoteResponse } from "@/types/note.types";
import OpportunityFormSlider from "./OpportunityFormSlider";
import { useAuth } from "@/hooks/useAuth";

const OpportunityDetailPage = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [opportunity, setOpportunity] = useState<OpportunityResponse | null>(null);
    const [loading, setLoading] = useState(true);
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
            fetchOpportunityData();
            fetchNotes();
        }
    }, [id]);

    const fetchOpportunityData = async () => {
        if (!id) return;

        try {
            setLoading(true);
            const response = await apiCall.get(`/opportunities/${id}`);
            const { status, data } = response.data;

            if (!status || !data) {
                toast.error("Opportunity not found");
                navigate("/opportunities");
                return;
            }

            setOpportunity(data);
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to fetch opportunity");
            navigate("/opportunities");
        } finally {
            setLoading(false);
        }
    };

    const fetchNotes = async () => {
        try {
            if (!id) return;
            const response = await noteService.getNotes({
                entityType: "opportunity",
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
                entity_type: "opportunity",
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
                entity_type: "opportunity",
                entity_id: Number(id),
                title: `Follow up on ${opportunity?.leadCompanyName}`,
                description: noteContent.trim() || `Follow up task for opportunity: ${opportunity?.leadCompanyName}`,
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

    const handleDeleteClick = () => {
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (!id) return;

        try {
            setIsDeleting(true);
            await apiCall.delete(`/opportunities/${id}`);
            toast.success("Opportunity deleted successfully");
            navigate("/opportunities");
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to delete opportunity");
        } finally {
            setIsDeleting(false);
            setShowDeleteModal(false);
        }
    };

    const handleDeleteCancel = () => {
        setShowDeleteModal(false);
    };

    const handleSliderClose = (saved: boolean = false) => {
        setIsSliderOpen(false);
        if (saved) {
            fetchOpportunityData();
        }
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

    const formatDate = (date: string | null | undefined) => {
        if (!date) return "Not set";
        return new Date(date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-96 px-4">
                <div className="flex items-center gap-2 text-gray-600">
                    <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    Loading opportunity details...
                </div>
            </div>
        );
    }

    if (!opportunity) {
        return (
            <div className="flex flex-col items-center justify-center min-h-96 px-4">
                <TrendingUp size={64} className="text-gray-300 mb-4" />
                <p className="text-gray-600 text-lg text-center">Opportunity not found</p>
                <button
                    onClick={() => navigate("/opportunities")}
                    className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium"
                >
                    Back to Opportunities
                </button>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-0 p-0">
                {/* Header */}
                <div className="flex items-center justify-between gap-2 xs:gap-3 px-3 sm:px-4 md:px-6 py-2 mt-[-20px]">
                    <div className="flex items-center gap-2 xs:gap-3 min-w-0 flex-1">
                        <button
                            onClick={() => navigate("/opportunities")}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div className="p-2 bg-[#1e2d6b]  rounded-lg flex-shrink-0">
                            <TrendingUp className="text-white" size={20} />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-lg xs:text-xl md:text-2xl font-bold text-gray-900 truncate">
                                {opportunity.leadCompanyName || "Opportunity"}
                            </h1>
                            <p className="text-xs xs:text-sm text-gray-500 mt-0.5">Opportunity Details</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 xs:gap-2 flex-shrink-0">
                        <button
                            onClick={() => setIsSliderOpen(true)}
                            className="inline-flex items-center justify-center gap-1.5 px-2.5 xs:px-3.5 py-2 bg-indigo-50 border border-indigo-200 text-indigo-600 rounded-lg hover:bg-indigo-100 active:bg-indigo-200 transition-colors font-medium text-xs xs:text-sm whitespace-nowrap"
                            title="Edit opportunity"
                        >
                            <Edit size={16} />
                            <span className="hidden xs:inline">Edit</span>
                        </button>
                        <button
                            onClick={handleDeleteClick}
                            className="inline-flex items-center justify-center gap-1.5 px-2.5 xs:px-3.5 py-2 bg-red-50 border border-red-200 text-red-600 rounded-lg hover:bg-red-100 active:bg-red-200 transition-colors font-medium text-xs xs:text-sm whitespace-nowrap"
                            title="Delete opportunity"
                        >
                            <Trash2 size={16} />
                            <span className="hidden xs:inline">Delete</span>
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 px-3 sm:px-4 md:px-6 py-4">
                    {/* Left Column */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Opportunity Card */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            {/* Header Section */}
                            <div className=" px-4 xs:px-6 py-6 text-[#1e2d6b] xs:py-8 text-white" style={{ backgroundColor: "#1e2d6b" }}>
                                <div className="flex flex-col xs:flex-row xs:items-start xs:justify-between gap-4">
                                    <div className="flex items-center gap-3 xs:gap-4 min-w-0">
                                        <div className="w-12 xs:w-16 h-12 xs:h-16 bg-white/20 backdrop-blur-sm rounded-lg xs:rounded-xl flex items-center justify-center flex-shrink-0">
                                            <span className="text-lg xs:text-2xl font-bold">
                                                {opportunity.leadCompanyName?.substring(0, 2).toUpperCase() || "OPP"}
                                            </span>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h2 className="text-lg xs:text-2xl font-bold truncate">
                                                {opportunity.leadCompanyName || "Unknown Company"}
                                            </h2>
                                            <p className="text-indigo-200 text-xs xs:text-sm mt-1 truncate">
                                                {opportunity.leadContactName || "No contact"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Info Grid */}
                            <div className="p-4 xs:p-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 xs:gap-6">
                                    <InfoItem
                                        icon={<DollarSign size={18} className="text-[#1e2d6b]" />}
                                        label="Expected Value"
                                        value={formatCurrency(opportunity.expectedValue)}
                                    />
                                    <InfoItem
                                        icon={<Calendar size={18} className="text-[#1e2d6b]" />}
                                        label="Expected Close Date"
                                        value={formatDate(opportunity.expectedCloseDate)}
                                    />
                                    <InfoItem
                                        icon={<Target size={18} className="text-[#1e2d6b]" />}
                                        label="Probability"
                                        value={`${opportunity.probability || 0}%`}
                                    />
                                    <InfoItem
                                        icon={<Building2 size={18} className="text-[#1e2d6b]" />}
                                        label="Lead Company"
                                        value={opportunity.leadCompanyName || "Not specified"}
                                    />
                                    <InfoItem
                                        icon={<User size={18} className="text-[#1e2d6b]" />}
                                        label="Contact Person"
                                        value={opportunity.leadContactName || "Not specified"}
                                    />
                                    <InfoItem
                                        icon={<BarChart3 size={18} className="text-[#1e2d6b]" />}
                                        label="Stage"
                                        value={opportunity.stageName || "Not specified"}
                                    />
                                </div>

                                {/* Description */}
                                {opportunity.description && (
                                    <div className="mt-4 xs:mt-6 pt-4 xs:pt-6 border-t border-gray-200">
                                        <h3 className="text-xs xs:text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                            <FileText size={16} />
                                            Description
                                        </h3>
                                        <p className="text-xs xs:text-sm text-gray-600 leading-relaxed">
                                            {opportunity.description}
                                        </p>
                                    </div>
                                )}

                                {/* Competitor Info */}
                                {opportunity.competitorInfo && (
                                    <div className="mt-4 xs:mt-6 pt-4 xs:pt-6 border-t border-gray-200">
                                        <h3 className="text-xs xs:text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                            <AlertCircle size={16} />
                                            Competitor Information
                                        </h3>
                                        <p className="text-xs xs:text-sm text-gray-600 leading-relaxed">
                                            {opportunity.competitorInfo}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Notes Section */}
                        <div className="bg-white rounded-lg xs:rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="px-3 xs:px-4 sm:px-6 py-2.5 xs:py-3 sm:py-4 border-b border-gray-200">
                                <h3 className="text-xs xs:text-sm sm:text-lg font-semibold text-gray-900">Notes</h3>
                            </div>

                            <div className="p-3 xs:p-4 sm:p-6 space-y-4">
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

                        {/* Activity Timeline */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="px-4 xs:px-6 py-3 xs:py-4 border-b border-gray-200">
                                <h3 className="text-sm xs:text-lg font-semibold text-gray-900">
                                    Timeline
                                </h3>
                            </div>
                            <div className="p-4 xs:p-6">
                                <div className="space-y-4">
                                    <ActivityItem
                                        icon={<Calendar className="text-blue-600" size={16} />}
                                        title="Opportunity Created"
                                        timestamp={formatDate(opportunity.createdAt)}
                                    />
                                    {opportunity.actualCloseDate && (
                                        <ActivityItem
                                            icon={<CheckCircle className="text-[#1e2d6b]" size={16} />}
                                            title="Closed"
                                            timestamp={formatDate(opportunity.actualCloseDate)}
                                        />
                                    )}
                                    <ActivityItem
                                        icon={<Calendar className="text-purple-600" size={16} />}
                                        title="Last Updated"
                                        timestamp={formatDate(opportunity.updatedAt)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Sidebar */}
                    <div className="space-y-4">
                        {/* Value Card */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="px-4 xs:px-6 py-3 xs:py-4 border-b border-gray-200">
                                <h3 className="text-sm xs:text-lg font-semibold text-gray-900">
                                    Financial Details
                                </h3>
                            </div>
                            <div className="p-4 xs:p-6 space-y-4">
                                <div className="text-center">
                                    <p className="text-xs text-gray-500 mb-2">Expected Value</p>
                                    <p className="text-2xl xs:text-3xl font-bold text-[#1e2d6b]">
                                        {formatCurrency(opportunity.expectedValue)}
                                    </p>
                                </div>
                                <div className="pt-4 border-t border-gray-200">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600">Probability</span>
                                        <span className="font-semibold text-gray-900">
                                            {opportunity.probability || 0}%
                                        </span>
                                    </div>
                                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-[#1e2d6b] h-2 rounded-full transition-all"
                                            style={{ width: `${opportunity.probability || 0}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Dates Card */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="px-4 xs:px-6 py-3 xs:py-4 border-b border-gray-200">
                                <h3 className="text-sm xs:text-lg font-semibold text-gray-900">
                                    Important Dates
                                </h3>
                            </div>
                            <div className="p-4 xs:p-6 space-y-3">
                                <StatItem
                                    label="Expected Close"
                                    value={formatDate(opportunity.expectedCloseDate)}
                                />
                                {opportunity.actualCloseDate && (
                                    <StatItem
                                        label="Actual Close"
                                        value={formatDate(opportunity.actualCloseDate)}
                                    />
                                )}
                                <StatItem
                                    label="Created"
                                    value={formatDate(opportunity.createdAt)}
                                />
                            </div>
                        </div>

                        {/* Status Card */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="px-4 xs:px-6 py-3 xs:py-4 border-b border-gray-200">
                                <h3 className="text-sm xs:text-lg font-semibold text-gray-900">
                                    Status
                                </h3>
                            </div>
                            <div className="p-4 xs:p-6">
                                {opportunity.actualCloseDate ? (
                                    <div className="flex items-center gap-2 text-[#1e2d6b]">
                                        <CheckCircle size={20} />
                                        <span className="font-medium text-sm">Closed</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-blue-600">
                                        <BarChart3 size={20} />
                                        <span className="font-medium text-sm">In Progress</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Lost Reason Card */}
                        {opportunity.lostReasonText && (
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                <div className="px-4 xs:px-6 py-3 xs:py-4 border-b border-gray-200">
                                    <h3 className="text-sm xs:text-lg font-semibold text-gray-900">
                                        Lost Reason
                                    </h3>
                                </div>
                                <div className="p-4 xs:px-6">
                                    <div className="flex items-center gap-2 text-red-600 mb-2">
                                        <XCircle size={16} />
                                        <span className="font-medium text-sm">Opportunity Lost</span>
                                    </div>
                                    <p className="text-xs xs:text-sm text-gray-600">
                                        {opportunity.lostReasonText}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Edit Opportunity Form Slider */}
            <OpportunityFormSlider
                isOpen={isSliderOpen}
                onClose={handleSliderClose}
                opportunityId={id ? parseInt(id) : null}
            />

            {/* Delete Opportunity Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                                    <AlertCircle size={24} className="text-red-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Delete Opportunity</h3>
                                    <p className="text-sm text-gray-500">This action cannot be undone</p>
                                </div>
                            </div>

                            <p className="text-sm text-gray-700 mb-6">
                                Are you sure you want to delete opportunity for{" "}
                                <span className="font-semibold">
                                    {opportunity?.leadCompanyName || "this opportunity"}
                                </span>
                                ?
                            </p>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleDeleteCancel}
                                    disabled={isDeleting}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                                >
                                    Cancel
                                </button>

                                <button
                                    onClick={handleDeleteConfirm}
                                    disabled={isDeleting}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium flex items-center justify-center gap-2"
                                >
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

            {/* Delete Note Modal */}
            {deleteNoteId && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                                    <AlertCircle size={24} className="text-red-600" />
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
        </>
    );
};

// Helper Components
const InfoItem = ({
    icon,
    label,
    value,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
}) => (
    <div>
        <div className="flex items-center gap-2 text-xs xs:text-sm text-gray-500 mb-1">
            {icon}
            <span>{label}</span>
        </div>
        <p className="text-xs xs:text-sm text-gray-900 font-medium">{value}</p>
    </div>
);

const ActivityItem = ({
    icon,
    title,
    timestamp,
}: {
    icon: React.ReactNode;
    title: string;
    timestamp: string;
}) => (
    <div className="flex gap-2 xs:gap-3">
        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
            {icon}
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-xs xs:text-sm font-medium text-gray-900">{title}</p>
            <p className="text-xs text-gray-500 mt-0.5">{timestamp}</p>
        </div>
    </div>
);

const StatItem = ({ label, value }: { label: string; value: string }) => (
    <div className="flex items-center justify-between">
        <span className="text-xs xs:text-sm text-gray-600">{label}</span>
        <span className="text-xs xs:text-sm font-semibold text-gray-900">{value}</span>
    </div>
);

export default OpportunityDetailPage;