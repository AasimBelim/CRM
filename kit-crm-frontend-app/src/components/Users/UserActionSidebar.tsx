import UserFormHtml from "./UserFormHtml";
import type { UserActionSidebarProps, UserFormData } from "@/types/Users";
import { toast } from "react-toastify";
import { useEffect, useState } from "react";
import { checkEmailFormat } from "@/utils/helpers";
import { Save, X } from "lucide-react";
import apiCall from "@/utils/axios";

const UserActionSidebar = (props: UserActionSidebarProps) => {
    const { isOpen, onModalChange, action, userId, refreshUsers } = props;

    const isEditMode = action === "edit";
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [userFormData, setUserFormData] = useState<UserFormData>({
        userName: '',
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        phoneNumber: '',
        roleId: 2,
        status: "1"
    });

    useEffect(() => {
        if (isOpen && action === 'edit' && userId) {
            // Fetch user data when editing
            fetchUserById(userId);
        } else if (isOpen && action === 'add') {
            resetUserFormData();
        }
    }, [isOpen, action, userId]);

    const fetchUserById = async (id: number) => {
        try {
            setIsLoading(true);
            const response = await apiCall.get(`/users/${id}`);
            const { status, data } = response.data;

            if (!status || !data) {
                toast.error("Failed to fetch user data");
                onModalChange && onModalChange(false);
                return;
            }

            // Map the API response to form data
            setUserFormData({
                userName: data.userName || '',
                email: data.email || '',
                password: '',
                firstName: data.firstName || '',
                lastName: data.lastName || '',
                phoneNumber: data.phoneNumber || '',
                roleId: data.roleId || 2,
                status: data.isActive ? "1" : "0"
            });
        } catch (error) {
            console.error("Error fetching user:", error);
            toast.error("Failed to load user data");
            onModalChange && onModalChange(false);
        } finally {
            setIsLoading(false);
        }
    };

    const resetUserFormData = () => {
        setUserFormData({
            userName: '',
            email: '',
            password: '',
            firstName: '',
            lastName: '',
            phoneNumber: '',
            roleId: 2,
            status: "1"
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate email
        if (checkEmailFormat(userFormData.email) === false) {
            toast.error("Please enter a valid email address.");
            return;
        }

        // Validate phone number (10-15 digits, optional + prefix)
        const phoneRegex = /^\+?[\d\s\-()]{10,15}$/;
        if (!phoneRegex.test(userFormData.phoneNumber)) {
            toast.error("Please enter a valid phone number.");
            return;
        }

        // Validate required fields
        if (!userFormData.userName.trim()) {
            toast.error("Username is required.");
            return;
        }

        if (!isEditMode && !userFormData.password.trim()) {
            toast.error("Password is required.");
            return;
        }

        // Validate password length (minimum 6 characters)
        if (userFormData.password && userFormData.password.length < 6) {
            toast.error("Password must be at least 6 characters long.");
            return;
        }

        if (!userFormData.roleId) {
            toast.error("Please select a role.");
            return;
        }

        try {
            setIsLoading(true);

            if (isEditMode && userId) {
                const payload: any = {};
                if (userFormData.email) payload.email = userFormData.email;
                if (userFormData.password) payload.password = userFormData.password;
                if (userFormData.firstName) payload.first_name = userFormData.firstName;
                if (userFormData.lastName) payload.last_name = userFormData.lastName;
                if (userFormData.phoneNumber) payload.phone_number = userFormData.phoneNumber;
                if (userFormData.roleId) payload.role_id = userFormData.roleId;
                if (userFormData.status) payload.status = userFormData.status === "1" || userFormData.status === "active" ? true : false;

                if (Object.keys(payload).length === 0) {
                    toast.info("No changes made to update.");
                    return;
                }

                const response = await apiCall.put(`/users/${userId}`, payload);
                const { status } = response.data;

                if (!status) {
                    toast.error("Failed to edit user. Please try again later.");
                    return;
                }

                toast.success("User updated successfully.");
            } else {
                const payload = {
                    user_name: userFormData.userName,
                    email: userFormData.email,
                    password: userFormData.password,
                    first_name: userFormData.firstName,
                    last_name: userFormData.lastName,
                    phone_number: userFormData.phoneNumber,
                    role_id: userFormData.roleId,
                    status: userFormData.status === "1" || userFormData.status === "active" ? true : false
                };

                const response = await apiCall.post("/users", payload);
                const { status } = response.data;

                if (!status) {
                    toast.error("Failed to add new user. Please try again later.");
                    return;
                }

                toast.success("User created successfully.");
            }

            onModalChange && onModalChange(false);
            refreshUsers && refreshUsers();
            resetUserFormData();
        } catch (error) {
            console.error("Error saving user:", error);
            toast.error(`Failed to ${isEditMode ? "update" : "create"} user. Please try again later.`);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 z-40 transition-opacity"
                onClick={() => onModalChange && onModalChange(false)}
            />

            {/* Slider - Responsive Width */}
            <div className="fixed right-0 top-0 h-full w-full sm:w-[500px] md:w-[600px] bg-white shadow-2xl z-50 overflow-hidden flex flex-col">
                {/* Loading Overlay */}
                {isLoading && (
                    <div className="absolute inset-0 bg-white/80 z-50 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-12 h-12 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin"></div>
                            <p className="text-sm text-gray-600">Loading...</p>
                        </div>
                    </div>
                )}

                {/* Header - Responsive Padding */}
                <div className="px-4 sm:px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50 flex-shrink-0">
                    <div className="min-w-0">
                        <h2 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                            {isEditMode ? "Edit User" : "New User"}
                        </h2>
                        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                            {isEditMode ? "Update user information" : "Add a new user"}
                        </p>
                    </div>
                    <button
                        onClick={() => onModalChange && onModalChange(false)}
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors flex-shrink-0"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form - Scrollable */}
                <div className="flex-1 overflow-y-auto">
                    <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                        <UserFormHtml
                            userData={userFormData}
                            setUserData={setUserFormData}
                            action={action}
                        />
                    </form>
                </div>

                {/* Footer - Sticky and Responsive */}
                <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-2 sm:gap-3 flex-shrink-0">
                    <button
                        type="button"
                        onClick={() => onModalChange && onModalChange(false)}
                        className="px-3 sm:px-4 py-2 border border-gray-200 rounded-lg text-gray-700 font-medium text-xs sm:text-sm hover:bg-gray-100 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="px-3 sm:px-4 py-2 bg-[#1e2d6b] text-white rounded-lg font-medium text-xs sm:text-sm hover:bg-[#172252] transition-colors flex items-center gap-1.5 xs:gap-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#24357a"}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#1e2d6b"}
                    >
                        <Save size={16} />
                        {isLoading ? "Saving..." : isEditMode ? "Update" : "Create"}
                    </button>
                </div>
            </div>
        </>
    );
};

export default UserActionSidebar;