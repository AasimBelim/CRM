// ✅ FINAL VERSION - All 4 searchable dropdowns working:
// 1. Company (searchable)
// 2. Contact (searchable, dependent on company)
// 3. Assigned To (searchable, role-based)
// 4. Lead Status (searchable) ← NEW!

import { useState, useEffect } from "react";
import {
    X,
    Save,
    Building2,
    User,
    Tag,
    Shield,
    UserPlus,
} from "lucide-react";
import { toast } from "react-toastify";
import apiCall from "@/utils/axios";
import { useAuth } from "@/hooks/useAuth";
import SearchableSelect from "./Searchableselect";
import { useRef } from "react";

const ROLE_ADMIN = "admin";
const ROLE_BDE = "business development executive";

interface LeadFormSliderProps {
    isOpen: boolean;
    onClose: (saved?: boolean) => void;
    leadId?: number | null;
}

interface Company {
    id: number;
    name: string;
    industry?: string;
}

interface Contact {
    id: number;
    name: string;
    email?: string;
}

interface UserOption {
    userId: number;
    userName: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    roleName?: string;
}

interface LeadStatus {
    id: number;
    name: string;
}

const inputClass =
    "w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50";
const labelClass =
    "flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-700 mb-2";

const LeadFormSlider = ({ isOpen, onClose, leadId }: LeadFormSliderProps) => {
    const isEditMode = !!leadId;
    const { user } = useAuth();

    const userRole = (user?.role ?? "").toLowerCase().trim();
    const isAdmin = userRole === ROLE_ADMIN;
    const isBDE = userRole === ROLE_BDE;

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [companies, setCompanies] = useState<Company[]>([]);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [usersList, setUsersList] = useState<UserOption[]>([]);
    const [leadStatuses, setLeadStatuses] = useState<LeadStatus[]>([]);

    const [loadingCompanies, setLoadingCompanies] = useState(false);
    const [loadingContacts, setLoadingContacts] = useState(false);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [loadingStatuses, setLoadingStatuses] = useState(false);

    const usersFetchedRef = useRef(false);

    const [formData, setFormData] = useState({
        company_id: null as number | null,
        contact_id: null as number | null,
        lead_status_id: null as number | null,
        assigned_to: null as number | null,
        priority: "medium" as "low" | "medium" | "high",
        tags: "",
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    // Fetch companies
    useEffect(() => {
        if (!isOpen || !user) return;

        const fetchCompanies = async () => {
            try {
                setLoadingCompanies(true);
                const params = new URLSearchParams();
                if (!isAdmin) {
                    params.set("assignedTo", String(user.userId));
                    params.set("createdBy", String(user.userId));
                }
                params.set("limit", "1000");

                const response = await apiCall.get(`/companies?${params.toString()}`);
                const payload = response.data;

                let list: Company[] = [];
                if (Array.isArray(payload?.data)) {
                    list = payload.data;
                } else if (Array.isArray(payload?.data?.data)) {
                    list = payload.data.data;
                }
                setCompanies(list);
            } catch {
                console.error("Error fetching companies");
            } finally {
                setLoadingCompanies(false);
            }
        };
        fetchCompanies();
    }, [isOpen, user, isAdmin]);

    // Fetch contacts
    useEffect(() => {
        if (!formData.company_id) {
            setContacts([]);
            return;
        }
        const fetchContacts = async () => {
            try {
                setLoadingContacts(true);
                const response = await apiCall.get(
                    `/contacts?companyId=${formData.company_id}&limit=1000`
                );
                const raw = response.data;
                const list = Array.isArray(raw?.data)
                    ? raw.data
                    : Array.isArray(raw?.data?.data)
                        ? raw.data.data
                        : [];
                setContacts(list);
            } catch {
                setContacts([]);
            } finally {
                setLoadingContacts(false);
            }
        };
        fetchContacts();
    }, [formData.company_id]);

    // Fetch users
    useEffect(() => {
        if (!isOpen || !isAdmin || usersFetchedRef.current) return;

        usersFetchedRef.current = true;

        const fetchUsers = async () => {
            try {
                setLoadingUsers(true);

                const response = await apiCall.get("/users", {
                    params: { page: 1, limit: 1000 },
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
    }, [isOpen, isAdmin]);

    // Fetch lead statuses
    useEffect(() => {
        if (!isOpen) return;
        const fetchStatuses = async () => {
            try {
                setLoadingStatuses(true);
                const response = await apiCall.get("/lead-config/statuses");
                const raw = response.data;
                const list = Array.isArray(raw?.data)
                    ? raw.data
                    : Array.isArray(raw?.data?.data)
                        ? raw.data.data
                        : [];
                setLeadStatuses(list);
            } catch {
                console.error("Error fetching statuses");
            } finally {
                setLoadingStatuses(false);
            }
        };
        fetchStatuses();
    }, [isOpen]);

    // Load lead data on edit
    useEffect(() => {
        if (!isOpen) return;

        if (isEditMode && leadId) {
            const fetchLead = async () => {
                try {
                    setLoading(true);
                    const response = await apiCall.get(`/leads/${leadId}`);
                    if (response.data.status && response.data.data) {
                        const lead = response.data.data;
                        setFormData({
                            company_id: lead.companyId ?? null,
                            contact_id: lead.contactId ?? null,
                            lead_status_id: lead.leadStatusId ?? null,
                            assigned_to: lead.assignedTo ?? null,
                            priority: lead.priority ?? "medium",
                            tags: lead.tags ?? "",
                        });
                    }
                } catch (error: any) {
                    toast.error(error.response?.data?.message || "Failed to fetch lead");
                    onClose(false);
                } finally {
                    setLoading(false);
                }
            };
            fetchLead();
        } else {
            setFormData({
                company_id: null,
                contact_id: null,
                lead_status_id: null,
                assigned_to: isBDE ? (user?.userId ?? null) : null,
                priority: "medium",
                tags: "",
            });
            setErrors({});
        }
    }, [isOpen, leadId, isBDE, user, isEditMode, onClose]);

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();

        const newErrors: Record<string, string> = {};
        if (!formData.company_id) newErrors.company_id = "Company is required";
        if (!formData.lead_status_id) newErrors.lead_status_id = "Lead status is required";

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        try {
            setSaving(true);

            const payload: Record<string, unknown> = {
                lead_status_id: formData.lead_status_id,
                priority: formData.priority,
            };

            if (!isEditMode) {
                payload.company_id = formData.company_id;
            }
            if (formData.contact_id) payload.contact_id = formData.contact_id;
            if (formData.tags.trim()) payload.tags = formData.tags.trim();

            if (isAdmin) {
                payload.assigned_to = formData.assigned_to;
            } else if (isBDE) {
                payload.assigned_to = user?.userId ?? null;
            }

            if (isEditMode) {
                await apiCall.put(`/leads/${leadId}`, payload);
                toast.success("Lead updated successfully");
            } else {
                await apiCall.post("/leads", payload);
                toast.success("Lead created successfully");
            }

            onClose(true);
        } catch (error: any) {
            toast.error(
                error.response?.data?.message ||
                `Failed to ${isEditMode ? "update" : "create"} lead`
            );
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    const companyOptions = companies.map((c) => ({
        value: c.id,
        label: c.name,
        sublabel: c.industry,
    }));

    const contactOptions = contacts.map((c) => ({
        value: c.id,
        label: c.name,
        sublabel: c.email,
    }));

    const userOptions = usersList.map((u) => ({
        value: u.userId,
        label:
            u.firstName && u.lastName
                ? `${u.firstName} ${u.lastName}`
                : u.userName || "User",
        sublabel: u.roleName || u.email || "",
    }));

    // ✅ NEW: Lead Status options for SearchableSelect
    const leadStatusOptions = leadStatuses.map((s) => ({
        value: s.id,
        label: s.name,
    }));

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
                            {isEditMode ? "Edit Lead" : "New Lead"}
                        </h2>
                        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                            {isEditMode ? "Update lead information" : "Create a new lead"}
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
                        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                            {/* Company - Searchable */}
                            <div>
                                <label className={labelClass}>
                                    <Building2 size={16} />
                                    Company <span className="text-red-500">*</span>
                                </label>
                                <SearchableSelect
                                    options={companyOptions}
                                    value={formData.company_id}
                                    onChange={(value) => {
                                        setFormData((prev) => ({
                                            ...prev,
                                            company_id: value,
                                            contact_id: null,
                                        }));
                                        setErrors((prev) => ({ ...prev, company_id: "" }));
                                    }}
                                    placeholder={
                                        loadingCompanies
                                            ? "Loading companies..."
                                            : isAdmin
                                                ? "Search all companies..."
                                                : "Search your companies..."
                                    }
                                    loading={loadingCompanies}
                                    disabled={isEditMode}
                                    error={errors.company_id}
                                />
                                {isEditMode && (
                                    <p className="text-[10px] text-gray-400 mt-1">
                                        Company cannot be changed after lead creation.
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                {/* Contact - Searchable */}
                                <div>
                                    <label className={labelClass}>
                                        <User size={16} />
                                        Contact
                                    </label>
                                    <SearchableSelect
                                        options={contactOptions}
                                        value={formData.contact_id}
                                        onChange={(value) =>
                                            setFormData((prev) => ({ ...prev, contact_id: value }))
                                        }
                                        placeholder={
                                            !formData.company_id
                                                ? "Select company first"
                                                : loadingContacts
                                                    ? "Loading..."
                                                    : "Select contact..."
                                        }
                                        loading={loadingContacts}
                                        disabled={!formData.company_id}
                                    />
                                </div>

                                {/* Assigned To - Searchable (role-based) */}
                                <div>
                                    <label className={labelClass}>
                                        <UserPlus size={16} />
                                        Assigned To
                                    </label>

                                    {isAdmin ? (
                                        <SearchableSelect
                                            options={userOptions}
                                            value={formData.assigned_to}
                                            onChange={(value) =>
                                                setFormData((prev) => ({ ...prev, assigned_to: value }))
                                            }
                                            placeholder={
                                                loadingUsers
                                                    ? "Loading users..."
                                                    : userOptions.length === 0
                                                        ? "No users available"
                                                        : "Assign to user..."
                                            }
                                            loading={loadingUsers}
                                        />
                                    ) : isBDE ? (
                                        <>
                                            <div className={`${inputClass} bg-gray-50 flex items-center gap-2 cursor-not-allowed`}>
                                                <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                                                    <User size={11} className="text-indigo-600" />
                                                </div>
                                                <span className="text-gray-700 text-xs sm:text-sm truncate">
                                                    {user?.userName ?? "You"}
                                                </span>
                                                <span className="ml-auto text-[10px] text-indigo-500 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-full flex-shrink-0">
                                                    Auto
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-gray-400 mt-1">
                                                Automatically assigned to you.
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <div className={`${inputClass} bg-gray-50 cursor-not-allowed`}>
                                                <span className="text-gray-400">Not applicable</span>
                                            </div>
                                            <p className="text-[10px] text-gray-400 mt-1">
                                                Assignment not required for this role.
                                            </p>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                {/* ✅ Lead Status - NOW SEARCHABLE! */}
                                <div>
                                    <label className={labelClass}>
                                        <Shield size={16} />
                                        Lead Status <span className="text-red-500">*</span>
                                    </label>
                                    <SearchableSelect
                                        options={leadStatusOptions}
                                        value={formData.lead_status_id}
                                        onChange={(value) => {
                                            setFormData((prev) => ({
                                                ...prev,
                                                lead_status_id: value,
                                            }));
                                            setErrors((prev) => ({ ...prev, lead_status_id: "" }));
                                        }}
                                        placeholder={
                                            loadingStatuses
                                                ? "Loading statuses..."
                                                : "Select lead status..."
                                        }
                                        loading={loadingStatuses}
                                        error={errors.lead_status_id}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className={labelClass}>
                                        <Shield size={16} />
                                        Priority
                                    </label>
                                    <select
                                        value={formData.priority}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                priority: e.target.value as "low" | "medium" | "high",
                                            }))
                                        }
                                        className={inputClass}
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                    </select>
                                </div>
                            </div>

                            <div className="pt-2 sm:pt-4 border-t border-gray-200">
                                <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                                    <Tag size={18} />
                                    Tags
                                </h3>
                                <input
                                    type="text"
                                    value={formData.tags}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, tags: e.target.value }))
                                    }
                                    placeholder="e.g. enterprise, hot-lead, q4"
                                    className={inputClass}
                                />
                                <p className="text-[10px] text-gray-400 mt-1.5">
                                    Separate tags with commas
                                </p>
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
                        className="px-3 sm:px-4 py-2  text-white rounded-lg font-medium text-xs sm:text-sm  transition-colors flex items-center gap-1.5 sm:gap-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                        style={{ backgroundColor: "#1e2d6b" }}
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

export default LeadFormSlider;