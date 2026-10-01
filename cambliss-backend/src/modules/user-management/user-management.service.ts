import bcrypt from "bcryptjs";
import prisma from "../../config/prisma";
import { RoleName } from "@prisma/client";

export class UserManagementError extends Error {
	statusCode: number;

	constructor(statusCode: number, message: string) {
		super(message);
		this.statusCode = statusCode;
		this.name = "UserManagementError";
	}
}

export const ACCESS_KEYS = [
	"CRM",
	"HRM",
	"INVENTORY",
	"FILE_SHARING",
	"USER_MANAGEMENT",
	"STORE",
	"VIDEO_CONNECT",
	"PROJECTS",
] as const;

export type AccessKey = (typeof ACCESS_KEYS)[number];

const ensureAccessProfileTable = async (): Promise<void> => {
	try {
		await prisma.$executeRawUnsafe(`
			CREATE TABLE IF NOT EXISTS "UserAccessProfile" (
				"userId" TEXT PRIMARY KEY REFERENCES "User"("id") ON DELETE CASCADE,
				"organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
				"phone" TEXT,
				"department" TEXT,
				"accesses" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
				"createdBy" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
				"createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
				"updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
			);
		`);

		await prisma.$executeRawUnsafe(`
			ALTER TABLE "UserAccessProfile" 
			ADD COLUMN IF NOT EXISTS "department" TEXT;
		`);

		await prisma.$executeRawUnsafe(`
			CREATE INDEX IF NOT EXISTS "UserAccessProfile_org_idx"
			ON "UserAccessProfile"("organizationId");
		`);
	} catch {
		// Ignore table/index concurrency notices
	}
};

const normalizeAccesses = (accesses: unknown): AccessKey[] => {
	if (!Array.isArray(accesses)) {
		return [];
	}

	const filtered = accesses
		.map((item) => String(item).trim().toUpperCase())
		.filter((item): item is AccessKey => ACCESS_KEYS.includes(item as AccessKey));

	return [...new Set(filtered)];
};

const resolveRole = async (role: RoleName) => {
	const existing = await prisma.role.findUnique({ where: { name: role } });
	if (existing) {
		return existing;
	}
	return prisma.role.create({ data: { name: role } });
};

const ensureOrganizationMembership = async (organizationId: string, userId: string): Promise<string> => {
	console.log(`[USER-MGMT ENSURE-START] incoming orgId: ${organizationId}, userId: ${userId}`);
	const user = await prisma.user.findUnique({
		where: { id: userId },
		include: {
			memberships: {
				include: { role: true },
			},
		},
	});

	if (!user) {
		console.log(`[USER-MGMT ENSURE-FAIL] User not found: ${userId}`);
		throw new UserManagementError(401, "User not found");
	}

	const isSuperAdmin = Boolean(
		user.isPlatformUser ||
		user.memberships.some((m) => m.role?.name === "SUPER_ADMIN")
	);

	// Get user's actual database organization (or first membership org)
	const primaryOrgId = user.organizationId || user.memberships[0]?.organizationId;

	// Check if user has active membership in the requested organizationId
	const hasMembershipInRequestedOrg = user.memberships.some(
		(m) => m.organizationId === organizationId
	);

	let effectiveOrgId = organizationId;

	// If incoming organizationId is "platform", invalid, or not in user's memberships, resolve to user's real organization!
	if (!hasMembershipInRequestedOrg || effectiveOrgId === "platform" || !effectiveOrgId) {
		if (primaryOrgId) {
			effectiveOrgId = primaryOrgId;
		} else if (isSuperAdmin) {
			const fallbackOrg = await prisma.organization.findFirst({
				orderBy: { createdAt: "asc" },
			});
			if (fallbackOrg) {
				effectiveOrgId = fallbackOrg.id;
			}
		}
	}

	console.log(`[USER-MGMT ENSURE-RESOLVED] effectiveOrgId: ${effectiveOrgId}, primaryOrgId: ${primaryOrgId}, isSuperAdmin: ${isSuperAdmin}, hasMembershipInRequestedOrg: ${hasMembershipInRequestedOrg}`);

	if (!effectiveOrgId) {
		console.log(`[USER-MGMT ENSURE-FAIL] User is not linked to any organization`);
		throw new UserManagementError(403, "User is not linked to any organization");
	}

	if (isSuperAdmin) {
		return effectiveOrgId;
	}

	// Double-check membership in effectiveOrgId
	const membership = await prisma.organizationUser.findUnique({
		where: {
			organizationId_userId: {
				organizationId: effectiveOrgId,
				userId,
			},
		},
		select: { id: true },
	});

	if (!membership) {
		if (user.organizationId === effectiveOrgId) {
			return effectiveOrgId;
		}
		console.log(`[USER-MGMT ENSURE-FAIL] You are not a member of this organization: ${effectiveOrgId}`);
		throw new UserManagementError(403, "You are not a member of this organization");
	}

	return effectiveOrgId;
};

const randomPassword = (): string => {
	const seed = Math.random().toString(36).slice(-6);
	return `Cambliss@${seed}`;
};

