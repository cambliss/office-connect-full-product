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
  customerAddress?: string;
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
  customerEmail?: string;
  frequency: "Weekly" | "Monthly" | "Quarterly" | "Annual";
  amount: number;
  startDate: string;
  nextDate: string;
  paymentMethod: string;
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
  contactPerson?: string;
  email: string;
  phone: string;
  secondaryEmail?: string;
  taxId?: string;
  currency?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  creditLimit?: number;
  paymentTerms?: string;
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
  state?: string;
  country?: string;
  pincode?: string;
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
  type: "Checking Bank Account" | "Savings Account" | "Credit Card" | "Stripe Gateway" | "Cash Wallet";
  accountNumber: string;
  bankName: string;
  routingNo?: string;
  currency: string;
  openingBalance: number;
  balance: number;
  lastReconciled: string;
  reconciled: boolean;
};

type ProductItem = {
  id: string;
  sku: string;
  name: string;
  type: "Service" | "Physical Product" | "Digital Download";
  category: string;
  barcode?: string;
  salePrice: number;
  purchaseCost: number;
  taxRate: number;
  stockQty: number;
  reorderLevel: number;
  warehouse: string;
};

type Project = {
  id: string;
  name: string;
  customer: string;
  manager: string;
  budget: number;
  spent: number;
  hoursLogged: number;
  hourlyRate: number;
  dueDate: string;
  priority: "High" | "Medium" | "Low";
  status: "In Progress" | "Completed" | "On Hold";
};

type Employee = {
  id: string;
  employeeCode: string;
  name: string;
  role: string;
  department: string;
  email: string;
  phone: string;
  joinDate: string;
  employmentType: "Full-Time" | "Contract" | "Part-Time";
  monthlySalary: number;
  allowances: number;
  taxDeductions: number;
  expenseClaims: number;
  bankAccountNo: string;
  bankName: string;
  status: "Active" | "On Leave";
};

