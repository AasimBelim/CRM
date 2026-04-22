import { Link, Outlet, useNavigate } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import "../../../assets/css/admin-styles.css";
import { Menu, User } from "lucide-react";
import AdminNav from "./AdminNav";
import { UserContext } from "../../../context/UserContext";
import SignOutModel from "../../SignOutModal";

const AdminLayout = () => {
    const navigate = useNavigate();
    const userContext = useContext(UserContext);
    const { user } = userContext || {};

    const [isSidenavOpen, setIsSidenavOpen] = useState<boolean>(() => {
        const storedState = localStorage.getItem("isSidenavOpen");
        return storedState ? JSON.parse(storedState) : true;
    });
    const [isUsersOpen, setIsUsersOpen] = useState<boolean>(false);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState<boolean>(false);

    const UsersToggle = () => setIsUsersOpen(!isUsersOpen);
    const LogoutToggle = () => setIsLogoutModalOpen(!isLogoutModalOpen);
    const handleSidenavToggle = () => {
        localStorage.setItem("isSidenavOpen", isSidenavOpen ? "false" : "true");
        setIsSidenavOpen(!isSidenavOpen);
    }

    useEffect(() => {
        if (!user?.role || user.role.toLocaleLowerCase() !== 'admin') {
            toast.error("You do not have permission to access this page.");
            navigate('/signin');
            return;
        }
    }, [user]);

    return (
        <div className={`${isSidenavOpen ? '' : 'sb-sidenav-toggled'}`}>
            <nav className="sb-topnav navbar navbar-expand navbar-dark bg-dark">
                <div className="navbar-brand ps-3">
                    <Link to="/admin" className="text-uppercase">Kit CRM</Link>
                </div>

                <button className="btn btn-link btn-sm order-1 order-lg-0 me-4 me-lg-0" id="sidebarToggle" onClick={handleSidenavToggle}><Menu size={18} /></button>
                <div className="d-none d-md-inline-block form-inline ms-auto me-0 me-md-3 my-2 my-md-0"></div>
                <ul className="navbar-nav ms-auto ms-md-0 me-3 me-lg-4">
                    <li className="nav-item dropdown">
                        <a className={`nav-link dropdown-toggle ${isUsersOpen ? 'show' : ''}`} id="navbarDropdown" href="#" role="button" data-bs-toggle="dropdown" aria-expanded={isUsersOpen} onClick={(e) => { e.preventDefault(); UsersToggle(); }}><User size={18} /></a>
                        <ul className={`dropdown-menu dropdown-menu-end ${isUsersOpen ? 'show' : ''}`} aria-labelledby="navbarDropdown" data-bs-popper="static">
                            <li>
                                <Link to="/admin/settings" className="dropdown-item">Settings</Link>
                            </li>
                            <li>
                                <Link to="/admin/profile" className="dropdown-item">Profile</Link>
                            </li>
                            <li><hr className="dropdown-divider" /></li>
                            <li><a className="dropdown-item" href="#!" onClick={(e) => { e.preventDefault(); LogoutToggle(); }}>Sign Out</a></li>
                        </ul>
                    </li>
                </ul>
            </nav>

            <div id="layoutSidenav">
                <div id="layoutSidenav_nav">
                    <nav className="sb-sidenav accordion sb-sidenav-dark" id="sidenavAccordion">
                        <div className="sb-sidenav-menu">
                            <AdminNav />
                        </div>
                        {user && (
                            <div className="sb-sidenav-footer">
                                <div className="small">Logged in as:</div>
                                {(user.firstName || user.lastName) ? `${user.firstName} ${user.lastName}` : `${user.email}`}
                            </div>
                        )}
                    </nav>
                </div>

                <div id="layoutSidenav_content">

                    <main>
                        <div className="container-fluid p-4">
                            <Outlet />
                        </div>
                    </main>

                    <footer className="py-4 bg-light mt-auto">
                        <div className="container-fluid px-4">
                            <div className="d-flex align-items-center justify-content-between small">
                                <div className="text-muted">Copyright &copy; Kit CRM 2026</div>
                            </div>
                        </div>
                    </footer>

                </div>
            </div>

            <SignOutModel isOpen={isLogoutModalOpen} onModalChange={(isOpen) => setIsLogoutModalOpen(isOpen)} />
        </div>
    );
};

export default AdminLayout;
