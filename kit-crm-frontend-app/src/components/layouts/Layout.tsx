import { Outlet } from "react-router-dom";

const Layout = () => {
    return (
        <main className="main d-flex flex-column vh-100">
            <section className="flex-fill">
                <Outlet />
            </section>
        </main>
    );
};

export default Layout;
