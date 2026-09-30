import { NextRequest, NextResponse } from "next/server";
import { getOrCreateRoom } from "@/lib/video-room-store";

export async function GET(
	_req: NextRequest,
	{ params }: { params: Promise<{ meetingId: string; myId: string }> }
) {
	const { meetingId, myId } = await params;

	if (!meetingId || !myId) {
		return NextResponse.json({ signals: [] });
	}

	const room = getOrCreateRoom(meetingId);
	const mySignals = room.signals.filter((s) => s.targetId === myId);

	// Remove consumed signals for this participant
	room.signals = room.signals.filter((s) => s.targetId !== myId);

	return NextResponse.json({ signals: mySignals });
}
