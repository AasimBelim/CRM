// User and Category nested types
export interface ListingUser {
    id: number;
    userName: string;
    email: string;
    firstName: string;
    lastName: string;
}

export interface ListingCategory {
    id: number;
    name: string;
    description: string | null;
    parentCategoryId: number;
}

export interface ListingState {
    id: number;
    name: string;
}

export interface ListingCity {
    id: number;
    name: string;
}

// Full Listing interface (from API response)
export interface Listing {
    id: number;
    title: string;
    description: string;
    location: string;
    price: number;
    featuredImageUrl: string | null;
    imageUrls: string[] | null;
    isAvailable: boolean;
    status: 'active' | 'rejected' | 'pending';
    user: ListingUser | null;
    category: ListingCategory | null;
    state: ListingState | null;
    city: ListingCity | null;
    createdAt: string | Date;
    updatedAt: string | Date;
}

// Form data interface (for add/edit operations)
export interface ListingFormData {
    title: string;
    description: string;
    price: number | string;
    location: string;
    categoryId: number | string;
    stateId: number | string;
    cityId: number | string;
    isAvailable: boolean | string;
    status?: 'active' | 'rejected' | 'pending';
    userId?: number | string;
}

// Table view props
export interface ListingsTableViewProps {
    listings: Listing[];
    isLoading?: boolean;
    editListing?: (listingId: number) => void;
    deleteListing?: (listingId: number) => void;
    toggleAvailability?: (listingId: number, currentStatus: boolean) => void;
}

// Action sidebar props
export interface ListingActionSidebarProps {
    isOpen: boolean;
    onModalChange?: (isOpen: boolean) => void;
    action: 'add' | 'edit';
    listingId?: number | null;
    refreshListings?: () => void;
    listingData?: ListingFormData | null;
}

// Form props
export interface ListingFormHtmlProps {
    listingData: ListingFormData;
    setListingData: React.Dispatch<React.SetStateAction<ListingFormData>>;
    action: 'add' | 'edit';
}