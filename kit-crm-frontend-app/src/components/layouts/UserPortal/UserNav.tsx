import { CircleGauge, CircleStar, CircleUser, LogOut, User } from "lucide-react";
import { Link } from "react-router-dom";
import SignOutModal from "../../SignOutModal";
import { useContext, useState } from "react";
import { UserContext } from "../../../context/UserContext";

const UserNav = () => {

    const userContext = useContext(UserContext);
    const { user } = userContext || {};
    const [isSignOutModalOpen, setSignOutModalOpen] = useState<boolean>(false);

    return <div className="card h-100">
        <ul className="list-group list-group-flush">
            <li className="list-group-item">
                <div className="d-flex gap-2 align-items-center">
                    <CircleUser size={30} />
                    <small>
                        <h6 className="mb-0">{user?.firstName} {user?.lastName}</h6>
                        {user?.email && (
                            <a className="text-decoration-none  text-muted" href={`mailto:${user.email}`}>{user.email}</a>
                        )}
                    </small>
                </div>
            </li>
            <li className="list-group-item">
                <Link to="/user" className="text-decoration-none d-flex align-items-center gap-2">
                    <CircleGauge size={18} />
                    Dashboard
                </Link>
            </li>
            <li className="list-group-item">
                <Link to="/user/listings" className="text-decoration-none d-flex align-items-center gap-2">
                    <CircleStar size={18} />
                    My Listings
                </Link>
            </li>
            <li className="list-group-item">
                <Link to="/user/profile" className="text-decoration-none d-flex align-items-center gap-2">
                    <User size={18} />
                    Profile
                </Link>
            </li>
            <li className="list-group-item">
                <a className="text-decoration-none d-flex align-items-center gap-2" onClick={(e) => { e.preventDefault(); setSignOutModalOpen(true); }} href="#">
                    <LogOut size={18} />
                    Sign Out
                </a>
            </li>
            <li className="list-group-item"></li>
        </ul>
        <SignOutModal isOpen={isSignOutModalOpen} onModalChange={setSignOutModalOpen} />
    </div>;
}
export default UserNav; 