"use client";

import { useState, useEffect, Suspense } from "react";
import WorkspaceShell from "../../components/WorkspaceShell";
import { useSearchParams } from "next/navigation";

type InvoiceItem = {
  id: string;
  name: string;
  quantity: number;
  price: number;
  tax: number;
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

type OrganizationProfile = {
  id?: string;
  name: string;
  legalName: string;
  supportEmail: string;
  supportPhone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  panNumber: string;
  businessType: string;
  baseCurrency: string;
};

type UserProfile = {
  id?: string;
  email: string;
  firstName: string;
  lastName: string;
};

function AkauntingContent() {
  const searchParams = useSearchParams();
  const initialView = searchParams.get("view") || "dashboard";

  const [activeTab, setActiveTab] = useState<string>(initialView);
  const [loadingProfile, setLoadingProfile] = useState<boolean>(true);
  const [saveStatus, setSaveStatus] = useState<string>("");

  // Live User & Organization State
  const [userProfile, setUserProfile] = useState<UserProfile>({
    email: "",
    firstName: "",
    lastName: "",
  });

  const [orgProfile, setOrgProfile] = useState<OrganizationProfile>({
    name: "My Enterprise Organization",
    legalName: "",
    supportEmail: "",
    supportPhone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    country: "",
    panNumber: "",
    businessType: "Technology / SaaS",
    baseCurrency: "USD ($)",
  });

  // Real Organization Invoices State
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);

  // Fetch Live Auth & Organization Data from Backend API (/api/auth/me)
  useEffect(() => {
    const fetchLiveOrganizationData = async () => {
      try {
        setLoadingProfile(true);
        const token = localStorage.getItem("authToken");

        const response = await fetch("/api/auth/me", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            setUserProfile({
              id: data.user.id,
              email: data.user.email || "",
              firstName: data.user.firstName || "",
              lastName: data.user.lastName || "",
            });
          }

          if (data.organization) {
            setOrgProfile({
              id: data.organization.id,
              name: data.organization.name || "My Organization",
              legalName: data.organization.legalName || data.organization.name || "",
              supportEmail: data.organization.supportEmail || data.user?.email || "",
              supportPhone: data.organization.supportPhone || "",
              addressLine1: data.organization.addressLine1 || "",
              addressLine2: data.organization.addressLine2 || "",
              city: data.organization.city || "",
              state: data.organization.state || "",
              pincode: data.organization.pincode || "",
              country: data.organization.country || "",
              panNumber: data.organization.panNumber || "",
              businessType: data.organization.businessType || "Software & Technology",
              baseCurrency: data.organization.baseCurrency ? `${data.organization.baseCurrency} ($)` : "USD ($)",
            });
          }
        }
      } catch (err) {
        console.error("Failed to fetch user & organization details from backend", err);
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchLiveOrganizationData();
  }, []);

  useEffect(() => {
    if (searchParams.get("view")) {
      setActiveTab(searchParams.get("view") || "dashboard");
    }
  }, [searchParams]);

  // Modal State for New Invoice
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedInvoiceDetail, setSelectedInvoiceDetail] = useState<Invoice | null>(null);

  // Modal State for New Customer
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [newCustName, setNewCustName] = useState("");
  const [newCustEmail, setNewCustEmail] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");

  // Modal State for New Vendor
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [newVendName, setNewVendName] = useState("");
  const [newVendEmail, setNewVendEmail] = useState("");
  const [newVendCategory, setNewVendCategory] = useState("Services");

  // Advanced Invoice Form State
  const [invNumber, setInvNumber] = useState(`INV-2026-00${invoices.length + 1}`);
  const [invPoNumber, setInvPoNumber] = useState("");
  const [invCustomer, setInvCustomer] = useState("");
  const [invCustomerEmail, setInvCustomerEmail] = useState("");
  const [invIssueDate, setInvIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [invDueDate, setInvDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  });
  const [invCurrency, setInvCurrency] = useState(orgProfile.baseCurrency || "USD ($)");
  const [invPaymentTerms, setInvPaymentTerms] = useState("Net 30");
  const [invItems, setInvItems] = useState<InvoiceItem[]>([
    { id: "1", name: "Professional Services", quantity: 1, price: 500.00, tax: 0 },
  ]);
  const [invDiscount, setInvDiscount] = useState<number>(0);
  const [invShipping, setInvShipping] = useState<number>(0);
  const [invNotes, setInvNotes] = useState("Thank you for choosing " + (orgProfile.name || "our company") + "!");
  const [invTerms, setInvTerms] = useState("Payment is due within agreement terms.");
  const [invAttachments, setInvAttachments] = useState<File[]>([]);

  // Sync customer email when selection changes
  const handleCustomerSelect = (customerName: string) => {
    setInvCustomer(customerName);
    const found = customers.find(c => c.name === customerName);
    if (found) {
      setInvCustomerEmail(found.email);
    }
  };

  // Save Organization Details to Backend Database
  const handleSaveOrganizationProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus("Saving...");

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("/api/auth/me/organization", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: orgProfile.name,
          legalName: orgProfile.legalName,
          supportEmail: orgProfile.supportEmail,
          supportPhone: orgProfile.supportPhone,
          addressLine1: orgProfile.addressLine1,
          addressLine2: orgProfile.addressLine2,
          city: orgProfile.city,
          state: orgProfile.state,
          pincode: orgProfile.pincode,
          country: orgProfile.country,
          panNumber: orgProfile.panNumber,
          businessType: orgProfile.businessType,
        }),
      });

      if (response.ok) {
        setSaveStatus("Organization details saved to database successfully! ✅");
        setTimeout(() => setSaveStatus(""), 4000);
      } else {
        const err = await response.json();
        setSaveStatus(`Failed to save: ${err.message || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Save organization error:", err);
      setSaveStatus("Network error while saving details");
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

  // Invoice Calculations
  const calculatedSubtotal = invItems.reduce((acc, item) => acc + (item.quantity * item.price), 0);
  const calculatedTaxTotal = invItems.reduce((acc, item) => acc + ((item.quantity * item.price) * (item.tax / 100)), 0);
  const calculatedGrandTotal = Math.max(0, calculatedSubtotal + calculatedTaxTotal - invDiscount + invShipping);

  // Handle Create Invoice
  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();

    const newInvoice: Invoice = {
      id: Date.now().toString(),
      number: invNumber,
      poNumber: invPoNumber,
      customer: invCustomer || "Default Client",
      customerEmail: invCustomerEmail || orgProfile.supportEmail || userProfile.email,
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

  // Add New Customer
  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName) return;

    const newC: Customer = {
      id: Date.now().toString(),
      name: newCustName,
      email: newCustEmail,
      phone: newCustPhone,
      balance: 0.00,
    };

    setCustomers([...customers, newC]);
    setShowCustomerModal(false);
    setNewCustName("");
    setNewCustEmail("");
    setNewCustPhone("");
  };

  // Add New Vendor
  const handleAddVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVendName) return;

    const newV: Vendor = {
      id: Date.now().toString(),
      name: newVendName,
      email: newVendEmail,
      category: newVendCategory,
      balance: 0.00,
    };

    setVendors([...vendors, newV]);
    setShowVendorModal(false);
    setNewVendName("");
    setNewVendEmail("");
  };

  const markInvoicePaid = (id: string) => {
    setInvoices(invoices.map(inv => inv.id === id ? { ...inv, status: "paid" } : inv));
  };

  // Financial Calculations
  const totalRevenue = invoices.reduce((acc, curr) => acc + (curr.status === "paid" ? curr.amount : 0), 0);
  const totalPending = invoices.reduce((acc, curr) => acc + (curr.status !== "paid" ? curr.amount : 0), 0);
  const totalExpenses = bills.reduce((acc, curr) => acc + curr.amount, 0);
  const netProfit = totalRevenue - totalExpenses;

  return (
    <div className="space-y-6">
      {/* Real Organization Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#d9e2ef] bg-white p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#6678c1] to-[#404d85] text-white shadow-md font-bold text-lg">
            {orgProfile.name ? orgProfile.name.charAt(0) : "C"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-[#1f2430]">{orgProfile.name}</h1>
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                ACTIVE ORGANISATION
              </span>
            </div>
            <p className="text-xs text-[#5b6472]">
              Logged in as <strong className="text-[#1f2430]">{userProfile.firstName || userProfile.lastName ? `${userProfile.firstName} ${userProfile.lastName}`.trim() : "Admin"}</strong> ({userProfile.email || "Primary Account"})
            </p>
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
            { id: "settings", label: "Company Profile & ERP" },
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
              <div className="mt-1 text-xs font-medium text-emerald-600">↑ {invoices.filter(i => i.status === "paid").length} Paid invoices</div>
            </div>

            <div className="rounded-2xl border border-[#d9e2ef] bg-white p-5 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#5b6472]">Pending Receivables</div>
              <div className="mt-2 text-2xl font-bold text-amber-600">${totalPending.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
              <div className="mt-1 text-xs font-medium text-amber-600">{invoices.filter(i => i.status !== "paid").length} Outstanding</div>
            </div>

            <div className="rounded-2xl border border-[#d9e2ef] bg-white p-5 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#5b6472]">Total Expenses</div>
              <div className="mt-2 text-2xl font-bold text-rose-500">${totalExpenses.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
              <div className="mt-1 text-xs font-medium text-rose-500">Operational costs</div>
            </div>

            <div className="rounded-2xl border border-[#d9e2ef] bg-white p-5 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#5b6472]">Net Profit</div>
              <div className="mt-2 text-2xl font-bold text-[#6678c1]">${netProfit.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
              <div className="mt-1 text-xs font-medium text-emerald-600">Net margin</div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm lg:col-span-2">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-[#1f2430]">Organization Invoices ({orgProfile.name})</h2>
                <button
                  onClick={() => setShowInvoiceModal(true)}
                  className="rounded-lg bg-[#6678c1] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#404d85]"
                >
                  + Create Invoice
                </button>
              </div>

              <div className="mt-4 overflow-x-auto">
                {invoices.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[#d9e2ef] p-8 text-center text-xs text-[#5b6472]">
                    No invoices created yet for <strong className="text-[#1f2430]">{orgProfile.name}</strong>. Click <strong>+ Create Invoice</strong> to generate your first invoice!
                  </div>
                ) : (
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
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${inv.status === "paid" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                              {inv.status.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div className="space-y-4 rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm">
              <h2 className="text-base font-bold text-[#1f2430]">ERP Management</h2>
              <div className="space-y-2">
                {[
                  { label: "📄 Create Invoice", action: () => setShowInvoiceModal(true) },
                  { label: "👥 Add Customer Profile", action: () => setShowCustomerModal(true) },
                  { label: "🏢 Add Vendor Supplier", action: () => setShowVendorModal(true) },
                  { label: "⚙️ Edit Company Details", action: () => setActiveTab("settings") },
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
              <h2 className="text-lg font-bold text-[#1f2430]">Invoices Studio — {orgProfile.name}</h2>
              <p className="text-xs text-[#5b6472]">All billing issued under {orgProfile.legalName || orgProfile.name}</p>
            </div>
            <button
              onClick={() => setShowInvoiceModal(true)}
              className="rounded-xl bg-[#6678c1] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#404d85]"
            >
              + Create New Invoice
            </button>
          </div>

          <div className="rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm">
            {invoices.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#5b6472]">
                No invoices created yet. Click <strong>+ Create New Invoice</strong> to start billing clients!
              </div>
            ) : (
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
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${inv.status === "paid" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
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
            )}
          </div>
        </div>
      )}

      {/* CUSTOMERS TAB */}
      {activeTab === "customers" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-[#1f2430]">Customers Directory</h2>
              <p className="text-xs text-[#5b6472]">Manage customer contacts for {orgProfile.name}</p>
            </div>
            <button
              onClick={() => setShowCustomerModal(true)}
              className="rounded-xl bg-[#6678c1] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#404d85]"
            >
              + Add Customer
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {customers.map((c) => (
              <div key={c.id} className="rounded-2xl border border-[#d9e2ef] bg-white p-5 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef2fa] font-bold text-[#6678c1]">
                  {c.name.charAt(0)}
                </div>
                <h3 className="mt-3 font-bold text-[#1f2430]">{c.name}</h3>
                <p className="text-xs text-[#5b6472]">{c.email || "No email provided"}</p>
                <p className="text-xs text-[#5b6472]">{c.phone || "No phone provided"}</p>
                <div className="mt-4 border-t border-[#d9e2ef] pt-3 flex justify-between items-center text-xs">
                  <span className="text-[#5b6472]">Balance:</span>
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
              <p className="text-xs text-[#5b6472]">Vendor payables for {orgProfile.name}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#d9e2ef] text-[#5b6472]">
                    <th className="pb-3 font-semibold">Bill #</th>
                    <th className="pb-3 font-semibold">Vendor</th>
                    <th className="pb-3 font-semibold">Date</th>
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
              <p className="text-xs text-[#5b6472]">Suppliers for {orgProfile.name}</p>
            </div>
            <button
              onClick={() => setShowVendorModal(true)}
              className="rounded-xl bg-[#6678c1] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#404d85]"
            >
              + Add Vendor
            </button>
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
            <h2 className="text-lg font-bold text-[#1f2430]">Financial Statement — {orgProfile.name}</h2>
            <p className="text-xs text-[#5b6472]">Profit & Loss ledger report for {orgProfile.legalName || orgProfile.name}</p>

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

      {/* SETTINGS / COMPANY PROFILE TAB */}
      {activeTab === "settings" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-[#d9e2ef] pb-4">
              <div>
                <h2 className="text-lg font-bold text-[#1f2430]">Company Profile & Organization Details</h2>
                <p className="text-xs text-[#5b6472]">Shared across all SaaS modules (Akaunting, CRM, Invoicing, Store)</p>
              </div>
              {saveStatus && (
                <div className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 border border-emerald-200">
                  {saveStatus}
                </div>
              )}
            </div>

            <form onSubmit={handleSaveOrganizationProfile} className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Organization Display Name *</label>
                  <input
                    type="text"
                    value={orgProfile.name}
                    onChange={(e) => setOrgProfile({ ...orgProfile, name: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-3 text-xs font-medium text-[#1f2430]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Legal Registered Business Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Cambliss Technologies Pvt Ltd"
                    value={orgProfile.legalName}
                    onChange={(e) => setOrgProfile({ ...orgProfile, legalName: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-3 text-xs font-medium text-[#1f2430]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Business Support Email</label>
                  <input
                    type="email"
                    placeholder="e.g. billing@camblissstudio.com"
                    value={orgProfile.supportEmail}
                    onChange={(e) => setOrgProfile({ ...orgProfile, supportEmail: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-3 text-xs font-medium text-[#1f2430]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Support Phone Number</label>
                  <input
                    type="text"
                    placeholder="e.g. +1 (555) 019-2831"
                    value={orgProfile.supportPhone}
                    onChange={(e) => setOrgProfile({ ...orgProfile, supportPhone: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-3 text-xs font-medium text-[#1f2430]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Tax ID / PAN Number</label>
                  <input
                    type="text"
                    placeholder="e.g. ABCDE1234F or Tax ID"
                    value={orgProfile.panNumber}
                    onChange={(e) => setOrgProfile({ ...orgProfile, panNumber: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-3 text-xs font-medium text-[#1f2430]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Business Type / Category</label>
                  <input
                    type="text"
                    value={orgProfile.businessType}
                    onChange={(e) => setOrgProfile({ ...orgProfile, businessType: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-3 text-xs font-medium text-[#1f2430]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Address Line 1</label>
                  <input
                    type="text"
                    placeholder="Street address or suite #"
                    value={orgProfile.addressLine1}
                    onChange={(e) => setOrgProfile({ ...orgProfile, addressLine1: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-3 text-xs font-medium text-[#1f2430]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">City & State</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="City"
                      value={orgProfile.city}
                      onChange={(e) => setOrgProfile({ ...orgProfile, city: e.target.value })}
                      className="mt-1 w-1/2 rounded-xl border border-[#d9e2ef] p-3 text-xs font-medium text-[#1f2430]"
                    />
                    <input
                      type="text"
                      placeholder="State"
                      value={orgProfile.state}
                      onChange={(e) => setOrgProfile({ ...orgProfile, state: e.target.value })}
                      className="mt-1 w-1/2 rounded-xl border border-[#d9e2ef] p-3 text-xs font-medium text-[#1f2430]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  className="rounded-xl bg-[#6678c1] px-6 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-[#404d85]"
                >
                  Save Company Details to Database
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE INVOICE MODAL */}
      {showInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="my-8 w-full max-w-4xl rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#d9e2ef] pb-4">
              <div>
                <h3 className="text-xl font-bold text-[#1f2430]">New Invoice — {orgProfile.name}</h3>
                <p className="text-xs text-[#5b6472]">Issued from {orgProfile.legalName || orgProfile.name}</p>
              </div>
              <button
                onClick={() => setShowInvoiceModal(false)}
                className="rounded-lg p-2 text-[#5b6472] hover:bg-[#f8faff]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="mt-6 space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Customer Name *</label>
                  {customers.length > 0 ? (
                    <select
                      value={invCustomer}
                      onChange={(e) => handleCustomerSelect(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2.5 text-xs font-medium text-[#1f2430] bg-white"
                    >
                      {customers.map((c) => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="e.g. Acme Corp"
                      value={invCustomer}
                      onChange={(e) => setInvCustomer(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2.5 text-xs font-medium text-[#1f2430]"
                      required
                    />
                  )}
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

              {/* Line Items */}
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
                                placeholder="Service description"
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

              {/* Totals */}
              <div className="flex flex-col sm:flex-row justify-between gap-6 border-t border-[#d9e2ef] pt-4">
                <div className="w-full sm:w-1/2 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#5b6472]">Customer Notes</label>
                    <textarea
                      rows={2}
                      value={invNotes}
                      onChange={(e) => setInvNotes(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2.5 text-xs text-[#1f2430]"
                    />
                  </div>
                </div>

                <div className="w-full sm:w-5/12 rounded-2xl border border-[#d9e2ef] bg-[#f8faff] p-4 space-y-3 text-xs">
                  <div className="flex justify-between text-[#5b6472]">
                    <span>Subtotal:</span>
                    <span className="font-bold text-[#1f2430]">${calculatedSubtotal.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-[#5b6472]">
                    <span>Tax Total:</span>
                    <span className="font-bold text-[#1f2430]">${calculatedTaxTotal.toFixed(2)}</span>
                  </div>

                  <div className="border-t border-[#d9e2ef] pt-3 flex justify-between items-center text-sm font-bold text-[#6678c1]">
                    <span>Grand Total:</span>
                    <span className="text-lg">${calculatedGrandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

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
                  Create Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE CUSTOMER MODAL */}
      {showCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-[#1f2430]">Add New Customer</h3>
            <form onSubmit={handleAddCustomer} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#5b6472]">Customer / Company Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Apex Global Ltd"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2.5 text-xs font-medium text-[#1f2430]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5b6472]">Billing Email</label>
                <input
                  type="email"
                  placeholder="e.g. billing@apex.com"
                  value={newCustEmail}
                  onChange={(e) => setNewCustEmail(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2.5 text-xs font-medium text-[#1f2430]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5b6472]">Phone Number</label>
                <input
                  type="text"
                  placeholder="e.g. +1 (555) 019-2831"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2.5 text-xs font-medium text-[#1f2430]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCustomerModal(false)}
                  className="rounded-xl border border-[#d9e2ef] px-4 py-2 text-xs font-semibold text-[#5b6472] hover:bg-[#f8faff]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#6678c1] px-4 py-2 text-xs font-semibold text-white hover:bg-[#404d85]"
                >
                  Add Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE VENDOR MODAL */}
      {showVendorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-[#1f2430]">Add New Vendor / Supplier</h3>
            <form onSubmit={handleAddVendor} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#5b6472]">Vendor Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Cloudflare Inc"
                  value={newVendName}
                  onChange={(e) => setNewVendName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2.5 text-xs font-medium text-[#1f2430]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5b6472]">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. accounts@cloudflare.com"
                  value={newVendEmail}
                  onChange={(e) => setNewVendEmail(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2.5 text-xs font-medium text-[#1f2430]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5b6472]">Expense Category</label>
                <select
                  value={newVendCategory}
                  onChange={(e) => setNewVendCategory(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2.5 text-xs font-medium text-[#1f2430] bg-white"
                >
                  <option value="Infrastructure">Infrastructure</option>
                  <option value="Services">Services</option>
                  <option value="Rent & Real Estate">Rent & Real Estate</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Marketing">Marketing</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowVendorModal(false)}
                  className="rounded-xl border border-[#d9e2ef] px-4 py-2 text-xs font-semibold text-[#5b6472] hover:bg-[#f8faff]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#6678c1] px-4 py-2 text-xs font-semibold text-white hover:bg-[#404d85]"
                >
                  Add Vendor
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
                <p className="text-xs text-[#5b6472]">Issued by {orgProfile.name} to {selectedInvoiceDetail.customer}</p>
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
                <span className="text-[#5b6472]">Issued From:</span>
                <div className="font-bold text-[#1f2430]">{orgProfile.name}</div>
                <div className="text-[#5b6472]">{orgProfile.supportEmail || userProfile.email}</div>
              </div>
              <div>
                <span className="text-[#5b6472]">Billed To:</span>
                <div className="font-bold text-[#1f2430]">{selectedInvoiceDetail.customer}</div>
                <div className="text-[#5b6472]">{selectedInvoiceDetail.customerEmail}</div>
              </div>
            </div>

            <div className="rounded-xl border border-[#d9e2ef] overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f8faff] text-[#5b6472]">
                  <tr>
                    <th className="p-3 font-semibold">Item Description</th>
                    <th className="p-3 font-semibold">Qty</th>
                    <th className="p-3 font-semibold">Unit Price</th>
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
              <span className="text-sm font-bold text-[#5b6472]">Invoice Total:</span>
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
