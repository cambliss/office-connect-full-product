import { NextRequest, NextResponse } from "next/server";
import { getOrCreateRoom } from "@/lib/video-room-store";

export async function POST(
	req: NextRequest,
	{ params }: { params: Promise<{ meetingId: string }> }
) {
	const { meetingId } = await params;
	const body = await req.json().catch(() => ({}));
	const { senderId, targetId, signal } = body;

	if (!meetingId || !senderId || !targetId || !signal) {
		return NextResponse.json({ message: "Missing signal parameters" }, { status: 400 });
	}

	const room = getOrCreateRoom(meetingId);
	room.signals.push({
		id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
		senderId,
		targetId,
		signal,
	});

	if (room.signals.length > 150) {
		room.signals = room.signals.slice(-150);
	}

	return NextResponse.json({ success: true });
}
