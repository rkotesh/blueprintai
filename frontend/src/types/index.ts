export type UserLevel = "ZERO" | "BEGINNER" | "INTERMEDIATE";

export interface User {
  id: string;
  email: string;
  displayName: string;
  level: UserLevel;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
}

export type ProjectMode = "BUILD" | "LEARN";
export type TargetPlatform = "WEB" | "MOBILE";
export type ProjectStatus = "ACTIVE" | "ARCHIVED";

export interface Project {
  id: string;
  userId: string;
  title: string;
  ideaText: string;
  mode: ProjectMode;
  targetPlatform: TargetPlatform;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectPayload {
  title: string;
  ideaText: string;
  mode: ProjectMode;
  targetPlatform: TargetPlatform;
}

export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  fieldErrors?: { field: string; message: string }[];
}
