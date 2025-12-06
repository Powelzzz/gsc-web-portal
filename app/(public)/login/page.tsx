"use client";

import { useState } from "react";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";
import api from "@/lib/api";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      setError("Username and password are required");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await api.post("/account/login", {
        username,
        password,
      });

      const data = res.data;

      // Save token & user info
      localStorage.setItem("gc_token", data.token);
      localStorage.setItem("gc_user_role", data.role ?? "");
      localStorage.setItem("gc_user_firstname", data.firstName ?? "");
      localStorage.setItem("gc_user_lastname", data.lastName ?? "");

      // Decode permissions from token
      const payload = JSON.parse(atob(data.token.split(".")[1]));
      const permissions = payload.perm || [];

      // Save permissions for UI
      localStorage.setItem("gc_permissions", JSON.stringify(permissions));

      // Save to cookies (middleware)
      document.cookie = `gc_token=${data.token}; path=/; max-age=${60 * 60 * 24 * 7}`;
      document.cookie = `gc_user_role=${data.role}; path=/; max-age=${60 * 60 * 24 * 7}`;

      // Redirect based on role
      if (data.role === "Admin") {
        router.push("/admin/dashboard");
      } else {
        router.push("/accounting");
      }

    } catch (err: any) {
      setError(err?.response?.data ?? "Invalid username or password");
    }


    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white flex justify-center items-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <Image
            src="/z2alogo.png"
            alt="Logo"
            width={180}
            height={180}
            className="object-contain"
          />
        </div>

        <h1 className="text-3xl font-bold text-indigo-600 text-center mb-2">
          Sign In
        </h1>

        <div className="space-y-5">

          <div className="bg-gray-100 rounded-full px-5 py-4 flex items-center">
            <input
              type="text"
              placeholder="Username"
              className="bg-transparent flex-1 outline-none text-gray-700 text-base"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="bg-gray-100 rounded-full px-5 py-4 flex items-center gap-3">
            <input
              type={showPass ? "text" : "password"}
              placeholder="Password"
              className="bg-transparent flex-1 outline-none text-gray-700 text-base"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button onClick={() => setShowPass(!showPass)}>
              {showPass ? (
                <EyeOff size={22} className="text-gray-400" />
              ) : (
                <Eye size={22} className="text-gray-400" />
              )}
            </button>
          </div>
          {/* FORGOT PASSWORD LINK */}
          <div className="flex justify-end mt-1">
            <button
              onClick={() => router.push("/forgot-password")}
              className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
              type="button"
            >
              Forgot Password?
            </button>
          </div>
          {error && (
            <p className="text-red-600 text-center text-sm font-medium">
              {error}
            </p>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 transition text-white text-lg font-semibold py-3 rounded-full shadow"
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
}
