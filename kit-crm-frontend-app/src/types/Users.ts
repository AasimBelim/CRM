export interface userData {
    email: string | null;
    userId: number;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    role?: string;
    roleId?: number;
    userName?: string;
}

export interface UserContextType {
    user: userData | null;
    token: string | null;
    loading: boolean;
    setUser: (user: userData | null) => void;
    setToken: (token: string | null) => void;
    clearUserData: () => void;
    clearToken: () => void;
    logOut: () => void;
    hasRole: (role: string) => boolean;
    isAdmin: () => boolean;
    isManager: () => boolean;
}

export interface UserProfileFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber: string;
}

export interface UserActionSidebarProps {
    isOpen: boolean;
    onModalChange?: (isOpen: boolean) => void;
    action: 'add' | 'edit';
    userId?: number | null;
    refreshUsers?: () => void;
    userData?: UserFormData | null;
}

export interface UserFormHtmlProps {
    userData: UserFormData;
    setUserData: React.Dispatch<React.SetStateAction<UserFormData>>;
    action?: 'add' | 'edit';
}

export interface UserFormData {
    userName: string;
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    phoneNumber: string;
    roleId: number;
    status: "active" | "inactive" | "1" | "0";
}

export interface UsersTableViewProps {
    users: Array<UsersTableViewData>;
    isLoading?: boolean;
    editUser?: (userId: number) => void;
    deleteUser?: (userId: number) => void;
}

export interface UsersTableViewData {
    email: string;
    userId: number;
    isActive: boolean;
    userName: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    roleName: string;
    createdAt: string | Date;
}

export interface RoleDropdownProps {
    value: number;
    onChange: (roleId: number) => void;
    required?: boolean;
    disabled?: boolean;
    id?: string;
    className?: string;
}