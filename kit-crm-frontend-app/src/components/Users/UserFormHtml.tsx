import { useState } from "react";
import type { UserFormHtmlProps } from "@/types/Users";
import { Eye, EyeOff, User as UserIcon, Mail, Lock, Phone, Shield, CheckCircle } from "lucide-react";
import RoleDropdown from "./RoleDropdown";

const UserFormHtml = (props: UserFormHtmlProps) => {
    const { setUserData, userData, action } = props;

    const [showPassword, setShowPassword] = useState<boolean>(false);
    const toggleShowPassword = () => setShowPassword(!showPassword);

    // Email validation pattern
    // const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    // Phone number validation pattern (supports international formats)
    // const phonePattern = /^[\d\s\-\+\(\)]+$/;

    return (
        <>
            {/* Username */}
            <div>
                <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    <UserIcon size={16} />
                    Username <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    value={userData.userName}
                    onChange={e => setUserData({ ...userData, userName: e.target.value })}
                    placeholder="Enter username"
                    disabled={action === "edit"}
                    readOnly={action === "edit"}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                    required
                />
            </div>

            {/* Email */}
            <div>
                <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    <Mail size={16} />
                    Email <span className="text-red-500">*</span>
                </label>
                <input
                    type="email"
                    value={userData.email}
                    onChange={e => setUserData({ ...userData, email: e.target.value })}
                    placeholder="example@domain.com"
                    pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50"
                    required
                />
            </div>

       

            {/* First Name & Last Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                        First Name
                    </label>
                    <input
                        type="text"
                        value={userData.firstName}
                        onChange={e => setUserData({ ...userData, firstName: e.target.value })}
                        placeholder="Enter first name"
                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50"
                    />
                </div>

                <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                        Last Name
                    </label>
                    <input
                        type="text"
                        value={userData.lastName}
                        onChange={e => setUserData({ ...userData, lastName: e.target.value })}
                        placeholder="Enter last name"
                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50"
                    />
                </div>
            </div>

            {/* Phone Number */}
            <div>
                <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    <Phone size={16} />
                    Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                    type="tel"
                    value={userData.phoneNumber}
                    onChange={e => setUserData({ ...userData, phoneNumber: e.target.value })}
                    placeholder="+1234567890 or 1234567890"
                    pattern="^\+?[\d\s\-()]{10,15}$"
                    title="Phone number should be 10-15 digits (may include +, -, (), spaces)"
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50"
                    required
                />
            </div>

            {/* Role & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                    <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-700 mb-2">
                        <Shield size={16} />
                        Role <span className="text-red-500">*</span>
                    </label>
                    <RoleDropdown
                        value={userData.roleId}
                        onChange={(roleId) => setUserData({ ...userData, roleId })}
                        required
                    />
                </div>

                <div>
                    <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-700 mb-2">
                        <CheckCircle size={16} />
                        Status <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={userData.status}
                        onChange={e => setUserData({ ...userData, status: e.target.value as "1" | "0" })}
                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50"
                        required
                    >
                        <option value="">Select Status</option>
                        <option value="1">Active</option>
                        <option value="0">Inactive</option>
                    </select>
                </div>
            </div>

                 {/* Password */}
            <div>
                <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    <Lock size={16} />
                    Password {action === "add" && <span className="text-red-500">*</span>}
                </label>
                <div className="relative">
                    <input
                        type={showPassword ? "text" : "password"}
                        value={userData.password}
                        onChange={e => setUserData({ ...userData, password: e.target.value })}
                        placeholder={action === "edit" ? "Leave blank to keep current password" : "Enter password (min. 6 characters)"}
                        required={action === "add"}
                        minLength={6}
                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 pr-10 border border-gray-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50"
                    />
                    <button
                        type="button"
                        onClick={toggleShowPassword}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
                {userData.password && userData.password.length < 6 && (
                    <p className="text-xs text-red-500 mt-1">Password must be at least 6 characters</p>
                )}
            </div>
        </>
    );
}

export default UserFormHtml;