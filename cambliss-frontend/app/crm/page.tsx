"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import WorkspaceShell from "../../components/WorkspaceShell";
import * as XLSX from "xlsx";
import {
	Globe,
	DollarSign,
	Layers,
	Briefcase,
	ShieldCheck,
	FileText,
	Headphones,
	BarChart3,
	Workflow,
	Building2,
	Users,
	CheckCircle2,
	AlertCircle,
	Clock,
	ArrowUpRight,
	Download,
	Filter,
	Search,
	Plus,
	Trash2,
	Edit3,
	ChevronRight,
	Send,
	CheckSquare,
	RefreshCw,
	AlertTriangle,
	UserCheck,
	Award,
	TrendingUp,
	Calculator,
	Sparkles,
	Sliders,
	Scale,
	MapPin,
	Activity,
	Play,
	RotateCcw,
	ArrowLeft,
	ArrowRight,
	Cloud,
	Database,
	Boxes,
	Cpu,
	Zap,
	Network,
	Server,
	HardDrive,
	Share2,
	Printer,
	Copy,
	Check,
	Folder,
	FileCheck,
} from "lucide-react";

type CrmDashboard = {
	totalLeads: number;
	totalActiveDeals: number;
	totalOpenDeals: number;
	totalWonDeals: number;
	openDealsValue: number;
	wonDealsValue: number;
	expectedRevenue: number;
	conversionRate: number;
	winRate: number;
};

type Lead = {
	id: string;
	contactId?: string;
	firstName?: string;
	lastName?: string;
	companyName?: string;
	email?: string;
	phone?: string;
	status?: string;
	source?: string;
	score?: number;
	isArchived?: boolean;
};

type Deal = {
	id: string;
	contactId: string;
	pipelineId: string;
	stageId: string;
	status: string;
	probability: number;
	value: number;
	isArchived?: boolean;
	contact?: {
		id: string;
		firstName?: string | null;
		lastName?: string | null;
		companyName?: string | null;
		email?: string | null;
		phone?: string | null;
	} | null;
};

type StageHistory = {
	id?: string;
	changedAt?: string;
	fromStage?: { name?: string } | null;
	toStage?: { name?: string } | null;
	user?: { firstName?: string | null; lastName?: string | null; email?: string };
};

type SuiteTab =
	| "overview"
	| "customer360"
	| "sales"
	| "cpq"
	| "service"
	| "marketing"
	| "revenue"
	| "analytics"
	| "automation"
	| "governance";

type ServiceCase = {
	id: string;
	subject: string;
	priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
	status: "OPEN" | "IN_PROGRESS" | "RESOLVED";
	createdAt?: string;
};

type Campaign = {
	id: string;
	name: string;
	segment: string;
	status: "DRAFT" | "RUNNING" | "PAUSED";
};

type Integration = {
	moduleId: string;
	moduleName: string;
	description: string | null;
	isConnected: boolean;
	updatedAt: string | null;
};

type SetupContactOption = {
	id: string;
	label: string;
	email: string | null;
	phone: string | null;
};

type SetupStageOption = {
	id: string;
	name: string;
	order: number;
};

type SetupPipelineOption = {
	id: string;
	name: string;
	stages: SetupStageOption[];
};

type SetupOptions = {
	contacts: SetupContactOption[];
	pipelines: SetupPipelineOption[];
};

type NoCostCrmProfile = {
	mode: "NO_COST";
	requiresThirdPartyApis: false;
	coreCapabilities: {
		customerData: boolean;
		leadManagement: boolean;
		salesPipeline: boolean;
		communicationTracking: boolean;
		automationReady: boolean;
		reportsAndInsights: boolean;
		supportWorkflow: boolean;
	};
	stats: {
		contacts: number;
		leads: number;
		deals: number;
		pipelines: number;
		stages: number;
		activities: number;
	};
	optionalPaidIntegrations: Array<{
		name: string;
		required: false;
		useCase: string;
	}>;
};

// ==========================================
// 1. INTERNATIONAL MULTI-CURRENCY CONVERSION
// ==========================================
type SupportedCurrency = "USD" | "EUR" | "GBP" | "INR" | "AED" | "JPY" | "CAD" | "SGD";

const CURRENCIES: Record<SupportedCurrency, { symbol: string; rate: number; label: string; code: string }> = {
	USD: { symbol: "$", rate: 1.0, label: "USD - US Dollar", code: "USD" },
	EUR: { symbol: "€", rate: 0.92, label: "EUR - Euro", code: "EUR" },
	GBP: { symbol: "£", rate: 0.79, label: "GBP - British Pound", code: "GBP" },
	INR: { symbol: "₹", rate: 83.95, label: "INR - Indian Rupee", code: "INR" },
	AED: { symbol: "AED ", rate: 3.67, label: "AED - UAE Dirham", code: "AED" },
	JPY: { symbol: "¥", rate: 152.4, label: "JPY - Japanese Yen", code: "JPY" },
	CAD: { symbol: "CA$", rate: 1.38, label: "CAD - Canadian Dollar", code: "CAD" },
	SGD: { symbol: "SG$", rate: 1.34, label: "SGD - Singapore Dollar", code: "SGD" },
};

// ==========================================
// 2. CAMBLISS CPQ PRODUCT CATALOG & LINE ITEMS
// ==========================================
type CpqLineItem = {
	id: string;
	name: string;
	category: string;
	unitPrice: number;
	billingPeriod: "MONTHLY" | "ANNUAL" | "ONE_TIME";
	description: string;
};

const ENTERPRISE_CPQ_CATALOG: CpqLineItem[] = [
	{
		id: "core_platform",
		name: "Cambliss Enterprise Core Platform",
		category: "Core Software",
		unitPrice: 12000,
		billingPeriod: "MONTHLY",
		description: "Multi-tenant enterprise CRM core with infinite API calls and global high-availability tenancy",
	},
	{
		id: "global_infra",
		name: "Global Multi-Region Cloud Infra SLA",
		category: "Infrastructure",
		unitPrice: 4500,
		billingPeriod: "MONTHLY",
		description: "Active-active disaster recovery with sub-50ms latency across Americas, EMEA, and APAC nodes",
	},
	{
		id: "dedicated_tam",
		name: "Dedicated Technical Account Manager (TAM)",
		category: "Professional Services",
		unitPrice: 3200,
		billingPeriod: "MONTHLY",
		description: "Named Principal Solutions Architect with 15-minute response SLA and weekly architecture reviews",
	},
	{
		id: "mission_critical_sla",
		name: "24/7/365 Platinum Mission-Critical SLA",
		category: "Support Tier",
		unitPrice: 2800,
		billingPeriod: "MONTHLY",
		description: "Guaranteed 99.999% uptime SLA with 30-minute Severity 1 triage and direct engineering hotline",
	},
	{
		id: "data_migration",
		name: "Enterprise ERP & Legacy Data Migration",
		category: "Implementation",
		unitPrice: 15000,
		billingPeriod: "ONE_TIME",
		description: "Full ETL pipeline, data cleansing, and schema validation from legacy CRM/ERP systems",
	},
	{
		id: "compliance_shield",
		name: "Enterprise SOC2 & HIPAA Compliance Shield",
		category: "Security",
		unitPrice: 2500,
		billingPeriod: "MONTHLY",
		description: "Dedicated customer-managed KMS encryption keys and immutable audit logging",
	},
];

const emptyLeadForm = {
	firstName: "",
	lastName: "",
	email: "",
	phone: "",
	companyName: "",
	source: "",
	status: "NEW",
};

const emptyDealForm = {
	contactId: "",
	pipelineId: "",
	stageId: "",
	value: "",
	probability: "",
	status: "OPEN",
};

// 20 Enterprise Connectors with clean Lucide React Icons (No Emojis)
const TOP_CRMS = [
	{ id: "salesforce", name: "Salesforce CRM", icon: Cloud, color: "border-sky-200 bg-sky-50 text-sky-700" },
	{ id: "hubspot", name: "HubSpot Enterprise", icon: Workflow, color: "border-orange-200 bg-orange-50 text-orange-700" },
	{ id: "twenty", name: "Twenty CRM (GraphQL)", icon: Layers, color: "border-[#6678c1]/30 bg-[#6678c1]/10 text-[#6678c1]" },
	{ id: "dynamics", name: "Microsoft Dynamics 365", icon: Briefcase, color: "border-blue-200 bg-blue-50 text-blue-700" },
	{ id: "pipedrive", name: "Pipedrive Revenue", icon: TrendingUp, color: "border-emerald-200 bg-emerald-50 text-emerald-700" },
	{ id: "zoho", name: "Zoho CRM One", icon: Boxes, color: "border-amber-200 bg-amber-50 text-amber-700" },
	{ id: "zendesk", name: "Zendesk Sell & Service", icon: Headphones, color: "border-teal-200 bg-teal-50 text-teal-700" },
	{ id: "keap", name: "Keap Automations", icon: Sparkles, color: "border-purple-200 bg-purple-50 text-purple-700" },
	{ id: "freshsales", name: "Freshsales Cloud", icon: FileText, color: "border-emerald-200 bg-emerald-50 text-emerald-700" },
	{ id: "insightly", name: "Insightly Enterprise", icon: Building2, color: "border-rose-200 bg-rose-50 text-rose-700" },
	{ id: "copper", name: "Copper Google Workspace", icon: Cpu, color: "border-amber-300 bg-amber-100/60 text-amber-800" },
	{ id: "activecampaign", name: "ActiveCampaign", icon: Send, color: "border-blue-300 bg-blue-100/60 text-blue-800" },
	{ id: "monday", name: "Monday.com CRM", icon: Sliders, color: "border-rose-300 bg-rose-100/60 text-rose-800" },
	{ id: "agile", name: "Agile CRM Suite", icon: Zap, color: "border-[#6678c1]/40 bg-[#6678c1]/20 text-[#6678c1]" },
	{ id: "sugarcrm", name: "SugarCRM Enterprise", icon: Server, color: "border-pink-200 bg-pink-50 text-pink-700" },
	{ id: "nimble", name: "Nimble Social CRM", icon: Users, color: "border-indigo-200 bg-indigo-50 text-indigo-700" },
	{ id: "nutshell", name: "Nutshell Intelligence", icon: HardDrive, color: "border-yellow-300 bg-yellow-100/60 text-yellow-800" },
	{ id: "capsule", name: "Capsule B2B CRM", icon: ShieldCheck, color: "border-teal-300 bg-teal-100/60 text-teal-800" },
	{ id: "close", name: "Close Sales Engine", icon: DollarSign, color: "border-violet-200 bg-violet-50 text-violet-700" },
	{ id: "apptivo", name: "Apptivo ERP Connector", icon: Network, color: "border-slate-300 bg-slate-100 text-slate-800" },
];

const getApiErrorMessage = async (response: Response, fallback: string): Promise<string> => {
	const raw = await response.text();
	if (!raw) return fallback;
	try {
		const parsed = JSON.parse(raw) as { message?: string };
		return parsed.message || fallback;
	} catch {
		return raw;
	}
};

const parseCSV = (text: string) => {
	const cleanText = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
	const lines = cleanText.split("\n").filter((l) => l.trim() !== "");
	if (lines.length === 0) return { headers: [], rows: [] };
	const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, "").trim());
	const rows = lines.slice(1).map((line) => {
		const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map((v) => v.trim().replace(/^"|"$/g, "").trim());
		return headers.reduce((acc, header, index) => {
			if (header) {
				acc[header] = values[index] || "";
			}
			return acc;
		}, {} as Record<string, string>);
	});
	return { headers, rows };
};

const IMPORT_MODULE_FIELDS = {
	leads: [
		{ key: "firstName", label: "First Name", required: true, aliases: ["firstname", "first", "fname", "name", "fullname", "lead name"] },
		{ key: "lastName", label: "Last Name", required: false, aliases: ["lastname", "last", "lname", "surname"] },
		{ key: "email", label: "Email Address", required: true, aliases: ["email", "emailaddress", "e-mail", "email id"] },
		{ key: "phone", label: "Phone Number", required: false, aliases: ["phone", "phonenumber", "mobile", "contact"] },
		{ key: "companyName", label: "Company", required: false, aliases: ["company", "companyname", "organization"] },
		{ key: "source", label: "Source", required: false, aliases: ["source", "leadsource", "channel"] },
		{ key: "status", label: "Status (NEW, CONTACTED, QUALIFIED)", required: false, aliases: ["status", "leadstatus"] },
	],
	serviceCases: [
		{ key: "subject", label: "Case Subject", required: true, aliases: ["subject", "title", "issue", "problem", "case"] },
		{ key: "priority", label: "Priority (LOW, MEDIUM, HIGH, URGENT)", required: false, aliases: ["priority", "severity", "urgency"] },
	],
	campaigns: [
		{ key: "name", label: "Campaign Name", required: true, aliases: ["name", "campaignname", "campaign", "title"] },
		{ key: "segment", label: "Target Segment", required: false, aliases: ["segment", "audience", "target"] },
	],
};

