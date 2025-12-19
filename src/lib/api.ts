import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from "axios";

const API_ORIGIN =
  (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080").trim();

const api = axios.create({
  baseURL: `${API_ORIGIN}/api`,
  headers: { "Content-Type": "application/json" },
});


api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("gc_token") : null;

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("gc_token");
        localStorage.removeItem("gc_user_role");
        localStorage.removeItem("gc_user_firstname");
        localStorage.removeItem("gc_user_lastname");
        localStorage.removeItem("gc_permissions");

        document.cookie = "gc_token=; path=/; max-age=0";
        document.cookie = "gc_user_role=; path=/; max-age=0";

        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
