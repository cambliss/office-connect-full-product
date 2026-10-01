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
			const daysLeft = msLeft <= 0 ? 0 : Math.ceil(msLeft / (24 * 60 * 60 * 1000));
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
								⭐ My Assigned Work & Tasks
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
	// ----------------------------------------------------
	const renderClientDashboard = () => (
		<div className="space-y-6 text-[#111827]">
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div>
					<div className="inline-flex items-center gap-2 rounded-full border border-[#6678c1]/20 bg-[#6678c1]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#404d85]">
						<span className="h-2 w-2 rounded-full bg-emerald-500"></span>
						Client Business Control Center
					</div>
					<h1 className="mt-2 text-4xl font-semibold tracking-tight text-[#404d85]">
						Hello, {userName}
					</h1>
					<p className="mt-2 max-w-2xl text-sm leading-6 text-[#5b6472]">
						Welcome to your unified business hub. Manage customer relations, projects, inventory, staff, and online storefronts.
					</p>
				</div>
				<div className="flex items-center gap-3">
					<div
						className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
							trialSummary.isExpired
								? "bg-red-50 text-red-600 border border-red-200"
								: "bg-[#eef2fa] text-[#404d85] border border-[#d9e2ef]"
						}`}
					>
						<Clock className="h-3.5 w-3.5" />
						{trialSummary.isExpired ? "Trial Expired" : `${trialSummary.daysLeft} days left`}
					</div>
					<Link
						href="/user-management"
						className="inline-flex items-center gap-2 rounded-xl bg-[#404d85] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#323d6b]"
					>
						<Users className="h-4 w-4" />
						<span>User Management</span>
					</Link>
					<Link
						href="/projects"
						className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
					>
						<Folder className="h-4 w-4" />
						<span>Projects & Tasks</span>
					</Link>
				</div>
			</div>

			{/* QUICK ACCESS PILLARS */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				<Link
					href="/central"
					className="group rounded-2xl border border-[#d9e2ef] bg-gradient-to-br from-white to-[#f8faff] p-4 shadow-sm transition hover:border-[#6678c1] hover:shadow-md"
				>
					<div className="flex items-center justify-between">
						<span className="text-xl">💬</span>
						<span className="rounded-full bg-[#eef2fa] px-2 py-0.5 text-[10px] font-bold text-[#404d85]">Live Hub</span>
					</div>
					<h3 className="mt-2 text-sm font-bold text-slate-900 group-hover:text-[#404d85]">Central Stream</h3>
					<p className="mt-0.5 text-[11px] text-slate-500">Company announcements & leadership broadcasts</p>
				</Link>

				<Link
					href="/crm"
					className="group rounded-2xl border border-[#d9e2ef] bg-gradient-to-br from-white to-[#f8faff] p-4 shadow-sm transition hover:border-[#6678c1] hover:shadow-md"
				>
					<div className="flex items-center justify-between">
						<span className="text-xl">📈</span>
						<span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">CRM Engine</span>
					</div>
					<h3 className="mt-2 text-sm font-bold text-slate-900 group-hover:text-[#404d85]">Sales & Leads</h3>
					<p className="mt-0.5 text-[11px] text-slate-500">Deals pipelines, contact stages, and customer 360</p>
				</Link>

				<Link
					href="/projects"
					className="group rounded-2xl border border-[#d9e2ef] bg-gradient-to-br from-white to-[#f8faff] p-4 shadow-sm transition hover:border-[#6678c1] hover:shadow-md"
				>
					<div className="flex items-center justify-between">
						<span className="text-xl">📁</span>
						<span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700">Delivery</span>
					</div>
					<h3 className="mt-2 text-sm font-bold text-slate-900 group-hover:text-[#404d85]">Projects & Work</h3>
					<p className="mt-0.5 text-[11px] text-slate-500">Assign tasks to workers and track milestones</p>
				</Link>

				<Link
					href="/user-management"
					className="group rounded-2xl border border-[#d9e2ef] bg-gradient-to-br from-white to-[#f8faff] p-4 shadow-sm transition hover:border-[#6678c1] hover:shadow-md"
				>
					<div className="flex items-center justify-between">
						<span className="text-xl">👥</span>
						<span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">Team RBAC</span>
					</div>
					<h3 className="mt-2 text-sm font-bold text-slate-900 group-hover:text-[#404d85]">User Management</h3>
					<p className="mt-0.5 text-[11px] text-slate-500">Add employees, project managers, and assign roles</p>
				</Link>
			</div>

			{/* STORE & MARKETPLACE OVERVIEW */}
			<div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm space-y-4">
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
					<div>
						<div className="flex items-center gap-2">
							<h2 className="text-xl font-extrabold text-slate-900">Your Store & Marketplace Operations</h2>
							<span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider">
								Tenant Commerce Hub
							</span>
						</div>
						<p className="text-xs text-slate-500 mt-1">
							Manage your online product catalog, fulfill merchant orders, and coordinate supply chains.
						</p>
					</div>
					<Link
						href="/vendor-dashboard"
						className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#404d85] px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#2b345e] transition"
					>
						<span>Open Store Dashboard</span>
						<span>→</span>
					</Link>
				</div>

				<div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
					<Link
						href="/vendor-dashboard?view=catalog-products"
						className="flex flex-col p-4 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-white hover:border-[#6678c1] transition"
					>
						<span className="text-2xl mb-1">📦</span>
						<h3 className="text-xs font-bold text-slate-900">Products & Catalog</h3>
						<span className="text-[10px] text-slate-500 mt-0.5">Manage stock & prices</span>
					</Link>

					<Link
						href="/vendor-dashboard?view=orders-new"
						className="flex flex-col p-4 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-white hover:border-[#6678c1] transition"
					>
						<span className="text-2xl mb-1">📋</span>
						<h3 className="text-xs font-bold text-slate-900">Orders & Fulfillment</h3>
						<span className="text-[10px] text-slate-500 mt-0.5">Track shipment delivery</span>
					</Link>

					<Link
						href="/inventory"
						className="flex flex-col p-4 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-white hover:border-[#6678c1] transition"
					>
						<span className="text-2xl mb-1">🏭</span>
						<h3 className="text-xs font-bold text-slate-900">Inventory & POs</h3>
						<span className="text-[10px] text-slate-500 mt-0.5">Supply chain control</span>
					</Link>

					<Link
						href="/storefront"
						className="flex flex-col p-4 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-white hover:border-[#6678c1] transition"
					>
						<span className="text-2xl mb-1">🏬</span>
						<h3 className="text-xs font-bold text-slate-900">Live Marketplace</h3>
						<span className="text-[10px] text-slate-500 mt-0.5">Explore 3P catalog</span>
					</Link>
				</div>
			</div>
		</div>
	);

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
