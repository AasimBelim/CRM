import { useState, useEffect } from "react";
import {
  Users as UsersIcon,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Mail,
  Phone,
  Shield,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { toast } from "react-toastify";
import apiCall from "@/utils/axios";
import type { UsersTableViewData } from "@/types/Users";
import type { Role } from "@/types/Roles";
import UserActionSidebar from "@/components/Users/UserActionSidebar";
import { useRef } from "react";


interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

const UsersPage = () => {
  const [users, setUsers] = useState<UsersTableViewData[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const isFirstRender = useRef(true);

  // Sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarAction, setSidebarAction] = useState<"add" | "edit">("add");
  const [editUserId, setEditUserId] = useState<number | null>(null);

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);
  const [deletingUserName, setDeletingUserName] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    role: "",
    status: "",
  });
  const [roles, setRoles] = useState<Role[]>([]);

  const fetchUsers = async (pageNum: number = 1) => {
    try {
      setLoading(true);
      const queryParams: any = { page: pageNum };

      if (filters.role) queryParams.role = filters.role;
      if (filters.status) queryParams.status = filters.status;
      if (filters.search) queryParams.userName = filters.search;

      const response = await apiCall.get("/users", { params: queryParams });
      const { status, userData } = response.data;

      if (!status) {
        toast.error("Failed to fetch users");
        setUsers([]);
        return;
      }

      setUsers(userData || []);

      // Mock pagination - adjust based on your API
      setPagination({
        currentPage: pageNum,
        totalPages: Math.ceil((userData?.length || 0) / 10) || 1,
        totalItems: userData?.length || 0,
        hasNextPage: pageNum < Math.ceil((userData?.length || 0) / 10),
        hasPreviousPage: pageNum > 1,
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to fetch users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await apiCall.get("/roles");
      const { status, data } = response.data;
      if (status && data) {
        setRoles(data);
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
    }
  };

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const timer = setTimeout(() => {
      if (filters.search.length === 0 || filters.search.length >= 3) {
        setCurrentPage(1);
        // fetchUsers(1);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [filters.search]);

  useEffect(() => {
    // 🚫 Do not call API for 1 or 2 letters
    if (filters.search.length > 0 && filters.search.length < 3) return;
    fetchUsers(currentPage);
  }, [currentPage, filters.role, filters.status, filters.search]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (filters.search.length === 0 || filters.search.length >= 3) {
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [filters.search]);

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      role: "",
      status: "",
    });
    setCurrentPage(1);
  };

  const handleDeleteClick = (user: UsersTableViewData) => {
    setDeletingUserId(user.userId);
    setDeletingUserName(user.userName);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingUserId) return;

    try {
      setIsDeleting(true);
      await apiCall.delete(`/users/${deletingUserId}`);
      toast.success("User deleted successfully");
      setShowDeleteModal(false);
      fetchUsers(currentPage);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete user");
    } finally {
      setIsDeleting(false);
      setDeletingUserId(null);
      setDeletingUserName("");
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setDeletingUserId(null);
    setDeletingUserName("");
  };

  const handleAddClick = () => {
    setSidebarAction("add");
    setEditUserId(null);
    setIsSidebarOpen(true);
  };

  const handleEditClick = (userId: number) => {
    setSidebarAction("edit");
    setEditUserId(userId);
    setIsSidebarOpen(true);
  };

  const handleSidebarClose = (saved: boolean = false) => {
    setIsSidebarOpen(false);
    setEditUserId(null);
    if (saved) {
      fetchUsers(currentPage);
    }
  };

  const getRoleBadgeColor = (role: string | null | undefined) => {
    const colors: Record<string, string> = {
      Admin: "bg-purple-100 text-purple-700",
      Manager: "bg-blue-100 text-blue-700",
      "Business Development Executive": "bg-green-100 text-green-700",
      "Data Analyst": "bg-orange-100 text-orange-700",
    };
    return role ? colors[role] || "bg-gray-100 text-gray-700" : "bg-gray-100 text-gray-700";
  };

  return (
    <>
      <div className="space-y-0 p-0">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 xs:gap-3 px-3 sm:px-4 md:px-6 py-2 mt-[-20px]">
          <div className="flex items-center gap-2 xs:gap-3 min-w-0 flex-1">
            <div className="p-2 rounded-lg" style={{ backgroundColor: "#1e2d6b20" }}>
              <UsersIcon style={{ color: "#1e2d6b" }} size={20} />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg xs:text-xl font-bold text-gray-900 truncate">Users</h1>
              <p className="text-xs text-gray-500">Manage user accounts</p>
            </div>
          </div>
          <button
            onClick={handleAddClick}
            className="inline-flex items-center justify-center gap-1.5 px-2.5 xs:px-3.5 py-2 text-white rounded-lg transition-colors text-xs xs:text-sm font-medium whitespace-nowrap flex-shrink-0 shadow-sm hover:shadow-md"
            style={{
              backgroundColor: "#1e2d6b"
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#172252")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#1e2d6b")}          >
            <Plus size={16} />
            <span className="hidden xs:inline">Add User</span>
            <span className="xs:hidden">Add</span>
          </button>
        </div>

        {/* Search & Filters */}
        <div className="bg-white border-b border-gray-200 shadow-sm overflow-hidden px-3 sm:px-4 md:px-6">
          {/* Search Bar */}
          <div className="p-3 border-b border-gray-200">
            <div className="flex gap-2">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input
                  type="text"
                  placeholder="Search by username..."
                  value={filters.search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-xs xs:text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-50"
                />
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-1.5 px-2.5 xs:px-3 py-2 border rounded-lg transition-colors text-xs xs:text-sm whitespace-nowrap flex-shrink-0 ${showFilters ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "border-gray-200 hover:bg-gray-50"
                  }`}
              >
                <Filter size={14} />
              </button>
            </div>

            {/* Filter Panel - 2 Rows */}
            {showFilters && (
              <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                {/* Row 1: Role & Status */}
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={filters.role || ""}
                    onChange={(e) => handleFilterChange("role", e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-xs xs:text-sm focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">All Roles</option>
                    {roles.map((role) => (
                      <option key={role.roleId} value={role.roleName}>
                        {role.roleName}
                      </option>
                    ))}
                  </select>

                  <select
                    value={filters.status || ""}
                    onChange={(e) => handleFilterChange("status", e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-xs xs:text-sm focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                {(filters.role || filters.status) && (
                  <div className="flex items-center gap-2">
                    <button onClick={clearFilters} className="text-xs text-gray-600 hover:text-gray-900 underline">
                      Clear filters
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Users List */}
          <div className="overflow-hidden max-h-[calc(100vh-140px)]">
            {loading ? (
              <div className="p-8 text-center text-gray-500">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-[#1e2d6b] border-t-transparent rounded-full animate-spin" />
                  Loading...
                </div>
              </div>
            ) : users.length === 0 ? (
              <div className="p-8 text-center">
                <UsersIcon size={40} className="mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500 text-sm">No users found</p>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden sm:block overflow-auto max-h-[calc(100vh-140px)]">
                  <table className="w-full text-xs xs:text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 xs:py-3 text-left font-semibold text-gray-600 uppercase w-[200px]">User</th>
                        <th className="px-3 py-2 xs:py-3 text-left font-semibold text-gray-600 uppercase hidden md:table-cell w-[180px]">
                          Email
                        </th>
                        <th className="px-3 py-2 xs:py-3 text-left font-semibold text-gray-600 uppercase hidden lg:table-cell w-[120px]">
                          Phone
                        </th>
                        <th className="px-3 py-2 xs:py-3 text-left font-semibold text-gray-600 uppercase w-[150px]">Role</th>
                        <th className="px-3 py-2 xs:py-3 text-left font-semibold text-gray-600 uppercase w-[100px]">Status</th>
                        <th className="px-3 py-2 xs:py-3 text-center font-semibold text-gray-600 uppercase w-[100px]">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.map((user) => (
                        <tr key={user.userId} className="hover:bg-gray-50 transition-colors">
                          <td className="px-3 py-2 xs:py-3">
                            <div className="flex items-center gap-2 max-w-[200px]">
                              <div className="w-8 h-8 bg-[#1e2d6b] rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-white font-semibold text-xs">
                                  {user.firstName?.substring(0, 1).toUpperCase() || user.userName.substring(0, 1).toUpperCase()}
                                </span>
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-gray-900 truncate text-xs xs:text-sm">
                                  {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.userName}
                                </p>
                                <p className="text-xs text-gray-500 truncate">@{user.userName}</p>
                              </div>
                            </div>
                          </td>
                          <td className="hidden md:table-cell px-3 py-2 xs:py-3">
                            <div className="flex items-center gap-1.5">
                              <Mail size={12} className="text-gray-400" />
                              <span className="text-xs text-gray-600 truncate">{user.email}</span>
                            </div>
                          </td>
                          <td className="hidden lg:table-cell px-3 py-2 xs:py-3">
                            <div className="flex items-center gap-1.5">
                              <Phone size={12} className="text-gray-400" />
                              <span className="text-xs text-gray-600">{user.phoneNumber || "—"}</span>
                            </div>
                          </td>
                          <td className="px-3 py-2 xs:py-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${getRoleBadgeColor(
                                user.roleName
                              )}`}
                            >
                              <Shield size={10} />
                              {user.roleName}
                            </span>
                          </td>
                          <td className="px-3 py-2 xs:py-3">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${user.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                                }`}
                            >
                              {user.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="px-3 py-2 xs:py-3">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleEditClick(user.userId)}
                                className="p-1 xs:p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="Edit"
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(user)}
                                className="p-1 xs:p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Delete"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="sm:hidden space-y-3 p-0 px-3 sm:px-4 md:px-6 overflow-auto max-h-[calc(100vh-140px)]">
                  {users.map((user) => (
                    <div
                      key={user.userId}
                      className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-semibold text-xs">
                              {user.firstName?.substring(0, 1).toUpperCase() || user.userName.substring(0, 1).toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-gray-900 text-sm truncate">
                              {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.userName}
                            </p>
                            <p className="text-xs text-gray-500 truncate">@{user.userName}</p>
                          </div>
                        </div>
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap flex-shrink-0 ${user.isActive ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-700"
                            }`}
                        >
                          {user.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>

                      <div className="text-xs text-gray-600 truncate flex items-center gap-1">
                        <Mail size={12} />
                        <span className="truncate">{user.email}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-1">
                          <Shield size={12} className="text-gray-500 flex-shrink-0" />
                          <span className="text-gray-700 truncate">{user.roleName}</span>
                        </div>
                        {user.phoneNumber && (
                          <div className="flex items-center gap-1">
                            <Phone size={12} className="text-gray-500 flex-shrink-0" />
                            <span className="text-gray-700 truncate">{user.phoneNumber}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 pt-2 border-t border-gray-200">
                        <button
                          onClick={() => handleEditClick(user.userId)}
                          className="flex-1 flex items-center justify-center py-1.5 px-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded text-xs font-medium transition-colors"
                          title="Edit user"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(user)}
                          className="flex-1 flex items-center justify-center py-1.5 px-2 bg-red-50 hover:bg-red-100 text-red-600 rounded text-xs font-medium transition-colors"
                          title="Delete user"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="px-3 xs:px-4 py-3 border-t border-gray-200 flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2 xs:gap-3 text-xs xs:text-sm">
              <p className="text-gray-600">
                Page {pagination.currentPage} of {pagination.totalPages} · {pagination.totalItems} total
              </p>
              <div className="flex items-center justify-center gap-1 flex-wrap">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={!pagination.hasPreviousPage}
                  className="p-1.5 xs:p-2 border border-gray-200 rounded-lg text-xs xs:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  title="Previous page"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="px-1.5 xs:px-3 text-xs xs:text-sm text-gray-700 min-w-[40px] xs:min-w-[50px] text-center">
                  {pagination.currentPage} / {pagination.totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => p + 1)}
                  disabled={!pagination.hasNextPage}
                  className="p-1.5 xs:p-2 border border-gray-200 rounded-lg text-xs xs:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  title="Next page"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle size={24} className="text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete User</h3>
                  <p className="text-sm text-gray-500">This action cannot be undone</p>
                </div>
              </div>

              <p className="text-sm text-gray-700 mb-6">
                Are you sure you want to delete <span className="font-semibold">{deletingUserName}</span>? All associated data will be permanently removed.
              </p>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleDeleteCancel}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <UserActionSidebar
        isOpen={isSidebarOpen}
        action={sidebarAction}
        onModalChange={handleSidebarClose}
        refreshUsers={() => fetchUsers(currentPage)}
        userData={null}
        userId={editUserId}
      />
    </>
  );
};

export default UsersPage;