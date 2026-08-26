"use client";

import { useState, useEffect, Suspense } from "react";
import WorkspaceShell from "../../components/WorkspaceShell";
import { useSearchParams } from "next/navigation";

type InvoiceItem = {
  id: string;
  name: string;
  quantity: number;
  price: number;
  tax: number; // tax percentage
};

type Invoice = {
  id: string;
  number: string;
  poNumber?: string;
  customer: string;
  customerEmail: string;
  amount: number;
  issueDate: string;
  dueDate: string;
  currency: string;
  paymentTerms: string;
  items: InvoiceItem[];
  subtotal: number;
  taxTotal: number;
  discount: number;
  shipping: number;
  notes?: string;
  terms?: string;
  attachments?: string[];
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

  useEffect(() => {
    if (searchParams.get("view")) {
      setActiveTab(searchParams.get("view") || "dashboard");
    }
  }, [searchParams]);

  // Initial Demo Invoices
  const [invoices, setInvoices] = useState<Invoice[]>([
    {
      id: "1",
      number: "INV-2026-001",
      poNumber: "PO-9921",
      customer: "Acme Corporation",
      customerEmail: "billing@acme.com",
      amount: 4500.00,
      issueDate: "2026-08-20",
      dueDate: "2026-09-20",
      currency: "USD ($)",
      paymentTerms: "Net 30",
      items: [
        { id: "i1", name: "Enterprise Software License", quantity: 1, price: 4000.00, tax: 8.5 },
        { id: "i2", name: "Implementation & Setup Support", quantity: 5, price: 100.00, tax: 0 },
      ],
      subtotal: 4500.00,
      taxTotal: 340.00,
      discount: 0,
      shipping: 0,
      status: "paid",
    },
    {
      id: "2",
      number: "INV-2026-002",
      poNumber: "PO-8812",
      customer: "Global Logistics LLC",
      customerEmail: "accounts@globallogistics.com",
      amount: 2850.50,
      issueDate: "2026-08-22",
      dueDate: "2026-09-06",
      currency: "USD ($)",
      paymentTerms: "Net 15",
      items: [
        { id: "i3", name: "Freight Dispatch System API", quantity: 1, price: 2850.50, tax: 0 },
      ],
      subtotal: 2850.50,
      taxTotal: 0,
      discount: 0,
      shipping: 0,
      status: "pending",
    },
    {
      id: "3",
      number: "INV-2026-003",
      poNumber: "PO-7729",
      customer: "Apex Tech Ventures",
      customerEmail: "finance@apextech.com",
      amount: 6700.00,
      issueDate: "2026-08-25",
      dueDate: "2026-09-25",
      currency: "USD ($)",
      paymentTerms: "Net 30",
      items: [
        { id: "i4", name: "Cloud Infrastructure Audit", quantity: 2, price: 3350.00, tax: 0 },
      ],
      subtotal: 6700.00,
      taxTotal: 0,
      discount: 0,
      shipping: 0,
      status: "pending",
    },
  ]);

  const [bills] = useState<Bill[]>([
    { id: "1", number: "BILL-2026-101", vendor: "AWS Cloud Services", amount: 1240.00, date: "2026-08-15", status: "paid" },
    { id: "2", number: "BILL-2026-102", vendor: "Office Space Holdings", amount: 3500.00, date: "2026-08-01", status: "paid" },
    { id: "3", number: "BILL-2026-103", vendor: "Fiber Telecom Corp", amount: 480.00, date: "2026-08-24", status: "pending" },
  ]);

  const [customers] = useState<Customer[]>([
    { id: "1", name: "Acme Corporation", email: "billing@acme.com", phone: "+1 (555) 234-5678", balance: 0.00 },
    { id: "2", name: "Global Logistics LLC", email: "accounts@globallogistics.com", phone: "+1 (555) 876-5432", balance: 2850.50 },
    { id: "3", name: "Apex Tech Ventures", email: "finance@apextech.com", phone: "+1 (555) 345-6789", balance: 6700.00 },
    { id: "4", name: "Starlight Digital", email: "payables@starlight.io", phone: "+1 (555) 987-6543", balance: 1250.00 },
  ]);

  const [vendors] = useState<Vendor[]>([
    { id: "1", name: "AWS Cloud Services", email: "billing@aws.com", category: "Infrastructure", balance: 0.00 },
    { id: "2", name: "Office Space Holdings", email: "lease@officespace.com", category: "Rent & Real Estate", balance: 0.00 },
    { id: "3", name: "Fiber Telecom Corp", email: "support@fibertelecom.net", category: "Utilities", balance: 480.00 },
  ]);

  // Modal State for New Invoice
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedInvoiceDetail, setSelectedInvoiceDetail] = useState<Invoice | null>(null);

  // Advanced Invoice Form State
  const [invNumber, setInvNumber] = useState(`INV-2026-00${invoices.length + 1}`);
  const [invPoNumber, setInvPoNumber] = useState("");
  const [invCustomer, setInvCustomer] = useState(customers[0].name);
  const [invCustomerEmail, setInvCustomerEmail] = useState(customers[0].email);
  const [invIssueDate, setInvIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [invDueDate, setInvDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  });
  const [invCurrency, setInvCurrency] = useState("USD ($)");
  const [invPaymentTerms, setInvPaymentTerms] = useState("Net 30");
  const [invItems, setInvItems] = useState<InvoiceItem[]>([
    { id: "1", name: "Software Development Services", quantity: 1, price: 1500.00, tax: 8.5 },
  ]);
  const [invDiscount, setInvDiscount] = useState<number>(0);
  const [invShipping, setInvShipping] = useState<number>(0);
  const [invNotes, setInvNotes] = useState("Thank you for your business!");
  const [invTerms, setInvTerms] = useState("Payment is due within payment terms. Late payments subject to 1.5% monthly fee.");
  const [invAttachments, setInvAttachments] = useState<File[]>([]);

  // Auto-sync email when customer changes
  const handleCustomerSelect = (customerName: string) => {
    setInvCustomer(customerName);
    const found = customers.find(c => c.name === customerName);
    if (found) {
      setInvCustomerEmail(found.email);
    }
  };

  // Line Items Controls
  const addLineItem = () => {
    setInvItems([
      ...invItems,
      { id: Date.now().toString(), name: "", quantity: 1, price: 0, tax: 0 },
    ]);
  };

  const updateLineItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setInvItems(invItems.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const removeLineItem = (id: string) => {
    if (invItems.length === 1) return;
    setInvItems(invItems.filter(item => item.id !== id));
  };

  // Calculations
  const calculatedSubtotal = invItems.reduce((acc, item) => acc + (item.quantity * item.price), 0);
  const calculatedTaxTotal = invItems.reduce((acc, item) => acc + ((item.quantity * item.price) * (item.tax / 100)), 0);
  const calculatedGrandTotal = Math.max(0, calculatedSubtotal + calculatedTaxTotal - invDiscount + invShipping);

  // File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setInvAttachments(prev => [...prev, ...filesArray]);
    }
  };

  const removeAttachment = (index: number) => {
    setInvAttachments(invAttachments.filter((_, i) => i !== index));
  };

  // Create Invoice Handler
  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();

    const newInvoice: Invoice = {
      id: Date.now().toString(),
      number: invNumber,
      poNumber: invPoNumber,
      customer: invCustomer,
      customerEmail: invCustomerEmail,
      amount: calculatedGrandTotal,
      issueDate: invIssueDate,
      dueDate: invDueDate,
      currency: invCurrency,
      paymentTerms: invPaymentTerms,
      items: invItems,
      subtotal: calculatedSubtotal,
      taxTotal: calculatedTaxTotal,
      discount: invDiscount,
      shipping: invShipping,
      notes: invNotes,
      terms: invTerms,
      attachments: invAttachments.map(f => f.name),
      status: "pending",
    };

    setInvoices([newInvoice, ...invoices]);
    setShowInvoiceModal(false);

    // Reset Form
    setInvNumber(`INV-2026-00${invoices.length + 2}`);
    setInvPoNumber("");
    setInvItems([{ id: "1", name: "", quantity: 1, price: 0, tax: 0 }]);
    setInvDiscount(0);
    setInvShipping(0);
    setInvAttachments([]);
  };

  const markInvoicePaid = (id: string) => {
    setInvoices(invoices.map(inv => inv.id === id ? { ...inv, status: "paid" } : inv));
  };

  // Calculations Overview
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
            <p className="text-sm text-[#5b6472]">Complete financial management, multi-item billing & ledger control</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-1 rounded-xl border border-[#d9e2ef] bg-[#f8faff] p-1">
          {[
            { id: "dashboard", label: "Dashboard" },
            { id: "invoices", label: "Invoices Studio" },
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

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm lg:col-span-2">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-[#1f2430]">Recent Invoices</h2>
                <button
                  onClick={() => setShowInvoiceModal(true)}
                  className="rounded-lg bg-[#6678c1] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#404d85]"
                >
                  + Create Invoice
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
                        <td className="py-3 text-[#5b6472]">{inv.issueDate}</td>
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

            <div className="space-y-4 rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm">
              <h2 className="text-base font-bold text-[#1f2430]">ERP Quick Shortcuts</h2>
              <div className="space-y-2">
                {[
                  { label: "📄 Create Invoice", action: () => setShowInvoiceModal(true) },
                  { label: "👥 View Customers", action: () => setActiveTab("customers") },
                  { label: "💸 View Bills", action: () => setActiveTab("bills") },
                  { label: "📈 P&L Statement", action: () => setActiveTab("reports") },
                ].map((act) => (
                  <button
                    key={act.label}
                    onClick={act.action}
                    className="flex w-full items-center justify-between rounded-xl border border-[#d9e2ef] p-3 text-left text-xs font-semibold text-[#1f2430] transition hover:bg-[#f8faff] hover:border-[#6678c1]"
                  >
                    <span>{act.label}</span>
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
              <p className="text-xs text-[#5b6472]">Full-featured invoicing engine with line-items, tax rules, and document uploads</p>
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
                    <th className="pb-3 font-semibold">PO #</th>
                    <th className="pb-3 font-semibold">Customer</th>
                    <th className="pb-3 font-semibold">Issue Date</th>
                    <th className="pb-3 font-semibold">Due Date</th>
                    <th className="pb-3 font-semibold">Total Amount</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d9e2ef]">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-[#f8faff]">
                      <td className="py-3.5 font-semibold text-[#1f2430]">{inv.number}</td>
                      <td className="py-3.5 text-xs text-[#5b6472]">{inv.poNumber || "-"}</td>
                      <td className="py-3.5 text-[#5b6472]">
                        <div className="font-medium text-[#1f2430]">{inv.customer}</div>
                        <div className="text-xs text-[#5b6472]">{inv.customerEmail}</div>
                      </td>
                      <td className="py-3.5 text-[#5b6472]">{inv.issueDate}</td>
                      <td className="py-3.5 text-[#5b6472]">{inv.dueDate}</td>
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
                      <td className="py-3.5 text-right space-x-2">
                        <button
                          onClick={() => setSelectedInvoiceDetail(inv)}
                          className="rounded-lg border border-[#d9e2ef] bg-white px-3 py-1 text-xs font-semibold text-[#5b6472] hover:bg-[#f8faff]"
                        >
                          View Details
                        </button>
                        {inv.status !== "paid" && (
                          <button
                            onClick={() => markInvoicePaid(inv.id)}
                            className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                          >
                            Mark Paid
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

      {/* ADVANCED FULL-FEATURED INVOICE CREATION MODAL */}
      {showInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="my-8 w-full max-w-4xl rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#d9e2ef] pb-4">
              <div>
                <h3 className="text-xl font-bold text-[#1f2430]">Akaunting Invoice Studio — New Invoice</h3>
                <p className="text-xs text-[#5b6472]">Fill in line items, tax rules, attachments, and payment terms</p>
              </div>
              <button
                onClick={() => setShowInvoiceModal(false)}
                className="rounded-lg p-2 text-[#5b6472] hover:bg-[#f8faff]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="mt-6 space-y-6">
              {/* Section 1: Customer & Metadata Grid */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Customer Name *</label>
                  <select
                    value={invCustomer}
                    onChange={(e) => handleCustomerSelect(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2.5 text-xs font-medium text-[#1f2430] bg-white"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Billing Email</label>
                  <input
                    type="email"
                    value={invCustomerEmail}
                    onChange={(e) => setInvCustomerEmail(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2.5 text-xs font-medium text-[#1f2430]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Currency</label>
                  <select
                    value={invCurrency}
                    onChange={(e) => setInvCurrency(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2.5 text-xs font-medium text-[#1f2430] bg-white"
                  >
                    <option value="USD ($)">USD ($)</option>
                    <option value="EUR (€)">EUR (€)</option>
                    <option value="GBP (£)">GBP (£)</option>
                    <option value="INR (₹)">INR (₹)</option>
                    <option value="CAD ($)">CAD ($)</option>
                    <option value="AUD ($)">AUD ($)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Invoice Number</label>
                  <input
                    type="text"
                    value={invNumber}
                    onChange={(e) => setInvNumber(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2.5 text-xs font-medium text-[#1f2430]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">PO / Order Reference #</label>
                  <input
                    type="text"
                    placeholder="e.g. PO-2026-90"
                    value={invPoNumber}
                    onChange={(e) => setInvPoNumber(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2.5 text-xs font-medium text-[#1f2430]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Payment Terms</label>
                  <select
                    value={invPaymentTerms}
                    onChange={(e) => setInvPaymentTerms(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2.5 text-xs font-medium text-[#1f2430] bg-white"
                  >
                    <option value="Due on Receipt">Due on Receipt</option>
                    <option value="Net 15">Net 15 Days</option>
                    <option value="Net 30">Net 30 Days</option>
                    <option value="Net 60">Net 60 Days</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Issue Date</label>
                  <input
                    type="date"
                    value={invIssueDate}
                    onChange={(e) => setInvIssueDate(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2.5 text-xs font-medium text-[#1f2430]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Due Date</label>
                  <input
                    type="date"
                    value={invDueDate}
                    onChange={(e) => setInvDueDate(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2.5 text-xs font-medium text-[#1f2430]"
                    required
                  />
                </div>
              </div>

              {/* Section 2: Dynamic Line Items Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-[#1f2430]">Line Items & Products</h4>
                  <button
                    type="button"
                    onClick={addLineItem}
                    className="rounded-lg bg-[#eef2fa] px-3 py-1.5 text-xs font-semibold text-[#6678c1] hover:bg-[#6678c1] hover:text-white transition"
                  >
                    + Add Line Item
                  </button>
                </div>

                <div className="overflow-x-auto rounded-xl border border-[#d9e2ef]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#f8faff] text-[#5b6472]">
                      <tr className="border-b border-[#d9e2ef]">
                        <th className="p-3 font-semibold">Item Description</th>
                        <th className="p-3 font-semibold w-24">Qty</th>
                        <th className="p-3 font-semibold w-32">Unit Price ($)</th>
                        <th className="p-3 font-semibold w-28">Tax Rate (%)</th>
                        <th className="p-3 font-semibold w-32 text-right">Amount ($)</th>
                        <th className="p-3 font-semibold w-12 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#d9e2ef]">
                      {invItems.map((item) => {
                        const lineTotal = item.quantity * item.price;
                        return (
                          <tr key={item.id} className="hover:bg-white">
                            <td className="p-2">
                              <input
                                type="text"
                                placeholder="Item name or service description"
                                value={item.name}
                                onChange={(e) => updateLineItem(item.id, "name", e.target.value)}
                                className="w-full rounded-lg border border-[#d9e2ef] p-2 text-xs text-[#1f2430]"
                                required
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => updateLineItem(item.id, "quantity", parseFloat(e.target.value) || 1)}
                                className="w-full rounded-lg border border-[#d9e2ef] p-2 text-xs text-[#1f2430]"
                                required
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                                value={item.price}
                                onChange={(e) => updateLineItem(item.id, "price", parseFloat(e.target.value) || 0)}
                                className="w-full rounded-lg border border-[#d9e2ef] p-2 text-xs text-[#1f2430]"
                                required
                              />
                            </td>
                            <td className="p-2">
                              <select
                                value={item.tax}
                                onChange={(e) => updateLineItem(item.id, "tax", parseFloat(e.target.value) || 0)}
                                className="w-full rounded-lg border border-[#d9e2ef] p-2 text-xs text-[#1f2430] bg-white"
                              >
                                <option value={0}>0% (None)</option>
                                <option value={5}>5% (VAT)</option>
                                <option value={8.5}>8.5% (State Tax)</option>
                                <option value={18}>18% (GST)</option>
                              </select>
                            </td>
                            <td className="p-2 text-right font-bold text-[#1f2430]">
                              ${lineTotal.toFixed(2)}
                            </td>
                            <td className="p-2 text-center">
                              <button
                                type="button"
                                onClick={() => removeLineItem(item.id)}
                                className="text-rose-500 hover:text-rose-700 font-bold"
                                title="Remove item"
                              >
                                ✕
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 3: Summary Totals & Adjustments */}
              <div className="flex flex-col sm:flex-row justify-between gap-6 border-t border-[#d9e2ef] pt-4">
                <div className="w-full sm:w-1/2 space-y-4">
                  {/* Document & Receipt Attachments Upload */}
                  <div>
                    <label className="block text-xs font-semibold text-[#5b6472]">Attach PO / Receipts / Documents</label>
                    <div className="mt-1 flex items-center gap-3">
                      <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-[#6678c1] bg-[#f8faff] px-4 py-2 text-xs font-semibold text-[#6678c1] hover:bg-[#eef2fa]">
                        <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
                          <path d="M4 16v1a2 2 0 002 2h8a2 2 0 002-2v-1M12 6l-2-2m0 0L8 6m2-2v8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Upload Files
                        <input type="file" multiple onChange={handleFileUpload} className="hidden" />
                      </label>
                      <span className="text-[11px] text-[#5b6472]">PDF, PNG, JPG, CSV up to 10MB</span>
                    </div>

                    {invAttachments.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {invAttachments.map((file, idx) => (
                          <div key={idx} className="flex items-center justify-between rounded-lg bg-[#f8faff] px-3 py-1.5 text-xs text-[#1f2430]">
                            <span>📄 {file.name}</span>
                            <button type="button" onClick={() => removeAttachment(idx)} className="text-rose-500 hover:text-rose-700">✕</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#5b6472]">Customer Notes</label>
                    <textarea
                      rows={2}
                      value={invNotes}
                      onChange={(e) => setInvNotes(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2.5 text-xs text-[#1f2430]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#5b6472]">Terms & Conditions</label>
                    <textarea
                      rows={2}
                      value={invTerms}
                      onChange={(e) => setInvTerms(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2.5 text-xs text-[#1f2430]"
                    />
                  </div>
                </div>

                {/* Right Summary Totals Box */}
                <div className="w-full sm:w-5/12 rounded-2xl border border-[#d9e2ef] bg-[#f8faff] p-4 space-y-3 text-xs">
                  <div className="flex justify-between text-[#5b6472]">
                    <span>Subtotal:</span>
                    <span className="font-bold text-[#1f2430]">${calculatedSubtotal.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-[#5b6472]">
                    <span>Tax Total:</span>
                    <span className="font-bold text-[#1f2430]">${calculatedTaxTotal.toFixed(2)}</span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[#5b6472]">Discount ($):</span>
                    <input
                      type="number"
                      min="0"
                      value={invDiscount}
                      onChange={(e) => setInvDiscount(parseFloat(e.target.value) || 0)}
                      className="w-24 rounded-lg border border-[#d9e2ef] p-1 text-right text-xs text-[#1f2430] bg-white"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[#5b6472]">Shipping Fee ($):</span>
                    <input
                      type="number"
                      min="0"
                      value={invShipping}
                      onChange={(e) => setInvShipping(parseFloat(e.target.value) || 0)}
                      className="w-24 rounded-lg border border-[#d9e2ef] p-1 text-right text-xs text-[#1f2430] bg-white"
                    />
                  </div>

                  <div className="border-t border-[#d9e2ef] pt-3 flex justify-between items-center text-sm font-bold text-[#6678c1]">
                    <span>Grand Total:</span>
                    <span className="text-lg">${calculatedGrandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="flex justify-end gap-3 border-t border-[#d9e2ef] pt-4">
                <button
                  type="button"
                  onClick={() => setShowInvoiceModal(false)}
                  className="rounded-xl border border-[#d9e2ef] px-5 py-2.5 text-xs font-semibold text-[#5b6472] hover:bg-[#f8faff]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#6678c1] px-6 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-[#404d85]"
                >
                  Create & Save Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW INVOICE DETAILS MODAL */}
      {selectedInvoiceDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-[#d9e2ef] pb-4">
              <div>
                <h3 className="text-lg font-bold text-[#1f2430]">{selectedInvoiceDetail.number}</h3>
                <p className="text-xs text-[#5b6472]">Issued for {selectedInvoiceDetail.customer}</p>
              </div>
              <button
                onClick={() => setSelectedInvoiceDetail(null)}
                className="rounded-lg p-2 text-[#5b6472] hover:bg-[#f8faff]"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[#5b6472]">Customer Email:</span>
                <div className="font-semibold text-[#1f2430]">{selectedInvoiceDetail.customerEmail}</div>
              </div>
              <div>
                <span className="text-[#5b6472]">PO Reference:</span>
                <div className="font-semibold text-[#1f2430]">{selectedInvoiceDetail.poNumber || "N/A"}</div>
              </div>
              <div>
                <span className="text-[#5b6472]">Issue Date:</span>
                <div className="font-semibold text-[#1f2430]">{selectedInvoiceDetail.issueDate}</div>
              </div>
              <div>
                <span className="text-[#5b6472]">Due Date:</span>
                <div className="font-semibold text-[#1f2430]">{selectedInvoiceDetail.dueDate}</div>
              </div>
            </div>

            <div className="rounded-xl border border-[#d9e2ef] overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f8faff] text-[#5b6472]">
                  <tr>
                    <th className="p-3 font-semibold">Item</th>
                    <th className="p-3 font-semibold">Qty</th>
                    <th className="p-3 font-semibold">Price</th>
                    <th className="p-3 font-semibold text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d9e2ef]">
                  {selectedInvoiceDetail.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-3 font-medium text-[#1f2430]">{item.name}</td>
                      <td className="p-3 text-[#5b6472]">{item.quantity}</td>
                      <td className="p-3 text-[#5b6472]">${item.price.toFixed(2)}</td>
                      <td className="p-3 font-bold text-[#1f2430] text-right">${(item.quantity * item.price).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center border-t border-[#d9e2ef] pt-4">
              <span className="text-sm font-bold text-[#5b6472]">Grand Total Amount:</span>
              <span className="text-xl font-bold text-[#6678c1]">${selectedInvoiceDetail.amount.toFixed(2)}</span>
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
