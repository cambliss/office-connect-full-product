"use client";

import { useState, useEffect, Suspense } from "react";
import WorkspaceShell from "../../components/WorkspaceShell";
import { useSearchParams } from "next/navigation";

type Invoice = {
  id: string;
  number: string;
  customer: string;
  amount: number;
  date: string;
  status: "paid" | "pending" | "overdue";
};

type Bill = {
  id: string;
  number: string;
  vendor: string;
  amount: number;
  date: string;
  status: "paid" | "pending";
};

type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  balance: number;
};

type Vendor = {
  id: string;
  name: string;
  email: string;
  category: string;
  balance: number;
};

function AkauntingContent() {
  const searchParams = useSearchParams();
  const initialView = searchParams.get("view") || "dashboard";

  const [activeTab, setActiveTab] = useState<string>(initialView);

  // Sync activeTab when query parameter changes
  useEffect(() => {
    if (searchParams.get("view")) {
      setActiveTab(searchParams.get("view") || "dashboard");
    }
  }, [searchParams]);

  // Demo Data State
  const [invoices, setInvoices] = useState<Invoice[]>([
    { id: "1", number: "INV-2026-001", customer: "Acme Corporation", amount: 4500.00, date: "2026-08-20", status: "paid" },
    { id: "2", number: "INV-2026-002", customer: "Global Logistics LLC", amount: 2850.50, date: "2026-08-22", status: "pending" },
    { id: "3", number: "INV-2026-003", customer: "Apex Tech Ventures", amount: 6700.00, date: "2026-08-25", status: "pending" },
    { id: "4", number: "INV-2026-004", customer: "Starlight Digital", amount: 1250.00, date: "2026-08-10", status: "overdue" },
  ]);

  const [bills, setBills] = useState<Bill[]>([
    { id: "1", number: "BILL-2026-101", vendor: "AWS Cloud Services", amount: 1240.00, date: "2026-08-15", status: "paid" },
    { id: "2", number: "BILL-2026-102", vendor: "Office Space Holdings", amount: 3500.00, date: "2026-08-01", status: "paid" },
    { id: "3", number: "BILL-2026-103", vendor: "Fiber Telecom Corp", amount: 480.00, date: "2026-08-24", status: "pending" },
  ]);

  const [customers, setCustomers] = useState<Customer[]>([
    { id: "1", name: "Acme Corporation", email: "billing@acme.com", phone: "+1 (555) 234-5678", balance: 0.00 },
    { id: "2", name: "Global Logistics LLC", email: "accounts@globallogistics.com", phone: "+1 (555) 876-5432", balance: 2850.50 },
    { id: "3", name: "Apex Tech Ventures", email: "finance@apextech.com", phone: "+1 (555) 345-6789", balance: 6700.00 },
    { id: "4", name: "Starlight Digital", email: "payables@starlight.io", phone: "+1 (555) 987-6543", balance: 1250.00 },
  ]);

  const [vendors, setVendors] = useState<Vendor[]>([
    { id: "1", name: "AWS Cloud Services", email: "billing@aws.com", category: "Infrastructure", balance: 0.00 },
    { id: "2", name: "Office Space Holdings", email: "lease@officespace.com", category: "Rent & Real Estate", balance: 0.00 },
    { id: "3", name: "Fiber Telecom Corp", email: "support@fibertelecom.net", category: "Utilities", balance: 480.00 },
  ]);

  // Modal State for New Invoice
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [newInvCustomer, setNewInvCustomer] = useState("Acme Corporation");
  const [newInvAmount, setNewInvAmount] = useState("");

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvAmount || isNaN(Number(newInvAmount))) return;

    const newInvoice: Invoice = {
      id: Date.now().toString(),
      number: `INV-2026-00${invoices.length + 1}`,
      customer: newInvCustomer,
      amount: parseFloat(newInvAmount),
      date: new Date().toISOString().split("T")[0],
      status: "pending",
    };

    setInvoices([newInvoice, ...invoices]);
    setShowInvoiceModal(false);
    setNewInvAmount("");
  };

  const markInvoicePaid = (id: string) => {
    setInvoices(invoices.map(inv => inv.id === id ? { ...inv, status: "paid" } : inv));
  };

  // Calculations
  const totalRevenue = invoices.reduce((acc, curr) => acc + (curr.status === "paid" ? curr.amount : 0), 0);
  const totalPending = invoices.reduce((acc, curr) => acc + (curr.status !== "paid" ? curr.amount : 0), 0);
  const totalExpenses = bills.reduce((acc, curr) => acc + curr.amount, 0);
  const netProfit = totalRevenue - totalExpenses;

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
            <p className="text-sm text-[#5b6472]">Complete financial management, billing, reports & ledger control</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-1 rounded-xl border border-[#d9e2ef] bg-[#f8faff] p-1">
          {[
            { id: "dashboard", label: "Dashboard" },
            { id: "invoices", label: "Invoices" },
            { id: "customers", label: "Customers" },
            { id: "bills", label: "Bills & Expenses" },
            { id: "vendors", label: "Vendors" },
            { id: "reports", label: "Reports" },
            { id: "settings", label: "Settings" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                activeTab === tab.id
                  ? "bg-[#6678c1] text-white shadow-sm"
                  : "text-[#5b6472] hover:text-[#1f2430]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* DASHBOARD TAB */}
      {activeTab === "dashboard" && (
        <div className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-[#d9e2ef] bg-white p-5 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#5b6472]">Collected Revenue</div>
              <div className="mt-2 text-2xl font-bold text-[#1f2430]">${totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
              <div className="mt-1 text-xs font-medium text-emerald-600">↑ Paid invoices</div>
            </div>

            <div className="rounded-2xl border border-[#d9e2ef] bg-white p-5 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#5b6472]">Pending Receivables</div>
              <div className="mt-2 text-2xl font-bold text-amber-600">${totalPending.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
              <div className="mt-1 text-xs font-medium text-amber-600">Outstanding invoices</div>
            </div>

            <div className="rounded-2xl border border-[#d9e2ef] bg-white p-5 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#5b6472]">Total Expenses</div>
              <div className="mt-2 text-2xl font-bold text-rose-500">${totalExpenses.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
              <div className="mt-1 text-xs font-medium text-rose-500">Bills & operational expenses</div>
            </div>

            <div className="rounded-2xl border border-[#d9e2ef] bg-white p-5 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#5b6472]">Net Operating Profit</div>
              <div className="mt-2 text-2xl font-bold text-[#6678c1]">${netProfit.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
              <div className="mt-1 text-xs font-medium text-emerald-600">Net margin</div>
            </div>
          </div>

          {/* Quick Actions & Recent Activity */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm lg:col-span-2">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-[#1f2430]">Recent Invoices</h2>
                <button
                  onClick={() => setShowInvoiceModal(true)}
                  className="rounded-lg bg-[#6678c1] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#404d85]"
                >
                  + New Invoice
                </button>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#d9e2ef] text-[#5b6472]">
                      <th className="pb-3 font-semibold">Number</th>
                      <th className="pb-3 font-semibold">Customer</th>
                      <th className="pb-3 font-semibold">Date</th>
                      <th className="pb-3 font-semibold">Amount</th>
                      <th className="pb-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#d9e2ef]">
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-[#f8faff]">
                        <td className="py-3 font-medium text-[#1f2430]">{inv.number}</td>
                        <td className="py-3 text-[#5b6472]">{inv.customer}</td>
                        <td className="py-3 text-[#5b6472]">{inv.date}</td>
                        <td className="py-3 font-semibold text-[#1f2430]">${inv.amount.toFixed(2)}</td>
                        <td className="py-3">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              inv.status === "paid"
                                ? "bg-emerald-100 text-emerald-800"
                                : inv.status === "pending"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {inv.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quick ERP Shortcuts */}
            <div className="space-y-4 rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm">
              <h2 className="text-base font-bold text-[#1f2430]">ERP Quick Shortcuts</h2>
              <div className="space-y-2">
                {[
                  { label: "📄 Create Invoice", tab: "invoices" },
                  { label: "👥 Add New Customer", tab: "customers" },
                  { label: "💸 Record Vendor Bill", tab: "bills" },
                  { label: "📈 View P&L Report", tab: "reports" },
                  { label: "⚙️ General Settings", tab: "settings" },
                ].map((action) => (
                  <button
                    key={action.label}
                    onClick={() => setActiveTab(action.tab)}
                    className="flex w-full items-center justify-between rounded-xl border border-[#d9e2ef] p-3 text-left text-xs font-semibold text-[#1f2430] transition hover:bg-[#f8faff] hover:border-[#6678c1]"
                  >
                    <span>{action.label}</span>
                    <span className="text-[#6678c1]">→</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* INVOICES TAB */}
      {activeTab === "invoices" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-[#1f2430]">Invoices Studio</h2>
              <p className="text-xs text-[#5b6472]">Manage, create and dispatch accounts receivable</p>
            </div>
            <button
              onClick={() => setShowInvoiceModal(true)}
              className="rounded-xl bg-[#6678c1] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#404d85]"
            >
              + Create New Invoice
            </button>
          </div>

          <div className="rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#d9e2ef] text-[#5b6472]">
                    <th className="pb-3 font-semibold">Invoice #</th>
                    <th className="pb-3 font-semibold">Customer Name</th>
                    <th className="pb-3 font-semibold">Issue Date</th>
                    <th className="pb-3 font-semibold">Total Amount</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d9e2ef]">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-[#f8faff]">
                      <td className="py-3.5 font-semibold text-[#1f2430]">{inv.number}</td>
                      <td className="py-3.5 text-[#5b6472]">{inv.customer}</td>
                      <td className="py-3.5 text-[#5b6472]">{inv.date}</td>
                      <td className="py-3.5 font-bold text-[#1f2430]">${inv.amount.toFixed(2)}</td>
                      <td className="py-3.5">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            inv.status === "paid"
                              ? "bg-emerald-100 text-emerald-800"
                              : inv.status === "pending"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {inv.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3.5 text-right">
                        {inv.status !== "paid" && (
                          <button
                            onClick={() => markInvoicePaid(inv.id)}
                            className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                          >
                            Mark as Paid
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOMERS TAB */}
      {activeTab === "customers" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-[#1f2430]">Customers Directory</h2>
              <p className="text-xs text-[#5b6472]">Client profiles, billing contacts, and receivables balance</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {customers.map((c) => (
              <div key={c.id} className="rounded-2xl border border-[#d9e2ef] bg-white p-5 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef2fa] font-bold text-[#6678c1]">
                  {c.name.charAt(0)}
                </div>
                <h3 className="mt-3 font-bold text-[#1f2430]">{c.name}</h3>
                <p className="text-xs text-[#5b6472]">{c.email}</p>
                <p className="text-xs text-[#5b6472]">{c.phone}</p>
                <div className="mt-4 border-t border-[#d9e2ef] pt-3 flex justify-between items-center text-xs">
                  <span className="text-[#5b6472]">Outstanding Balance:</span>
                  <span className="font-bold text-[#1f2430]">${c.balance.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BILLS TAB */}
      {activeTab === "bills" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-[#1f2430]">Purchase Bills & Expenses</h2>
              <p className="text-xs text-[#5b6472]">Track vendor payables, operational expenses, and bill history</p>
            </div>
          </div>

          <div className="rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#d9e2ef] text-[#5b6472]">
                    <th className="pb-3 font-semibold">Bill #</th>
                    <th className="pb-3 font-semibold">Vendor</th>
                    <th className="pb-3 font-semibold">Bill Date</th>
                    <th className="pb-3 font-semibold">Amount</th>
                    <th className="pb-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d9e2ef]">
                  {bills.map((b) => (
                    <tr key={b.id} className="hover:bg-[#f8faff]">
                      <td className="py-3.5 font-semibold text-[#1f2430]">{b.number}</td>
                      <td className="py-3.5 text-[#5b6472]">{b.vendor}</td>
                      <td className="py-3.5 text-[#5b6472]">{b.date}</td>
                      <td className="py-3.5 font-bold text-[#1f2430]">${b.amount.toFixed(2)}</td>
                      <td className="py-3.5">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${b.status === "paid" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                          {b.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VENDORS TAB */}
      {activeTab === "vendors" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-[#1f2430]">Vendor Directory</h2>
              <p className="text-xs text-[#5b6472]">Supplier profiles and payables management</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {vendors.map((v) => (
              <div key={v.id} className="rounded-2xl border border-[#d9e2ef] bg-white p-5 shadow-sm">
                <span className="rounded-full bg-[#f8faff] px-2.5 py-1 text-xs font-semibold text-[#6678c1]">{v.category}</span>
                <h3 className="mt-3 font-bold text-[#1f2430]">{v.name}</h3>
                <p className="text-xs text-[#5b6472]">{v.email}</p>
                <div className="mt-4 border-t border-[#d9e2ef] pt-3 flex justify-between items-center text-xs">
                  <span className="text-[#5b6472]">Current Payable:</span>
                  <span className="font-bold text-[#1f2430]">${v.balance.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* REPORTS TAB */}
      {activeTab === "reports" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-[#1f2430]">Financial Reports & Profit & Loss Statement</h2>
            <p className="text-xs text-[#5b6472]">Real-time accounting ledger summary</p>

            <div className="mt-6 space-y-4 rounded-xl border border-[#d9e2ef] bg-[#f8faff] p-6 text-sm">
              <div className="flex justify-between border-b border-[#d9e2ef] pb-3 font-bold text-[#1f2430]">
                <span>Category</span>
                <span>YTD Amount</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Gross Invoiced Sales</span>
                <span>+${invoices.reduce((a, b) => a + b.amount, 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-rose-600 font-semibold">
                <span>Total Operating Expenses</span>
                <span>-${totalExpenses.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t-2 border-[#1f2430] pt-3 text-base font-bold text-[#6678c1]">
                <span>Net Operating Income</span>
                <span>${netProfit.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SETTINGS TAB */}
      {activeTab === "settings" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-[#1f2430]">Akaunting ERP Configuration</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-[#5b6472]">Base Currency</label>
                <input type="text" value="USD ($)" disabled className="mt-1 w-full rounded-xl border border-[#d9e2ef] bg-[#f8faff] p-3 text-xs font-medium text-[#1f2430]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5b6472]">Tax Rate (%)</label>
                <input type="text" value="8.5%" disabled className="mt-1 w-full rounded-xl border border-[#d9e2ef] bg-[#f8faff] p-3 text-xs font-medium text-[#1f2430]" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NEW INVOICE MODAL */}
      {showInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-[#1f2430]">Create New Invoice</h3>
            <form onSubmit={handleCreateInvoice} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#5b6472]">Customer</label>
                <select
                  value={newInvCustomer}
                  onChange={(e) => setNewInvCustomer(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-3 text-xs font-medium text-[#1f2430]"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5b6472]">Invoice Amount ($)</label>
                <input
                  type="number"
                  placeholder="e.g. 2500"
                  value={newInvAmount}
                  onChange={(e) => setNewInvAmount(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-3 text-xs font-medium text-[#1f2430]"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInvoiceModal(false)}
                  className="rounded-xl border border-[#d9e2ef] px-4 py-2 text-xs font-semibold text-[#5b6472] hover:bg-[#f8faff]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#6678c1] px-4 py-2 text-xs font-semibold text-white hover:bg-[#404d85]"
                >
                  Create & Save
                </button>
              </div>
            </form>
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
