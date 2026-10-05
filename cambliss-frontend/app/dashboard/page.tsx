"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import WorkspaceShell from "../../components/WorkspaceShell";
import {
	Folder,
	CheckSquare,
	Clock,
	CheckCircle2,
	Users,
	ArrowRight,
	Shield,
	Layers,
	FileText,
	Video,
	Building,
	Briefcase,
	Contact,
	Boxes,
	Store,
	Activity,
	AlertCircle,
	Sparkles,
	Kanban,
	Calendar,
} from "lucide-react";

const TRIAL_DAYS = 90;
const TRIAL_START_KEY = "trialActivatedAt";
const TRIAL_REMINDER_DAYS = [14, 7, 3, 1];
const ENABLE_ONBOARDING_REDIRECT = false;

type TrialReminderSnapshot = {
	organizationId: string;
	trialStartsAt: string;
	trialEndsAt: string;
	status: "TRIALING" | "EXPIRED" | "ACTIVE" | "NO_SUBSCRIPTION";
	daysLeft: number;
	timeLeftMs: number;
	reminderMessage: string;
	notificationThresholds: number[];
	maxUsersDuringTrial: number;
};

const getRoleFromToken = (token?: string | null): string | null => {
	if (!token) return null;
	try {
		const payloadPart = token.split(".")[1];
		if (!payloadPart) return null;
		const normalized = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
		const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
		const payload = JSON.parse(atob(padded)) as { role?: string };
		return payload.role ?? null;
	} catch {
		return null;
	}
};

