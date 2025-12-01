"use client";

import { Smartphone, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function DriverAppRequiredPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white shadow-lg border rounded-2xl p-10 max-w-md w-full text-center">

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <Smartphone className="w-16 h-16 text-indigo-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Mobile App Required
        </h1>

        <p className="text-gray-600 text-sm mb-6">
          Your account is for <b>Drivers</b>.  
          Please use the <b>Z2A Driver Mobile App</b> to access your hauling assignments.
        </p>

        {/* Buttons */}
        <div className="space-y-3">
          <a
            href="#"
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
          >
            Download for Android <ArrowRight size={16} />
          </a>

          <a
            href="#"
            className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition"
          >
            Download for iOS <ArrowRight size={16} />
          </a>
        </div>

        <p className="text-xs text-gray-400 mt-6">
          Contact support if you need help accessing your account.
        </p>
      </div>
    </div>
  );
}
