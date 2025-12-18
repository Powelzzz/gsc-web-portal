"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { Eye, EyeOff } from "lucide-react";

export default function ResetPasswordClient() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") ?? "";

  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [message, setMessage] = useState("");

  // PASSWORD VALIDATION
  const isStrongPassword = (password: string) => {
    const length = password.length >= 8;
    const upper = /[A-Z]/.test(password);
    const lower = /[a-z]/.test(password);
    const number = /[0-9]/.test(password);
    const special = /[^A-Za-z0-9]/.test(password);

    return length && upper && lower && number && special;
  };

  const getStrength = () => {
    if (newPass.length === 0) return "";
    if (!isStrongPassword(newPass)) return "Weak";
    if (newPass.length < 12) return "Medium";
    return "Strong";
  };

  const strength = getStrength();

  const isFormValid =
    newPass.length > 0 &&
    confirmPass.length > 0 &&
    newPass === confirmPass &&
    isStrongPassword(newPass);

  const submit = async () => {
    if (!isFormValid) {
      setMessage("Please meet password requirements and ensure both fields match.");
      return;
    }

    try {
      await api.post("/account/reset-password", null, {
        params: { email, newPassword: newPass },
      });

      setMessage("Password reset successful.");
      setTimeout(() => router.push("/"), 2000);
    } catch (err: any) {
      setMessage(err?.response?.data || "Failed to reset password.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md w-full space-y-6">
        <h1 className="text-2xl font-bold text-indigo-600 text-center">
          Reset Password
        </h1>

        <div className="bg-gray-100 rounded-full px-5 py-3 flex items-center gap-3">
          <input
            type={showPass ? "text" : "password"}
            placeholder="New Password"
            className="bg-transparent flex-1 outline-none"
            value={newPass}
            onChange={(e) => setNewPass(e.target.value)}
          />
          <button type="button" onClick={() => setShowPass(!showPass)}>
            {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        {newPass.length > 0 && (
          <div className="text-sm space-y-1 mt-1">
            <p className={newPass.length >= 8 ? "text-green-600" : "text-red-500"}>
              {newPass.length >= 8 ? "✔" : "✖"} Minimum 8 characters
            </p>
            <p className={/[A-Z]/.test(newPass) ? "text-green-600" : "text-red-500"}>
              {/[A-Z]/.test(newPass) ? "✔" : "✖"} At least 1 uppercase letter
            </p>
            <p className={/[a-z]/.test(newPass) ? "text-green-600" : "text-red-500"}>
              {/[a-z]/.test(newPass) ? "✔" : "✖"} At least 1 lowercase letter
            </p>
            <p className={/[0-9]/.test(newPass) ? "text-green-600" : "text-red-500"}>
              {/[0-9]/.test(newPass) ? "✔" : "✖"} At least 1 number
            </p>
            <p className={/[^A-Za-z0-9]/.test(newPass) ? "text-green-600" : "text-red-500"}>
              {/[^A-Za-z0-9]/.test(newPass) ? "✔" : "✖"} At least 1 special character
            </p>
          </div>
        )}

        {newPass.length > 0 && (
          <p
            className={`text-sm text-center font-medium ${
              strength === "Strong"
                ? "text-green-600"
                : strength === "Medium"
                ? "text-orange-500"
                : "text-red-500"
            }`}
          >
            Password Strength: {strength}
          </p>
        )}

        <div className="bg-gray-100 rounded-full px-5 py-3 flex items-center gap-3">
          <input
            type={showConfirmPass ? "text" : "password"}
            placeholder="Confirm Password"
            className="bg-transparent flex-1 outline-none"
            value={confirmPass}
            onChange={(e) => setConfirmPass(e.target.value)}
          />
          <button type="button" onClick={() => setShowConfirmPass(!showConfirmPass)}>
            {showConfirmPass ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        <button
          onClick={submit}
          disabled={!isFormValid}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white py-3 rounded-full transition"
        >
          Reset Password
        </button>

        {message && (
          <p className="text-center text-indigo-700 font-medium mt-2">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
