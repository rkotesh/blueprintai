import { AuthResponse, User, Project, CreateProjectPayload, ApiError } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api";

class ApiClient {
  private getAccessToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("blueprint_token");
  }

  private getRefreshToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("blueprint_refresh_token");
  }

  public setTokens(token: string, refreshToken: string) {
    if (typeof window === "undefined") return;
    localStorage.setItem("blueprint_token", token);
    localStorage.setItem("blueprint_refresh_token", refreshToken);
  }

  public clearTokens() {
    if (typeof window === "undefined") return;
    localStorage.removeItem("blueprint_token");
    localStorage.removeItem("blueprint_refresh_token");
  }

  public async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = this.getAccessToken();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    let response = await fetch(url, { ...options, headers });

    // Handle 401 Unauthorized with token refresh
    if (response.status === 401 && !endpoint.startsWith("/auth/")) {
      const refreshed = await this.tryRefreshToken();
      if (refreshed) {
        const retryToken = this.getAccessToken();
        if (retryToken) {
          headers["Authorization"] = `Bearer ${retryToken}`;
        }
        response = await fetch(url, { ...options, headers });
      } else {
        this.clearTokens();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      }
    }

    if (!response.ok) {
      let errorData: ApiError;
      try {
        errorData = await response.json();
      } catch {
        errorData = {
          timestamp: new Date().toISOString(),
          status: response.status,
          error: response.statusText,
          message: `Request failed with status ${response.status}`,
          path: endpoint,
        };
      }
      throw errorData;
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  private async tryRefreshToken(): Promise<boolean> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) return false;

      const data: AuthResponse = await response.json();
      this.setTokens(data.token, data.refreshToken);
      return true;
    } catch {
      return false;
    }
  }

  // Auth Methods
  public async register(payload: { email: string; password: string; displayName: string; level?: string }): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    this.setTokens(res.token, res.refreshToken);
    return res;
  }

  public async login(payload: { email: string; password: string }): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    this.setTokens(res.token, res.refreshToken);
    return res;
  }

  public async logout(): Promise<void> {
    try {
      await this.request<void>("/auth/logout", { method: "POST" });
    } finally {
      this.clearTokens();
    }
  }

  public async getCurrentUser(): Promise<User> {
    return this.request<User>("/me");
  }

  public async updateProfile(payload: { displayName?: string; level?: string }): Promise<User> {
    return this.request<User>("/me", {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }

  // Project Methods
  public async getProjects(): Promise<Project[]> {
    return this.request<Project[]>("/projects");
  }

  public async getProject(id: string): Promise<Project> {
    return this.request<Project>(`/projects/${id}`);
  }

  public async createProject(payload: CreateProjectPayload): Promise<Project> {
    return this.request<Project>("/projects", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  public async deleteProject(id: string): Promise<void> {
    return this.request<void>(`/projects/${id}`, { method: "DELETE" });
  }
}

export const api = new ApiClient();
