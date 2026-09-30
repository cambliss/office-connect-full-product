import { NextRequest, NextResponse } from "next/server";
import { getOrCreateRoom, cleanupStaleParticipants } from "@/lib/video-room-store";

export async function POST(
	req: NextRequest,
	{ params }: { params: Promise<{ meetingId: string }> }
) {
	const { meetingId } = await params;
	const body = await req.json().catch(() => ({}));
	const { participantId, name, isHost, audioEnabled, videoEnabled } = body;

	if (!meetingId || !participantId) {
		return NextResponse.json({ message: "Missing meetingId or participantId" }, { status: 400 });
	}

	const room = getOrCreateRoom(meetingId);

	room.participants.set(participantId, {
		id: participantId,
		name: name || (isHost ? "Host" : "Guest"),
		isHost: Boolean(isHost),
		audioEnabled: audioEnabled !== false,
		videoEnabled: videoEnabled !== false,
		lastSeen: Date.now(),
	});

	cleanupStaleParticipants(room);

	const activeList = Array.from(room.participants.values()).map((p) => ({
		id: p.id,
		name: p.name,
		isHost: p.isHost,
		audioEnabled: p.audioEnabled,
		videoEnabled: p.videoEnabled,
	}));

	return NextResponse.json({
		meetingId,
		participants: activeList,
	});
}
