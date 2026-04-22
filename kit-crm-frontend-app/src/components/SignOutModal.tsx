import { useAuth } from "@/hooks/useAuth";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { AlertCircle, X } from "lucide-react";
import type { SignOutModalProps } from "@/types/General";

const SignOutModel = (SignOutModalProps: SignOutModalProps) => {

    const { isOpen, onModalChange } = SignOutModalProps;
    const navigate = useNavigate();
    const { logOut } = useAuth();
    
    const handleSignout = () => {
        logOut();
        toast.success("Signed out successfully.");
        navigate('/signin');
        onModalChange && onModalChange(false);
    }

    const closeModel = () => {
        onModalChange && onModalChange(false);
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm flex items-center justify-center p-3">
            <div className="bg-white rounded-lg shadow-xl max-w-sm w-full">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                            <AlertCircle size={20} className="text-orange-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Sign Out</h3>
                    </div>
                    <button
                        onClick={closeModel}
                        className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4">
                    <p className="text-gray-600 text-sm">
                        Are you sure you want to sign out? You'll need to log in again to access your account.
                    </p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200">
                    <button
                        onClick={closeModel}
                        className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSignout}
                        className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
                    >
                        Sign Out
                    </button>
                </div>
            </div>
        </div>
    )
}

export default SignOutModel;