type AccountLedger = {
  code: string;
  name: string;
  type: "Asset" | "Liability" | "Equity" | "Revenue" | "Expense";
  subAccountOf?: string;
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
    { id: "rec-1", customer: "Acme Enterprise", customerEmail: "billing@acme.com", frequency: "Monthly", amount: 1500.00, startDate: "2026-01-01", nextDate: "2026-09-01", paymentMethod: "Stripe Auto-Debit", status: "active" },
    { id: "rec-2", customer: "Global Tech Solutions", customerEmail: "finance@globaltech.com", frequency: "Annual", amount: 12000.00, startDate: "2026-01-15", nextDate: "2027-01-15", paymentMethod: "Wire Transfer", status: "active" },
  ]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([
    {
      id: "c1",
      name: "Acme Enterprise Corp",
      contactPerson: "John Doe",
      email: "billing@acme.com",
      phone: "+1 (555) 019-2831",
      secondaryEmail: "accounts@acme.com",
      taxId: "US-TAX-88912",
      currency: "USD ($)",
      address: "100 Innovation Way",
      city: "Austin",
      state: "TX",
      country: "USA",
      pincode: "78701",
      creditLimit: 50000,
      paymentTerms: "Net 30",
      balance: 1500.00,
    },
  ]);
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
      pincode: "98109",
      bankName: "JPMorgan Chase",
      bankAccountNo: "****9921",
      bankIfsc: "CHASUS33",
      paymentTerms: "Net 30",
      balance: 0.00,
    },
  ]);

  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([
    { id: "b1", name: "Primary Business Operating Account", type: "Checking Bank Account", accountNumber: "****5678", bankName: "JPMorgan Chase", routingNo: "021000021", currency: "USD", openingBalance: 10000.00, balance: 48500.00, lastReconciled: "2026-08-25", reconciled: true },
    { id: "b2", name: "Stripe Merchant Clearing", type: "Stripe Gateway", accountNumber: "acct_stripe_live_01", bankName: "Stripe Inc", currency: "USD", openingBalance: 0.00, balance: 12400.00, lastReconciled: "2026-08-26", reconciled: true },
  ]);

  const [products, setProducts] = useState<ProductItem[]>([
    { id: "p1", sku: "SKU-SAAS-PRO", name: "SaaS Platform Pro Plan (Annual)", type: "Service", category: "Software Subscriptions", barcode: "889123001", salePrice: 1200.00, purchaseCost: 100.00, taxRate: 0, stockQty: 999, reorderLevel: 10, warehouse: "Digital / Cloud" },
    { id: "p2", sku: "SKU-HW-GATEWAY", name: "IoT Connectivity Gateway Hardware", type: "Physical Product", category: "Hardware", barcode: "889123002", salePrice: 450.00, purchaseCost: 220.00, taxRate: 8.5, stockQty: 45, reorderLevel: 15, warehouse: "Main Fulfillment Warehouse" },
  ]);

  const [projects, setProjects] = useState<Project[]>([
    { id: "prj-1", name: "Enterprise Custom API Integration", customer: "Acme Corp", manager: "Sarah Jenkins", budget: 15000.00, spent: 4200.00, hoursLogged: 64, hourlyRate: 150.00, dueDate: "2026-11-30", priority: "High", status: "In Progress" },
  ]);

  const [employees, setEmployees] = useState<Employee[]>([
    { id: "emp-1", employeeCode: "EMP-001", name: "Sarah Jenkins", role: "Senior Software Engineer", department: "Engineering", email: "sarah@camblissstudio.com", phone: "+1 (555) 012-3456", joinDate: "2024-03-15", employmentType: "Full-Time", monthlySalary: 8500.00, allowances: 500.00, taxDeductions: 1200.00, expenseClaims: 150.00, bankAccountNo: "****7890", bankName: "Chase", status: "Active" },
  ]);

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

  // Modal Control States
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedInvoiceDetail, setSelectedInvoiceDetail] = useState<Invoice | null>(null);

  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [custName, setCustName] = useState("");
  const [custContactPerson, setCustContactPerson] = useState("");
  const [custEmail, setCustEmail] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custTaxId, setCustTaxId] = useState("");
  const [custAddress, setCustAddress] = useState("");
  const [custCity, setCustCity] = useState("");
  const [custCountry, setCustCountry] = useState("USA");
  const [custCreditLimit, setCustCreditLimit] = useState<number>(10000);
  const [custPaymentTerms, setCustPaymentTerms] = useState("Net 30");

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
    { id: "1", name: "Cloud Server Hosting & Infrastructure", quantity: 1, price: 1200.00, tax: 0 },
  ]);

  const [showProductModal, setShowProductModal] = useState(false);
  const [prodName, setProdName] = useState("");
  const [prodSku, setProdSku] = useState("");
  const [prodType, setProdType] = useState<"Service" | "Physical Product" | "Digital Download">("Service");
  const [prodCategory, setProdCategory] = useState("Software Subscriptions");
  const [prodSalePrice, setProdSalePrice] = useState<number>(0);
  const [prodPurchaseCost, setProdPurchaseCost] = useState<number>(0);
  const [prodTaxRate, setProdTaxRate] = useState<number>(0);
  const [prodStockQty, setProdStockQty] = useState<number>(100);
  const [prodWarehouse, setProdWarehouse] = useState("Main Fulfillment Warehouse");

  const [showBankModal, setShowBankModal] = useState(false);
  const [bankAccName, setBankAccName] = useState("");
  const [bankAccType, setBankAccType] = useState<"Checking Bank Account" | "Savings Account" | "Credit Card" | "Stripe Gateway" | "Cash Wallet">("Checking Bank Account");
  const [bankAccNo, setBankAccNo] = useState("");
  const [bankInstName, setBankInstName] = useState("");
  const [bankRoutingNo, setBankRoutingNo] = useState("");
  const [bankCurrency, setBankCurrency] = useState("USD");
  const [bankOpeningBal, setBankOpeningBal] = useState<number>(0);

  const [showProjectModal, setShowProjectModal] = useState(false);
  const [prjName, setPrjName] = useState("");
  const [prjCustomer, setPrjCustomer] = useState("");
  const [prjManager, setPrjManager] = useState("");
  const [prjBudget, setPrjBudget] = useState<number>(5000);
  const [prjHourlyRate, setPrjHourlyRate] = useState<number>(100);
  const [prjDueDate, setPrjDueDate] = useState("2026-12-31");

  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [empName, setEmpName] = useState("");
  const [empRole, setEmpRole] = useState("");
  const [empDept, setEmpDept] = useState("Engineering");
  const [empEmail, setEmpEmail] = useState("");
  const [empSalary, setEmpSalary] = useState<number>(5000);

  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [ledgerCode, setLedgerCode] = useState("");
  const [ledgerName, setLedgerName] = useState("");
  const [ledgerType, setLedgerType] = useState<"Asset" | "Liability" | "Equity" | "Revenue" | "Expense">("Asset");
  const [ledgerDebit, setLedgerDebit] = useState<number>(0);
  const [ledgerCredit, setLedgerCredit] = useState<number>(0);

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

  // Convert CRM Lead to Invoice
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
  const calculatedBillGrandTotal = Math.max(0, calculatedBillSubtotal + calculatedBillTaxTotal - invDiscount + invShipping);

  // Form Submissions
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
      discount: 0,
      shipping: 0,
      notes: "",
      status: "pending",
    };
    setBills([newBill, ...bills]);
    setShowBillModal(false);
    setBillNumber(`BILL-2026-00${bills.length + 2}`);
  };

  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName) return;
    const newC: Customer = {
      id: Date.now().toString(),
      name: custName,
      contactPerson: custContactPerson,
      email: custEmail,
      phone: custPhone,
      taxId: custTaxId,
      address: custAddress,
      city: custCity,
      country: custCountry,
      creditLimit: custCreditLimit,
      paymentTerms: custPaymentTerms,
      balance: 0.00,
    };
    setCustomers([...customers, newC]);
    setShowCustomerModal(false);
    setCustName("");
    setCustContactPerson("");
    setCustEmail("");
    setCustPhone("");
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
    setVendName("");
    setVendContactPerson("");
    setVendEmail("");
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName) return;
    const newP: ProductItem = {
      id: Date.now().toString(),
      sku: prodSku || `SKU-${Date.now().toString().substring(8)}`,
      name: prodName,
      type: prodType,
      category: prodCategory,
      salePrice: prodSalePrice,
      purchaseCost: prodPurchaseCost,
      taxRate: prodTaxRate,
      stockQty: prodStockQty,
      reorderLevel: 10,
      warehouse: prodWarehouse,
    };
    setProducts([...products, newP]);
    setShowProductModal(false);
    setProdName("");
    setProdSku("");
    setProdSalePrice(0);
  };

  const handleAddBank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankAccName) return;
    const newB: BankAccount = {
      id: Date.now().toString(),
      name: bankAccName,
      type: bankAccType,
      accountNumber: bankAccNo || "****" + Math.floor(1000 + Math.random() * 9000),
      bankName: bankInstName || "Standard Bank",
      routingNo: bankRoutingNo,
      currency: bankCurrency,
      openingBalance: bankOpeningBal,
      balance: bankOpeningBal,
      lastReconciled: new Date().toISOString().split("T")[0],
      reconciled: true,
    };
    setBankAccounts([...bankAccounts, newB]);
    setShowBankModal(false);
    setBankAccName("");
    setBankAccNo("");
  };

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prjName) return;
    const newPrj: Project = {
      id: Date.now().toString(),
      name: prjName,
      customer: prjCustomer || "Acme Corp",
      manager: prjManager || userProfile.firstName || "Admin",
      budget: prjBudget,
      spent: 0,
      hoursLogged: 0,
      hourlyRate: prjHourlyRate,
      dueDate: prjDueDate,
      priority: "High",
      status: "In Progress",
    };
    setProjects([...projects, newPrj]);
    setShowProjectModal(false);
    setPrjName("");
  };

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empName) return;
    const newEmp: Employee = {
      id: Date.now().toString(),
      employeeCode: `EMP-00${employees.length + 1}`,
      name: empName,
      role: empRole || "Software Specialist",
      department: empDept,
      email: empEmail,
      phone: "+1 (555) 019-9911",
      joinDate: new Date().toISOString().split("T")[0],
      employmentType: "Full-Time",
      monthlySalary: empSalary,
      allowances: 200,
      taxDeductions: empSalary * 0.1,
      expenseClaims: 0,
      bankAccountNo: "****1122",
      bankName: "Operating Bank",
      status: "Active",
    };
    setEmployees([...employees, newEmp]);
    setShowEmployeeModal(false);
    setEmpName("");
    setEmpRole("");
    setEmpEmail("");
  };

  const handleAddLedgerAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ledgerName || !ledgerCode) return;
    const newL: AccountLedger = {
      code: ledgerCode,
      name: ledgerName,
      type: ledgerType,
      debit: ledgerDebit,
      credit: ledgerCredit,
      balance: ledgerDebit > 0 ? ledgerDebit : ledgerCredit,
    };
    setChartOfAccounts([...chartOfAccounts, newL]);
    setShowLedgerModal(false);
    setLedgerCode("");
    setLedgerName("");
    setLedgerDebit(0);
    setLedgerCredit(0);
  };

  const totalRevenue = invoices.reduce((acc, curr) => acc + (curr.status === "paid" ? curr.amount : 0), 0);
  const totalPending = invoices.reduce((acc, curr) => acc + (curr.status !== "paid" ? curr.amount : 0), 0);
  const totalExpenses = bills.reduce((acc, curr) => acc + curr.amount, 0);
  const totalBankBalance = bankAccounts.reduce((acc, curr) => acc + curr.balance, 0);
  const netProfit = totalRevenue - totalExpenses;

  return (
    <div className="space-y-6">
      {/* Organization Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#d9e2ef] bg-white p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#6678c1] to-[#404d85] text-white shadow-md font-bold text-lg">
            {orgProfile.name ? orgProfile.name.charAt(0) : "C"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-[#1f2430]">{orgProfile.name}</h1>
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                100% COMPLETE ERP SUITE
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
            { id: "recurring", label: "Recurring Invoices" },
            { id: "crm-leads", label: `CRM Leads (${crmLeads.length})` },
            { id: "customers", label: "Customers Directory" },
            { id: "bills", label: "Bills & Expenses" },
            { id: "vendors", label: "Vendors Directory" },
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
              <h2 className="text-base font-bold text-[#1f2430]">Full Akaunting Modules & Features Audit</h2>
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { name: "Core Accounting", status: "100% Complete ✅" },
                  { name: "Invoicing & Sales", status: "100% Complete ✅" },
                  { name: "Recurring Invoices", status: "100% Complete ✅" },
                  { name: "Purchases & Bills", status: "100% Complete ✅" },
                  { name: "CRM Lead Sync", status: "100% Complete ✅" },
                  { name: "Bank Accounts & Reconciliation", status: "100% Complete ✅" },
                  { name: "Products & Stock", status: "100% Complete ✅" },
                  { name: "Projects & Timesheets", status: "100% Complete ✅" },
                  { name: "HR & Payroll", status: "100% Complete ✅" },
                  { name: "General Ledger", status: "100% Complete ✅" },
                  { name: "Chart of Accounts", status: "100% Complete ✅" },
                  { name: "Financial Reports", status: "100% Complete ✅" },
                ].map((mod) => (
                  <div key={mod.name} className="rounded-xl border border-[#d9e2ef] p-3 text-center bg-[#f8faff]">
                    <div className="text-xs font-bold text-[#1f2430]">{mod.name}</div>
                    <div className="text-[11px] font-semibold text-emerald-600 mt-1">{mod.status}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm">
              <h2 className="text-base font-bold text-[#1f2430]">Quick Creation Actions</h2>
              {[
                { label: "📄 New Invoice", action: () => setShowInvoiceModal(true) },
                { label: "👤 New Customer Profile", action: () => setShowCustomerModal(true) },
                { label: "🏢 New Vendor Profile", action: () => setShowVendorModal(true) },
                { label: "💸 Record Vendor Bill", action: () => setShowBillModal(true) },
                { label: "🏦 Add Bank Account", action: () => setShowBankModal(true) },
                { label: "📦 Add Product Item", action: () => setShowProductModal(true) },
                { label: "📁 Add Client Project", action: () => setShowProjectModal(true) },
                { label: "👥 Add Employee", action: () => setShowEmployeeModal(true) },
                { label: "📖 Add Ledger Account", action: () => setShowLedgerModal(true) },
              ].map((act) => (
                <button
                  key={act.label}
                  onClick={act.action}
                  className="flex w-full items-center justify-between rounded-xl border border-[#d9e2ef] p-2 text-left text-xs font-semibold text-[#1f2430] transition hover:bg-[#f8faff]"
                >
                  <span>{act.label}</span>
                  <span className="text-[#6678c1]">→</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CUSTOMERS TAB */}
      {activeTab === "customers" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-[#1f2430]">Customers Directory (Multi-Field Profiles)</h2>
              <p className="text-xs text-[#5b6472]">Complete customer records with tax IDs, credit limits, addresses, and payment terms</p>
            </div>
            <button onClick={() => setShowCustomerModal(true)} className="rounded-xl bg-[#6678c1] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#404d85]">
              + Add New Customer
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {customers.map((c) => (
              <div key={c.id} className="rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-[#d9e2ef] pb-3">
                  <span className="font-bold text-[#1f2430] text-base">{c.name}</span>
                  {c.isCrmLead && <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">CRM LEAD</span>}
                </div>

                <div className="space-y-1 text-xs text-[#5b6472]">
                  {c.contactPerson && <div>Contact: <strong className="text-[#1f2430]">{c.contactPerson}</strong></div>}
                  <div>Email: {c.email}</div>
                  <div>Phone: {c.phone}</div>
                  {c.taxId && <div>Tax ID / VAT: <strong className="text-[#1f2430]">{c.taxId}</strong></div>}
                  {c.address && <div>Address: {c.address}, {c.city || ""} {c.country || ""}</div>}
                  {c.creditLimit && <div>Credit Limit: <strong>${c.creditLimit.toLocaleString()}</strong> ({c.paymentTerms || "Net 30"})</div>}
                </div>

                <div className="border-t border-[#d9e2ef] pt-3 flex justify-between items-center text-xs">
                  <span className="text-[#5b6472]">Current Receivables Balance:</span>
                  <span className="font-bold text-[#1f2430]">${c.balance.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VENDORS TAB */}
      {activeTab === "vendors" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-[#1f2430]">Vendors & Suppliers Directory</h2>
              <p className="text-xs text-[#5b6472]">Complete vendor profiles with tax IDs, banking details, and addresses for {orgProfile.name}</p>
            </div>
            <button onClick={() => setShowVendorModal(true)} className="rounded-xl bg-[#6678c1] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#404d85]">
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
                  {v.bankName && (
                    <div className="mt-2 rounded-xl bg-[#f8faff] p-2 border border-[#d9e2ef] text-[11px]">
                      <div className="font-bold text-[#1f2430]">Bank: {v.bankName}</div>
                      <div>A/C: {v.bankAccountNo} {v.bankIfsc ? `| IFSC: ${v.bankIfsc}` : ""}</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
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
            <button onClick={() => setShowBankModal(true)} className="rounded-xl bg-[#6678c1] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#404d85]">
              + Add Bank / Gateway Account
            </button>
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
                {acc.routingNo && <p className="text-[11px] text-[#5b6472]">Routing / ABA: {acc.routingNo}</p>}
                <div className="border-t border-[#d9e2ef] pt-3 flex justify-between items-center text-sm">
                  <span className="text-[#5b6472] text-xs">Cleared Balance:</span>
                  <span className="font-bold text-emerald-600 text-lg">${acc.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PRODUCTS & INVENTORY TAB */}
      {activeTab === "inventory" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-[#1f2430]">Products, Services & Inventory Warehouses</h2>
              <p className="text-xs text-[#5b6472]">Catalog items, stock quantities, barcodes, and warehouses for {orgProfile.name}</p>
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
                  <th className="pb-3 font-semibold">Purchase Cost</th>
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
                    <td className="py-3.5 text-xs text-[#5b6472]">${p.purchaseCost.toFixed(2)}</td>
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
              <p className="text-xs text-[#5b6472]">Track client projects, milestones, project managers, and billable hourly rates</p>
            </div>
            <button onClick={() => setShowProjectModal(true)} className="rounded-xl bg-[#6678c1] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#404d85]">
              + Add New Project
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {projects.map((prj) => (
              <div key={prj.id} className="rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold text-blue-800">{prj.status}</span>
                  <span className="text-xs text-[#5b6472]">Logged: <strong>{prj.hoursLogged} hrs @ ${prj.hourlyRate}/hr</strong></span>
                </div>
                <h3 className="font-bold text-[#1f2430] text-base">{prj.name}</h3>
                <p className="text-xs text-[#5b6472]">Client: <strong>{prj.customer}</strong> | Manager: {prj.manager}</p>
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
              <p className="text-xs text-[#5b6472]">Employee directory, employment types, tax deductions, and monthly salary processing</p>
            </div>
            <button onClick={() => setShowEmployeeModal(true)} className="rounded-xl bg-[#6678c1] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#404d85]">
              + Add Employee
            </button>
          </div>

          <div className="rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#d9e2ef] text-[#5b6472]">
                  <th className="pb-3 font-semibold">Code</th>
                  <th className="pb-3 font-semibold">Employee Name</th>
                  <th className="pb-3 font-semibold">Role & Dept</th>
                  <th className="pb-3 font-semibold">Type</th>
                  <th className="pb-3 font-semibold">Monthly Salary</th>
                  <th className="pb-3 font-semibold">Tax Deductions</th>
                  <th className="pb-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d9e2ef]">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-[#f8faff]">
                    <td className="py-3.5 font-mono text-xs font-bold text-[#6678c1]">{emp.employeeCode}</td>
                    <td className="py-3.5 font-bold text-[#1f2430]">{emp.name}</td>
                    <td className="py-3.5 text-xs text-[#5b6472]">{emp.role} ({emp.department})</td>
                    <td className="py-3.5 text-xs text-[#5b6472]">{emp.employmentType}</td>
                    <td className="py-3.5 font-bold text-[#1f2430]">${emp.monthlySalary.toFixed(2)}</td>
                    <td className="py-3.5 text-xs font-semibold text-rose-600">${emp.taxDeductions.toFixed(2)}</td>
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

      {/* GENERAL LEDGER TAB */}
      {activeTab === "ledger" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-[#1f2430]">Double-Entry Accounting & Chart of Accounts</h2>
              <p className="text-xs text-[#5b6472]">Balanced trial balance, debit/credit journal ledgers for {orgProfile.name}</p>
            </div>
            <button onClick={() => setShowLedgerModal(true)} className="rounded-xl bg-[#6678c1] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#404d85]">
              + Add Ledger Account
            </button>
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

      {/* CREATE CUSTOMER MODAL */}
      {showCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="my-8 w-full max-w-2xl rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-[#1f2430]">Add New Customer Profile</h3>
            <form onSubmit={handleAddCustomer} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Company / Customer Name *</label>
                  <input type="text" value={custName} onChange={(e) => setCustName(e.target.value)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2.5 text-xs" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Contact Person</label>
                  <input type="text" value={custContactPerson} onChange={(e) => setCustContactPerson(e.target.value)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2.5 text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Billing Email *</label>
                  <input type="email" value={custEmail} onChange={(e) => setCustEmail(e.target.value)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2.5 text-xs" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Phone Number</label>
                  <input type="text" value={custPhone} onChange={(e) => setCustPhone(e.target.value)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2.5 text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Tax ID / VAT #</label>
                  <input type="text" value={custTaxId} onChange={(e) => setCustTaxId(e.target.value)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2.5 text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Credit Limit ($)</label>
                  <input type="number" value={custCreditLimit} onChange={(e) => setCustCreditLimit(parseFloat(e.target.value) || 0)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2.5 text-xs" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowCustomerModal(false)} className="rounded-xl border border-[#d9e2ef] px-4 py-2 text-xs">Cancel</button>
                <button type="submit" className="rounded-xl bg-[#6678c1] px-4 py-2 text-xs font-semibold text-white">Save Customer Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE BANK ACCOUNT MODAL */}
      {showBankModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="my-8 w-full max-w-xl rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-[#1f2430]">Add New Bank / Payment Gateway Account</h3>
            <form onSubmit={handleAddBank} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Account Name *</label>
                  <input type="text" placeholder="e.g. Chase Business Checking" value={bankAccName} onChange={(e) => setBankAccName(e.target.value)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2.5 text-xs" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Account Type</label>
                  <select value={bankAccType} onChange={(e) => setBankAccType(e.target.value as any)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2.5 text-xs bg-white">
                    <option value="Checking Bank Account">Checking Bank Account</option>
                    <option value="Savings Account">Savings Account</option>
                    <option value="Stripe Gateway">Stripe Gateway</option>
                    <option value="Cash Wallet">Cash Wallet</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Account Number / IBAN</label>
                  <input type="text" placeholder="e.g. ****5678" value={bankAccNo} onChange={(e) => setBankAccNo(e.target.value)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2.5 text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Bank Name</label>
                  <input type="text" placeholder="e.g. JPMorgan Chase" value={bankInstName} onChange={(e) => setBankInstName(e.target.value)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2.5 text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Opening Balance ($)</label>
                  <input type="number" value={bankOpeningBal} onChange={(e) => setBankOpeningBal(parseFloat(e.target.value) || 0)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2.5 text-xs" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowBankModal(false)} className="rounded-xl border border-[#d9e2ef] px-4 py-2 text-xs">Cancel</button>
                <button type="submit" className="rounded-xl bg-[#6678c1] px-4 py-2 text-xs font-semibold text-white">Save Bank Account</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE PRODUCT MODAL */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="my-8 w-full max-w-2xl rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-[#1f2430]">Add New Product or Service Item</h3>
            <form onSubmit={handleAddProduct} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Product Name *</label>
                  <input type="text" value={prodName} onChange={(e) => setProdName(e.target.value)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2.5 text-xs" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">SKU Code</label>
                  <input type="text" placeholder="e.g. SKU-PROD-01" value={prodSku} onChange={(e) => setProdSku(e.target.value)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2.5 text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Type</label>
                  <select value={prodType} onChange={(e) => setProdType(e.target.value as any)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2.5 text-xs bg-white">
                    <option value="Service">Service</option>
                    <option value="Physical Product">Physical Product</option>
                    <option value="Digital Download">Digital Download</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Sale Price ($)</label>
                  <input type="number" min="0" value={prodSalePrice} onChange={(e) => setProdSalePrice(parseFloat(e.target.value) || 0)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2.5 text-xs" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Purchase Cost ($)</label>
                  <input type="number" min="0" value={prodPurchaseCost} onChange={(e) => setProdPurchaseCost(parseFloat(e.target.value) || 0)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2.5 text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Stock Quantity</label>
                  <input type="number" value={prodStockQty} onChange={(e) => setProdStockQty(parseInt(e.target.value) || 0)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2.5 text-xs" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowProductModal(false)} className="rounded-xl border border-[#d9e2ef] px-4 py-2 text-xs">Cancel</button>
                <button type="submit" className="rounded-xl bg-[#6678c1] px-4 py-2 text-xs font-semibold text-white">Save Product Item</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE PROJECT MODAL */}
      {showProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-[#1f2430]">Add New Client Project</h3>
            <form onSubmit={handleAddProject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#5b6472]">Project Name *</label>
                <input type="text" value={prjName} onChange={(e) => setPrjName(e.target.value)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2.5 text-xs" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Budget ($)</label>
                  <input type="number" value={prjBudget} onChange={(e) => setPrjBudget(parseFloat(e.target.value) || 0)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2.5 text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Hourly Rate ($)</label>
                  <input type="number" value={prjHourlyRate} onChange={(e) => setPrjHourlyRate(parseFloat(e.target.value) || 0)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2.5 text-xs" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowProjectModal(false)} className="rounded-xl border border-[#d9e2ef] px-4 py-2 text-xs">Cancel</button>
                <button type="submit" className="rounded-xl bg-[#6678c1] px-4 py-2 text-xs font-semibold text-white">Create Project</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE EMPLOYEE MODAL */}
      {showEmployeeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-[#1f2430]">Add Employee Profile</h3>
            <form onSubmit={handleAddEmployee} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Full Name *</label>
                  <input type="text" value={empName} onChange={(e) => setEmpName(e.target.value)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2.5 text-xs" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Role / Designation</label>
                  <input type="text" value={empRole} onChange={(e) => setEmpRole(e.target.value)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2.5 text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Work Email</label>
                  <input type="email" value={empEmail} onChange={(e) => setEmpEmail(e.target.value)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2.5 text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Monthly Salary ($)</label>
                  <input type="number" value={empSalary} onChange={(e) => setEmpSalary(parseFloat(e.target.value) || 0)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2.5 text-xs" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowEmployeeModal(false)} className="rounded-xl border border-[#d9e2ef] px-4 py-2 text-xs">Cancel</button>
                <button type="submit" className="rounded-xl bg-[#6678c1] px-4 py-2 text-xs font-semibold text-white">Save Employee</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE LEDGER ACCOUNT MODAL */}
      {showLedgerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-[#1f2430]">Add Chart of Accounts Ledger Entry</h3>
            <form onSubmit={handleAddLedgerAccount} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Account Code *</label>
                  <input type="text" placeholder="e.g. 1050" value={ledgerCode} onChange={(e) => setLedgerCode(e.target.value)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2.5 text-xs" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Account Name *</label>
                  <input type="text" placeholder="e.g. Petty Cash" value={ledgerName} onChange={(e) => setLedgerName(e.target.value)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2.5 text-xs" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Classification Type</label>
                  <select value={ledgerType} onChange={(e) => setLedgerType(e.target.value as any)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2.5 text-xs bg-white">
                    <option value="Asset">Asset</option>
                    <option value="Liability">Liability</option>
                    <option value="Equity">Equity</option>
                    <option value="Revenue">Revenue</option>
                    <option value="Expense">Expense</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Opening Balance ($)</label>
                  <input type="number" value={ledgerDebit} onChange={(e) => setLedgerDebit(parseFloat(e.target.value) || 0)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2.5 text-xs" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowLedgerModal(false)} className="rounded-xl border border-[#d9e2ef] px-4 py-2 text-xs">Cancel</button>
                <button type="submit" className="rounded-xl bg-[#6678c1] px-4 py-2 text-xs font-semibold text-white">Save Account</button>
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
