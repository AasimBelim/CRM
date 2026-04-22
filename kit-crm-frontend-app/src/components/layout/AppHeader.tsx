import { Menu, Moon, Sun, Bell, User } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface AppHeaderProps {
    onToggleSidebar: () => void;
    isSidebarOpen: boolean;
}

const AppHeader = ({ onToggleSidebar }: AppHeaderProps) => {
    const { user } = useAuth();
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(() => {
        return document.documentElement.getAttribute("data-bs-theme") === "dark";
    });

    const toggleDarkMode = () => {
        const next = !isDarkMode;
        setIsDarkMode(next);
        document.documentElement.setAttribute("data-bs-theme", next ? "dark" : "light");
        localStorage.setItem("kit_crm_theme", next ? "dark" : "light");
    };

    return (
        <nav className="bg-white border-b shadow-sm px-3 py-2 flex items-center justify-between">
            {/* Left side - Hamburger */}
            <button
                onClick={onToggleSidebar}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Toggle sidebar"
            >
                <Menu size={20} />
            </button>

            {/* Center - Search (hidden on mobile) */}
            <div className="hidden md:block flex-1 max-w-md mx-4">
                <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                    placeholder="Search... (Ctrl+K)"
                    readOnly
                />
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center gap-2">
                {/* Dark Mode Toggle */}
                <button
                    onClick={toggleDarkMode}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    aria-label="Toggle theme"
                >
                    {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                </button>

                {/* Notifications */}
                <button 
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative" 
                    aria-label="Notifications"
                >
                    <Bell size={18} />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>

                {/* User Menu */}
                <div className="relative">
                    <button 
                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                        className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <User size={18} />

                        <span className="hidden md:inline text-sm font-medium">
                            {user?.firstName || user?.email || "User"}
                        </span>
                    </button>

                    {/* Dropdown Menu */}
                    {isUserMenuOpen && (
                        <>
                            <div
                                className="fixed inset-0 z-10"
                                onClick={() => setIsUserMenuOpen(false)}
                            />
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                                <div className="px-4 py-2 border-b border-gray-200">
                                    <p className="font-semibold text-sm">{user?.firstName} {user?.lastName}</p>
                                    <p className="text-xs text-gray-500">{user?.role}</p>
                                </div>
                                <Link
                                    to="/profile"
                                    className="block px-4 py-2 text-sm hover:bg-gray-100"
                                    onClick={() => setIsUserMenuOpen(false)}
                                >
                                    Profile
                                </Link>
                                {(user?.role?.toLowerCase() === "admin" || user?.role?.toLowerCase() === "manager") && (
                                    <Link
                                        to="/admin/config"
                                        className="block px-4 py-2 text-sm hover:bg-gray-100"
                                        onClick={() => setIsUserMenuOpen(false)}
                                    >
                                        Settings
                                    </Link>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default AppHeader;