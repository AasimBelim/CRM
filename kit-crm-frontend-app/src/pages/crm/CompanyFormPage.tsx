import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    Building2,
    Save,
    X,
    Globe,
    MapPin,
    Briefcase,
    Users,
    FileText,
   
} from "lucide-react";
import { toast } from "react-toastify";
import companyService from "@/services/companyService";
import type { CreateCompanyInput, UpdateCompanyInput } from "@/types/company.types";

const CompanyFormPage = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEditMode = !!id;

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
    });

    useEffect(() => {
        if (isEditMode) {
            fetchCompany();
        }
    }, [id]);

    const fetchCompany = async () => {
        if (!id) return;

        try {
            setLoading(true);
            const response = await companyService.getCompany(parseInt(id));

            const company = response.data;

            if (!company) {
                toast.error("Company not found");
                navigate("/companies");
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
            });
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to fetch company");
            navigate("/companies");
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

            if (isEditMode && id) {
                await companyService.updateCompany(parseInt(id), formData as UpdateCompanyInput);
                toast.success("Company updated successfully");
            } else {
                await companyService.createCompany(formData);
                toast.success("Company created successfully");
            }

            navigate("/companies");
        } catch (error: any) {
            toast.error(error.response?.data?.message || `Failed to ${isEditMode ? "update" : "create"} company`);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field: keyof CreateCompanyInput, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    if (loading && isEditMode) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <div className="flex items-center gap-2 text-gray-600">
                    <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    Loading company...
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                        <Building2 className="text-indigo-600" size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {isEditMode ? "Edit Company" : "New Company"}
                        </h1>
                        <p className="text-sm text-gray-500 mt-0.5">
                            {isEditMode ? "Update company information" : "Add a new company to your database"}
                        </p>
                    </div>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="max-w-5xl">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    {/* Form Header */}
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                        <h2 className="text-lg font-semibold text-gray-900">Company Information</h2>
                        <p className="text-sm text-gray-500 mt-1">Enter the company details below</p>
                    </div>

                    {/* Form Body */}
                    <div className="p-6 space-y-6">
                        {/* Basic Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                    <Building2 size={16} />
                                    Company Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => handleChange("name", e.target.value)}
                                    placeholder="Enter company name"
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50"
                                    required
                                />
                            </div>

                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                    <Globe size={16} />
                                    Website
                                </label>
                                <input
                                    type="url"
                                    value={formData.website}
                                    onChange={(e) => handleChange("website", e.target.value)}
                                    placeholder="https://example.com"
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50"
                                />
                            </div>

                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                    <Globe size={16} />
                                    Domain
                                </label>
                                <input
                                    type="text"
                                    value={formData.domain}
                                    onChange={(e) => handleChange("domain", e.target.value)}
                                    placeholder="example.com"
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50"
                                />
                            </div>

                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                    <Briefcase size={16} />
                                    Industry
                                </label>
                                <select
                                    value={formData.industry}
                                    onChange={(e) => handleChange("industry", e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50"
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
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                    <Users size={16} />
                                    Company Size
                                </label>
                                <select
                                    value={formData.company_size}
                                    onChange={(e) => handleChange("company_size", e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50"
                                >
                                    <option value="">Select size</option>
                                    <option value="1-10">1-10 employees</option>
                                    <option value="11-50">11-50 employees</option>
                                    <option value="51-200">51-200 employees</option>
                                    <option value="201-500">201-500 employees</option>
                                    <option value="501-1000">501-1000 employees</option>
                                    <option value="1000+">1000+ employees</option>
                                </select>
                            </div>
                        </div>

                        {/* Location Information */}
                        <div className="pt-6 border-t border-gray-200">
                            <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <MapPin size={18} />
                                Location
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Country
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.country}
                                        onChange={(e) => handleChange("country", e.target.value)}
                                        placeholder="Enter country"
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        City
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.city}
                                        onChange={(e) => handleChange("city", e.target.value)}
                                        placeholder="Enter city"
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Address
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.address}
                                        onChange={(e) => handleChange("address", e.target.value)}
                                        placeholder="Enter full address"
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="pt-6 border-t border-gray-200">
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <FileText size={16} />
                                Description
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => handleChange("description", e.target.value)}
                                placeholder="Enter company description"
                                rows={4}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 resize-none"
                            />
                        </div>

                        {/* Data Quality */}
                        <div className="pt-6 border-t border-gray-200">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    </div>

                    {/* Form Footer */}
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => navigate("/companies")}
                            className="px-4 py-2.5 border border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition-colors flex items-center gap-2"
                        >
                            <X size={18} />
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Save size={18} />
                            {loading ? "Saving..." : isEditMode ? "Update Company" : "Create Company"}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default CompanyFormPage;