import { NextRequest, NextResponse } from "next/server";
import { getOrCreateRoom } from "@/lib/video-room-store";

export async function POST(
	req: NextRequest,
	{ params }: { params: Promise<{ meetingId: string }> }
) {
	const { meetingId } = await params;
	const body = await req.json().catch(() => ({}));
	const { hostId, hostName, targetParticipantId, action } = body;

	if (!meetingId || !hostId || !action) {
		return NextResponse.json({ message: "Missing required parameters" }, { status: 400 });
	}

	const room = getOrCreateRoom(meetingId);
	const sender = hostName || "Host";

	if (action === "mute") {
		if (targetParticipantId === "all") {
			for (const [id, participant] of room.participants.entries()) {
				if (id !== hostId && !participant.isHost) {
					participant.audioEnabled = false;
					room.signals.push({
						id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
						senderId: hostId,
						targetId: id,
						signal: { type: "host-mute-mic", by: sender },
					});
				}
			}
		} else if (targetParticipantId && room.participants.has(targetParticipantId)) {
			const target = room.participants.get(targetParticipantId)!;
			target.audioEnabled = false;
			room.signals.push({
				id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
				senderId: hostId,
				targetId: targetParticipantId,
				signal: { type: "host-mute-mic", by: sender },
			});
		}
	} else if (action === "request-unmute" && targetParticipantId) {
		room.signals.push({
			id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
			senderId: hostId,
			targetId: targetParticipantId,
			signal: { type: "host-request-unmute", by: sender },
		});
	}

	const activeList = Array.from(room.participants.values()).map((p) => ({
		id: p.id,
		name: p.name,
		isHost: p.isHost,
		audioEnabled: p.audioEnabled,
		videoEnabled: p.videoEnabled,
	}));

	return NextResponse.json({
		success: true,
		participants: activeList,
	});
}
