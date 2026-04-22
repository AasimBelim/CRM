import { useState, useEffect } from "react";
import { X, Save } from "lucide-react";
import { toast } from "react-toastify";
import contactService from "@/services/contactService";
import type { CreateContactInput, UpdateContactInput, ContactResponse } from "@/types/contact.types";
import type { Company } from "@/types/company.types";

interface ContactFormSliderProps {
    mode: "add" | "edit";
    contactId?: number;
    onClose: (saved: boolean) => void;
    companies: Company[];
}

const ContactFormSlider = ({ mode, contactId, onClose, companies }: ContactFormSliderProps) => {
    const isEditMode = mode === "edit";
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState<CreateContactInput & { is_active?: boolean }>({
        company_id: 0,
        name: "",
        email: "",
        phone: "",
        linkedin: "",
        designation: "",
        is_primary: false,
        is_active: true,
    });

    // Load contact data in edit mode
    useEffect(() => {
        if (isEditMode && contactId) {
            fetchContact();
        }
    }, [isEditMode, contactId]);

    const fetchContact = async () => {
        if (!contactId) return;

        try {
            setLoading(true);
            setError(null);
            const response = await contactService.getContact(contactId);
            const contact = response?.data as ContactResponse | undefined;

            if (!contact) {
                setError("Contact not found");
                return;
            }

            setFormData({
                company_id: contact.companyId || 0,
                name: contact.name || "",
                email: contact.email || "",
                phone: contact.phone || "",
                linkedin: contact.linkedIn || "",
                designation: contact.designation || "",
                is_primary: contact.isPrimary || false,
                is_active: contact.isActive ?? true,
            });
        } catch (err) {
            console.error("Error fetching contact:", err);
            setError("Failed to load contact data");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field: keyof typeof formData, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate required fields
        if (!formData.company_id) {
            setError("Company is required");
            return;
        }
        if (!formData.name) {
            setError("Contact name is required");
            return;
        }
        if (!formData.email) {
            setError("Email is required");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            if (isEditMode && contactId) {
                const payload: UpdateContactInput = {
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone || undefined,
                    linkedin: formData.linkedin || undefined,
                    designation: formData.designation || undefined,
                    is_primary: formData.is_primary,
                    is_active: formData.is_active,
                };
                await contactService.updateContact(contactId, payload);
                toast.success("Contact updated successfully");
            } else {
                const payload: CreateContactInput = {
                    company_id: formData.company_id,
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone || undefined,
                    linkedin: formData.linkedin || undefined,
                    designation: formData.designation || undefined,
                    is_primary: formData.is_primary,
                };
                await contactService.createContact(payload);
                toast.success("Contact created successfully");
            }
            onClose(true);
        } catch (err: any) {
            console.error("Error saving contact:", err);
            setError(err.response?.data?.message || "Failed to save contact");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
                onClick={() => onClose(false)}
            />

            {/* Slider */}
            <div className="fixed right-0 top-0 h-screen w-full max-w-2xl bg-white shadow-2xl z-50 flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">
                            {isEditMode ? "Edit Contact" : "New Contact"}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {isEditMode ? "Update contact information" : "Add a new contact"}
                        </p>
                    </div>
                    <button
                        onClick={() => onClose(false)}
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        <X size={20} className="text-gray-600" />
                    </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Error Message */}
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    {/* Company Field */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Company <span className="text-red-500">*</span>
                        </label>
                        <select
                            required
                            value={formData.company_id || ""}
                            onChange={(e) => handleChange("company_id", Number(e.target.value))}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 bg-white text-gray-900"
                            disabled={isEditMode}
                        >
                            <option value="">Select a company</option>
                            {companies.map((company) => (
                                <option key={company.id} value={company.id}>
                                    {company.name}
                                </option>
                            ))}
                        </select>
                        {isEditMode && (
                            <p className="text-xs text-gray-500 mt-1">Company cannot be changed after creation</p>
                        )}
                    </div>

                    {/* Name Field */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.name || ""}
                            onChange={(e) => handleChange("name", e.target.value)}
                            placeholder="Enter full name"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 bg-white text-gray-900"
                        />
                    </div>

                    {/* Email Field */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Email <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="email"
                            required
                            value={formData.email || ""}
                            onChange={(e) => handleChange("email", e.target.value)}
                            placeholder="john@example.com"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 bg-white text-gray-900"
                        />
                    </div>

                    {/* Phone Field */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Phone Number
                        </label>
                        <input
                            type="tel"
                            value={formData.phone || ""}
                            onChange={(e) => handleChange("phone", e.target.value)}
                            placeholder="+1 (555) 0000"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 bg-white text-gray-900"
                        />
                    </div>

                    {/* LinkedIn Field */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            LinkedIn Profile
                        </label>
                        <input
                            type="url"
                            value={formData.linkedin || ""}
                            onChange={(e) => handleChange("linkedin", e.target.value)}
                            placeholder="https://linkedin.com/in/..."
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 bg-white text-gray-900"
                        />
                    </div>

                    {/* Designation Field */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Designation
                        </label>
                        <input
                            type="text"
                            value={formData.designation || ""}
                            onChange={(e) => handleChange("designation", e.target.value)}
                            placeholder="e.g., Manager, Director"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 bg-white text-gray-900"
                        />
                    </div>

                    {/* Primary Contact Toggle */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Primary Contact
                        </label>
                        <select
                            value={formData.is_primary ? "true" : "false"}
                            onChange={(e) => handleChange("is_primary", e.target.value === "true")}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 bg-white text-gray-900"
                        >
                            <option value="false">No</option>
                            <option value="true">Yes</option>
                        </select>
                    </div>

                    {/* Status Toggle (Edit Mode Only) */}
                    {isEditMode && (
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Status
                            </label>
                            <select
                                value={formData.is_active ? "true" : "false"}
                                onChange={(e) => handleChange("is_active", e.target.value === "true")}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 bg-white text-gray-900"
                            >
                                <option value="true">Active</option>
                                <option value="false">Inactive</option>
                            </select>
                        </div>
                    )}
                </form>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => onClose(false)}
                        className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Save size={18} />
                        {loading ? "Saving..." : isEditMode ? "Update" : "Create"}
                    </button>
                </div>
            </div>
        </>
    );
};

export default ContactFormSlider;