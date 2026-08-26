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

type BillItem = {
  id: string;
  name: string;
  quantity: number;
  price: number;
  tax: number;
};

type Bill = {
  id: string;
  number: string;
  vendorInvoiceNo?: string;
  vendor: string;
  vendorEmail?: string;
  amount: number;
  issueDate: string;
  dueDate: string;
  currency: string;
  paymentTerms: string;
  category: string;
  items: BillItem[];
  subtotal: number;
  taxTotal: number;
  discount: number;
  shipping: number;
  notes?: string;
  attachments?: string[];
  status: "paid" | "pending";
};

type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  balance: number;
  isCrmLead?: boolean;
  leadStatus?: string;
  estimatedValue?: number;
};

type Vendor = {
  id: string;
  name: string;
  contactPerson?: string;
  email: string;
  phone?: string;
  category: string;
  taxId?: string;
  website?: string;
  address?: string;
  city?: string;
  country?: string;
  bankName?: string;
  bankAccountNo?: string;
  bankIfsc?: string;
  paymentTerms?: string;
  balance: number;
};

type CrmLead = {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  email?: string;
  phone?: string;
  value?: number;
  status?: string;
  source?: string;
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

  // State Collections
  const [crmLeads, setCrmLeads] = useState<CrmLead[]>([]);
  const [loadingLeads, setLoadingLeads] = useState<boolean>(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([
    {
      id: "v1",
      name: "AWS Cloud Services",
      contactPerson: "Enterprise Accounts",
      email: "billing@aws.com",
      phone: "+1 (800) 289-4357",
      category: "Infrastructure",
      taxId: "TAX-AWS-9912",
      website: "https://aws.amazon.com",
      address: "410 Terry Ave N",
      city: "Seattle",
      country: "USA",
      bankName: "JPMorgan Chase",
      bankAccountNo: "****9921",
      bankIfsc: "CHASUS33",
      paymentTerms: "Net 30",
      balance: 0.00,
    },
    {
      id: "v2",
      name: "Office Space Holdings",
      contactPerson: "Leasing Office",
      email: "lease@officespace.com",
      phone: "+1 (555) 300-1200",
      category: "Rent & Real Estate",
      taxId: "TAX-OSH-4411",
      website: "https://officespace.com",
      address: "100 Commercial Blvd",
      city: "San Francisco",
      country: "USA",
      paymentTerms: "Due on Receipt",
      balance: 0.00,
    },
  ]);

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

  // Fetch Real CRM Leads from Backend API (/api/crm/leads)
  useEffect(() => {
    const fetchCrmLeads = async () => {
      try {
        setLoadingLeads(true);
        const token = localStorage.getItem("authToken");
        const res = await fetch("/api/crm/leads", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          credentials: "include",
        });

        if (res.ok) {
          const data = await res.json();
          const leadsArray: CrmLead[] = Array.isArray(data) ? data : (data.leads || data.data || []);
          setCrmLeads(leadsArray);

          const convertedLeadsAsCustomers: Customer[] = leadsArray.map(lead => ({
            id: `crm-${lead.id}`,
            name: lead.companyName || [lead.firstName, lead.lastName].filter(Boolean).join(" ") || lead.name || "CRM Lead",
            email: lead.email || "",
            phone: lead.phone || "",
            balance: 0.00,
            isCrmLead: true,
            leadStatus: lead.status || "NEW",
            estimatedValue: Number(lead.value) || 0,
          }));

          setCustomers(prev => {
            const nonLeadCustomers = prev.filter(c => !c.isCrmLead);
            return [...convertedLeadsAsCustomers, ...nonLeadCustomers];
          });
        }
      } catch (err) {
        console.error("Failed to fetch CRM leads from backend API", err);
      } finally {
        setLoadingLeads(false);
      }
    };

    fetchCrmLeads();
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

  // Comprehensive Modal State for New Vendor Profile
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [vendName, setVendName] = useState("");
  const [vendContactPerson, setVendContactPerson] = useState("");
  const [vendEmail, setVendEmail] = useState("");
  const [vendPhone, setVendPhone] = useState("");
  const [vendCategory, setVendCategory] = useState("Services");
  const [vendTaxId, setVendTaxId] = useState("");
  const [vendWebsite, setVendWebsite] = useState("");
  const [vendAddress, setVendAddress] = useState("");
  const [vendCity, setVendCity] = useState("");
  const [vendCountry, setVendCountry] = useState("USA");
  const [vendBankName, setVendBankName] = useState("");
  const [vendBankAccountNo, setVendBankAccountNo] = useState("");
  const [vendBankIfsc, setVendBankIfsc] = useState("");
  const [vendPaymentTerms, setVendPaymentTerms] = useState("Net 30");

  // Comprehensive Modal State for New Purchase Bill
  const [showBillModal, setShowBillModal] = useState(false);
  const [selectedBillDetail, setSelectedBillDetail] = useState<Bill | null>(null);

  const [billNumber, setBillNumber] = useState(`BILL-2026-00${bills.length + 1}`);
  const [billVendorInvoiceNo, setBillVendorInvoiceNo] = useState("");
  const [billVendor, setBillVendor] = useState(vendors[0]?.name || "AWS Cloud Services");
  const [billVendorEmail, setBillVendorEmail] = useState(vendors[0]?.email || "billing@aws.com");
  const [billCategory, setBillCategory] = useState("Infrastructure");
  const [billIssueDate, setBillIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [billDueDate, setBillDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  });
  const [billCurrency, setBillCurrency] = useState("USD ($)");
  const [billPaymentTerms, setBillPaymentTerms] = useState("Net 30");
  const [billItems, setBillItems] = useState<BillItem[]>([
    { id: "1", name: "Cloud Server Hosting & Resources", quantity: 1, price: 1200.00, tax: 0 },
  ]);
  const [billDiscount, setBillDiscount] = useState<number>(0);
  const [billShipping, setBillShipping] = useState<number>(0);
  const [billNotes, setBillNotes] = useState("Purchase bill for monthly vendor services.");
  const [billAttachments, setBillAttachments] = useState<File[]>([]);

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
    { id: "1", name: "Professional Services & Deliverables", quantity: 1, price: 500.00, tax: 0 },
  ]);
  const [invDiscount, setInvDiscount] = useState<number>(0);
  const [invShipping, setInvShipping] = useState<number>(0);
  const [invNotes, setInvNotes] = useState("Thank you for choosing " + (orgProfile.name || "our company") + "!");
  const [invTerms, setInvTerms] = useState("Payment is due within agreement terms.");
  const [invAttachments, setInvAttachments] = useState<File[]>([]);

  // Function to Convert CRM Lead directly to Invoice
  const convertCrmLeadToInvoice = (lead: CrmLead) => {
    const leadName = lead.companyName || [lead.firstName, lead.lastName].filter(Boolean).join(" ") || lead.name || "CRM Lead";
    const leadEmail = lead.email || orgProfile.supportEmail || userProfile.email;
    const leadVal = Number(lead.value) || 1000.00;

    setInvCustomer(leadName);
    setInvCustomerEmail(leadEmail);
    setInvPoNumber(`CRM-${lead.id.substring(0, 6)}`);
    setInvItems([
      { id: "1", name: `Services Package for ${leadName}`, quantity: 1, price: leadVal, tax: 0 },
    ]);
    setShowInvoiceModal(true);
  };

  // Sync customer email when selection changes
  const handleCustomerSelect = (customerName: string) => {
    setInvCustomer(customerName);
    const found = customers.find(c => c.name === customerName);
    if (found) {
      setInvCustomerEmail(found.email);
      if (found.estimatedValue && found.estimatedValue > 0) {
        setInvItems([
          { id: "1", name: `Project Package for ${customerName}`, quantity: 1, price: found.estimatedValue, tax: 0 },
        ]);
      }
    }
  };

  // Sync vendor details when vendor selection changes
  const handleVendorSelect = (vendorName: string) => {
    setBillVendor(vendorName);
    const found = vendors.find(v => v.name === vendorName);
    if (found) {
      setBillVendorEmail(found.email);
      setBillCategory(found.category);
      if (found.paymentTerms) setBillPaymentTerms(found.paymentTerms);
    }
  };

  // Save Organization Profile
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

  // Invoice Line Items Controls
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

  // Bill Line Items Controls
  const addBillLineItem = () => {
    setBillItems([
      ...billItems,
      { id: Date.now().toString(), name: "", quantity: 1, price: 0, tax: 0 },
    ]);
  };

  const updateBillLineItem = (id: string, field: keyof BillItem, value: string | number) => {
    setBillItems(billItems.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const removeBillLineItem = (id: string) => {
    if (billItems.length === 1) return;
    setBillItems(billItems.filter(item => item.id !== id));
  };

  // Calculations
  const calculatedSubtotal = invItems.reduce((acc, item) => acc + (item.quantity * item.price), 0);
  const calculatedTaxTotal = invItems.reduce((acc, item) => acc + ((item.quantity * item.price) * (item.tax / 100)), 0);
  const calculatedGrandTotal = Math.max(0, calculatedSubtotal + calculatedTaxTotal - invDiscount + invShipping);

  const calculatedBillSubtotal = billItems.reduce((acc, item) => acc + (item.quantity * item.price), 0);
  const calculatedBillTaxTotal = billItems.reduce((acc, item) => acc + ((item.quantity * item.price) * (item.tax / 100)), 0);
  const calculatedBillGrandTotal = Math.max(0, calculatedBillSubtotal + calculatedBillTaxTotal - billDiscount + billShipping);

  // Create Invoice
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

    setInvNumber(`INV-2026-00${invoices.length + 2}`);
    setInvPoNumber("");
    setInvItems([{ id: "1", name: "", quantity: 1, price: 0, tax: 0 }]);
    setInvDiscount(0);
    setInvShipping(0);
    setInvAttachments([]);
  };

  // Create Purchase Bill
  const handleCreateBill = (e: React.FormEvent) => {
    e.preventDefault();

    const newBill: Bill = {
      id: Date.now().toString(),
      number: billNumber,
      vendorInvoiceNo: billVendorInvoiceNo,
      vendor: billVendor,
      vendorEmail: billVendorEmail,
      amount: calculatedBillGrandTotal,
      issueDate: billIssueDate,
      dueDate: billDueDate,
      currency: billCurrency,
      paymentTerms: billPaymentTerms,
      category: billCategory,
      items: billItems,
      subtotal: calculatedBillSubtotal,
      taxTotal: calculatedBillTaxTotal,
      discount: billDiscount,
      shipping: billShipping,
      notes: billNotes,
      attachments: billAttachments.map(f => f.name),
      status: "pending",
    };

    setBills([newBill, ...bills]);
    setShowBillModal(false);

    setBillNumber(`BILL-2026-00${bills.length + 2}`);
    setBillVendorInvoiceNo("");
    setBillItems([{ id: "1", name: "", quantity: 1, price: 0, tax: 0 }]);
    setBillDiscount(0);
    setBillShipping(0);
    setBillAttachments([]);
  };

  // Add Comprehensive New Vendor Profile
  const handleAddVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendName) return;

    const newV: Vendor = {
      id: Date.now().toString(),
      name: vendName,
      contactPerson: vendContactPerson,
      email: vendEmail,
      phone: vendPhone,
      category: vendCategory,
      taxId: vendTaxId,
      website: vendWebsite,
      address: vendAddress,
      city: vendCity,
      country: vendCountry,
      bankName: vendBankName,
      bankAccountNo: vendBankAccountNo,
      bankIfsc: vendBankIfsc,
      paymentTerms: vendPaymentTerms,
      balance: 0.00,
    };

    setVendors([...vendors, newV]);
    setShowVendorModal(false);

    // Reset Form
    setVendName("");
    setVendContactPerson("");
    setVendEmail("");
    setVendPhone("");
    setVendTaxId("");
    setVendWebsite("");
    setVendAddress("");
    setVendCity("");
    setVendBankName("");
    setVendBankAccountNo("");
    setVendBankIfsc("");
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

  const markInvoicePaid = (id: string) => {
    setInvoices(invoices.map(inv => inv.id === id ? { ...inv, status: "paid" } : inv));
  };

  const markBillPaid = (id: string) => {
    setBills(bills.map(b => b.id === id ? { ...b, status: "paid" } : b));
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
            { id: "crm-leads", label: `CRM Leads (${crmLeads.length})` },
            { id: "customers", label: "Customers" },
            { id: "bills", label: "Bills & Expenses" },
            { id: "vendors", label: "Vendors & Suppliers" },
            { id: "reports", label: "Reports" },
            { id: "settings", label: "Company Profile" },
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
              <div className="text-xs font-semibold uppercase tracking-wider text-[#5b6472]">Total Bills & Expenses</div>
              <div className="mt-2 text-2xl font-bold text-rose-500">${totalExpenses.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
              <div className="mt-1 text-xs font-medium text-rose-500">{bills.length} Purchase bills logged</div>
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
                    No invoices created yet for <strong className="text-[#1f2430]">{orgProfile.name}</strong>. Click <strong>+ Create Invoice</strong> or fetch a lead from <strong>CRM Leads</strong> to generate an invoice!
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
              <h2 className="text-base font-bold text-[#1f2430]">ERP Quick Actions</h2>
              <div className="space-y-2">
                {[
                  { label: "📄 Create Invoice", action: () => setShowInvoiceModal(true) },
                  { label: "💸 Record Vendor Bill", action: () => setShowBillModal(true) },
                  { label: "🏢 Add New Vendor / Supplier", action: () => setShowVendorModal(true) },
                  { label: "📥 Convert CRM Lead", action: () => setActiveTab("crm-leads") },
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

      {/* CRM LEADS TAB */}
      {activeTab === "crm-leads" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-[#1f2430]">CRM Leads → Invoice Converter</h2>
              <p className="text-xs text-[#5b6472]">Fetch live CRM leads created in CRM module and generate invoices in 1 click</p>
            </div>
          </div>

          <div className="rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm">
            {loadingLeads ? (
              <div className="py-12 text-center text-xs text-[#5b6472]">Loading leads from CRM database...</div>
            ) : crmLeads.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <div className="text-sm font-semibold text-[#1f2430]">No active CRM leads found in database</div>
                <p className="text-xs text-[#5b6472]">Create a lead under the <strong>CRM</strong> tab in the sidebar menu to convert it to an invoice here!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {crmLeads.map((lead) => {
                  const leadName = lead.companyName || [lead.firstName, lead.lastName].filter(Boolean).join(" ") || lead.name || "Unnamed Lead";
                  const leadVal = Number(lead.value) || 0;
                  return (
                    <div key={lead.id} className="flex flex-col justify-between rounded-2xl border border-[#d9e2ef] bg-white p-5 shadow-sm space-y-4">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold text-blue-800">
                            CRM LEAD
                          </span>
                          <span className="text-xs font-semibold text-emerald-600">${leadVal.toFixed(2)}</span>
                        </div>
                        <h3 className="mt-3 font-bold text-[#1f2430]">{leadName}</h3>
                        <p className="text-xs text-[#5b6472]">{lead.email || "No email provided"}</p>
                        <p className="text-xs text-[#5b6472]">{lead.phone || "No phone provided"}</p>
                        <div className="mt-2 text-[11px] text-[#5b6472]">Status: <strong className="text-[#1f2430]">{lead.status || "NEW"}</strong></div>
                      </div>

                      <button
                        onClick={() => convertCrmLeadToInvoice(lead)}
                        className="w-full rounded-xl bg-[#6678c1] py-2 text-xs font-bold text-white shadow-sm hover:bg-[#404d85] transition"
                      >
                        ⚡ Convert Lead to Invoice
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
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
                No invoices created yet. Click <strong>+ Create New Invoice</strong> or fetch a lead from <strong>CRM Leads</strong> tab!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#d9e2ef] text-[#5b6472]">
                      <th className="pb-3 font-semibold">Invoice #</th>
                      <th className="pb-3 font-semibold">PO / Ref #</th>
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

      {/* BILLS TAB */}
      {activeTab === "bills" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-[#1f2430]">Purchase Bills & Expenses</h2>
              <p className="text-xs text-[#5b6472]">Full multi-item purchase bill creation & expense tracking for {orgProfile.name}</p>
            </div>
            <button
              onClick={() => setShowBillModal(true)}
              className="rounded-xl bg-[#6678c1] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#404d85]"
            >
              + Record Vendor Bill
            </button>
          </div>

          <div className="rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#d9e2ef] text-[#5b6472]">
                    <th className="pb-3 font-semibold">Bill #</th>
                    <th className="pb-3 font-semibold">Vendor Invoice #</th>
                    <th className="pb-3 font-semibold">Vendor</th>
                    <th className="pb-3 font-semibold">Category</th>
                    <th className="pb-3 font-semibold">Issue Date</th>
                    <th className="pb-3 font-semibold">Amount</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d9e2ef]">
                  {bills.map((b) => (
                    <tr key={b.id} className="hover:bg-[#f8faff]">
                      <td className="py-3.5 font-semibold text-[#1f2430]">{b.number}</td>
                      <td className="py-3.5 text-xs text-[#5b6472]">{b.vendorInvoiceNo || "-"}</td>
                      <td className="py-3.5 text-[#5b6472]">
                        <div className="font-medium text-[#1f2430]">{b.vendor}</div>
                        <div className="text-xs text-[#5b6472]">{b.vendorEmail}</div>
                      </td>
                      <td className="py-3.5 text-xs font-medium text-[#6678c1]">{b.category}</td>
                      <td className="py-3.5 text-[#5b6472]">{b.issueDate}</td>
                      <td className="py-3.5 font-bold text-[#1f2430]">${b.amount.toFixed(2)}</td>
                      <td className="py-3.5">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${b.status === "paid" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                          {b.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3.5 text-right space-x-2">
                        {b.status !== "paid" && (
                          <button
                            onClick={() => markBillPaid(b.id)}
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

      {/* VENDORS & SUPPLIERS TAB */}
      {activeTab === "vendors" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-[#1f2430]">Vendor & Supplier Directory</h2>
              <p className="text-xs text-[#5b6472]">Complete vendor profiles with tax IDs, banking details, and addresses for {orgProfile.name}</p>
            </div>
            <button
              onClick={() => setShowVendorModal(true)}
              className="rounded-xl bg-[#6678c1] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#404d85]"
            >
              + Add New Vendor
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {vendors.map((v) => (
              <div key={v.id} className="rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-[#d9e2ef] pb-3">
                  <span className="rounded-full bg-[#f8faff] px-3 py-1 text-xs font-semibold text-[#6678c1] border border-[#d9e2ef]">
                    {v.category}
                  </span>
                  <span className="text-xs text-[#5b6472]">Terms: <strong>{v.paymentTerms || "Net 30"}</strong></span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-[#1f2430]">{v.name}</h3>
                  {v.contactPerson && <p className="text-xs font-medium text-[#6678c1]">Attn: {v.contactPerson}</p>}
                </div>

                <div className="space-y-1.5 text-xs text-[#5b6472]">
                  <div className="flex items-center gap-2">
                    <span>📧 {v.email}</span>
                  </div>
                  {v.phone && <div className="flex items-center gap-2"><span>📞 {v.phone}</span></div>}
                  {v.taxId && <div>GSTIN / Tax ID: <strong className="text-[#1f2430]">{v.taxId}</strong></div>}
                  {v.address && <div>Address: {v.address}, {v.city || ""} ({v.country || ""})</div>}
                  {v.bankName && (
                    <div className="mt-2 rounded-xl bg-[#f8faff] p-2.5 border border-[#d9e2ef] text-[11px]">
                      <div className="font-bold text-[#1f2430]">🏦 Bank Account Details:</div>
                      <div>Bank: {v.bankName}</div>
                      <div>A/C: {v.bankAccountNo} {v.bankIfsc ? `| IFSC: ${v.bankIfsc}` : ""}</div>
                    </div>
                  )}
                </div>

                <div className="border-t border-[#d9e2ef] pt-3 flex justify-between items-center text-xs">
                  <span className="text-[#5b6472]">Current Payable Balance:</span>
                  <span className="font-bold text-[#1f2430]">${v.balance.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* COMPREHENSIVE NEW VENDOR CREATION MODAL */}
      {showVendorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="my-8 w-full max-w-3xl rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#d9e2ef] pb-4">
              <div>
                <h3 className="text-xl font-bold text-[#1f2430]">Add New Vendor / Supplier Profile</h3>
                <p className="text-xs text-[#5b6472]">Enter full vendor details including tax IDs, banking information, and billing address</p>
              </div>
              <button onClick={() => setShowVendorModal(false)} className="rounded-lg p-2 text-[#5b6472] hover:bg-[#f8faff]">✕</button>
            </div>

            <form onSubmit={handleAddVendor} className="mt-6 space-y-6">
              {/* Basic Info */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#6678c1]">1. General Company & Contact Information</h4>
                <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-[#5b6472]">Vendor / Company Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Amazon Web Services Inc"
                      value={vendName}
                      onChange={(e) => setVendName(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2.5 text-xs font-medium text-[#1f2430]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#5b6472]">Contact Person / Manager</label>
                    <input
                      type="text"
                      placeholder="e.g. John Smith"
                      value={vendContactPerson}
                      onChange={(e) => setVendContactPerson(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2.5 text-xs font-medium text-[#1f2430]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#5b6472]">Email Address *</label>
                    <input
                      type="email"
                      placeholder="e.g. billing@vendor.com"
                      value={vendEmail}
                      onChange={(e) => setVendEmail(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2.5 text-xs font-medium text-[#1f2430]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#5b6472]">Phone Number</label>
                    <input
                      type="text"
                      placeholder="e.g. +1 (555) 019-2831"
                      value={vendPhone}
                      onChange={(e) => setVendPhone(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2.5 text-xs font-medium text-[#1f2430]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#5b6472]">Expense Category</label>
                    <select
                      value={vendCategory}
                      onChange={(e) => setVendCategory(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2.5 text-xs font-medium text-[#1f2430] bg-white"
                    >
                      <option value="Infrastructure">Infrastructure & Cloud</option>
                      <option value="Services">Professional Services</option>
                      <option value="Hardware">Hardware & Equipment</option>
                      <option value="Rent & Real Estate">Rent & Real Estate</option>
                      <option value="Utilities">Utilities & Telecom</option>
                      <option value="Marketing">Marketing & Ads</option>
                      <option value="Logistics">Logistics & Freight</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#5b6472]">Payment Terms</label>
                    <select
                      value={vendPaymentTerms}
                      onChange={(e) => setVendPaymentTerms(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2.5 text-xs font-medium text-[#1f2430] bg-white"
                    >
                      <option value="Due on Receipt">Due on Receipt</option>
                      <option value="Net 15">Net 15 Days</option>
                      <option value="Net 30">Net 30 Days</option>
                      <option value="Net 60">Net 60 Days</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Tax & Address */}
              <div className="border-t border-[#d9e2ef] pt-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#6678c1]">2. Tax Details & Address</h4>
                <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#5b6472]">Tax ID / GSTIN / PAN</label>
                    <input
                      type="text"
                      placeholder="e.g. TAX-99120"
                      value={vendTaxId}
                      onChange={(e) => setVendTaxId(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2.5 text-xs font-medium text-[#1f2430]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#5b6472]">Website URL</label>
                    <input
                      type="url"
                      placeholder="https://vendor.com"
                      value={vendWebsite}
                      onChange={(e) => setVendWebsite(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2.5 text-xs font-medium text-[#1f2430]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#5b6472]">City & Country</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="City"
                        value={vendCity}
                        onChange={(e) => setVendCity(e.target.value)}
                        className="mt-1 w-1/2 rounded-xl border border-[#d9e2ef] p-2.5 text-xs font-medium text-[#1f2430]"
                      />
                      <input
                        type="text"
                        placeholder="Country"
                        value={vendCountry}
                        onChange={(e) => setVendCountry(e.target.value)}
                        className="mt-1 w-1/2 rounded-xl border border-[#d9e2ef] p-2.5 text-xs font-medium text-[#1f2430]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Banking & Settlement */}
              <div className="border-t border-[#d9e2ef] pt-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#6678c1]">3. Bank Account & Settlement Info</h4>
                <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#5b6472]">Bank Name</label>
                    <input
                      type="text"
                      placeholder="e.g. JPMorgan Chase"
                      value={vendBankName}
                      onChange={(e) => setVendBankName(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2.5 text-xs font-medium text-[#1f2430]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#5b6472]">Account Number</label>
                    <input
                      type="text"
                      placeholder="e.g. 987654321"
                      value={vendBankAccountNo}
                      onChange={(e) => setVendBankAccountNo(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2.5 text-xs font-medium text-[#1f2430]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#5b6472]">IFSC / SWIFT Code</label>
                    <input
                      type="text"
                      placeholder="e.g. CHASUS33"
                      value={vendBankIfsc}
                      onChange={(e) => setVendBankIfsc(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2.5 text-xs font-medium text-[#1f2430]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-[#d9e2ef] pt-4">
                <button
                  type="button"
                  onClick={() => setShowVendorModal(false)}
                  className="rounded-xl border border-[#d9e2ef] px-5 py-2.5 text-xs font-semibold text-[#5b6472] hover:bg-[#f8faff]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#6678c1] px-6 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-[#404d85]"
                >
                  Save Vendor Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COMPREHENSIVE NEW PURCHASE BILL CREATION MODAL */}
      {showBillModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="my-8 w-full max-w-4xl rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#d9e2ef] pb-4">
              <div>
                <h3 className="text-xl font-bold text-[#1f2430]">Record New Purchase Bill / Expense</h3>
                <p className="text-xs text-[#5b6472]">Log vendor invoice, line items, and expense category for {orgProfile.name}</p>
              </div>
              <button onClick={() => setShowBillModal(false)} className="rounded-lg p-2 text-[#5b6472] hover:bg-[#f8faff]">✕</button>
            </div>

            <form onSubmit={handleCreateBill} className="mt-6 space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Select Vendor *</label>
                  <select
                    value={billVendor}
                    onChange={(e) => handleVendorSelect(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2.5 text-xs font-medium text-[#1f2430] bg-white"
                  >
                    {vendors.map((v) => (
                      <option key={v.id} value={v.name}>{v.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Vendor Invoice Number</label>
                  <input
                    type="text"
                    placeholder="e.g. INV-VEND-992"
                    value={billVendorInvoiceNo}
                    onChange={(e) => setBillVendorInvoiceNo(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2.5 text-xs font-medium text-[#1f2430]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Expense Category</label>
                  <select
                    value={billCategory}
                    onChange={(e) => setBillCategory(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2.5 text-xs font-medium text-[#1f2430] bg-white"
                  >
                    <option value="Infrastructure">Infrastructure</option>
                    <option value="Services">Services</option>
                    <option value="Hardware">Hardware</option>
                    <option value="Rent & Real Estate">Rent & Real Estate</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Marketing">Marketing</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Bill Number</label>
                  <input
                    type="text"
                    value={billNumber}
                    onChange={(e) => setBillNumber(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2.5 text-xs font-medium text-[#1f2430]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Bill Date</label>
                  <input
                    type="date"
                    value={billIssueDate}
                    onChange={(e) => setBillIssueDate(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2.5 text-xs font-medium text-[#1f2430]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Due Date</label>
                  <input
                    type="date"
                    value={billDueDate}
                    onChange={(e) => setBillDueDate(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2.5 text-xs font-medium text-[#1f2430]"
                    required
                  />
                </div>
              </div>

              {/* Bill Items */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-[#1f2430]">Expense Items & Deliverables</h4>
                  <button
                    type="button"
                    onClick={addBillLineItem}
                    className="rounded-lg bg-[#eef2fa] px-3 py-1.5 text-xs font-semibold text-[#6678c1] hover:bg-[#6678c1] hover:text-white transition"
                  >
                    + Add Expense Item
                  </button>
                </div>

                <div className="overflow-x-auto rounded-xl border border-[#d9e2ef]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#f8faff] text-[#5b6472]">
                      <tr className="border-b border-[#d9e2ef]">
                        <th className="p-3 font-semibold">Item Description</th>
                        <th className="p-3 font-semibold w-24">Qty</th>
                        <th className="p-3 font-semibold w-32">Unit Cost ($)</th>
                        <th className="p-3 font-semibold w-28">Tax Rate (%)</th>
                        <th className="p-3 font-semibold w-32 text-right">Amount ($)</th>
                        <th className="p-3 font-semibold w-12 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#d9e2ef]">
                      {billItems.map((item) => {
                        const lineTotal = item.quantity * item.price;
                        return (
                          <tr key={item.id} className="hover:bg-white">
                            <td className="p-2">
                              <input
                                type="text"
                                placeholder="Expense description"
                                value={item.name}
                                onChange={(e) => updateBillLineItem(item.id, "name", e.target.value)}
                                className="w-full rounded-lg border border-[#d9e2ef] p-2 text-xs text-[#1f2430]"
                                required
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => updateBillLineItem(item.id, "quantity", parseFloat(e.target.value) || 1)}
                                className="w-full rounded-lg border border-[#d9e2ef] p-2 text-xs text-[#1f2430]"
                                required
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.price}
                                onChange={(e) => updateBillLineItem(item.id, "price", parseFloat(e.target.value) || 0)}
                                className="w-full rounded-lg border border-[#d9e2ef] p-2 text-xs text-[#1f2430]"
                                required
                              />
                            </td>
                            <td className="p-2">
                              <select
                                value={item.tax}
                                onChange={(e) => updateBillLineItem(item.id, "tax", parseFloat(e.target.value) || 0)}
                                className="w-full rounded-lg border border-[#d9e2ef] p-2 text-xs text-[#1f2430] bg-white"
                              >
                                <option value={0}>0% (None)</option>
                                <option value={5}>5% (VAT)</option>
                                <option value={8.5}>8.5% (State Tax)</option>
                                <option value={18}>18% (GST)</option>
                              </select>
                            </td>
                            <td className="p-2 text-right font-bold text-[#1f2430]">${lineTotal.toFixed(2)}</td>
                            <td className="p-2 text-center">
                              <button type="button" onClick={() => removeBillLineItem(item.id)} className="text-rose-500 hover:text-rose-700 font-bold">✕</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bill Totals */}
              <div className="flex flex-col sm:flex-row justify-between gap-6 border-t border-[#d9e2ef] pt-4">
                <div className="w-full sm:w-1/2 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#5b6472]">Vendor Notes & Descriptions</label>
                    <textarea
                      rows={2}
                      value={billNotes}
                      onChange={(e) => setBillNotes(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2.5 text-xs text-[#1f2430]"
                    />
                  </div>
                </div>

                <div className="w-full sm:w-5/12 rounded-2xl border border-[#d9e2ef] bg-[#f8faff] p-4 space-y-3 text-xs">
                  <div className="flex justify-between text-[#5b6472]">
                    <span>Subtotal:</span>
                    <span className="font-bold text-[#1f2430]">${calculatedBillSubtotal.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-[#5b6472]">
                    <span>Tax Total:</span>
                    <span className="font-bold text-[#1f2430]">${calculatedBillTaxTotal.toFixed(2)}</span>
                  </div>

                  <div className="border-t border-[#d9e2ef] pt-3 flex justify-between items-center text-sm font-bold text-rose-600">
                    <span>Total Bill Payable:</span>
                    <span className="text-lg">${calculatedBillGrandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-[#d9e2ef] pt-4">
                <button
                  type="button"
                  onClick={() => setShowBillModal(false)}
                  className="rounded-xl border border-[#d9e2ef] px-5 py-2.5 text-xs font-semibold text-[#5b6472] hover:bg-[#f8faff]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#6678c1] px-6 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-[#404d85]"
                >
                  Record Bill
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
                  <label className="block text-xs font-semibold text-[#5b6472]">Customer / CRM Lead *</label>
                  {customers.length > 0 ? (
                    <select
                      value={invCustomer}
                      onChange={(e) => handleCustomerSelect(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2.5 text-xs font-medium text-[#1f2430] bg-white"
                    >
                      <option value="">-- Select Customer or CRM Lead --</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.isCrmLead ? `⚡ [CRM Lead] ${c.name}` : c.name}
                        </option>
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
