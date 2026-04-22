// This is an EXAMPLE showing how to integrate SearchableSelect into DealFormSlider
// Use this as the complete DealFormSlider component

import { useState, useEffect } from "react";
import { X, Handshake, Save } from "lucide-react";
import { toast } from "react-toastify";
import dealService from "@/services/dealService";
import apiCall from "@/utils/axios";
import SearchableSelect from "./Searchableselect"; // Make sure this path is correct based on your project structure
import { useAuth } from "@/hooks/useAuth";

interface DealFormSliderProps {
  isOpen: boolean;
  onClose: (saved?: boolean) => void;
  dealId?: number | null;
}

interface Opportunity {
  id: number;
  leadCompanyName: string;
  expectedValue: number | string;
  stageName?: string;
}

const DealFormSlider = ({ isOpen, onClose, dealId }: DealFormSliderProps) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Dropdown data
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loadingOpportunities, setLoadingOpportunities] = useState(false);
  const { user } = useAuth();

  const role = user?.role?.toLowerCase();
  const userId = (user as any)?.id || (user as any)?.userId;

  // Form state
  const [formData, setFormData] = useState({
    opportunityId: null as number | null,
    dealValue: "",
    status: "pending" as "pending" | "partial" | "won" | "lost",
    contractStartDate: "",
    contractEndDate: "",
    paymentTerms: "",
    closedDate: "",
    lostReasonId: null as number | null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch opportunities
  useEffect(() => {
    const fetchOpportunities = async () => {
      try {
        setLoadingOpportunities(true);


        const isBDE =
          role === "bde person" ||
          role === "bde" ||
          role === "business development executive";

        let url = "/opportunities";

        if (isBDE && userId) {
          url += `?createdBy=${userId}&limit=1000`;
        } else {
          url += `?limit=1000`;
        }

        const response = await apiCall.get(url);
        if (response.data.status && response.data.data) {
          setOpportunities(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching opportunities:", error);
      } finally {
        setLoadingOpportunities(false);
      }
    };

    if (isOpen) {
      fetchOpportunities();
    }
  }, [isOpen]);

  // Fetch deal data if editing
  useEffect(() => {
    const fetchDealData = async () => {
      if (!dealId) return;

      try {
        setLoading(true);
        const response = await dealService.getDeal(dealId);
        if (response.status && response.data) {
          const deal = response.data;
          setFormData({
            opportunityId: deal.opportunityId,
            dealValue: deal.dealValue?.toString() || "",
            status: deal.status,
            contractStartDate: deal.contractStartDate || "",
            contractEndDate: deal.contractEndDate || "",
            paymentTerms: deal.paymentTerms || "",
            closedDate: deal.closedDate || "",
            lostReasonId: deal.lostReasonId || null,
          });
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Failed to fetch deal");
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && dealId) {
      fetchDealData();
    } else if (isOpen) {
      // Reset form for new deal
      setFormData({
        opportunityId: null,
        dealValue: "",
        status: "pending",
        contractStartDate: "",
        contractEndDate: "",
        paymentTerms: "",
        closedDate: "",
        lostReasonId: null,
      });
      setErrors({});
    }
  }, [isOpen, dealId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.opportunityId) newErrors.opportunityId = "Opportunity is required";
    if (!formData.dealValue) newErrors.dealValue = "Deal value is required";
    if (parseFloat(formData.dealValue) <= 0) newErrors.dealValue = "Deal value must be greater than 0";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setSaving(true);
      const payload = {
        opportunity_id: formData.opportunityId!,
        deal_value: parseFloat(formData.dealValue),
        status: formData.status,
        contract_start_date: formData.contractStartDate || undefined,
        contract_end_date: formData.contractEndDate || undefined,
        payment_terms: formData.paymentTerms || undefined,
        closed_date: formData.closedDate || undefined,
        lost_reason_id: formData.lostReasonId || undefined,
      };

      if (dealId) {
        await dealService.updateDeal(dealId, payload);
        toast.success("Deal updated successfully");
      } else {
        await dealService.createDeal(payload);
        toast.success("Deal created successfully");
      }

      onClose(true);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save deal");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  // Convert opportunities to options format
  const opportunityOptions = opportunities.map((o) => ({
    value: o.id,
    label: o.leadCompanyName,
    sublabel: `$${typeof o.expectedValue === 'string' ? o.expectedValue : o.expectedValue.toLocaleString()} • ${o.stageName || 'Unknown stage'}`,
  }));

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/50" onClick={() => onClose()} />

      <div className="absolute right-0 top-0 h-full w-full sm:w-[500px] md:w-[600px] bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#1e2d6b] rounded-lg">
              <Handshake className="text-white" size={20} />
            </div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              {dealId ? "Edit Deal" : "Create New Deal"}
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
              {/* Opportunity - Searchable */}
              <SearchableSelect
                label="Opportunity"
                options={opportunityOptions}
                value={formData.opportunityId}
                onChange={(value) => {
                  setFormData({ ...formData, opportunityId: value });
                  setErrors({ ...errors, opportunityId: "" });
                }}
                placeholder="Select opportunity..."
                loading={loadingOpportunities}
                error={errors.opportunityId}
                required
              />

              {/* Deal Value */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Deal Value <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.dealValue}
                  onChange={(e) => {
                    setFormData({ ...formData, dealValue: e.target.value });
                    setErrors({ ...errors, dealValue: "" });
                  }}
                  className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 border rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-50 ${errors.dealValue
                    ? "border-red-300 focus:border-red-500"
                    : "border-gray-300 focus:border-purple-500"
                    }`}
                  placeholder="Enter deal value..."
                />
                {errors.dealValue && (
                  <p className="mt-1.5 text-xs text-red-600">{errors.dealValue}</p>
                )}
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-50 focus:border-purple-500"
                >
                  <option value="pending">Pending</option>
                  <option value="partial">Partial</option>
                  <option value="won">Won</option>
                  <option value="lost">Lost</option>
                </select>
              </div>

              {/* Contract Start Date */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Contract Start Date
                </label>
                <input
                  type="date"
                  value={formData.contractStartDate}
                  onChange={(e) => setFormData({ ...formData, contractStartDate: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-50 focus:border-purple-500"
                />
              </div>

              {/* Contract End Date */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Contract End Date
                </label>
                <input
                  type="date"
                  value={formData.contractEndDate}
                  onChange={(e) => setFormData({ ...formData, contractEndDate: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-50 focus:border-purple-500"
                />
              </div>

              {/* Closed Date */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Closed Date
                </label>
                <input
                  type="date"
                  value={formData.closedDate}
                  onChange={(e) => setFormData({ ...formData, closedDate: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-50 focus:border-purple-500"
                />
              </div>

              {/* Payment Terms */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Payment Terms
                </label>
                <textarea
                  value={formData.paymentTerms}
                  onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                  rows={3}
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-50 focus:border-purple-500 resize-none"
                  placeholder="Enter payment terms..."
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
            className="px-4 py-2 bg-[#1e2d6b] text-white rounded-lg transition-colors font-medium text-xs sm:text-sm disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={16} />
                {dealId ? "Update Deal" : "Create Deal"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DealFormSlider;