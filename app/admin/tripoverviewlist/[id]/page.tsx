"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Clock, Camera, MapPin, Truck, FileCheck } from "lucide-react";

export default function TripOverviewDetailsPage() {
  const { id } = useParams();

  // --------------------------------------------------
  // STATE HOOKS (must be first)
  // --------------------------------------------------
  const [trip, setTrip] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const fullUrl = (p: string) => `${API_URL}${p}`;

  // --------------------------------------------------
  // FETCH TRIP + LOGS
  // --------------------------------------------------
  useEffect(() => {
    if (!id) return;

    const load = async () => {
      try {
        const [tripRes, logRes] = await Promise.all([
          api.get(`/admin/haulingtrip/${id}/details`),
          api.get(`/admin/trip/${id}/activity`)
        ]);

        setTrip(tripRes.data);
        setLogs(logRes.data.logs || []);
      } catch (err) {
        console.error("Failed to load trip:", err);
      }
      setLoading(false);
    };

    load();
  }, [id]);

  // --------------------------------------------------
  // ICON SELECTOR — safe version
  // --------------------------------------------------
  function chooseIcon(action: any) {
    if (!action || typeof action !== "string") {
      return <Clock className="text-gray-400" size={20} />;
    }

    if (action.includes("OnTheWay")) return <Truck className="text-blue-600" size={20} />;
    if (action.includes("Arrive")) return <MapPin className="text-green-600" size={20} />;
    if (action.includes("StartHauling")) return <Truck className="text-orange-500" size={20} />;
    if (action.includes("DoneHauling")) return <Camera className="text-purple-600" size={20} />;
    if (action.includes("EncodeDelivery")) return <FileCheck className="text-amber-600" size={20} />;
    if (action.includes("Finish")) return <Truck className="text-gray-700" size={20} />;

    return <Clock className="text-gray-400" size={20} />;
  }

  // --------------------------------------------------
  // TIMELINE BUILDER — fully aligned to flow chart
  // --------------------------------------------------
  const timelineSteps = useMemo(() => {
    if (!trip || !logs) return [];

    const sortedLogs = [...logs].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    return sortedLogs.map((log) => {
      const images: string[] = [];
      const action = log.action ?? ""; // SAFE fallback

      switch (action) {
        /* 1️⃣ DRIVER ON THE WAY */
        case "OnTheWayToClient":
          if (trip.truckDashboardPicture)
            images.push(fullUrl(`/Uploads/TruckDashboards/${trip.truckDashboardPicture}`));
          break;

        /* 2️⃣ DRIVER ARRIVES AT CLIENT */
        case "ArriveAtClient":
          images.push(
            ...(trip.beforePictures ?? []).map(
              (p: string) => fullUrl(`/Uploads/BeforeHaulingMRF/${p}`)
            ),
            ...(trip.driversAndLoadersPictures ?? []).map(
              (p: string) => fullUrl(`/Uploads/DriversLoaders/${p}`)
            )
          );
          break;

        /* 3️⃣ START HAULING */
        case "StartHauling":
          break;

        /* 4️⃣ DONE HAULING */
        case "DoneHauling":
          images.push(
            ...(trip.afterPictures ?? []).map(
              (p: string) => fullUrl(`/Uploads/AfterHauling/${p}`)
            )
          );

          if (trip.clientRepresentativePicture)
            images.push(fullUrl(`/Uploads/ClientRepAfter/${trip.clientRepresentativePicture}`));

          if (trip.receiptPicture)
            images.push(fullUrl(`/Uploads/AfterHaulingReceipts/${trip.receiptPicture}`));
          break;

        /* 5️⃣ INPUT REASON */
        case "RecordReason":
          break;

        /* 6️⃣ PROCEED TO DESTINATION */
        case "ProceedToDisposalSite":
        case "ProceedToSacSacYard":
        case "ProceedToRecyclingCenter":
          break;

        /* 7️⃣ ARRIVE AT DESTINATION */
        case "ArriveDestinationDisposalSite":
        case "ArriveDestinationSacSacYard":
        case "ArriveDestinationRecyclingCenter":
          break;

        /* 8️⃣ ENCODE DELIVERY */
        case "EncodeDeliveryDisposalSite":
        case "EncodeDeliverySacSacYard":
        case "EncodeDeliveryRecyclingCenter":
          (trip.deliveries ?? []).forEach((d: any) => {
            if (d.manifestPicturePath)
              images.push(fullUrl(`/Uploads/DeliveryUploads/ManifestPictures/${d.manifestPicturePath}`));

            if (d.cargoExitPicturePath)
              images.push(fullUrl(`/Uploads/DeliveryUploads/CargoExitPictures/${d.cargoExitPicturePath}`));
          });
          break;

        /* 9️⃣ FINISH TRIP */
        case "FinishTrip":
          if (trip.cleanedTruckPicture)
            images.push(fullUrl(`/Uploads/CleanedTruck/${trip.cleanedTruckPicture}`));
          break;
      }

      return {
        time: new Date(log.createdAt).toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit"
        }),
        label: log.logActivity,
        images,
        icon: chooseIcon(action),
      };
    });
  }, [trip, logs]);

  // --------------------------------------------------
  // CONDITIONAL RETURNS
  // --------------------------------------------------
  if (loading) return <p>Loading trip overview...</p>;
  if (!trip) return <p>Trip not found.</p>;

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------
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

      {/* BASIC INFO CARD */}
      <div className="bg-white p-6 rounded-lg shadow space-y-1 text-gray-700">
        <p><strong>Driver:</strong> {trip.driver}</p>
        <p><strong>Client:</strong> {trip.client}</p>
        <p><strong>Pick-up Date:</strong> {trip.pickUpDate?.slice(0, 10)}</p>
        <p><strong>Status:</strong> {trip.status}</p>
      </div>

      {/* TIMELINE */}
      <div className="space-y-4">
        {timelineSteps.length === 0 && (
          <p className="text-gray-500 italic">No activities recorded yet.</p>
        )}

        {timelineSteps.map((step, idx) => (
          <div
            key={idx}
            className="bg-white p-5 rounded-lg shadow-lg border border-gray-200"
          >
            {/* ICON + TIME */}
            <div className="flex items-center gap-3 mb-2">
              {step.icon}
              <span className="text-sm text-gray-500">{step.time}</span>
            </div>

            {/* LABEL */}
            <h2 className="text-lg font-semibold mb-1">{step.label}</h2>

            {/* IMAGES */}
            {step.images.length > 0 && (
              <div className="grid grid-cols-4 gap-3 mt-3">
                {step.images.map((img, i) => (
                  <div
                    key={i}
                    className="w-full h-28 bg-gray-100 rounded-lg overflow-hidden shadow hover:scale-105 transition cursor-pointer"
                    onClick={() => setSelectedImage(img)}
                  >
                    <Image
                      src={img}
                      width={200}
                      height={200}
                      alt="Timeline Image"
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
          className="fixed inset-0 bg-black/70 flex justify-center items-center z-50"
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
