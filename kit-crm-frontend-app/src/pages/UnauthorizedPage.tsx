import { ShieldOff } from "lucide-react";
import { Link } from "react-router-dom";

const UnauthorizedPage = () => {
    return (
        <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
            <div className="text-center">
                <ShieldOff size={64} className="text-danger mb-3" />
                <h2>Access Denied</h2>
                <p className="text-muted">You do not have permission to access this page.</p>
                <Link to="/" className="btn btn-dark">
                    Go to Dashboard
                </Link>
            </div>
        </div>
    );
};

export default UnauthorizedPage;
