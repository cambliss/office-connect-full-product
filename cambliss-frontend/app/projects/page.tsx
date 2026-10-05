"use client";

import { useEffect, useState, useMemo, FormEvent } from "react";
import WorkspaceShell from "../../components/WorkspaceShell";
import {
	Folder,
	Plus,
	CheckCircle2,
	Clock,
	AlertCircle,
	Users,
	Trash2,
	Edit3,
	ChevronRight,
	Calendar,
	Filter,
	Search,
	Kanban,
	List as ListIcon,
	Activity,
	UserPlus,
	Shield,
	Layers,
	CheckSquare,
	ArrowUpRight,
	Send,
} from "lucide-react";

type ProjectMember = {
	id: string;
	projectId: string;
	userId: string;
	user?: {
		id: string;
		email: string;
		firstName?: string | null;
		lastName?: string | null;
	};
};

type Task = {
	id: string;
	title: string;
	description?: string | null;
	status: string; // TODO, IN_PROGRESS, DONE
	priority: string; // LOW, MEDIUM, HIGH, URGENT
	dueDate?: string | null;
	assignedTo?: string | null;
	assignee?: {
		id: string;
		email: string;
		firstName?: string | null;
		lastName?: string | null;
	} | null;
	createdAt: string;
};

type Project = {
	id: string;
	name: string;
	description?: string | null;
	status: string;
	organizationId: string;
	createdAt: string;
	tasks: Task[];
	members: ProjectMember[];
};

type OrgUser = {
	id: string;
	email: string;
	firstName?: string | null;
	lastName?: string | null;
	role: string;
};

const getRoleFromToken = (token?: string | null): string => {
	if (!token) return "CLIENT";
	try {
		const payloadPart = token.split(".")[1];
		if (!payloadPart) return "CLIENT";
		const normalized = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
		const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
		const payload = JSON.parse(atob(padded)) as { role?: string; id?: string };
		return payload.role || "CLIENT";
	} catch {
		return "CLIENT";
	}
};

const getUserIdFromToken = (token?: string | null): string | null => {
	if (!token) return null;
	try {
		const payloadPart = token.split(".")[1];
		if (!payloadPart) return null;
		const normalized = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
		const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
		const payload = JSON.parse(atob(padded)) as { id?: string };
		return payload.id || null;
	} catch {
		return null;
	}
};