const parseStoredDate = (value: string | null): Date | null => {
	if (!value) return null;
	const parsed = new Date(value);
	return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDuration = (milliseconds: number) => {
	if (milliseconds <= 0) return "00d 00h 00m 00s";
	const totalSeconds = Math.floor(milliseconds / 1000);
	const days = Math.floor(totalSeconds / 86400);
	const hours = Math.floor((totalSeconds % 86400) / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;
	return `${String(days).padStart(2, "0")}d ${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
};

const resolveDisplayName = (user?: any, org?: any): string => {
	if (!user && !org) return "";
	const fName = (user?.firstName || "").trim();
	const lName = (user?.lastName || "").trim();
	if (fName && lName) return `${fName} ${lName}`;
	if (fName) return fName;
	if (user?.name?.trim()) return user.name.trim();
	if (user?.fullName?.trim()) return user.fullName.trim();
	if (user?.legalName?.trim()) return user.legalName.trim();
	if (org?.name?.trim()) return org.name.trim();
	if (user?.email?.trim()) {
		const localPart = user.email.split("@")[0].trim();
		if (localPart) {
			return localPart.charAt(0).toUpperCase() + localPart.slice(1);
		}
	}
	return "";
};

type TaskItem = {
	id: string;
	title: string;
	description?: string | null;
	status: string;
	priority: string;
	dueDate?: string | null;
	assignedTo?: string | null;
	projectName?: string;
	projectId?: string;
	createdAt: string;
};

type ProjectItem = {
	id: string;
	name: string;
	description?: string | null;
	status: string;
	tasks?: TaskItem[];
	members?: any[];
};

export default function DashboardPage() {
	const router = useRouter();
	const [now, setNow] = useState(new Date());
	const [trialStart, setTrialStart] = useState<Date | null>(null);
	const [trialSnapshot, setTrialSnapshot] = useState<TrialReminderSnapshot | null>(null);
	const [userName, setUserName] = useState<string>("Team");
	const [userRole, setUserRole] = useState<string>("CLIENT");
	const [userAccesses, setUserAccesses] = useState<string[]>([]);
	const [currentUserId, setCurrentUserId] = useState<string | null>(null);
	const [projects, setProjects] = useState<ProjectItem[]>([]);
	const [tasks, setTasks] = useState<TaskItem[]>([]);
	const [tasksLoading, setTasksLoading] = useState(false);

	useEffect(() => {
		// 1. Instantly parse stored auth user credentials to avoid UI flicker
		try {
			const rawUser = localStorage.getItem("authUser");
			if (rawUser) {
				const parsed = JSON.parse(rawUser);
				const name = resolveDisplayName(parsed);
				if (name) setUserName(name);
				if (parsed.role) setUserRole(parsed.role);
				if (Array.isArray(parsed.accesses)) setUserAccesses(parsed.accesses);
				if (parsed.id) setCurrentUserId(parsed.id);
			}
		} catch {
			// ignore parse error
		}

		// 2. Fetch fresh profile and organization data from /api/auth/me
		const token = localStorage.getItem("authToken");
		const fetchMe = async () => {
			try {
				const headers: Record<string, string> = {};
				if (token && token !== "cookie-session") {
					headers["Authorization"] = `Bearer ${token}`;
				}
				const res = await fetch("/api/auth/me", {
					headers,
					credentials: "include",
				});
				if (res.ok) {
					const data = await res.json();
					const name = resolveDisplayName(data?.user, data?.organization);
					if (name) setUserName(name);
					if (data?.user?.role) setUserRole(data.user.role);
					if (Array.isArray(data?.user?.accesses)) setUserAccesses(data.user.accesses);
					if (data?.user?.id) setCurrentUserId(data.user.id);
					try {
						const existing = localStorage.getItem("authUser");
						const parsed = existing ? JSON.parse(existing) : {};
						localStorage.setItem("authUser", JSON.stringify({ ...parsed, ...data.user }));
					} catch {}
				}
			} catch {}
		};

		void fetchMe();
	}, []);

	useEffect(() => {
		const token = localStorage.getItem("authToken");
		const rawUser = localStorage.getItem("authUser");
		if (!rawUser && !token) return;

		try {
			const parsed = rawUser ? (JSON.parse(rawUser) as { role?: string }) : { role: undefined };
			const resolvedRole = parsed.role ?? getRoleFromToken(token);
			if (resolvedRole === "SUPER_ADMIN") {
				router.replace("/admin-dashboard");
			}
		} catch {
			const resolvedRole = getRoleFromToken(token);
			if (resolvedRole === "SUPER_ADMIN") {
				router.replace("/admin-dashboard");
			}
		}
	}, [router]);

	// Fetch projects & tasks for role-specific task dashboard
	useEffect(() => {
		const token = localStorage.getItem("authToken");
		if (!token) return;

		const fetchProjectsData = async () => {
			setTasksLoading(true);
			try {
				const headers: Record<string, string> = {};
				if (token && token !== "cookie-session") {
					headers["Authorization"] = `Bearer ${token}`;
				}
				const res = await fetch("/api/projects", { headers, credentials: "include" });
				if (res.ok) {
					const data = (await res.json()) as ProjectItem[];
					if (Array.isArray(data)) {
						setProjects(data);
						const allTasks: TaskItem[] = [];
						data.forEach((p) => {
							if (Array.isArray(p.tasks)) {
								p.tasks.forEach((t) => {
									allTasks.push({ ...t, projectName: p.name, projectId: p.id });
								});
							}
						});
						setTasks(allTasks);
					}
				}
			} catch {
				// fail silent
			} finally {
				setTasksLoading(false);
			}
		};

		void fetchProjectsData();
	}, []);

	const handleTaskStatusUpdate = async (taskId: string, newStatus: string) => {
		try {
			const token = localStorage.getItem("authToken");
			const headers: Record<string, string> = { "Content-Type": "application/json" };
			if (token && token !== "cookie-session") {
				headers["Authorization"] = `Bearer ${token}`;
			}
			const res = await fetch(`/api/tasks/${taskId}/status`, {
				method: "PUT",
				headers,
				credentials: "include",
				body: JSON.stringify({ status: newStatus }),
			});
			if (res.ok) {
				setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));
			}
		} catch {}
	};

	useEffect(() => {
		const timer = window.setInterval(() => setNow(new Date()), 1000);
		return () => window.clearInterval(timer);
	}, []);

	useEffect(() => {
		const fromStorage = parseStoredDate(localStorage.getItem(TRIAL_START_KEY));
		if (fromStorage) {
			setTrialStart(fromStorage);
			return;
		}

		const rawUser = localStorage.getItem("authUser");
		if (rawUser) {
			try {
				const parsed = JSON.parse(rawUser) as { createdAt?: string };
				const userCreatedAt = parseStoredDate(parsed.createdAt ?? null);
				if (userCreatedAt) {
					localStorage.setItem(TRIAL_START_KEY, userCreatedAt.toISOString());
					setTrialStart(userCreatedAt);
					return;
				}
			} catch {}
		}

		const fallbackStart = new Date();
		localStorage.setItem(TRIAL_START_KEY, fallbackStart.toISOString());
		setTrialStart(fallbackStart);
	}, []);

	useEffect(() => {
		const token = localStorage.getItem("authToken");
		if (!token) return;

		const loadTrialSnapshot = async () => {
			try {
				const response = await fetch("/api/subscription/trial-reminders", {
					headers: { Authorization: `Bearer ${token}` },
				});
				if (response.ok) {
					const data = (await response.json()) as TrialReminderSnapshot;
					setTrialSnapshot(data);
					const parsedStart = parseStoredDate(data.trialStartsAt);
					if (parsedStart) {
						localStorage.setItem(TRIAL_START_KEY, parsedStart.toISOString());
						setTrialStart(parsedStart);
					}
				}
			} catch {}
		};

		void loadTrialSnapshot();
	}, []);

	const trialSummary = useMemo(() => {
		if (trialSnapshot) {
			const trialEndsAt = new Date(trialSnapshot.trialEndsAt);
			const msLeft = Math.max(0, trialEndsAt.getTime() - now.getTime());
			const daysLeft = msLeft <= 0 ? 0 : Math.min(TRIAL_DAYS, Math.ceil(msLeft / (24 * 60 * 60 * 1000)));
			return {
				expiresAt: trialEndsAt,
				timeLeftLabel: formatDuration(msLeft),
				daysLeft,
				isExpired: trialSnapshot.status === "EXPIRED" || msLeft <= 0,
				reminder: trialSnapshot.reminderMessage,
			};
		}

		if (!trialStart) {
			return {
				expiresAt: null,
				timeLeftLabel: "--",
				daysLeft: TRIAL_DAYS,
				isExpired: false,
				reminder: "Loading trial details...",
			};
		}

		const expiresAt = new Date(trialStart.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
		const millisecondsLeft = expiresAt.getTime() - now.getTime();
		const isExpired = millisecondsLeft <= 0;
		const daysLeft = isExpired ? 0 : Math.ceil(millisecondsLeft / (24 * 60 * 60 * 1000));
		const reminderThreshold = TRIAL_REMINDER_DAYS.find((day) => daysLeft <= day);

		let reminder = "You are in the free trial period.";
		if (isExpired) {
			reminder = "Trial expired. Add billing to continue uninterrupted access.";
		} else if (reminderThreshold !== undefined) {
			reminder = `Reminder: your free trial ends in ${daysLeft} day${daysLeft === 1 ? "" : "s"}.`;
		}

		return {
			expiresAt,
			timeLeftLabel: formatDuration(millisecondsLeft),
			daysLeft,
			isExpired,
			reminder,
		};
	}, [now, trialStart, trialSnapshot]);

	// Filter tasks assigned to current user
	const myAssignedTasks = useMemo(() => {
		if (!currentUserId) return [];
		return tasks.filter((t) => t.assignedTo === currentUserId);
	}, [tasks, currentUserId]);

	const myActiveTasks = useMemo(() => {
		return myAssignedTasks.filter((t) => t.status !== "DONE");
	}, [myAssignedTasks]);

	const myCompletedTasks = useMemo(() => {
		return myAssignedTasks.filter((t) => t.status === "DONE");
	}, [myAssignedTasks]);

	// ----------------------------------------------------
	// 1. EMPLOYEE DASHBOARD
	// ----------------------------------------------------
	const renderEmployeeDashboard = () => (
		<div className="space-y-6">
			{/* Top Hero Banner */}
			<div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-xl">
				<div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
					<div>
						<div className="flex items-center gap-2">
							<span className="flex items-center gap-1.5 rounded-full bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-300 backdrop-blur-sm">
								<Shield className="h-3.5 w-3.5" />
								ROLE: EMPLOYEE
							</span>
							<span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-medium text-emerald-300">
								Worker Workspace Active
							</span>
						</div>
						<h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
							Hello, {userName}
						</h1>
						<p className="mt-1 text-sm text-slate-300">
							Here is your personalized workspace with your assigned work, tasks, and permitted tools.
						</p>
					</div>

					<Link
						href="/projects"
						className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 active:scale-95"
					>
						<CheckSquare className="h-4 w-4" />
						Open Projects & Tasks
					</Link>
				</div>
			</div>

			{/* Summary Metrics */}
			<div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
				<div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
					<div className="flex items-center gap-2 text-xs font-medium text-zinc-500">
						<CheckSquare className="h-4 w-4 text-indigo-600" />
						Assigned Tasks
					</div>
					<div className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
						{myAssignedTasks.length}
					</div>
				</div>

				<div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
					<div className="flex items-center gap-2 text-xs font-medium text-zinc-500">
						<Clock className="h-4 w-4 text-amber-500" />
						In Progress / Active
					</div>
					<div className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
						{myActiveTasks.length}
					</div>
				</div>

				<div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
					<div className="flex items-center gap-2 text-xs font-medium text-zinc-500">
						<CheckCircle2 className="h-4 w-4 text-emerald-500" />
						Completed Tasks
					</div>
					<div className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
						{myCompletedTasks.length}
					</div>
				</div>

				<div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
					<div className="flex items-center gap-2 text-xs font-medium text-zinc-500">
						<Layers className="h-4 w-4 text-purple-600" />
						Permitted Modules
					</div>
					<div className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
						{userAccesses.length}
					</div>
				</div>
			</div>

			{/* Section 1: My Assigned Tasks */}
			<div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
				<div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
					<div>
						<div className="flex items-center gap-2">
							<h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
								My Assigned Work & Tasks
							</h2>
							<span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
								{myActiveTasks.length} Active
							</span>
						</div>
						<p className="mt-0.5 text-xs text-zinc-500">
							Tasks and milestones assigned directly to you by your Project Manager.
						</p>
					</div>

					<Link
						href="/projects"
						className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
					>
						Full Kanban Board
						<ArrowRight className="h-3.5 w-3.5" />
					</Link>
				</div>

				<div className="mt-4 space-y-3">
					{myAssignedTasks.length > 0 ? (
						myAssignedTasks.map((task) => (
							<div
								key={task.id}
								className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 transition hover:border-indigo-300 hover:bg-white dark:border-zinc-800 dark:bg-zinc-900/50"
							>
								<div className="space-y-1">
									<div className="flex flex-wrap items-center gap-2">
										<span
											className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
												task.priority === "URGENT"
													? "bg-red-100 text-red-700"
													: task.priority === "HIGH"
														? "bg-orange-100 text-orange-700"
														: "bg-blue-100 text-blue-700"
											}`}
										>
											{task.priority || "NORMAL"}
										</span>
										<span className="rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
											📁 {task.projectName}
										</span>
										{task.dueDate && (
											<span className="flex items-center gap-1 text-[11px] text-zinc-500">
												<Calendar className="h-3 w-3" />
												Due: {new Date(task.dueDate).toLocaleDateString()}
											</span>
										)}
									</div>
									<h4 className={`text-sm font-semibold ${task.status === "DONE" ? "line-through text-zinc-400" : "text-zinc-900 dark:text-zinc-100"}`}>
										{task.title}
									</h4>
									{task.description && (
										<p className="line-clamp-1 text-xs text-zinc-500">{task.description}</p>
									)}
								</div>

								<div className="flex items-center gap-2 self-end sm:self-center">
									{task.status === "TODO" && (
										<button
											onClick={() => void handleTaskStatusUpdate(task.id, "IN_PROGRESS")}
											className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 transition"
										>
											Start Work →
										</button>
									)}
									{task.status === "IN_PROGRESS" && (
										<button
											onClick={() => void handleTaskStatusUpdate(task.id, "DONE")}
											className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 transition"
										>
											Mark Done ✓
										</button>
									)}
									{task.status === "DONE" && (
										<span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
											Completed ✓
										</span>
									)}
								</div>
							</div>
						))
					) : (
						<div className="py-8 text-center">
							<CheckSquare className="mx-auto h-8 w-8 text-zinc-300" />
							<p className="mt-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
								No active tasks assigned to you right now
							</p>
							<p className="mt-0.5 text-xs text-zinc-500">
								When your Project Manager assigns tasks or work to your profile, they will appear here.
							</p>
						</div>
					)}
				</div>
			</div>

			{/* Section 2: My Permitted Business Tools */}
			<div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
				<h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
					🛠️ My Permitted Work Tools
				</h2>
				<p className="mt-0.5 text-xs text-zinc-500">
					Only the business modules assigned to your profile by your organization admin are available below.
				</p>

				<div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
					<Link
						href="/projects"
						className="group rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 transition hover:border-indigo-400 hover:bg-white hover:shadow-sm"
					>
						<div className="flex items-center gap-3">
							<div className="rounded-lg bg-indigo-100 p-2 text-indigo-700">
								<Folder className="h-5 w-5" />
							</div>
							<div>
								<h3 className="text-sm font-bold text-zinc-900 group-hover:text-indigo-600">
									Projects & Tasks
								</h3>
								<p className="text-[11px] text-zinc-500">View Kanban sprints and assigned milestones</p>
							</div>
						</div>
					</Link>

					{userAccesses.includes("CRM") && (
						<Link
							href="/crm"
							className="group rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 transition hover:border-indigo-400 hover:bg-white hover:shadow-sm"
						>
							<div className="flex items-center gap-3">
								<div className="rounded-lg bg-blue-100 p-2 text-blue-700">
									<Contact className="h-5 w-5" />
								</div>
								<div>
									<h3 className="text-sm font-bold text-zinc-900 group-hover:text-blue-600">
										CRM & Sales
									</h3>
									<p className="text-[11px] text-zinc-500">Customer leads, accounts, and deal stages</p>
								</div>
							</div>
						</Link>
					)}

					{userAccesses.includes("HRM") && (
						<Link
							href="/hrm"
							className="group rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 transition hover:border-indigo-400 hover:bg-white hover:shadow-sm"
						>
							<div className="flex items-center gap-3">
								<div className="rounded-lg bg-purple-100 p-2 text-purple-700">
									<Users className="h-5 w-5" />
								</div>
								<div>
									<h3 className="text-sm font-bold text-zinc-900 group-hover:text-purple-600">
										HRM Portal
									</h3>
									<p className="text-[11px] text-zinc-500">Employee directory and organizational charts</p>
								</div>
							</div>
						</Link>
					)}

					{userAccesses.includes("INVENTORY") && (
						<Link
							href="/inventory"
							className="group rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 transition hover:border-indigo-400 hover:bg-white hover:shadow-sm"
						>
							<div className="flex items-center gap-3">
								<div className="rounded-lg bg-amber-100 p-2 text-amber-700">
									<Boxes className="h-5 w-5" />
								</div>
								<div>
									<h3 className="text-sm font-bold text-zinc-900 group-hover:text-amber-600">
										Inventory Control
									</h3>
									<p className="text-[11px] text-zinc-500">Warehouse items, stock levels, and supply</p>
								</div>
							</div>
						</Link>
					)}

					{userAccesses.includes("FILE_SHARING") && (
						<Link
							href="/file-sharing"
							className="group rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 transition hover:border-indigo-400 hover:bg-white hover:shadow-sm"
						>
							<div className="flex items-center gap-3">
								<div className="rounded-lg bg-emerald-100 p-2 text-emerald-700">
									<FileText className="h-5 w-5" />
								</div>
								<div>
									<h3 className="text-sm font-bold text-zinc-900 group-hover:text-emerald-600">
										File Sharing
									</h3>
									<p className="text-[11px] text-zinc-500">Secure organization assets and documents</p>
								</div>
							</div>
						</Link>
					)}

					{userAccesses.includes("VIDEO_CONNECT") && (
						<Link
							href="/video-connect"
							className="group rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 transition hover:border-indigo-400 hover:bg-white hover:shadow-sm"
						>
							<div className="flex items-center gap-3">
								<div className="rounded-lg bg-rose-100 p-2 text-rose-700">
									<Video className="h-5 w-5" />
								</div>
								<div>
									<h3 className="text-sm font-bold text-zinc-900 group-hover:text-rose-600">
										Video Connect
									</h3>
									<p className="text-[11px] text-zinc-500">High-definition squad meetings and rooms</p>
								</div>
							</div>
						</Link>
					)}
				</div>
			</div>

			{/* Section 3: Collaboration Pillars */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
				<Link
					href="/spaces"
					className="rounded-xl border border-zinc-200 bg-white p-4 transition hover:border-indigo-400 hover:shadow-sm"
				>
					<span className="text-xl">🏢</span>
					<h4 className="mt-2 text-sm font-bold text-zinc-900">Team Spaces</h4>
					<p className="mt-0.5 text-xs text-zinc-500">Engage in squads, announcements, and channel chats</p>
				</Link>

				<Link
					href="/knowledge"
					className="rounded-xl border border-zinc-200 bg-white p-4 transition hover:border-indigo-400 hover:shadow-sm"
				>
					<span className="text-xl">📚</span>
					<h4 className="mt-2 text-sm font-bold text-zinc-900">Knowledge & SOPs</h4>
					<p className="mt-0.5 text-xs text-zinc-500">Browse operational guidelines and company policies</p>
				</Link>

				<Link
					href="/directory"
					className="rounded-xl border border-zinc-200 bg-white p-4 transition hover:border-indigo-400 hover:shadow-sm"
				>
					<span className="text-xl">👥</span>
					<h4 className="mt-2 text-sm font-bold text-zinc-900">People Directory</h4>
					<p className="mt-0.5 text-xs text-zinc-500">Connect with colleagues across all departments</p>
				</Link>
			</div>
		</div>
	);

	// ----------------------------------------------------
	// 2. PROJECT MANAGER DASHBOARD
	// ----------------------------------------------------
	const renderProjectManagerDashboard = () => (
		<div className="space-y-6">
			{/* Top Hero Banner */}
			<div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-xl">
				<div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
					<div>
						<div className="flex items-center gap-2">
							<span className="flex items-center gap-1.5 rounded-full bg-purple-500/20 px-3 py-1 text-xs font-semibold text-purple-300 backdrop-blur-sm">
								<Shield className="h-3.5 w-3.5" />
								ROLE: PROJECT MANAGER
							</span>
							<span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-medium text-emerald-300">
								Full PM Governance Active
							</span>
						</div>
						<h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
							Hello, {userName}
						</h1>
						<p className="mt-1 text-sm text-slate-300">
							Lead milestones, allocate cross-functional talent, monitor task velocity, and report deliverables.
						</p>
					</div>

					<div className="flex items-center gap-2">
						<Link
							href="/projects"
							className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 active:scale-95"
						>
							<Kanban className="h-4 w-4" />
							Manage Projects & Tasks
						</Link>
					</div>
				</div>
			</div>

			{/* Summary Metrics */}
			<div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
				<div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
					<div className="flex items-center gap-2 text-xs font-medium text-zinc-500">
						<Folder className="h-4 w-4 text-indigo-600" />
						Total Projects
					</div>
					<div className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
						{projects.length}
					</div>
				</div>

				<div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
					<div className="flex items-center gap-2 text-xs font-medium text-zinc-500">
						<Clock className="h-4 w-4 text-amber-500" />
						Active Tasks
					</div>
					<div className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
						{tasks.filter((t) => t.status !== "DONE").length}
					</div>
				</div>

				<div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
					<div className="flex items-center gap-2 text-xs font-medium text-zinc-500">
						<CheckCircle2 className="h-4 w-4 text-emerald-500" />
						Completed Tasks
					</div>
					<div className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
						{tasks.filter((t) => t.status === "DONE").length}
					</div>
				</div>

				<div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
					<div className="flex items-center gap-2 text-xs font-medium text-zinc-500">
						<Users className="h-4 w-4 text-purple-600" />
						Assigned to You
					</div>
					<div className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
						{myAssignedTasks.length}
					</div>
				</div>
			</div>

			{/* Section 1: Active Projects Overview */}
			<div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
				<div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
					<div>
						<h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
							Active Project Milestones
						</h2>
						<p className="mt-0.5 text-xs text-zinc-500">
							Monitor progress and velocity across all organization projects.
						</p>
					</div>

					<Link
						href="/projects"
						className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
					>
						Open Workspace
						<ArrowRight className="h-3.5 w-3.5" />
					</Link>
				</div>

				<div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
					{projects.map((proj) => {
						const projTasks = tasks.filter((t) => t.projectId === proj.id);
						const doneCount = projTasks.filter((t) => t.status === "DONE").length;
						const percentage = projTasks.length > 0 ? Math.round((doneCount / projTasks.length) * 100) : 0;

						return (
							<div
								key={proj.id}
								className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 transition hover:border-indigo-300 hover:bg-white dark:border-zinc-800 dark:bg-zinc-900"
							>
								<div className="flex items-center justify-between">
									<h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{proj.name}</h4>
									<span className="rounded bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
										{percentage}% Done
									</span>
								</div>
								{proj.description && (
									<p className="mt-1 line-clamp-2 text-xs text-zinc-500">{proj.description}</p>
								)}
								<div className="mt-3">
									<div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
										<div
											className="h-full rounded-full bg-indigo-600 transition-all duration-500"
											style={{ width: `${percentage}%` }}
										/>
									</div>
									<div className="mt-2 flex items-center justify-between text-[11px] text-zinc-500">
										<span>{doneCount} of {projTasks.length} tasks completed</span>
										<Link
											href="/projects"
											className="font-semibold text-indigo-600 hover:text-indigo-700"
										>
											Kanban View →
										</Link>
									</div>
								</div>
							</div>
						);
					})}
				</div>
			</div>

			{/* Section 2: PM Collaboration Suite */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
				<Link
					href="/projects"
					className="group rounded-xl border border-zinc-200 bg-white p-4 transition hover:border-indigo-400 hover:shadow-sm"
				>
					<span className="text-xl">📊</span>
					<h4 className="mt-2 text-sm font-bold text-zinc-900 group-hover:text-indigo-600">
						Milestones & Tasks
					</h4>
					<p className="mt-0.5 text-xs text-zinc-500">Interactive Kanban board and sprint task allocations</p>
				</Link>

				<Link
					href="/directory"
					className="group rounded-xl border border-zinc-200 bg-white p-4 transition hover:border-indigo-400 hover:shadow-sm"
				>
					<span className="text-xl">👥</span>
					<h4 className="mt-2 text-sm font-bold text-zinc-900 group-hover:text-indigo-600">
						Team Allocation & People
					</h4>
					<p className="mt-0.5 text-xs text-zinc-500">Assign members and review squad capacity</p>
				</Link>

				<Link
					href="/knowledge"
					className="group rounded-xl border border-zinc-200 bg-white p-4 transition hover:border-indigo-400 hover:shadow-sm"
				>
					<span className="text-xl">📚</span>
					<h4 className="mt-2 text-sm font-bold text-zinc-900 group-hover:text-indigo-600">
						Operations SOPs & Docs
					</h4>
					<p className="mt-0.5 text-xs text-zinc-500">Project delivery playbooks and institutional memory</p>
				</Link>
			</div>
		</div>
	);

	// ----------------------------------------------------
	// 3. CLIENT / ADMIN DASHBOARD (bhaskeradv1@gmail.com)
	//    Full business suite — ALL tools, pastel brand colors only
	// ----------------------------------------------------
	const renderClientDashboard = () => {
		const allTools = [
			{
				href: "/crm",
				emoji: "📈",
				label: "CRM & Sales",
				desc: "Leads, deals pipeline, and customer 360",
				bg: "bg-blue-50",
				border: "border-blue-100",
				hover: "hover:border-blue-300 hover:bg-blue-50",
				badge: "CRM",
				badgeBg: "bg-blue-100 text-blue-700",
			},
			{
				href: "/hrm",
				emoji: "🏢",
				label: "HR Management",
				desc: "Employees, payslips, attendance & leaves",
				bg: "bg-violet-50",
				border: "border-violet-100",
				hover: "hover:border-violet-300 hover:bg-violet-50",
				badge: "HRM",
				badgeBg: "bg-violet-100 text-violet-700",
			},
			{
				href: "/projects",
				emoji: "📁",
				label: "Projects & Tasks",
				desc: "Assign tasks, track milestones, Kanban board",
				bg: "bg-indigo-50",
				border: "border-indigo-100",
				hover: "hover:border-[#6678c1] hover:bg-indigo-50",
				badge: "PM",
				badgeBg: "bg-[#eef2fa] text-[#404d85]",
			},
			{
				href: "/inventory",
				emoji: "📦",
				label: "Inventory & Supply",
				desc: "Warehouses, purchase orders, stock control",
				bg: "bg-amber-50",
				border: "border-amber-100",
				hover: "hover:border-amber-300 hover:bg-amber-50",
				badge: "ERP",
				badgeBg: "bg-amber-100 text-amber-700",
			},
			{
				href: "/file-sharing",
				emoji: "📂",
				label: "File Sharing",
				desc: "Shared drives, upload & collaborate on docs",
				bg: "bg-teal-50",
				border: "border-teal-100",
				hover: "hover:border-teal-300 hover:bg-teal-50",
				badge: "Files",
				badgeBg: "bg-teal-100 text-teal-700",
			},
			{
				href: "/video-connect",
				emoji: "🎥",
				label: "Video Connect",
				desc: "HD meetings, rooms & screen sharing",
				bg: "bg-rose-50",
				border: "border-rose-100",
				hover: "hover:border-rose-300 hover:bg-rose-50",
				badge: "Video",
				badgeBg: "bg-rose-100 text-rose-700",
			},
			{
				href: "/knowledge",
				emoji: "📚",
				label: "Knowledge Base",
				desc: "SOPs, wikis, and team documentation",
				bg: "bg-lime-50",
				border: "border-lime-100",
				hover: "hover:border-lime-300 hover:bg-lime-50",
				badge: "Docs",
				badgeBg: "bg-lime-100 text-lime-700",
			},
			{
				href: "/spaces",
				emoji: "💬",
				label: "Spaces & Chat",
				desc: "Team channels, announcements & threads",
				bg: "bg-sky-50",
				border: "border-sky-100",
				hover: "hover:border-sky-300 hover:bg-sky-50",
				badge: "Collab",
				badgeBg: "bg-sky-100 text-sky-700",
			},
			{
				href: "/accountech",
				emoji: "🧾",
				label: "Accountech ERP",
				desc: "GST invoicing, journal entries, P&L reports",
				bg: "bg-orange-50",
				border: "border-orange-100",
				hover: "hover:border-orange-300 hover:bg-orange-50",
				badge: "Finance",
				badgeBg: "bg-orange-100 text-orange-700",
			},
			{
				href: "/directory",
				emoji: "👥",
				label: "Team Directory",
				desc: "Staff roster, departments & org chart",
				bg: "bg-fuchsia-50",
				border: "border-fuchsia-100",
				hover: "hover:border-fuchsia-300 hover:bg-fuchsia-50",
				badge: "People",
				badgeBg: "bg-fuchsia-100 text-fuchsia-700",
			},
			{
				href: "/user-management",
				emoji: "🛡️",
				label: "User Management",
				desc: "Add workers, assign roles & module access",
				bg: "bg-emerald-50",
				border: "border-emerald-100",
				hover: "hover:border-emerald-300 hover:bg-emerald-50",
				badge: "RBAC",
				badgeBg: "bg-emerald-100 text-emerald-700",
			},
			{
				href: "/vendor-dashboard",
				emoji: "🏬",
				label: "Your Store",
				desc: "Product catalog, orders & seller dashboard",
				bg: "bg-pink-50",
				border: "border-pink-100",
				hover: "hover:border-pink-300 hover:bg-pink-50",
				badge: "Ecommerce",
				badgeBg: "bg-pink-100 text-pink-700",
			},
		];

		return (
			<div className="space-y-7">

				{/* ── WELCOME HERO — Pastel brand gradient, no dark colors ── */}
				<div className="rounded-2xl border border-[#d9e2ef] bg-gradient-to-br from-[#eef2fa] via-white to-[#f0f4ff] p-7 shadow-sm">
					<div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
						<div>
							<div className="inline-flex items-center gap-2 rounded-full border border-[#6678c1]/25 bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-[#404d85] shadow-sm">
								<span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
								Business Control Center
							</div>
							<h1 className="mt-3 text-3xl font-bold tracking-tight text-[#404d85] sm:text-4xl">
								Welcome back, {userName} 👋
							</h1>
							<p className="mt-2 max-w-xl text-sm leading-6 text-[#5b6472]">
								Your unified business hub — CRM, HR, Projects, Finance, Inventory, Video, and your online store, all in one place.
							</p>
						</div>

						<div className="flex flex-col items-start gap-2 sm:items-end">
							<div
								className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold ${
									trialSummary.isExpired
										? "border-red-200 bg-red-50 text-red-600"
										: "border-[#d9e2ef] bg-white text-[#404d85]"
								}`}
							>
								<Clock className="h-3.5 w-3.5" />
								{trialSummary.isExpired
									? "Trial Expired — Upgrade to continue"
									: `Free Trial: ${trialSummary.daysLeft} days remaining`}
							</div>
							<div className="flex items-center gap-2">
								<Link
									href="/user-management"
									className="inline-flex items-center gap-2 rounded-xl border border-[#d9e2ef] bg-white px-4 py-2 text-sm font-semibold text-[#404d85] shadow-sm transition hover:border-[#6678c1] hover:bg-[#eef2fa]"
								>
									<Users className="h-4 w-4" />
									Manage Team
								</Link>
								<Link
									href="/projects"
									className="inline-flex items-center gap-2 rounded-xl bg-[#404d85] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#323d6b] active:scale-95"
								>
									<Folder className="h-4 w-4" />
									Projects & Tasks
								</Link>
							</div>
						</div>
					</div>

					{/* Summary stat pills */}
					<div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
						{[
							{ label: "Active Projects", value: projects.length, color: "text-[#404d85]", bgColor: "bg-[#eef2fa]", emoji: "📁" },
							{ label: "Open Tasks", value: tasks.filter(t => t.status !== "DONE").length, color: "text-amber-700", bgColor: "bg-amber-50", emoji: "⏳" },
							{ label: "Completed Tasks", value: tasks.filter(t => t.status === "DONE").length, color: "text-emerald-700", bgColor: "bg-emerald-50", emoji: "✅" },
							{ label: "Trial Days Left", value: trialSummary.daysLeft, color: "text-violet-700", bgColor: "bg-violet-50", emoji: "⏱️" },
						].map(stat => (
							<div
								key={stat.label}
								className={`flex items-center gap-3 rounded-xl border border-white/80 ${stat.bgColor} px-4 py-3 shadow-sm`}
							>
								<span className="text-xl">{stat.emoji}</span>
								<div>
									<div className={`text-lg font-bold ${stat.color}`}>{stat.value}</div>
									<div className="text-[10px] font-medium text-slate-500">{stat.label}</div>
								</div>
							</div>
						))}
					</div>
				</div>

				{/* ── ALL BUSINESS TOOLS GRID ── */}
				<div>
					<div className="mb-4 flex items-center gap-3">
						<div className="h-px flex-1 bg-[#e8edf5]" />
						<span className="text-[11px] font-bold uppercase tracking-widest text-[#6678c1]">
							Your Business Suite — All Tools
						</span>
						<div className="h-px flex-1 bg-[#e8edf5]" />
					</div>

					<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
						{allTools.map(tool => (
							<Link
								key={tool.href}
								href={tool.href}
								className={`group flex flex-col rounded-2xl border ${tool.border} ${tool.bg} p-4 shadow-sm transition-all duration-200 ${tool.hover} hover:shadow-md`}
							>
								<div className="flex items-start justify-between">
									<span className="text-2xl">{tool.emoji}</span>
									<span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${tool.badgeBg}`}>
										{tool.badge}
									</span>
								</div>
								<h3 className="mt-3 text-sm font-bold text-slate-800 group-hover:text-[#404d85]">
									{tool.label}
								</h3>
								<p className="mt-1 text-[11px] leading-4 text-slate-500">{tool.desc}</p>
								<div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-[#6678c1] opacity-0 transition group-hover:opacity-100">
									Open <ArrowRight className="h-3 w-3" />
								</div>
							</Link>
						))}
					</div>
				</div>

				{/* ── ECOMMERCE QUICK ACTIONS ── */}
				<div className="rounded-2xl border border-[#d9e2ef] bg-gradient-to-br from-white to-[#f8faff] p-6 shadow-sm">
					<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<div className="flex items-center gap-2">
								<h2 className="text-base font-extrabold text-slate-900">🏬 Store & Marketplace Operations</h2>
								<span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
									Commerce Hub
								</span>
							</div>
							<p className="mt-1 text-xs text-slate-500">
								Manage your product catalog, fulfill orders, and track your marketplace performance.
							</p>
						</div>
						<Link
							href="/vendor-dashboard"
							className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#404d85] px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#323d6b] active:scale-95"
						>
							Open Store Dashboard →
						</Link>
					</div>

					<div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
						{[
							{ href: "/vendor-dashboard?view=catalog-products", emoji: "📦", label: "Products & Catalog", desc: "Manage stock & prices" },
							{ href: "/vendor-dashboard?view=orders-new", emoji: "📋", label: "Orders & Fulfillment", desc: "Track shipment delivery" },
							{ href: "/inventory", emoji: "🏭", label: "Inventory & POs", desc: "Supply chain control" },
							{ href: "/storefront", emoji: "🛒", label: "Live Marketplace", desc: "Explore 3P catalog" },
						].map(item => (
							<Link
								key={item.href}
								href={item.href}
								className="flex flex-col rounded-xl border border-[#e8edf5] bg-white p-4 transition hover:border-[#6678c1] hover:shadow-sm"
							>
								<span className="text-2xl">{item.emoji}</span>
								<h4 className="mt-2 text-xs font-bold text-slate-800">{item.label}</h4>
								<span className="mt-0.5 text-[10px] text-slate-500">{item.desc}</span>
							</Link>
						))}
					</div>
				</div>
			</div>
		);
	};

	return (
		<WorkspaceShell>
			<div className="mt-5 text-[#111827]">
				{userRole === "EMPLOYEE"
					? renderEmployeeDashboard()
					: userRole === "PROJECT_MANAGER"
						? renderProjectManagerDashboard()
						: renderClientDashboard()}
			</div>
		</WorkspaceShell>
	);
}
