"use client";

import { useEffect, useState, useMemo } from "react";
import {
	Users,
	Building,
	Shield,
	CheckCircle2,
	XCircle,
	Search,
	RefreshCw,
	Layers,
	FileText,
	DollarSign,
	TrendingUp,
	Activity,
	Mail,
	Calendar,
	Filter,
} from "lucide-react";

type PlatformUser = {
	id: string;
	email: string;
	name: string;
	role: string;
	organizationName: string;
	organizationId: string | null;
	isPlatformUser: boolean;
	createdAt: string;
};

type TenantOrganization = {
	id: string;
	name: string;
	isActive: boolean;
	createdAt: string;
	_count?: {
		users: number;
	};
	subscriptions?: Array<{
		id: string;
		status: string;
		plan?: {
			name: string;
			price: number | string;
			interval: string;
		};
	}>;
};

type GlobalAnalytics = {
	totalOrganizations: number;
	totalUsers: number;
	totalDeals: number;
	totalEmployees: number;
	totalOrders: number;
	totalProducts: number;
	totalFiles: number;
	activeSubscriptions: number;
};

export const AdminSaasDomain = ({
	subView,
}: {
	subView: "saas-clients" | "saas-tenants" | "saas-analytics";
}) => {
	const [users, setUsers] = useState<PlatformUser[]>([]);
	const [organizations, setOrganizations] = useState<TenantOrganization[]>([]);
	const [analytics, setAnalytics] = useState<GlobalAnalytics | null>(null);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const [roleFilter, setRoleFilter] = useState("ALL");
	const [categoryFilter, setCategoryFilter] = useState<"ALL" | "CLIENTS" | "WORKERS">("ALL");
	const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

	const getAuthHeaders = (): Headers => {
		const headers = new Headers();
		const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
		if (token && token !== "cookie-session") {
			headers.set("Authorization", `Bearer ${token}`);
		}
		return headers;
	};

	const fetchData = async () => {
		setLoading(true);
		try {
			const headers = getAuthHeaders();

			// Fetch users
			const usersRes = await fetch("/api/admin/users", { headers, credentials: "include" });
			if (usersRes.ok) {
				setUsers((await usersRes.json()) as PlatformUser[]);
			}

			// Fetch organizations
			const orgsRes = await fetch("/api/admin/organizations", { headers, credentials: "include" });
			if (orgsRes.ok) {
				setOrganizations((await orgsRes.json()) as TenantOrganization[]);
			}

			// Fetch analytics
			const analyticsRes = await fetch("/api/admin/analytics", { headers, credentials: "include" });
			if (analyticsRes.ok) {
				setAnalytics((await analyticsRes.json()) as GlobalAnalytics);
			}
		} catch (error) {
			console.error("Failed to fetch SaaS admin data", error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		void fetchData();
	}, []);

	const handleToggleSuspendOrg = async (orgId: string, currentActive: boolean) => {
		setActionLoadingId(orgId);
		try {
			const headers = getAuthHeaders();
			const endpoint = currentActive
				? `/api/admin/organizations/${orgId}/suspend`
				: `/api/admin/organizations/${orgId}/activate`;

			const res = await fetch(endpoint, {
				method: "POST",
				headers,
				credentials: "include",
			});

			if (res.ok) {
				await fetchData();
			} else {
				alert("Failed to update organization status");
			}
		} catch (error) {
			console.error("Error toggling org status", error);
		} finally {
			setActionLoadingId(null);
		}
	};

	const clientCount = useMemo(() => users.filter((u) => u.role === "CLIENT" || u.isPlatformUser).length, [users]);
	const workerCount = useMemo(() => users.filter((u) => u.role === "EMPLOYEE" || u.role === "PROJECT_MANAGER").length, [users]);

	const filteredUsers = useMemo(() => {
		return users.filter((u) => {
			const matchesSearch =
				u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
				u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				u.organizationName.toLowerCase().includes(searchQuery.toLowerCase());
			const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
			const matchesCategory =
				categoryFilter === "ALL"
					? true
					: categoryFilter === "CLIENTS"
						? u.role === "CLIENT" || u.isPlatformUser
						: u.role === "EMPLOYEE" || u.role === "PROJECT_MANAGER";
			return matchesSearch && matchesRole && matchesCategory;
		});
	}, [users, searchQuery, roleFilter, categoryFilter]);

	return (
		<div className="space-y-6">
			{/* Top Bar with Refresh */}
			<div className="flex flex-col justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-5 text-white backdrop-blur sm:flex-row sm:items-center">
				<div>
					<div className="flex items-center gap-2">
						<span className="rounded bg-indigo-500/20 px-2.5 py-0.5 text-xs font-bold text-indigo-400">
							🏢 SaaS Control Plane
						</span>
						<span className="rounded bg-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-400">
							Real-Time DB Sync
						</span>
					</div>
					<h2 className="mt-2 text-xl font-extrabold tracking-tight">
						{subView === "saas-clients" && "SaaS Clients & Registered Users"}
						{subView === "saas-tenants" && "Tenant Organizations & Subscriptions"}
						{subView === "saas-analytics" && "Platform Global Health & Metrics"}
					</h2>
					<p className="mt-0.5 text-xs text-slate-400">
						Live system metrics of who is registered, their assigned tenant organizations, and roles.
					</p>
				</div>

				<button
					onClick={() => void fetchData()}
					disabled={loading}
					className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-700 active:scale-95 disabled:opacity-50"
				>
					<RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-indigo-400" : ""}`} />
					Refresh Data
				</button>
			</div>

			{/* METRIC STRIP */}
			<div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
				<div className="rounded-xl border border-slate-800 bg-slate-950 p-4 shadow-sm">
					<div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
						<Users className="h-4 w-4 text-indigo-400" />
						Total Clients & Users
					</div>
					<div className="mt-2 text-2xl font-black text-white">{analytics?.totalUsers ?? users.length}</div>
				</div>

				<div className="rounded-xl border border-slate-800 bg-slate-950 p-4 shadow-sm">
					<div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
						<Building className="h-4 w-4 text-emerald-400" />
						Tenant Organizations
					</div>
					<div className="mt-2 text-2xl font-black text-white">
						{analytics?.totalOrganizations ?? organizations.length}
					</div>
				</div>

				<div className="rounded-xl border border-slate-800 bg-slate-950 p-4 shadow-sm">
					<div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
						<Activity className="h-4 w-4 text-purple-400" />
						Active Subscriptions
					</div>
					<div className="mt-2 text-2xl font-black text-white">
						{analytics?.activeSubscriptions ?? organizations.filter((o) => o.isActive).length}
					</div>
				</div>

				<div className="rounded-xl border border-slate-800 bg-slate-950 p-4 shadow-sm">
					<div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
						<TrendingUp className="h-4 w-4 text-amber-400" />
						Total CRM Deals
					</div>
					<div className="mt-2 text-2xl font-black text-white">{analytics?.totalDeals ?? 0}</div>
				</div>
			</div>

			{/* VIEW 1: REGISTERED CLIENTS & USERS */}
			{subView === "saas-clients" && (
				<div className="space-y-4">
					{/* Search & Filter Bar */}
					<div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
						<div className="flex flex-wrap items-center gap-2">
							<div className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-950 p-1">
								<button
									type="button"
									onClick={() => setCategoryFilter("ALL")}
									className={`rounded px-2.5 py-1 text-xs font-semibold transition ${
										categoryFilter === "ALL" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
									}`}
								>
									All ({users.length})
								</button>
								<button
									type="button"
									onClick={() => setCategoryFilter("CLIENTS")}
									className={`rounded px-2.5 py-1 text-xs font-semibold transition ${
										categoryFilter === "CLIENTS" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
									}`}
								>
									🏢 Clients / Tenants ({clientCount})
								</button>
								<button
									type="button"
									onClick={() => setCategoryFilter("WORKERS")}
									className={`rounded px-2.5 py-1 text-xs font-semibold transition ${
										categoryFilter === "WORKERS" ? "bg-purple-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
									}`}
								>
									👷 Workers & Staff ({workerCount})
								</button>
							</div>
						</div>

						<div className="flex flex-wrap items-center gap-2">
							<div className="relative min-w-[220px]">
								<Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
								<input
									type="text"
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									placeholder="Search name, email, org..."
									className="w-full rounded-lg border border-slate-800 bg-slate-950 py-1.5 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
								/>
							</div>
							<select
								value={roleFilter}
								onChange={(e) => setRoleFilter(e.target.value)}
								className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
							>
								<option value="ALL">All Roles</option>
								<option value="SUPER_ADMIN">Super Admin</option>
								<option value="ADMIN">Admin</option>
								<option value="PROJECT_MANAGER">Project Manager</option>
								<option value="EMPLOYEE">Employee</option>
								<option value="CLIENT">Client</option>
							</select>
						</div>
					</div>

					{/* Users Table */}
					<div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950 shadow-xl">
						<table className="min-w-full divide-y divide-slate-800 text-left text-xs">
							<thead className="bg-slate-900/80 font-bold uppercase tracking-wider text-slate-400">
								<tr>
									<th className="px-4 py-3">Account</th>
									<th className="px-4 py-3">Type</th>
									<th className="px-4 py-3">Role</th>
									<th className="px-4 py-3">Tenant Organization</th>
									<th className="px-4 py-3">Registered Date</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
								{filteredUsers.map((user) => (
									<tr key={user.id} className="hover:bg-slate-900/40">
										<td className="px-4 py-3.5">
											<div className="flex items-center gap-2.5">
												<div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-950 font-bold text-indigo-400">
													{user.email[0].toUpperCase()}
												</div>
												<div>
													<div className="font-bold text-white">{user.name}</div>
													<div className="flex items-center gap-1 text-[11px] text-slate-500">
														<Mail className="h-3 w-3" />
														{user.email}
													</div>
												</div>
											</div>
										</td>
										<td className="px-4 py-3.5">
											{user.role === "CLIENT" ? (
												<span className="inline-flex items-center gap-1 rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
													🏢 SaaS Client
												</span>
											) : user.role === "PROJECT_MANAGER" ? (
												<span className="inline-flex items-center gap-1 rounded bg-purple-500/20 px-2 py-0.5 text-[10px] font-bold text-purple-400 border border-purple-500/30">
													👷 Worker (PM)
												</span>
											) : user.role === "EMPLOYEE" ? (
												<span className="inline-flex items-center gap-1 rounded bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-400 border border-blue-500/30">
													👷 Worker (Staff)
												</span>
											) : (
												<span className="inline-flex items-center gap-1 rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/30">
													👑 Platform Super Admin
												</span>
											)}
										</td>
										<td className="px-4 py-3.5">
											<span
												className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${
													user.role === "SUPER_ADMIN"
														? "bg-amber-500/20 text-amber-300"
														: user.role === "ADMIN"
															? "bg-indigo-500/20 text-indigo-300"
															: user.role === "PROJECT_MANAGER"
																? "bg-purple-500/20 text-purple-300"
																: user.role === "EMPLOYEE"
																	? "bg-blue-500/20 text-blue-300"
																	: "bg-slate-500/20 text-slate-300"
												}`}
											>
												<Shield className="h-3 w-3" />
												{user.role}
											</span>
										</td>
										<td className="px-4 py-3.5">
											<div className="flex items-center gap-1.5 font-semibold text-slate-200">
												<Building className="h-3.5 w-3.5 text-slate-500" />
												{user.organizationName}
											</div>
										</td>
										<td className="px-4 py-3.5 text-slate-400">
											<div className="flex items-center gap-1">
												<Calendar className="h-3 w-3" />
												{new Date(user.createdAt).toLocaleDateString("en-US", {
													month: "short",
													day: "numeric",
													year: "numeric",
												})}
											</div>
										</td>
										<td className="px-4 py-3.5 text-right">
											<span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
												<CheckCircle2 className="h-3 w-3" />
												Active
											</span>
										</td>
									</tr>
								))}
								{filteredUsers.length === 0 && (
									<tr>
										<td colSpan={5} className="py-12 text-center text-sm text-slate-500">
											No clients found matching filter criteria.
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>
				</div>
			)}

			{/* VIEW 2: TENANT ORGANIZATIONS */}
			{subView === "saas-tenants" && (
				<div className="space-y-4">
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						{organizations.map((org) => {
							const activeSub = org.subscriptions?.[0];
							return (
								<div
									key={org.id}
									className="rounded-xl border border-slate-800 bg-slate-950 p-5 shadow-lg space-y-4"
								>
									<div className="flex items-start justify-between">
										<div>
											<div className="flex items-center gap-2">
												<h4 className="font-extrabold text-white text-base">{org.name}</h4>
												<span
													className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
														org.isActive
															? "bg-emerald-500/20 text-emerald-400"
															: "bg-red-500/20 text-red-400"
													}`}
												>
													{org.isActive ? "Active Tenant" : "Suspended"}
												</span>
											</div>
											<div className="mt-1 font-mono text-[10px] text-slate-500">
												ID: {org.id}
											</div>
										</div>

										<button
											onClick={() => handleToggleSuspendOrg(org.id, org.isActive)}
											disabled={actionLoadingId === org.id}
											className={`rounded px-2.5 py-1 text-xs font-semibold transition ${
												org.isActive
													? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
													: "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
											}`}
										>
											{actionLoadingId === org.id
												? "Updating..."
												: org.isActive
													? "Suspend"
													: "Reactivate"}
										</button>
									</div>

									<div className="grid grid-cols-2 gap-3 border-t border-slate-800/80 pt-3 text-xs">
										<div>
											<span className="text-slate-500 block">Registered Members</span>
											<span className="font-bold text-white">
												{org._count?.users ?? 0} Users
											</span>
										</div>
										<div>
											<span className="text-slate-500 block">Subscription Tier</span>
											<span className="font-bold text-indigo-400">
												{activeSub?.plan?.name || "Enterprise Active"} (
												{activeSub?.status || "ACTIVE"})
											</span>
										</div>
										<div>
											<span className="text-slate-500 block">Onboarded Since</span>
											<span className="font-medium text-slate-300">
												{new Date(org.createdAt).toLocaleDateString()}
											</span>
										</div>
										<div>
											<span className="text-slate-500 block">Billing Period</span>
											<span className="font-medium text-slate-300">
												{activeSub?.plan?.interval || "MONTHLY"}
											</span>
										</div>
									</div>
								</div>
							);
						})}
					</div>
				</div>
			)}

			{/* VIEW 3: PLATFORM GLOBAL ANALYTICS */}
			{subView === "saas-analytics" && (
				<div className="space-y-6">
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
						<div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
							<div className="text-xs font-semibold text-slate-400">Total Registered Employees</div>
							<div className="mt-2 text-3xl font-black text-white">{analytics?.totalEmployees ?? 0}</div>
							<p className="mt-1 text-[11px] text-slate-500">Tracked in organization HRM directories.</p>
						</div>

						<div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
							<div className="text-xs font-semibold text-slate-400">Total Cloud Files Stored</div>
							<div className="mt-2 text-3xl font-black text-white">{analytics?.totalFiles ?? 0}</div>
							<p className="mt-1 text-[11px] text-slate-500">Across tenant workspaces and projects.</p>
						</div>

						<div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
							<div className="text-xs font-semibold text-slate-400">Total Catalog Products</div>
							<div className="mt-2 text-3xl font-black text-white">{analytics?.totalProducts ?? 0}</div>
							<p className="mt-1 text-[11px] text-slate-500">Across merchant stores and inventory.</p>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};
