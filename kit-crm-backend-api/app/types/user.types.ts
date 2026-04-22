// User related types
export interface User {
  id: number;
  userName: string;
  email: string;
  phoneNumber: string;
  password: string;
  firstName?: string | null;
  lastName?: string | null;
  createdAt: Date;
}

export interface UserResponse {
  userId: number;
  userName: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  createdAt: Date;
}

export interface CreateUserInput {
  user_name: string;
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  phone_number: string;
  status?: boolean | string;
  role_id: number;
}

export interface UpdateUserInput {
  email?: string;
  password?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  role_id?: number;
  status?: boolean | string;
}

export interface UserQueryParams {
  email?: string;
  role?: string;
  userName?: string;
  status?: string;
}
