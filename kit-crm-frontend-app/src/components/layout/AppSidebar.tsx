import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
    Building2, Users, UserCircle, Target, TrendingUp,
    Handshake, CheckSquare, LayoutDashboard,
    Settings, Shield, LogOut, ChevronDown, X,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import ohrmLogo from "@/assets/icone.png";

interface AppSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    onLogoutClick: () => void;
}

interface NavItem { label: string; path: string; icon: React.ReactNode; roles?: string[]; }
interface NavGroup { label: string; icon?: React.ReactNode; roles?: string[]; items: NavItem[]; }

const crmNavItems: NavItem[] = [
    { label: "Dashboard", path: "/", icon: <LayoutDashboard size={17} /> },
    { label: "Companies", path: "/companies", icon: <Building2 size={17} /> },
    // { label: "Contacts", path: "/contacts", icon: <UserCircle size={17} /> },
    { label: "Leads", path: "/leads", icon: <Target size={17} /> },
    { label: "Opportunities", path: "/opportunities", icon: <TrendingUp size={17} />, roles: ["admin", "business development executive"] },
    { label: "Deals", path: "/deals", icon: <Handshake size={17} />, roles: ["admin", "business development executive"] },
    // { label: "Activities", path: "/activities", icon: <Activity size={17} /> },
    { label: "Tasks", path: "/tasks", icon: <CheckSquare size={17} /> },
];

const adminGroup: NavGroup = {
    label: "Admin",
    icon: <Shield size={17} />,
    roles: ["admin", "manager"],
    items: [
        { label: "Users", path: "/admin/users", icon: <Users size={17} /> },
        // { label: "Roles", path: "/admin/roles", icon: <Shield size={17} /> },
        { label: "Configuration", path: "/admin/config", icon: <Settings size={17} /> },
    ],
};

// Match icon color exactly
const BRAND = "#1a2459";
const BRAND_LIGHT = "#1a2459";
const BRAND_ACTIVE = "#1b2a78";

const NavLink = ({ item, isActive, onClick }: { item: NavItem; isActive: boolean; onClick?: () => void }) => (
    <Link
        to={item.path}
        onClick={onClick}
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl mx-1 text-sm font-medium transition-all duration-150 whitespace-nowrap"
        style={{
            color: isActive ? "#ffffff" : "rgba(255,255,255,0.75)",
            backgroundColor: isActive ? BRAND_ACTIVE : "transparent",
            borderLeft: isActive ? "3px solid #ffffff" : "3px solid transparent",
            boxShadow: isActive ? "inset 0 0 0 1px rgba(255,255,255,0.05)" : "none"
        }}
        onMouseEnter={(e) => {
            if (!isActive) {
                (e.currentTarget as HTMLElement).style.backgroundColor = BRAND_LIGHT;
                (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.85)";
            }
        }}
        onMouseLeave={(e) => {
            if (!isActive) {
                (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.58)";
            }
        }}
    >
        <span style={{ color: isActive ? "white" : "rgba(255,255,255,0.7)" }}>{item.icon}</span>
        <span>{item.label}</span>
    </Link>
);

