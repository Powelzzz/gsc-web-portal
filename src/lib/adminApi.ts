import axios from "axios";

const API_ORIGIN =
  (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080").trim();

const adminApi = axios.create({
  baseURL: `${API_ORIGIN}/api`,
  headers: { "Content-Type": "application/json" },
});


adminApi.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("gc_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default adminApi;
