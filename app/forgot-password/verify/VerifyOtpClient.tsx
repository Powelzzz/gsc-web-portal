"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import api from "@/lib/api";

export default function VerifyOtpClient() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") ?? "";

  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [message, setMessage] = useState("");

  // RESEND TIMER
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Timer countdown
  useEffect(() => {
    if (!canResend && secondsLeft > 0) {
      const t = setTimeout(() => setSecondsLeft(secondsLeft - 1), 1000);
      return () => clearTimeout(t);
    }
    if (secondsLeft === 0) {
      setCanResend(true);
    }
  }, [secondsLeft, canResend]);

  // Join OTP digits
  const otp = otpDigits.join("");

  // Handle numeric input only
  const handleChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...otpDigits];
    newDigits[index] = value;
    setOtpDigits(newDigits);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace auto-move to previous box
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Verify OTP
  const submitOtp = async () => {
    try {
      await api.post("/account/verify-otp-forgot-password", null, {
        params: { email, otpCode: otp },
      });

      router.push(`/forgot-password/reset?email=${email}`);
    } catch (err: any) {
      setMessage(err?.response?.data || "Invalid OTP.");
    }
  };

  // RESEND OTP
  const resendOtp = async () => {
    try {
      await api.post("/account/forgot-password", null, { params: { email } });

      setMessage("A new OTP has been sent to your email.");
      setSecondsLeft(60);
      setCanResend(false);
    } catch (err: any) {
      setMessage(err?.response?.data || "Unable to resend OTP.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md w-full space-y-6">
        <h1 className="text-2xl font-bold text-indigo-600 text-center">
          Verify OTP
        </h1>

        <p className="text-center text-gray-600">
          Enter the 6-digit OTP sent to <strong>{email}</strong>
        </p>

        <div className="flex justify-between gap-2">
          {otpDigits.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(e.target.value, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className="w-12 h-12 text-center text-xl font-semibold bg-white border-2 border-gray-300 rounded-lg outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500"
            />
          ))}
        </div>

        <button
          onClick={submitOtp}
          disabled={otp.length !== 6}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white py-3 rounded-full transition"
        >
          Verify OTP
        </button>

        <div className="text-center">
          {canResend ? (
            <button
              onClick={resendOtp}
              className="text-indigo-600 hover:text-indigo-800 text-sm underline"
            >
              Resend OTP
            </button>
          ) : (
            <p className="text-gray-500 text-sm">Resend OTP in {secondsLeft}s</p>
          )}
        </div>

        <div className="text-center">
          <button
            onClick={() => router.push("/")}
            className="text-gray-600 hover:text-gray-800 text-sm underline"
          >
            Back to Login
          </button>
        </div>

        {message && (
          <p className="text-center text-indigo-700 font-medium">{message}</p>
        )}
      </div>
    </div>
  );
}
