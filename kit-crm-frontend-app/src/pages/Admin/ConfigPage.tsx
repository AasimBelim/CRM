import { Settings } from "lucide-react";

const ConfigPage = () => {
    return (
        <div>
            <div className="d-flex align-items-center gap-2 mb-4">
                <Settings size={24} />
                <h4 className="mb-0">Configuration</h4>
            </div>
            <div className="row g-3">
                <div className="col-md-6 col-lg-4">
                    <div className="card h-100">
                        <div className="card-body">
                            <h6>Lead Statuses</h6>
                            <p className="text-muted small mb-0">Customize lead pipeline stages</p>
                        </div>
                    </div>
                </div>
                <div className="col-md-6 col-lg-4">
                    <div className="card h-100">
                        <div className="card-body">
                            <h6>Opportunity Stages</h6>
                            <p className="text-muted small mb-0">Customize opportunity pipeline</p>
                        </div>
                    </div>
                </div>
                <div className="col-md-6 col-lg-4">
                    <div className="card h-100">
                        <div className="card-body">
                            <h6>Activity Types</h6>
                            <p className="text-muted small mb-0">Manage activity type options</p>
                        </div>
                    </div>
                </div>
                <div className="col-md-6 col-lg-4">
                    <div className="card h-100">
                        <div className="card-body">
                            <h6>Lost Reasons</h6>
                            <p className="text-muted small mb-0">Configure deal lost reasons</p>
                        </div>
                    </div>
                </div>
                <div className="col-md-6 col-lg-4">
                    <div className="card h-100">
                        <div className="card-body">
                            <h6>Data Sources</h6>
                            <p className="text-muted small mb-0">Manage company data sources</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfigPage;
