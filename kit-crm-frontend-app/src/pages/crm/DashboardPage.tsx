import { useAuth } from "@/hooks/useAuth";
import {
    LayoutDashboard,
    TrendingUp,
    Activity,
    Calendar,

} from "lucide-react";

const DashboardPage = () => {
    const { user } = useAuth();
    const activeRole = user?.role;

    const currentHour = new Date().getHours();
    const greeting = currentHour < 12 ? "Good Morning" : currentHour < 18 ? "Good Afternoon" : "Good Evening";

    // Role-based metrics

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className=" rounded-2xl p-6 sm:p-8 text-white shadow-lg" style={{
                backgroundColor: "#1e2d6b",
                boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)"
            }}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                <LayoutDashboard size={28} />
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
                        </div>
                        <p className="text-indigo-100 text-sm sm:text-base">
                            {greeting}, <span className="font-semibold">{user?.firstName || user?.email}</span>!
                        </p>
                        <p className="text-indigo-200 text-xs sm:text-sm mt-1">
                            Welcome to your {activeRole?.toLowerCase()} dashboard
                        </p>
                    </div>

                    <div className="flex items-center gap-2 text-sm bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                        <Calendar size={16} />
                        <span>{new Date().toLocaleDateString('en-US', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                        })}</span>
                    </div>
                </div>
            </div>
            {/* Welcome Message Card */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 sm:p-8">
                <div className="max-w-3xl">
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                        Welcome to Your Dashboard!
                    </h3>
                    <p className="text-gray-600 leading-relaxed mb-4">
                        Your dashboard provides a comprehensive overview of your {activeRole?.toLowerCase()} activities.
                        Here you can monitor key metrics, track performance, and access quick actions to manage your business efficiently.
                    </p>
                    <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium">
                            <Activity size={14} />
                            Real-time Updates
                        </span>
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm font-medium">
                            <TrendingUp size={14} />
                            Performance Metrics
                        </span>
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium">
                            <LayoutDashboard size={14} />
                            Easy Management
                        </span>
                    </div>
                </div>
            </div>







        </div>
    );
};

export default DashboardPage;