import { useState, useEffect } from "react";
import {
  X,
  Save,
  Building2,
  Globe,
  MapPin,
  Briefcase,
  Users,
  FileText,
  CheckCircle,
} from "lucide-react";
import { toast } from "react-toastify";
import companyService from "@/services/companyService";
import type { CreateCompanyInput, UpdateCompanyInput } from "@/types/company.types";

interface CompanyFormSliderProps {
  isOpen: boolean;
  onClose: (saved?: boolean) => void;
  companyId: number | null;
}

const CompanyFormSlider = ({ isOpen, onClose, companyId }: CompanyFormSliderProps) => {
  const isEditMode = !!companyId;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateCompanyInput>({
    name: "",
    website: "",
    domain: "",
    industry: "",
    company_size: "",
    country: "",
    city: "",
    address: "",
    description: "",
    data_quality: 3,
    assigned_to: undefined,
    is_active: true,
  });

  useEffect(() => {
    if (isOpen && isEditMode && companyId) {
      fetchCompany();
    } else if (isOpen && !isEditMode) {
      resetForm();
    }
  }, [isOpen, companyId]);

  const resetForm = () => {
    setFormData({
      name: "",
      website: "",
      domain: "",
      industry: "",
      company_size: "",
      country: "",
      city: "",
      address: "",
      description: "",
      data_quality: 3,
      assigned_to: undefined,
      is_active: true,
    });
  };

  const fetchCompany = async () => {
    if (!companyId) return;

    try {
      setLoading(true);
      const response = await companyService.getCompany(companyId);
      const company = response.data;

      if (!company) {
        toast.error("Company not found");
        onClose(false);
        return;
      }

      setFormData({
        name: company.name,
        website: company.website || "",
        domain: company.domain || "",
        industry: company.industry || "",
        company_size: company.companySize || "",
        country: company.country || "",
        city: company.city || "",
        address: company.address || "",
        description: company.description || "",
        data_quality: company.dataQuality || 3,
        assigned_to: company.assignedTo || undefined,
        is_active: company.isActive ?? true,
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to fetch company");
      onClose(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Company name is required");
      return;
    }

    try {
      setLoading(true);

      if (isEditMode && companyId) {
        await companyService.updateCompany(companyId, formData as UpdateCompanyInput);
        toast.success("Company updated successfully");
      } else {
        await companyService.createCompany(formData);
        toast.success("Company created successfully");
      }

      onClose(true);
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Failed to ${isEditMode ? "update" : "create"} company`);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof CreateCompanyInput, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={() => onClose(false)}
      />

      {/* Slider - Responsive Width */}
      <div className="fixed right-0 top-0 h-full w-full sm:w-[500px] md:w-[600px] bg-white shadow-2xl z-50 overflow-hidden flex flex-col">
        {/* Header - Responsive Padding */}
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50 flex-shrink-0">
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
              {isEditMode ? "Edit Company" : "New Company"}
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              {isEditMode ? "Update company information" : "Add a new company"}
            </p>
          </div>
          <button
            onClick={() => onClose(false)}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors flex-shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            {/* Company Name */}
            <div>
              <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-700 mb-2">
                <Building2 size={16} />
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Enter company name"
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50"
                required
              />
            </div>

            {/* Website & Domain */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  <Globe size={16} />
                  Website
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleChange("website", e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  <Globe size={16} />
                  Domain
                </label>
                <input
                  type="text"
                  value={formData.domain}
                  onChange={(e) => handleChange("domain", e.target.value)}
                  placeholder="example.com"
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50"
                />
              </div>
            </div>

            {/* Industry & Size */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  <Briefcase size={16} />
                  Industry
                </label>
                <select
                  value={formData.industry}
                  onChange={(e) => handleChange("industry", e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50"
                >
                  <option value="">Select industry</option>
                  <option value="Technology">Technology</option>
                  <option value="Finance">Finance</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Retail">Retail</option>
                  <option value="Education">Education</option>
                  <option value="Real Estate">Real Estate</option>
                  <option value="Transportation">Transportation</option>
                  <option value="Energy">Energy</option>
                  <option value="Telecommunications">Telecommunications</option>
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  <Users size={16} />
                  Company Size
                </label>
                <select
                  value={formData.company_size}
                  onChange={(e) => handleChange("company_size", e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50"
                >
                  <option value="">Select size</option>
                  <option value="1-10">1-10</option>
                  <option value="11-50">11-50</option>
                  <option value="51-200">51-200</option>
                  <option value="201-500">201-500</option>
                  <option value="501-1000">501-1000</option>
                  <option value="1000+">1000+</option>
                </select>
              </div>
            </div>

            {/* Status Field */}
            <div>
              <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-700 mb-2">
                <CheckCircle size={16} />
                Status
              </label>
              <select
                value={formData.is_active ? "true" : "false"}
                onChange={(e) => handleChange("is_active", e.target.value === "true")}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50"
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>

            {/* Location Section */}
            <div className="pt-2 sm:pt-4 border-t border-gray-200">
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                <MapPin size={18} />
                Location
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    Country
                  </label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => handleChange("country", e.target.value)}
                    placeholder="Enter country"
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleChange("city", e.target.value)}
                    placeholder="Enter city"
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50"
                  />
                </div>
              </div>

              <div className="mt-3 sm:mt-4">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  placeholder="Enter full address"
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-700 mb-2">
                <FileText size={16} />
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Enter company description"
                rows={3}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 resize-none"
              />
            </div>

            {/* Data Quality */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Data Quality ({formData.data_quality}/5)
              </label>
              <input
                type="range"
                min="1"
                max="5"
                value={formData.data_quality}
                onChange={(e) => handleChange("data_quality", parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Poor</span>
                <span>Fair</span>
                <span>Good</span>
                <span>Very Good</span>
                <span>Excellent</span>
              </div>
            </div>
          </form>
        </div>

        {/* Footer - Sticky and Responsive */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-2 sm:gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={() => onClose(false)}
            className="px-3 sm:px-4 py-2 border border-gray-200 rounded-lg text-gray-700 font-medium text-xs sm:text-sm hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-3 sm:px-4 py-2 text-white rounded-lg font-medium text-xs sm:text-sm transition-all duration-200 flex items-center gap-1.5 xs:gap-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            style={{
              backgroundColor: "#1e2d6b",
              boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#24357a";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#1e2d6b";
            }}
          >
            <Save size={16} />
            {loading ? "Saving..." : isEditMode ? "Update" : "Create"}
          </button>
        </div>
      </div>
    </>
  );
};

export default CompanyFormSlider;