export const listOrganizationUsers = async (organizationId: string, requesterId: string) => {
	const effectiveOrgId = await ensureOrganizationMembership(organizationId, requesterId);
	await ensureAccessProfileTable();

	const rows = await prisma.$queryRawUnsafe<Array<{
		id: string;
		email: string;
		firstName: string | null;
		lastName: string | null;
		role: RoleName;
		phone: string | null;
		department: string | null;
		accesses: string[] | null;
		createdAt: Date;
	}>>(
		`
		SELECT
			u."id" AS "id",
			u."email" AS "email",
			u."firstName" AS "firstName",
			u."lastName" AS "lastName",
			r."name" AS "role",
			ap."phone" AS "phone",
			ap."department" AS "department",
			ap."accesses" AS "accesses",
			ou."createdAt" AS "createdAt"
		FROM "OrganizationUser" ou
		JOIN "User" u ON u."id" = ou."userId"
		JOIN "Role" r ON r."id" = ou."roleId"
		LEFT JOIN "UserAccessProfile" ap ON ap."userId" = u."id"
		WHERE ou."organizationId" = $1
		  AND u."id" <> $2
		ORDER BY ou."createdAt" ASC
		`,
		effectiveOrgId,
		requesterId,
	);

	return rows.map((row) => ({
		id: row.id,
		email: row.email,
		firstName: row.firstName,
		lastName: row.lastName,
		role: row.role,
		phone: row.phone,
		department: row.department,
		accesses: normalizeAccesses(row.accesses || []),
		createdAt: row.createdAt,
	}));
};

export const createOrganizationUser = async (
	organizationId: string,
	requesterId: string,
	input: {
		firstName?: string;
		lastName?: string;
		email: string;
		phone?: string;
		department?: string;
		role: RoleName;
		accesses?: string[];
	},
) => {
	const effectiveOrgId = await ensureOrganizationMembership(organizationId, requesterId);
	await ensureAccessProfileTable();


	const email = input.email?.trim().toLowerCase();
	if (!email) {
		throw new UserManagementError(400, "email is required");
	}

	const allowedRoles: RoleName[] = [RoleName.ADMIN, RoleName.CLIENT, RoleName.EMPLOYEE, RoleName.PROJECT_MANAGER];
	if (!allowedRoles.includes(input.role)) {
		throw new UserManagementError(400, "role must be ADMIN, CLIENT, EMPLOYEE, or PROJECT_MANAGER");
	}

	const existing = await prisma.user.findUnique({
		where: { email },
		select: { id: true },
	});
	if (existing) {
		throw new UserManagementError(409, "User with this email already exists");
	}

	const roleRecord = await resolveRole(input.role);
	const accesses = normalizeAccesses(input.accesses || []);
	const tempPassword = randomPassword();
	const passwordHash = await bcrypt.hash(tempPassword, 10);

	const created = await prisma.$transaction(async (tx) => {
		const user = await tx.user.create({
			data: {
				email,
				passwordHash,
				organizationId: effectiveOrgId,
			},
			select: {
				id: true,
				email: true,
				createdAt: true,
			},
		});

		await tx.organizationUser.create({
			data: {
				organizationId: effectiveOrgId,
				userId: user.id,
				roleId: roleRecord.id,
			},
		});

		await tx.$executeRawUnsafe(
			`
			INSERT INTO "UserAccessProfile" ("userId", "organizationId", "phone", "department", "accesses", "createdBy", "createdAt", "updatedAt")
			VALUES ($1, $2, $3, $4, $5::TEXT[], $6, NOW(), NOW())
			`,
			user.id,
			effectiveOrgId,
			input.phone?.trim() || null,
			input.department?.trim() || null,
			accesses,
			requesterId,
		);

		return user;
	});

	return {
		user: {
			id: created.id,
			email: created.email,
			role: input.role,
			phone: input.phone?.trim() || null,
			department: input.department?.trim() || null,
			accesses,
			createdAt: created.createdAt,
		},
		tempPassword,
	};
};

export const updateOrganizationUserAccess = async (
	organizationId: string,
	requesterId: string,
	userId: string,
	input: {
		phone?: string;
		department?: string;
		role?: RoleName;
		accesses?: string[];
	},
) => {
	const effectiveOrgId = await ensureOrganizationMembership(organizationId, requesterId);
	await ensureAccessProfileTable();

	const membership = await prisma.organizationUser.findUnique({
		where: {
			organizationId_userId: {
				organizationId: effectiveOrgId,
				userId,
			},
		},
		select: { id: true },
	});
	if (!membership) {
		throw new UserManagementError(404, "User not found in organization");
	}

	const accesses = normalizeAccesses(input.accesses || []);
	const phone = input.phone?.trim() || null;
	const department = input.department?.trim() || null;

	if (input.role) {
		const roleRecord = await resolveRole(input.role);
		await prisma.organizationUser.update({
			where: {
				organizationId_userId: {
					organizationId: effectiveOrgId,
					userId,
				},
			},
			data: { roleId: roleRecord.id },
		});
	}

	await prisma.$executeRawUnsafe(
		`
		INSERT INTO "UserAccessProfile" ("userId", "organizationId", "phone", "department", "accesses", "createdBy", "createdAt", "updatedAt")
		VALUES ($1, $2, $3, $4, $5::TEXT[], $6, NOW(), NOW())
		ON CONFLICT ("userId")
		DO UPDATE SET
			"phone" = EXCLUDED."phone",
			"department" = EXCLUDED."department",
			"accesses" = EXCLUDED."accesses",
			"updatedAt" = NOW()
		`,
		userId,
		effectiveOrgId,
		phone,
		department,
		accesses,
		requesterId,
	);

	return { message: "User access updated" };
};

