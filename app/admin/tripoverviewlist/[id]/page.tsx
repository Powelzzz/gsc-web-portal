"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function TripOverviewDetailsPage() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const trip = {
    id: 301,
    driver: "Juan Dela Cruz",
    truck: "ABC-1234",
    client: "Jollibee MEPZ",
    startTime: "8:34 AM",
    actions: [
      {
        label: "On the Way to Client",
        time: "8:45 AM",
        images: ["/dashboard.png"],
      },
      {
        label: "Arrived at Client",
        time: "9:10 AM",
        images: ["/driverandloaders.png", "/MRFbefore.png"],
      },
      {
        label: "Started Hauling",
        time: "9:20 AM",
        images: ["/img/h1.jpg", "/img/h2.jpg", "/img/h3.jpg"],
      },
      {
        label: "Completed Hauling",
        time: "10:05 AM",
        images: ["/img/h4.jpg"],
      },
      {
        label: "Proceed to Disposal Site",
        time: "11:00 AM",
        images: [],
      },
      {
        label: "Arrived at Disposal Site",
        time: "12:35 PM",
        images: ["/img/manifest.jpg", "/img/exit.jpg"],
      },
      {
        label: "Final Arrival at Sacsac Yard",
        time: "1:15 PM",
        images: [],
      },
    ],
  };

  return (
    <div className="space-y-6">
      {/* BACK BUTTON */}
      <div className="flex items-center gap-3 mb-2">
        <Link
          href="/admin/tripoverviewlist"
          className="flex items-center gap-2 text-gray-700 hover:text-black transition"
        >
          <ArrowLeft size={20} />
          <span className="text-sm font-medium">Back to Trip List</span>
        </Link>
      </div>

      <h1 className="text-2xl font-bold">Trip #{trip.id}</h1>

      {/* BASIC INFO */}
      <div className="bg-white p-6 rounded-lg shadow space-y-1 text-gray-700">
        <p><strong>Driver:</strong> {trip.driver}</p>
        <p><strong>Truck:</strong> {trip.truck}</p>
        <p><strong>Client:</strong> {trip.client}</p>
        <p><strong>Start Time:</strong> {trip.startTime}</p>
      </div>

      {/* TIMELINE */}
      <div className="space-y-4">
        {trip.actions.map((step, idx) => (
          <div
            key={idx}
            className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500"
          >
            <h2 className="text-lg font-semibold mb-1">
              {step.time} — {step.label}
            </h2>

            {step.images.length > 0 && (
              <div className="grid grid-cols-4 gap-3 mt-3">
                {step.images.map((img, i) => (
                  <div
                    key={i}
                    className="w-full h-28 bg-gray-200 rounded overflow-hidden cursor-pointer hover:opacity-80"
                    onClick={() => setSelectedImage(img)}
                  >
                    <Image
                      src={img}
                      width={200}
                      height={200}
                      alt="Trip image"
                      className="object-cover w-full h-full"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* IMAGE MODAL */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl w-auto">
            <Image
              src={selectedImage}
              alt="Expanded"
              width={1000}
              height={1000}
              className="rounded-lg shadow-xl"
            />

            <button
              className="absolute top-2 right-2 bg-white px-3 py-1 rounded shadow text-black text-sm"
              onClick={() => setSelectedImage(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
