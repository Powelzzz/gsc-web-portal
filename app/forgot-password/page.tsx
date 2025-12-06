"use client";

import { useState } from "react";
import api from "@/lib/api";
import { useRouter } from "next/navigation";

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const submit = async () => {
    try {
      const res = await api.post("/account/forgot-password", null, {
        params: { email },
      });

      setMessage("OTP sent to email.");
      router.push(`/forgot-password/verify?email=${email}`);
    } catch (err: any) {
      setMessage(err?.response?.data || "Error sending OTP.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md w-full space-y-6">
        
        <h1 className="text-2xl font-bold text-indigo-600 text-center">
          Forgot Password
        </h1>

        <input
          type="email"
          placeholder="Enter your email"
          className="w-full bg-gray-100 rounded-full px-5 py-3 outline-none"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button
          onClick={submit}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-full"
        >
          Send OTP
        </button>

        {message && <p className="text-center text-indigo-700">{message}</p>}

        {/* Back to Login */}
        <div className="text-center mt-2">
        <button
            onClick={() => router.push("/")}
            className="text-sm text-gray-600 hover:text-gray-800 underline"
            type="button"
        >
            Back to Login
        </button>
        </div>

      </div>
    </div>
  );
}
