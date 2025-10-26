export interface User {
  id: number;
  username: string;
  password_hash: string;
  created_at: string;
}

export interface UserWithoutPassword {
  id: number;
  username: string;
  created_at: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  auth: string; // authorization code for registration
}