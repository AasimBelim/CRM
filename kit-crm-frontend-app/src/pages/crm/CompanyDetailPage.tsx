import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    Building2,
    Edit,
    Trash2,
    ArrowLeft,
    Globe,
    MapPin,
    Briefcase,
    Users,
    Calendar,
    User,
    CheckCircle,
    XCircle,
    Star,
    ExternalLink,
    Plus,
    AlertTriangle,
    Search,
} from "lucide-react";
import { toast } from "react-toastify";
import companyService from "@/services/companyService";
import contactService from "@/services/contactService";
import type { CompanyResponse } from "@/types/company.types";
import type { ContactResponse } from "@/types/contact.types";
import CompanyFormSlider from "./CompanyFormSlider";
import ContactFormSlider from "./Contactformslider";

const CompanyDetailPage = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [company, setCompany] = useState<CompanyResponse | null>(null);
    const [contacts, setContacts] = useState<ContactResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [contactsLoading, setContactsLoading] = useState(false);
    const [isCompanySliderOpen, setIsCompanySliderOpen] = useState(false);
    const [isContactSliderOpen, setIsContactSliderOpen] = useState(false);
    const [selectedContactId, setSelectedContactId] = useState<number | undefined>(undefined);
    const [contactSliderMode, setContactSliderMode] = useState<"add" | "edit">("add");
    const [contactSearch, setContactSearch] = useState("");
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteContactModal, setDeleteContactModal] = useState<{ show: boolean; id?: number; name?: string }>({ show: false });
    const [isDeletingContact, setIsDeletingContact] = useState(false);

    useEffect(() => {
        if (id) fetchCompanyData();
    }, [id]);

    const fetchCompanyData = async () => {
        if (!id) return;
        try {
            setLoading(true);
            const response = await companyService.getCompany(parseInt(id));
            setCompany(response.data ?? null);
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to fetch company");
            navigate("/companies");
        } finally {
            setLoading(false);
        }
    };

    const fetchCompanyContacts = async () => {
        if (!id) return;
        try {
            setContactsLoading(true);
            const response = await contactService.getContactsByCompany(parseInt(id));
            setContacts(response.data || []);
        } catch (error: any) {
            console.error("Error fetching contacts:", error);
            setContacts([]);
        } finally {
            setContactsLoading(false);
        }
    };

    useEffect(() => {
        if (company?.id) fetchCompanyContacts();
    }, [company?.id]);

    const filteredContacts = contactSearch.trim()
        ? contacts.filter((c) => {
            const q = contactSearch.toLowerCase();
            return (
                c.name?.toLowerCase().includes(q) ||
                c.email?.toLowerCase().includes(q) ||
                c.phone?.toLowerCase().includes(q) ||
                c.designation?.toLowerCase().includes(q)
            );
        })
        : contacts;

    const handleDeleteClick = () => setShowDeleteModal(true);
    const handleDeleteCancel = () => setShowDeleteModal(false);

    const handleDeleteConfirm = async () => {
        if (!id) return;
        try {
            setIsDeleting(true);
            await companyService.deleteCompany(parseInt(id));
            toast.success("Company deleted successfully");
            navigate("/companies");
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to delete company");
        } finally {
            setIsDeleting(false);
            setShowDeleteModal(false);
        }
    };

    const handleAddContact = () => {
        setContactSliderMode("add");
        setSelectedContactId(undefined);
        setIsContactSliderOpen(true);
    };

    const handleEditContact = (contactId: number) => {
        setContactSliderMode("edit");
        setSelectedContactId(contactId);
        setIsContactSliderOpen(true);
    };

    const handleDeleteContact = (contactId: number, contactName: string) => {
        setDeleteContactModal({ show: true, id: contactId, name: contactName });
    };

    const handleDeleteContactConfirm = async () => {
        if (!deleteContactModal.id) return;
        try {
            setIsDeletingContact(true);
            await contactService.deleteContact(deleteContactModal.id);
            toast.success("Contact deleted successfully");
            fetchCompanyContacts();
            setDeleteContactModal({ show: false });
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to delete contact");
        } finally {
            setIsDeletingContact(false);
        }
    };

    const handleContactSliderClose = (saved: boolean = false) => {
        setIsContactSliderOpen(false);
        setSelectedContactId(undefined);
        if (saved) fetchCompanyContacts();
    };

    const handleCompanySliderClose = (saved: boolean = false) => {
        setIsCompanySliderOpen(false);
        if (saved) fetchCompanyData();
    };

    const getQualityStars = (quality: number | null | undefined) => {
        const stars = quality || 0;
        return Array.from({ length: 5 }, (_, i) => (
            <Star key={i} size={16} className={i < stars ? "text-yellow-400 fill-yellow-400" : "text-gray-300"} />
        ));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-96 px-4">
                <div className="flex items-center gap-2 text-gray-600">
                    <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    Loading company details...
                </div>
            </div>
        );
    }

    if (!company) {
        return (
            <div className="flex flex-col items-center justify-center min-h-96 px-4">
                <Building2 size={64} className="text-gray-300 mb-4" />
                <p className="text-gray-600 text-lg text-center">Company not found</p>
                <button onClick={() => navigate("/companies")} className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium">
                    Back to Companies
                </button>
            </div>
        );
    }

    const renderContactsTable = () => {
        if (contactsLoading) {
            return (
                <div className="p-6 text-center text-gray-500">
                    <div className="inline-flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                        Loading contacts...
                    </div>
                </div>
            );
        }

        if (contacts.length === 0) {
            return (
                <div className="p-6 text-center text-gray-500">
                    <Users size={32} className="mx-auto mb-2 text-gray-300" />
                    <p className="text-xs xs:text-sm">No contacts yet</p>
                    <button onClick={handleAddContact} className="mt-3 text-indigo-600 hover:text-indigo-700 font-medium text-xs xs:text-sm">
                        Add the first contact
                    </button>
                </div>
            );
        }

        if (filteredContacts.length === 0) {
            return (
                <div className="p-6 text-center text-gray-500">
                    <Search size={28} className="mx-auto mb-2 text-gray-300" />
                    <p className="text-xs xs:text-sm">No contacts match &ldquo;{contactSearch}&rdquo;</p>
                    <button onClick={() => setContactSearch("")} className="mt-2 text-indigo-600 hover:text-indigo-700 font-medium text-xs">
                        Clear search
                    </button>
                </div>
            );
        }

        // Desktop table view
        return (
            <>
                {/* Desktop: Table with fixed height */}
                <div className="hidden sm:block overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead className="sticky top-0 z-10 bg-gray-50">
                                <tr className="border-t border-gray-200">
                                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-700 w-1/5">NAME</th>
                                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-700 w-1/3">EMAIL</th>
                                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-700 w-1/5">PHONE</th>
                                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-700 w-1/5">DESIGNATION</th>
                                    <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-700 w-20">ACTIONS</th>
                                </tr>
                            </thead>
                        </table>
                    </div>
                    {/* Scrollable body — max height shows ~3 rows */}
                    <div className="overflow-y-auto max-h-[140px]">
                        <table className="w-full border-collapse">
                            <tbody>
                                {filteredContacts.map((contact) => (
                                    <tr key={contact.id} className="border-t border-gray-200 hover:bg-gray-50 transition-colors">
                                        <td className="px-3 py-2.5 text-xs font-medium text-gray-900 w-1/5">{contact.name}</td>
                                        <td className="px-3 py-2.5 text-xs text-gray-600 w-1/3">
                                            <a href={`mailto:${contact.email}`} className="text-indigo-600 hover:text-indigo-700 break-all">
                                                {contact.email}
                                            </a>
                                        </td>
                                        <td className="px-3 py-2.5 text-xs text-gray-600 w-1/5">
                                            {contact.phone ? (
                                                <a href={`tel:${contact.phone}`} className="text-indigo-600 hover:text-indigo-700">
                                                    {contact.phone}
                                                </a>
                                            ) : (
                                                "-"
                                            )}
                                        </td>
                                        <td className="px-3 py-2.5 text-xs text-gray-600 w-1/5">{contact.designation || "-"}</td>
                                        <td className="px-3 py-2.5 text-center w-20">
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    onClick={() => handleEditContact(contact.id)}
                                                    className="p-1 hover:bg-blue-50 rounded transition-colors text-blue-600 inline-flex"
                                                    title="Edit"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteContact(contact.id, contact.name)}
                                                    className="p-1 hover:bg-red-50 rounded transition-colors text-red-600 inline-flex"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Mobile: Card view */}
                <div className="sm:hidden space-y-3 p-3 max-h-[340px] overflow-y-auto">
                    {filteredContacts.map((contact) => (
                        <div key={contact.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2">
                            {/* Name + Actions */}
                            <div className="flex items-start justify-between gap-2">
                                <p className="font-medium text-gray-900 text-sm leading-tight flex-1">{contact.name}</p>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                    <button
                                        onClick={() => handleEditContact(contact.id)}
                                        className="p-1.5 hover:bg-blue-50 rounded transition-colors text-blue-600 inline-flex"
                                        title="Edit"
                                    >
                                        <Edit size={14} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteContact(contact.id, contact.name)}
                                        className="p-1.5 hover:bg-red-50 rounded transition-colors text-red-600 inline-flex"
                                        title="Delete"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                            {/* Email */}
                            {contact.email && (
                                <a href={`mailto:${contact.email}`} className="text-xs text-indigo-600 hover:text-indigo-700 break-all">
                                    {contact.email}
                                </a>
                            )}
                            {/* Phone + Designation */}
                            <div className="flex gap-3 text-xs text-gray-600">
                                {contact.phone && (
                                    <a href={`tel:${contact.phone}`} className="text-indigo-600 hover:text-indigo-700">
                                        {contact.phone}
                                    </a>
                                )}
                                {contact.designation && <span>{contact.designation}</span>}
                            </div>
                        </div>
                    ))}
                </div>
            </>
        );
    };

    return (
        <>
            <div className="space-y-0 p-0">
                {/* Header */}
                <div className="flex items-center justify-between gap-2 xs:gap-3 px-3 sm:px-4 md:px-6 py-2 mt-[-20px]">
                    <div className="flex items-center gap-2 xs:gap-3 min-w-0 flex-1">
                        <button onClick={() => navigate("/companies")} className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0">
                            <ArrowLeft size={20} />
                        </button>
                        <div className="p-2 bg-indigo-100 rounded-lg flex-shrink-0">
                            <Building2 className="text-indigo-600" size={20} />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-lg xs:text-xl md:text-2xl font-bold text-gray-900 truncate">{company.name}</h1>
                            <p className="text-xs xs:text-sm text-gray-500 mt-0.5">Company Details</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 xs:gap-2 flex-shrink-0">
                        <button
                            onClick={() => setIsCompanySliderOpen(true)}
                            className="inline-flex items-center justify-center gap-1.5 px-2.5 xs:px-3.5 py-2 bg-indigo-50 border border-indigo-200 text-indigo-600 rounded-lg hover:bg-indigo-100 active:bg-indigo-200 transition-colors font-medium text-xs xs:text-sm whitespace-nowrap"
                        >
                            <Edit size={16} />
                            <span className="hidden xs:inline">Edit</span>
                        </button>
                        <button
                            onClick={handleDeleteClick}
                            className="inline-flex items-center justify-center gap-1.5 px-2.5 xs:px-3.5 py-2 bg-red-50 border border-red-200 text-red-600 rounded-lg hover:bg-red-100 active:bg-red-200 transition-colors font-medium text-xs xs:text-sm whitespace-nowrap"
                        >
                            <Trash2 size={16} />
                            <span className="hidden xs:inline">Delete</span>
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 px-3 sm:px-4 md:px-6 py-4">
                    {/* Left Column */}
                    <div className="lg:col-span-2 space-y-4">

                        {/* Company Card */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div
                                className="px-4 xs:px-6 py-6 xs:py-8 text-white relative"
                                style={{
                                    backgroundColor: "#1e2d6b",
                                    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)"
                                }}
                            >                                <span className={`absolute top-3 right-3 xs:top-4 xs:right-4 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${company.isActive
                                ? "bg-green-500/20 text-white border border-green-400/30"
                                : "bg-gray-500/20 text-white border border-gray-400/30"
                                }`}>
                                    {company.isActive ? "Active" : "Inactive"}
                                </span>
                                <div className="flex items-center gap-3 xs:gap-4 min-w-0">
                                    <div className="w-12 xs:w-16 h-12 xs:h-16 bg-white/20 backdrop-blur-sm rounded-lg xs:rounded-xl flex items-center justify-center flex-shrink-0">
                                        <span className="text-lg xs:text-2xl font-bold">{company.name.substring(0, 2).toUpperCase()}</span>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h2 className="text-lg xs:text-2xl font-bold truncate pr-20">{company.name}</h2>
                                        {company.website && (
                                            <a href={company.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-indigo-100 hover:text-white mt-1 text-xs xs:text-sm truncate">
                                                <Globe size={14} />
                                                <span className="truncate">{company.domain || company.website}</span>
                                                <ExternalLink size={12} />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 xs:p-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 xs:gap-6">
                                    <InfoItem icon={<Briefcase size={18} className="text-indigo-600" />} label="Industry" value={company.industry || "Not specified"} />
                                    <InfoItem icon={<Users size={18} className="text-indigo-600" />} label="Company Size" value={company.companySize || "Not specified"} />
                                    <InfoItem icon={<MapPin size={18} className="text-indigo-600" />} label="Location" value={[company.city, company.country].filter(Boolean).join(", ") || "Not specified"} />
                                    <InfoItem icon={<User size={18} className="text-indigo-600" />} label="Assigned To" value={company.assignedToName || "Unassigned"} />
                                </div>
                                {company.address && (
                                    <div className="mt-4 xs:mt-6 pt-4 xs:pt-6 border-t border-gray-200">
                                        <h3 className="text-xs xs:text-sm font-semibold text-gray-700 mb-2">Address</h3>
                                        <p className="text-xs xs:text-sm text-gray-600">{company.address}</p>
                                    </div>
                                )}
                                {company.description && (
                                    <div className="mt-4 xs:mt-6 pt-4 xs:pt-6 border-t border-gray-200">
                                        <h3 className="text-xs xs:text-sm font-semibold text-gray-700 mb-2">Description</h3>
                                        <p className="text-xs xs:text-sm text-gray-600 leading-relaxed">{company.description}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Contacts Card */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            {/* Header: title + search + Add — single row */}
                            <div className="px-3 xs:px-4 sm:px-6 py-3 xs:py-4 border-b border-gray-200 flex items-center gap-2">

                                {/* Title */}
                                <h3 className="text-sm xs:text-lg font-semibold text-gray-900 whitespace-nowrap">
                                    Contacts ({contacts.length})
                                </h3>

                                {/* Search */}
                                {contacts.length > 0 && (
                                    <div className="relative flex-1 min-w-0">
                                        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Search contacts by name, email, phone or designation..."
                                            value={contactSearch}
                                            onChange={(e) => setContactSearch(e.target.value)}
                                            className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50"
                                        />
                                    </div>
                                )}

                                {/* Add Button */}
                                <button
                                    onClick={handleAddContact}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors font-medium text-xs whitespace-nowrap"
                                >
                                    <Plus size={14} />
                                    Add
                                </button>
                            </div>

                            {renderContactsTable()}
                        </div>

                        {/* Activity Timeline */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="px-4 xs:px-6 py-3 xs:py-4 border-b border-gray-200">
                                <h3 className="text-sm xs:text-lg font-semibold text-gray-900">Recent Activity</h3>
                            </div>
                            <div className="p-4 xs:p-6">
                                <div className="space-y-4">
                                    <ActivityItem
                                        icon={<Calendar className="text-blue-600" size={16} />}
                                        title="Company Created"
                                        timestamp={new Date(company.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                                        user={company.createdByName}
                                    />
                                    {company.assignedAt && (
                                        <ActivityItem
                                            icon={<User className="text-green-600" size={16} />}
                                            title="Assigned"
                                            timestamp={new Date(company.assignedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                                            user={company.assignedToName}
                                        />
                                    )}
                                    <ActivityItem
                                        icon={<Calendar className="text-purple-600" size={16} />}
                                        title="Last Updated"
                                        timestamp={new Date(company.updatedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Sidebar */}
                    <div className="space-y-4">
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="px-4 xs:px-6 py-3 xs:py-4 border-b border-gray-200">
                                <h3 className="text-sm xs:text-lg font-semibold text-gray-900">Data Quality</h3>
                            </div>
                            <div className="p-4 xs:p-6">
                                <div className="flex items-center justify-center gap-1 mb-2">{getQualityStars(company.dataQuality)}</div>
                                <p className="text-center text-xs xs:text-sm text-gray-600">{company.dataQuality || 0} out of 5 stars</p>
                            </div>
                        </div>

                        {company.dataSourceName && (
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                <div className="px-4 xs:px-6 py-3 xs:py-4 border-b border-gray-200">
                                    <h3 className="text-sm xs:text-lg font-semibold text-gray-900">Data Source</h3>
                                </div>
                                <div className="p-4 xs:p-6">
                                    <p className="text-gray-900 font-medium text-xs xs:text-sm">{company.dataSourceName}</p>
                                    <p className="text-xs text-gray-500 mt-1">Source ID: {company.dataSourceId}</p>
                                </div>
                            </div>
                        )}

                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="px-4 xs:px-6 py-3 xs:py-4 border-b border-gray-200">
                                <h3 className="text-sm xs:text-lg font-semibold text-gray-900">Verification</h3>
                            </div>
                            <div className="p-4 xs:p-6">
                                {company.verifiedAt ? (
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-green-600">
                                            <CheckCircle size={20} />
                                            <span className="font-medium text-sm">Verified</span>
                                        </div>
                                        <p className="text-xs xs:text-sm text-gray-600">
                                            Verified on {new Date(company.verifiedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-gray-400">
                                        <XCircle size={20} />
                                        <span className="font-medium text-sm">Not Verified</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="px-4 xs:px-6 py-3 xs:py-4 border-b border-gray-200">
                                <h3 className="text-sm xs:text-lg font-semibold text-gray-900">Quick Stats</h3>
                            </div>
                            <div className="p-4 xs:p-6 space-y-3">
                                <StatItem label="Contacts" value={contacts.length.toString()} />
                                <StatItem label="Leads" value="0" />
                                <StatItem label="Deals" value="0" />
                                <StatItem label="Opportunities" value="0" />
                            </div>
                        </div> */}
                    </div>
                </div>
            </div>

            {/* Delete Company Modal */}
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
                                Are you sure you want to delete <span className="font-semibold">{company.name}</span>? All associated data will be permanently removed.
                            </p>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleDeleteCancel}
                                    disabled={isDeleting}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteConfirm}
                                    disabled={isDeleting}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
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

            {/* Delete Contact Modal */}
            {deleteContactModal.show && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                                    <AlertTriangle size={24} className="text-red-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Delete Contact</h3>
                                    <p className="text-sm text-gray-500">This action cannot be undone</p>
                                </div>
                            </div>
                            <p className="text-sm text-gray-700 mb-6">
                                Are you sure you want to delete <span className="font-semibold">{deleteContactModal.name}</span>?
                            </p>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setDeleteContactModal({ show: false })}
                                    disabled={isDeletingContact}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteContactConfirm}
                                    disabled={isDeletingContact}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isDeletingContact ? (
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

            <CompanyFormSlider isOpen={isCompanySliderOpen} onClose={handleCompanySliderClose} companyId={id ? parseInt(id) : null} />

            {isContactSliderOpen && id && (
                <ContactFormSlider
                    mode={contactSliderMode}
                    contactId={contactSliderMode === "edit" ? selectedContactId : undefined}
                    onClose={handleContactSliderClose}
                    companies={company ? [company] : []}
                />
            )}
        </>
    );
};

const InfoItem = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
    <div>
        <div className="flex items-center gap-2 text-xs xs:text-sm text-gray-500 mb-1">{icon}<span>{label}</span></div>
        <p className="text-xs xs:text-sm text-gray-900 font-medium">{value}</p>
    </div>
);

const ActivityItem = ({ icon, title, timestamp, user }: { icon: React.ReactNode; title: string; timestamp: string; user?: string | null }) => (
    <div className="flex gap-2 xs:gap-3">
        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">{icon}</div>
        <div className="flex-1 min-w-0">
            <p className="text-xs xs:text-sm font-medium text-gray-900">{title}</p>
            <p className="text-xs text-gray-500 mt-0.5">{timestamp}</p>
            {user && <p className="text-xs text-gray-600 mt-0.5">by {user}</p>}
        </div>
    </div>
);

// const StatItem = ({ label, value }: { label: string; value: string }) => (
//     <div className="flex items-center justify-between">
//         <span className="text-xs xs:text-sm text-gray-600">{label}</span>
//         <span className="text-sm xs:text-lg font-semibold text-gray-900">{value}</span>
//     </div>
// );

export default CompanyDetailPage;