// Authentication related types
export interface SignInInput {
  email: string;
  password: string;
}

export interface SignUpInput {
  user_name: string;
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
}

export interface JWTPayload {
  userId: number;
  email: string;
  role?: string;
  roleId?: number;
  firstName?: string | null;
  lastName?: string | null;
  userName: string;
  phoneNumber?: string | null;
}

export interface AuthResponse {
  status: boolean;
  message: string;
  token?: string;
  userData?: JWTPayload;
}
