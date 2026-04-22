import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    CheckSquare,
    Calendar,
    Clock,
    Flag,
    User,
    Building2,
    FileText,
    Edit,
    Trash2,
    CheckCircle2,
    AlertCircle,
    Bell,
} from "lucide-react";
import { toast } from "react-toastify";
import apiCall from "@/utils/axios";
import type { TaskResponse } from "@/types/task.types";
import TaskFormSlider from "./TaskFormSlider";

const TaskDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [task, setTask] = useState<TaskResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [completing, setCompleting] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const [isSliderOpen, setIsSliderOpen] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showCompleteModal, setShowCompleteModal] = useState(false);
    const [outcome, setOutcome] = useState("");

    useEffect(() => {
        if (id) fetchTask();
    }, [id]);

    const fetchTask = async () => {
        try {
            setLoading(true);
            const response = await apiCall.get(`/tasks/${id}`);
            if (response.data.status && response.data.data) {
                setTask(response.data.data);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to fetch task");
            navigate("/tasks");
        } finally {
            setLoading(false);
        }
    };

    const handleComplete = async () => {
        if (!id) return;
        try {
            setCompleting(true);
            const payload = outcome.trim() ? { outcome: outcome.trim() } : {};
            await apiCall.post(`/tasks/${id}/complete`, payload);
            toast.success("Task marked as completed");
            setShowCompleteModal(false);
            setOutcome("");
            fetchTask();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to complete task");
        } finally {
            setCompleting(false);
        }
    };

    const handleDelete = async () => {
        if (!id) return;
        try {
            setDeleting(true);
            await apiCall.delete(`/tasks/${id}`);
            toast.success("Task deleted successfully");
            navigate("/tasks");
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to delete task");
        } finally {
            setDeleting(false);
        }
    };

    const handleSliderClose = (saved: boolean = false) => {
        setIsSliderOpen(false);
        if (saved) fetchTask();
    };

    const formatDate = (date: string | null) => {
        if (!date) return "—";
        return new Date(date).toLocaleDateString("en-US", {
            weekday: "long", month: "long", day: "numeric",
            year: "numeric", hour: "2-digit", minute: "2-digit",
        });
    };

    const formatDateShort = (date: string | null) => {
        if (!date) return "—";
        return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "urgent": return { bg: "bg-red-100",    text: "text-red-700",    border: "border-red-200" };
            case "high":   return { bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-200" };
            case "medium": return { bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-200" };
            case "low":    return { bg: "bg-green-100",  text: "text-green-700",  border: "border-green-200" };
            default:       return { bg: "bg-gray-100",   text: "text-gray-700",   border: "border-gray-200" };
        }
    };

    const isOverdue = (dueDate: string | null) => {
        if (!dueDate) return false;
        return new Date(dueDate) < new Date();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!task) {
        return <div className="p-6 text-center"><p className="text-gray-500">Task not found</p></div>;
    }

    const priorityColors = getPriorityColor(task.priority);

    return (
        <>
            <div className="space-y-0 p-0">
                {/* Header */}
                <div className="bg-white border-b border-gray-200 px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                    <div className="flex items-center justify-between gap-3 mb-3">
                        <button onClick={() => navigate("/tasks")} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
                            <ArrowLeft size={18} />
                            <span className="text-sm font-medium">Back</span>
                        </button>
                        <div className="flex items-center gap-2">
                            {!task.completed && (
                                <button
                                    onClick={() => setShowCompleteModal(true)}
                                    className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs sm:text-sm font-medium"
                                >
                                    <CheckCircle2 size={13} className="sm:hidden" />
                                    <CheckCircle2 size={14} className="hidden sm:block" />
                                    <span className="hidden xs:inline">Mark Complete</span>
                                    <span className="xs:hidden">Done?</span>
                                </button>
                            )}
                            <button onClick={() => setIsSliderOpen(true)} className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                                <Edit size={16} />
                            </button>
                            <button onClick={() => setShowDeleteModal(true)} className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>

                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <CheckSquare className="text-indigo-600 flex-shrink-0" size={24} />
                                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{task.title}</h1>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                {task.completed ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                                        <CheckCircle2 size={14} />Completed
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 border border-yellow-200">
                                        <Clock size={14} />Pending
                                    </span>
                                )}
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${priorityColors.bg} ${priorityColors.text} border ${priorityColors.border}`}>
                                    <Flag size={14} />{task.priority}
                                </span>
                                {isOverdue(task.dueDate) && !task.completed && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200">
                                        <AlertCircle size={14} />Overdue
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="px-3 sm:px-4 md:px-6 py-4 sm:py-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                        {/* Main Details */}
                        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                            {task.description && (
                                <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
                                    <div className="flex items-center gap-2 mb-3">
                                        <FileText size={18} className="text-gray-600" />
                                        <h2 className="text-base sm:text-lg font-semibold text-gray-900">Description</h2>
                                    </div>
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{task.description}</p>
                                </div>
                            )}

                            {task.outcome && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4 sm:p-6">
                                    <div className="flex items-center gap-2 mb-3">
                                        <CheckCircle2 size={18} className="text-green-600" />
                                        <h2 className="text-base sm:text-lg font-semibold text-green-900">Outcome</h2>
                                    </div>
                                    <p className="text-sm text-green-700 whitespace-pre-wrap">{task.outcome}</p>
                                </div>
                            )}

                            <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
                                <div className="flex items-center gap-2 mb-3">
                                    <Building2 size={18} className="text-gray-600" />
                                    <h2 className="text-base sm:text-lg font-semibold text-gray-900">Related Entity</h2>
                                </div>
                                <div className="space-y-2">
                                    <div>
                                        <span className="text-xs text-gray-500">Type</span>
                                        <p className="text-sm font-medium text-gray-900 capitalize">{task.entityType}</p>
                                    </div>
                                    <div>
                                        <span className="text-xs text-gray-500">ID</span>
                                        <p className="text-sm font-medium text-gray-900">{task.entityId}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="lg:col-span-1 space-y-4">
                            <div className="bg-white border border-gray-200 rounded-lg p-4">
                                <h3 className="text-sm font-semibold text-gray-900 mb-3">Task Details</h3>
                                <div className="space-y-3">
                                    <div>
                                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-1"><FileText size={12} />Task Type</div>
                                        <p className="text-sm font-medium text-gray-900">{task.taskType}</p>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-1"><Calendar size={12} />Due Date</div>
                                        <p className={`text-sm font-medium ${isOverdue(task.dueDate) && !task.completed ? "text-red-600" : "text-gray-900"}`}>
                                            {formatDateShort(task.dueDate)}
                                        </p>
                                    </div>
                                    {task.reminderDate && (
                                        <div>
                                            <div className="flex items-center gap-2 text-xs text-gray-500 mb-1"><Bell size={12} />Reminder Date</div>
                                            <p className="text-sm font-medium text-gray-900">{formatDateShort(task.reminderDate)}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="bg-white border border-gray-200 rounded-lg p-4">
                                <h3 className="text-sm font-semibold text-gray-900 mb-3">People</h3>
                                <div className="space-y-3">
                                    <div>
                                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-1"><User size={12} />Assigned To</div>
                                        <p className="text-sm font-medium text-gray-900">{task.assignedToName || "—"}</p>
                                        {task.assignedToEmail && <p className="text-xs text-gray-500">{task.assignedToEmail}</p>}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-1"><User size={12} />Created By</div>
                                        <p className="text-sm font-medium text-gray-900">{task.createdByName || "—"}</p>
                                    </div>
                                    {task.completedByName && (
                                        <div>
                                            <div className="flex items-center gap-2 text-xs text-gray-500 mb-1"><CheckCircle2 size={12} />Completed By</div>
                                            <p className="text-sm font-medium text-gray-900">{task.completedByName}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="bg-white border border-gray-200 rounded-lg p-4">
                                <h3 className="text-sm font-semibold text-gray-900 mb-3">Timeline</h3>
                                <div className="space-y-3">
                                    <div>
                                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-1"><Clock size={12} />Created</div>
                                        <p className="text-xs text-gray-700">{formatDate(task.createdAt)}</p>
                                    </div>
                                    {task.completedAt && (
                                        <div>
                                            <div className="flex items-center gap-2 text-xs text-gray-500 mb-1"><CheckCircle2 size={12} />Completed</div>
                                            <p className="text-xs text-gray-700">{formatDate(task.completedAt)}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Complete Modal — responsive button sizes */}
            {showCompleteModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                        <div className="p-5 sm:p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                    <CheckCircle2 size={20} className="text-green-600 sm:hidden" />
                                    <CheckCircle2 size={24} className="text-green-600 hidden sm:block" />
                                </div>
                                <div>
                                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">Complete Task</h3>
                                    <p className="text-xs sm:text-sm text-gray-500">Mark this task as completed</p>
                                </div>
                            </div>
                            <div className="mb-4">
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                                    Outcome <span className="text-gray-400 font-normal">(Optional)</span>
                                </label>
                                <textarea
                                    value={outcome}
                                    onChange={(e) => setOutcome(e.target.value)}
                                    placeholder="Describe the outcome or result..."
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-50 resize-none"
                                />
                            </div>
                            <div className="flex items-center gap-2 sm:gap-3">
                                <button
                                    onClick={() => { setShowCompleteModal(false); setOutcome(""); }}
                                    disabled={completing}
                                    className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm text-gray-700 hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleComplete}
                                    disabled={completing}
                                    className="flex-1 px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs sm:text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-1.5 sm:gap-2"
                                >
                                    {completing ? (
                                        <><div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Completing...</>
                                    ) : (
                                        <><CheckCircle2 size={14} /> Complete</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal — responsive button sizes */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                        <div className="p-5 sm:p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                                    <AlertCircle size={20} className="text-red-600 sm:hidden" />
                                    <AlertCircle size={24} className="text-red-600 hidden sm:block" />
                                </div>
                                <div>
                                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">Delete Task</h3>
                                    <p className="text-xs sm:text-sm text-gray-500">This action cannot be undone</p>
                                </div>
                            </div>
                            <p className="text-xs sm:text-sm text-gray-700 mb-5 sm:mb-6">
                                Are you sure you want to delete <span className="font-semibold">"{task.title}"</span>?
                            </p>
                            <div className="flex items-center gap-2 sm:gap-3">
                                <button onClick={() => setShowDeleteModal(false)} disabled={deleting} className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm text-gray-700 hover:bg-gray-50 transition-colors font-medium disabled:opacity-50">Cancel</button>
                                <button onClick={handleDelete} disabled={deleting} className="flex-1 px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs sm:text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-1.5 sm:gap-2">
                                    {deleting ? (
                                        <><div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Deleting...</>
                                    ) : (
                                        <><Trash2 size={14} /> Delete</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <TaskFormSlider isOpen={isSliderOpen} onClose={handleSliderClose} taskId={task.id} />
        </>
    );
};

export default TaskDetailPage;