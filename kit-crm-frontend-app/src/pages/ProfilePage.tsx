import { Eye, EyeOff, Save, User, Mail, Phone, Lock, Edit2, X } from "lucide-react";
import { useState, useMemo, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { checkEmailFormat } from "@/utils/helpers";
import { toast } from "react-toastify";
import type { userData, UserProfileFormData } from "@/types/Users";
import apiCall from "@/utils/axios";

const BRAND = "#1e2d6b";

// 👇 OUTSIDE (top of file, before ProfilePage)
const Field = ({
    id,
    label,
    required,
    children,
}: {
    id?: string;
    label: string;
    required?: boolean;
    children: React.ReactNode;
}) => (
    <div className="flex flex-col gap-2 py-3 px-3 sm:px-4 md:px-6 border-b border-gray-100 last:border-0">
        <label htmlFor={id} className="text-xs sm:text-sm font-medium text-gray-600">
            {label}
            {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        <div className="w-full">{children}</div>
    </div>
);

const ProfilePage = () => {
    const { user, setUser, token } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState<UserProfileFormData>({
        firstName: user?.firstName || "",
        lastName: user?.lastName || "",
        email: user?.email || "",
        password: "",
        phoneNumber: user?.phoneNumber || "",
    });

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isLoading) return;
        if (!formData.firstName.trim()) { toast.error("First name is required"); return; }
        if (!formData.lastName.trim()) { toast.error("Last name is required"); return; }
        if (!formData.email.trim()) { toast.error("Email is required"); return; }
        if (!checkEmailFormat(formData.email)) { toast.error("Please enter a valid email address"); return; }
        if (!formData.phoneNumber.trim()) { toast.error("Phone number is required"); return; }

        const payload: any = {
            first_name: formData.firstName,
            last_name: formData.lastName,
            email: formData.email,
            phone_number: formData.phoneNumber,
        };
        if (formData.password) payload.password = formData.password;

        try {
            setIsLoading(true);
            const response = await apiCall.put("/profile", payload, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const { data: updatedData } = response.data;
            if (response.data.status !== true || !updatedData) {
                toast.error(response.data.message || "Failed to update profile.");
                return;
            }
            const updated: userData = {
                ...user!,
                email: updatedData.email,
                firstName: updatedData.firstName,
                lastName: updatedData.lastName,
                phoneNumber: updatedData.phoneNumber,
            };
            if (setUser) setUser(updated);
            toast.success("Profile updated successfully.");
            setIsEditing(false);
            setFormData(prev => ({ ...prev, password: "" }));
        } catch {
            toast.error("An error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = useCallback(() => {
        setIsEditing(false);
        setFormData({
            firstName: user?.firstName || "",
            lastName: user?.lastName || "",
            email: user?.email || "",
            password: "",
            phoneNumber: user?.phoneNumber || "",
        });
        setShowPassword(false);
    }, [user]);

    const userInitials = useMemo(() =>
        `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`.toUpperCase() || "U",
        [user]
    );



    return (
        <div className="min-h-screen bg-gray-50 py-4 px-3 sm:py-6 sm:px-4 md:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">

                {/* Page header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <div
                            className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-white text-base sm:text-lg font-bold flex-shrink-0"
                            style={{ backgroundColor: BRAND }}
                        >
                            {userInitials}
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 truncate">
                                Profile Settings
                            </h1>
                            <p className="text-xs sm:text-sm text-gray-500 mt-0.5 truncate">
                                {user?.firstName} {user?.lastName} · <span className="capitalize">{user?.role}</span>
                            </p>
                        </div>
                    </div>

                    {/* Edit Profile Button */}
                    {!isEditing && (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all duration-200 active:scale-[0.98] w-full sm:w-auto"
                            style={{ backgroundColor: BRAND, boxShadow: "0 4px 12px rgba(30,45,107,0.25)" }}
                        >
                            <Edit2 size={16} />
                            Edit Profile
                        </button>
                    )}
                </div>

                {/* Form card */}
                <form onSubmit={handleFormSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

                    {/* Card header */}
                    <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b border-gray-100 flex items-center justify-between"
                        style={{ background: "linear-gradient(135deg, #f8faff 0%, #f0f4ff 100%)" }}>
                        <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-semibold text-gray-800 truncate">
                                Account Information
                            </p>
                            <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5 truncate">
                                {isEditing ? "Edit your personal details" : "View your personal details"}
                            </p>
                        </div>
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: BRAND, opacity: 0.5 }} />
                    </div>

                    {/* Username — read only */}
                    <Field id="username" label="Username">
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10">
                                <User size={16} />
                            </span>
                            <input
                                id="username"
                                type="text"
                                readOnly
                                disabled
                                value={user?.userName || ""}
                                className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-100 rounded-xl bg-gray-50 text-gray-400 cursor-not-allowed"
                            />
                        </div>
                    </Field>

                    {/* First + Last name */}
                    <div className="py-3 px-3 sm:px-4 md:px-6 border-b border-gray-100">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label htmlFor="firstName" className="block text-xs sm:text-sm font-medium text-gray-600 mb-1.5">
                                    First Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="firstName"
                                    type="text"
                                    readOnly={!isEditing}
                                    disabled={!isEditing}
                                    value={formData.firstName}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setFormData(prev => ({ ...prev, firstName: value }));
                                    }}
                                    className="w-full px-3 py-2.5 text-sm border rounded-xl transition-all focus:outline-none border-gray-200 bg-white text-gray-900 focus:border-[#1e2d6b] focus:ring-2 focus:ring-[#1e2d6b]/10 disabled:border-gray-100 disabled:bg-gray-50 disabled:text-gray-700 disabled:cursor-not-allowed"
                                    placeholder="John"
                                />
                            </div>
                            <div>
                                <label htmlFor="lastName" className="block text-xs sm:text-sm font-medium text-gray-600 mb-1.5">
                                    Last Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="lastName"
                                    type="text"
                                    readOnly={!isEditing}
                                    disabled={!isEditing}
                                    value={formData.lastName}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setFormData(prev => ({ ...prev, lastName: value }));
                                    }}
                                    className="w-full px-3 py-2.5 text-sm border rounded-xl transition-all focus:outline-none border-gray-200 bg-white text-gray-900 focus:border-[#1e2d6b] focus:ring-2 focus:ring-[#1e2d6b]/10 disabled:border-gray-100 disabled:bg-gray-50 disabled:text-gray-700 disabled:cursor-not-allowed"
                                    placeholder="Doe"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Email */}
                    <Field id="email" label="Email Address" required>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10">
                                <Mail size={16} />
                            </span>
                            <input
                                id="email"
                                type="email"
                                readOnly={!isEditing}
                                disabled={!isEditing}
                                value={formData.email}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setFormData(prev => ({ ...prev, email: value }));
                                }}
                                className="w-full pl-9 pr-3 py-2.5 text-sm border rounded-xl transition-all focus:outline-none border-gray-200 bg-white text-gray-900 focus:border-[#1e2d6b] focus:ring-2 focus:ring-[#1e2d6b]/10 disabled:border-gray-100 disabled:bg-gray-50 disabled:text-gray-700 disabled:cursor-not-allowed"
                                placeholder="john@example.com"
                            />
                        </div>
                    </Field>

                    {/* Phone */}
                    <Field id="phoneNumber" label="Phone Number" required>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10">
                                <Phone size={16} />
                            </span>
                            <input
                                id="phoneNumber"
                                type="text"
                                readOnly={!isEditing}
                                disabled={!isEditing}
                                value={formData.phoneNumber}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setFormData(prev => ({ ...prev, phoneNumber: value }));
                                }}
                                className="w-full pl-9 pr-3 py-2.5 text-sm border rounded-xl transition-all focus:outline-none border-gray-200 bg-white text-gray-900 focus:border-[#1e2d6b] focus:ring-2 focus:ring-[#1e2d6b]/10 disabled:border-gray-100 disabled:bg-gray-50 disabled:text-gray-700 disabled:cursor-not-allowed"
                                placeholder="+1 (555) 0000"
                            />
                        </div>
                    </Field>

                    {/* Password - Only show when editing */}
                    {isEditing && (
                        <Field id="password" label="New Password">
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10">
                                    <Lock size={16} />
                                </span>
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={formData.password}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setFormData(prev => ({ ...prev, password: value }));
                                    }}
                                    className="w-full pl-9 pr-10 py-2.5 text-sm border border-gray-200 rounded-xl bg-white text-gray-900 focus:border-[#1e2d6b] focus:ring-2 focus:ring-[#1e2d6b]/10 focus:outline-none transition-all"
                                    placeholder="Leave blank to keep current"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(v => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none z-10"
                                >
                                    {showPassword ? <Eye size={16} /> : <EyeOff size={16} />}
                                </button>
                            </div>
                            <p className="mt-1.5 text-[10px] sm:text-xs text-gray-400">
                                Optional — only fill if you want to change your password.
                            </p>
                        </Field>
                    )}

                    {/* Footer - Only show when editing */}
                    {isEditing && (
                        <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 bg-gray-50 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2">
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl text-sm font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-all duration-200 active:scale-[0.98]"
                            >
                                <X size={16} />
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                                style={{ backgroundColor: BRAND, boxShadow: "0 4px 12px rgba(30,45,107,0.25)" }}
                            >
                                <Save size={16} />
                                {isLoading ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

export default ProfilePage;