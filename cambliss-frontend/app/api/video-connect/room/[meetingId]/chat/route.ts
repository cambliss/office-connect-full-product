import { NextRequest, NextResponse } from "next/server";
import { getOrCreateRoom, RoomChatMessage } from "@/lib/video-room-store";

export async function GET(
	_req: NextRequest,
	{ params }: { params: Promise<{ meetingId: string }> }
) {
	const { meetingId } = await params;
	const room = getOrCreateRoom(meetingId);
	return NextResponse.json({ messages: room.messages });
}

export async function POST(
	req: NextRequest,
	{ params }: { params: Promise<{ meetingId: string }> }
) {
	const { meetingId } = await params;
	const body = await req.json().catch(() => ({}));
	const { sender, text } = body;

	if (!text || !text.trim()) {
		return NextResponse.json({ message: "Text is required" }, { status: 400 });
	}

	const room = getOrCreateRoom(meetingId);
	const newMsg: RoomChatMessage = {
		id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
		sender: sender || "Participant",
		text: text.trim(),
		time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
	};

	room.messages.push(newMsg);
	return NextResponse.json({ message: newMsg, messages: room.messages });
}
