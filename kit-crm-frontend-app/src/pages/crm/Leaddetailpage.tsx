import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    ArrowLeft, Edit2, Trash2, Building2, User, Flag, Tag,
    CheckCircle, Calendar, MoreVertical, AlertTriangle, Send, Clock,
} from "lucide-react";
import { toast } from "react-toastify";
import leadService from "@/services/leadService";
import userService from "@/services/userService";
import noteService from "@/services/noteService";
import taskService from "@/services/taskService";
import type { LeadResponse, LeadStatus } from "@/types/lead.types";
import type { NoteResponse } from "@/types/note.types";
import type { UsersTableViewData } from "@/types/Users";
import LeadFormSlider from "./Leadformslider";
import { useAuth } from "@/hooks/useAuth";

const LeadDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [lead, setLead] = useState<LeadResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
    const [showEditSlider, setShowEditSlider] = useState(false);
    const [, setLeadStatuses] = useState<LeadStatus[]>([]);
    const [, setUsers] = useState<UsersTableViewData[]>([]);

    // Notes state
    const [notes, setNotes] = useState<NoteResponse[]>([]);
    const [noteContent, setNoteContent] = useState("");
    const [isSavingNote, setIsSavingNote] = useState(false);

    // Follow-up task state
    const [showFollowupForm, setShowFollowupForm] = useState(false);
    const [followupDays, setFollowupDays] = useState<2 | 3 | 4 | 5>(2);
    const [isCreatingFollowup, setIsCreatingFollowup] = useState(false);

    // Delete modal state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const { user } = useAuth();
    const role = user?.role?.toLowerCase();
    const userId = (user as any)?.userId || (user as any)?.id;
    const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
    const [editContent, setEditContent] = useState("");
    const [savingEdit, setSavingEdit] = useState(false);

    const [deleteNoteId, setDeleteNoteId] = useState<number | null>(null);

    // Check if user is Data Analyst - can only manage notes
    const isDataAnalyst = role?.includes("data analyst");
    // Check if user can edit/delete notes (only own notes or admin)
    const canManageNote = (noteCreatedBy: number) => {
        return isDataAnalyst ? noteCreatedBy === userId : true;
    };

    useEffect(() => {
        if (id) {
            fetchLead();
            fetchNotes();
        }
    }, [id]);

    const fetchLead = async () => {
        try {
            setLoading(true);
            const response = await leadService.getLead(Number(id));
            setLead(response.data || null);
        } catch (error) {
            console.error("Error fetching lead:", error);
            toast.error("Failed to fetch lead details");
        } finally {
            setLoading(false);
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

    const fetchNotes = async () => {
        try {
            if (!id) return;
            const response = await noteService.getNotes({
                entityType: "lead",
                entityId: Number(id),
            });
            setNotes(response.data || []);
        } catch (error) {
            console.error("Error fetching notes:", error);
        }
    };

    // Handle save note
    const handleSaveNote = async () => {
        if (!noteContent.trim()) {
            toast.error("Please enter a note");
            return;
        }

        try {
            setIsSavingNote(true);
            await noteService.createNote({
                entity_type: "lead",
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

    // Calculate follow-up date (skip weekends)
    const calculateFollowupDate = (days: number): Date => {
        const dueDate = new Date();
        let count = 0;

        while (count < days) {
            dueDate.setDate(dueDate.getDate() + 1);
            const dayOfWeek = dueDate.getDay();
            // Skip Saturday (6) and Sunday (0)
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                count++;
            }
        }

        return dueDate;
    };

    // Handle delete note
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

    // Handle create follow-up task
    const handleCreateFollowup = async () => {
        try {
            setIsCreatingFollowup(true);
            const dueDate = calculateFollowupDate(followupDays);

            await taskService.createTask({
                entity_type: "lead",
                entity_id: Number(id),
                title: `Follow up on ${lead?.companyName}`,
                description: noteContent.trim() || `Follow up task for lead: ${lead?.companyName}`,
                task_type: "follow_up",
                priority: "medium",
                due_date: dueDate.toISOString(),
                assigned_to: (user as any)?.userId || (user as any)?.id,
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

    // Delete handlers
    const handleDeleteClick = () => {
        setIsActionMenuOpen(false);
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (!id) return;
        try {
            setIsDeleting(true);
            await leadService.deleteLead(Number(id));
            toast.success("Lead deleted successfully");
            navigate("/leads");
        } catch (error) {
            console.error("Error deleting lead:", error);
            toast.error("Failed to delete lead");
        } finally {
            setIsDeleting(false);
            setShowDeleteModal(false);
        }
    };

    const handleDeleteCancel = () => setShowDeleteModal(false);

    const handleSliderClose = (saved?: boolean) => {
        setShowEditSlider(false);
        if (saved) fetchLead();
    };

    const loadEditData = async () => {
        try {
            const statusesRes = await leadService.getLeadStatuses();
            setLeadStatuses(statusesRes.data || []);
            if (role === "admin") {
                const usersRes = await userService.getUsers({ page: 1, limit: 1000 });
                setUsers(usersRes?.data?.users || []);
            }
        } catch (error) {
            console.error("Error loading edit data:", error);
        }
    };

    const getPriorityColor = (priority?: string | null) => {
        if (!priority) return "text-gray-700";
        const colors = { low: "text-blue-700", medium: "text-yellow-700", high: "text-red-700" };
        return colors[priority as keyof typeof colors] || "text-gray-700";
    };

    const getPriorityBg = (priority?: string | null) => {
        if (!priority) return "bg-gray-100";
        const colors = { low: "bg-blue-100", medium: "bg-yellow-100", high: "bg-red-100" };
        return colors[priority as keyof typeof colors] || "bg-gray-100";
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-96 px-4">
                <div className="flex items-center gap-2 text-gray-600">
                    <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    Loading lead details...
                </div>
            </div>
        );
    }

    if (!lead) {
        return (
            <div className="flex flex-col items-center justify-center min-h-96 px-4">
                <Building2 size={64} className="text-gray-300 mb-4" />
                <p className="text-gray-600 text-lg text-center">Lead not found</p>
                <button onClick={() => navigate("/leads")} className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium">
                    Back to Leads
                </button>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-0 p-0">
                {/* Header */}
                <div className="flex items-center justify-between gap-2 xs:gap-3 px-3 sm:px-4 md:px-6 py-2 bg-white border-b border-gray-200 mt-[-20px]">
                    <div className="flex items-center gap-2 xs:gap-3 min-w-0 flex-1">
                        <button onClick={() => navigate("/leads")} className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0">
                            <ArrowLeft size={20} />
                        </button>
                        <div className="p-2 rounded-lg flex-shrink-0" style={{ backgroundColor: "#1e2d6b" }}>
                            <Building2 className="text-white" size={20} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h1 className="text-base xs:text-lg sm:text-xl md:text-2xl font-bold text-gray-900 truncate">{lead?.companyName || "Lead"}</h1>
                            <p className="text-xs xs:text-sm text-gray-500 mt-0.5 truncate">Lead Details</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 xs:gap-2 flex-shrink-0">
                        {/* Desktop buttons */}
                        <button
                            onClick={async () => {
                                await loadEditData();
                                setShowEditSlider(true);
                            }}
                            className="hidden sm:inline-flex items-center justify-center gap-1.5 px-2.5 xs:px-3.5 py-2 bg-indigo-50 border border-indigo-200 text-indigo-600 rounded-lg hover:bg-indigo-100 active:bg-indigo-200 transition-colors font-medium text-xs xs:text-sm whitespace-nowrap"
                        >
                            <Edit2 size={16} />
                            <span className="hidden sm:inline">Edit</span>
                        </button>
                        <button
                            onClick={handleDeleteClick}
                            disabled={isDeleting}
                            className="hidden sm:inline-flex items-center justify-center gap-1.5 px-2.5 xs:px-3.5 py-2 bg-red-50 border border-red-200 text-red-600 rounded-lg hover:bg-red-100 active:bg-red-200 transition-colors font-medium text-xs xs:text-sm whitespace-nowrap disabled:opacity-50"
                        >
                            <Trash2 size={16} />
                            <span className="hidden sm:inline">Delete</span>
                        </button>

                        {/* Mobile menu */}
                        <div className="sm:hidden relative">
                            <button onClick={() => setIsActionMenuOpen(!isActionMenuOpen)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                <MoreVertical size={20} className="text-gray-600" />
                            </button>
                            {isActionMenuOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                                    <button
                                        onClick={async (e) => {
                                            e.preventDefault();
                                            await loadEditData();
                                            setShowEditSlider(true);
                                            setIsActionMenuOpen(false);
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 hover:bg-indigo-50 transition-colors border-b border-gray-100"
                                    >
                                        <Edit2 size={16} className="text-indigo-600 flex-shrink-0" />
                                        <span>Edit Lead</span>
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleDeleteClick();
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
                                    >
                                        <Trash2 size={16} className="flex-shrink-0" />
                                        <span>Delete Lead</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 xs:gap-4 px-3 sm:px-4 md:px-6 py-3 xs:py-4 bg-gray-50">
                    {/* Left Column */}
                    <div className="lg:col-span-2 space-y-3 xs:space-y-4">
                        {/* Lead Card */}
                        <div className="bg-white rounded-lg xs:rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="px-3 xs:px-4 sm:px-6 py-4 xs:py-6 text-white" style={{ backgroundColor: "#1e2d6b" }}>
                                <div className="flex items-center gap-2 xs:gap-3 min-w-0">
                                    <div className="w-10 xs:w-12 sm:w-14 h-10 xs:h-12 sm:h-14 bg-white/20 backdrop-blur-sm rounded-lg xs:rounded-xl flex items-center justify-center flex-shrink-0 text-sm xs:text-lg sm:text-2xl font-bold">
                                        {lead?.companyName?.substring(0, 2).toUpperCase() || "L"}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h2 className="text-base xs:text-lg sm:text-2xl font-bold truncate">{lead?.companyName || "Lead"}</h2>
                                        {lead?.contactName && (
                                            <div className="flex items-center gap-1 text-indigo-100 mt-0.5 text-xs xs:text-sm truncate">
                                                <User size={12} className="flex-shrink-0" />
                                                <span className="truncate">{lead.contactName}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="p-3 xs:p-4 sm:p-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 xs:gap-4 sm:gap-6">
                                    <InfoItem icon={<Building2 size={16} className="text-purple-600 flex-shrink-0" />} label="Company" value={lead?.companyName || "—"} />
                                    <InfoItem icon={<User size={16} className="text-purple-600 flex-shrink-0" />} label="Contact" value={lead?.contactName || "No contact assigned"} />
                                    <InfoItem icon={<Flag size={16} className={`${getPriorityColor(lead?.priority)} flex-shrink-0`} />} label="Priority" value={lead?.priority ? lead.priority.charAt(0).toUpperCase() + lead.priority.slice(1) : "—"} />
                                    <InfoItem icon={<CheckCircle size={16} className="text-blue-600 flex-shrink-0" />} label="Status" value={lead?.leadStatusName || "—"} />
                                    {lead?.assignedToName && (
                                        <InfoItem icon={<User size={16} className="text-purple-600 flex-shrink-0" />} label="Assigned To" value={lead.assignedToName} />
                                    )}
                                </div>

                                {lead?.tags && (
                                    <div className="mt-4 xs:mt-6 pt-4 xs:pt-6 border-t border-gray-200">
                                        <div className="flex items-center gap-2 text-xs xs:text-sm text-gray-500 mb-2">
                                            <Tag size={16} />Tags
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {lead.tags.split(",").map((tag, index) => (
                                                <span key={index} className="px-2 xs:px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
                                                    {tag.trim()}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {lead?.qualifiedAt && (
                                    <div className="mt-4 xs:mt-6 pt-4 xs:pt-6 border-t border-gray-200">
                                        <div className="flex items-center gap-2 text-xs xs:text-sm text-gray-500 mb-1">
                                            <CheckCircle size={16} />
                                            Qualified At
                                        </div>
                                        <p className="text-sm xs:text-base font-semibold text-gray-900">
                                            {new Date(lead.qualifiedAt).toLocaleDateString("en-US", {
                                                year: "numeric",
                                                month: "long",
                                                day: "numeric",
                                            })}
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

                        {/* Timeline */}
                        <div className="bg-white rounded-lg xs:rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="px-3 xs:px-4 sm:px-6 py-2.5 xs:py-3 sm:py-4 border-b border-gray-200">
                                <h3 className="text-xs xs:text-sm sm:text-lg font-semibold text-gray-900">Timeline</h3>
                            </div>
                            <div className="p-3 xs:p-4 sm:p-6">
                                <div className="space-y-3 xs:space-y-4">
                                    <ActivityItem
                                        icon={<Calendar className="text-blue-600" size={14} />}
                                        title="Lead Created"
                                        timestamp={lead?.createdAt ? new Date(lead.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "—"}
                                    />
                                    <ActivityItem
                                        icon={<Calendar className="text-purple-600" size={14} />}
                                        title="Last Updated"
                                        timestamp={lead?.updatedAt ? new Date(lead.updatedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "—"}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-3 xs:space-y-4">
                        <div className="bg-white rounded-lg xs:rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="px-3 xs:px-4 sm:px-6 py-2.5 xs:py-3 sm:py-4 border-b border-gray-200">
                                <h3 className="text-xs xs:text-sm sm:text-lg font-semibold text-gray-900">Status</h3>
                            </div>
                            <div className="p-3 xs:p-4 sm:p-6">
                                <div className="flex items-center gap-2">
                                    <CheckCircle size={18} className="text-blue-600 flex-shrink-0" />
                                    <span className="font-medium text-xs xs:text-sm text-blue-600">{lead?.leadStatusName || "—"}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg xs:rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="px-3 xs:px-4 sm:px-6 py-2.5 xs:py-3 sm:py-4 border-b border-gray-200">
                                <h3 className="text-xs xs:text-sm sm:text-lg font-semibold text-gray-900">Priority</h3>
                            </div>
                            <div className={`p-3 xs:p-4 sm:p-6 ${getPriorityBg(lead?.priority)}`}>
                                <div className="flex items-center gap-2">
                                    <Flag size={18} className={`${getPriorityColor(lead?.priority)} flex-shrink-0`} />
                                    <span className={`font-medium text-xs xs:text-sm ${getPriorityColor(lead?.priority)}`}>
                                        {lead?.priority ? lead.priority.charAt(0).toUpperCase() + lead.priority.slice(1) : "—"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg xs:rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="px-3 xs:px-4 sm:px-6 py-2.5 xs:py-3 sm:py-4 border-b border-gray-200">
                                <h3 className="text-xs xs:text-sm sm:text-lg font-semibold text-gray-900">Quick Info</h3>
                            </div>
                            <div className="p-3 xs:p-4 sm:p-6 space-y-2 xs:space-y-3">
                                <StatItem label="Lead ID" value={`#${lead?.id || "—"}`} />
                                {lead?.assignedToName && <StatItem label="Owner" value={lead.assignedToName} />}
                                <StatItem label="Created" value={lead?.createdAt ? new Date(lead.createdAt).toLocaleDateString() : "—"} />
                            </div>
                        </div>
                    </div>
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
                                    <h3 className="text-lg font-semibold text-gray-900">Delete Lead</h3>
                                    <p className="text-sm text-gray-500">This action cannot be undone</p>
                                </div>
                            </div>
                            <p className="text-sm text-gray-700 mb-6">
                                Are you sure you want to delete the lead for <span className="font-semibold">{lead?.companyName || "this lead"}</span>?
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
                                        <>
                                            <Trash2 size={16} /> Delete
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

            {showEditSlider && lead && (
                <LeadFormSlider isOpen={showEditSlider} leadId={lead?.id} onClose={handleSliderClose} />
            )}

            {isActionMenuOpen && (
                <div className="fixed inset-0 z-40 sm:hidden" onClick={() => setIsActionMenuOpen(false)} />
            )}
        </>
    );
};

const InfoItem = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
    <div>
        <div className="flex items-center gap-2 text-xs xs:text-sm text-gray-500 mb-1">
            {icon}
            <span className="whitespace-nowrap">{label}</span>
        </div>
        <p className="text-xs xs:text-sm text-gray-900 font-medium break-words">{value}</p>
    </div>
);

const ActivityItem = ({ icon, title, timestamp }: { icon: React.ReactNode; title: string; timestamp: string }) => (
    <div className="flex gap-2 xs:gap-3">
        <div className="w-7 xs:w-8 h-7 xs:h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
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

export default LeadDetailPage;