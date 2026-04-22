// This is an EXAMPLE showing how to integrate SearchableSelect into OpportunityFormSlider
// Replace the existing dropdowns with these searchable versions

import { useState, useEffect } from "react";
import { X, TrendingUp, Save } from "lucide-react";
import { toast } from "react-toastify";
import apiCall from "@/utils/axios";
import SearchableSelect from "./Searchableselect"; // Make sure this path is correct based on your project structure
import { useAuth } from "@/hooks/useAuth";

interface OpportunityFormSliderProps {
    isOpen: boolean;
    onClose: (saved?: boolean) => void;
    opportunityId?: number | null;
}

interface Lead {
    id: number;
    companyName: string;
    contactName?: string;
}

interface Stage {
    id: number;
    name: string;
    probability?: number;
}

const OpportunityFormSlider = ({ isOpen, onClose, opportunityId }: OpportunityFormSliderProps) => {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Dropdown data
    const [leads, setLeads] = useState<Lead[]>([]);
    const [stages, setStages] = useState<Stage[]>([]);
    const [loadingLeads, setLoadingLeads] = useState(false);
    const [loadingStages, setLoadingStages] = useState(false);

    const { user } = useAuth();
    const role = user?.role?.toLowerCase();
    const userId = (user as any)?.id || (user as any)?.userId;
    const isBDE =
        role === "bde person" ||
        role === "bde" ||
        role === "business development executive";

    // Form state
    const [formData, setFormData] = useState({
        leadId: null as number | null,
        stageId: null as number | null,
        expectedValue: "",
        expectedCloseDate: "",
        probability: "",
        description: "",
        competitorInfo: "",
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    // Fetch leads
    useEffect(() => {
        const fetchLeads = async () => {
            try {
                setLoadingLeads(true);
                const params: any = {
                    limit: 1000,
                };

                if (isBDE && userId) {
                    params.createdBy = userId;
                    params.assignedTo = userId;
                }

                // Admin → no filter

                let url = "/leads";

                if (isBDE && userId) {
                    url += `?assignedTo=${userId}&createdBy=${userId}&limit=1000`;
                } else {
                    url += `?limit=1000`;
                }

                const response = await apiCall.get(url);
                if (response.data.status && response.data.data) {
                    setLeads(response.data.data);
                }
            } catch (error) {
                console.error("Error fetching leads:", error);
            } finally {
                setLoadingLeads(false);
            }
        };

        if (isOpen) {
            fetchLeads();
        }
    }, [isOpen, role, userId]);

    // Fetch stages
    useEffect(() => {
        const fetchStages = async () => {
            try {
                setLoadingStages(true);
                const response = await apiCall.get("/opportunities/stages");
                if (response.data.status && response.data.data) {
                    setStages(response.data.data);
                }
            } catch (error) {
                console.error("Error fetching stages:", error);
            } finally {
                setLoadingStages(false);
            }
        };

        if (isOpen) {
            fetchStages();
        }
    }, [isOpen]);

    // Fetch opportunity data if editing
    useEffect(() => {
        const fetchOpportunityData = async () => {
            if (!opportunityId) return;

            try {
                setLoading(true);
                const response = await apiCall.get(`/opportunities/${opportunityId}`);
                if (response.data.status && response.data.data) {
                    const opp = response.data.data;
                    setFormData({
                        leadId: opp.leadId,
                        stageId: opp.stageId,
                        expectedValue: opp.expectedValue || "",
                        expectedCloseDate: opp.expectedCloseDate
                            ? opp.expectedCloseDate.split("T")[0]
                            : "",
                        probability: opp.probability?.toString() || "",
                        description: opp.description || "",
                        competitorInfo: opp.competitorInfo || "",
                    });
                }
            } catch (error: any) {
                toast.error(error.response?.data?.message || "Failed to fetch opportunity");
            } finally {
                setLoading(false);
            }
        };

        if (isOpen && opportunityId) {
            fetchOpportunityData();
        } else if (isOpen) {
            // Reset form for new opportunity
            setFormData({
                leadId: null,
                stageId: null,
                expectedValue: "",
                expectedCloseDate: "",
                probability: "",
                description: "",
                competitorInfo: "",
            });
            setErrors({});
        }
    }, [isOpen, opportunityId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        const newErrors: Record<string, string> = {};
        if (!formData.leadId) newErrors.leadId = "Lead is required";
        if (!formData.stageId) newErrors.stageId = "Stage is required";
        if (!formData.expectedValue) newErrors.expectedValue = "Expected value is required";
        if (!formData.expectedCloseDate) newErrors.expectedCloseDate = "Expected close date is required";

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        try {
            setSaving(true);
            const payload = {
                lead_id: formData.leadId,
                stage_id: formData.stageId,
                expected_value: parseFloat(formData.expectedValue),
                expected_close_date: formData.expectedCloseDate,
                probability: formData.probability ? parseInt(formData.probability) : undefined,
                description: formData.description,
                competitor_info: formData.competitorInfo,
            };

            if (opportunityId) {
                await apiCall.put(`/opportunities/${opportunityId}`, payload);
                toast.success("Opportunity updated successfully");
            } else {
                await apiCall.post("/opportunities", payload);
                toast.success("Opportunity created successfully");
            }

            onClose(true);
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to save opportunity");
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    // Convert data to options format
    const leadOptions = leads.map((l) => ({
        value: l.id,
        label: l.companyName,
        sublabel: l.contactName,
    }));

    const stageOptions = stages.map((s) => ({
        value: s.id,
        label: s.name,
        sublabel: s.probability ? `${s.probability}% probability` : undefined,
    }));

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => onClose()} />

            <div className="absolute right-0 top-0 h-full w-full sm:w-[500px] md:w-[600px] bg-white shadow-xl flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#1e2d6b] rounded-lg">
                            <TrendingUp className="text-white" size={20} />
                        </div>
                        <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                            {opportunityId ? "Edit Opportunity" : "Create New Opportunity"}
                        </h2>
                    </div>
                    <button
                        onClick={() => onClose()}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="w-8 h-8 border-2 border-[#1e2d6b] border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                            {/* Lead - Searchable */}
                            <SearchableSelect
                                label="Lead"
                                options={leadOptions}
                                value={formData.leadId}
                                onChange={(value) => {
                                    setFormData({ ...formData, leadId: value });
                                    setErrors({ ...errors, leadId: "" });
                                }}
                                placeholder="Select lead..."
                                loading={loadingLeads}
                                error={errors.leadId}
                                required
                                disabled={!!opportunityId}   // ✅ ADD THIS
                            />

                            {/* Stage - Searchable */}
                            <SearchableSelect
                                label="Stage"
                                options={stageOptions}
                                value={formData.stageId}
                                onChange={(value) => {
                                    setFormData({ ...formData, stageId: value });
                                    setErrors({ ...errors, stageId: "" });
                                }}
                                placeholder="Select stage..."
                                loading={loadingStages}
                                error={errors.stageId}
                                required
                            />

                            {/* Expected Value */}
                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                                    Expected Value <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    value={formData.expectedValue}
                                    onChange={(e) => {
                                        setFormData({ ...formData, expectedValue: e.target.value });
                                        setErrors({ ...errors, expectedValue: "" });
                                    }}
                                    className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 border rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-green-50 ${errors.expectedValue
                                        ? "border-red-300 focus:border-red-500"
                                        : "border-gray-300 focus:border-green-500"
                                        }`}
                                    placeholder="Enter expected value..."
                                />
                                {errors.expectedValue && (
                                    <p className="mt-1.5 text-xs text-red-600">{errors.expectedValue}</p>
                                )}
                            </div>

                            {/* Expected Close Date */}
                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                                    Expected Close Date <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={formData.expectedCloseDate}
                                    onChange={(e) => {
                                        setFormData({ ...formData, expectedCloseDate: e.target.value });
                                        setErrors({ ...errors, expectedCloseDate: "" });
                                    }}
                                    className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 border rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-green-50 ${errors.expectedCloseDate
                                        ? "border-red-300 focus:border-red-500"
                                        : "border-gray-300 focus:border-green-500"
                                        }`}
                                />
                                {errors.expectedCloseDate && (
                                    <p className="mt-1.5 text-xs text-red-600">{errors.expectedCloseDate}</p>
                                )}
                            </div>

                            {/* Probability */}
                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                                    Probability (%)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={formData.probability}
                                    onChange={(e) => setFormData({ ...formData, probability: e.target.value })}
                                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-green-50 focus:border-green-500"
                                    placeholder="Enter probability..."
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={4}
                                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-green-50 focus:border-green-500 resize-none"
                                    placeholder="Add opportunity description..."
                                />
                            </div>

                            {/* Competitor Info */}
                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                                    Competitor Information
                                </label>
                                <textarea
                                    value={formData.competitorInfo}
                                    onChange={(e) => setFormData({ ...formData, competitorInfo: e.target.value })}
                                    rows={3}
                                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-green-50 focus:border-green-500 resize-none"
                                    placeholder="Add competitor information..."
                                />
                            </div>
                        </form>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-4 sm:px-6 py-4 border-t border-gray-200 bg-gray-50">
                    <button
                        type="button"
                        onClick={() => onClose()}
                        disabled={saving}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium text-xs sm:text-sm disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="px-4 py-2  text-white rounded-lg  transition-colors font-medium text-xs sm:text-sm disabled:opacity-50 flex items-center gap-2"
                        style={{ backgroundColor: "#1e2d6b" }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#24357a"}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#1e2d6b"}
                    >
                        {saving ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save size={16} />
                                {opportunityId ? "Update Opportunity" : "Create Opportunity"}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OpportunityFormSlider;