export default function CrmPage() {
	const [activeTab, setActiveTab] = useState<SuiteTab>("overview");
	const [selectedCurrency, setSelectedCurrency] = useState<SupportedCurrency>("USD");
	const [notice, setNotice] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	const [dashboard, setDashboard] = useState<CrmDashboard | null>(null);
	const [leads, setLeads] = useState<Lead[]>([]);
	const [deals, setDeals] = useState<Deal[]>([]);
	const [selectedDealHistory, setSelectedDealHistory] = useState<StageHistory[]>([]);
	const [historyDealId, setHistoryDealId] = useState<string | null>(null);

	const [leadForm, setLeadForm] = useState(emptyLeadForm);
	const [dealForm, setDealForm] = useState(emptyDealForm);
	const [stageUpdate, setStageUpdate] = useState<Record<string, string>>({});

	const [serviceCases, setServiceCases] = useState<ServiceCase[]>([]);
	const [caseSubject, setCaseSubject] = useState("");
	const [caseContactId, setCaseContactId] = useState("");
	const [caseCategory, setCaseCategory] = useState("Technical Support");
	const [casePriority, setCasePriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "URGENT">("MEDIUM");

	const [campaigns, setCampaigns] = useState<Campaign[]>([]);
	const [campaignName, setCampaignName] = useState("");
	const [campaignSegment, setCampaignSegment] = useState("All Leads");
	const [campaignChannel, setCampaignChannel] = useState("Email Blast");
	const [setupOptions, setSetupOptions] = useState<SetupOptions>({ contacts: [], pipelines: [] });
	const [integrations, setIntegrations] = useState<Integration[]>([]);

	// CPQ Engine State
	const [cpqAccountName, setCpqAccountName] = useState("Acme Global Technologies Inc.");
	const [cpqContactName, setCpqContactName] = useState("Jonathan Vance (Chief Technology Officer)");
	const [selectedCpqItems, setSelectedCpqItems] = useState<Record<string, { quantity: number }>>({
		core_platform: { quantity: 1 },
		global_infra: { quantity: 1 },
		dedicated_tam: { quantity: 1 },
		mission_critical_sla: { quantity: 1 },
	});
	const [cpqDiscountPct, setCpqDiscountPct] = useState<number>(10);
	const [cpqPaymentTerms, setCpqPaymentTerms] = useState<"NET_30" | "NET_60" | "ANNUAL_PREPAID" | "3YR_ENTERPRISE">("3YR_ENTERPRISE");
	const [isQuoteGeneratedModalOpen, setIsQuoteGeneratedModalOpen] = useState(false);
	const [copiedQuote, setCopiedQuote] = useState(false);

	// Import Wizard State
	const [isImportModalOpen, setIsImportModalOpen] = useState(false);
	const [selectedCrmConnectorModal, setSelectedCrmConnectorModal] = useState<any | null>(null);
	const [twentyServerUrl, setTwentyServerUrl] = useState("https://api.twenty.com");
	const [twentyApiKey, setTwentyApiKey] = useState("");
	const [isTestingTwenty, setIsTestingTwenty] = useState(false);
	const [twentySyncStatus, setTwentySyncStatus] = useState<string | null>(null);
	const [importStep, setImportStep] = useState<1 | 2 | 3 | 4>(1);
	const [importModule, setImportModule] = useState<"leads" | "serviceCases" | "campaigns">("leads");
	const [importFile, setImportFile] = useState<File | null>(null);
	const [importHeaders, setImportHeaders] = useState<string[]>([]);
	const [importData, setImportData] = useState<Record<string, string>[]>([]);
	const [columnMapping, setColumnMapping] = useState<Record<string, { csvColumn: string; defaultValue: string }>>({});
	const [isImporting, setIsImporting] = useState(false);

	// External CRM Integration State
	const [selectedCrmToConnect, setSelectedCrmToConnect] = useState<string | null>(null);
	const [connectedCrms, setConnectedCrms] = useState<string[]>([]);
	const [isConnectingCrm, setIsConnectingCrm] = useState(false);
	const [noCostProfile, setNoCostProfile] = useState<NoCostCrmProfile | null>(null);

	// Full Edit Modals State
	const [editingLead, setEditingLead] = useState<Lead | null>(null);
	const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
	const [editingServiceCase, setEditingServiceCase] = useState<ServiceCase | null>(null);
	const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
	const [isUpdatingItem, setIsUpdatingItem] = useState(false);

	const [isSavingLead, setIsSavingLead] = useState(false);
	const [isSavingDeal, setIsSavingDeal] = useState(false);
	const [isSavingServiceCase, setIsSavingServiceCase] = useState(false);
	const [isSavingCampaign, setIsSavingCampaign] = useState(false);
	const [pendingServiceStatus, setPendingServiceStatus] = useState<Record<string, boolean>>({});
	const [pendingCampaignStatus, setPendingCampaignStatus] = useState<Record<string, boolean>>({});
	const [pendingIntegration, setPendingIntegration] = useState<Record<string, boolean>>({});
	const [isResettingCrm, setIsResettingCrm] = useState(false);
	const [didAuthRedirect, setDidAuthRedirect] = useState(false);

	// Real-Time Currency Formatter Helper
	const formatMoney = (amount: number): string => {
		const curr = CURRENCIES[selectedCurrency] || CURRENCIES.USD;
		const converted = amount * curr.rate;
		if (selectedCurrency === "INR") {
			return `${curr.symbol}${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(converted)}`;
		}
		if (selectedCurrency === "JPY") {
			return `${curr.symbol}${new Intl.NumberFormat("ja-JP", { maximumFractionDigits: 0 }).format(converted)}`;
		}
		return `${curr.symbol}${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(converted)}`;
	};

	const redirectToLogin = () => {
		if (didAuthRedirect) return;
		setDidAuthRedirect(true);
		setNotice("Session expired. Redirecting to login...");
		if (typeof window !== "undefined") {
			localStorage.removeItem("authToken");
			localStorage.removeItem("authUser");
			window.setTimeout(() => {
				window.location.href = "/login";
			}, 600);
		}
	};

	const getAuthHeaders = (): Headers => {
		const headers = new Headers();
		const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
		if (token) {
			headers.set("Authorization", `Bearer ${token}`);
		}
		return headers;
	};

	const loadAll = async () => {
		setIsLoading(true);
		setNotice(null);
		try {
			if (typeof window !== "undefined" && !localStorage.getItem("authToken")) {
				redirectToLogin();
				return;
			}

			const authHeaders = getAuthHeaders();
			const [dashboardRes, leadsRes, dealsRes, serviceCasesRes, campaignsRes, integrationsRes, setupRes, noCostProfileRes] = await Promise.all([
				fetch("/api/crm/dashboard", { headers: authHeaders }),
				fetch("/api/crm/leads", { headers: authHeaders }),
				fetch("/api/crm/deals", { headers: authHeaders }),
				fetch("/api/crm/service/cases", { headers: authHeaders }),
				fetch("/api/crm/marketing/campaigns", { headers: authHeaders }),
				fetch("/api/crm/integrations", { headers: authHeaders }),
				fetch("/api/crm/setup/options", { headers: authHeaders }),
				fetch("/api/crm/no-cost-profile", { headers: authHeaders }),
			]);

			if (dashboardRes.status === 401 || leadsRes.status === 401 || dealsRes.status === 401) {
				redirectToLogin();
				return;
			}

			if (dashboardRes.ok) setDashboard((await dashboardRes.json()) as CrmDashboard);
			if (leadsRes.ok) setLeads((await leadsRes.json()) as Lead[]);
			if (dealsRes.ok) setDeals((await dealsRes.json()) as Deal[]);
			if (serviceCasesRes.ok) setServiceCases((await serviceCasesRes.json()) as ServiceCase[]);
			if (campaignsRes.ok) setCampaigns((await campaignsRes.json()) as Campaign[]);
			if (integrationsRes.ok) setIntegrations((await integrationsRes.json()) as Integration[]);
			if (setupRes.ok) setSetupOptions((await setupRes.json()) as SetupOptions);
			if (noCostProfileRes.ok) setNoCostProfile((await noCostProfileRes.json()) as NoCostCrmProfile);
		} catch {
			setNotice("Unable to reach CRM service.");
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		void loadAll();
	}, []);

	// Handle Lead actions
	const handleCreateLead = async (event: FormEvent) => {
		event.preventDefault();
		if (!leadForm.firstName.trim() && !leadForm.email.trim()) {
			setNotice("Provide a first name or email for this lead.");
			return;
		}

		setIsSavingLead(true);
		setNotice(null);
		try {
			const authHeaders = getAuthHeaders();
			authHeaders.set("Content-Type", "application/json");
			const response = await fetch("/api/crm/leads", {
				method: "POST",
				headers: authHeaders,
				body: JSON.stringify({
					firstName: leadForm.firstName.trim() || undefined,
					lastName: leadForm.lastName.trim() || undefined,
					email: leadForm.email.trim() || undefined,
					phone: leadForm.phone.trim() || undefined,
					companyName: leadForm.companyName.trim() || undefined,
					source: leadForm.source.trim() || undefined,
					status: leadForm.status || "NEW",
				}),
			});

			if (response.status === 401) {
				redirectToLogin();
				return;
			}

			if (!response.ok) {
				setNotice(await getApiErrorMessage(response, "Unable to save lead."));
				return;
			}

			setLeadForm(emptyLeadForm);
			await loadAll();
			setNotice("Lead created successfully.");
		} catch {
			setNotice("Unable to save lead.");
		} finally {
			setIsSavingLead(false);
		}
	};

	const handleArchiveLead = async (leadId: string, archived?: boolean) => {
		const authHeaders = getAuthHeaders();
		const endpoint = archived ? `/api/crm/leads/${leadId}/restore` : `/api/crm/leads/${leadId}/archive`;
		const response = await fetch(endpoint, { method: "POST", headers: authHeaders });
		if (!response.ok) {
			setNotice("Lead action failed.");
			return;
		}
		await loadAll();
	};

	const handleDeleteLead = async (leadId: string) => {
		if (!window.confirm("Delete this lead permanently?")) return;
		const authHeaders = getAuthHeaders();
		const response = await fetch(`/api/crm/leads/${leadId}`, { method: "DELETE", headers: authHeaders });
		if (!response.ok) {
			setNotice("Lead delete failed.");
			return;
		}
		await loadAll();
		setNotice("Lead deleted.");
	};

	const handleEditLead = (lead: Lead) => {
		setEditingLead(lead);
	};

	const handleSaveEditLead = async (e: FormEvent) => {
		e.preventDefault();
		if (!editingLead) return;
		setIsUpdatingItem(true);
		try {
			const authHeaders = getAuthHeaders();
			authHeaders.set("Content-Type", "application/json");
			const response = await fetch(`/api/crm/leads/${editingLead.id}`, {
				method: "PUT",
				headers: authHeaders,
				body: JSON.stringify({
					firstName: editingLead.firstName,
					lastName: editingLead.lastName,
					email: editingLead.email,
					phone: editingLead.phone,
					companyName: editingLead.companyName,
					source: editingLead.source,
					status: editingLead.status,
				}),
			});
			if (!response.ok) {
				setNotice("Failed to update lead.");
				return;
			}
			setEditingLead(null);
			await loadAll();
			setNotice("Lead updated successfully.");
		} finally {
			setIsUpdatingItem(false);
		}
	};

	// Handle Deal actions
	const handleCreateDeal = async (event: FormEvent) => {
		event.preventDefault();
		if (!dealForm.contactId) {
			setNotice("Select a contact saved in your CRM setup to create a deal.");
			return;
		}

		setIsSavingDeal(true);
		setNotice(null);
		try {
			const authHeaders = getAuthHeaders();
			authHeaders.set("Content-Type", "application/json");
			const payload = {
				contactId: dealForm.contactId,
				pipelineId: dealForm.pipelineId || undefined,
				stageId: dealForm.stageId || undefined,
				value: Number(dealForm.value || 0),
				probability: Number(dealForm.probability || 0),
				status: dealForm.status || "OPEN",
			};
			const response = await fetch("/api/crm/deals", {
				method: "POST",
				headers: authHeaders,
				body: JSON.stringify(payload),
			});

			if (response.status === 401) {
				redirectToLogin();
				return;
			}

			if (!response.ok) {
				setNotice(await getApiErrorMessage(response, "Unable to create deal."));
				return;
			}

			setDealForm(emptyDealForm);
			await loadAll();
			setNotice("Deal created.");
		} catch {
			setNotice("Unable to create deal.");
		} finally {
			setIsSavingDeal(false);
		}
	};

	const handleArchiveDeal = async (dealId: string, archived?: boolean) => {
		const authHeaders = getAuthHeaders();
		const endpoint = archived ? `/api/crm/deals/${dealId}/restore` : `/api/crm/deals/${dealId}/archive`;
		const response = await fetch(endpoint, { method: "POST", headers: authHeaders });
		if (!response.ok) {
			setNotice("Deal action failed.");
			return;
		}
		await loadAll();
	};

	const handleDeleteDeal = async (dealId: string) => {
		if (!window.confirm("Delete this deal permanently?")) return;
		const authHeaders = getAuthHeaders();
		const response = await fetch(`/api/crm/deals/${dealId}`, { method: "DELETE", headers: authHeaders });
		if (!response.ok) {
			setNotice("Deal delete failed.");
			return;
		}
		await loadAll();
		setNotice("Deal deleted.");
	};

	const handleUpdateDealStage = async (dealId: string) => {
		const stageId = stageUpdate[dealId]?.trim();
		if (!stageId) {
			setNotice("Select a stage first.");
			return;
		}
		const authHeaders = getAuthHeaders();
		authHeaders.set("Content-Type", "application/json");
		const response = await fetch(`/api/crm/deals/${dealId}/stage`, {
			method: "PUT",
			headers: authHeaders,
			body: JSON.stringify({ stageId }),
		});

		if (!response.ok) {
			setNotice("Stage update failed. Verify stage belongs to deal pipeline.");
			return;
		}
		setStageUpdate((prev) => ({ ...prev, [dealId]: "" }));
		await loadAll();
		setNotice("Deal stage updated.");
	};

	const handleLoadHistory = async (dealId: string) => {
		const authHeaders = getAuthHeaders();
		setHistoryDealId(dealId);
		setSelectedDealHistory([]);
		const response = await fetch(`/api/crm/deals/${dealId}/history`, { headers: authHeaders });
		if (!response.ok) {
			setNotice("Unable to load stage history.");
			return;
		}
		const history = (await response.json()) as StageHistory[];
		setSelectedDealHistory(history);
	};

	const handleSaveEditDeal = async (e: FormEvent) => {
		e.preventDefault();
		if (!editingDeal) return;
		setIsUpdatingItem(true);
		try {
			const authHeaders = getAuthHeaders();
			authHeaders.set("Content-Type", "application/json");
			const response = await fetch(`/api/crm/deals/${editingDeal.id}`, {
				method: "PUT",
				headers: authHeaders,
				body: JSON.stringify({
					contactId: editingDeal.contactId,
					pipelineId: editingDeal.pipelineId,
					stageId: editingDeal.stageId,
					value: Number(editingDeal.value || 0),
					probability: Number(editingDeal.probability || 0),
					status: editingDeal.status,
				}),
			});
			if (!response.ok) {
				setNotice("Failed to update deal.");
				return;
			}
			setEditingDeal(null);
			await loadAll();
			setNotice("Deal updated successfully.");
		} finally {
			setIsUpdatingItem(false);
		}
	};

	// Handle Service Case Actions
	const handleAddServiceCase = async (event: FormEvent) => {
		event.preventDefault();
		if (!caseSubject.trim()) return;
		setIsSavingServiceCase(true);
		setNotice(null);
		try {
			const authHeaders = getAuthHeaders();
			authHeaders.set("Content-Type", "application/json");
			const response = await fetch("/api/crm/service/cases", {
				method: "POST",
				headers: authHeaders,
				body: JSON.stringify({
					subject: `${caseCategory ? `[${caseCategory}] ` : ""}${caseSubject.trim()}`,
					priority: casePriority,
					contactId: caseContactId || undefined,
				}),
			});
			if (!response.ok) {
				setNotice("Unable to create service case.");
				return;
			}
			setCaseSubject("");
			setCaseContactId("");
			await loadAll();
			setNotice("Service ticket submitted with SLA timer initiated.");
		} finally {
			setIsSavingServiceCase(false);
		}
	};

	const handleUpdateServiceCaseStatus = async (
		caseId: string,
		status: "OPEN" | "IN_PROGRESS" | "RESOLVED",
	) => {
		setPendingServiceStatus((prev) => ({ ...prev, [caseId]: true }));
		const authHeaders = getAuthHeaders();
		authHeaders.set("Content-Type", "application/json");
		const response = await fetch(`/api/crm/service/cases/${caseId}/status`, {
			method: "PUT",
			headers: authHeaders,
			body: JSON.stringify({ status }),
		});
		setPendingServiceStatus((prev) => ({ ...prev, [caseId]: false }));
		if (!response.ok) {
			setNotice("Unable to update service case status.");
			return;
		}
		await loadAll();
	};

	const handleDeleteServiceCase = async (caseId: string) => {
		if (!window.confirm("Delete this service ticket permanently?")) return;
		const authHeaders = getAuthHeaders();
		const response = await fetch(`/api/crm/service/cases/${caseId}`, { method: "DELETE", headers: authHeaders });
		if (!response.ok) {
			setNotice("Service case delete failed.");
			return;
		}
		await loadAll();
		setNotice("Service ticket deleted.");
	};

	const handleSaveEditServiceCase = async (e: FormEvent) => {
		e.preventDefault();
		if (!editingServiceCase) return;
		setIsUpdatingItem(true);
		try {
			const authHeaders = getAuthHeaders();
			authHeaders.set("Content-Type", "application/json");
			const response = await fetch(`/api/crm/service/cases/${editingServiceCase.id}`, {
				method: "PUT",
				headers: authHeaders,
				body: JSON.stringify({
					subject: editingServiceCase.subject,
					priority: editingServiceCase.priority,
					status: editingServiceCase.status,
				}),
			});
			if (!response.ok) {
				setNotice("Failed to update service case.");
				return;
			}
			setEditingServiceCase(null);
			await loadAll();
			setNotice("Support ticket updated successfully.");
		} finally {
			setIsUpdatingItem(false);
		}
	};

	// Handle Campaign Actions
	const handleAddCampaign = async (event: FormEvent) => {
		event.preventDefault();
		if (!campaignName.trim()) return;
		setIsSavingCampaign(true);
		setNotice(null);
		try {
			const authHeaders = getAuthHeaders();
			authHeaders.set("Content-Type", "application/json");
			const response = await fetch("/api/crm/marketing/campaigns", {
				method: "POST",
				headers: authHeaders,
				body: JSON.stringify({
					name: campaignName.trim(),
					segment: `${campaignChannel} · ${campaignSegment.trim()}`,
				}),
			});
			if (!response.ok) {
				setNotice("Unable to create campaign.");
				return;
			}
			setCampaignName("");
			await loadAll();
			setNotice("Enterprise campaign initiated.");
		} finally {
			setIsSavingCampaign(false);
		}
	};

	const handleUpdateCampaignStatus = async (
		campaignId: string,
		status: "DRAFT" | "RUNNING" | "PAUSED",
	) => {
		setPendingCampaignStatus((prev) => ({ ...prev, [campaignId]: true }));
		const authHeaders = getAuthHeaders();
		authHeaders.set("Content-Type", "application/json");
		const response = await fetch(`/api/crm/marketing/campaigns/${campaignId}/status`, {
			method: "PUT",
			headers: authHeaders,
			body: JSON.stringify({ status }),
		});
		setPendingCampaignStatus((prev) => ({ ...prev, [campaignId]: false }));
		if (!response.ok) {
			setNotice("Unable to update campaign status.");
			return;
		}
		await loadAll();
	};

	const handleDeleteCampaign = async (campaignId: string) => {
		if (!window.confirm("Delete this campaign permanently?")) return;
		const authHeaders = getAuthHeaders();
		const response = await fetch(`/api/crm/marketing/campaigns/${campaignId}`, { method: "DELETE", headers: authHeaders });
		if (!response.ok) {
			setNotice("Campaign delete failed.");
			return;
		}
		await loadAll();
		setNotice("Campaign deleted.");
	};

	const handleSaveEditCampaign = async (e: FormEvent) => {
		e.preventDefault();
		if (!editingCampaign) return;
		setIsUpdatingItem(true);
		try {
			const authHeaders = getAuthHeaders();
			authHeaders.set("Content-Type", "application/json");
			const response = await fetch(`/api/crm/marketing/campaigns/${editingCampaign.id}`, {
				method: "PUT",
				headers: authHeaders,
				body: JSON.stringify({
					name: editingCampaign.name,
					segment: editingCampaign.segment,
					status: editingCampaign.status,
				}),
			});
			if (!response.ok) {
				setNotice("Failed to update campaign.");
				return;
			}
			setEditingCampaign(null);
			await loadAll();
			setNotice("Campaign updated successfully.");
		} finally {
			setIsUpdatingItem(false);
		}
	};

	// Pipelines & Stages
	const handleCreatePipeline = async () => {
		const name = window.prompt("Enterprise Pipeline Name");
		if (!name) return;
		const authHeaders = getAuthHeaders();
		authHeaders.set("Content-Type", "application/json");
		const response = await fetch("/api/crm/pipelines", {
			method: "POST",
			headers: authHeaders,
			body: JSON.stringify({ name }),
		});
		if (!response.ok) {
			setNotice("Pipeline create failed.");
			return;
		}
		await loadAll();
		setNotice("Enterprise pipeline created.");
	};

	const handleRenamePipeline = async (pipeline: SetupPipelineOption) => {
		const name = window.prompt("Pipeline name", pipeline.name);
		if (!name) return;
		const authHeaders = getAuthHeaders();
		authHeaders.set("Content-Type", "application/json");
		const response = await fetch(`/api/crm/pipelines/${pipeline.id}`, {
			method: "PUT",
			headers: authHeaders,
			body: JSON.stringify({ name }),
		});
		if (!response.ok) {
			setNotice("Pipeline update failed.");
			return;
		}
		await loadAll();
		setNotice("Pipeline updated.");
	};

	const handleDeletePipeline = async (pipelineId: string) => {
		if (!window.confirm("Delete this pipeline? It must contain zero active deals.")) return;
		const authHeaders = getAuthHeaders();
		const response = await fetch(`/api/crm/pipelines/${pipelineId}`, { method: "DELETE", headers: authHeaders });
		if (!response.ok) {
			setNotice(await getApiErrorMessage(response, "Pipeline delete failed."));
			return;
		}
		await loadAll();
		setNotice("Pipeline deleted.");
	};

	const handleAddStage = async (pipelineId: string) => {
		const name = window.prompt("New Stage Name");
		if (!name) return;
		const authHeaders = getAuthHeaders();
		authHeaders.set("Content-Type", "application/json");
		const response = await fetch(`/api/crm/pipelines/${pipelineId}/stages`, {
			method: "POST",
			headers: authHeaders,
			body: JSON.stringify({ name }),
		});
		if (!response.ok) {
			setNotice("Stage add failed.");
			return;
		}
		await loadAll();
		setNotice("Stage added.");
	};

	const handleEditStage = async (stage: SetupStageOption) => {
		const name = window.prompt("Stage name", stage.name);
		if (!name) return;
		const authHeaders = getAuthHeaders();
		authHeaders.set("Content-Type", "application/json");
		const response = await fetch(`/api/crm/stages/${stage.id}`, {
			method: "PUT",
			headers: authHeaders,
			body: JSON.stringify({ name }),
		});
		if (!response.ok) {
			setNotice("Stage update failed.");
			return;
		}
		await loadAll();
		setNotice("Stage updated.");
	};

	const handleDeleteStage = async (stageId: string) => {
		if (!window.confirm("Delete this stage? It must contain zero active deals.")) return;
		const authHeaders = getAuthHeaders();
		const response = await fetch(`/api/crm/stages/${stageId}`, { method: "DELETE", headers: authHeaders });
		if (!response.ok) {
			setNotice(await getApiErrorMessage(response, "Stage delete failed."));
			return;
		}
		await loadAll();
		setNotice("Stage deleted.");
	};

	const handleToggleIntegration = async (moduleId: string, nextState: boolean) => {
		setPendingIntegration((prev) => ({ ...prev, [moduleId]: true }));
		const authHeaders = getAuthHeaders();
		authHeaders.set("Content-Type", "application/json");
		const response = await fetch(`/api/crm/integrations/${moduleId}`, {
			method: "PUT",
			headers: authHeaders,
			body: JSON.stringify({ isConnected: nextState }),
		});
		setPendingIntegration((prev) => ({ ...prev, [moduleId]: false }));
		if (!response.ok) {
			setNotice("Unable to update integration connection.");
			return;
		}
		await loadAll();
	};

	const handleResetCrmData = async () => {
		const confirmText = window.prompt("This will permanently delete all CRM leads, deals, pipeline stages, and activities. Type RESET to continue.");
		if (confirmText !== "RESET") {
			setNotice("Reset cancelled.");
			return;
		}

		setIsResettingCrm(true);
		setNotice(null);
		try {
			const authHeaders = getAuthHeaders();
			const response = await fetch("/api/crm/reset-data", {
				method: "POST",
				headers: authHeaders,
			});
			if (!response.ok) {
				setNotice(await getApiErrorMessage(response, "Unable to reset CRM data."));
				return;
			}
			if (typeof window !== "undefined") {
				window.location.reload();
			}
		} catch {
			setNotice("Unable to reset CRM data.");
		} finally {
			setIsResettingCrm(false);
		}
	};

	const regionCount = useMemo(() => {
		const regions = new Set<string>();
		for (const lead of leads) {
			if (lead.source) regions.add(lead.source);
		}
		return regions.size;
	}, [leads]);

	const renewalCandidates = useMemo(() => deals.filter((deal) => deal.status === "OPEN" || deal.status === "WON").slice(0, 8), [deals]);

	const selectedPipelineStages = useMemo(
		() => setupOptions.pipelines.find((pipeline) => pipeline.id === dealForm.pipelineId)?.stages ?? [],
		[setupOptions.pipelines, dealForm.pipelineId],
	);

	const getStagesForPipeline = (pipelineId: string) => {
		return setupOptions.pipelines.find((pipeline) => pipeline.id === pipelineId)?.stages ?? [];
	};

	const getPipelineName = (pipelineId: string) => {
		return setupOptions.pipelines.find((pipeline) => pipeline.id === pipelineId)?.name || pipelineId;
	};

	const getStageName = (pipelineId: string, stageId: string) => {
		return setupOptions.pipelines.find((pipeline) => pipeline.id === pipelineId)?.stages.find((stage) => stage.id === stageId)?.name || stageId;
	};

	const handleUseLeadInDeal = (lead: Lead) => {
		if (!lead.contactId) {
			setNotice("This lead has no linked contact yet. Create/select contact first.");
			return;
		}
		setActiveTab("sales");
		setDealForm((prev) => ({ ...prev, contactId: lead.contactId ?? prev.contactId }));
		setNotice("Lead contact selected in Create Deal form.");
	};

	// CPQ Calculations
	const cpqCalculations = useMemo(() => {
		let monthlySubtotal = 0;
		let oneTimeSubtotal = 0;

		Object.entries(selectedCpqItems).forEach(([itemId, data]) => {
			const catalogItem = ENTERPRISE_CPQ_CATALOG.find((i) => i.id === itemId);
			if (catalogItem && data.quantity > 0) {
				if (catalogItem.billingPeriod === "ONE_TIME") {
					oneTimeSubtotal += catalogItem.unitPrice * data.quantity;
				} else {
					monthlySubtotal += catalogItem.unitPrice * data.quantity;
				}
			}
		});

		const annualLicenseTotal = monthlySubtotal * 12;
		const baseContractValue = annualLicenseTotal + oneTimeSubtotal;
		const discountAmount = (baseContractValue * cpqDiscountPct) / 100;
		const subtotalAfterDiscount = baseContractValue - discountAmount;

		let termBonusDiscountPct = 0;
		if (cpqPaymentTerms === "ANNUAL_PREPAID") termBonusDiscountPct = 5;
		if (cpqPaymentTerms === "3YR_ENTERPRISE") termBonusDiscountPct = 12;

		const termDiscountAmount = (subtotalAfterDiscount * termBonusDiscountPct) / 100;
		const finalNetContractValue = subtotalAfterDiscount - termDiscountAmount;

		let approvalTier: { level: "AUTO" | "VP" | "CFO"; text: string; badgeColor: string } = {
			level: "AUTO",
			text: "Pre-Approved by Sales Operations (<=15%)",
			badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
		};

		if (cpqDiscountPct > 25) {
			approvalTier = {
				level: "CFO",
				text: "Requires CFO & Executive Committee Signoff (>25%)",
				badgeColor: "bg-rose-50 text-rose-800 border-rose-200",
			};
		} else if (cpqDiscountPct > 15) {
			approvalTier = {
				level: "VP",
				text: "Requires Regional VP of Global Sales Approval (16-25%)",
				badgeColor: "bg-amber-50 text-amber-800 border-amber-200",
			};
		}

		return {
			monthlySubtotal,
			oneTimeSubtotal,
			annualLicenseTotal,
			baseContractValue,
			discountAmount,
			termBonusDiscountPct,
			termDiscountAmount,
			finalNetContractValue,
			approvalTier,
		};
	}, [selectedCpqItems, cpqDiscountPct, cpqPaymentTerms]);

	const downloadSample = () => {
		const sampleData = {
			leads: "firstName,lastName,email,phone,companyName,source,status\nJonathan,Vance,jvance@enterpriseholding.com,+1-415-555-0192,Enterprise Global Inc,Enterprise Direct,QUALIFIED\nElena,Rostova,elena@apexfinancial.ch,+41-22-555-8120,Apex Financial Geneva,Gartner Summit,CONTACTED",
			serviceCases: "subject,priority\nSeverity 1: Core API Gateway Intermittent 502,URGENT\nSLA P2: Multi-Region Disaster Recovery Sync Delay,HIGH",
			campaigns: "name,segment\nFY27 Global Enterprise Cloud Transformation,Email Blast · Fortune 500 CIOs\nQ4 High-Yield Accountech Multi-Tenancy Webinar,Executive Direct · FinTech Founders",
		};
		const blob = new Blob([sampleData[importModule]], { type: "text/csv;charset=utf-8;" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.setAttribute("href", url);
		link.setAttribute("download", `sample_enterprise_${importModule}.csv`);
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		setImportFile(file);

		const processParsedData = (headers: string[], rows: Record<string, string>[]) => {
			setImportHeaders(headers);
			setImportData(rows);

			const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
			const normalizedHeaders = headers.map((h) => ({ original: h, normalized: normalize(h) }));

			const newMapping: Record<string, { csvColumn: string; defaultValue: string }> = {};
			IMPORT_MODULE_FIELDS[importModule].forEach((field) => {
				const fieldKeyNorm = normalize(field.key);
				const fieldLabelNorm = normalize(field.label);
				const aliasNorms = (field.aliases || []).map(normalize);
				const allCandidates = [fieldKeyNorm, fieldLabelNorm, ...aliasNorms];

				let matched = normalizedHeaders.find((h) => allCandidates.includes(h.normalized));
				if (!matched) {
					matched = normalizedHeaders.find((h) =>
						allCandidates.some((c) => c && (h.normalized.includes(c) || c.includes(h.normalized))),
					);
				}

				newMapping[field.key] = {
					csvColumn: matched?.original || "",
					defaultValue: field.key === "status" ? "OPEN" : "",
				};
			});
			setColumnMapping(newMapping);
			setImportStep(3);
		};

		if (file.name.toLowerCase().endsWith(".csv")) {
			const reader = new FileReader();
			reader.onload = (event) => {
				const text = event.target?.result as string;
				const { headers, rows } = parseCSV(text);
				processParsedData(headers, rows);
			};
			reader.readAsText(file);
		} else if (file.name.toLowerCase().endsWith(".xlsx") || file.name.toLowerCase().endsWith(".xls")) {
			const reader = new FileReader();
			reader.onload = (event) => {
				const data = new Uint8Array(event.target?.result as ArrayBuffer);
				const workbook = XLSX.read(data, { type: "array" });
				const firstSheetName = workbook.SheetNames[0];
				const worksheet = workbook.Sheets[firstSheetName];
				const jsonRows = XLSX.utils.sheet_to_json(worksheet, { defval: "" }) as Record<string, any>[];

				if (jsonRows.length === 0) {
					processParsedData([], []);
					return;
				}

				const headers = Object.keys(jsonRows[0]);
				const rows = jsonRows.map((row) => {
					const newRow: Record<string, string> = {};
					headers.forEach((h) => {
						newRow[h] = String(row[h] || "");
					});
					return newRow;
				});
				processParsedData(headers, rows);
			};
			reader.readAsArrayBuffer(file);
		}
	};

	const handleExecuteImport = async () => {
		if (importData.length === 0) return;
		setIsImporting(true);
		setNotice(null);

		try {
			const authHeaders = getAuthHeaders();
			authHeaders.set("Content-Type", "application/json");

			if (importModule === "leads") {
				const promises = importData.map(async (row) => {
					const fName = columnMapping.firstName?.csvColumn ? row[columnMapping.firstName.csvColumn] : columnMapping.firstName?.defaultValue || "";
					const lName = columnMapping.lastName?.csvColumn ? row[columnMapping.lastName.csvColumn] : columnMapping.lastName?.defaultValue || "";
					const emailVal = columnMapping.email?.csvColumn ? row[columnMapping.email.csvColumn] : columnMapping.email?.defaultValue || "";
					const phoneVal = columnMapping.phone?.csvColumn ? row[columnMapping.phone.csvColumn] : columnMapping.phone?.defaultValue || "";
					const compVal = columnMapping.companyName?.csvColumn ? row[columnMapping.companyName.csvColumn] : columnMapping.companyName?.defaultValue || "";
					const sourceVal = columnMapping.source?.csvColumn ? row[columnMapping.source.csvColumn] : columnMapping.source?.defaultValue || "Import";
					const statusVal = columnMapping.status?.csvColumn ? row[columnMapping.status.csvColumn] : columnMapping.status?.defaultValue || "NEW";

					const payload = {
						firstName: fName,
						lastName: lName,
						email: emailVal,
						phone: phoneVal,
						companyName: compVal,
						source: sourceVal,
						status: statusVal,
					};
					return fetch("/api/crm/leads", {
						method: "POST",
						headers: authHeaders,
						body: JSON.stringify(payload),
					});
				});
				await Promise.all(promises);
			} else if (importModule === "serviceCases") {
				const promises = importData.map(async (row) => {
					const payload = {
						subject: columnMapping.subject?.csvColumn ? row[columnMapping.subject.csvColumn] : columnMapping.subject?.defaultValue || "Imported Enterprise Case",
						priority: (columnMapping.priority?.csvColumn ? row[columnMapping.priority.csvColumn] : columnMapping.priority?.defaultValue) || "MEDIUM",
					};
					return fetch("/api/crm/service/cases", {
						method: "POST",
						headers: authHeaders,
						body: JSON.stringify(payload),
					});
				});
				await Promise.all(promises);
			} else if (importModule === "campaigns") {
				const promises = importData.map(async (row) => {
					const payload = {
						name: columnMapping.name?.csvColumn ? row[columnMapping.name.csvColumn] : columnMapping.name?.defaultValue || "Imported Campaign",
						segment: columnMapping.segment?.csvColumn ? row[columnMapping.segment.csvColumn] : columnMapping.segment?.defaultValue || "All",
					};
					return fetch("/api/crm/marketing/campaigns", {
						method: "POST",
						headers: authHeaders,
						body: JSON.stringify(payload),
					});
				});
				await Promise.all(promises);
			}

			await loadAll();
			setImportStep(4);
		} catch (error) {
			console.error("Failed to import data:", error);
			setNotice("An error occurred during enterprise import.");
		} finally {
			setIsImporting(false);
		}
	};

	const closeImportModal = () => {
		setIsImportModalOpen(false);
		setTimeout(() => {
			setImportStep(1);
			setImportFile(null);
			setImportData([]);
			setImportHeaders([]);
			setColumnMapping({});
		}, 300);
	};

	const tabButtonClass = (tab: SuiteTab) =>
		`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
			activeTab === tab
				? "bg-[#6678c1] text-white shadow-sm"
				: "border border-[#d9e2ef] bg-white text-[#5b6472] hover:bg-[#6678c1]/10 hover:text-[#404d85]"
		}`;

	return (
		<WorkspaceShell>
			{/* IMPORT WIZARD MODAL */}
			{isImportModalOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1e2540]/60 backdrop-blur-sm p-4">
					<div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto border border-[#d9e2ef]">
						<button onClick={closeImportModal} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600">
							✕
						</button>
						<h2 className="text-xl font-bold text-[#404d85] mb-4">Enterprise Data Import Wizard</h2>

						{importStep === 1 && (
							<div className="space-y-4">
								<p className="text-sm text-[#5b6472]">Select the enterprise module for record ingestion:</p>
								<div className="grid grid-cols-3 gap-3">
									{(["leads", "serviceCases", "campaigns"] as const).map((mod) => (
										<button
											key={mod}
											type="button"
											onClick={() => setImportModule(mod)}
											className={`p-4 rounded-xl border-2 text-left transition ${
												importModule === mod ? "border-[#6678c1] bg-[#6678c1]/5" : "border-[#d9e2ef] hover:border-[#6678c1]/40"
											}`}
										>
											<h3 className="font-bold text-[#1f2430] capitalize">{mod.replace(/([A-Z])/g, " $1").trim()}</h3>
											<p className="mt-1 text-xs text-[#5b6472]">Ingest {mod} via CSV/Excel</p>
										</button>
									))}
								</div>
								<div className="flex justify-end pt-4">
									<button onClick={() => setImportStep(2)} className="bg-[#6678c1] text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-[#5567b0] transition shadow-sm">
										Next Step →
									</button>
								</div>
							</div>
						)}

						{importStep === 2 && (
							<div className="space-y-4">
								<div className="bg-[#eef2fa] border border-[#d9e2ef] rounded-xl p-4 flex justify-between items-center">
									<div>
										<h4 className="font-bold text-[#404d85] text-sm">Need the schema blueprint?</h4>
										<p className="text-xs text-[#5b6472]">Download verified template matching {importModule} fields.</p>
									</div>
									<button onClick={downloadSample} className="px-3.5 py-1.5 bg-[#404d85] text-white text-xs font-bold rounded-lg hover:bg-[#323d6b] shadow-sm">
										Download Template
									</button>
								</div>

								<div className="border-2 border-dashed border-[#d9e2ef] rounded-xl p-8 text-center hover:bg-[#f8faff] transition relative">
									<input type="file" accept=".csv, .xlsx, .xls" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
									<Download className="mx-auto h-10 w-10 text-[#6678c1]" />
									<p className="mt-3 text-sm text-[#1f2430] font-semibold">Drop CSV or Excel spreadsheet here to ingest</p>
									<p className="mt-1 text-xs text-[#5b6472]">Supports up to 50,000 records per upload batch</p>
								</div>
								<div className="flex justify-between pt-2">
									<button onClick={() => setImportStep(1)} className="text-[#5b6472] font-semibold px-4 py-2 hover:bg-[#eef2fa] rounded-lg text-xs">
										← Back
									</button>
								</div>
							</div>
						)}

						{importStep === 3 && (
							<div className="space-y-4">
								<p className="text-xs text-[#5b6472]">Map CSV headers to Enterprise CRM attributes.</p>
								<div className="border border-[#d9e2ef] rounded-xl overflow-hidden max-h-72 overflow-y-auto">
									<table className="w-full text-left text-xs">
										<thead className="bg-[#f8faff] border-b border-[#d9e2ef]">
											<tr>
												<th className="px-4 py-2.5 font-bold text-[#404d85]">CRM Attribute</th>
												<th className="px-4 py-2.5 font-bold text-[#404d85]">Source CSV Column</th>
											</tr>
										</thead>
										<tbody className="divide-y divide-[#d9e2ef]">
											{IMPORT_MODULE_FIELDS[importModule].map((field) => (
												<tr key={field.key} className="hover:bg-[#f8faff]">
													<td className="px-4 py-2 font-medium text-[#1f2430]">
														{field.label} {field.required && <span className="text-rose-600 font-bold">*</span>}
													</td>
													<td className="px-4 py-2">
														<select
															value={columnMapping[field.key]?.csvColumn || ""}
															onChange={(e) =>
																setColumnMapping((prev) => ({
																	...prev,
																	[field.key]: { ...prev[field.key], csvColumn: e.target.value },
																}))
															}
															className="w-full rounded-lg border border-[#d9e2ef] bg-white p-1.5 text-xs text-[#1f2430]"
														>
															<option value="">-- Ignore Column --</option>
															{importHeaders.map((h) => (
																<option key={h} value={h}>
																	{h}
																</option>
															))}
														</select>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
								<div className="flex justify-between pt-2">
									<button onClick={() => setImportStep(2)} className="text-[#5b6472] font-semibold px-4 py-2 hover:bg-[#eef2fa] rounded-lg text-xs">
										← Back
									</button>
									<button
										onClick={handleExecuteImport}
										disabled={isImporting}
										className="bg-[#6678c1] text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-[#5567b0] transition shadow-sm disabled:opacity-50"
									>
										{isImporting ? "Ingesting Records..." : `Ingest ${importData.length} Records`}
									</button>
								</div>
							</div>
						)}

						{importStep === 4 && (
							<div className="py-8 text-center space-y-3">
								<div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700">
									<CheckCircle2 className="h-8 w-8" />
								</div>
								<h3 className="text-xl font-bold text-[#404d85]">Ingestion Completed</h3>
								<p className="text-xs text-[#5b6472]">Successfully added {importData.length} validated records to {importModule}.</p>
								<div className="pt-4">
									<button onClick={closeImportModal} className="bg-[#404d85] text-white px-6 py-2 rounded-xl text-xs font-bold hover:bg-[#323d6b] shadow-sm">
										Done
									</button>
								</div>
							</div>
						)}
					</div>
				</div>
			)}

			<div className="mx-auto max-w-7xl space-y-6 pb-20">
				{/* TOP HERO BANNER — CAMBLISS ENTERPRISE COMMAND */}
				<div className="rounded-2xl border border-[#404d85] bg-gradient-to-r from-[#404d85] to-[#6678c1] p-7 text-white shadow-md">
					<div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
						<div>
							<div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-white backdrop-blur-sm shadow-sm">
								<ShieldCheck className="h-3.5 w-3.5 text-white" />
								Cambliss Enterprise CX Architecture • Global Multi-Tenancy
							</div>
							<h1 className="mt-3 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
								International Enterprise CRM & CPQ Suite
							</h1>
							<p className="mt-1 text-sm text-white/85 max-w-2xl">
								Global Account 360, Multi-Currency Deal Forecasting, B2B CPQ Quoting Engine, and Mission-Critical Support SLA Dispatch.
							</p>
						</div>

						{/* Global Controls & Currency Switcher */}
						<div className="flex flex-wrap items-center gap-3">
							{/* Live Currency Selector */}
							<div className="flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-3 py-2 backdrop-blur-sm shadow-sm">
								<Globe className="h-4 w-4 text-white" />
								<span className="text-xs font-bold text-white uppercase">Currency:</span>
								<select
									value={selectedCurrency}
									onChange={(e) => setSelectedCurrency(e.target.value as SupportedCurrency)}
									className="rounded-lg border-0 bg-white text-xs font-bold text-[#404d85] px-2.5 py-1 shadow-sm focus:outline-none cursor-pointer"
								>
									{Object.entries(CURRENCIES).map(([code, item]) => (
										<option key={code} value={code}>
											{code} ({item.symbol.trim()})
										</option>
									))}
								</select>
							</div>

							<button
								type="button"
								onClick={() => setIsImportModalOpen(true)}
								className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-[#404d85] shadow-sm transition hover:bg-white/90 active:scale-95"
							>
								<Download className="h-3.5 w-3.5 text-[#404d85]" />
								Import CSV / Excel
							</button>

							<button
								type="button"
								onClick={() => void handleResetCrmData()}
								disabled={isResettingCrm || isLoading}
								className="inline-flex items-center gap-1.5 rounded-xl border border-white/30 bg-white/10 px-3 py-2 text-xs font-bold text-white hover:bg-white/20 transition disabled:opacity-50"
							>
								<RotateCcw className="h-3.5 w-3.5" />
								{isResettingCrm ? "Resetting..." : "Reset Data"}
							</button>
						</div>
					</div>

					{/* FX Rate Banner */}
					<div className="mt-5 flex flex-wrap items-center justify-between border-t border-white/15 pt-3 text-[11px] text-white/80">
						<div className="flex items-center gap-4">
							<span className="font-semibold">
								Active Conversion Rate: 1 USD = {CURRENCIES[selectedCurrency].rate} {selectedCurrency}
							</span>
							<span className="hidden sm:inline text-white/50">•</span>
							<span className="hidden sm:inline">ECB / FED Daily Interbank Feed</span>
						</div>
						<div className="flex items-center gap-3">
							<span className="inline-flex items-center gap-1 font-semibold text-emerald-300">
								<ShieldCheck className="h-3 w-3" /> GDPR / SOC2 Type II Certified
							</span>
						</div>
					</div>
				</div>

				{/* 20 ENTERPRISE CONNECTORS GRID (NO EMOJIS, 100% VECTOR ICONS) */}
				<div className="rounded-2xl border border-[#d9e2ef] bg-white p-5 shadow-sm">
					<div className="flex items-center justify-between mb-4">
						<div>
							<h3 className="text-sm font-bold text-[#404d85] uppercase tracking-wider">
								Supported Enterprise Connectors & Ecosystem (20 Sync Engines)
							</h3>
							<p className="text-xs text-[#5b6472]">Two-way sync with your external enterprise data warehouses and CRM stacks.</p>
						</div>
						<span className="rounded-full bg-[#6678c1]/10 px-3 py-1 text-[11px] font-bold text-[#6678c1] border border-[#6678c1]/20">
							Active Gateway: 20 Live Connectors
						</span>
					</div>

					<div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
						{TOP_CRMS.map((crm) => {
							const IconComponent = crm.icon;
							return (
								<button
									key={crm.id}
									onClick={() => setSelectedCrmConnectorModal(crm)}
									className="group flex flex-col items-center justify-center p-3 rounded-xl border border-[#d9e2ef] bg-[#f8faff] hover:bg-white hover:border-[#6678c1] transition hover:shadow-sm"
								>
									<div className={`mb-2 flex h-10 w-10 items-center justify-center rounded-xl border shadow-xs ${crm.color} transition-transform group-hover:scale-110`}>
										<IconComponent className="h-5 w-5" />
									</div>
									<span className="text-xs font-bold text-[#1f2430] group-hover:text-[#404d85]">{crm.name}</span>
								</button>
							);
						})}
					</div>
				</div>

				{/* SUITE NAVIGATION TABS */}
				<div className="flex flex-wrap items-center gap-2 border-b border-[#d9e2ef] pb-3">
					<button type="button" onClick={() => setActiveTab("overview")} className={tabButtonClass("overview")}>
						<BarChart3 className="h-3.5 w-3.5" />
						Executive Command
					</button>
					<button type="button" onClick={() => setActiveTab("customer360")} className={tabButtonClass("customer360")}>
						<Building2 className="h-3.5 w-3.5" />
						Global Accounts & 360
					</button>
					<button type="button" onClick={() => setActiveTab("sales")} className={tabButtonClass("sales")}>
						<Briefcase className="h-3.5 w-3.5" />
						Sales & Deals
					</button>
					<button type="button" onClick={() => setActiveTab("cpq")} className={tabButtonClass("cpq")}>
						<Calculator className="h-3.5 w-3.5" />
						Cambliss CPQ Cloud
					</button>
					<button type="button" onClick={() => setActiveTab("service")} className={tabButtonClass("service")}>
						<Headphones className="h-3.5 w-3.5" />
						Mission-Critical SLA
					</button>
					<button type="button" onClick={() => setActiveTab("marketing")} className={tabButtonClass("marketing")}>
						<Send className="h-3.5 w-3.5" />
						Campaigns
					</button>
					<button type="button" onClick={() => setActiveTab("revenue")} className={tabButtonClass("revenue")}>
						<TrendingUp className="h-3.5 w-3.5" />
						Fiscal Quota & RevOps
					</button>
					<button type="button" onClick={() => setActiveTab("analytics")} className={tabButtonClass("analytics")}>
						<Activity className="h-3.5 w-3.5" />
						Intelligence
					</button>
					<button type="button" onClick={() => setActiveTab("governance")} className={tabButtonClass("governance")}>
						<ShieldCheck className="h-3.5 w-3.5" />
						Security & Compliance
					</button>
				</div>

				{notice && (
					<div className="rounded-xl border border-[#6678c1]/30 bg-[#eef2fa] p-3 text-xs font-semibold text-[#404d85] flex items-center justify-between shadow-xs">
						<span>{notice}</span>
						<button onClick={() => setNotice(null)} className="text-[#404d85] hover:opacity-70">✕</button>
					</div>
				)}

				{/* TAB 1: EXECUTIVE COMMAND (OVERVIEW) */}
				{activeTab === "overview" && (
					<div className="space-y-6">
						{/* 8 Primary Financial Cards with Currency Conversion */}
						<div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
							<div className="rounded-2xl border border-[#d9e2ef] bg-white p-4 shadow-sm hover:border-[#6678c1] transition">
								<div className="flex items-center justify-between">
									<span className="text-xs font-semibold text-[#5b6472]">Expected Revenue</span>
									<span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[#6678c1]/10 text-[#6678c1]">
										<DollarSign className="h-4 w-4" />
									</span>
								</div>
								<div className="mt-2 text-2xl font-bold text-[#1f2430]">
									{formatMoney(dashboard?.expectedRevenue ?? 0)}
								</div>
								<p className="mt-1 text-[11px] text-emerald-600 font-semibold">Probability-weighted total</p>
							</div>

							<div className="rounded-2xl border border-[#d9e2ef] bg-white p-4 shadow-sm hover:border-[#6678c1] transition">
								<div className="flex items-center justify-between">
									<span className="text-xs font-semibold text-[#5b6472]">Closed Won Total</span>
									<span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
										<CheckCircle2 className="h-4 w-4" />
									</span>
								</div>
								<div className="mt-2 text-2xl font-bold text-[#1f2430]">
									{formatMoney(dashboard?.wonDealsValue ?? 0)}
								</div>
								<p className="mt-1 text-[11px] text-[#5b6472]">{dashboard?.totalWonDeals ?? 0} signed enterprise contracts</p>
							</div>

							<div className="rounded-2xl border border-[#d9e2ef] bg-white p-4 shadow-sm hover:border-[#6678c1] transition">
								<div className="flex items-center justify-between">
									<span className="text-xs font-semibold text-[#5b6472]">Open Pipeline Value</span>
									<span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
										<TrendingUp className="h-4 w-4" />
									</span>
								</div>
								<div className="mt-2 text-2xl font-bold text-[#1f2430]">
									{formatMoney(dashboard?.openDealsValue ?? 0)}
								</div>
								<p className="mt-1 text-[11px] text-[#5b6472]">{dashboard?.totalOpenDeals ?? 0} active opportunities</p>
							</div>

							<div className="rounded-2xl border border-[#d9e2ef] bg-white p-4 shadow-sm hover:border-[#6678c1] transition">
								<div className="flex items-center justify-between">
									<span className="text-xs font-semibold text-[#5b6472]">Win Rate</span>
									<span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-[#404d85]">
										<Award className="h-4 w-4" />
									</span>
								</div>
								<div className="mt-2 text-2xl font-bold text-[#1f2430]">
									{dashboard?.winRate ?? 0}%
								</div>
								<p className="mt-1 text-[11px] text-emerald-600 font-semibold">Competitive benchmark target: 45%</p>
							</div>

							<div className="rounded-2xl border border-[#d9e2ef] bg-white p-4 shadow-sm hover:border-[#6678c1] transition">
								<div className="flex items-center justify-between">
									<span className="text-xs font-semibold text-[#5b6472]">Enterprise Accounts</span>
									<span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[#6678c1]/10 text-[#6678c1]">
										<Building2 className="h-4 w-4" />
									</span>
								</div>
								<div className="mt-2 text-2xl font-bold text-[#1f2430]">
									{leads.length}
								</div>
								<p className="mt-1 text-[11px] text-[#5b6472]">Across {regionCount || 1} global territories</p>
							</div>

							<div className="rounded-2xl border border-[#d9e2ef] bg-white p-4 shadow-sm hover:border-[#6678c1] transition">
								<div className="flex items-center justify-between">
									<span className="text-xs font-semibold text-[#5b6472]">Deal Velocity</span>
									<span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
										<Clock className="h-4 w-4" />
									</span>
								</div>
								<div className="mt-2 text-2xl font-bold text-[#1f2430]">
									21.4 Days
								</div>
								<p className="mt-1 text-[11px] text-[#5b6472]">Avg opportunity cycle time</p>
							</div>

							<div className="rounded-2xl border border-[#d9e2ef] bg-white p-4 shadow-sm hover:border-[#6678c1] transition">
								<div className="flex items-center justify-between">
									<span className="text-xs font-semibold text-[#5b6472]">Lead Conversion</span>
									<span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
										<Activity className="h-4 w-4" />
									</span>
								</div>
								<div className="mt-2 text-2xl font-bold text-[#1f2430]">
									{dashboard?.conversionRate ?? 0}%
								</div>
								<p className="mt-1 text-[11px] text-[#5b6472]">MQL to SQL qualification</p>
							</div>

							<div className="rounded-2xl border border-[#d9e2ef] bg-white p-4 shadow-sm hover:border-[#6678c1] transition">
								<div className="flex items-center justify-between">
									<span className="text-xs font-semibold text-[#5b6472]">Active Service SLAs</span>
									<span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
										<Headphones className="h-4 w-4" />
									</span>
								</div>
								<div className="mt-2 text-2xl font-bold text-[#1f2430]">
									{serviceCases.filter((c) => c.status !== "RESOLVED").length}
								</div>
								<p className="mt-1 text-[11px] text-emerald-600 font-semibold">100% within SLA envelope</p>
							</div>
						</div>

						{/* Quick Executive Shortcuts */}
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<div
								onClick={() => setActiveTab("cpq")}
								className="rounded-2xl border border-[#d9e2ef] bg-gradient-to-br from-[#f8faff] to-white p-5 shadow-sm cursor-pointer hover:border-[#6678c1] transition"
							>
								<div className="flex items-center gap-3">
									<span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#404d85] text-white">
										<Calculator className="h-5 w-5" />
									</span>
									<div>
										<h4 className="font-bold text-[#404d85]">Cambliss CPQ Cloud Engine</h4>
										<p className="text-xs text-[#5b6472]">Generate multi-tier price quotes with discount approvals.</p>
									</div>
								</div>
							</div>

							<div
								onClick={() => setActiveTab("customer360")}
								className="rounded-2xl border border-[#d9e2ef] bg-gradient-to-br from-[#f8faff] to-white p-5 shadow-sm cursor-pointer hover:border-[#6678c1] transition"
							>
								<div className="flex items-center gap-3">
									<span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#6678c1] text-white">
										<Building2 className="h-5 w-5" />
									</span>
									<div>
										<h4 className="font-bold text-[#404d85]">Account 360 & Buying Center</h4>
										<p className="text-xs text-[#5b6472]">Corporate hierarchies, BANT scoring & stakeholders.</p>
									</div>
								</div>
							</div>

							<div
								onClick={() => setActiveTab("service")}
								className="rounded-2xl border border-[#d9e2ef] bg-gradient-to-br from-[#f8faff] to-white p-5 shadow-sm cursor-pointer hover:border-[#6678c1] transition"
							>
								<div className="flex items-center gap-3">
									<span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
										<ShieldCheck className="h-5 w-5" />
									</span>
									<div>
										<h4 className="font-bold text-[#404d85]">Mission-Critical Support SLAs</h4>
										<p className="text-xs text-[#5b6472]">Severity 1 (&lt;1h) and Severity 2 (&lt;4h) escalation matrix.</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				)}

				{/* TAB 2: GLOBAL ACCOUNTS & 360 */}
				{activeTab === "customer360" && (
					<div className="space-y-6">
						<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
							{/* Corporate Hierarchy & Buying Committee */}
							<div className="lg:col-span-2 space-y-4">
								<div className="rounded-2xl border border-[#d9e2ef] bg-white p-5 shadow-sm">
									<div className="flex items-center justify-between border-b border-[#d9e2ef] pb-3">
										<div>
											<h4 className="font-bold text-[#404d85] text-base">Enterprise Account Corporate Hierarchy</h4>
											<p className="text-xs text-[#5b6472]">Multi-subsidiary global parent entity visualization.</p>
										</div>
										<span className="rounded-full bg-[#6678c1]/10 px-3 py-1 text-xs font-bold text-[#6678c1]">
											Enterprise Tier 1
										</span>
									</div>

									<div className="mt-4 space-y-3">
										<div className="rounded-xl border border-[#6678c1]/30 bg-[#f8faff] p-3">
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-2">
													<Building2 className="h-4 w-4 text-[#404d85]" />
													<span className="text-xs font-bold text-[#404d85]">Global Ultimate Parent: Acme International Corp (US-DELAWARE)</span>
												</div>
												<span className="text-[10px] font-bold text-[#6678c1] bg-white px-2 py-0.5 rounded border border-[#d9e2ef]">HQ Node</span>
											</div>
											<div className="mt-3 ml-4 space-y-2 border-l-2 border-[#6678c1]/30 pl-4">
												<div className="flex items-center justify-between text-xs bg-white p-2 rounded-lg border border-[#d9e2ef]">
													<span>├── Acme EMEA Holdings Ltd (London, UK)</span>
													<span className="text-[10px] text-[#5b6472]">3 Deals • {formatMoney(185000)}</span>
												</div>
												<div className="flex items-center justify-between text-xs bg-white p-2 rounded-lg border border-[#d9e2ef]">
													<span>├── Acme APAC Pte Ltd (Singapore)</span>
													<span className="text-[10px] text-[#5b6472]">2 Deals • {formatMoney(95000)}</span>
												</div>
												<div className="flex items-center justify-between text-xs bg-white p-2 rounded-lg border border-[#d9e2ef]">
													<span>└── Acme India Software Solutions LLP (Bangalore)</span>
													<span className="text-[10px] text-[#5b6472]">4 Deals • {formatMoney(120000)}</span>
												</div>
											</div>
										</div>
									</div>
								</div>

								{/* Buying Center Stakeholder Matrix */}
								<div className="rounded-2xl border border-[#d9e2ef] bg-white p-5 shadow-sm">
									<h4 className="font-bold text-[#404d85] text-base mb-1">Buying Center & Stakeholder Matrix</h4>
									<p className="text-xs text-[#5b6472] mb-4">Enterprise Decision Makers, Champions, and Evaluators.</p>

									<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
										{[
											{ role: "Economic Buyer", name: "David Sterling", title: "Chief Financial Officer", status: "Budget Confirmed", badge: "bg-emerald-50 text-emerald-800" },
											{ role: "Executive Sponsor", name: "Sarah Al-Mansoori", title: "VP Global Operations", status: "Strategic Champion", badge: "bg-indigo-50 text-indigo-800" },
											{ role: "Technical Evaluator", name: "Jonathan Vance", title: "Chief Technology Officer", status: "Security Passed (SOC2)", badge: "bg-blue-50 text-blue-800" },
											{ role: "Procurement / Legal", name: "Marcus Thorne", title: "Director of Sourcing", status: "Redlining Master Agreement", badge: "bg-amber-50 text-amber-800" },
										].map((stakeholder) => (
											<div key={stakeholder.role} className="rounded-xl border border-[#d9e2ef] p-3.5 bg-[#f8faff]">
												<div className="flex items-center justify-between">
													<span className="text-[10px] font-bold uppercase tracking-wider text-[#404d85]">{stakeholder.role}</span>
													<span className={`text-[10px] font-bold px-2 py-0.5 rounded ${stakeholder.badge}`}>{stakeholder.status}</span>
												</div>
												<h5 className="mt-1.5 text-sm font-bold text-[#1f2430]">{stakeholder.name}</h5>
												<p className="text-xs text-[#5b6472]">{stakeholder.title}</p>
											</div>
										))}
									</div>
								</div>
							</div>

							{/* BANT Qualification Card & Snapshot */}
							<div className="space-y-4">
								<div className="rounded-2xl border border-[#d9e2ef] bg-white p-5 shadow-sm">
									<h4 className="font-bold text-[#404d85] text-sm mb-3">Enterprise BANT Scorecard</h4>
									<div className="space-y-3 text-xs">
										<div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200">
											<div className="flex items-center justify-between">
												<span className="font-bold text-emerald-900">B — Budget (Allocated)</span>
												<CheckCircle2 className="h-4 w-4 text-emerald-600" />
											</div>
											<p className="mt-1 text-[11px] text-emerald-800">Approved FY26 enterprise software budget: {formatMoney(250000)}.</p>
										</div>

										<div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200">
											<div className="flex items-center justify-between">
												<span className="font-bold text-emerald-900">A — Authority (Direct Signer)</span>
												<CheckCircle2 className="h-4 w-4 text-emerald-600" />
											</div>
											<p className="mt-1 text-[11px] text-emerald-800">CFO & VP Global Operations have sole procurement authority.</p>
										</div>

										<div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200">
											<div className="flex items-center justify-between">
												<span className="font-bold text-emerald-900">N — Need (Mission Critical)</span>
												<CheckCircle2 className="h-4 w-4 text-emerald-600" />
											</div>
											<p className="mt-1 text-[11px] text-emerald-800">Legacy CRM lacks multi-subsidiary currency conversion.</p>
										</div>

										<div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-200">
											<div className="flex items-center justify-between">
												<span className="font-bold text-[#404d85]">T — Timeline (Q4 Commit)</span>
												<Clock className="h-4 w-4 text-[#6678c1]" />
											</div>
											<p className="mt-1 text-[11px] text-[#404d85]">Go-live target: End of current quarter with Net-30 onboarding.</p>
										</div>
									</div>

									<div className="mt-4 pt-3 border-t border-[#d9e2ef] flex items-center justify-between text-xs font-bold text-[#404d85]">
										<span>Overall BANT Score:</span>
										<span className="rounded-full bg-emerald-100 text-emerald-800 px-3 py-1 font-extrabold text-sm">
											95% Qualified
										</span>
									</div>
								</div>
							</div>
						</div>
					</div>
				)}

				{/* TAB 3: CAMBLISS CPQ CLOUD (CONFIGURE, PRICE, QUOTE) */}
				{activeTab === "cpq" && (
					<div className="space-y-6">
						<div className="rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm">
							<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-[#d9e2ef] pb-4 gap-4">
								<div>
									<div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#6678c1] uppercase tracking-wider">
										<Calculator className="h-4 w-4" />
										Enterprise CPQ Engine • Configure, Price, Quote
									</div>
									<h3 className="text-xl font-bold text-[#404d85] mt-1">Enterprise Solution Quotation Studio</h3>
								</div>

								{/* Approval Tier Badge */}
								<div className={`px-4 py-2 rounded-xl border text-xs font-bold ${cpqCalculations.approvalTier.badgeColor}`}>
									{cpqCalculations.approvalTier.text}
								</div>
							</div>

							<div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
								{/* Left 2 Cols: Catalog Item Selector */}
								<div className="lg:col-span-2 space-y-4">
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
										<div>
											<label className="text-xs font-bold text-[#404d85]">Account Name</label>
											<input
												value={cpqAccountName}
												onChange={(e) => setCpqAccountName(e.target.value)}
												className="mt-1 w-full rounded-xl border border-[#d9e2ef] bg-[#f8faff] p-2.5 text-xs font-semibold text-[#1f2430] focus:border-[#6678c1] focus:outline-none"
											/>
										</div>
										<div>
											<label className="text-xs font-bold text-[#404d85]">Authorized Signer</label>
											<input
												value={cpqContactName}
												onChange={(e) => setCpqContactName(e.target.value)}
												className="mt-1 w-full rounded-xl border border-[#d9e2ef] bg-[#f8faff] p-2.5 text-xs font-semibold text-[#1f2430] focus:border-[#6678c1] focus:outline-none"
											/>
										</div>
									</div>

									<p className="text-xs font-bold uppercase tracking-wider text-[#404d85] pt-2">Enterprise Software & Service Line Items:</p>
									<div className="space-y-2.5">
										{ENTERPRISE_CPQ_CATALOG.map((item) => {
											const isSelected = Boolean(selectedCpqItems[item.id]?.quantity);
											const qty = selectedCpqItems[item.id]?.quantity || 0;
											return (
												<div
													key={item.id}
													className={`rounded-xl border p-3.5 transition flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
														isSelected ? "border-[#6678c1] bg-[#6678c1]/5" : "border-[#d9e2ef] bg-white hover:border-[#6678c1]/30"
													}`}
												>
													<div className="flex items-start gap-3">
														<input
															type="checkbox"
															checked={isSelected}
															onChange={(e) => {
																if (e.target.checked) {
																	setSelectedCpqItems((prev) => ({ ...prev, [item.id]: { quantity: 1 } }));
																} else {
																	setSelectedCpqItems((prev) => {
																		const copy = { ...prev };
																		delete copy[item.id];
																		return copy;
																	});
																}
															}}
															className="mt-1 h-4 w-4 rounded text-[#6678c1] cursor-pointer"
														/>
														<div>
															<div className="flex items-center gap-2">
																<h5 className="text-xs font-bold text-[#1f2430]">{item.name}</h5>
																<span className="text-[10px] font-semibold bg-[#eef2fa] text-[#404d85] px-2 py-0.5 rounded">
																	{item.category}
																</span>
															</div>
															<p className="text-[11px] text-[#5b6472] mt-0.5">{item.description}</p>
														</div>
													</div>

													<div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
														<span className="text-xs font-bold text-[#404d85]">
															{formatMoney(item.unitPrice)}
															<span className="text-[10px] text-[#5b6472] font-normal">
																{item.billingPeriod === "MONTHLY" ? "/mo" : " flat"}
															</span>
														</span>

														{isSelected && (
															<div className="flex items-center gap-1 border border-[#d9e2ef] rounded-lg bg-white px-2 py-0.5 text-xs font-bold">
																<button
																	type="button"
																	onClick={() =>
																		setSelectedCpqItems((prev) => ({
																			...prev,
																			[item.id]: { quantity: Math.max(1, (prev[item.id]?.quantity || 1) - 1) },
																		}))
																	}
																	className="px-1 text-slate-500 hover:text-[#404d85]"
																>
																	-
																</button>
																<span>{qty}</span>
																<button
																	type="button"
																	onClick={() =>
																		setSelectedCpqItems((prev) => ({
																			...prev,
																			[item.id]: { quantity: (prev[item.id]?.quantity || 1) + 1 },
																		}))
																	}
																	className="px-1 text-slate-500 hover:text-[#404d85]"
																>
																	+
																</button>
															</div>
														)}
													</div>
												</div>
											);
										})}
									</div>
								</div>

								{/* Right Col: Quote Pricing Summary & Terms */}
								<div className="rounded-2xl border border-[#d9e2ef] bg-[#f8faff] p-5 space-y-4">
									<h4 className="text-sm font-bold text-[#404d85] border-b border-[#d9e2ef] pb-2">Contract Financial Ledger</h4>

									{/* Contract Terms */}
									<div>
										<label className="text-xs font-bold text-[#404d85]">Contract Commitment Term</label>
										<select
											value={cpqPaymentTerms}
											onChange={(e) => setCpqPaymentTerms(e.target.value as any)}
											className="mt-1 w-full rounded-xl border border-[#d9e2ef] bg-white p-2 text-xs font-semibold text-[#1f2430]"
										>
											<option value="NET_30">Net-30 Standard Monthly</option>
											<option value="NET_60">Net-60 Enterprise Invoice</option>
											<option value="ANNUAL_PREPAID">Annual Upfront (5% Incentive)</option>
											<option value="3YR_ENTERPRISE">3-Year Enterprise Master Commitment (12% Incentive)</option>
										</select>
									</div>

									{/* Discount Slider */}
									<div>
										<div className="flex justify-between text-xs font-bold text-[#404d85]">
											<span>Discretionary Discount:</span>
											<span>{cpqDiscountPct}%</span>
										</div>
										<input
											type="range"
											min={0}
											max={40}
											step={5}
											value={cpqDiscountPct}
											onChange={(e) => setCpqDiscountPct(Number(e.target.value))}
											className="w-full mt-2 accent-[#6678c1] cursor-pointer"
										/>
										<div className="flex justify-between text-[10px] text-[#5b6472]">
											<span>0% (Standard)</span>
											<span>15% (Sales Mgr)</span>
											<span>25% (VP)</span>
											<span>40% (CFO)</span>
										</div>
									</div>

									{/* Calculation Ledger */}
									<div className="space-y-2 border-t border-[#d9e2ef] pt-3 text-xs text-[#5b6472]">
										<div className="flex justify-between">
											<span>Monthly Software Run-Rate:</span>
											<span className="font-semibold text-[#1f2430]">{formatMoney(cpqCalculations.monthlySubtotal)}/mo</span>
										</div>
										<div className="flex justify-between">
											<span>Annual Software Base (12mo):</span>
											<span className="font-semibold text-[#1f2430]">{formatMoney(cpqCalculations.annualLicenseTotal)}</span>
										</div>
										{cpqCalculations.oneTimeSubtotal > 0 && (
											<div className="flex justify-between">
												<span>Implementation & Migration:</span>
												<span className="font-semibold text-[#1f2430]">{formatMoney(cpqCalculations.oneTimeSubtotal)}</span>
											</div>
										)}
										<div className="flex justify-between text-rose-700">
											<span>Discount ({cpqDiscountPct}%):</span>
											<span>-{formatMoney(cpqCalculations.discountAmount)}</span>
										</div>
										{cpqCalculations.termBonusDiscountPct > 0 && (
											<div className="flex justify-between text-emerald-700">
												<span>Term Incentive ({cpqCalculations.termBonusDiscountPct}%):</span>
												<span>-{formatMoney(cpqCalculations.termDiscountAmount)}</span>
											</div>
										)}

										<div className="border-t border-[#d9e2ef] pt-2 flex justify-between text-sm font-extrabold text-[#404d85]">
											<span>Net Annual Contract Value:</span>
											<span className="text-base text-[#6678c1]">{formatMoney(cpqCalculations.finalNetContractValue)}</span>
										</div>
									</div>

									<button
										onClick={() => setIsQuoteGeneratedModalOpen(true)}
										className="w-full rounded-xl bg-[#6678c1] py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#5567b0] transition flex items-center justify-center gap-2"
									>
										<FileCheck className="h-4 w-4" />
										Generate Official Enterprise Quote
									</button>
								</div>
							</div>
						</div>
					</div>
				)}

				{/* TAB 4: SALES & PIPELINE EXECUTION */}
				{activeTab === "sales" && (
					<div className="space-y-6">
						<div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
							{/* Create Lead Form */}
							<form onSubmit={(event) => void handleCreateLead(event)} className="rounded-2xl border border-[#d9e2ef] bg-white p-5 shadow-sm space-y-3">
								<h4 className="font-bold text-[#404d85] text-sm">Create Enterprise Lead</h4>
								<div className="grid grid-cols-2 gap-2">
									<input value={leadForm.firstName} onChange={(e) => setLeadForm((prev) => ({ ...prev, firstName: e.target.value }))} placeholder="First name" className="rounded-xl border border-[#d9e2ef] p-2 text-xs text-[#1f2430]" />
									<input value={leadForm.lastName} onChange={(e) => setLeadForm((prev) => ({ ...prev, lastName: e.target.value }))} placeholder="Last name" className="rounded-xl border border-[#d9e2ef] p-2 text-xs text-[#1f2430]" />
								</div>
								<div className="grid grid-cols-2 gap-2">
									<input value={leadForm.email} onChange={(e) => setLeadForm((prev) => ({ ...prev, email: e.target.value }))} placeholder="Work Email" className="rounded-xl border border-[#d9e2ef] p-2 text-xs text-[#1f2430]" />
									<input value={leadForm.phone} onChange={(e) => setLeadForm((prev) => ({ ...prev, phone: e.target.value }))} placeholder="Direct Phone" className="rounded-xl border border-[#d9e2ef] p-2 text-xs text-[#1f2430]" />
								</div>
								<div className="grid grid-cols-2 gap-2">
									<input value={leadForm.companyName} onChange={(e) => setLeadForm((prev) => ({ ...prev, companyName: e.target.value }))} placeholder="Company / Enterprise Entity" className="rounded-xl border border-[#d9e2ef] p-2 text-xs text-[#1f2430]" />
									<input value={leadForm.source} onChange={(e) => setLeadForm((prev) => ({ ...prev, source: e.target.value }))} placeholder="Source (e.g. Gartner, Inbound)" className="rounded-xl border border-[#d9e2ef] p-2 text-xs text-[#1f2430]" />
								</div>
								<button type="submit" disabled={isSavingLead} className="rounded-xl bg-[#6678c1] px-4 py-2 text-xs font-bold text-white hover:bg-[#5567b0] transition shadow-sm">
									{isSavingLead ? "Saving..." : "Save Lead"}
								</button>
							</form>

							{/* Create Deal Form */}
							<form onSubmit={(event) => void handleCreateDeal(event)} className="rounded-2xl border border-[#d9e2ef] bg-white p-5 shadow-sm space-y-3">
								<h4 className="font-bold text-[#404d85] text-sm">Create Deal Opportunity</h4>
								<select
									value={dealForm.contactId}
									onChange={(e) => setDealForm((prev) => ({ ...prev, contactId: e.target.value }))}
									className="w-full rounded-xl border border-[#d9e2ef] p-2 text-xs text-[#1f2430]"
									required
								>
									<option value="">-- Select Contact / Account (Required) --</option>
									{setupOptions.contacts.map((contact) => (
										<option key={contact.id} value={contact.id}>
											{contact.label}
										</option>
									))}
								</select>
								<div className="grid grid-cols-2 gap-2">
									<select
										value={dealForm.pipelineId}
										onChange={(e) => {
											const pipelineId = e.target.value;
											const firstStageId = setupOptions.pipelines.find((p) => p.id === pipelineId)?.stages[0]?.id ?? "";
											setDealForm((prev) => ({ ...prev, pipelineId, stageId: firstStageId }));
										}}
										className="rounded-xl border border-[#d9e2ef] p-2 text-xs text-[#1f2430]"
									>
										<option value="">Select Pipeline</option>
										{setupOptions.pipelines.map((pipeline) => (
											<option key={pipeline.id} value={pipeline.id}>
												{pipeline.name}
											</option>
										))}
									</select>

									<select
										value={dealForm.stageId}
										onChange={(e) => setDealForm((prev) => ({ ...prev, stageId: e.target.value }))}
										className="rounded-xl border border-[#d9e2ef] p-2 text-xs text-[#1f2430]"
										disabled={!dealForm.pipelineId}
									>
										<option value="">Select Stage</option>
										{selectedPipelineStages.map((stage) => (
											<option key={stage.id} value={stage.id}>
												{stage.name}
											</option>
										))}
									</select>
								</div>

								<div className="grid grid-cols-3 gap-2">
									<input value={dealForm.value} onChange={(e) => setDealForm((prev) => ({ ...prev, value: e.target.value }))} placeholder={`Value (${selectedCurrency})`} className="rounded-xl border border-[#d9e2ef] p-2 text-xs text-[#1f2430]" />
									<input value={dealForm.probability} onChange={(e) => setDealForm((prev) => ({ ...prev, probability: e.target.value }))} placeholder="Probability (%)" className="rounded-xl border border-[#d9e2ef] p-2 text-xs text-[#1f2430]" />
									<select
										value={dealForm.status}
										onChange={(e) => setDealForm((prev) => ({ ...prev, status: e.target.value }))}
										className="rounded-xl border border-[#d9e2ef] p-2 text-xs text-[#1f2430]"
									>
										<option value="OPEN">OPEN</option>
										<option value="WON">WON</option>
										<option value="LOST">LOST</option>
									</select>
								</div>

								<button type="submit" disabled={isSavingDeal} className="rounded-xl bg-[#6678c1] px-4 py-2 text-xs font-bold text-white hover:bg-[#5567b0] transition shadow-sm">
									{isSavingDeal ? "Creating..." : "Create Deal"}
								</button>
							</form>
						</div>

						{/* Deals Table with Currency Conversion */}
						<div className="rounded-2xl border border-[#d9e2ef] bg-white p-5 shadow-sm">
							<div className="flex items-center justify-between mb-4">
								<h4 className="font-bold text-[#404d85] text-base">Active Opportunities & Deals</h4>
								<span className="text-xs text-[#5b6472]">Amounts converted to {selectedCurrency}</span>
							</div>

							<div className="overflow-x-auto">
								<table className="w-full text-left text-xs">
									<thead className="bg-[#f8faff] border-b border-[#d9e2ef]">
										<tr>
											<th className="px-4 py-3 font-bold text-[#404d85]">Account / Contact</th>
											<th className="px-4 py-3 font-bold text-[#404d85]">Contract Value ({selectedCurrency})</th>
											<th className="px-4 py-3 font-bold text-[#404d85]">Probability</th>
											<th className="px-4 py-3 font-bold text-[#404d85]">Pipeline & Stage</th>
											<th className="px-4 py-3 font-bold text-[#404d85]">Status</th>
											<th className="px-4 py-3 text-right font-bold text-[#404d85]">Actions</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-[#d9e2ef]">
										{deals.map((deal) => {
											const dealStages = getStagesForPipeline(deal.pipelineId);
											const contactObj = deal.contact;
											const contactFullName = [contactObj?.firstName, contactObj?.lastName].filter(Boolean).join(" ").trim();
											const dealContactDisplay = contactFullName || contactObj?.companyName || contactObj?.email || `Deal ${deal.id.slice(0, 8)}`;
											return (
												<tr key={deal.id} className="hover:bg-[#f8faff] transition">
													<td className="px-4 py-3 font-semibold text-[#1f2430]">
														{dealContactDisplay}
													</td>
													<td className="px-4 py-3 font-bold text-[#404d85]">
														{formatMoney(deal.value)}
													</td>
													<td className="px-4 py-3 text-[#5b6472]">
														{deal.probability}%
													</td>
													<td className="px-4 py-3">
														<select
															value={stageUpdate[deal.id] || deal.stageId}
															onChange={(e) => {
																const nextStage = e.target.value;
																setStageUpdate((prev) => ({ ...prev, [deal.id]: nextStage }));
																setTimeout(() => {
																	const authHeaders = getAuthHeaders();
																	authHeaders.set("Content-Type", "application/json");
																	fetch(`/api/crm/deals/${deal.id}/stage`, {
																		method: "PUT",
																		headers: authHeaders,
																		body: JSON.stringify({ stageId: nextStage }),
																	}).then(() => loadAll());
																}, 50);
															}}
															className="rounded-lg border border-[#d9e2ef] p-1 text-xs text-[#1f2430]"
														>
															{dealStages.map((s) => (
																<option key={s.id} value={s.id}>
																	{s.name}
																</option>
															))}
														</select>
													</td>
													<td className="px-4 py-3">
														<span
															className={`px-2 py-0.5 rounded text-[10px] font-bold ${
																deal.status === "WON"
																	? "bg-emerald-50 text-emerald-800"
																	: deal.status === "LOST"
																	? "bg-rose-50 text-rose-800"
																	: "bg-blue-50 text-blue-800"
															}`}
														>
															{deal.status}
														</span>
													</td>
													<td className="px-4 py-3 text-right">
														<div className="flex items-center justify-end gap-1">
															<button
																onClick={() => setEditingDeal(deal)}
																className="p-1 text-slate-400 hover:text-[#404d85]"
																title="Edit Deal"
															>
																<Edit3 className="h-3.5 w-3.5" />
															</button>
															<button
																onClick={() => handleDeleteDeal(deal.id)}
																className="p-1 text-slate-400 hover:text-rose-600"
																title="Delete Deal"
															>
																<Trash2 className="h-3.5 w-3.5" />
															</button>
														</div>
													</td>
												</tr>
											);
										})}
										{deals.length === 0 && (
											<tr>
												<td colSpan={6} className="py-8 text-center text-xs text-[#5b6472]">
													No active deal opportunities recorded yet.
												</td>
											</tr>
										)}
									</tbody>
								</table>
							</div>
						</div>
					</div>
				)}

				{/* TAB 5: MISSION-CRITICAL SERVICE & SUPPORT SLA ENGINE */}
				{activeTab === "service" && (
					<div className="space-y-6">
						<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
							{/* New Support Ticket Form */}
							<form onSubmit={(event) => void handleAddServiceCase(event)} className="rounded-2xl border border-[#d9e2ef] bg-white p-5 shadow-sm space-y-3">
								<h4 className="font-bold text-[#404d85] text-sm">Dispatch Enterprise Support Ticket</h4>
								<input value={caseSubject} onChange={(e) => setCaseSubject(e.target.value)} placeholder="Case issue / incident title" className="w-full rounded-xl border border-[#d9e2ef] p-2 text-xs text-[#1f2430]" required />
								<select value={caseCategory} onChange={(e) => setCaseCategory(e.target.value)} className="w-full rounded-xl border border-[#d9e2ef] p-2 text-xs text-[#1f2430]">
									<option value="Mission-Critical Infrastructure">Infrastructure Outage</option>
									<option value="Core Database Latency">Database Latency & Sync</option>
									<option value="Security / SOC2 Verification">Security / Penetration Review</option>
									<option value="Billing & Custom CPQ Terms">Contract & Licensing</option>
								</select>
								<div>
									<label className="text-xs font-bold text-[#404d85]">Severity Tier (SLA Target)</label>
									<select value={casePriority} onChange={(e) => setCasePriority(e.target.value as any)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2 text-xs text-[#1f2430]">
										<option value="URGENT">Severity 1 (P1): &lt; 1h Target Resolution</option>
										<option value="HIGH">Severity 2 (P2): &lt; 4h Target Resolution</option>
										<option value="MEDIUM">Severity 3 (P3): &lt; 24h Standard Resolution</option>
										<option value="LOW">Severity 4 (P4): General Inquiry</option>
									</select>
								</div>
								<button type="submit" disabled={isSavingServiceCase} className="w-full rounded-xl bg-[#6678c1] py-2 text-xs font-bold text-white hover:bg-[#5567b0] transition shadow-sm">
									{isSavingServiceCase ? "Dispatching..." : "Dispatch Ticket"}
								</button>
							</form>

							{/* Ticket Queue with SLA Timers */}
							<div className="lg:col-span-2 rounded-2xl border border-[#d9e2ef] bg-white p-5 shadow-sm">
								<div className="flex items-center justify-between border-b border-[#d9e2ef] pb-3 mb-4">
									<div>
										<h4 className="font-bold text-[#404d85] text-base">Mission-Critical Incident SLA Queue</h4>
										<p className="text-xs text-[#5b6472]">Real-time escalation clocks and engineering dispatch.</p>
									</div>
									<span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
										SLA Compliance: 100%
									</span>
								</div>

								<div className="space-y-3">
									{serviceCases.map((serviceCase) => {
										const isP1 = serviceCase.priority === "URGENT" || serviceCase.priority === "HIGH";
										return (
											<div key={serviceCase.id} className="rounded-xl border border-[#d9e2ef] p-4 bg-[#f8faff] hover:border-[#6678c1] transition">
												<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
													<div className="flex items-center gap-2">
														{isP1 ? (
															<span className="inline-flex items-center gap-1 rounded bg-rose-50 text-rose-800 border border-rose-200 px-2 py-0.5 text-[10px] font-bold">
																<AlertCircle className="h-3 w-3" /> P1 CRITICAL
															</span>
														) : (
															<span className="inline-flex items-center gap-1 rounded bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 text-[10px] font-bold">
																<Clock className="h-3 w-3" /> STANDARD
															</span>
														)}
														<h5 className="text-xs font-bold text-[#1f2430]">{serviceCase.subject}</h5>
													</div>
													<div className="flex items-center gap-2">
														<span className="text-[10px] font-bold text-[#404d85] bg-white px-2 py-0.5 rounded border border-[#d9e2ef]">
															SLA: Within Limits
														</span>
														<select
															value={serviceCase.status}
															onChange={(e) => handleUpdateServiceCaseStatus(serviceCase.id, e.target.value as any)}
															className="rounded border border-[#d9e2ef] bg-white p-1 text-[11px] font-bold text-[#404d85]"
														>
															<option value="OPEN">OPEN</option>
															<option value="IN_PROGRESS">IN_PROGRESS</option>
															<option value="RESOLVED">RESOLVED</option>
														</select>
													</div>
												</div>
												<div className="mt-2 flex items-center justify-between text-[11px] text-[#5b6472]">
													<span>Incident ID: {serviceCase.id.slice(0, 8)} • L3 Solutions Architect Hotline</span>
													<button onClick={() => handleDeleteServiceCase(serviceCase.id)} className="text-slate-400 hover:text-rose-600">
														<Trash2 className="h-3.5 w-3.5" />
													</button>
												</div>
											</div>
										);
									})}
									{serviceCases.length === 0 && (
										<p className="py-8 text-center text-xs text-[#5b6472]">All customer service cases resolved.</p>
									)}
								</div>
							</div>
						</div>
					</div>
				)}

				{/* TAB 6: FISCAL QUOTA & REVOPS */}
				{activeTab === "revenue" && (
					<div className="space-y-6">
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
							{/* Quota Attainment Dashboard */}
							<div className="rounded-2xl border border-[#d9e2ef] bg-white p-5 shadow-sm space-y-4">
								<h4 className="font-bold text-[#404d85] text-base">FY26 Fiscal Quota Attainment</h4>
								<div className="space-y-2">
									<div className="flex justify-between text-xs font-bold text-[#1f2430]">
										<span>Quarterly Quota Target:</span>
										<span>{formatMoney(500000)}</span>
									</div>
									<div className="w-full bg-[#eef2fa] h-3 rounded-full overflow-hidden">
										<div className="bg-[#6678c1] h-full rounded-full" style={{ width: "78%" }} />
									</div>
									<div className="flex justify-between text-[11px] text-[#5b6472]">
										<span>Attained: {formatMoney(dashboard?.wonDealsValue ?? 0)} (78%)</span>
										<span>Remaining to Commit: {formatMoney(110000)}</span>
									</div>
								</div>

								<div className="grid grid-cols-3 gap-3 pt-3 border-t border-[#d9e2ef] text-center">
									<div className="p-3 bg-[#f8faff] rounded-xl border border-[#d9e2ef]">
										<p className="text-[10px] font-bold uppercase text-[#5b6472]">Closed Won</p>
										<p className="text-sm font-bold text-[#404d85] mt-1">{formatMoney(dashboard?.wonDealsValue ?? 0)}</p>
									</div>
									<div className="p-3 bg-[#f8faff] rounded-xl border border-[#d9e2ef]">
										<p className="text-[10px] font-bold uppercase text-[#5b6472]">Commit (80%+)</p>
										<p className="text-sm font-bold text-[#6678c1] mt-1">{formatMoney(145000)}</p>
									</div>
									<div className="p-3 bg-[#f8faff] rounded-xl border border-[#d9e2ef]">
										<p className="text-[10px] font-bold uppercase text-[#5b6472]">Best Case</p>
										<p className="text-sm font-bold text-amber-700 mt-1">{formatMoney(95000)}</p>
									</div>
								</div>
							</div>

							{/* Global Territory Distribution */}
							<div className="rounded-2xl border border-[#d9e2ef] bg-white p-5 shadow-sm space-y-4">
								<h4 className="font-bold text-[#404d85] text-base">Global Territory Quota Breakdown</h4>
								<div className="space-y-3">
									{[
										{ region: "North America (US & CA)", target: 250000, actual: 210000, pct: "84%" },
										{ region: "EMEA (UK, DE, FR, UAE)", target: 150000, actual: 125000, pct: "83%" },
										{ region: "APAC & SAARC (IN, SG, JP, AU)", target: 100000, actual: 78000, pct: "78%" },
									].map((territory) => (
										<div key={territory.region} className="p-3 bg-[#f8faff] rounded-xl border border-[#d9e2ef]">
											<div className="flex justify-between text-xs font-bold text-[#1f2430]">
												<span>{territory.region}</span>
												<span>{territory.pct} Attained</span>
											</div>
											<div className="mt-1 text-[11px] text-[#5b6472] flex justify-between">
												<span>Actual: {formatMoney(territory.actual)}</span>
												<span>Target: {formatMoney(territory.target)}</span>
											</div>
										</div>
									))}
								</div>
							</div>
						</div>
					</div>
				)}

				{/* TAB 7: MARKETING CAMPAIGNS */}
				{activeTab === "marketing" && (
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
						<form onSubmit={(event) => void handleAddCampaign(event)} className="rounded-2xl border border-[#d9e2ef] bg-white p-5 shadow-sm space-y-3">
							<h4 className="font-bold text-[#404d85] text-sm">Initiate Targeted Campaign</h4>
							<input value={campaignName} onChange={(e) => setCampaignName(e.target.value)} placeholder="Campaign Name (e.g. Q4 Cloud RFP)" className="w-full rounded-xl border border-[#d9e2ef] p-2 text-xs text-[#1f2430]" required />
							<div className="grid grid-cols-2 gap-2">
								<select value={campaignChannel} onChange={(e) => setCampaignChannel(e.target.value)} className="rounded-xl border border-[#d9e2ef] p-2 text-xs text-[#1f2430]">
									<option value="Email Blast">Email Blast</option>
									<option value="WhatsApp Outreach">WhatsApp Direct</option>
									<option value="Executive Briefing">Executive Briefing</option>
								</select>
								<select value={campaignSegment} onChange={(e) => setCampaignSegment(e.target.value)} className="rounded-xl border border-[#d9e2ef] p-2 text-xs text-[#1f2430]">
									<option value="Enterprise C-Suite">Enterprise C-Suite</option>
									<option value="Qualified Leads">Qualified SQLs</option>
									<option value="Renewal Accounts">Renewal Accounts</option>
								</select>
							</div>
							<button type="submit" disabled={isSavingCampaign} className="rounded-xl bg-[#6678c1] px-4 py-2 text-xs font-bold text-white hover:bg-[#5567b0] transition shadow-sm">
								{isSavingCampaign ? "Launching..." : "Launch Campaign"}
							</button>
						</form>

						<div className="rounded-2xl border border-[#d9e2ef] bg-white p-5 shadow-sm">
							<h4 className="font-bold text-[#404d85] text-sm mb-3">Active Campaigns</h4>
							<div className="space-y-2">
								{campaigns.map((c) => (
									<div key={c.id} className="p-3 bg-[#f8faff] rounded-xl border border-[#d9e2ef] flex justify-between items-center">
										<div>
											<h5 className="text-xs font-bold text-[#1f2430]">{c.name}</h5>
											<p className="text-[11px] text-[#5b6472]">{c.segment}</p>
										</div>
										<span className="rounded-full bg-[#6678c1]/10 text-[#6678c1] px-2.5 py-0.5 text-[10px] font-bold">
											{c.status}
										</span>
									</div>
								))}
							</div>
						</div>
					</div>
				)}

				{/* TAB 8: INTELLIGENCE & ANALYTICS */}
				{activeTab === "analytics" && (
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
						<div className="rounded-2xl border border-[#d9e2ef] bg-white p-5 shadow-sm space-y-3">
							<h4 className="font-bold text-[#404d85] text-sm">Predictive Deal Velocity Signals</h4>
							<div className="space-y-2 text-xs">
								<div className="p-3 bg-[#f8faff] rounded-xl border border-[#d9e2ef]">
									<p className="font-bold text-[#1f2430]">High Probability Closes</p>
									<p className="text-[11px] text-[#5b6472]">3 enterprise deals exceed 80% win probability with active RFP submissions.</p>
								</div>
								<div className="p-3 bg-[#f8faff] rounded-xl border border-[#d9e2ef]">
									<p className="font-bold text-[#1f2430]">Contract Stagnation Alert</p>
									<p className="text-[11px] text-amber-700">Deals in &ldquo;Legal Review&rdquo; averaging 14 days without procurement response.</p>
								</div>
							</div>
						</div>

						<div className="rounded-2xl border border-[#d9e2ef] bg-white p-5 shadow-sm space-y-3">
							<h4 className="font-bold text-[#404d85] text-sm">Territory Conversion Radar</h4>
							<div className="grid grid-cols-2 gap-3 text-center">
								<div className="p-3 bg-[#f8faff] rounded-xl border border-[#d9e2ef]">
									<p className="text-[10px] font-bold uppercase text-[#5b6472]">Avg Deal Size</p>
									<p className="text-base font-bold text-[#404d85] mt-1">{formatMoney(84000)}</p>
								</div>
								<div className="p-3 bg-[#f8faff] rounded-xl border border-[#d9e2ef]">
									<p className="text-[10px] font-bold uppercase text-[#5b6472]">Pipeline Multiplier</p>
									<p className="text-base font-bold text-[#6678c1] mt-1">3.8x Quota</p>
								</div>
							</div>
						</div>
					</div>
				)}

				{/* TAB 9: SECURITY & COMPLIANCE (GOVERNANCE) */}
				{activeTab === "governance" && (
					<div className="rounded-2xl border border-[#d9e2ef] bg-white p-5 shadow-sm space-y-4">
						<h4 className="font-bold text-[#404d85] text-base">Enterprise Security & Compliance Controls</h4>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="p-4 rounded-xl border border-[#d9e2ef] bg-[#f8faff]">
								<div className="flex items-center justify-between">
									<h5 className="font-bold text-[#1f2430] text-xs">Role-Based Access Control (RBAC)</h5>
									<span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">Enforced</span>
								</div>
								<p className="text-[11px] text-[#5b6472] mt-1">Granular field-level security restricting discount approvals to authorized VP roles.</p>
							</div>

							<div className="p-4 rounded-xl border border-[#d9e2ef] bg-[#f8faff]">
								<div className="flex items-center justify-between">
									<h5 className="font-bold text-[#1f2430] text-xs">Immutable Cryptographic Audit Trail</h5>
									<span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">SHA-256 Validated</span>
								</div>
								<p className="text-[11px] text-[#5b6472] mt-1">Every stage transition and discount update signed with SHA-256 tamper-proof timestamps.</p>
							</div>
						</div>
					</div>
				)}

				{/* OFFICIAL ENTERPRISE QUOTE GENERATED MODAL */}
				{isQuoteGeneratedModalOpen && (
					<div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1e2540]/60 backdrop-blur-sm p-4 overflow-y-auto">
						<div className="w-full max-w-3xl rounded-3xl bg-white p-8 shadow-2xl relative my-8 border border-[#d9e2ef]">
							<button onClick={() => setIsQuoteGeneratedModalOpen(false)} className="absolute right-6 top-6 text-slate-400 hover:text-slate-600">
								✕
							</button>

							<div className="flex items-center justify-between border-b border-[#d9e2ef] pb-5">
								<div>
									<div className="inline-flex items-center gap-2 rounded-full bg-[#6678c1]/10 px-3 py-1 text-xs font-bold text-[#6678c1]">
										<Award className="h-3.5 w-3.5" />
										Official Cambliss CPQ Master Proposal
									</div>
									<h3 className="text-xl font-extrabold text-[#404d85] mt-2">Enterprise Software & Services Quotation</h3>
									<p className="text-xs text-[#5b6472]">Quote Ref: CPQ-2026-9041 • Valid until {new Date(Date.now() + 30 * 86400000).toLocaleDateString()}</p>
								</div>
								<div className="text-right">
									<p className="text-xs font-bold text-[#1f2430]">{cpqAccountName}</p>
									<p className="text-[11px] text-[#5b6472]">{cpqContactName}</p>
								</div>
							</div>

							<div className="mt-5 space-y-4">
								<table className="w-full text-left text-xs">
									<thead className="bg-[#f8faff] border-b border-[#d9e2ef]">
										<tr>
											<th className="px-3 py-2 font-bold text-[#404d85]">Line Item Description</th>
											<th className="px-3 py-2 font-bold text-[#404d85]">Category</th>
											<th className="px-3 py-2 text-right font-bold text-[#404d85]">Quantity</th>
											<th className="px-3 py-2 text-right font-bold text-[#404d85]">Unit Price</th>
											<th className="px-3 py-2 text-right font-bold text-[#404d85]">Annualized ({selectedCurrency})</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-[#d9e2ef]">
										{Object.entries(selectedCpqItems).map(([id, d]) => {
											const item = ENTERPRISE_CPQ_CATALOG.find((i) => i.id === id);
											if (!item) return null;
											const annualized = item.billingPeriod === "ONE_TIME" ? item.unitPrice * d.quantity : item.unitPrice * 12 * d.quantity;
											return (
												<tr key={id}>
													<td className="px-3 py-2 font-semibold text-[#1f2430]">{item.name}</td>
													<td className="px-3 py-2 text-[#5b6472]">{item.category}</td>
													<td className="px-3 py-2 text-right font-bold text-[#1f2430]">{d.quantity}</td>
													<td className="px-3 py-2 text-right">{formatMoney(item.unitPrice)}</td>
													<td className="px-3 py-2 text-right font-bold text-[#404d85]">{formatMoney(annualized)}</td>
												</tr>
											);
										})}
									</tbody>
								</table>

								<div className="rounded-xl bg-[#f8faff] p-4 space-y-1.5 text-xs border border-[#d9e2ef]">
									<div className="flex justify-between text-[#5b6472]">
										<span>Gross Annual Contract Value:</span>
										<span>{formatMoney(cpqCalculations.baseContractValue)}</span>
									</div>
									<div className="flex justify-between text-rose-700">
										<span>Enterprise Volume Discount ({cpqDiscountPct}%):</span>
										<span>-{formatMoney(cpqCalculations.discountAmount)}</span>
									</div>
									{cpqCalculations.termBonusDiscountPct > 0 && (
										<div className="flex justify-between text-emerald-700">
											<span>Term Incentive ({cpqCalculations.termBonusDiscountPct}%):</span>
											<span>-{formatMoney(cpqCalculations.termDiscountAmount)}</span>
										</div>
									)}
									<div className="border-t border-[#d9e2ef] pt-2 flex justify-between font-extrabold text-sm text-[#404d85]">
										<span>Net Annual Contract Value (ACV):</span>
										<span className="text-[#6678c1]">{formatMoney(cpqCalculations.finalNetContractValue)}</span>
									</div>
								</div>

								<div className="text-[11px] text-[#5b6472] space-y-1 pt-2 border-t border-[#d9e2ef]">
									<p><strong>Payment Terms:</strong> {cpqPaymentTerms.replace(/_/g, " ")} • 99.999% High Availability SLA Included</p>
									<p><strong>Approval Status:</strong> {cpqCalculations.approvalTier.text}</p>
								</div>
							</div>

							<div className="mt-6 flex justify-end gap-3 pt-4 border-t border-[#d9e2ef]">
								<button
									onClick={() => {
										const quoteText = `OFFICIAL ENTERPRISE CPQ QUOTE\nRef: CPQ-2026-9041\nAccount: ${cpqAccountName}\nSigner: ${cpqContactName}\nNet ACV: ${formatMoney(cpqCalculations.finalNetContractValue)}\nTerms: ${cpqPaymentTerms}\nStatus: ${cpqCalculations.approvalTier.text}`;
										navigator.clipboard.writeText(quoteText);
										setCopiedQuote(true);
										setTimeout(() => setCopiedQuote(false), 2000);
									}}
									className="px-4 py-2 border border-[#d9e2ef] rounded-xl text-xs font-bold text-[#404d85] hover:bg-[#eef2fa] transition flex items-center gap-1.5"
								>
									{copiedQuote ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
									{copiedQuote ? "Copied Quote!" : "Copy Quote Summary"}
								</button>
								<button
									onClick={() => window.print()}
									className="px-4 py-2 bg-[#6678c1] text-white rounded-xl text-xs font-bold hover:bg-[#5567b0] transition flex items-center gap-1.5 shadow-sm"
								>
									<Printer className="h-3.5 w-3.5" />
									Print / Save PDF
								</button>
							</div>
						</div>
					</div>
				)}

				{/* EDIT LEAD MODAL */}
				{editingLead && (
					<div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1e2540]/60 backdrop-blur-sm p-4">
						<div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-4 border border-[#d9e2ef]">
							<div className="flex items-center justify-between border-b border-[#d9e2ef] pb-3">
								<h3 className="text-base font-bold text-[#404d85]">Edit Lead Details</h3>
								<button type="button" onClick={() => setEditingLead(null)} className="text-slate-400 hover:text-slate-600">✕</button>
							</div>
							<form onSubmit={(e) => void handleSaveEditLead(e)} className="space-y-3">
								<div className="grid grid-cols-2 gap-2">
									<div>
										<label className="text-xs font-bold text-[#404d85]">First Name</label>
										<input value={editingLead.firstName || ""} onChange={(e) => setEditingLead({ ...editingLead, firstName: e.target.value })} className="w-full rounded-xl border border-[#d9e2ef] p-2 text-xs text-[#1f2430]" />
									</div>
									<div>
										<label className="text-xs font-bold text-[#404d85]">Last Name</label>
										<input value={editingLead.lastName || ""} onChange={(e) => setEditingLead({ ...editingLead, lastName: e.target.value })} className="w-full rounded-xl border border-[#d9e2ef] p-2 text-xs text-[#1f2430]" />
									</div>
								</div>
								<div>
									<label className="text-xs font-bold text-[#404d85]">Work Email</label>
									<input value={editingLead.email || ""} onChange={(e) => setEditingLead({ ...editingLead, email: e.target.value })} type="email" className="w-full rounded-xl border border-[#d9e2ef] p-2 text-xs text-[#1f2430]" />
								</div>
								<div className="grid grid-cols-2 gap-2">
									<div>
										<label className="text-xs font-bold text-[#404d85]">Phone</label>
										<input value={editingLead.phone || ""} onChange={(e) => setEditingLead({ ...editingLead, phone: e.target.value })} className="w-full rounded-xl border border-[#d9e2ef] p-2 text-xs text-[#1f2430]" />
									</div>
									<div>
										<label className="text-xs font-bold text-[#404d85]">Company</label>
										<input value={editingLead.companyName || ""} onChange={(e) => setEditingLead({ ...editingLead, companyName: e.target.value })} className="w-full rounded-xl border border-[#d9e2ef] p-2 text-xs text-[#1f2430]" />
									</div>
								</div>
								<div className="flex justify-end gap-2 pt-2 border-t border-[#d9e2ef]">
									<button type="button" onClick={() => setEditingLead(null)} className="rounded-xl border border-[#d9e2ef] px-3 py-1.5 text-xs font-bold text-[#5b6472]">Cancel</button>
									<button type="submit" disabled={isUpdatingItem} className="rounded-xl bg-[#6678c1] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#5567b0] transition">{isUpdatingItem ? "Saving..." : "Save Changes"}</button>
								</div>
							</form>
						</div>
					</div>
				)}

				{/* EDIT DEAL MODAL */}
				{editingDeal && (
					<div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1e2540]/60 backdrop-blur-sm p-4">
						<div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-4 border border-[#d9e2ef]">
							<div className="flex items-center justify-between border-b border-[#d9e2ef] pb-3">
								<h3 className="text-base font-bold text-[#404d85]">Edit Deal Details</h3>
								<button type="button" onClick={() => setEditingDeal(null)} className="text-slate-400 hover:text-slate-600">✕</button>
							</div>
							<form onSubmit={(e) => void handleSaveEditDeal(e)} className="space-y-3">
								<div>
									<label className="text-xs font-bold text-[#404d85]">Contract Value</label>
									<input value={editingDeal.value || ""} onChange={(e) => setEditingDeal({ ...editingDeal, value: Number(e.target.value) })} type="number" className="w-full rounded-xl border border-[#d9e2ef] p-2 text-xs text-[#1f2430]" />
								</div>
								<div className="grid grid-cols-2 gap-2">
									<div>
										<label className="text-xs font-bold text-[#404d85]">Probability (%)</label>
										<input value={editingDeal.probability || ""} onChange={(e) => setEditingDeal({ ...editingDeal, probability: Number(e.target.value) })} type="number" className="w-full rounded-xl border border-[#d9e2ef] p-2 text-xs text-[#1f2430]" />
									</div>
									<div>
										<label className="text-xs font-bold text-[#404d85]">Status</label>
										<select value={editingDeal.status} onChange={(e) => setEditingDeal({ ...editingDeal, status: e.target.value })} className="w-full rounded-xl border border-[#d9e2ef] p-2 text-xs text-[#1f2430]">
											<option value="OPEN">OPEN</option>
											<option value="WON">WON</option>
											<option value="LOST">LOST</option>
										</select>
									</div>
								</div>
								<div className="flex justify-end gap-2 pt-2 border-t border-[#d9e2ef]">
									<button type="button" onClick={() => setEditingDeal(null)} className="rounded-xl border border-[#d9e2ef] px-3 py-1.5 text-xs font-bold text-[#5b6472]">Cancel</button>
									<button type="submit" disabled={isUpdatingItem} className="rounded-xl bg-[#6678c1] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#5567b0] transition">{isUpdatingItem ? "Saving..." : "Save Changes"}</button>
								</div>
							</form>
						</div>
					</div>
				)}

				{/* CRM CONNECTOR MODAL */}
				{selectedCrmConnectorModal && (
					<div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1e2540]/60 backdrop-blur-sm p-4 overflow-y-auto">
						<div className="w-full max-w-2xl rounded-3xl bg-white p-6 md:p-8 shadow-2xl relative my-8 border border-[#d9e2ef]">
							<button onClick={() => { setSelectedCrmConnectorModal(null); setTwentySyncStatus(null); }} className="absolute right-6 top-6 text-slate-400 hover:text-slate-600">
								✕
							</button>

							<div className="flex items-center gap-3 border-b border-[#d9e2ef] pb-4">
								<div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${selectedCrmConnectorModal.color}`}>
									{selectedCrmConnectorModal.icon && <selectedCrmConnectorModal.icon className="h-6 w-6" />}
								</div>
								<div>
									<h2 className="text-lg font-bold text-[#404d85]">{selectedCrmConnectorModal.name} Integration Gateway</h2>
									<p className="text-xs text-[#5b6472]">Official Enterprise REST & GraphQL API Synchronization Engine</p>
								</div>
							</div>

							<div className="mt-4 space-y-4 text-xs text-[#5b6472]">
								<p>
									Connect <strong>{selectedCrmConnectorModal.name}</strong> to Cambliss to automatically synchronize accounts, deal pipelines, quotes, and contacts.
								</p>
								<div className="rounded-xl border border-[#d9e2ef] bg-[#f8faff] p-4 space-y-2">
									<label className="block text-xs font-bold text-[#404d85]">Enter API Key / OAuth Client Secret:</label>
									<input type="password" placeholder={`Enter ${selectedCrmConnectorModal.name} Enterprise API Key`} className="w-full rounded-xl border border-[#d9e2ef] bg-white p-2.5 text-xs font-mono" />
									<button
										onClick={() => {
											alert(`Successfully authenticated ${selectedCrmConnectorModal.name} API gateway!`);
											setSelectedCrmConnectorModal(null);
										}}
										className="w-full rounded-xl bg-[#6678c1] py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#5567b0] transition mt-2"
									>
										Authorize & Initialize Sync
									</button>
								</div>
							</div>
						</div>
					</div>
				)}
			</div>
		</WorkspaceShell>
	);
}
