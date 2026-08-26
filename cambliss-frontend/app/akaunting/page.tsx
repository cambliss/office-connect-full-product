"use client";

import { useEffect, useState, Suspense } from "react";
import WorkspaceShell from "../../components/WorkspaceShell";
import { useSearchParams } from "next/navigation";

function AkauntingContent() {
  const searchParams = useSearchParams();
  const view = searchParams.get("view") || "dashboard";

  const [ssoToken, setSsoToken] = useState<string | null>(null);
  const [akauntingUrl, setAkauntingUrl] = useState<string>("http://localhost:8000");
  const [viewMode, setViewMode] = useState<"embedded" | "cockpit">("cockpit");
  const [iframeError, setIframeError] = useState(false);

  useEffect(() => {
    const fetchSsoToken = async () => {
      try {
        const response = await fetch("/api/auth/sso-token", {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          if (data.token) {
            setSsoToken(data.token);
          }
        }
      } catch (err) {
        console.error("Failed to fetch SSO token for Akaunting", err);
      }
    };

    fetchSsoToken();
  }, []);

  const getTargetUrl = () => {
    if (!ssoToken) return `${akauntingUrl}/auth/login`;
    return `${akauntingUrl}/auth/sso?token=${ssoToken}&view=${view}`;
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#d9e2ef] bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#6678c1] to-[#404d85] text-white shadow-md">
            <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
              <path d="M12 2L2 7l10 5 10-5-10-5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
              <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#1f2430]">Akaunting ERP Suite</h1>
            <p className="text-sm text-[#5b6472]">Official open-source accounting engine & financial management</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-xl border border-[#d9e2ef] bg-[#f8faff] p-1">
            <button
              onClick={() => setViewMode("cockpit")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                viewMode === "cockpit"
                  ? "bg-[#6678c1] text-white shadow-sm"
                  : "text-[#5b6472] hover:text-[#1f2430]"
              }`}
            >
              ERP Cockpit
            </button>
            <button
              onClick={() => setViewMode("embedded")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                viewMode === "embedded"
                  ? "bg-[#6678c1] text-white shadow-sm"
                  : "text-[#5b6472] hover:text-[#1f2430]"
              }`}
            >
              Live Server Iframe
            </button>
          </div>

          {ssoToken && (
            <a
              href={getTargetUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-[#6678c1] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#404d85]"
            >
              <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
                <path d="M11 3h6v6M10 10l7-7M16 11v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Open Akaunting Standalone
            </a>
          )}
        </div>
      </div>

      {viewMode === "embedded" ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900 text-xs font-medium">
            <div className="flex items-center gap-2">
              <span className="text-base">ℹ️</span>
              <span>
                <strong>PHP Live Server Notice:</strong> If <code className="rounded bg-amber-100 px-1 py-0.5 font-mono">http://localhost:8000</code> is refusing to connect, ensure your PHP 8.2+ web server is running locally or deployed on VPS. Use <strong>ERP Cockpit</strong> view for integrated management.
              </span>
            </div>
            <button
              onClick={() => setViewMode("cockpit")}
              className="rounded-lg bg-amber-800 px-3 py-1 text-white hover:bg-amber-900"
            >
              Switch to ERP Cockpit
            </button>
          </div>

          <div className="relative flex h-[calc(100vh-280px)] w-full flex-col overflow-hidden rounded-2xl border border-[#d9e2ef] bg-white shadow-sm">
            <iframe
              src={getTargetUrl()}
              className="h-full w-full border-none"
              title="Akaunting ERP"
              allow="fullscreen"
              onError={() => setIframeError(true)}
            />
          </div>
        </div>
      ) : (
        /* Cockpit Fallback & Metrics Overview */
        <div className="space-y-6">
          {/* Key Financial Summary Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-[#d9e2ef] bg-white p-5 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#5b6472]">Total Revenue (YTD)</div>
              <div className="mt-2 text-2xl font-bold text-[#1f2430]">$128,450.00</div>
              <div className="mt-1 text-xs font-medium text-emerald-600">↑ 14.2% from last month</div>
            </div>

            <div className="rounded-2xl border border-[#d9e2ef] bg-white p-5 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#5b6472]">Operating Expenses</div>
              <div className="mt-2 text-2xl font-bold text-[#1f2430]">$42,120.00</div>
              <div className="mt-1 text-xs font-medium text-rose-500">↓ 3.8% efficiency gain</div>
            </div>

            <div className="rounded-2xl border border-[#d9e2ef] bg-white p-5 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#5b6472]">Net Profit</div>
              <div className="mt-2 text-2xl font-bold text-[#6678c1]">$86,330.00</div>
              <div className="mt-1 text-xs font-medium text-emerald-600">67.2% Net Margin</div>
            </div>

            <div className="rounded-2xl border border-[#d9e2ef] bg-white p-5 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#5b6472]">Unpaid Invoices</div>
              <div className="mt-2 text-2xl font-bold text-[#1f2430]">$14,200.00</div>
              <div className="mt-1 text-xs font-medium text-amber-600">3 invoices pending</div>
            </div>
          </div>

          {/* Quick Module Navigation Grid */}
          <div className="rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold text-[#1f2430]">Akaunting ERP Modules</h2>
            <p className="text-xs text-[#5b6472]">Select an accounting section to manage financial operations</p>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              {[
                { title: "Invoices Studio", desc: "Create, track, and dispatch customer invoices with tax calculations", icon: "📄", viewName: "invoices" },
                { title: "Customers & CRM", desc: "Manage client billing records, payment terms, and contact histories", icon: "👥", viewName: "customers" },
                { title: "Purchase Bills", desc: "Log vendor bills, expense receipts, and recurring purchase obligations", icon: "💸", viewName: "bills" },
                { title: "Vendors & Suppliers", desc: "Track supplier directory, payables, and purchase order tracking", icon: "🏢", viewName: "vendors" },
                { title: "Financial Reports", desc: "Generate Profit & Loss statements, balance sheets, and tax reports", icon: "📊", viewName: "reports" },
                { title: "ERP Settings", desc: "Configure currencies, chart of accounts, tax rates, and email templates", icon: "⚙️", viewName: "settings" },
              ].map((mod) => (
                <button
                  key={mod.title}
                  onClick={() => setViewMode("embedded")}
                  className="flex flex-col text-left rounded-xl border border-[#d9e2ef] p-4 transition hover:-translate-y-0.5 hover:border-[#6678c1] hover:shadow-md"
                >
                  <span className="text-2xl">{mod.icon}</span>
                  <span className="mt-2 text-sm font-bold text-[#1f2430]">{mod.title}</span>
                  <span className="mt-1 text-xs text-[#5b6472]">{mod.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AkauntingPage() {
  return (
    <WorkspaceShell>
      <Suspense
        fallback={
          <div className="flex h-[400px] w-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#6678c1] border-t-transparent" />
          </div>
        }
      >
        <AkauntingContent />
      </Suspense>
    </WorkspaceShell>
  );
}
