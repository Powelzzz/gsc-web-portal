"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TripOverviewDetailsPage() {
  const { id } = useParams();
  const [trip, setTrip] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  /* ---------------------------------------------------------
      LOAD TRIP + ACTIVITY LOGS
  ---------------------------------------------------------- */
  useEffect(() => {
    if (!id) return;

    const load = async () => {
      try {
        const tripRes = await api.get(`/admin/haulingtrip/${id}/details`);
        const logRes = await api.get(`/admin/trip/${id}/activity`);

        setTrip(tripRes.data);
        setLogs(logRes.data.logs || []);
      } catch (err) {
        console.error("Failed to load trip:", err);
      }
      setLoading(false);
    };

    load();
  }, [id]);

  if (loading) return <p>Loading trip overview...</p>;
  if (!trip) return <p>Trip not found.</p>;

  /* ---------------------------------------------------------
        BUILD TIMELINE STEPS
  ---------------------------------------------------------- */

  const timelineSteps = logs.map((log) => {
    const images: string[] = [];

    switch (log.action) {
      case "OnTheWayToClient":
        if (trip.dashboardPicture)
          images.push(`/Uploads/TruckDashboards/${trip.truckDashboardPicture}`);
        break;

      case "ArriveAtClient":
        images.push(
          ...trip.driversAndLoadersPictures.map(
            (p: string) => `/Uploads/DriversLoaders/${p}`
          ),
          ...trip.beforePictures.map(
            (p: string) => `/Uploads/BeforeHaulingMRF/${p}`
          )
        );
        break;

      case "StartHauling":
        // Usually no images here
        break;

      case "DoneHauling":
        images.push(
          ...trip.afterPictures.map(
            (p: string) => `/Uploads/AfterHauling/${p}`
          )
        );
        if (trip.receiptPicture)
          images.push(
            `/Uploads/AfterHaulingReceipts/${trip.receiptPicture}`
          );
        if (trip.clientRepresentativePicture)
          images.push(
            `/Uploads/ClientRepAfter/${trip.clientRepresentativePicture}`
          );
        break;

      case "ArriveDestinationDisposalSite":
      case "ArriveDestinationRecyclingCenter":
      case "ArriveDestinationSacSacYard":
        // Destination arrivals normally have no pictures
        break;

      case "EncodeDeliveryDisposalSite":
      case "EncodeDeliveryRecyclingCenter":
      case "EncodeDeliverySacSacYard":
        // Manifest + Cargo Exit images
        if (trip.deliveries) {
          trip.deliveries.forEach((d: any) => {
            if (d.manifestPicturePath)
              images.push(
                `/Uploads/DeliveryUploads/ManifestPictures/${d.manifestPicturePath}`
              );
            if (d.cargoExitPicturePath)
              images.push(
                `/Uploads/DeliveryUploads/CargoExitPictures/${d.cargoExitPicturePath}`
              );
          });
        }
        break;

      case "FinishTrip":
        if (trip.cleanedTruckPicture)
          images.push(
            `/Uploads/CleanedTruck/${trip.cleanedTruckPicture}`
          );
        break;
    }

    return {
      time: new Date(log.createdAt).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      }),
      label: log.logActivity,
      images,
    };
  });

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
        <p><strong>Client:</strong> {trip.client}</p>
        <p><strong>Pick-up Date:</strong> {trip.pickUpDate?.slice(0, 10)}</p>
        <p><strong>Status:</strong> {trip.status}</p>
      </div>

      {/* TIMELINE */}
      <div className="space-y-4">
        {timelineSteps.map((step, idx) => (
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
                    onClick={() => setSelectedImage(API_URL + img)}
                  >
                    <Image
                      src={API_URL + img}
                      width={200}
                      height={200}
                      alt="Timeline image"
                      unoptimized
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
              width={1000}
              height={1000}
              alt="Expanded"
              unoptimized
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
