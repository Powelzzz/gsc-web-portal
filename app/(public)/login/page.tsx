"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const usernameRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    usernameRef.current?.focus();
  }, []);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleLogin();
  };

  const handleLogin = async () => {
    if (!username || !password) {
      const msg = "Username and password are required";
      setError(msg);
      toast.error(msg);
      setShake(true);
      setTimeout(() => setShake(false), 350);
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await api.post("/account/login", { username, password });
      const data = res.data;

      localStorage.setItem("gc_token", data.token);
      localStorage.setItem("gc_user_role", data.role ?? "");
      localStorage.setItem("gc_user_firstname", data.firstName ?? "");
      localStorage.setItem("gc_user_lastname", data.lastName ?? "");

      const payload = JSON.parse(atob(data.token.split(".")[1]));
      const permissions = payload.perm || [];
      localStorage.setItem("gc_permissions", JSON.stringify(permissions));

      document.cookie = `gc_token=${data.token}; path=/; max-age=${60 * 60 * 24 * 7}`;
      document.cookie = `gc_user_role=${data.role}; path=/; max-age=${60 * 60 * 24 * 7}`;

      toast.success("Login successful! Redirecting...");

      setTimeout(() => {
        if (data.role === "Admin") router.push("/admin/dashboard");
        else router.push("/accounting");
      }, 600);

    } catch (err: any) {
      const msg = err?.response?.data ?? "Invalid username or password";
      setError(msg);
      toast.error(msg);
      setShake(true);
      setTimeout(() => setShake(false), 350);
    }

    setLoading(false);
  };

  return (
    <div
      className="relative min-h-screen flex justify-center items-center px-6 py-10 overflow-hidden
      bg-gradient-to-br from-[#ffe4e4] via-[#f0f6ff] to-[#e0ecff]"
    >

      {/* Floating Blobs — Soft Red + Blue */}
      <div className="absolute w-[350px] h-[350px] bg-red-200 
        rounded-full blur-3xl opacity-40 animate-pulse -top-24 -left-24"></div>

      <div className="absolute w-[330px] h-[330px] bg-blue-200 
        rounded-full blur-3xl opacity-40 animate-pulse-slow bottom-14 right-10"></div>

      {/* Card */}
      <div
        className={`relative w-full max-w-md p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)]
        bg-white/40 backdrop-blur-2xl border border-white/40
        transition-all duration-300 
        ${shake ? "animate-shake" : "hover:shadow-[0_12px_40px_rgb(0,0,0,0.14)] hover:scale-[1.02]"}`}
      >

        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Image
            src="/z2alogo.png"
            alt="Z2A Logo"
            width={170}
            height={170}
            className="object-contain drop-shadow-lg"
          />
        </div>

        <h1 className="text-4xl font-extrabold text-center mb-8 tracking-tight text-[#1d3b78] drop-shadow-sm">
          Welcome Back
        </h1>

        <div className="space-y-6">

          {/* Username */}
          <div className="rounded-full bg-white/60 px-5 py-4 flex items-center shadow-inner
            border border-white/50 backdrop-blur-sm focus-within:ring-2 focus-within:ring-blue-300">
            <input
              ref={usernameRef}
              type="text"
              placeholder="Username"
              className="bg-transparent flex-1 outline-none text-gray-800 text-base"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={handleKeyPress}
            />
          </div>

          {/* Password */}
          <div className="rounded-full bg-white/60 px-5 py-4 flex items-center gap-3 shadow-inner
            border border-white/50 backdrop-blur-sm focus-within:ring-2 focus-within:ring-blue-300">
            <input
              type={showPass ? "text" : "password"}
              placeholder="Password"
              className="bg-transparent flex-1 outline-none text-gray-800 text-base"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyPress}
            />
            <button type="button" onClick={() => setShowPass(!showPass)}>
              {showPass ? (
                <EyeOff size={22} className="text-gray-500" />
              ) : (
                <Eye size={22} className="text-gray-500" />
              )}
            </button>
          </div>

          {/* Forgot Password */}
          <div className="flex justify-end">
            <button
              onClick={() => router.push("/forgot-password")}
              className="text-blue-700 hover:text-blue-800 text-sm font-semibold transition"
              type="button"
            >
              Forgot Password?
            </button>
          </div>

          {/* Error */}
          {error && (
            <p className="text-red-600 text-center text-sm font-medium">
              {error}
            </p>
          )}

          {/* Sign-in Button (Blue → Red Gradient like Logo) */}
          <button
            onClick={handleLogin}
            disabled={loading}
            className={`w-full py-3 rounded-full shadow-xl font-semibold text-white text-lg 
              bg-gradient-to-r from-blue-600 via-blue-500 to-red-500
              hover:from-blue-700 hover:via-blue-600 hover:to-red-600
              transition-all duration-300 flex justify-center items-center gap-2
              ${loading ? "opacity-80 cursor-not-allowed" : "hover:scale-[1.03]"}`}
          >
            {loading && <Loader2 className="animate-spin" size={20} />}
            {loading ? "Signing In..." : "Sign In"}
          </button>

        </div>
      </div>
    </div>
  );
}
