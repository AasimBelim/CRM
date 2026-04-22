import { ChevronDown, CircleGauge, Settings2, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

const AdminNav = () => {

    const location = useLocation();
    const [isUsersOpen, setIsUsersOpen] = useState<boolean>(false);
    const UsersToggle = () => setIsUsersOpen(!isUsersOpen);
    const [currentNavItem, setCurrentNavItem] = useState<string | null>(null);

    useEffect(() => {
        setIsUsersOpen(false);
        const path = location.pathname;
        switch (path) {
            case "/admin":
                setCurrentNavItem("dashboard");
                break;

            case "/admin/users":
                setIsUsersOpen(true);
                setCurrentNavItem("users-view-all");
                break;

            case "/admin/users/add":
                setIsUsersOpen(true);
                setCurrentNavItem("users-add-new");
                break;

            case "/admin/profile":
                setIsUsersOpen(true);
                setCurrentNavItem("users-profile");
                break;

            default:
                setCurrentNavItem(null);
                break;
        }
    }, [location]);

    return (
        <div className="nav">
            <Link to="/admin" className={`nav-link ${currentNavItem === "dashboard" ? "active" : ""}`}>
                <div className="sb-nav-link-icon"><CircleGauge size={18} /></div>
                Dashboard
            </Link>

            <a
                href="#"
                data-bs-toggle="collapse"
                data-bs-target="#collapseUsers"
                className={`nav-link ${isUsersOpen ? '' : 'collapsed'}`}
                aria-expanded={isUsersOpen} aria-controls="collapseUsers"
                onClick={(e) => { e.preventDefault(); UsersToggle(); }}
            >
                <div className={`sb-nav-link-icon ${currentNavItem && currentNavItem.startsWith("/admin/users") ? "active" : ""}`}><Users size={18} /></div>
                Users
                <div className="sb-sidenav-collapse-arrow"><ChevronDown /></div>
            </a>
            <div className={`collapse ${isUsersOpen ? 'show' : ''}`} id="collapseUsers" aria-labelledby="headingOne" data-bs-parent="#sidenavAccordion">
                <nav className="sb-sidenav-menu-nested nav">
                    <Link to="/admin/users" className={`nav-link ${currentNavItem === "users-view-all" ? "active" : ""}`}>View All</Link>
                    <Link to="/admin/users/add" className={`nav-link ${currentNavItem === "users-add-new" ? "active" : ""}`}>Add New</Link>
                    <Link to="/admin/profile" className={`nav-link ${currentNavItem === "users-profile" ? "active" : ""}`}>Profile</Link>
                </nav>
            </div>

            <Link to="/admin/settings" className={`nav-link ${currentNavItem === "settings" ? "active" : ""}`}>
                <div className="sb-nav-link-icon"><Settings2 size={18} /></div>
                Settings
            </Link>

        </div>
    );
};
export default AdminNav;