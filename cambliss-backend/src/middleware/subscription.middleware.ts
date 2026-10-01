import { NextFunction, Request, Response } from "express";
import prisma from "../config/prisma";
import { RoleName } from "@prisma/client";
import { getOrganizationTrialReminderSnapshot } from "../modules/subscription/subscription.service";

const forbiddenResponse = (res: Response): void => {
	res.status(403).json({ message: "No active subscription. Please subscribe to continue." });
};

export const requireActiveSubscription = async (
	req: Request,
	res: Response,
	next: NextFunction,
): Promise<void> => {
	try {
		if (req.user?.role === RoleName.SUPER_ADMIN || req.user?.role === RoleName.ADMIN) {
			next();
			return;
		}

		let organizationId = req.user?.organizationId;
		if (!organizationId || organizationId === "platform") {
			const userRecord = await prisma.user.findUnique({
				where: { id: req.user?.id },
				select: { organizationId: true, memberships: { select: { organizationId: true } } },
			});
			organizationId = userRecord?.organizationId || userRecord?.memberships[0]?.organizationId;
		}

		if (!organizationId) {
			forbiddenResponse(res);
			return;
		}

		const organization = await prisma.organization.findUnique({
			where: { id: organizationId },
			select: { id: true, isActive: true },
		});

		if (!organization?.isActive) {
			forbiddenResponse(res);
			return;
		}

		const activeSubscription = await prisma.subscription.findFirst({
			where: {
				organizationId,
				status: {
					in: ["ACTIVE", "TRIALING", "PAST_DUE"],
				},
			},
			select: { id: true },
		});

		if (activeSubscription) {
			next();
			return;
		}

		// Fallback: If organization is active and trial snapshot has not expired, allow access
		try {
			const trialSnapshot = await getOrganizationTrialReminderSnapshot(organizationId);
			if (trialSnapshot.status !== "EXPIRED") {
				next();
				return;
			}
		} catch {
			// Ignore trial snapshot error and fall through to forbiddenResponse
		}

		forbiddenResponse(res);
	} catch {
		res.status(500).json({ message: "Internal server error" });
	}
};
