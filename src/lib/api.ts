import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from "axios";

const API_BASE = "http://localhost:5001/api"; 

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("gc_token")
        : null;

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
        // Clear localStorage
        localStorage.removeItem("gc_token");
        localStorage.removeItem("gc_user_role");
        localStorage.removeItem("gc_user_firstname");
        localStorage.removeItem("gc_user_lastname");

        // Clear cookie
        document.cookie = "gc_token=; path=/; max-age=0";

        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
