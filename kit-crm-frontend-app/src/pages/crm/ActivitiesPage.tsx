import { Activity } from "lucide-react";

const ActivitiesPage = () => {
    return (
        <div>
            <div className="d-flex align-items-center justify-content-between mb-4">
                <div className="d-flex align-items-center gap-2">
                    <Activity size={24} />
                    <h4 className="mb-0">Activities</h4>
                </div>
                <button className="btn btn-dark btn-sm">+ Log Activity</button>
            </div>
            <div className="card">
                <div className="card-body text-center text-muted py-5">
                    <Activity size={48} className="mb-3 opacity-25" />
                    <p>Activity timeline will be implemented in Phase 5.</p>
                </div>
            </div>
        </div>
    );
};

export default ActivitiesPage;
