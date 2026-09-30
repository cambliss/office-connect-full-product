import { NextRequest, NextResponse } from "next/server";
import { getOrCreateRoom } from "@/lib/video-room-store";

export async function POST(
	req: NextRequest,
	{ params }: { params: Promise<{ meetingId: string }> }
) {
	const { meetingId } = await params;
	const body = await req.json().catch(() => ({}));
	const { participantId } = body;

	if (meetingId && participantId) {
		const room = getOrCreateRoom(meetingId);
		room.participants.delete(participantId);
	}

	return NextResponse.json({ success: true });
}
