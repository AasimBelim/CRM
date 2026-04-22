import { Link, Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Menu, User, X } from "lucide-react";
import SignOutModal from "@/components/SignOutModal";
import AppSidebar from "./AppSidebar";

const AppLayout = () => {
    const { user } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

    // Simple toggle - works for both mobile and desktop
    const toggleSidebar = () => {
        setIsSidebarOpen(prev => !prev);

        // Save state for desktop
        if (window.innerWidth >= 1024) {
            localStorage.setItem("kit_crm_sidebar", JSON.stringify(!isSidebarOpen));
        }
    };

    const closeSidebar = () => {
        setIsSidebarOpen(false);
    };

    // Initialize sidebar state on mount and resize
    useEffect(() => {
        const initSidebar = () => {
            const isDesktop = window.innerWidth >= 1024;

            if (isDesktop) {
                // Desktop: restore from localStorage or default to open
                const stored = localStorage.getItem("kit_crm_sidebar");
                setIsSidebarOpen(stored !== null ? JSON.parse(stored) : true);
            } else {
                // Mobile: always start closed
                setIsSidebarOpen(false);
            }
        };

        initSidebar();
        window.addEventListener("resize", initSidebar);
        return () => window.removeEventListener("resize", initSidebar);
    }, []);

    return (
        <div className="flex h-screen overflow-hidden">
            {/* Sidebar */}
            <AppSidebar
                isOpen={isSidebarOpen}
                onClose={closeSidebar}
                onLogoutClick={() => setIsLogoutModalOpen(true)}
            />

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="bg-white border-b shadow-sm px-4 py-3 flex items-center justify-between flex-shrink-0">
                    {/* Hamburger Button */}
                    <button
                        onClick={toggleSidebar}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        aria-label="Toggle menu"
                    >
                        {isSidebarOpen && window.innerWidth < 1024 ? (
                            <X size={20} className="text-gray-700" />
                        ) : (
                            <Menu size={20} className="text-gray-700" />
                        )}
                    </button>

                    {/* Search - Hidden on mobile */}
                    {/* <div className="hidden md:block flex-1 max-w-md mx-4">
                        <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                            placeholder="Search... (Ctrl+K)"
                            readOnly
                        />
                    </div> */}

                    {/* Right Actions */}
                    <div className="flex items-center gap-2">
                        {/* <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                            <Moon size={18} className="text-gray-700" />
                        </button>
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative">
                            <Bell size={18} className="text-gray-700" />
                            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                        </button> */}
                        <Link to="/profile" >
                            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">

                                <User size={18} className="text-gray-700" />

                            </button>
                        </Link>
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="flex-1 overflow-auto bg-gray-50">
                    <div className="p-4">
                        <Outlet />
                    </div>
                </main>

                {/* Footer */}
                <footer className="py-3 bg-white border-t flex-shrink-0">
                    <div className="px-4">
                        <div className="flex items-center justify-between text-sm text-gray-600">
                            <span>Copyright © KIT CRM {new Date().getFullYear()}</span>
                            {user && (
                                <span className="hidden sm:inline">
                                    Logged in as: {user.firstName || user.email}
                                </span>
                            )}
                        </div>
                    </div>
                </footer>
            </div>

            <SignOutModal isOpen={isLogoutModalOpen} onModalChange={setIsLogoutModalOpen} />
        </div>
    );
};

export default AppLayout;