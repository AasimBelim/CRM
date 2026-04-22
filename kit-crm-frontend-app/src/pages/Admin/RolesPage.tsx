import { useState, useEffect } from "react";
import { Shield, Search, Hash } from "lucide-react";
import { toast } from "react-toastify";
import roleService from "@/services/roleService";
import type { Role } from "@/types/Roles";

const getAvatarColor = (name: string) => {
    const colors = [
        "bg-indigo-500",
        "bg-purple-500",
        "bg-blue-500",
        "bg-emerald-500",
        "bg-amber-500",
        "bg-rose-500",
        "bg-pink-500",
        "bg-teal-500",
    ];
    return colors[name.charCodeAt(0) % colors.length];
};

const getInitials = (name: string) =>
    name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

const RolesPage = () => {
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");

    useEffect(() => {
        fetchRoles();
    }, []);

    const fetchRoles = async () => {
        try {
            setLoading(true);
            const response = await roleService.getRoles();
            if (response.status && Array.isArray(response.data)) {
                setRoles(response.data as Role[]);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to fetch roles");
        } finally {
            setLoading(false);
        }
    };

    const filteredRoles = roles.filter((r) =>
        r.roleName.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-3 sm:space-y-4 mt-[-15px]">

            {/* ── Page Header ── */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                        <Shield size={18} className="text-indigo-600 sm:hidden" />
                        <Shield size={22} className="text-indigo-600 hidden sm:block" />
                    </div>
                    <div>
                        <h1 className="text-base sm:text-xl font-bold text-gray-900 leading-tight">Roles</h1>
                        <p className="text-[11px] sm:text-sm text-gray-500">Manage user roles</p>
                    </div>
                </div>

                {!loading && roles.length > 0 && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-50 rounded-lg">
                        <Shield size={13} className="text-indigo-600" />
                        <span className="text-xs font-semibold text-indigo-700">
                            {roles.length} {roles.length === 1 ? "Role" : "Roles"}
                        </span>
                    </div>
                )}
            </div>

            {/* ── Search ── */}
            <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search roles..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-8 pr-4 py-2 sm:py-2.5 border border-gray-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50"
                />
            </div>

            {/* ── Roles table card ── */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                {loading ? (
                    <div className="divide-y divide-gray-100">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="px-4 sm:px-6 py-3 flex items-center gap-3 animate-pulse">
                                <div className="w-8 h-8 rounded-lg bg-gray-200 flex-shrink-0" />
                                <div className="flex-1 space-y-1.5">
                                    <div className="h-3 bg-gray-200 rounded w-28" />
                                </div>
                                <div className="h-5 w-12 rounded-full bg-gray-100" />
                            </div>
                        ))}
                    </div>
                ) : filteredRoles.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                        <Shield size={36} className="text-gray-200 mb-2" />
                        <p className="text-sm font-medium text-gray-500">
                            {search ? "No roles match your search" : "No roles found"}
                        </p>
                        {search && (
                            <button
                                onClick={() => setSearch("")}
                                className="mt-1.5 text-xs text-indigo-600 hover:underline"
                            >
                                Clear search
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Table header */}
                        <div className="grid grid-cols-12 px-4 sm:px-6 py-2.5 bg-gray-50 border-b border-gray-100">
                            <div className="col-span-3 sm:col-span-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role ID</div>
                            <div className="col-span-9 sm:col-span-10 text-xs font-semibold text-gray-500 uppercase tracking-wider pl-3 sm:pl-4">Role</div>
                        </div>

                        {/* Rows */}
                        <div className="divide-y divide-gray-100">
                            {filteredRoles.map((role) => (
                                <div
                                    key={role.roleId}
                                    className="grid grid-cols-12 items-center px-4 sm:px-6 py-3 sm:py-3.5 hover:bg-gray-50 transition-colors"
                                >
                                    {/* Role ID badge — left */}
                                    <div className="col-span-3 sm:col-span-2">
                                        <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-medium text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                                            <Hash size={9} />
                                            {role.roleId}
                                        </span>
                                    </div>

                                    {/* Role name + avatar — right, slightly indented */}
                                    <div className="col-span-9 sm:col-span-10 flex items-center gap-3 min-w-0 pl-3 sm:pl-4">
                                        <div className={`w-8 h-8 rounded-lg ${getAvatarColor(role.roleName)} flex items-center justify-center flex-shrink-0`}>
                                            <span className="text-white text-xs font-semibold">{getInitials(role.roleName)}</span>
                                        </div>
                                        <span className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                                            {role.roleName}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Footer count */}
                        <div className="px-4 sm:px-6 py-2.5 border-t border-gray-100 bg-gray-50">
                            <p className="text-[11px] text-gray-400">
                                Showing {filteredRoles.length} of {roles.length} roles
                            </p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default RolesPage;