export const getMyAccess = async (organizationId: string, userId: string) => {
	await ensureAccessProfileTable();
	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: { organizationId: true, isPlatformUser: true },
	});

	let effectiveOrgId = organizationId;
	if (effectiveOrgId === "platform" || !effectiveOrgId) {
		effectiveOrgId = user?.organizationId || "";
	}

	const rows = await prisma.$queryRawUnsafe<Array<{ phone: string | null; department: string | null; accesses: string[] | null }>>(
		`SELECT "phone", "department", "accesses" FROM "UserAccessProfile" WHERE ("organizationId" = $1 OR "userId" = $2) AND "userId" = $2 LIMIT 1`,
		effectiveOrgId,
		userId,
	);

	const row = rows[0];
	return {
		phone: row?.phone ?? null,
		department: row?.department ?? null,
		accesses: normalizeAccesses(row?.accesses || []),
	};
};

export const deactivateOrganizationUser = async (organizationId: string, requesterId: string, userId: string) => {
	const effectiveOrgId = await ensureOrganizationMembership(organizationId, requesterId);
	await ensureAccessProfileTable();

	if (requesterId === userId) {
		throw new UserManagementError(400, "You cannot deactivate your own account");
	}

	const membership = await prisma.organizationUser.findUnique({
		where: {
			organizationId_userId: {
				organizationId: effectiveOrgId,
				userId,
			},
		},
		select: { id: true },
	});

	if (!membership) {
		throw new UserManagementError(404, "User not found in organization");
	}

	await prisma.$transaction(async (tx) => {
		await tx.organizationUser.delete({
			where: {
				organizationId_userId: {
					organizationId: effectiveOrgId,
					userId,
				},
			},
		});

		await tx.$executeRawUnsafe(
			`DELETE FROM "UserAccessProfile" WHERE "organizationId" = $1 AND "userId" = $2`,
			effectiveOrgId,
			userId,
		);

		const remainingMemberships = await tx.organizationUser.count({ where: { userId } });
		if (remainingMemberships === 0) {
			await tx.user.update({
				where: { id: userId },
				data: { organizationId: null },
			});
		}
	});

	return { message: "User deactivated" };
};

export const resetOrganizationUserManagementAndCrmData = async (organizationId: string, requesterId: string) => {
	const effectiveOrgId = await ensureOrganizationMembership(organizationId, requesterId);
	await ensureAccessProfileTable();

	const allOrgMembers = await prisma.organizationUser.findMany({
		where: { organizationId: effectiveOrgId },
		select: { userId: true },
	});

	const allOrgUserIds = [...new Set(allOrgMembers.map((item) => item.userId))];
	const managedUserIds = allOrgUserIds.filter((userId) => userId !== requesterId);

	await prisma.$transaction(async (tx) => {
		if (allOrgUserIds.length > 0) {
			await tx.activity.deleteMany({
				where: {
					OR: [
						{ lead: { organizationId: effectiveOrgId } },
						{ deal: { organizationId: effectiveOrgId } },
						{ createdBy: { in: allOrgUserIds } },
					],
				},
			});
		} else {
			await tx.activity.deleteMany({
				where: {
					OR: [{ lead: { organizationId: effectiveOrgId } }, { deal: { organizationId: effectiveOrgId } }],
				},
			});
		}

		await tx.dealStageHistory.deleteMany({ where: { deal: { organizationId: effectiveOrgId } } });
		await tx.deal.deleteMany({ where: { organizationId: effectiveOrgId } });
		await tx.lead.deleteMany({ where: { organizationId: effectiveOrgId } });
		await tx.stage.deleteMany({ where: { pipeline: { organizationId: effectiveOrgId } } });
		await tx.pipeline.deleteMany({ where: { organizationId: effectiveOrgId } });

		if (managedUserIds.length > 0) {
			await tx.$executeRawUnsafe(
				`DELETE FROM "UserAccessProfile" WHERE "organizationId" = $1 AND "userId" = ANY($2::TEXT[])`,
				effectiveOrgId,
				managedUserIds,
			);

			await tx.organizationUser.deleteMany({
				where: {
					organizationId: effectiveOrgId,
					userId: { in: managedUserIds },
				},
			});

			for (const userId of managedUserIds) {
				const remainingMemberships = await tx.organizationUser.count({ where: { userId } });
				if (remainingMemberships === 0) {
					await tx.user.update({
						where: { id: userId },
						data: { organizationId: null },
					});
				}
			}
		}
	});

	return {
		message: "User management and CRM data reset successfully",
		deletedUsers: managedUserIds.length,
	};
};