export default function ProjectsPage() {
	const [projects, setProjects] = useState<Project[]>([]);
	const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [activeTab, setActiveTab] = useState<"kanban" | "list" | "team" | "updates">("kanban");
	const [userRole, setUserRole] = useState<string>("CLIENT");
	const [currentUserId, setCurrentUserId] = useState<string | null>(null);
	const [orgUsers, setOrgUsers] = useState<OrgUser[]>([]);

	// Search & filters
	const [searchQuery, setSearchQuery] = useState("");
	const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
	const [onlyMyWork, setOnlyMyWork] = useState(false);

	// Modals
	const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
	const [newProjectName, setNewProjectName] = useState("");
	const [newProjectDesc, setNewProjectDesc] = useState("");

	const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
	const [taskTitle, setTaskTitle] = useState("");
	const [taskDescription, setTaskDescription] = useState("");
	const [taskPriority, setTaskPriority] = useState("MEDIUM");
	const [taskDueDate, setTaskDueDate] = useState("");
	const [taskAssignee, setTaskAssignee] = useState("");

	const [isStatusUpdateOpen, setIsStatusUpdateOpen] = useState(false);
	const [updateStatus, setUpdateStatus] = useState("ON_TRACK");
	const [updateNote, setUpdateNote] = useState("");

	const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
	const [selectedMemberUserId, setSelectedMemberUserId] = useState("");

	const isPMOrAdmin = useMemo(() => {
		return ["SUPER_ADMIN", "ADMIN", "PROJECT_MANAGER"].includes(userRole);
	}, [userRole]);

	const getAuthHeaders = (): Headers => {
		const headers = new Headers();
		const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
		if (token && token !== "cookie-session") {
			headers.set("Authorization", `Bearer ${token}`);
		}
		return headers;
	};

	const fetchProjects = async () => {
		try {
			setLoading(true);
			const res = await fetch("/api/projects", {
				headers: getAuthHeaders(),
				credentials: "include",
			});
			if (res.ok) {
				const data = (await res.json()) as Project[];
				setProjects(data);
				if (data.length > 0 && !selectedProjectId) {
					setSelectedProjectId(data[0].id);
				}
			}
		} catch (e) {
			console.error("Failed to load projects", e);
		} finally {
			setLoading(false);
		}
	};

	const fetchOrgUsers = async () => {
		try {
			const res = await fetch("/api/user-management/users", {
				headers: getAuthHeaders(),
				credentials: "include",
			});
			if (res.ok) {
				const data = (await res.json()) as OrgUser[];
				setOrgUsers(data);
			}
		} catch {
			// Fail silent for org users
		}
	};

	useEffect(() => {
		const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
		const role = getRoleFromToken(token);
		setUserRole(role);
		setCurrentUserId(getUserIdFromToken(token));

		void fetchProjects();
		void fetchOrgUsers();
	}, []);

	const currentProject = useMemo(() => {
		return projects.find((p) => p.id === selectedProjectId) || projects[0] || null;
	}, [projects, selectedProjectId]);

	// Current user assigned task metrics
	const myTasksCount = useMemo(() => {
		if (!currentProject?.tasks || !currentUserId) return 0;
		return currentProject.tasks.filter((t) => t.assignedTo === currentUserId).length;
	}, [currentProject, currentUserId]);

	const myPendingTasksCount = useMemo(() => {
		if (!currentProject?.tasks || !currentUserId) return 0;
		return currentProject.tasks.filter((t) => t.assignedTo === currentUserId && t.status !== "DONE").length;
	}, [currentProject, currentUserId]);

	// Filtered tasks
	const filteredTasks = useMemo(() => {
		if (!currentProject?.tasks) return [];
		return currentProject.tasks.filter((task) => {
			const matchesSearch =
				task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
				(task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));
			const matchesPriority = priorityFilter === "ALL" || task.priority === priorityFilter;
			const matchesMyWork = !onlyMyWork || task.assignedTo === currentUserId;
			return matchesSearch && matchesPriority && matchesMyWork;
		});
	}, [currentProject, searchQuery, priorityFilter, onlyMyWork, currentUserId]);

	// Task columns for Kanban
	const todoTasks = useMemo(
		() => filteredTasks.filter((t) => t.status.toUpperCase() === "TODO" || !["IN_PROGRESS", "DONE"].includes(t.status.toUpperCase())),
		[filteredTasks],
	);
	const inProgressTasks = useMemo(
		() => filteredTasks.filter((t) => t.status.toUpperCase() === "IN_PROGRESS"),
		[filteredTasks],
	);
	const doneTasks = useMemo(
		() => filteredTasks.filter((t) => t.status.toUpperCase() === "DONE"),
		[filteredTasks],
	);

	// Status updates extracted from tasks
	const statusUpdates = useMemo(() => {
		if (!currentProject?.tasks) return [];
		return currentProject.tasks
			.filter((t) => t.title.startsWith("Status: "))
			.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
	}, [currentProject]);

	// Handlers
	const handleCreateProject = async (e: FormEvent) => {
		e.preventDefault();
		if (!newProjectName.trim()) return;
		try {
			const headers = getAuthHeaders();
			headers.set("Content-Type", "application/json");
			const res = await fetch("/api/projects", {
				method: "POST",
				headers,
				credentials: "include",
				body: JSON.stringify({
					name: newProjectName.trim(),
					description: newProjectDesc.trim() || undefined,
				}),
			});
			if (res.ok) {
				const created = (await res.json()) as Project;
				setNewProjectName("");
				setNewProjectDesc("");
				setIsCreateProjectOpen(false);
				await fetchProjects();
				setSelectedProjectId(created.id);
			} else {
				const err = await res.json();
				alert(err.message || "Failed to create project");
			}
		} catch (error) {
			console.error("Error creating project", error);
		}
	};

	const handleDeleteProject = async (projectId: string) => {
		if (!window.confirm("Are you sure you want to delete this project and all its tasks?")) return;
		try {
			const res = await fetch(`/api/projects/${projectId}`, {
				method: "DELETE",
				headers: getAuthHeaders(),
				credentials: "include",
			});
			if (res.ok) {
				await fetchProjects();
				setSelectedProjectId(null);
			}
		} catch (error) {
			console.error("Error deleting project", error);
		}
	};

	const handleCreateTask = async (e: FormEvent) => {
		e.preventDefault();
		if (!currentProject || !taskTitle.trim()) return;
		try {
			const headers = getAuthHeaders();
			headers.set("Content-Type", "application/json");
			const res = await fetch(`/api/projects/${currentProject.id}/tasks`, {
				method: "POST",
				headers,
				credentials: "include",
				body: JSON.stringify({
					title: taskTitle.trim(),
					description: taskDescription.trim() || undefined,
					assignedTo: taskAssignee || undefined,
					dueDate: taskDueDate || undefined,
				}),
			});
			if (res.ok) {
				setTaskTitle("");
				setTaskDescription("");
				setTaskAssignee("");
				setTaskDueDate("");
				setIsCreateTaskOpen(false);
				await fetchProjects();
			} else {
				const err = await res.json();
				alert(err.message || "Failed to create task");
			}
		} catch (error) {
			console.error("Error creating task", error);
		}
	};

	const handleUpdateTaskStatus = async (taskId: string, newStatus: string) => {
		try {
			const headers = getAuthHeaders();
			headers.set("Content-Type", "application/json");
			const res = await fetch(`/api/tasks/${taskId}/status`, {
				method: "PUT",
				headers,
				credentials: "include",
				body: JSON.stringify({ status: newStatus }),
			});
			if (res.ok) {
				await fetchProjects();
			}
		} catch (error) {
			console.error("Error updating task status", error);
		}
	};

	const handleDeleteTask = async (taskId: string) => {
		if (!window.confirm("Delete this task?")) return;
		try {
			const res = await fetch(`/api/tasks/${taskId}`, {
				method: "DELETE",
				headers: getAuthHeaders(),
				credentials: "include",
			});
			if (res.ok) {
				await fetchProjects();
			}
		} catch (error) {
			console.error("Error deleting task", error);
		}
	};

	const handlePostStatusUpdate = async (e: FormEvent) => {
		e.preventDefault();
		if (!currentProject) return;
		try {
			const headers = getAuthHeaders();
			headers.set("Content-Type", "application/json");
			const res = await fetch(`/api/projects/${currentProject.id}/status-updates`, {
				method: "POST",
				headers,
				credentials: "include",
				body: JSON.stringify({
					status: updateStatus,
					note: updateNote.trim() || undefined,
				}),
			});
			if (res.ok) {
				setUpdateNote("");
				setIsStatusUpdateOpen(false);
				await fetchProjects();
			}
		} catch (error) {
			console.error("Error posting status update", error);
		}
	};

	const handleAddMember = async (e: FormEvent) => {
		e.preventDefault();
		if (!currentProject || !selectedMemberUserId) return;
		try {
			const headers = getAuthHeaders();
			headers.set("Content-Type", "application/json");
			const res = await fetch(`/api/projects/${currentProject.id}/members`, {
				method: "POST",
				headers,
				credentials: "include",
				body: JSON.stringify({ userId: selectedMemberUserId }),
			});
			if (res.ok) {
				setSelectedMemberUserId("");
				setIsAddMemberOpen(false);
				await fetchProjects();
			} else {
				const err = await res.json();
				alert(err.message || "Failed to add member");
			}
		} catch (error) {
			console.error("Error adding member", error);
		}
	};

	const handleRemoveMember = async (userId: string) => {
		if (!currentProject || !window.confirm("Remove this member from project?")) return;
		try {
			const res = await fetch(`/api/projects/${currentProject.id}/members/${userId}`, {
				method: "DELETE",
				headers: getAuthHeaders(),
				credentials: "include",
			});
			if (res.ok) {
				await fetchProjects();
			}
		} catch (error) {
			console.error("Error removing member", error);
		}
	};

	return (
		<WorkspaceShell>
			<div className="mx-auto max-w-7xl space-y-6 pb-16">
				{/* Top Hero Banner — Pastel Brand Gradient, Zero Dark Colors */}
				<div className="rounded-2xl border border-[#d9e2ef] bg-gradient-to-br from-[#eef2fa] via-white to-[#f0f4ff] p-7 shadow-sm">
					<div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
						<div>
							<div className="inline-flex items-center gap-2 rounded-full border border-[#6678c1]/25 bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-[#404d85] shadow-sm">
								<span className="h-2 w-2 rounded-full bg-emerald-400" />
								ROLE: {userRole} • Project Management Hub
							</div>
							<h1 className="mt-3 text-2xl font-bold tracking-tight text-[#404d85] sm:text-3xl">
								Project Management Workspace
							</h1>
							<p className="mt-1 text-sm text-[#5b6472]">
								Lead milestones, allocate cross-functional talent, monitor task velocity, and report deliverables.
							</p>
						</div>

						<div className="flex flex-wrap items-center gap-2.5">
							{isPMOrAdmin && (
								<>
									<button
										onClick={() => setIsCreateProjectOpen(true)}
										className="inline-flex items-center gap-2 rounded-xl bg-[#404d85] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#323d6b] active:scale-95"
									>
										<Plus className="h-4 w-4" />
										New Project
									</button>
									{currentProject && (
										<button
											onClick={() => setIsCreateTaskOpen(true)}
											className="inline-flex items-center gap-2 rounded-xl border border-[#6678c1]/35 bg-white px-4 py-2.5 text-sm font-bold text-[#404d85] shadow-sm transition hover:bg-[#eef2fa] active:scale-95"
										>
											<CheckSquare className="h-4 w-4 text-[#6678c1]" />
											New Task
										</button>
									)}
								</>
							)}
						</div>
					</div>
				</div>

				{/* Summary Metrics — Clean Pastel White Cards */}
				<div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
					<div className="rounded-2xl border border-[#d9e2ef] bg-white p-4 shadow-sm transition hover:border-[#6678c1]/40">
						<div className="flex items-center gap-2.5">
							<span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-[#6678c1]">
								<Folder className="h-4 w-4" />
							</span>
							<span className="text-xs font-semibold text-[#5b6472]">Total Projects</span>
						</div>
						<div className="mt-3 text-2xl font-bold text-[#404d85]">
							{projects.length}
						</div>
					</div>

					<div className="rounded-2xl border border-[#d9e2ef] bg-white p-4 shadow-sm transition hover:border-[#6678c1]/40">
						<div className="flex items-center gap-2.5">
							<span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
								<Clock className="h-4 w-4" />
							</span>
							<span className="text-xs font-semibold text-[#5b6472]">Active Tasks</span>
						</div>
						<div className="mt-3 text-2xl font-bold text-[#404d85]">
							{currentProject?.tasks.filter((t) => t.status !== "DONE").length ?? 0}
						</div>
					</div>

					<div className="rounded-2xl border border-[#d9e2ef] bg-white p-4 shadow-sm transition hover:border-[#6678c1]/40">
						<div className="flex items-center gap-2.5">
							<span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
								<CheckCircle2 className="h-4 w-4" />
							</span>
							<span className="text-xs font-semibold text-[#5b6472]">Done Tasks</span>
						</div>
						<div className="mt-3 text-2xl font-bold text-[#404d85]">
							{currentProject?.tasks.filter((t) => t.status === "DONE").length ?? 0}
						</div>
					</div>

					<div className="rounded-2xl border border-[#d9e2ef] bg-white p-4 shadow-sm transition hover:border-[#6678c1]/40">
						<div className="flex items-center gap-2.5">
							<span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
								<Users className="h-4 w-4" />
							</span>
							<span className="text-xs font-semibold text-[#5b6472]">Team Assigned</span>
						</div>
						<div className="mt-3 text-2xl font-bold text-[#404d85]">
							{currentProject?.members.length ?? 0}
						</div>
					</div>

					<div 
						onClick={() => setOnlyMyWork((prev) => !prev)}
						className={`rounded-2xl border p-4 shadow-sm cursor-pointer transition ${
							onlyMyWork 
								? "border-[#404d85] bg-[#eef2fa] ring-2 ring-[#6678c1]/30" 
								: "border-[#d9e2ef] bg-white hover:border-[#6678c1]/40"
						}`}
					>
						<div className="flex items-center justify-between text-xs font-semibold text-[#5b6472]">
							<div className="flex items-center gap-2">
								<span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-[#404d85]">
									<CheckSquare className="h-4 w-4" />
								</span>
								<span>My Work</span>
							</div>
							{onlyMyWork && (
								<span className="rounded bg-[#404d85] px-1.5 py-0.5 text-[9px] font-bold text-white">ACTIVE</span>
							)}
						</div>
						<div className="mt-3 text-2xl font-bold text-[#404d85]">
							{myTasksCount} <span className="text-xs font-normal text-[#5b6472]">({myPendingTasksCount} active)</span>
						</div>
					</div>
				</div>

				{/* Project Selector Bar — Clean Pastel White Card */}
				{projects.length > 0 ? (
					<div className="flex flex-col gap-4 rounded-2xl border border-[#d9e2ef] bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
						<div className="flex flex-wrap items-center gap-3">
							<span className="text-xs font-bold uppercase tracking-wider text-[#404d85]">Active Project:</span>
							<select
								value={currentProject?.id || ""}
								onChange={(e) => setSelectedProjectId(e.target.value)}
								className="rounded-xl border border-[#d9e2ef] bg-[#f8faff] px-3.5 py-2 text-sm font-semibold text-[#1f2430] shadow-sm focus:border-[#6678c1] focus:outline-none"
							>
								{projects.map((p) => (
									<option key={p.id} value={p.id}>
										{p.name} ({p.tasks.length} tasks)
									</option>
								))}
							</select>
							{currentProject?.status && (
								<span className="rounded-full border border-[#d9e2ef] bg-[#eef2fa] px-3 py-1 text-xs font-bold text-[#404d85]">
									{currentProject.status}
								</span>
							)}
						</div>

						{/* Action buttons on project */}
						<div className="flex flex-wrap items-center gap-2">
							{isPMOrAdmin && currentProject && (
								<>
									<button
										onClick={() => setIsStatusUpdateOpen(true)}
										className="inline-flex items-center gap-1.5 rounded-xl border border-[#d9e2ef] bg-white px-3.5 py-2 text-xs font-semibold text-[#404d85] shadow-sm transition hover:bg-[#eef2fa]"
									>
										<Activity className="h-3.5 w-3.5 text-emerald-600" />
										Post Progress Report
									</button>
									<button
										onClick={() => setIsAddMemberOpen(true)}
										className="inline-flex items-center gap-1.5 rounded-xl border border-[#d9e2ef] bg-white px-3.5 py-2 text-xs font-semibold text-[#404d85] shadow-sm transition hover:bg-[#eef2fa]"
									>
										<UserPlus className="h-3.5 w-3.5 text-[#6678c1]" />
										Assign Member
									</button>
									<button
										onClick={() => handleDeleteProject(currentProject.id)}
										className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
									>
										<Trash2 className="h-3.5 w-3.5" />
										Delete
									</button>
								</>
							)}
						</div>
					</div>
				) : (
					<div className="rounded-2xl border border-dashed border-[#d9e2ef] bg-white p-12 text-center shadow-sm">
						<Folder className="mx-auto h-12 w-12 text-[#6678c1]/60" />
						<h3 className="mt-3 text-lg font-bold text-[#404d85]">No Projects Found</h3>
						<p className="mt-1 text-sm text-[#5b6472]">
							{isPMOrAdmin
								? "Get started by initializing your organization's first project milestone."
								: "You have not been assigned to any projects yet."}
						</p>
						{isPMOrAdmin && (
							<button
								onClick={() => setIsCreateProjectOpen(true)}
								className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#404d85] px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#323d6b]"
							>
								<Plus className="h-4 w-4" />
								Create Project
							</button>
						)}
					</div>
				)}

				{/* Project Tabs & Controls */}
				{currentProject && (
					<>
						<div className="flex flex-col gap-4 border-b border-[#d9e2ef] pb-3 sm:flex-row sm:items-center sm:justify-between">
							<div className="flex flex-wrap items-center gap-2">
								<button
									onClick={() => setActiveTab("kanban")}
									className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-bold transition ${
										activeTab === "kanban"
											? "bg-[#404d85] text-white shadow-sm"
											: "text-[#5b6472] hover:bg-[#eef2fa] hover:text-[#404d85]"
									}`}
								>
									<Kanban className="h-4 w-4" />
									Board
								</button>
								<button
									onClick={() => setActiveTab("list")}
									className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-bold transition ${
										activeTab === "list"
											? "bg-[#404d85] text-white shadow-sm"
											: "text-[#5b6472] hover:bg-[#eef2fa] hover:text-[#404d85]"
									}`}
								>
									<ListIcon className="h-4 w-4" />
									Task List
								</button>
								<button
									onClick={() => setActiveTab("team")}
									className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-bold transition ${
										activeTab === "team"
											? "bg-[#404d85] text-white shadow-sm"
											: "text-[#5b6472] hover:bg-[#eef2fa] hover:text-[#404d85]"
									}`}
								>
									<Users className="h-4 w-4" />
									Team ({currentProject.members.length})
								</button>
								<button
									onClick={() => setActiveTab("updates")}
									className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-bold transition ${
										activeTab === "updates"
											? "bg-[#404d85] text-white shadow-sm"
											: "text-[#5b6472] hover:bg-[#eef2fa] hover:text-[#404d85]"
									}`}
								>
									<Activity className="h-4 w-4" />
									Progress Updates ({statusUpdates.length})
								</button>
							</div>

							{/* Search & Filter */}
							<div className="flex flex-wrap items-center gap-2">
								<button
									type="button"
									onClick={() => setOnlyMyWork((prev) => !prev)}
									className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
										onlyMyWork
											? "border-[#404d85] bg-[#404d85] text-white shadow-sm"
											: "border-[#d9e2ef] bg-white text-[#404d85] hover:bg-[#eef2fa]"
									}`}
								>
									<CheckSquare className={`h-3.5 w-3.5 ${onlyMyWork ? "text-white" : "text-[#404d85]"}`} />
									Assigned to Me ({myTasksCount})
								</button>
								<div className="relative">
									<Search className="absolute left-3 top-2.5 h-4 w-4 text-[#6678c1]/70" />
									<input
										type="text"
										value={searchQuery}
										onChange={(e) => setSearchQuery(e.target.value)}
										placeholder="Search tasks..."
										className="rounded-xl border border-[#d9e2ef] bg-white py-1.5 pl-9 pr-3 text-sm text-[#2d3748] placeholder-[#a0aec0] focus:border-[#404d85] focus:outline-none focus:ring-1 focus:ring-[#404d85]"
									/>
								</div>
								<select
									value={priorityFilter}
									onChange={(e) => setPriorityFilter(e.target.value)}
									className="rounded-xl border border-[#d9e2ef] bg-white px-3 py-1.5 text-sm text-[#2d3748] focus:border-[#404d85] focus:outline-none focus:ring-1 focus:ring-[#404d85]"
								>
									<option value="ALL">All Priorities</option>
									<option value="LOW">Low</option>
									<option value="MEDIUM">Medium</option>
									<option value="HIGH">High</option>
									<option value="URGENT">Urgent</option>
								</select>
							</div>
						</div>

						{/* TAB 1: KANBAN BOARD VIEW */}
						{activeTab === "kanban" && (
							<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
								{/* Column: To Do */}
								<div className="rounded-2xl border border-[#d9e2ef] bg-[#f8faff] p-4 shadow-sm">
									<div className="flex items-center justify-between border-b border-[#d9e2ef] pb-3">
										<div className="flex items-center gap-2">
											<span className="h-2.5 w-2.5 rounded-full bg-[#6678c1]" />
											<h4 className="text-sm font-bold text-[#404d85]">To Do</h4>
										</div>
										<span className="rounded-full bg-[#eef2fa] px-2.5 py-0.5 text-xs font-bold text-[#404d85] border border-[#d9e2ef]">
											{todoTasks.length}
										</span>
									</div>
									<div className="mt-4 space-y-3">
										{todoTasks.map((task) => (
											<div
												key={task.id}
												className="group rounded-xl border border-[#d9e2ef] bg-white p-4 shadow-sm transition hover:border-[#6678c1] hover:shadow-md"
											>
												<div className="flex items-start justify-between gap-2">
													<div className="flex flex-wrap items-center gap-1.5">
														<span
															className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
																task.priority === "URGENT"
																	? "bg-rose-50 text-rose-700 border border-rose-200"
																	: task.priority === "HIGH"
																		? "bg-amber-50 text-amber-700 border border-amber-200"
																		: "bg-[#eef2fa] text-[#404d85] border border-[#d9e2ef]"
															}`}
														>
															{task.priority || "NORMAL"}
														</span>
														{task.assignedTo === currentUserId && (
															<span className="rounded-md bg-[#eef2fa] px-2 py-0.5 text-[10px] font-bold text-[#404d85] border border-[#6678c1]/30">
																Assigned to You
															</span>
														)}
													</div>
													{isPMOrAdmin && (
														<button
															onClick={() => handleDeleteTask(task.id)}
															className="text-slate-400 opacity-0 transition hover:text-rose-600 group-hover:opacity-100"
															title="Delete Task"
														>
															<Trash2 className="h-3.5 w-3.5" />
														</button>
													)}
												</div>
												<h5 className="mt-2.5 text-sm font-semibold text-[#1e2540]">
													{task.title}
												</h5>
												{task.description && (
													<p className="mt-1 line-clamp-2 text-xs text-[#5b6472]">
														{task.description}
													</p>
												)}
												<div className="mt-4 flex items-center justify-between border-t border-[#edf2f7] pt-3 text-xs text-[#5b6472]">
													<div className="flex items-center gap-1.5">
														<span className="font-medium">{task.assignee?.email?.split("@")[0] || "Unassigned"}</span>
														{task.assignedTo === currentUserId && (
															<span className="text-[10px] font-bold text-[#404d85]">(You)</span>
														)}
													</div>
													<button
														onClick={() => handleUpdateTaskStatus(task.id, "IN_PROGRESS")}
														className="rounded-lg bg-[#eef2fa] px-2.5 py-1 text-xs font-semibold text-[#404d85] hover:bg-[#404d85] hover:text-white transition"
													>
														Start Work →
													</button>
												</div>
											</div>
										))}
										{todoTasks.length === 0 && (
											<p className="py-8 text-center text-xs text-[#5b6472]/70">No tasks in To Do</p>
										)}
									</div>
								</div>

								{/* Column: In Progress */}
								<div className="rounded-2xl border border-[#d9e2ef] bg-[#f8faff] p-4 shadow-sm">
									<div className="flex items-center justify-between border-b border-[#d9e2ef] pb-3">
										<div className="flex items-center gap-2">
											<span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
											<h4 className="text-sm font-bold text-[#404d85]">In Progress</h4>
										</div>
										<span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-800 border border-amber-200">
											{inProgressTasks.length}
										</span>
									</div>
									<div className="mt-4 space-y-3">
										{inProgressTasks.map((task) => (
											<div
												key={task.id}
												className="group rounded-xl border border-[#d9e2ef] bg-white p-4 shadow-sm transition hover:border-[#6678c1] hover:shadow-md"
											>
												<div className="flex items-start justify-between gap-2">
													<div className="flex flex-wrap items-center gap-1.5">
														<span
															className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
																task.priority === "URGENT"
																	? "bg-rose-50 text-rose-700 border border-rose-200"
																	: task.priority === "HIGH"
																		? "bg-amber-50 text-amber-700 border border-amber-200"
																		: "bg-[#eef2fa] text-[#404d85] border border-[#d9e2ef]"
															}`}
														>
															{task.priority || "NORMAL"}
														</span>
														{task.assignedTo === currentUserId && (
															<span className="rounded-md bg-[#eef2fa] px-2 py-0.5 text-[10px] font-bold text-[#404d85] border border-[#6678c1]/30">
																Assigned to You
															</span>
														)}
													</div>
													{isPMOrAdmin && (
														<button
															onClick={() => handleDeleteTask(task.id)}
															className="text-slate-400 opacity-0 transition hover:text-rose-600 group-hover:opacity-100"
															title="Delete Task"
														>
															<Trash2 className="h-3.5 w-3.5" />
														</button>
													)}
												</div>
												<h5 className="mt-2.5 text-sm font-semibold text-[#1e2540]">
													{task.title}
												</h5>
												{task.description && (
													<p className="mt-1 line-clamp-2 text-xs text-[#5b6472]">
														{task.description}
													</p>
												)}
												<div className="mt-4 flex items-center justify-between border-t border-[#edf2f7] pt-3 text-xs text-[#5b6472]">
													<div className="flex items-center gap-1.5">
														<span className="font-medium">{task.assignee?.email?.split("@")[0] || "Unassigned"}</span>
														{task.assignedTo === currentUserId && (
															<span className="text-[10px] font-bold text-[#404d85]">(You)</span>
														)}
													</div>
													<div className="flex items-center gap-1.5">
														<button
															onClick={() => handleUpdateTaskStatus(task.id, "TODO")}
															className="rounded-lg px-2.5 py-1 text-xs text-[#5b6472] hover:bg-[#eef2fa] hover:text-[#404d85] transition"
															title="Move back to To Do"
														>
															← To Do
														</button>
														<button
															onClick={() => handleUpdateTaskStatus(task.id, "DONE")}
															className="rounded-lg bg-[#404d85] px-2.5 py-1 text-xs font-semibold text-white hover:bg-[#323d6b] shadow-sm transition"
														>
															Complete ✓
														</button>
													</div>
												</div>
											</div>
										))}
										{inProgressTasks.length === 0 && (
											<p className="py-8 text-center text-xs text-[#5b6472]/70">No tasks in progress</p>
										)}
									</div>
								</div>

								{/* Column: Done */}
								<div className="rounded-2xl border border-[#d9e2ef] bg-[#f8faff] p-4 shadow-sm">
									<div className="flex items-center justify-between border-b border-[#d9e2ef] pb-3">
										<div className="flex items-center gap-2">
											<span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
											<h4 className="text-sm font-bold text-[#404d85]">Done</h4>
										</div>
										<span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800 border border-emerald-200">
											{doneTasks.length}
										</span>
									</div>
									<div className="mt-4 space-y-3">
										{doneTasks.map((task) => (
											<div
												key={task.id}
												className="group rounded-xl border border-[#d9e2ef] bg-white/80 p-4 opacity-90 shadow-sm transition hover:opacity-100 hover:border-[#6678c1]"
											>
												<div className="flex items-start justify-between gap-2">
													<span className="rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
														DONE
													</span>
													{isPMOrAdmin && (
														<button
															onClick={() => handleDeleteTask(task.id)}
															className="text-slate-400 opacity-0 transition hover:text-rose-600 group-hover:opacity-100"
															title="Delete Task"
														>
															<Trash2 className="h-3.5 w-3.5" />
														</button>
													)}
												</div>
												<h5 className="mt-2.5 text-sm font-medium line-through text-slate-500">
													{task.title}
												</h5>
												<div className="mt-4 flex items-center justify-between border-t border-[#edf2f7] pt-3 text-xs text-[#5b6472]">
													<span>{task.assignee?.email?.split("@")[0] || "Completed"}</span>
													<button
														onClick={() => handleUpdateTaskStatus(task.id, "IN_PROGRESS")}
														className="text-xs font-semibold text-[#6678c1] hover:text-[#404d85]"
													>
														Reopen ↩
													</button>
												</div>
											</div>
										))}
										{doneTasks.length === 0 && (
											<p className="py-8 text-center text-xs text-[#5b6472]/70">No completed tasks yet</p>
										)}
									</div>
								</div>
							</div>
						)}

						{/* TAB 2: LIST VIEW */}
						{activeTab === "list" && (
							<div className="overflow-hidden rounded-2xl border border-[#d9e2ef] bg-white shadow-sm">
								<table className="min-w-full divide-y divide-[#d9e2ef]">
									<thead className="bg-[#f8faff]">
										<tr>
											<th className="px-4 py-3 text-left text-xs font-bold text-[#404d85] uppercase tracking-wider">Task Title</th>
											<th className="px-4 py-3 text-left text-xs font-bold text-[#404d85] uppercase tracking-wider">Status</th>
											<th className="px-4 py-3 text-left text-xs font-bold text-[#404d85] uppercase tracking-wider">Priority</th>
											<th className="px-4 py-3 text-left text-xs font-bold text-[#404d85] uppercase tracking-wider">Assignee</th>
											<th className="px-4 py-3 text-left text-xs font-bold text-[#404d85] uppercase tracking-wider">Due Date</th>
											<th className="px-4 py-3 text-right text-xs font-bold text-[#404d85] uppercase tracking-wider">Actions</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-[#d9e2ef]">
										{filteredTasks.map((t) => (
											<tr key={t.id} className={`hover:bg-[#f8faff] transition ${t.assignedTo === currentUserId ? "bg-[#eef2fa]/50" : ""}`}>
												<td className="px-4 py-3 text-sm font-semibold text-[#1e2540]">
													<div className="flex items-center gap-2">
														<span>{t.title}</span>
														{t.assignedTo === currentUserId && (
															<span className="rounded-md bg-[#eef2fa] px-1.5 py-0.5 text-[10px] font-bold text-[#404d85] border border-[#6678c1]/30">
																You
															</span>
														)}
													</div>
												</td>
												<td className="px-4 py-3 text-xs">
													<select
														value={t.status}
														onChange={(e) => handleUpdateTaskStatus(t.id, e.target.value)}
														className="rounded-lg border border-[#d9e2ef] bg-white px-2 py-1 text-xs font-medium text-[#404d85] focus:border-[#404d85] focus:outline-none"
													>
														<option value="TODO">To Do</option>
														<option value="IN_PROGRESS">In Progress</option>
														<option value="DONE">Done</option>
													</select>
												</td>
												<td className="px-4 py-3 text-xs font-semibold">
													<span
														className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
															t.priority === "URGENT"
																? "bg-rose-50 text-rose-700 border border-rose-200"
																: t.priority === "HIGH"
																	? "bg-amber-50 text-amber-700 border border-amber-200"
																	: "bg-[#eef2fa] text-[#404d85] border border-[#d9e2ef]"
														}`}
													>
														{t.priority}
													</span>
												</td>
												<td className="px-4 py-3 text-xs text-[#5b6472]">
													{t.assignee?.email || "Unassigned"}
												</td>
												<td className="px-4 py-3 text-xs text-[#5b6472]">
													{t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "-"}
												</td>
												<td className="px-4 py-3 text-right text-xs">
													{isPMOrAdmin && (
														<button
															onClick={() => handleDeleteTask(t.id)}
															className="text-slate-400 hover:text-rose-600 transition"
															title="Delete Task"
														>
															<Trash2 className="h-4 w-4" />
														</button>
													)}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						)}

						{/* TAB 3: TEAM MEMBERS VIEW */}
						{activeTab === "team" && (
							<div className="space-y-4">
								<div className="flex items-center justify-between">
									<h4 className="text-base font-bold text-[#404d85]">
										Allocated Team & Resource Distribution
									</h4>
									{isPMOrAdmin && (
										<button
											onClick={() => setIsAddMemberOpen(true)}
											className="inline-flex items-center gap-1.5 rounded-xl bg-[#404d85] px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#323d6b] transition"
										>
											<UserPlus className="h-3.5 w-3.5" />
											Add Project Member
										</button>
									)}
								</div>

								<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
									{currentProject.members.map((member) => (
										<div
											key={member.id}
											className="flex items-center justify-between rounded-xl border border-[#d9e2ef] bg-white p-4 shadow-sm hover:border-[#6678c1] transition"
										>
											<div className="flex items-center gap-3">
												<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef2fa] text-sm font-bold text-[#404d85] border border-[#d9e2ef]">
													{member.user?.email?.[0]?.toUpperCase() || "U"}
												</div>
												<div>
													<div className="text-sm font-bold text-[#1e2540]">
														{member.user?.firstName
															? `${member.user.firstName} ${member.user.lastName || ""}`
															: member.user?.email}
													</div>
													<div className="text-xs text-[#5b6472]">{member.user?.email}</div>
												</div>
											</div>
											{isPMOrAdmin && (
												<button
													onClick={() => handleRemoveMember(member.userId)}
													className="rounded p-1 text-slate-400 hover:text-rose-600 transition"
													title="Remove Member"
												>
													<Trash2 className="h-4 w-4" />
												</button>
											)}
										</div>
									))}
								</div>
							</div>
						)}

						{/* TAB 4: PROGRESS UPDATES & ACTIVITY LOG */}
						{activeTab === "updates" && (
							<div className="space-y-4">
								<div className="flex items-center justify-between">
									<h4 className="text-base font-bold text-[#404d85]">
										Stakeholder Status Reports & Audit Log
									</h4>
									{isPMOrAdmin && (
										<button
											onClick={() => setIsStatusUpdateOpen(true)}
											className="inline-flex items-center gap-1.5 rounded-xl bg-[#404d85] px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#323d6b] transition"
										>
											<Send className="h-3.5 w-3.5" />
											Post New Report
										</button>
									)}
								</div>

								<div className="space-y-3">
									{statusUpdates.map((update) => (
										<div
											key={update.id}
											className="rounded-xl border border-[#d9e2ef] bg-white p-4 shadow-sm"
										>
											<div className="flex items-center justify-between">
												<span className="flex items-center gap-2 font-bold text-[#404d85]">
													<Activity className="h-4 w-4 text-[#6678c1]" />
													{update.title}
												</span>
												<span className="text-xs text-[#5b6472]">
													{new Date(update.createdAt).toLocaleString()}
												</span>
											</div>
											{update.description && (
												<p className="mt-2 text-sm text-[#5b6472]">
													{update.description}
												</p>
											)}
										</div>
									))}
									{statusUpdates.length === 0 && (
										<p className="py-8 text-center text-sm text-[#5b6472]/70">
											No status updates logged yet. Use &ldquo;Post New Report&rdquo; to record progress.
										</p>
									)}
								</div>
							</div>
						)}
					</>
				)}

				{/* MODAL: CREATE PROJECT */}
				{isCreateProjectOpen && (
					<div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1e2540]/50 p-4 backdrop-blur-sm">
						<div className="w-full max-w-md rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-2xl">
							<h3 className="text-lg font-bold text-[#404d85]">Create New Project</h3>
							<p className="text-xs text-[#5b6472]">Initiate a milestone sprint for your organization.</p>
							<form onSubmit={handleCreateProject} className="mt-4 space-y-4">
								<div>
									<label className="text-xs font-bold text-[#404d85]">Project Name *</label>
									<input
										type="text"
										required
										value={newProjectName}
										onChange={(e) => setNewProjectName(e.target.value)}
										placeholder="e.g. Q4 Platform Optimization"
										className="mt-1 w-full rounded-xl border border-[#d9e2ef] bg-white p-2.5 text-sm text-[#2d3748] placeholder-[#a0aec0] focus:border-[#404d85] focus:outline-none focus:ring-1 focus:ring-[#404d85]"
									/>
								</div>
								<div>
									<label className="text-xs font-bold text-[#404d85]">Description</label>
									<textarea
										rows={3}
										value={newProjectDesc}
										onChange={(e) => setNewProjectDesc(e.target.value)}
										placeholder="Project objectives, scope, and deliverables..."
										className="mt-1 w-full rounded-xl border border-[#d9e2ef] bg-white p-2.5 text-sm text-[#2d3748] placeholder-[#a0aec0] focus:border-[#404d85] focus:outline-none focus:ring-1 focus:ring-[#404d85]"
									/>
								</div>
								<div className="flex justify-end gap-2 pt-2">
									<button
										type="button"
										onClick={() => setIsCreateProjectOpen(false)}
										className="rounded-xl px-4 py-2 text-sm font-medium text-[#5b6472] hover:bg-[#eef2fa] hover:text-[#404d85] transition"
									>
										Cancel
									</button>
									<button
										type="submit"
										className="rounded-xl bg-[#404d85] px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-[#323d6b] transition"
									>
										Create Project
									</button>
								</div>
							</form>
						</div>
					</div>
				)}

				{/* MODAL: CREATE TASK */}
				{isCreateTaskOpen && (
					<div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1e2540]/50 p-4 backdrop-blur-sm">
						<div className="w-full max-w-md rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-2xl">
							<h3 className="text-lg font-bold text-[#404d85]">Create Task</h3>
							<p className="text-xs text-[#5b6472]">Add an actionable deliverable to {currentProject?.name}.</p>
							<form onSubmit={handleCreateTask} className="mt-4 space-y-4">
								<div>
									<label className="text-xs font-bold text-[#404d85]">Task Title *</label>
									<input
										type="text"
										required
										value={taskTitle}
										onChange={(e) => setTaskTitle(e.target.value)}
										placeholder="e.g. Implement OAuth Flow"
										className="mt-1 w-full rounded-xl border border-[#d9e2ef] bg-white p-2.5 text-sm text-[#2d3748] placeholder-[#a0aec0] focus:border-[#404d85] focus:outline-none focus:ring-1 focus:ring-[#404d85]"
									/>
								</div>
								<div>
									<label className="text-xs font-bold text-[#404d85]">Description</label>
									<textarea
										rows={2}
										value={taskDescription}
										onChange={(e) => setTaskDescription(e.target.value)}
										placeholder="Details and acceptance criteria..."
										className="mt-1 w-full rounded-xl border border-[#d9e2ef] bg-white p-2.5 text-sm text-[#2d3748] placeholder-[#a0aec0] focus:border-[#404d85] focus:outline-none focus:ring-1 focus:ring-[#404d85]"
									/>
								</div>
								<div className="grid grid-cols-2 gap-3">
									<div>
										<label className="text-xs font-bold text-[#404d85]">Priority</label>
										<select
											value={taskPriority}
											onChange={(e) => setTaskPriority(e.target.value)}
											className="mt-1 w-full rounded-xl border border-[#d9e2ef] bg-white p-2 text-sm text-[#2d3748] focus:border-[#404d85] focus:outline-none focus:ring-1 focus:ring-[#404d85]"
										>
											<option value="LOW">Low</option>
											<option value="MEDIUM">Medium</option>
											<option value="HIGH">High</option>
											<option value="URGENT">Urgent</option>
										</select>
									</div>
									<div>
										<label className="text-xs font-bold text-[#404d85]">Due Date</label>
										<input
											type="date"
											value={taskDueDate}
											onChange={(e) => setTaskDueDate(e.target.value)}
											className="mt-1 w-full rounded-xl border border-[#d9e2ef] bg-white p-2 text-sm text-[#2d3748] focus:border-[#404d85] focus:outline-none focus:ring-1 focus:ring-[#404d85]"
										/>
									</div>
								</div>
								<div>
									<label className="text-xs font-bold text-[#404d85]">Assign To</label>
									<select
										value={taskAssignee}
										onChange={(e) => setTaskAssignee(e.target.value)}
										className="mt-1 w-full rounded-xl border border-[#d9e2ef] bg-white p-2 text-sm text-[#2d3748] focus:border-[#404d85] focus:outline-none focus:ring-1 focus:ring-[#404d85]"
									>
										<option value="">-- Unassigned --</option>
										{currentProject?.members.map((m) => (
											<option key={m.userId} value={m.userId}>
												{m.user?.email || m.userId}
											</option>
										))}
									</select>
								</div>
								<div className="flex justify-end gap-2 pt-2">
									<button
										type="button"
										onClick={() => setIsCreateTaskOpen(false)}
										className="rounded-xl px-4 py-2 text-sm font-medium text-[#5b6472] hover:bg-[#eef2fa] hover:text-[#404d85] transition"
									>
										Cancel
									</button>
									<button
										type="submit"
										className="rounded-xl bg-[#404d85] px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-[#323d6b] transition"
									>
										Save Task
									</button>
								</div>
							</form>
						</div>
					</div>
				)}

				{/* MODAL: POST PROGRESS UPDATE */}
				{isStatusUpdateOpen && (
					<div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1e2540]/50 p-4 backdrop-blur-sm">
						<div className="w-full max-w-md rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-2xl">
							<h3 className="text-lg font-bold text-[#404d85]">Post Milestone Status Report</h3>
							<p className="text-xs text-[#5b6472]">Notify stakeholders of sprint health and deliverables.</p>
							<form onSubmit={handlePostStatusUpdate} className="mt-4 space-y-4">
								<div>
									<label className="text-xs font-bold text-[#404d85]">Status Indicator</label>
									<select
										value={updateStatus}
										onChange={(e) => setUpdateStatus(e.target.value)}
										className="mt-1 w-full rounded-xl border border-[#d9e2ef] bg-white p-2.5 text-sm text-[#2d3748] focus:border-[#404d85] focus:outline-none focus:ring-1 focus:ring-[#404d85]"
									>
										<option value="ON_TRACK">🟢 On Track - All Deliverables Normal</option>
										<option value="AT_RISK">🟡 At Risk - Attention Needed</option>
										<option value="DELAYED">🔴 Delayed - Critical Path Blockers</option>
										<option value="COMPLETED">✅ Completed - Milestone Signed Off</option>
									</select>
								</div>
								<div>
									<label className="text-xs font-bold text-[#404d85]">Executive Summary & Notes</label>
									<textarea
										rows={3}
										value={updateNote}
										onChange={(e) => setUpdateNote(e.target.value)}
										placeholder="Summary of completed items, upcoming deadlines, blockers..."
										className="mt-1 w-full rounded-xl border border-[#d9e2ef] bg-white p-2.5 text-sm text-[#2d3748] placeholder-[#a0aec0] focus:border-[#404d85] focus:outline-none focus:ring-1 focus:ring-[#404d85]"
									/>
								</div>
								<div className="flex justify-end gap-2 pt-2">
									<button
										type="button"
										onClick={() => setIsStatusUpdateOpen(false)}
										className="rounded-xl px-4 py-2 text-sm font-medium text-[#5b6472] hover:bg-[#eef2fa] hover:text-[#404d85] transition"
									>
										Cancel
									</button>
									<button
										type="submit"
										className="rounded-xl bg-[#404d85] px-4 py-2 text-sm font-bold text-white hover:bg-[#323d6b] shadow-sm transition"
									>
										Publish Report
									</button>
								</div>
							</form>
						</div>
					</div>
				)}

				{/* MODAL: ADD MEMBER */}
				{isAddMemberOpen && (
					<div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1e2540]/50 p-4 backdrop-blur-sm">
						<div className="w-full max-w-md rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-2xl">
							<h3 className="text-lg font-bold text-[#404d85]">Assign Member to Project</h3>
							<p className="text-xs text-[#5b6472]">Pick an organization user to collaborate on this project.</p>
							<form onSubmit={handleAddMember} className="mt-4 space-y-4">
								<div>
									<label className="text-xs font-bold text-[#404d85]">Select User</label>
									<select
										required
										value={selectedMemberUserId}
										onChange={(e) => setSelectedMemberUserId(e.target.value)}
										className="mt-1 w-full rounded-xl border border-[#d9e2ef] bg-white p-2.5 text-sm text-[#2d3748] focus:border-[#404d85] focus:outline-none focus:ring-1 focus:ring-[#404d85]"
									>
										<option value="">-- Choose User --</option>
										{orgUsers
											.filter((u) => !currentProject?.members.some((m) => m.userId === u.id))
											.map((u) => (
												<option key={u.id} value={u.id}>
													{u.email} ({u.role})
												</option>
											))}
									</select>
								</div>
								<div className="flex justify-end gap-2 pt-2">
									<button
										type="button"
										onClick={() => setIsAddMemberOpen(false)}
										className="rounded-xl px-4 py-2 text-sm font-medium text-[#5b6472] hover:bg-[#eef2fa] hover:text-[#404d85] transition"
									>
										Cancel
									</button>
									<button
										type="submit"
										className="rounded-xl bg-[#404d85] px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-[#323d6b] transition"
									>
										Add to Project
									</button>
								</div>
							</form>
						</div>
					</div>
				)}
			</div>
		</WorkspaceShell>
	);
}
