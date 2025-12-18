import { Suspense } from "react";
import VerifyOtpClient from "./VerifyOtpClient";

export default function VerifyOtpPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center px-6">
          Loading…
        </div>
      }
    >
      <VerifyOtpClient />
    </Suspense>
  );
}
