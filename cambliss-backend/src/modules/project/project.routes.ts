import { Router } from "express";
import { RoleName } from "@prisma/client";
import { authenticateJWT, authorizeRoles } from "../../middleware/auth.middleware";
import { requireActiveSubscription } from "../../middleware/subscription.middleware";
import {
	addProjectMemberController,
	createProjectStatusUpdateController,
	createProjectController,
	createTaskController,
	deleteProjectController,
	deleteTaskController,
	getProjectsController,
	removeProjectMemberController,
	updateProjectController,
	updateTaskDetailsController,
	updateTaskStatusController,
} from "./project.controller";

const projectRouter = Router();

projectRouter.use(["/projects", "/tasks"], authenticateJWT, requireActiveSubscription);

projectRouter.get(
	"/projects",
	authorizeRoles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.PROJECT_MANAGER, RoleName.EMPLOYEE, RoleName.CLIENT),
	getProjectsController,
);

projectRouter.post(
	"/projects",
	authorizeRoles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.PROJECT_MANAGER),
	createProjectController,
);

projectRouter.put(
	"/projects/:id",
	authorizeRoles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.PROJECT_MANAGER),
	updateProjectController,
);

projectRouter.delete(
	"/projects/:id",
	authorizeRoles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.PROJECT_MANAGER),
	deleteProjectController,
);

projectRouter.post(
	"/projects/:id/members",
	authorizeRoles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.PROJECT_MANAGER),
	addProjectMemberController,
);

projectRouter.delete(
	"/projects/:id/members/:userId",
	authorizeRoles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.PROJECT_MANAGER),
	removeProjectMemberController,
);

projectRouter.post(
	"/projects/:id/tasks",
	authorizeRoles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.PROJECT_MANAGER),
	createTaskController,
);

projectRouter.post(
	"/projects/:id/status-updates",
	authorizeRoles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.PROJECT_MANAGER, RoleName.EMPLOYEE),
	createProjectStatusUpdateController,
);

projectRouter.put(
	"/tasks/:id",
	authorizeRoles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.PROJECT_MANAGER),
	updateTaskDetailsController,
);

projectRouter.put(
	"/tasks/:id/status",
	authorizeRoles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.PROJECT_MANAGER, RoleName.EMPLOYEE, RoleName.CLIENT),
	updateTaskStatusController,
);

projectRouter.delete(
	"/tasks/:id",
	authorizeRoles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.PROJECT_MANAGER),
	deleteTaskController,
);

export default projectRouter;
