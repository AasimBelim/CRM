export interface Role {
    roleId: number;
    roleName: string;
}

export interface RoleResponse {
    status: boolean;
    message: string;
    data: Role[] | Role;
}
