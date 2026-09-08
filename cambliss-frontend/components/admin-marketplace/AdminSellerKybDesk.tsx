"use client";

import { useState, useEffect } from "react";

export interface SellerKybApplication {
  id: string;
  businessName: string;
  tradeName: string;
  category: string;
  gstin: string;
  pan: string;
  bankName: string;
  accountNumber: string;
  warehouseCity: string;
  appliedDate: string;
  status: "Pending Review" | "Approved" | "Rejected";
}

const DEFAULT_APPLICATIONS: SellerKybApplication[] = [
  {
    id: "OC-KYB-2026-1001",
    businessName: "Sony India Private Limited",
    tradeName: "Sony Official Store",
    category: "Consumer Electronics",
    gstin: "29AABCU9603R1ZM",
    pan: "AABCU9603R",
    bankName: "Citibank N.A. India",
    accountNumber: "•••• 8912",
    warehouseCity: "Bengaluru, KA",
    appliedDate: "Sep 05, 2026",
    status: "Approved",
  },
  {
    id: "OC-KYB-2026-1002",
    businessName: "Keychron Peripherals LLP",
    tradeName: "Keychron India",
    category: "Computers & Laptops",
    gstin: "27AABCK8812R1ZZ",
    pan: "AABCK8812R",
    bankName: "HDFC Bank Ltd",
    accountNumber: "•••• 4091",
    warehouseCity: "Mumbai, MH",
    appliedDate: "Sep 06, 2026",
    status: "Approved",
  },
  {
    id: "OC-KYB-2026-1003",
    businessName: "Advani Hardware Retailers",
    tradeName: "Apex Electronics Hub",
    category: "Consumer Electronics",
    gstin: "27ABCDE1234F1Z5",
    pan: "ABCDE1234F",
    bankName: "ICICI Bank Ltd",
    accountNumber: "•••• 5821",
    warehouseCity: "Pune, MH",
    appliedDate: "Sep 07, 2026",
    status: "Pending Review",
  },
];

export const AdminSellerKybDesk = ({
  applications: propApplications,
  onApprove: propOnApprove,
  onReject: propOnReject,
}: {
  applications?: SellerKybApplication[];
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
}) => {
  const [apps, setApps] = useState<SellerKybApplication[]>(propApplications || DEFAULT_APPLICATIONS);
  const [filterStatus, setFilterStatus] = useState<"All" | "Pending Review" | "Approved" | "Rejected">("All");

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("office_connect_kyb_applications");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // merge stored ones at front
            setApps((prev) => {
              const ids = new Set(parsed.map((p: any) => p.id));
              const nonDuplicates = prev.filter((p) => !ids.has(p.id));
              return [...parsed, ...nonDuplicates];
            });
          }
        }
      } catch {
        // ignore
      }
    }
  }, []);

  const handleApprove = (id: string) => {
    if (propOnApprove) {
      propOnApprove(id);
    }
    setApps((prev) => {
      const updated = prev.map((a) => (a.id === id ? { ...a, status: "Approved" as const } : a));
      if (typeof window !== "undefined") {
        localStorage.setItem("office_connect_kyb_applications", JSON.stringify(updated));
      }
      return updated;
    });
  };

  const handleReject = (id: string) => {
    if (propOnReject) {
      propOnReject(id);
    }
    setApps((prev) => {
      const updated = prev.map((a) => (a.id === id ? { ...a, status: "Rejected" as const } : a));
      if (typeof window !== "undefined") {
        localStorage.setItem("office_connect_kyb_applications", JSON.stringify(updated));
      }
      return updated;
    });
  };

  const filteredApps = apps.filter((a) => (filterStatus === "All" ? true : a.status === filterStatus));

  return (
    <div className="space-y-4 select-none">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
            <span>🛡️</span>
            <span>3P Merchant KYB & GST Verification Queue ({filteredApps.length})</span>
          </h3>
          <p className="text-xs text-slate-500">
            Review legal business entities, GSTIN certificates, and escrow settlement bank accounts before marketplace activation.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
          {(["All", "Pending Review", "Approved", "Rejected"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilterStatus(tab)}
              className={`px-2.5 py-1 rounded text-[11px] font-bold transition ${
                filterStatus === tab
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Tracking ID & Merchant</th>
                <th className="py-3 px-4">GSTIN & PAN</th>
                <th className="py-3 px-4">Escrow Settlement Bank</th>
                <th className="py-3 px-4">Warehouse Location</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">KYB Decision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredApps.map((app) => (
                <tr key={app.id} className="hover:bg-slate-50/70 transition">
                  
                  {/* Entity & Name */}
                  <td className="py-3 px-4 space-y-0.5">
                    <span className="font-mono text-[10px] text-slate-400 font-bold block">{app.id}</span>
                    <span className="font-bold text-slate-900 block">{app.businessName}</span>
                    <span className="text-[11px] text-[#404d85] font-semibold">Store: {app.tradeName}</span>
                    <span className="text-[10px] text-slate-400 block">Applied on {app.appliedDate}</span>
                  </td>

                  {/* GSTIN / PAN */}
                  <td className="py-3 px-4 space-y-0.5 font-mono text-[11px]">
                    <span className="font-bold text-slate-800 block">GST: {app.gstin}</span>
                    <span className="text-slate-500">PAN: {app.pan}</span>
                  </td>

                  {/* Bank */}
                  <td className="py-3 px-4 space-y-0.5">
                    <span className="font-semibold text-slate-800 block">{app.bankName}</span>
                    <span className="text-[11px] font-mono text-slate-400">A/C: {app.accountNumber}</span>
                  </td>

                  {/* Location */}
                  <td className="py-3 px-4 font-semibold text-slate-700">
                    📍 {app.warehouseCity}
                  </td>

                  {/* Status */}
                  <td className="py-3 px-4">
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ${
                        app.status === "Approved"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : app.status === "Rejected"
                          ? "bg-red-50 text-red-700 border-red-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      ● {app.status}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right">
                    {app.status === "Pending Review" ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleApprove(app.id)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded transition shadow-2xs"
                        >
                          ✓ Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReject(app.id)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-red-50 text-red-600 font-bold text-xs rounded transition"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-semibold">{app.status}</span>
                    )}
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
