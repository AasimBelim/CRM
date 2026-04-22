export interface NavigationMenuItem {
    id: string; // unique ID for each menu item
    label: string; // Display text
    type: 'category' | 'custom'; // Menu item type
    categoryId?: number; // If type is category
    url?: string; // If type is custom
    openInNewTab: boolean; // Target attribute
    children?: NavigationMenuItem[]; // Sub-menu items
    order: number; // Display order
}

export interface NavigationMenuData {
    items: NavigationMenuItem[];
}

export interface NavigationMenuFormData {
    items: NavigationMenuItem[];
}

export interface OptionData {
    id: number;
    optionKey: string;
    optionValue: string; // JSON stringified
}

export interface NavigationMenuItemFormData {
    id?: string;
    label: string;
    type: 'category' | 'custom';
    categoryId?: string | number;
    url?: string;
    openInNewTab: boolean;
    parentId?: string;
}
