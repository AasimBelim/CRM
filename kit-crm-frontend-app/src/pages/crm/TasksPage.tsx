import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    CheckSquare,
    Plus,
    Search,
    Filter,
    Eye,
    Edit,
    Trash2,
    Clock,
    AlertCircle,
    CheckCircle2,
    Calendar,
    Flag,
    User,
    AlertTriangle,
} from "lucide-react";
import { toast } from "react-toastify";
import taskService from "@/services/taskService";
import type { TaskResponse, TaskQueryParams, TaskStats } from "@/types/task.types";
import type { PaginationMeta } from "@/types/common.types";
import TaskFormSlider from "./TaskFormSlider";
import { useAuth } from "@/hooks/useAuth";

const TasksPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const userId = (user as any)?.userId || (user as any)?.id;

    const [tasks, setTasks] = useState<TaskResponse[]>([]);
    const [stats, setStats] = useState<TaskStats | null>(null);
    const [pagination, setPagination] = useState<PaginationMeta | null>(null);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

    const [isSliderOpen, setIsSliderOpen] = useState(false);
    const [editingTaskId, setEditingTaskId] = useState<number | null>(null);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingTaskId, setDeletingTaskId] = useState<number | null>(null);
    const [deletingTaskTitle, setDeletingTaskTitle] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);

    const [showFilters, setShowFilters] = useState(false);
    const [allTasks, setAllTasks] = useState<TaskResponse[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [completingTaskId, setCompletingTaskId] = useState<number | null>(null);
    const [completeOutcome, setCompleteOutcome] = useState("");
    const [completeConfirmModal, setCompleteConfirmModal] = useState<{ show: boolean; id?: number; title?: string }>({ show: false });
    const [filters, setFilters] = useState<TaskQueryParams>({
        completed: undefined,
        priority: undefined,
        overdue: undefined,
        sortBy: "dueDate",
        sortOrder: "asc",
    });
    const role = (user as any)?.role?.toLowerCase() || "";
    const isAdmin = role.includes("admin");

    const fetchTasks = async (pageNum: number = 1) => {
        try {
            setLoading(true);
            const params: TaskQueryParams = {
                ...(isAdmin ? {} : { assignedTo: userId, createdBy: userId }),
                completed: filters.completed,
                priority: filters.priority,
                overdue: filters.overdue,
                sortBy: filters.sortBy,
                sortOrder: filters.sortOrder,
                page: pageNum,
                limit: 20,
            };
            const response = await taskService.getTasks(params);
            setAllTasks(response.data || []);
            setTasks(response.data || []);
            if (response.pagination) {
                const p = response.pagination;
                setPagination({
                    currentPage: p.page ?? pageNum,
                    totalPages: p.totalPages ?? 1,
                    totalItems: p.total ?? 0,
                    hasNextPage: (p.page ?? pageNum) < (p.totalPages ?? 1),
                    hasPreviousPage: (p.page ?? pageNum) > 1,
                });
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to fetch tasks");
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const params: any = isAdmin ? {} : { assignedTo: userId, createdBy: userId };
            const response = await taskService.getStats(params);
            if (response.data) setStats(response.data);
        } catch (error) {
            console.error("Error fetching stats:", error);
        }
    };

    useEffect(() => {
        if (!searchTerm.trim()) {
            setTasks(allTasks);
            return;
        }
        const searchLower = searchTerm.toLowerCase();
        const filtered = allTasks.filter(
            (task) =>
                task.title.toLowerCase().includes(searchLower) ||
                task.description?.toLowerCase().includes(searchLower) ||
                task.taskType.toLowerCase().includes(searchLower) ||
                task.assignedToName?.toLowerCase().includes(searchLower)
        );
        setTasks(filtered);
    }, [searchTerm, allTasks]);

    useEffect(() => {
        fetchTasks(currentPage);
        fetchStats();
    }, [currentPage, filters, userId]);

    const handleSearch = (value: string) => setSearchTerm(value);

    const handleFilterChange = (key: keyof TaskQueryParams, value: any) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
        setCurrentPage(1);
    };

    const clearFilters = () => {
        setFilters({ completed: undefined, priority: undefined, overdue: undefined, sortBy: "dueDate", sortOrder: "asc" });
        setSearchTerm("");
        setCurrentPage(1);
    };

    const handleDeleteClick = (task: TaskResponse) => {
        setDeletingTaskId(task.id);
        setDeletingTaskTitle(task.title);
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (!deletingTaskId) return;
        try {
            setIsDeleting(true);
            await taskService.deleteTask(deletingTaskId);
            toast.success("Task deleted successfully");
            setShowDeleteModal(false);
            fetchTasks(currentPage);
            fetchStats();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to delete task");
        } finally {
            setIsDeleting(false);
            setDeletingTaskId(null);
            setDeletingTaskTitle("");
        }
    };

    const handleDeleteCancel = () => {
        setShowDeleteModal(false);
        setDeletingTaskId(null);
        setDeletingTaskTitle("");
    };

    const handleAddClick = () => {
        setEditingTaskId(null);
        setIsSliderOpen(true);
    };
    const handleEditClick = (id: number) => {
        setEditingTaskId(id);
        setIsSliderOpen(true);
    };
    const handleSliderClose = (saved: boolean = false) => {
        setIsSliderOpen(false);
        setEditingTaskId(null);
        if (saved) {
            fetchTasks(currentPage);
            fetchStats();
        }
    };
    const handleViewClick = (id: number) => navigate(`/tasks/${id}`);

    const handleCompleteTask = (taskId: number, taskTitle: string) => {
        setCompleteOutcome("");
        setCompleteConfirmModal({ show: true, id: taskId, title: taskTitle });
    };

    const handleCompleteConfirm = async () => {
        if (!completeConfirmModal.id) return;
        try {
            setCompletingTaskId(completeConfirmModal.id);
            const payload = completeOutcome.trim() ? { outcome: completeOutcome.trim() } : {};
            await taskService.completeTask(completeConfirmModal.id, payload);
            toast.success("Task completed successfully");
            setCompleteConfirmModal({ show: false });
            setCompleteOutcome("");
            fetchTasks(currentPage);
            fetchStats();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to complete task");
        } finally {
            setCompletingTaskId(null);
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "urgent":
                return "bg-red-100 text-red-700 border-red-200";
            case "high":
                return "bg-orange-100 text-orange-700 border-orange-200";
            case "medium":
                return "bg-yellow-100 text-yellow-700 border-yellow-200";
            case "low":
                return "bg-green-100 text-green-700 border-green-200";
            default:
                return "bg-gray-100 text-gray-700 border-gray-200";
        }
    };

    const formatDate = (date: string | null, completed: boolean) => {
        if (!date) return { formatted: "—", isOverdue: false };
        const d = new Date(date);
        const today = new Date();
        d.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        const isOverdue = d < today && !completed;
        // Format as DD/MM/YYYY
        const formatted = d.toLocaleDateString("en-GB");
        return { formatted, isOverdue };
    };

    return (
        <>
            <div className="space-y-0 p-0">
                {/* Header */}
                <div className="flex items-center justify-between gap-2 xs:gap-3 px-3 sm:px-4 md:px-6 py-3 mt-[-30px]">
                    <div className="flex items-center gap-2 xs:gap-3 min-w-0 flex-1">
                        <div className="p-2 bg-[#1e2d6b] rounded-lg flex-shrink-0">
                            <CheckSquare className="text-white" size={20} />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-lg xs:text-xl sm:text-2xl font-bold text-gray-900 truncate">
                                Tasks
                            </h1>
                            <p className="text-xs text-gray-500">Manage your tasks</p>
                        </div>
                    </div>
                    <button
                        onClick={handleAddClick}
                        className="inline-flex items-center justify-center gap-1.5 px-2.5 xs:px-3.5 py-2 bg-[#1e2d6b] text-white rounded-lg transition-colors text-xs sm:text-sm font-medium whitespace-nowrap flex-shrink-0 shadow-sm hover:shadow-md"
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#24357a")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#1e2d6b")}
                    >
                        <Plus size={16} />
                        <span className="hidden xs:inline">Add Task</span>
                        <span className="xs:hidden">Add</span>
                    </button>
                </div>

                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 px-3 sm:px-4 md:px-6 py-3">
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3 xs:p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-blue-600 font-medium">Total Tasks</span>
                                <CheckSquare size={16} className="text-blue-600" />
                            </div>
                            <p className="text-xl xs:text-2xl font-bold text-blue-700">{stats.totalTasks}</p>
                        </div>
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3 xs:p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-green-600 font-medium">Completed</span>
                                <CheckCircle2 size={16} className="text-green-600" />
                            </div>
                            <p className="text-xl xs:text-2xl font-bold text-green-700">{stats.completedTasks ?? 0}</p>
                        </div>
                        <div className="bg-gradient-to-br from-red-50 to-rose-50 border border-red-200 rounded-lg p-3 xs:p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-red-600 font-medium">Overdue</span>
                                <AlertCircle size={16} className="text-red-600" />
                            </div>
                            <p className="text-xl xs:text-2xl font-bold text-red-700">{stats.overdueTasks ?? 0}</p>
                        </div>
                        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-3 xs:p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-purple-600 font-medium">Pending</span>
                                <Clock size={16} className="text-purple-600" />
                            </div>
                            <p className="text-xl xs:text-2xl font-bold text-purple-700">
                                {(stats.totalTasks ?? 0) - (stats.completedTasks ?? 0)}
                            </p>
                        </div>
                    </div>
                )}

                {/* Search & Filters */}
                <div className="bg-white border-b border-gray-200 shadow-sm overflow-hidden px-3 sm:px-4 md:px-6">
                    <div className="p-3 border-b border-gray-200">
                        <div className="flex gap-2">
                            <div className="relative flex-1 min-w-0">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                <input
                                    type="text"
                                    placeholder="Search tasks..."
                                    value={searchTerm}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-50"
                                />
                            </div>
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`flex items-center gap-1.5 px-2.5 xs:px-3 py-2 border rounded-lg transition-colors text-xs sm:text-sm whitespace-nowrap flex-shrink-0 ${showFilters
                                    ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                                    : "border-gray-200 hover:bg-gray-50"
                                    }`}
                            >
                                <Filter size={14} />
                            </button>
                        </div>

                        {showFilters && (
                            <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    <select
                                        value={
                                            filters.completed === undefined
                                                ? ""
                                                : filters.completed
                                                    ? "true"
                                                    : "false"
                                        }
                                        onChange={(e) =>
                                            handleFilterChange(
                                                "completed",
                                                e.target.value === ""
                                                    ? undefined
                                                    : e.target.value === "true"
                                            )
                                        }
                                        className="px-3 py-2 border border-gray-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
                                    >
                                        <option value="">All Status</option>
                                        <option value="false">Pending</option>
                                        <option value="true">Completed</option>
                                    </select>
                                    <select
                                        value={filters.priority || ""}
                                        onChange={(e) =>
                                            handleFilterChange("priority", e.target.value || undefined)
                                        }
                                        className="px-3 py-2 border border-gray-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
                                    >
                                        <option value="">All Priority</option>
                                        <option value="urgent">Urgent</option>
                                        <option value="high">High</option>
                                        <option value="medium">Medium</option>
                                        <option value="low">Low</option>
                                    </select>
                                    <select
                                        value={
                                            filters.overdue === undefined
                                                ? ""
                                                : filters.overdue
                                                    ? "true"
                                                    : "false"
                                        }
                                        onChange={(e) =>
                                            handleFilterChange(
                                                "overdue",
                                                e.target.value === ""
                                                    ? undefined
                                                    : e.target.value === "true"
                                            )
                                        }
                                        className="px-3 py-2 border border-gray-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-indigo-500 col-span-2 sm:col-span-1"
                                    >
                                        <option value="">All Overdue</option>
                                        <option value="true">Yes</option>
                                        <option value="false">No</option>
                                    </select>
                                </div>
                                {(filters.completed !== undefined ||
                                    filters.priority ||
                                    filters.overdue !== undefined) && (
                                        <button
                                            onClick={clearFilters}
                                            className="text-xs text-gray-600 hover:text-gray-900 underline"
                                        >
                                            Clear filters
                                        </button>
                                    )}
                            </div>
                        )}
                    </div>

                    {/* Tasks List */}
                    <div className="overflow-hidden max-h-[calc(100vh-320px)]">
                        {loading ? (
                            <div className="p-8 text-center text-gray-500">
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                                    Loading...
                                </div>
                            </div>
                        ) : tasks.length === 0 ? (
                            <div className="p-8 text-center">
                                <CheckSquare size={40} className="mx-auto text-gray-300 mb-2" />
                                <p className="text-gray-500 text-sm">No tasks found</p>
                            </div>
                        ) : (
                            <>
                                {/* Desktop Table - NO HORIZONTAL SCROLL */}
                                <div className="hidden sm:block overflow-y-auto max-h-[calc(100vh-320px)]">
                                    <table className="w-full text-xs sm:text-sm table-fixed">
                                        <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                                            <tr>
                                                <th className="w-10 px-2 py-2 text-center font-semibold text-gray-600 uppercase">
                                                    ✓
                                                </th>
                                                <th className="w-[25%] px-2 py-2 text-left font-semibold text-gray-600 uppercase">
                                                    Task
                                                </th>
                                                <th className="w-[12%] px-2 py-2 text-left font-semibold text-gray-600 uppercase hidden md:table-cell">
                                                    Type
                                                </th>
                                                <th className="w-[10%] px-2 py-2 text-left font-semibold text-gray-600 uppercase">
                                                    Priority
                                                </th>
                                                <th className="w-[12%] px-2 py-2 text-left font-semibold text-gray-600 uppercase hidden lg:table-cell">
                                                    Assigned
                                                </th>
                                                <th className="w-[10%] px-2 py-2 text-left font-semibold text-gray-600 uppercase">
                                                    Due
                                                </th>
                                                <th className="w-[10%] px-2 py-2 text-left font-semibold text-gray-600 uppercase">
                                                    Status
                                                </th>
                                                <th className="w-[11%] px-2 py-2 text-center font-semibold text-gray-600 uppercase">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {tasks.map((task) => {
                                                const dueDate = formatDate(task.dueDate, task.completed);
                                                return (
                                                    <tr
                                                        key={task.id}
                                                        className={`transition-colors ${dueDate.isOverdue && !task.completed
                                                            ? "bg-red-200"
                                                            : "hover:bg-gray-50"
                                                            }`}
                                                    >                                                  <td className="px-2 py-2 text-center">
                                                            <button
                                                                onClick={() =>
                                                                    handleCompleteTask(task.id, task.title)
                                                                }
                                                                disabled={task.completed}
                                                                className={`inline-flex items-center justify-center w-5 h-5 rounded border-2 transition-colors ${task.completed
                                                                    ? "bg-green-600 border-green-600 text-white cursor-default"
                                                                    : "border-gray-400 hover:border-green-400"
                                                                    } disabled:cursor-not-allowed`}
                                                                title={
                                                                    task.completed ? "Completed" : "Mark as complete"
                                                                }
                                                            >
                                                                {task.completed && <CheckCircle2 size={14} />}
                                                            </button>
                                                        </td>
                                                        <td className="px-2 py-2">
                                                            <div className="min-w-0">
                                                                <p className="font-medium text-gray-900 truncate text-xs sm:text-sm">
                                                                    {task.title}
                                                                </p>
                                                                {task.description && (
                                                                    <p className="text-xs text-gray-500 truncate">
                                                                        {task.description}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-2 py-2 hidden md:table-cell">
                                                            <span className="text-xs text-gray-700 truncate block">
                                                                {task.taskType}
                                                            </span>
                                                        </td>
                                                        <td className="px-2 py-2">
                                                            <span
                                                                className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium whitespace-nowrap border ${getPriorityColor(
                                                                    task.priority
                                                                )}`}
                                                            >
                                                                <Flag size={9} className="hidden sm:inline" />
                                                                <span className="hidden sm:inline">
                                                                    {task.priority}
                                                                </span>
                                                                <span className="sm:hidden">
                                                                    {task.priority.charAt(0).toUpperCase()}
                                                                </span>
                                                            </span>
                                                        </td>
                                                        <td className="px-2 py-2 hidden lg:table-cell">
                                                            <span className="text-xs text-gray-700 truncate block">
                                                                {task.assignedToName
                                                                    ? task.assignedToName.split(" ")[0]
                                                                    : "—"}
                                                            </span>
                                                        </td>
                                                        <td className="px-2 py-2">
                                                            <div className="flex flex-col text-xs">
                                                                <span
                                                                    className={
                                                                        dueDate.isOverdue && !task.completed
                                                                            ? "text-red-600 font-medium"
                                                                            : "text-gray-700"
                                                                    }
                                                                >
                                                                    {dueDate.formatted}
                                                                </span>

                                                                {dueDate.isOverdue && !task.completed && (
                                                                    <span className="mt-1 inline-flex items-center gap-1 w-fit px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-medium">
                                                                        <AlertTriangle size={10} />
                                                                        Overdue
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-2 py-2">
                                                            {task.completed ? (
                                                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-600 text-white">
                                                                    <CheckCircle2 size={10} />
                                                                    <span className="hidden sm:inline">Done</span>
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 border border-yellow-200">
                                                                    <Clock size={10} />
                                                                    <span className="hidden sm:inline">Pending</span>
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-2 py-2">
                                                            <div className="flex items-center justify-center gap-0.5">
                                                                <button
                                                                    onClick={() => handleViewClick(task.id)}
                                                                    className="p-1 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                                                                    title="View"
                                                                >
                                                                    <Eye size={13} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleEditClick(task.id)}
                                                                    className="p-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                                    title="Edit"
                                                                >
                                                                    <Edit size={13} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteClick(task)}
                                                                    className="p-1 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                                    title="Delete"
                                                                >
                                                                    <Trash2 size={13} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile Cards */}
                                <div className="sm:hidden space-y-3 p-3 overflow-auto max-h-[calc(100vh-320px)]">
                                    {tasks.map((task) => {
                                        const dueDate = formatDate(task.dueDate, task.completed);
                                        return (
                                            <div
                                                key={task.id}
                                                className={`border rounded-lg p-3 space-y-2 transition-colors ${dueDate.isOverdue && !task.completed
                                                    ? "bg-red-200 border-red-200"
                                                    : "bg-white border-gray-200 hover:bg-gray-50"
                                                    }`}
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex items-start gap-2 flex-1 min-w-0">
                                                        <button
                                                            onClick={() =>
                                                                handleCompleteTask(task.id, task.title)
                                                            }
                                                            disabled={task.completed}
                                                            className={`flex-shrink-0 w-5 h-5 rounded border-2 transition-colors mt-0.5 inline-flex items-center justify-center ${task.completed
                                                                ? "bg-green-500 border-green-500 text-white cursor-default"
                                                                : "border-gray-400 hover:border-green-400"
                                                                } disabled:cursor-not-allowed`}
                                                        >
                                                            {task.completed && <CheckCircle2 size={12} />}
                                                        </button>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="font-medium text-gray-900 text-sm truncate">
                                                                {task.title}
                                                            </p>
                                                            {task.description && (
                                                                <p className="text-xs text-gray-500 truncate mt-0.5">
                                                                    {task.description}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {task.completed && (
                                                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-600 text-white flex-shrink-0">
                                                            Done
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className={`text-xs font-medium px-2 py-1 rounded whitespace-nowrap border ${getPriorityColor(
                                                            task.priority
                                                        )}`}
                                                    >
                                                        {task.priority}
                                                    </span>
                                                    {!task.completed && (
                                                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">
                                                            Pending
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 text-xs">
                                                    <div className="flex items-center gap-1">
                                                        <CheckSquare
                                                            size={12}
                                                            className="text-gray-500 flex-shrink-0"
                                                        />
                                                        <span className="text-gray-700 truncate">
                                                            {task.taskType}
                                                        </span>
                                                    </div>
                                                    {task.assignedToName && (
                                                        <div className="flex items-center gap-1">
                                                            <User
                                                                size={12}
                                                                className="text-gray-500 flex-shrink-0"
                                                            />
                                                            <span className="text-gray-700 truncate">
                                                                {task.assignedToName}
                                                                {task.assignedTo === userId && " (You)"}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1 text-xs">
                                                    <Calendar
                                                        size={12}
                                                        className="text-gray-500 flex-shrink-0"
                                                    />
                                                    <span
                                                        className={
                                                            dueDate.isOverdue && !task.completed
                                                                ? "text-red-600 font-medium"
                                                                : "text-gray-700"
                                                        }
                                                    >
                                                        {dueDate.formatted}
                                                    </span>
                                                    {dueDate.isOverdue && !task.completed && (
                                                        <span className="ml-auto inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                                                            <AlertTriangle size={12} />     
                                                            Overdue
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1.5 pt-2 border-t border-gray-200">
                                                    <button
                                                        onClick={() => handleViewClick(task.id)}
                                                        className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-green-50 hover:bg-green-100 text-green-600 rounded text-xs font-medium transition-colors"
                                                    >
                                                        <Eye size={14} />
                                                        <span className="hidden xs:inline">View</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleEditClick(task.id)}
                                                        className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded text-xs font-medium transition-colors"
                                                    >
                                                        <Edit size={14} />
                                                        <span className="hidden xs:inline">Edit</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClick(task)}
                                                        className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-red-50 hover:bg-red-100 text-red-600 rounded text-xs font-medium transition-colors"
                                                    >
                                                        <Trash2 size={14} />
                                                        <span className="hidden xs:inline">Delete</span>
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Pagination */}
                    {pagination && pagination.totalPages > 1 && (
                        <div className="px-3 xs:px-4 py-3 border-t border-gray-200 flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2 xs:gap-3">
                            <p className="text-xs text-gray-600">
                                Page {pagination.currentPage} of {pagination.totalPages} ·{" "}
                                {pagination.totalItems} total
                            </p>
                            <div className="flex items-center justify-center gap-1">
                                <button
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    disabled={!pagination.hasPreviousPage}
                                    className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                                >
                                    Previous
                                </button>
                                <span className="px-3 text-xs text-gray-700">
                                    {pagination.currentPage}
                                </span>
                                <button
                                    onClick={() => setCurrentPage((p) => p + 1)}
                                    disabled={!pagination.hasNextPage}
                                    className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                                >
                                    Next
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
                        <div className="p-5 sm:p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                                    <AlertCircle size={20} className="text-red-600 sm:hidden" />
                                    <AlertCircle size={24} className="text-red-600 hidden sm:block" />
                                </div>
                                <div>
                                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                                        Delete Task
                                    </h3>
                                    <p className="text-xs sm:text-sm text-gray-500">
                                        This action cannot be undone
                                    </p>
                                </div>
                            </div>
                            <p className="text-xs sm:text-sm text-gray-700 mb-5 sm:mb-6">
                                Are you sure you want to delete{" "}
                                <span className="font-semibold">"{deletingTaskTitle}"</span>?
                            </p>
                            <div className="flex items-center gap-2 sm:gap-3">
                                <button
                                    onClick={handleDeleteCancel}
                                    disabled={isDeleting}
                                    className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm text-gray-700 hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteConfirm}
                                    disabled={isDeleting}
                                    className="flex-1 px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs sm:text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-1.5 sm:gap-2"
                                >
                                    {isDeleting ? (
                                        <>
                                            <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{" "}
                                            Deleting...
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 size={14} /> Delete
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Complete Task Confirmation Modal */}
            {completeConfirmModal.show && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                        <div className="p-5 sm:p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                    <CheckCircle2 size={20} className="text-green-600 sm:hidden" />
                                    <CheckCircle2 size={24} className="text-green-600 hidden sm:block" />
                                </div>
                                <div>
                                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                                        Complete Task
                                    </h3>
                                    <p className="text-xs sm:text-sm text-gray-500">Mark as completed</p>
                                </div>
                            </div>
                            <p className="text-xs sm:text-sm text-gray-700 mb-3 sm:mb-4">
                                Are you sure you've completed{" "}
                                <span className="font-semibold">"{completeConfirmModal.title}"</span>?
                            </p>
                            {/* Outcome textarea */}
                            <div className="mb-4 sm:mb-5">
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                                    Outcome <span className="text-gray-400 font-normal">(Optional)</span>
                                </label>
                                <textarea
                                    value={completeOutcome}
                                    onChange={(e) => setCompleteOutcome(e.target.value)}
                                    placeholder="Describe the outcome or result..."
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-50 resize-none"
                                />
                            </div>
                            <div className="flex items-center gap-2 sm:gap-3">
                                <button
                                    onClick={() => {
                                        setCompleteConfirmModal({ show: false });
                                        setCompleteOutcome("");
                                    }}
                                    disabled={completingTaskId !== null}
                                    className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm text-gray-700 hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCompleteConfirm}
                                    disabled={completingTaskId !== null}
                                    className="flex-1 px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs sm:text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-1.5 sm:gap-2"
                                >
                                    {completingTaskId !== null ? (
                                        <>
                                            <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{" "}
                                            Completing...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 size={14} /> Complete
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <TaskFormSlider isOpen={isSliderOpen} onClose={handleSliderClose} taskId={editingTaskId} />
        </>
    );
};

export default TasksPage;