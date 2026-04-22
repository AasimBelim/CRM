import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  X,
  MapPin,
  Briefcase,
  Globe,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { toast } from "react-toastify";
import companyService from "@/services/companyService";
import type { CompanyResponse, CompanyQueryParams } from "@/types/company.types";
import type { PaginationMeta } from "@/types/common.types";
import CompanyFormSlider from "./CompanyFormSlider";

import { useAuth } from "@/hooks/useAuth";

const CompaniesPage = () => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<CompanyResponse[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const { user } = useAuth();
  const isAdmin = user?.role?.toLowerCase() === "admin";

  // Slider state
  const [isSliderOpen, setIsSliderOpen] = useState(false);
  const [editingCompanyId, setEditingCompanyId] = useState<number | null>(null);

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingCompanyId, setDeletingCompanyId] = useState<number | null>(null);
  const [deletingCompanyName, setDeletingCompanyName] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<CompanyQueryParams>({
    search: "",
    industry: "",
    companySize: "",
    country: "",
    isActive: undefined,
    sortBy: "createdAt",
    sortOrder: "desc",
    createdBy: undefined,
  });
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const fetchCompanies = async (pageNum: number = 1, filterObj?: CompanyQueryParams) => {
    try {
      setLoading(true);
      const filtersToUse = filterObj || filters;
      const userId = (user as any)?.id || (user as any)?.userId;

      const params: any = {
        ...filtersToUse,
      };

      // role logic
      if (!isAdmin && userId) {
        params.createdBy = userId;
        params.assignedTo = userId;
      }

      // ✅ ADD PAGE AT LAST
      params.page = pageNum;

      // ❌ Remove unwanted fields
      if (!params.search) delete params.search;
      if (!params.industry) delete params.industry;
      if (!params.companySize) delete params.companySize;
      if (!params.country) delete params.country;
      if (params.isActive === undefined) delete params.isActive;

      const response = await companyService.getCompanies(params);
      setCompanies(response.data);

      const backendPagination = response.pagination as unknown as {
        page: number;
        total: number;
        totalPages: number;
      };

      setPagination({
        currentPage: backendPagination.page,
        totalPages: backendPagination.totalPages,
        totalItems: backendPagination.total,
        hasNextPage: backendPagination.page < backendPagination.totalPages,
        hasPreviousPage: backendPagination.page > 1,
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to fetch companies");
    } finally {
      setLoading(false);
    }
  };

  // Fetch companies when page or filters change (excluding search and country which are debounced)
  useEffect(() => {
    fetchCompanies(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, filters.industry, filters.companySize, filters.isActive]);

  // Debounced search
  useEffect(() => {
    if (!filters.search) return; // Skip if empty/undefined

    const timer = setTimeout(() => {
      if (filters.search.length >= 3) {
        setCurrentPage(1);
        fetchCompanies(1, filters);
      }
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.search]);

  // Debounced country filter
  useEffect(() => {
    if (!filters.country) return; // Skip if empty/undefined

    const timer = setTimeout(() => {
      if (filters.country && filters.country.length >= 3) {
        setCurrentPage(1);
        fetchCompanies(1, filters);
      }
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.country]);

  const handleSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));

    // If search is cleared, immediately fetch all companies
    if (value === "") {
      setCurrentPage(1);
      fetchCompanies(1, { ...filters, search: "" });
    }
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      industry: "",
      companySize: "",
      country: "",
      isActive: undefined,
      sortBy: "createdAt",
      sortOrder: "desc",
    });
    setActiveFilters([]);
    setCurrentPage(1);
  };

  const handleDeleteClick = (company: CompanyResponse) => {
    setDeletingCompanyId(company.id);
    setDeletingCompanyName(company.name);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingCompanyId) return;

    try {
      setIsDeleting(true);
      await companyService.deleteCompany(deletingCompanyId);
      toast.success("Company deleted successfully");
      setShowDeleteModal(false);
      fetchCompanies(currentPage);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete company");
    } finally {
      setIsDeleting(false);
      setDeletingCompanyId(null);
      setDeletingCompanyName("");
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setDeletingCompanyId(null);
    setDeletingCompanyName("");
  };

  const handleAddClick = () => {
    setEditingCompanyId(null);
    setIsSliderOpen(true);
  };

  const handleEditClick = (id: number) => {
    setEditingCompanyId(id);
    setIsSliderOpen(true);
  };

  const handleSliderClose = (saved: boolean = false) => {
    setIsSliderOpen(false);
    setEditingCompanyId(null);
    if (saved) {
      fetchCompanies(currentPage);
    }
  };

  const getIndustryBadgeColor = (industry: string | null | undefined) => {
    const colors: Record<string, string> = {
      Technology: "bg-blue-100 text-blue-700",
      Finance: "bg-green-100 text-green-700",
      Healthcare: "bg-red-100 text-red-700",
      Manufacturing: "bg-purple-100 text-purple-700",
      Retail: "bg-orange-100 text-orange-700",
      Education: "bg-indigo-100 text-indigo-700",
    };
    return industry ? colors[industry] || "bg-gray-100 text-gray-700" : "bg-gray-100 text-gray-700";
  };

  return (
    <>
      <div className="space-y-0 p-0">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 xs:gap-3 px-3 sm:px-4 md:px-6 py-2 mt-[-20px]">
          <div className="flex items-center gap-2 xs:gap-3 min-w-0 flex-1">
            <div
              className="p-2 rounded-lg flex-shrink-0"
              style={{
                backgroundColor: "#1e2d6b",
                boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)",
              }}
            >
              <Building2 className="text-white" size={20} />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg xs:text-xl font-bold text-gray-900 truncate">Companies</h1>
              <p className="text-xs text-gray-500">Manage database</p>
            </div>
          </div>
          <button
            onClick={handleAddClick}
            className="inline-flex items-center justify-center gap-1.5 px-2.5 xs:px-3.5 py-2 text-white rounded-lg transition-colors text-xs xs:text-sm font-medium whitespace-nowrap flex-shrink-0 shadow-sm hover:shadow-md"
            style={{
              backgroundColor: "#1e2d6b",
              boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)"
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#16245a")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#1e2d6b")}
          >
            <Plus size={16} />
            <span className="hidden xs:inline">Add</span>
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
                  placeholder="Search..."
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
                {activeFilters.length > 0 && (
                  <span className="px-1 py-0.5 bg-indigo-600 text-white text-xs rounded-full">
                    {activeFilters.length}
                  </span>
                )}
              </button>
            </div>

            {/* Filter Panel - 2 Rows */}
            {showFilters && (
              <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                {/* Row 1: Industry & Size */}
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={filters.industry || ""}
                    onChange={(e) => handleFilterChange("industry", e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-xs xs:text-sm focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">All Industries</option>
                    <option value="Technology">Technology</option>
                    <option value="Finance">Finance</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Manufacturing">Manufacturing</option>
                    <option value="Retail">Retail</option>
                    <option value="Education">Education</option>
                    <option value="Real Estate">Real Estate</option>
                    <option value="Transportation">Transportation</option>
                    <option value="Energy">Energy</option>
                    <option value="Telecommunications">Telecommunications</option>
                  </select>

                  <select
                    value={filters.companySize || ""}
                    onChange={(e) => handleFilterChange("companySize", e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-xs xs:text-sm focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">All Sizes</option>
                    <option value="1-10">1-10</option>
                    <option value="11-50">11-50</option>
                    <option value="51-200">51-200</option>
                    <option value="201-500">201-500</option>
                    <option value="501-1000">501-1000</option>
                    <option value="1000+">1000+</option>
                  </select>
                </div>

                {/* Row 2: Country & Status */}
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Country"
                    value={filters.country || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFilters((prev) => ({ ...prev, country: value }));

                      // If country is cleared, immediately fetch all companies
                      if (value === "") {
                        setCurrentPage(1);
                        fetchCompanies(1, { ...filters, country: "" });
                      }
                    }}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-xs xs:text-sm focus:outline-none focus:border-indigo-500"
                  />

                  <select
                    value={filters.isActive === undefined ? "" : filters.isActive.toString()}
                    onChange={(e) =>
                      handleFilterChange("isActive", e.target.value === "" ? undefined : e.target.value === "true")
                    }
                    className="px-3 py-2 border border-gray-200 rounded-lg text-xs xs:text-sm focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">All Status</option>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>

                {activeFilters.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="text-xs text-gray-600">Active:</span>
                    {activeFilters.map((filter) => (
                      <span
                        key={filter}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-xs"
                      >
                        {filter}
                        <button onClick={() => handleFilterChange(filter, "")} className="hover:bg-indigo-100 rounded-full">
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                    <button onClick={clearFilters} className="text-xs text-gray-600 hover:text-gray-900 underline">
                      Clear all
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Companies List */}
          <div className="overflow-hidden max-h-[calc(100vh-140px)]">
            {loading ? (
              <div className="p-8 text-center text-gray-500">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  Loading...
                </div>
              </div>
            ) : companies.length === 0 ? (
              <div className="p-8 text-center">
                <Building2 size={40} className="mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500 text-sm">No companies found</p>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden sm:block overflow-auto max-h-[calc(100vh-140px)]">
                  <table className="w-full text-xs xs:text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 xs:py-3 text-left font-semibold text-gray-600 uppercase">Company</th>
                        <th className="px-3 py-2 xs:py-3 text-left font-semibold text-gray-600 uppercase hidden md:table-cell">
                          Industry
                        </th>
                        <th className="px-3 py-2 xs:py-3 text-left font-semibold text-gray-600 uppercase hidden lg:table-cell">
                          Location
                        </th>
                        <th className="px-3 py-2 xs:py-3 text-left font-semibold text-gray-600 uppercase hidden xl:table-cell">
                          Created By
                        </th>
                        <th className="px-3 py-2 xs:py-3 text-left font-semibold text-gray-600 uppercase">Status</th>
                        <th className="px-3 py-2 xs:py-3 text-center font-semibold text-gray-600 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {companies.map((company) => (
                        <tr key={company.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-3 py-2 xs:py-3">
                            <div className="flex items-center gap-2 max-w-[200px]">
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                style={{
                                  backgroundColor: "#1e2d6b",
                                  boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)"
                                }}>                                <span className="text-white font-semibold text-xs">
                                  {company.name.substring(0, 2).toUpperCase()}
                                </span>
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-gray-900 truncate text-xs xs:text-sm">{company.name}</p>
                                {company.website && (
                                  <a
                                    href={company.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-indigo-600 hover:text-indigo-700 truncate block"
                                  >
                                    <Globe size={9} className="inline mr-0.5" />
                                    {company.domain || company.website}
                                  </a>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2 xs:py-3 hidden md:table-cell">
                            {company.industry && (
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${getIndustryBadgeColor(
                                  company.industry
                                )}`}
                              >
                                <Briefcase size={10} />
                                {company.industry}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 xs:py-3 hidden lg:table-cell">
                            {(company.city || company.country) && (
                              <div className="flex items-center gap-1 text-xs text-gray-600">
                                <MapPin size={12} className="flex-shrink-0" />
                                <span className="truncate">{[company.city, company.country].filter(Boolean).join(", ")}</span>
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-2 xs:py-3 hidden xl:table-cell">
                            {company.createdByName && (
                              <div className="flex items-center gap-1.5">
                                <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                                  <span className="text-xs font-medium text-indigo-700">
                                    {company.createdByName.substring(0, 1).toUpperCase()}
                                  </span>
                                </div>
                                <span className="text-xs text-gray-700 truncate">{company.createdByName}</span>
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-2 xs:py-3">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${company.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                                }`}
                            >
                              {company.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="px-3 py-2 xs:py-3">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => navigate(`/companies/${company.id}`)}
                                className="p-1 xs:p-1.5 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                title="View"
                              >
                                <Eye size={14} />
                              </button>
                              <button
                                onClick={() => handleEditClick(company.id)}
                                className="p-1 xs:p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="Edit"
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(company)}
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
                  {companies.map((company) => (
                    <div
                      key={company.id}
                      className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{
                              backgroundColor: "#1e2d6b",
                              boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)"
                            }}>                            <span className="text-white font-semibold text-xs">
                              {company.name.substring(0, 2).toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-gray-900 text-sm truncate">{company.name}</p>
                          </div>
                        </div>
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap flex-shrink-0 ${company.isActive ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-700"
                            }`}
                        >
                          {company.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>

                      {company.website && (
                        <div className="text-xs text-indigo-600 truncate flex items-center gap-1">
                          <Globe size={12} />
                          <a href={company.website} target="_blank" rel="noopener noreferrer" className="truncate hover:underline">
                            {company.domain || company.website}
                          </a>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {company.industry && (
                          <div className="flex items-center gap-1">
                            <Briefcase size={12} className="text-gray-500 flex-shrink-0" />
                            <span className="text-gray-700 truncate">{company.industry}</span>
                          </div>
                        )}
                        {(company.city || company.country) && (
                          <div className="flex items-center gap-1">
                            <MapPin size={12} className="text-gray-500 flex-shrink-0" />
                            <span className="text-gray-700 truncate">{[company.city, company.country].filter(Boolean).join(", ")}</span>
                          </div>
                        )}
                      </div>

                      {company.createdByName && (
                        <div className="text-xs text-gray-600 flex items-center gap-1.5 pt-1 border-t border-gray-200">
                          <div className="w-5 h-5 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-medium text-indigo-700">
                              {company.createdByName.substring(0, 1).toUpperCase()}
                            </span>
                          </div>
                          <span className="truncate">by {company.createdByName}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-1.5 pt-2 border-t border-gray-200">
                        <button
                          onClick={() => navigate(`/companies/${company.id}`)}
                          className="flex-1 flex items-center justify-center py-1.5 px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded text-xs font-medium transition-colors"
                          title="View company"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => handleEditClick(company.id)}
                          className="flex-1 flex items-center justify-center py-1.5 px-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded text-xs font-medium transition-colors"
                          title="Edit company"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(company)}
                          className="flex-1 flex items-center justify-center py-1.5 px-2 bg-red-50 hover:bg-red-100 text-red-600 rounded text-xs font-medium transition-colors"
                          title="Delete company"
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
                  <h3 className="text-lg font-semibold text-gray-900">Delete Company</h3>
                  <p className="text-sm text-gray-500">This action cannot be undone</p>
                </div>
              </div>

              <p className="text-sm text-gray-700 mb-6">
                Are you sure you want to delete <span className="font-semibold">{deletingCompanyName}</span>? All associated data will be permanently removed.
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

      <CompanyFormSlider isOpen={isSliderOpen} onClose={handleSliderClose} companyId={editingCompanyId} />
    </>
  );
};

export default CompaniesPage;