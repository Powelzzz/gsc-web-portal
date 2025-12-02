import axios from "axios";

const adminApi = axios.create({
  baseURL: "http://localhost:5001",  // <-- IMPORTANT: No /api
  headers: {
    "Content-Type": "application/json",
  },
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
