import { Route, Routes } from "react-router-dom";

// Layout
import Layout from "./components/layouts/Layout";
import AppLayout from "./components/layout/AppLayout";
import AuthRoute from "./components/AuthRoute";
import "./App.scss";
// IMPORTANT: Comment out Bootstrap - it conflicts with Tailwind
import "bootstrap/dist/css/bootstrap.min.css";

// Public pages
import SignInPage from "./pages/SignInPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";

// CRM pages
import DashboardPage from "./pages/crm/DashboardPage";
import CompaniesPage from "./pages/crm/CompaniesPage";
import CompanyFormPage from "./pages/crm/CompanyFormPage";
import CompanyDetailPage from "./pages/crm/CompanyDetailPage";
// import ContactsPage from "./pages/crm/ContactsPage";
import LeadsPage from "./pages/crm/LeadsPage";
import OpportunitiesPage from "./pages/crm/OpportunitiesPage";
import DealsPage from "./pages/crm/DealsPage";
import ActivitiesPage from "./pages/crm/ActivitiesPage";
import TasksPage from "./pages/crm/TasksPage";
import ProfilePage from "./pages/ProfilePage";

// Admin pages
import UsersPage from "./pages/Admin/UsersPage";
import RolesPage from "./pages/Admin/RolesPage";
import ConfigPage from "./pages/Admin/ConfigPage";
import LeadDetailPage from "./pages/crm/Leaddetailpage";
import OpportunityDetailPage from "./pages/crm/Opportunitydetailpage";
import DealDetailPage from "./pages/crm/Dealdetailpage";
import TaskDetailPage from "./pages/crm/Taskdetailpage";
// import ContactDetailPage from "./pages/crm/Contactdetailpage";

function App() {
    return (
        <Routes>
            {/* Public routes */}
            <Route element={<Layout />}>
                <Route path="/signin" element={<SignInPage />} />
                <Route path="/unauthorized" element={<UnauthorizedPage />} />
            </Route>

            {/* Protected routes - All authenticated users */}
            <Route element={<AuthRoute />}>
                <Route element={<AppLayout />}>
                    <Route index element={<DashboardPage />} />

                    {/* Companies routes - NESTED ROUTES */}
                    <Route path="companies">
                        <Route index element={<CompaniesPage />} />
                        <Route path="new" element={<CompanyFormPage />} />
                        <Route path=":id" element={<CompanyDetailPage />} />
                        <Route path=":id/edit" element={<CompanyFormPage />} />
                    </Route>

                    {/* Other CRM routes */}
                    {/* <Route path="contacts">
     <Route index element={<ContactsPage />} /> 
    <Route path=":id" element={<ContactDetailPage />} />
</Route> */}
                    <Route path="leads" element={<LeadsPage />} />
                    <Route path="leads">
                        <Route index element={<LeadsPage />} />
                        <Route path=":id" element={<LeadDetailPage />} />
                    </Route>
                    <Route path="opportunities" element={<OpportunitiesPage />} />
                    <Route path="/opportunities/:id" element={<OpportunityDetailPage />} />
                    <Route path="deals" element={<DealsPage />} />
                    <Route path="/deals/:id" element={<DealDetailPage />} />
                    <Route path="activities" element={<ActivitiesPage />} />
                    <Route path="tasks" element={<TasksPage />} />
                    <Route path="tasks/:id" element={<TaskDetailPage     />} />
                    <Route path="profile" element={<ProfilePage />} />
                </Route>
            </Route>

            {/* Admin routes */}
            <Route element={<AuthRoute allowedRoles={["admin", "manager"]} />}>
                <Route element={<AppLayout />}>
                    <Route path="admin">
                        <Route path="users" element={<UsersPage />} />
                        <Route path="users/:action" element={<UsersPage />} />
                        <Route path="users/:action/:userId" element={<UsersPage />} />
                        <Route path="roles" element={<RolesPage />} />
                        <Route path="config" element={<ConfigPage />} />
                    </Route>
                </Route>
            </Route>
        </Routes>
    );
}

export default App;