const SidebarContent = ({
    onClose,
    onLogoutClick,
}: {
    onClose: () => void;
    onLogoutClick: () => void;
}) => {
    const location = useLocation();
    const { user } = useAuth();
    const [isAdminOpen, setIsAdminOpen] = useState(() => location.pathname.startsWith("/admin"));

    const userRole = user?.role?.toLowerCase() || "";
    const canSeeAdmin = adminGroup.roles?.includes(userRole);
    const isActive = (path: string) => path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

    // Only close on mobile
    const handleNavClick = () => {
        if (window.innerWidth < 1024) {
            onClose();
        }
    };

    return (
        <div className="flex flex-col h-full" style={{ backgroundColor: BRAND }}>
            {/* Brand */}
            <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.10)" }}>
                <Link to="/" className="flex items-center gap-2.5" onClick={handleNavClick}>
                    <div className="w-9 h-9 rounded-sm overflow-hidden flex-shrink-0 bg-white flex items-center justify-center p-[2px]">
                        <img src={ohrmLogo} alt="Kit CRM" className="w-full h-full object-contain" />
                    </div>
                    <div>
                        <p className="text-white font-bold text-base leading-tight tracking-wide whitespace-nowrap">KIT CRM</p>
                        <p className="text-white/40 text-xs whitespace-nowrap">Ker Infotech</p>
                    </div>
                </Link>
                <button
                    onClick={onClose}
                    className="lg:hidden p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/50 hover:text-white"
                >
                    <X size={18} />
                </button>
            </div>

            {/* Section label */}
            <div className="px-5 pt-3 pb-1 flex-shrink-0">
                <p className="text-white/30 text-[10px] font-semibold tracking-widest uppercase">Main Menu</p>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto px-3 pb-3" style={{ scrollbarWidth: "none" }}>
                <div className="flex flex-col gap-0.5">
                    {crmNavItems
                        .filter((item) => {
                            if (!item.roles) return true;
                            return item.roles.includes(userRole);
                        })
                        .map((item) => (
                            <NavLink key={item.path} item={item} isActive={isActive(item.path)} onClick={handleNavClick} />
                        ))}

                    {canSeeAdmin && (
                        <div className="mt-3">
                            <p className="text-white/30 text-[10px] font-semibold tracking-widest uppercase px-3 mb-1">
                                Administration
                            </p>
                            <button
                                onClick={() => setIsAdminOpen(v => !v)}
                                className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
                                style={{
                                    color: isActive("/admin") ? "#ffffff" : "rgba(255,255,255,0.58)",
                                    backgroundColor: isActive("/admin") ? BRAND_LIGHT : "transparent",
                                }}
                            >
                                <span className="flex items-center gap-3">
                                    <span style={{ color: "rgba(255,255,255,0.8)" }}>{adminGroup.icon}</span>
                                    <span>{adminGroup.label}</span>
                                </span>
                                <ChevronDown size={14} className="text-white/40 transition-transform duration-200"
                                    style={{ transform: isAdminOpen ? "rotate(180deg)" : "rotate(0deg)" }} />
                            </button>

                            {isAdminOpen && (
                                <div className="mt-0.5 flex flex-col gap-0.5 pl-3">
                                    {adminGroup.items.map((item) => (
                                        <NavLink key={item.path} item={item} isActive={isActive(item.path)} onClick={handleNavClick} />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </nav>

            {/* Bottom */}
            <div className="flex-shrink-0 px-3 py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.10)" }}>
                <div className="flex items-center gap-3 px-3 py-2.5 mb-1 rounded-xl" style={{ backgroundColor: "rgba(0,0,0,0.2)" }}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
                        style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
                        {user?.firstName?.[0]?.toUpperCase() || "U"}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-white text-xs font-semibold truncate">{user?.firstName} {user?.lastName}</p>
                        <p className="text-white/40 text-[10px] truncate capitalize">{user?.role || "User"}</p>
                    </div>
                </div>

                <Link to="/profile" onClick={handleNavClick}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150"
                    style={{ color: isActive("/profile") ? "#ffffff" : "rgba(255,255,255,0.55)" }}
                >
                    <UserCircle size={17} />
                    <span>Profile</span>
                </Link>

                <button
                    onClick={() => {
                        if (window.innerWidth < 1024) {
                            onClose(); // ✅ only mobile
                        }
                        onLogoutClick(); // always logout
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150"
                    style={{ color: "rgba(255,255,255,0.55)" }}
                >
                    <LogOut size={17} />
                    <span>Sign Out</span>
                </button>
            </div>
        </div>
    );
};

const AppSidebar = ({ isOpen, onClose, onLogoutClick }: AppSidebarProps) => {
    const location = useLocation();
    const prevPathRef = useRef(location.pathname);

    // Only close on mobile when route actually changes
    useEffect(() => {
        if (window.innerWidth < 1024 && prevPathRef.current !== location.pathname) {
            console.log('🚀 Route changed, closing sidebar');
            onClose();
        }
        prevPathRef.current = location.pathname;
    }, [location.pathname]); // Removed onClose from dependencies

    return (
        <>
            {/* Desktop Sidebar */}
            <aside
                className="hidden lg:block flex-shrink-0 transition-all duration-300 h-screen sticky top-0"
                style={{
                    width: isOpen ? "256px" : "0px",
                    overflow: "hidden",
                    backgroundColor: BRAND,
                }}
            >
                {isOpen && <SidebarContent onClose={onClose} onLogoutClick={onLogoutClick} />}
            </aside>

            {/* Mobile Sidebar - ALWAYS RENDERS when isOpen is true */}
            {isOpen && (
                <>
                    {console.log('🎨 RENDERING MOBILE SIDEBAR - isOpen:', isOpen)}
                    <div
                        className="lg:hidden fixed inset-0 flex"
                        style={{ zIndex: 99999 }}
                    >
                        {/* Backdrop */}
                        <div
                            className="absolute inset-0 bg-black/50"
                            onClick={() => {
                                console.log('🖱️ BACKDROP CLICKED');
                                onClose();
                            }}
                            style={{ backdropFilter: "blur(4px)" }}
                        />

                        {/* Sidebar Panel */}
                        <div
                            className="relative w-64 h-full shadow-2xl"
                            style={{
                                backgroundColor: BRAND,
                                zIndex: 100000,
                                animation: "slideInLeft 0.3s ease-out"
                            }}
                        >
                            <SidebarContent onClose={onClose} onLogoutClick={onLogoutClick} />
                        </div>
                    </div>
                </>
            )}

            <style>{`
                @keyframes slideInLeft {
                    from {
                        transform: translateX(-100%);
                    }
                    to {
                        transform: translateX(0);
                    }
                }
            `}</style>
        </>
    );
};

export default AppSidebar;