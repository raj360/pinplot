import { apiFetch } from "./client";

export type UserProfile = {
  id: string;
  role: "TENANT" | "LANDLORD" | "ADMIN" | "SUPERADMIN";
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  country_code: string;
  is_verified: boolean;
  created_at?: string;
};

export function fetchMyProfile() {
  return apiFetch<UserProfile | null>("/profiles/me");
}
