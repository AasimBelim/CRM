import { createContext, useState } from "react";
import type { UserContextType, userData } from "../types/Users";
import { jwtDecode } from "jwt-decode";
import { setAuthToken } from "../utils/axios";

const TOKEN_KEY = "kit_crm_token";
const USER_KEY = "kit_crm_user";

export const UserContext = createContext<UserContextType | null>(null);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {

    const [loading, setLoading] = useState<boolean>(true);

    const [token, setTokenState] = useState<string | null>(() => {
        try {
            const storedToken = localStorage.getItem(TOKEN_KEY);
            if (!storedToken) { setLoading(false); return null; }
            const decoded = jwtDecode<{ exp: number }>(storedToken);
            if (decoded.exp * 1000 < Date.now()) {
                localStorage.removeItem(TOKEN_KEY);
                localStorage.removeItem(USER_KEY);
                setLoading(false);
                return null;
            }
            setAuthToken(storedToken);
            setLoading(false);
            return storedToken;
        } catch {
            localStorage.removeItem(TOKEN_KEY);
            setLoading(false);
            return null;
        }
    });

    const setToken = (newToken: string | null) => {
        if (!newToken) return;
        try {
            const decoded = jwtDecode<{ exp: number }>(newToken);
            if (decoded.exp * 1000 < Date.now()) {
                console.warn("Token has already expired.");
                return;
            }
            localStorage.setItem(TOKEN_KEY, newToken);
            setTokenState(newToken);
            setAuthToken(newToken);
        } catch (error) {
            console.error("Error decoding token:", error);
        }
    };

    const [userData, setUserData] = useState<userData | null>(() => {
        try {
            const stored = localStorage.getItem(USER_KEY);
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    });

    const setUser = (user: userData | null) => {
        if (!user) return;
        setUserData(user);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
    };

    const clearUserData = () => {
        setUserData(null);
        localStorage.removeItem(USER_KEY);
    };

    const clearToken = () => {
        setTokenState(null);
        localStorage.removeItem(TOKEN_KEY);
    };

    const logOut = () => {
        clearUserData();
        clearToken();
    };

    const hasRole = (role: string): boolean => {
        return userData?.role?.toLowerCase() === role.toLowerCase();
    };

    const isAdmin = (): boolean => hasRole("admin");
    const isManager = (): boolean => hasRole("manager");

    return (
        <UserContext.Provider value={{
            user: userData,
            token,
            loading,
            setUser,
            setToken,
            clearUserData,
            clearToken,
            logOut,
            hasRole,
            isAdmin,
            isManager,
        }}>
            {children}
        </UserContext.Provider>
    );
}