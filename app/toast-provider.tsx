"use client";

import { Toaster } from "react-hot-toast";

export default function ToastProvider() {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        duration: 2200,
        style: {
          background: "white",
          color: "#333",
          border: "1px solid #e5e7eb",
          padding: "12px",
          fontSize: "14px",
        },
      }}
    />
  );
}
