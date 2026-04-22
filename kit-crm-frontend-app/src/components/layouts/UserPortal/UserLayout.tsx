import { Outlet } from "react-router-dom";
import UserNav from "./UserNav";

const UserLayout = () => {
    return (
        <main className="main user-portal d-flex flex-column vh-100">
            <section className="flex-fill py-4">
                <div className="container h-100">
                    <div className="row h-100">
                        <div className="col-md-3">
                            <UserNav />
                        </div>
                        <div className="col-md-9">
                            <Outlet />
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
};

export default UserLayout;
