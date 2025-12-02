import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from "axios";

const API_BASE = "http://localhost:5001/api"; 

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

// REQUEST INTERCEPTOR (async so we can dynamically import jwt-decode)
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("gc_token")
        : null;

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;

      // decode token and save permissions (best-effort)
      try {
        const mod = await import("jwt-decode");
        const jwtDecode = (mod as any).default ?? mod;
        const decoded = jwtDecode(token);
        localStorage.setItem("gc_permissions", JSON.stringify(decoded.perm ?? []));
      } catch (err) {
        // ignore decode errors
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// RESPONSE INTERCEPTOR
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        // Clear localStorage
        localStorage.removeItem("gc_token");
        localStorage.removeItem("gc_user_role");
        localStorage.removeItem("gc_user_firstname");
        localStorage.removeItem("gc_user_lastname");
        // don't attempt to use `decoded` here

        // Clear cookie
        document.cookie = "gc_token=; path=/; max-age=0";

        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
