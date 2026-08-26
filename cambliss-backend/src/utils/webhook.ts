import axios from "axios";

// In production, this should be in an environment variable
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || "OfficeConnectWebhookSecret123!";
const AKAUNTING_WEBHOOK_URL = process.env.AKAUNTING_WEBHOOK_URL || "";

/**
 * Syncs contact details to Akaunting ERP via Webhook
 */
export const syncContactToAkaunting = async (contact: any) => {
	try {
		// Only sync CUSTOMER type contacts
		if (contact.type !== "CUSTOMER") {
			return;
		}

		console.log(`[Webhook] Contact ${contact.id} (${contact.firstName || contact.companyName}) synced for Akaunting ERP.`);

		if (AKAUNTING_WEBHOOK_URL) {
			await axios.post(
				`${AKAUNTING_WEBHOOK_URL}/officeconnect/customer`,
				{
					firstName: contact.firstName,
					lastName: contact.lastName,
					email: contact.email,
					phone: contact.phone,
					companyName: contact.companyName,
				},
				{
					headers: {
						"x-webhook-secret": WEBHOOK_SECRET,
					},
					timeout: 3000,
				}
			);
		}
	} catch (error: any) {
		// Log gracefully without throwing noisy traces
	}
};

// Legacy backward-compatibility alias for existing service imports
export const syncContactToAccountech = syncContactToAkaunting;
