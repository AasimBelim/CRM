import { useState, useEffect, useRef } from "react";
import {
    X,
    Save,
    CheckSquare,
    User,
    Calendar,
    Flag,
    Type,
    AlignLeft,
    Bell,
} from "lucide-react";
import { toast } from "react-toastify";
import apiCall from "@/utils/axios";
import { useAuth } from "@/hooks/useAuth";
import SearchableSelect from "./Searchableselect";

interface TaskFormSliderProps {
    isOpen: boolean;
    onClose: (saved?: boolean) => void;
    taskId?: number | null;
}

interface UserOption {
    userId: number;
    userName: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    roleName?: string;
}

interface EntityOption {
    id: number;
    name: string;
    type?: string;
}

const inputClass =
    "w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50";
const labelClass =
    "flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-700 mb-2";

const TaskFormSlider = ({ isOpen, onClose, taskId }: TaskFormSliderProps) => {
    const isEditMode = !!taskId;
    const { user } = useAuth();
    const userId = (user as any)?.userId || (user as any)?.id;

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [usersList, setUsersList] = useState<UserOption[]>([]);
    const [companies, setCompanies] = useState<EntityOption[]>([]);
    const [leads, setLeads] = useState<EntityOption[]>([]);
    const [opportunities, setOpportunities] = useState<EntityOption[]>([]);
    const [deals, setDeals] = useState<EntityOption[]>([]);

    const [loadingUsers, setLoadingUsers] = useState(false);
    const [loadingEntities, setLoadingEntities] = useState(false);

    const usersFetchedRef = useRef(false);

    const [formData, setFormData] = useState({
        entity_type: "company" as "company" | "lead" | "opportunity" | "deal",
        entity_id: null as number | null,
        title: "",
        description: "",
        task_type: "",
        priority: "medium" as "low" | "medium" | "high" | "urgent",
        assigned_to: userId || null,
        due_date: "",
        reminder_date: "",
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const role = (user as any)?.role?.toLowerCase() || "";

    const isAdmin = role.includes("admin");
    const isDA = role.includes("data analyst");

    console.log("ROLE:", role);
    console.log("isDA:", isDA);

    // Fetch users
    useEffect(() => {
        if (!isOpen || usersFetchedRef.current) return;

        usersFetchedRef.current = true;

        const fetchUsers = async () => {
            try {
                setLoadingUsers(true);
                const response = await apiCall.get("/users", {
                    params: { limit: 1000 },
                });

                const raw = response.data;
                let list: UserOption[] = [];

                if (Array.isArray(raw?.userData)) {
                    list = raw.userData;
                } else if (Array.isArray(raw?.data)) {
                    list = raw.data;
                }

                setUsersList(list);
            } catch (err) {
                console.error("Error fetching users:", err);
            } finally {
                setLoadingUsers(false);
            }
        };

        fetchUsers();
    }, [isOpen]);
    const baseParams: any = {};

    if (!isAdmin && userId) {
        baseParams.createdBy = userId;
        baseParams.assignedTo = userId;
    }

    baseParams.limit = 1000; // ✅ LAST
    // Fetch entities based on entity type
    useEffect(() => {
        if (!isOpen) return;

        const fetchEntities = async () => {
            try {
                setLoadingEntities(true);

                // Fetch all entity types
                const [companiesRes, leadsRes, opportunitiesRes, dealsRes] =
                    await Promise.all([
                        apiCall.get("/companies", { params: baseParams }),
                        apiCall.get("/leads", { params: baseParams }),
                        apiCall.get("/opportunities", { params: baseParams }),
                        apiCall.get("/deals", { params: baseParams }),
                    ]);

                const extractData = (response: any) => {
                    const payload = response.data;
                    if (Array.isArray(payload?.data)) {
                        return payload.data;
                    } else if (Array.isArray(payload?.data?.data)) {
                        return payload.data.data;
                    }
                    return [];
                };

                setCompanies(extractData(companiesRes));
                setLeads(extractData(leadsRes));
                setOpportunities(extractData(opportunitiesRes));
                setDeals(extractData(dealsRes));
            } catch (err) {
                console.error("Error fetching entities:", err);
            } finally {
                setLoadingEntities(false);
            }
        };

        fetchEntities();
    }, [isOpen]);

    // Load task data on edit
    useEffect(() => {
        if (!isOpen) return;

        if (isEditMode && taskId) {
            const fetchTask = async () => {
                try {
                    setLoading(true);
                    const response = await apiCall.get(`/tasks/${taskId}`);
                    if (response.data.status && response.data.data) {
                        const task = response.data.data;
                        setFormData({
                            entity_type: task.entityType || "company",
                            entity_id: task.entityId || null,
                            title: task.title || "",
                            description: task.description || "",
                            task_type: task.taskType || "",
                            priority: task.priority || "medium",
                            assigned_to: task.assignedTo || userId,
                            due_date: task.dueDate
                                ? new Date(task.dueDate).toISOString().split("T")[0]
                                : "",
                            reminder_date: task.reminderDate
                                ? new Date(task.reminderDate).toISOString().split("T")[0]
                                : "",
                        });
                        setErrors({}); // ✅ FIX
                    }
                } catch (error: any) {
                    toast.error(error.response?.data?.message || "Failed to fetch task");
                    onClose(false);
                } finally {
                    setLoading(false);
                }
            };
            fetchTask();
        } else {
            setFormData({
                entity_type: "company",
                entity_id: null,
                title: "",
                description: "",
                task_type: "",
                priority: "medium",
                assigned_to: userId || null,
                due_date: "",
                reminder_date: "",
            });
            setErrors({});
        }
    }, [isOpen, taskId, isEditMode, userId, onClose]);

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();

        const newErrors: Record<string, string> = {};
        if (!formData.entity_type) newErrors.entity_type = "Entity type is required";
        if (!formData.entity_id) newErrors.entity_id = "Entity is required";
        if (!formData.title.trim()) newErrors.title = "Title is required";
        if (!formData.task_type.trim()) newErrors.task_type = "Task type is required";
        if (!formData.due_date) newErrors.due_date = "Due date is required";
        if (!formData.assigned_to) newErrors.assigned_to = "Assigned to is required";


        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }
        if (isEditMode && !formData.description.trim()) {
            toast.error("Description cannot be empty");
            return;
        }

        try {
            setSaving(true);

            const payload: any = {
                title: formData.title.trim(),
                task_type: formData.task_type.trim(),
                priority: formData.priority,
                due_date: formData.due_date,
                assigned_to: formData.assigned_to,
            };

            if (formData.description.trim()) {
                payload.description = formData.description.trim();
            }

            if (formData.reminder_date) {
                payload.reminder_date = formData.reminder_date;
            }

            if (!isEditMode) {
                payload.entity_type = formData.entity_type;
                payload.entity_id = formData.entity_id;
            }

            if (isEditMode) {
                await apiCall.put(`/tasks/${taskId}`, payload);
                toast.success("Task updated successfully");
            } else {
                await apiCall.post("/tasks", payload);
                toast.success("Task created successfully");
            }

            onClose(true);
        } catch (error: any) {
            toast.error(
                error.response?.data?.message ||
                `Failed to ${isEditMode ? "update" : "create"} task`
            );
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;
    const userOptions = usersList.map((u) => {
        const isCurrentUser = u.userId === userId;

        return {
            value: u.userId,
            label: isCurrentUser
                ? "Yourself"
                : u.firstName && u.lastName
                    ? `${u.firstName} ${u.lastName}`
                    : u.userName || "User",

            sublabel: isCurrentUser
                ? "You"
                : u.roleName || u.email || "",
        };
    });

    const getEntityOptions = () => {
        let entities: any[] = [];

        switch (formData.entity_type) {
            case "company":
                entities = companies;
                break;
            case "lead":
                entities = leads;
                break;
            case "opportunity":
                entities = isDA ? [] : opportunities;
                break;
            case "deal":
                entities = isDA ? [] : deals;
                break;
        }
        console.log("opportunities", opportunities);
        console.log("deals", deals);

        return entities.map((e: any) => ({
            value: e.id,
            label:
                formData.entity_type === "company"
                    ? e.name

                    : formData.entity_type === "lead"
                        ? `${e.companyName || e.leadCompanyName || "Unknown"}${e.leadStatusName ? ` (${e.leadStatusName})` : ""
                        }`

                        : formData.entity_type === "opportunity"
                            ? `${e.leadCompanyName || "Unknown"}${e.stageName ? ` (${e.stageName})` : ""
                            }`

                            : formData.entity_type === "deal"
                                ? `${e.companyName || "Unknown"}${e.contactName ? ` (${e.contactName})` : ""
                                } - $${e.dealValue || 0}`

                                : "Unnamed",
            sublabel:
                formData.entity_type === "deal"
                    ? e.status || ""
                    : e.email || e.type || "",
        }));
    };

    const entityOptions = getEntityOptions();

    return (
        <>
            <div
                className="fixed inset-0 bg-black/50 z-40 transition-opacity"
                onClick={() => onClose(false)}
            />

            <div className="fixed right-0 top-0 h-full w-full sm:w-[500px] md:w-[600px] bg-white shadow-2xl z-50 overflow-hidden flex flex-col">
                <div className="px-4 sm:px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50 flex-shrink-0">
                    <div className="min-w-0">
                        <h2 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                            {isEditMode ? "Edit Task" : "New Task"}
                        </h2>
                        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                            {isEditMode ? "Update task information" : "Create a new task"}
                        </p>
                    </div>
                    <button
                        onClick={() => onClose(false)}
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors flex-shrink-0"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : (
                        <form
                            onSubmit={handleSubmit}
                            className="p-4 sm:p-6 space-y-4 sm:space-y-6"
                        >
                            {/* Title */}
                            <div>
                                <label className={labelClass}>
                                    <CheckSquare size={16} />
                                    Task Title <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => {
                                        setFormData((prev) => ({ ...prev, title: e.target.value }));
                                        setErrors((prev) => ({ ...prev, title: "" }));
                                    }}
                                    placeholder="Enter task title"
                                    className={`${inputClass} ${errors.title ? "border-red-400" : ""
                                        }`}
                                />
                                {errors.title && (
                                    <p className="text-[10px] text-red-500 mt-1">{errors.title}</p>
                                )}
                            </div>

                            {/* Description */}
                            <div>
                                <label className={labelClass}>
                                    <AlignLeft size={16} />
                                    Description
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            description: e.target.value,
                                        }))
                                    }
                                    placeholder="Enter task description"
                                    rows={3}
                                    className={inputClass}
                                />
                            </div>

                            {/* Entity Type & Entity */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <div>
                                    <label className={labelClass}>
                                        <Type size={16} />
                                        Entity Type <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={formData.entity_type}
                                        onChange={(e) => {
                                            setFormData((prev) => ({
                                                ...prev,
                                                entity_type: e.target.value as any,
                                                entity_id: null,
                                            }));
                                            setErrors((prev) => ({ ...prev, entity_type: "" }));
                                        }}
                                        disabled={isEditMode}
                                        className={`${inputClass} ${errors.entity_type ? "border-red-400" : ""
                                            } ${isEditMode ? "bg-gray-50 cursor-not-allowed" : ""}`}
                                    >
                                        <option value="company">Company</option>
                                        <option value="lead">Lead</option>
                                        {!isDA && (
                                            <>
                                                <option value="opportunity">Opportunity</option>
                                                <option value="deal">Deal</option>
                                            </>
                                        )}
                                    </select>
                                    {errors.entity_type && (
                                        <p className="text-[10px] text-red-500 mt-1">
                                            {errors.entity_type}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className={labelClass}>
                                        Related {formData.entity_type}{" "}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <SearchableSelect
                                        options={entityOptions}
                                        value={formData.entity_id}
                                        onChange={(value) => {
                                            setFormData((prev) => ({ ...prev, entity_id: value }));
                                            setErrors((prev) => ({ ...prev, entity_id: "" }));
                                        }}
                                        placeholder={
                                            loadingEntities
                                                ? "Loading..."
                                                : `Select ${formData.entity_type}...`
                                        }
                                        loading={loadingEntities}
                                        disabled={isEditMode}
                                        error={errors.entity_id}
                                    />
                                </div>
                            </div>

                            {/* Task Type & Priority */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <div>
                                    <label className={labelClass}>
                                        <Type size={16} />
                                        Task Type <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.task_type}
                                        onChange={(e) => {
                                            setFormData((prev) => ({
                                                ...prev,
                                                task_type: e.target.value,
                                            }));
                                            setErrors((prev) => ({ ...prev, task_type: "" }));
                                        }}
                                        placeholder="e.g., Follow-up, Call, Meeting"
                                        className={`${inputClass} ${errors.task_type ? "border-red-400" : ""
                                            }`}
                                    />
                                    {errors.task_type && (
                                        <p className="text-[10px] text-red-500 mt-1">
                                            {errors.task_type}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className={labelClass}>
                                        <Flag size={16} />
                                        Priority <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={formData.priority}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                priority: e.target.value as any,
                                            }))
                                        }
                                        className={inputClass}
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="urgent">Urgent</option>
                                    </select>
                                </div>
                            </div>

                            {/* Assigned To */}
                            <div>
                                <label className={labelClass}>
                                    <User size={16} />
                                    Assigned To <span className="text-red-500">*</span>
                                </label>
                                <SearchableSelect
                                    options={userOptions}
                                    value={formData.assigned_to}
                                    onChange={(value) => {
                                        setFormData((prev) => ({ ...prev, assigned_to: value }));
                                        setErrors((prev) => ({ ...prev, assigned_to: "" }));
                                    }}
                                    placeholder={
                                        loadingUsers
                                            ? "Loading users..."
                                            : "Assign to user..."
                                    }
                                    loading={loadingUsers}
                                    error={errors.assigned_to}
                                />
                            </div>

                            {/* Due Date & Reminder Date */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <div>
                                    <label className={labelClass}>
                                        <Calendar size={16} />
                                        Due Date <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.due_date}
                                        onChange={(e) => {
                                            setFormData((prev) => ({
                                                ...prev,
                                                due_date: e.target.value,
                                            }));
                                            setErrors((prev) => ({ ...prev, due_date: "" }));
                                        }}
                                        className={`${inputClass} ${errors.due_date ? "border-red-400" : ""
                                            }`}
                                    />
                                    {errors.due_date && (
                                        <p className="text-[10px] text-red-500 mt-1">
                                            {errors.due_date}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className={labelClass}>
                                        <Bell size={16} />
                                        Reminder Date
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.reminder_date}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                reminder_date: e.target.value,
                                            }))
                                        }
                                        className={inputClass}
                                    />
                                </div>
                            </div>
                        </form>
                    )}
                </div>

                <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-2 sm:gap-3 flex-shrink-0">
                    <button
                        type="button"
                        onClick={() => onClose(false)}
                        disabled={saving}
                        className="px-3 sm:px-4 py-2 border border-gray-200 rounded-lg text-gray-700 font-medium text-xs sm:text-sm hover:bg-gray-100 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => handleSubmit()}
                        disabled={saving}
                        className="px-3 sm:px-4 py-2 bg-[#1e2d6b] text-white rounded-lg font-medium text-xs sm:text-sm  transition-colors flex items-center gap-1.5 sm:gap-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#24357a"}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#1e2d6b"}
                    >
                        <Save size={16} />
                        {saving ? "Saving..." : isEditMode ? "Update" : "Create"}
                    </button>
                </div>
            </div>
        </>
    );
};

export default TaskFormSlider;