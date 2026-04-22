import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    UserCircle,
    Edit,
    Trash2,
    ArrowLeft,
    Mail,
    Phone,
    Briefcase,
    Building2,
    Calendar,
    CheckCircle,
    XCircle,
    ExternalLink,
    Linkedin,
} from "lucide-react";
import { toast } from "react-toastify";
import contactService from "@/services/contactService";
import companyService from "@/services/companyService";
import type { ContactResponse } from "@/types/contact.types";
import type { Company } from "@/types/company.types";
import ContactFormSlider from "./Contactformslider";


const ContactDetailPage = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [contact, setContact] = useState<ContactResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSliderOpen, setIsSliderOpen] = useState(false);
    const [companies, setCompanies] = useState<Company[]>([]);

    useEffect(() => {
        if (id) {
            fetchContact();
        }
    }, [id]);

    // ✅ Fetch companies on mount
    useEffect(() => {
        const fetchCompanies = async () => {
            try {
                const response = await companyService.getCompanies({ page: 1, limit: 1000, search: "" });
                setCompanies(response.data || []);
            } catch (error) {
                console.error("Error fetching companies:", error);
            }
        };
        fetchCompanies();
    }, []);

    // ✅ Using GET /contacts/:id route only
    const fetchContact = async () => {
        if (!id) return;

        try {
            setLoading(true);
            const response = await contactService.getContact(parseInt(id));
            setContact(response.data ?? null);
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to fetch contact");
            navigate("/contacts");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this contact?")) return;
        if (!id) return;

        try {
            await contactService.deleteContact(parseInt(id));
            toast.success("Contact deleted successfully");
            navigate("/contacts");
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to delete contact");
        }
    };

    const handleEditClick = () => {
        setIsSliderOpen(true);
    };

    const handleSliderClose = (saved: boolean = false) => {
        setIsSliderOpen(false);
        if (saved) {
            fetchContact();
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map(word => word[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const getAvatarColor = (contactId: number) => {
        const colors = [
            "bg-purple-600",
            "bg-blue-600",
            "bg-indigo-600",
            "bg-pink-600",
            "bg-orange-600",
            "bg-green-600",
            "bg-red-600",
            "bg-cyan-600",
        ];
        return colors[contactId % colors.length];
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-96 px-4">
                <div className="flex items-center gap-2 text-gray-600">
                    <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    Loading contact details...
                </div>
            </div>
        );
    }

    if (!contact) {
        return (
            <div className="flex flex-col items-center justify-center min-h-96 px-4">
                <UserCircle size={64} className="text-gray-300 mb-4" />
                <p className="text-gray-600 text-lg text-center">Contact not found</p>
                <button
                    onClick={() => navigate("/contacts")}
                    className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium"
                >
                    Back to Contacts
                </button>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-0 p-0">
                {/* Header */}
                <div className="flex items-center justify-between gap-2 xs:gap-3 px-3 sm:px-4 md:px-6 py-2">
                    <div className="flex items-center gap-2 xs:gap-3 min-w-0 flex-1">
                        <button
                            onClick={() => navigate("/contacts")}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div className={`w-10 h-10 rounded-lg ${getAvatarColor(contact.id)} flex items-center justify-center text-white text-sm font-semibold flex-shrink-0`}>
                            {getInitials(contact.name)}
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-lg xs:text-xl md:text-2xl font-bold text-gray-900 truncate">{contact.name}</h1>
                            <p className="text-xs xs:text-sm text-gray-500 mt-0.5">{contact.designation || "Contact Details"}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 xs:gap-2 flex-shrink-0">
                        <button
                            onClick={handleEditClick}
                            className="inline-flex items-center justify-center gap-1.5 px-2.5 xs:px-3.5 py-2 bg-indigo-50 border border-indigo-200 text-indigo-600 rounded-lg hover:bg-indigo-100 active:bg-indigo-200 transition-colors font-medium text-xs xs:text-sm whitespace-nowrap"
                            title="Edit contact"
                        >
                            <Edit size={16} />
                            <span className="hidden xs:inline">Edit</span>
                        </button>
                        <button
                            onClick={handleDelete}
                            className="inline-flex items-center justify-center gap-1.5 px-2.5 xs:px-3.5 py-2 bg-red-50 border border-red-200 text-red-600 rounded-lg hover:bg-red-100 active:bg-red-200 transition-colors font-medium text-xs xs:text-sm whitespace-nowrap"
                            title="Delete contact"
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
                        {/* Contact Card */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            {/* Header Section */}
                            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-4 xs:px-6 py-6 xs:py-8 text-white">
                                <div className="flex flex-col xs:flex-row xs:items-start xs:justify-between gap-4">
                                    <div className="flex items-center gap-3 xs:gap-4 min-w-0">
                                        <div className={`w-12 xs:w-16 h-12 xs:h-16 ${getAvatarColor(contact.id)} rounded-lg xs:rounded-xl flex items-center justify-center flex-shrink-0 text-lg xs:text-2xl font-bold`}>
                                            {getInitials(contact.name)}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h2 className="text-lg xs:text-2xl font-bold truncate">{contact.name}</h2>
                                            {contact.designation && (
                                                <p className="text-indigo-100 text-xs xs:text-sm mt-1 truncate">
                                                    {contact.designation}
                                                </p>
                                            )}
                                            {contact.companyName && (
                                                <div className="flex items-center gap-1 text-indigo-100 mt-1 text-xs xs:text-sm truncate">
                                                    <Building2 size={14} />
                                                    <span className="truncate">{contact.companyName}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <span
                                        className={`px-3 py-1 rounded-full text-xs xs:text-sm font-medium whitespace-nowrap flex-shrink-0 ${
                                            contact.isActive
                                                ? "bg-green-500/20 text-white"
                                                : "bg-gray-500/20 text-white"
                                        }`}
                                    >
                                        {contact.isActive ? "Active" : "Inactive"}
                                    </span>
                                </div>
                            </div>

                            {/* Contact Info */}
                            <div className="p-4 xs:p-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 xs:gap-6">
                                    {contact.email && (
                                        <InfoItem
                                            icon={<Mail size={18} className="text-blue-600" />}
                                            label="Email"
                                            value={contact.email}
                                            href={`mailto:${contact.email}`}
                                        />
                                    )}

                                    {contact.phone && (
                                        <InfoItem
                                            icon={<Phone size={18} className="text-blue-600" />}
                                            label="Phone"
                                            value={contact.phone}
                                            href={`tel:${contact.phone}`}
                                        />
                                    )}

                                    {contact.designation && (
                                        <InfoItem
                                            icon={<Briefcase size={18} className="text-blue-600" />}
                                            label="Designation"
                                            value={contact.designation}
                                        />
                                    )}

                                    {contact.companyName && (
                                        <InfoItem
                                            icon={<Building2 size={18} className="text-blue-600" />}
                                            label="Company"
                                            value={contact.companyName}
                                        />
                                    )}

                                    {contact.linkedIn && (
                                        <div>
                                            <div className="flex items-center gap-2 text-xs xs:text-sm text-gray-500 mb-1">
                                                <Linkedin size={18} className="text-blue-600" />
                                                <span>LinkedIn</span>
                                            </div>
                                            <a
                                                href={contact.linkedIn}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs xs:text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                                            >
                                                View Profile
                                                <ExternalLink size={14} />
                                            </a>
                                        </div>
                                    )}

                                    {contact.isPrimary && (
                                        <InfoItem
                                            icon={<CheckCircle size={18} className="text-green-600" />}
                                            label="Type"
                                            value="Primary Contact"
                                        />
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Timeline */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="px-4 xs:px-6 py-3 xs:py-4 border-b border-gray-200">
                                <h3 className="text-sm xs:text-lg font-semibold text-gray-900">Timeline</h3>
                            </div>
                            <div className="p-4 xs:p-6">
                                <div className="space-y-4">
                                    <ActivityItem
                                        icon={<Calendar className="text-blue-600" size={16} />}
                                        title="Contact Created"
                                        timestamp={new Date(contact.createdAt).toLocaleDateString("en-US", {
                                            year: "numeric",
                                            month: "long",
                                            day: "numeric",
                                        })}
                                    />
                                    <ActivityItem
                                        icon={<Calendar className="text-purple-600" size={16} />}
                                        title="Last Updated"
                                        timestamp={new Date(contact.updatedAt).toLocaleDateString("en-US", {
                                            year: "numeric",
                                            month: "long",
                                            day: "numeric",
                                        })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Sidebar */}
                    <div className="space-y-4">
                        {/* Status */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="px-4 xs:px-6 py-3 xs:py-4 border-b border-gray-200">
                                <h3 className="text-sm xs:text-lg font-semibold text-gray-900">Status</h3>
                            </div>
                            <div className="p-4 xs:p-6">
                                <div className="flex items-center gap-2">
                                    {contact.isActive ? (
                                        <>
                                            <CheckCircle size={20} className="text-green-600" />
                                            <span className="font-medium text-sm text-green-600">Active</span>
                                        </>
                                    ) : (
                                        <>
                                            <XCircle size={20} className="text-gray-400" />
                                            <span className="font-medium text-sm text-gray-400">Inactive</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Primary Badge */}
                        {contact.isPrimary && (
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                <div className="px-4 xs:px-6 py-3 xs:py-4 border-b border-gray-200">
                                    <h3 className="text-sm xs:text-lg font-semibold text-gray-900">Contact Type</h3>
                                </div>
                                <div className="p-4 xs:p-6">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle size={20} className="text-green-600" />
                                        <span className="font-medium text-sm">Primary Contact</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Summary */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="px-4 xs:px-6 py-3 xs:py-4 border-b border-gray-200">
                                <h3 className="text-sm xs:text-lg font-semibold text-gray-900">Summary</h3>
                            </div>
                            <div className="p-4 xs:p-6 space-y-3">
                                <SummaryItem label="Email" value={contact.email ? "✓" : "—"} />
                                <SummaryItem label="Phone" value={contact.phone ? "✓" : "—"} />
                                <SummaryItem label="LinkedIn" value={contact.linkedIn ? "✓" : "—"} />
                                <SummaryItem label="Designation" value={contact.designation ? "✓" : "—"} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Form Slider */}
            {isSliderOpen && id && (
                <ContactFormSlider
                    mode="edit"
                    contactId={parseInt(id)}
                    onClose={handleSliderClose}
                    companies={companies}
                />
            )}
        </>
    );
};

// Helper Components
const InfoItem = ({
    icon,
    label,
    value,
    href,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    href?: string;
}) => (
    <div>
        <div className="flex items-center gap-2 text-xs xs:text-sm text-gray-500 mb-1">
            {icon}
            <span>{label}</span>
        </div>
        {href ? (
            <a href={href} className="text-xs xs:text-sm text-indigo-600 hover:text-indigo-700 font-medium break-all">
                {value}
            </a>
        ) : (
            <p className="text-xs xs:text-sm text-gray-900 font-medium">{value}</p>
        )}
    </div>
);

const ActivityItem = ({
    icon,
    title,
    timestamp,
}: {
    icon: React.ReactNode;
    title: string;
    timestamp: string;
}) => (
    <div className="flex gap-2 xs:gap-3">
        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
            {icon}
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-xs xs:text-sm font-medium text-gray-900">{title}</p>
            <p className="text-xs text-gray-500 mt-0.5">{timestamp}</p>
        </div>
    </div>
);

const SummaryItem = ({ label, value }: { label: string; value: string }) => (
    <div className="flex items-center justify-between">
        <span className="text-xs xs:text-sm text-gray-600">{label}</span>
        <span className="text-sm xs:text-lg font-semibold text-gray-900">{value}</span>
    </div>
);

export default ContactDetailPage;