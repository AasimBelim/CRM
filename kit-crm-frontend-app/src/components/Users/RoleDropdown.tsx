import { useEffect, useState } from "react";
import apiCall from "@/utils/axios";
import type { Role } from "@/types/Roles";
import type { RoleDropdownProps } from "@/types/Users";

const RoleDropdown = (props: RoleDropdownProps) => {
    const { value, onChange, required = false, disabled = false, id = "role", className = "form-select" } = props;
    const [roles, setRoles] = useState<Role[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const fetchRoles = async () => {
        try {
            setIsLoading(true);
            const response = await apiCall.get("/roles");
            const { status, data } = response.data;
            if (status && data) {
                setRoles(data);
            }
        } catch (error) {
            console.error("Error fetching roles:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRoles();
    }, []);

    return (
        <select
            className={className}
            id={id}
            required={required}
            disabled={disabled || isLoading}
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value))}
        >
            <option value="">Select Role</option>
            {roles.map((role) => (
                <option key={role.roleId} value={role.roleId}>
                    {role.roleName}
                </option>
            ))}
        </select>
    );
};

export default RoleDropdown;
