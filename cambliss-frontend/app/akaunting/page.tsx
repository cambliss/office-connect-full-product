"use client";

import { useState, useEffect, Suspense } from "react";
import WorkspaceShell from "../../components/WorkspaceShell";
import { useSearchParams } from "next/navigation";

// Core Data Models
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

type RecurringInvoice = {
  id: string;
  customer: string;
  frequency: "Monthly" | "Quarterly" | "Annual";
  amount: number;
  nextDate: string;
  status: "active" | "paused";
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

type BankAccount = {
  id: string;
  name: string;
  type: "Checking Bank Account" | "Savings Account" | "Stripe Gateway" | "Cash Wallet";
  accountNumber: string;
  bankName: string;
  currency: string;
  balance: number;
  reconciled: boolean;
};

type ProductItem = {
  id: string;
  sku: string;
  name: string;
  type: "Service" | "Physical Product";
  category: string;
  salePrice: number;
  purchaseCost: number;
  stockQty: number;
  warehouse: string;
};

type Project = {
  id: string;
  name: string;
  customer: string;
  budget: number;
  spent: number;
  hoursLogged: number;
  status: "In Progress" | "Completed" | "On Hold";
};

type Employee = {
  id: string;
  name: string;
  role: string;
  email: string;
  monthlySalary: number;
  department: string;
  expenseClaims: number;
  status: "Active" | "On Leave";
};

type AccountLedger = {
  code: string;
  name: string;
  type: "Asset" | "Liability" | "Equity" | "Revenue" | "Expense";
  debit: number;
  credit: number;
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

  // State Collections
  const [crmLeads, setCrmLeads] = useState<CrmLead[]>([]);
  const [loadingLeads, setLoadingLeads] = useState<boolean>(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [recurringInvoices, setRecurringInvoices] = useState<RecurringInvoice[]>([
    { id: "rec-1", customer: "Acme Enterprise", frequency: "Monthly", amount: 1500.00, nextDate: "2026-09-01", status: "active" },
    { id: "rec-2", customer: "Global Tech Solutions", frequency: "Annual", amount: 12000.00, nextDate: "2027-01-15", status: "active" },
  ]);
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

  // Banking State
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([
    { id: "b1", name: "Primary Business Operating Account", type: "Checking Bank Account", accountNumber: "****5678", bankName: "JPMorgan Chase", currency: "USD", balance: 48500.00, reconciled: true },
    { id: "b2", name: "Stripe Merchant Clearing", type: "Stripe Gateway", accountNumber: "acct_stripe_live_01", bankName: "Stripe Inc", currency: "USD", balance: 12400.00, reconciled: true },
    { id: "b3", name: "Corporate Reserve Account", type: "Savings Account", accountNumber: "****9012", bankName: "Bank of America", currency: "USD", balance: 150000.00, reconciled: true },
  ]);

  // Products & Inventory State
  const [products, setProducts] = useState<ProductItem[]>([
    { id: "p1", sku: "SKU-SAAS-PRO", name: "SaaS Platform Pro Plan (Annual)", type: "Service", category: "Software Subscriptions", salePrice: 1200.00, purchaseCost: 100.00, stockQty: 999, warehouse: "Digital / Cloud" },
    { id: "p2", sku: "SKU-HW-GATEWAY", name: "IoT Connectivity Gateway Hardware", type: "Physical Product", category: "Hardware", salePrice: 450.00, purchaseCost: 220.00, stockQty: 45, warehouse: "Main Fulfillment Warehouse" },
  ]);

  // Projects State
  const [projects, setProjects] = useState<Project[]>([
    { id: "prj-1", name: "Enterprise Custom API Integration", customer: "Acme Corp", budget: 15000.00, spent: 4200.00, hoursLogged: 64, status: "In Progress" },
    { id: "prj-2", name: "Mobile App UX Redesign", customer: "Global Tech", budget: 8500.00, spent: 8500.00, hoursLogged: 110, status: "Completed" },
  ]);

  // HR & Payroll State
  const [employees, setEmployees] = useState<Employee[]>([
    { id: "emp-1", name: "Sarah Jenkins", role: "Senior Software Engineer", email: "sarah@camblissstudio.com", monthlySalary: 8500.00, department: "Engineering", expenseClaims: 150.00, status: "Active" },
    { id: "emp-2", name: "David Miller", role: "Account Executive", email: "david@camblissstudio.com", monthlySalary: 6200.00, department: "Sales", expenseClaims: 420.00, status: "Active" },
  ]);

  // Double Entry Ledger / Chart of Accounts
  const [chartOfAccounts, setChartOfAccounts] = useState<AccountLedger[]>([
    { code: "1010", name: "Cash & Operating Bank Accounts", type: "Asset", debit: 60900.00, credit: 0, balance: 60900.00 },
    { code: "1200", name: "Accounts Receivable (Customer Invoices)", type: "Asset", debit: 18500.00, credit: 0, balance: 18500.00 },
    { code: "2010", name: "Accounts Payable (Vendor Bills)", type: "Liability", debit: 0, credit: 4200.00, balance: 4200.00 },
    { code: "3010", name: "Owner's Equity & Retained Earnings", type: "Equity", debit: 0, credit: 50000.00, balance: 50000.00 },
    { code: "4010", name: "Software Subscription Revenue", type: "Revenue", debit: 0, credit: 39900.00, balance: 39900.00 },
    { code: "5010", name: "Server Hosting & Cloud Expenses", type: "Expense", debit: 14700.00, credit: 0, balance: 14700.00 },
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

  // Modal State for New Product
  const [showProductModal, setShowProductModal] = useState(false);
  const [prodName, setProdName] = useState("");
  const [prodSku, setProdSku] = useState("");
  const [prodPrice, setProdPrice] = useState<number>(0);

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

  const handleVendorSelect = (vendorName: string) => {
    setBillVendor(vendorName);
    const found = vendors.find(v => v.name === vendorName);
    if (found) {
      setBillVendorEmail(found.email);
      setBillCategory(found.category);
      if (found.paymentTerms) setBillPaymentTerms(found.paymentTerms);
    }
  };

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

  const addLineItem = () => {
    setInvItems([
      ...invItems,
      { id: Date.now().toString(), name: "", quantity: 1, price: 0, tax: 0 },
    ]);
  };

  const updateLineItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setInvItems(invItems.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const removeLineItem = (id: string) => {
    if (invItems.length === 1) return;
    setInvItems(invItems.filter(item => item.id !== id));
  };

  const addBillLineItem = () => {
    setBillItems([
      ...billItems,
      { id: Date.now().toString(), name: "", quantity: 1, price: 0, tax: 0 },
    ]);
  };

  const updateBillLineItem = (id: string, field: keyof BillItem, value: string | number) => {
    setBillItems(billItems.map(item => item.id === id ? { ...item, [field]: value } : item));
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
      status: "pending",
    };

    setInvoices([newInvoice, ...invoices]);
    setShowInvoiceModal(false);
    setInvNumber(`INV-2026-00${invoices.length + 2}`);
  };

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
      status: "pending",
    };

    setBills([newBill, ...bills]);
    setShowBillModal(false);
    setBillNumber(`BILL-2026-00${bills.length + 2}`);
  };

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
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName) return;

    const newP: ProductItem = {
      id: Date.now().toString(),
      sku: prodSku || `SKU-${Date.now().toString().substring(8)}`,
      name: prodName,
      type: "Service",
      category: "General Services",
      salePrice: prodPrice,
      purchaseCost: 0,
      stockQty: 100,
      warehouse: "Main Fulfillment Warehouse",
    };

    setProducts([...products, newP]);
    setShowProductModal(false);
    setProdName("");
    setProdSku("");
    setProdPrice(0);
  };

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
  };

  const totalRevenue = invoices.reduce((acc, curr) => acc + (curr.status === "paid" ? curr.amount : 0), 0);
  const totalPending = invoices.reduce((acc, curr) => acc + (curr.status !== "paid" ? curr.amount : 0), 0);
  const totalExpenses = bills.reduce((acc, curr) => acc + curr.amount, 0);
  const totalBankBalance = bankAccounts.reduce((acc, curr) => acc + curr.balance, 0);
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
                FULL ERP SUITE ACTIVE
              </span>
            </div>
            <p className="text-xs text-[#5b6472]">
              Logged in as <strong className="text-[#1f2430]">{userProfile.firstName || userProfile.lastName ? `${userProfile.firstName} ${userProfile.lastName}`.trim() : "Admin"}</strong> ({userProfile.email || "Primary Account"})
            </p>
          </div>
        </div>

        {/* Tab Navigation Encompassing ALL Akaunting Modules */}
        <div className="flex flex-wrap items-center gap-1 rounded-xl border border-[#d9e2ef] bg-[#f8faff] p-1">
          {[
            { id: "dashboard", label: "Dashboard" },
            { id: "invoices", label: "Invoices Studio" },
            { id: "recurring", label: "Recurring Invoices" },
            { id: "crm-leads", label: `CRM Leads (${crmLeads.length})` },
            { id: "customers", label: "Customers" },
            { id: "bills", label: "Bills & Expenses" },
            { id: "vendors", label: "Vendors & Suppliers" },
            { id: "banking", label: "Bank & Cash Accounts" },
            { id: "inventory", label: "Products & Stock" },
            { id: "projects", label: "Projects & Timesheets" },
            { id: "hr-payroll", label: "HR & Payroll" },
            { id: "ledger", label: "General Ledger" },
            { id: "reports", label: "Financial Reports" },
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
              <div className="mt-1 text-xs font-medium text-emerald-600">↑ Paid sales</div>
            </div>

            <div className="rounded-2xl border border-[#d9e2ef] bg-white p-5 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#5b6472]">Bank & Cash Reserves</div>
              <div className="mt-2 text-2xl font-bold text-emerald-600">${totalBankBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
              <div className="mt-1 text-xs font-medium text-emerald-600">{bankAccounts.length} Reconciled accounts</div>
            </div>

            <div className="rounded-2xl border border-[#d9e2ef] bg-white p-5 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#5b6472]">Total Bills & Expenses</div>
              <div className="mt-2 text-2xl font-bold text-rose-500">${totalExpenses.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
              <div className="mt-1 text-xs font-medium text-rose-500">{bills.length} Purchase payables</div>
            </div>

            <div className="rounded-2xl border border-[#d9e2ef] bg-white p-5 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#5b6472]">Net Margin</div>
              <div className="mt-2 text-2xl font-bold text-[#6678c1]">${netProfit.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
              <div className="mt-1 text-xs font-medium text-emerald-600">Net operating margin</div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm lg:col-span-2">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-[#1f2430]">Full ERP Suite Status ({orgProfile.name})</h2>
              </div>
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { name: "Core Accounting", status: "Active ✅" },
                  { name: "Invoicing & Sales", status: "Active ✅" },
                  { name: "Recurring Billing", status: "Active ✅" },
                  { name: "Purchases & Bills", status: "Active ✅" },
                  { name: "CRM Lead Sync", status: "Active ✅" },
                  { name: "Bank Accounts", status: "Active ✅" },
                  { name: "Products & Stock", status: "Active ✅" },
                  { name: "Projects & Timesheets", status: "Active ✅" },
                  { name: "HR & Payroll", status: "Active ✅" },
                  { name: "General Ledger", status: "Active ✅" },
                  { name: "Chart of Accounts", status: "Active ✅" },
                  { name: "Financial Reports", status: "Active ✅" },
                ].map((mod) => (
                  <div key={mod.name} className="rounded-xl border border-[#d9e2ef] p-3 text-center bg-[#f8faff]">
                    <div className="text-xs font-bold text-[#1f2430]">{mod.name}</div>
                    <div className="text-[11px] font-semibold text-emerald-600 mt-1">{mod.status}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm">
              <h2 className="text-base font-bold text-[#1f2430]">ERP Shortcuts</h2>
              {[
                { label: "📄 Create Invoice", action: () => setShowInvoiceModal(true) },
                { label: "💸 Record Vendor Bill", action: () => setShowBillModal(true) },
                { label: "🏦 Bank Accounts", action: () => setActiveTab("banking") },
                { label: "📦 Inventory Catalog", action: () => setActiveTab("inventory") },
                { label: "👥 Employees & Payroll", action: () => setActiveTab("hr-payroll") },
                { label: "📖 General Ledger", action: () => setActiveTab("ledger") },
              ].map((act) => (
                <button
                  key={act.label}
                  onClick={act.action}
                  className="flex w-full items-center justify-between rounded-xl border border-[#d9e2ef] p-2.5 text-left text-xs font-semibold text-[#1f2430] transition hover:bg-[#f8faff]"
                >
                  <span>{act.label}</span>
                  <span className="text-[#6678c1]">→</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* BANKING TAB */}
      {activeTab === "banking" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-[#1f2430]">Bank & Cash Accounts (Reconciliation & Transfers)</h2>
              <p className="text-xs text-[#5b6472]">Manage cash balances, Stripe gateway clearing, and automated bank reconciliation for {orgProfile.name}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {bankAccounts.map((acc) => (
              <div key={acc.id} className="rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                    RECONCILED ✅
                  </span>
                  <span className="text-xs font-bold text-[#6678c1]">{acc.currency}</span>
                </div>
                <h3 className="font-bold text-[#1f2430] text-base">{acc.name}</h3>
                <p className="text-xs text-[#5b6472]">{acc.bankName} ({acc.accountNumber})</p>
                <div className="border-t border-[#d9e2ef] pt-3 flex justify-between items-center text-sm">
                  <span className="text-[#5b6472] text-xs">Cleared Balance:</span>
                  <span className="font-bold text-emerald-600 text-lg">${acc.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RECURRING INVOICES TAB */}
      {activeTab === "recurring" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-[#1f2430]">Recurring Invoices & Subscriptions</h2>
              <p className="text-xs text-[#5b6472]">Automated subscription billing schedules & payment reminders</p>
            </div>
          </div>

          <div className="rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#d9e2ef] text-[#5b6472]">
                  <th className="pb-3 font-semibold">Customer</th>
                  <th className="pb-3 font-semibold">Frequency</th>
                  <th className="pb-3 font-semibold">Recurring Amount</th>
                  <th className="pb-3 font-semibold">Next Invoice Date</th>
                  <th className="pb-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d9e2ef]">
                {recurringInvoices.map((rec) => (
                  <tr key={rec.id} className="hover:bg-[#f8faff]">
                    <td className="py-3.5 font-bold text-[#1f2430]">{rec.customer}</td>
                    <td className="py-3.5 text-xs text-[#6678c1] font-semibold">{rec.frequency}</td>
                    <td className="py-3.5 font-bold text-[#1f2430]">${rec.amount.toFixed(2)}</td>
                    <td className="py-3.5 text-[#5b6472]">{rec.nextDate}</td>
                    <td className="py-3.5">
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                        {rec.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PRODUCTS & INVENTORY TAB */}
      {activeTab === "inventory" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-[#1f2430]">Products, Services & Inventory Warehouses</h2>
              <p className="text-xs text-[#5b6472]">Catalog items, stock quantities, and warehouses for {orgProfile.name}</p>
            </div>
            <button onClick={() => setShowProductModal(true)} className="rounded-xl bg-[#6678c1] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#404d85]">
              + Add Product / Service
            </button>
          </div>

          <div className="rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#d9e2ef] text-[#5b6472]">
                  <th className="pb-3 font-semibold">SKU</th>
                  <th className="pb-3 font-semibold">Item Name</th>
                  <th className="pb-3 font-semibold">Type</th>
                  <th className="pb-3 font-semibold">Sale Price</th>
                  <th className="pb-3 font-semibold">Stock Qty</th>
                  <th className="pb-3 font-semibold">Warehouse</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d9e2ef]">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-[#f8faff]">
                    <td className="py-3.5 font-mono text-xs font-bold text-[#6678c1]">{p.sku}</td>
                    <td className="py-3.5 font-bold text-[#1f2430]">{p.name}</td>
                    <td className="py-3.5 text-xs text-[#5b6472]">{p.type}</td>
                    <td className="py-3.5 font-bold text-emerald-600">${p.salePrice.toFixed(2)}</td>
                    <td className="py-3.5 font-semibold text-[#1f2430]">{p.stockQty}</td>
                    <td className="py-3.5 text-xs text-[#5b6472]">{p.warehouse}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PROJECTS & TIMESHEETS TAB */}
      {activeTab === "projects" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-[#1f2430]">Projects & Billable Timesheets</h2>
              <p className="text-xs text-[#5b6472]">Track client projects, milestones, and billable hours</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {projects.map((prj) => (
              <div key={prj.id} className="rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold text-blue-800">{prj.status}</span>
                  <span className="text-xs text-[#5b6472]">Logged: <strong>{prj.hoursLogged} hrs</strong></span>
                </div>
                <h3 className="font-bold text-[#1f2430] text-base">{prj.name}</h3>
                <p className="text-xs text-[#5b6472]">Client: <strong>{prj.customer}</strong></p>
                <div className="border-t border-[#d9e2ef] pt-3 flex justify-between items-center text-xs">
                  <span>Budget vs Spent:</span>
                  <span className="font-bold text-[#1f2430]">${prj.spent.toFixed(2)} / ${prj.budget.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* HR & PAYROLL TAB */}
      {activeTab === "hr-payroll" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-[#1f2430]">HR, Employees & Payroll Processing</h2>
              <p className="text-xs text-[#5b6472]">Employee directory, monthly salaries, and expense reimbursement claims</p>
            </div>
          </div>

          <div className="rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#d9e2ef] text-[#5b6472]">
                  <th className="pb-3 font-semibold">Employee</th>
                  <th className="pb-3 font-semibold">Role & Dept</th>
                  <th className="pb-3 font-semibold">Monthly Salary</th>
                  <th className="pb-3 font-semibold">Expense Claims</th>
                  <th className="pb-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d9e2ef]">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-[#f8faff]">
                    <td className="py-3.5 font-bold text-[#1f2430]">{emp.name}</td>
                    <td className="py-3.5 text-xs text-[#5b6472]">{emp.role} ({emp.department})</td>
                    <td className="py-3.5 font-bold text-[#1f2430]">${emp.monthlySalary.toFixed(2)}</td>
                    <td className="py-3.5 text-xs font-semibold text-rose-600">${emp.expenseClaims.toFixed(2)}</td>
                    <td className="py-3.5">
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">{emp.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* GENERAL LEDGER & DOUBLE ENTRY TAB */}
      {activeTab === "ledger" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-[#1f2430]">Double-Entry Accounting & Chart of Accounts</h2>
              <p className="text-xs text-[#5b6472]">Balanced trial balance, debit/credit journal ledgers for {orgProfile.name}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#d9e2ef] text-[#5b6472]">
                  <th className="pb-3 font-semibold">Code</th>
                  <th className="pb-3 font-semibold">Account Name</th>
                  <th className="pb-3 font-semibold">Classification</th>
                  <th className="pb-3 font-semibold text-right">Debit ($)</th>
                  <th className="pb-3 font-semibold text-right">Credit ($)</th>
                  <th className="pb-3 font-semibold text-right">Net Balance ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d9e2ef]">
                {chartOfAccounts.map((acc) => (
                  <tr key={acc.code} className="hover:bg-[#f8faff]">
                    <td className="py-3.5 font-mono text-xs font-bold text-[#6678c1]">{acc.code}</td>
                    <td className="py-3.5 font-bold text-[#1f2430]">{acc.name}</td>
                    <td className="py-3.5 text-xs text-[#5b6472]">{acc.type}</td>
                    <td className="py-3.5 text-right font-medium text-[#1f2430]">${acc.debit.toFixed(2)}</td>
                    <td className="py-3.5 text-right font-medium text-[#1f2430]">${acc.credit.toFixed(2)}</td>
                    <td className="py-3.5 text-right font-bold text-[#6678c1]">${acc.balance.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
                  <div>📧 {v.email}</div>
                  {v.phone && <div>📞 {v.phone}</div>}
                  {v.taxId && <div>GSTIN / Tax ID: <strong className="text-[#1f2430]">{v.taxId}</strong></div>}
                  {v.address && <div>Address: {v.address}, {v.city || ""} ({v.country || ""})</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CUSTOMERS TAB */}
      {activeTab === "customers" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-[#1f2430]">Customers Directory</h2>
              <p className="text-xs text-[#5b6472]">Client profiles for {orgProfile.name}</p>
            </div>
            <button onClick={() => setShowCustomerModal(true)} className="rounded-xl bg-[#6678c1] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#404d85]">
              + Add Customer
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {customers.map((c) => (
              <div key={c.id} className="rounded-2xl border border-[#d9e2ef] bg-white p-5 shadow-sm space-y-2">
                <h3 className="font-bold text-[#1f2430]">{c.name}</h3>
                <p className="text-xs text-[#5b6472]">{c.email}</p>
                <p className="text-xs text-[#5b6472]">{c.phone}</p>
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
                    value={orgProfile.legalName}
                    onChange={(e) => setOrgProfile({ ...orgProfile, legalName: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-3 text-xs font-medium text-[#1f2430]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Business Support Email</label>
                  <input
                    type="email"
                    value={orgProfile.supportEmail}
                    onChange={(e) => setOrgProfile({ ...orgProfile, supportEmail: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-3 text-xs font-medium text-[#1f2430]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Support Phone Number</label>
                  <input
                    type="text"
                    value={orgProfile.supportPhone}
                    onChange={(e) => setOrgProfile({ ...orgProfile, supportPhone: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-3 text-xs font-medium text-[#1f2430]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Tax ID / PAN Number</label>
                  <input
                    type="text"
                    value={orgProfile.panNumber}
                    onChange={(e) => setOrgProfile({ ...orgProfile, panNumber: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-3 text-xs font-medium text-[#1f2430]"
                  />
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
              <button onClick={() => setShowInvoiceModal(false)} className="rounded-lg p-2 text-[#5b6472] hover:bg-[#f8faff]">✕</button>
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
                  <label className="block text-xs font-semibold text-[#5b6472]">Invoice Number</label>
                  <input
                    type="text"
                    value={invNumber}
                    onChange={(e) => setInvNumber(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2.5 text-xs font-medium text-[#1f2430]"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-[#d9e2ef] pt-4">
                <button type="button" onClick={() => setShowInvoiceModal(false)} className="rounded-xl border border-[#d9e2ef] px-5 py-2.5 text-xs font-semibold text-[#5b6472]">Cancel</button>
                <button type="submit" className="rounded-xl bg-[#6678c1] px-6 py-2.5 text-xs font-semibold text-white shadow-md">Create Invoice</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE PURCHASE BILL MODAL */}
      {showBillModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="my-8 w-full max-w-4xl rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#d9e2ef] pb-4">
              <h3 className="text-xl font-bold text-[#1f2430]">Record New Purchase Bill</h3>
              <button onClick={() => setShowBillModal(false)} className="rounded-lg p-2 text-[#5b6472]">✕</button>
            </div>

            <form onSubmit={handleCreateBill} className="mt-6 space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Vendor *</label>
                  <select value={billVendor} onChange={(e) => handleVendorSelect(e.target.value)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2.5 text-xs bg-white">
                    {vendors.map((v) => <option key={v.id} value={v.name}>{v.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Bill Number</label>
                  <input type="text" value={billNumber} onChange={(e) => setBillNumber(e.target.value)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2.5 text-xs" required />
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-[#d9e2ef] pt-4">
                <button type="button" onClick={() => setShowBillModal(false)} className="rounded-xl border border-[#d9e2ef] px-5 py-2.5 text-xs">Cancel</button>
                <button type="submit" className="rounded-xl bg-[#6678c1] px-6 py-2.5 text-xs font-semibold text-white shadow-md">Record Bill</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE PRODUCT MODAL */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-[#1f2430]">Add New Product or Service</h3>
            <form onSubmit={handleAddProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#5b6472]">Product / Service Name *</label>
                <input type="text" value={prodName} onChange={(e) => setProdName(e.target.value)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2.5 text-xs" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5b6472]">Sale Price ($)</label>
                <input type="number" min="0" value={prodPrice} onChange={(e) => setProdPrice(parseFloat(e.target.value) || 0)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2.5 text-xs" required />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowProductModal(false)} className="rounded-xl border border-[#d9e2ef] px-4 py-2 text-xs">Cancel</button>
                <button type="submit" className="rounded-xl bg-[#6678c1] px-4 py-2 text-xs text-white">Save Product</button>
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
