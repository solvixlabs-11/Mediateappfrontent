export interface RoleSummary {
  id: number;
  code: "ADMIN" | "MANAGER" | "MR" | string;
  name: string;
  description?: string | null;
}

export interface ManagerSummary {
  id: number;
  full_name: string;
  email: string;
  phone?: string | null;
}

export interface UserDetail {
  id: number;
  email: string;
  full_name: string;
  phone?: string | null;
  role_id: number;
  role: RoleSummary;
  is_active: boolean;
  force_password_change: boolean;
  failed_login_attempts: number;
  locked_until?: string | null;
  last_login_at?: string | null;
  profile_picture_file_id?: number | null;
  profile_picture_url?: string | null;
  current_manager?: ManagerSummary | null;
  created_at: string;
  updated_at: string;
}

export interface UserListResponse {
  items: UserDetail[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface CreateUserPayload {
  email: string;
  full_name: string;
  phone?: string | null;
  role_code: string;
  password: string;
  force_password_change?: boolean;
  manager_id?: number | null;
}

export interface UpdateUserPayload {
  full_name?: string;
  phone?: string | null;
  role_code?: string;
  password?: string;
  profile_picture_file_id?: number | null;
}

export interface UpdateProfilePayload {
  full_name?: string;
  phone?: string | null;
  profile_picture_file_id?: number | null;
}

export interface ManagerAssignmentResponse {
  id: number;
  manager_id: number;
  manager_name: string;
  mr_id: number;
  mr_name: string;
  assigned_at: string;
  unassigned_at?: string | null;
  is_active: boolean;
}

export interface FileUploadResponse {
  id: number;
  filename: string;
  original_filename: string;
  mime_type: string;
  file_size_bytes: number;
  storage_provider: string;
  file_url: string;
  created_at: string;
}
