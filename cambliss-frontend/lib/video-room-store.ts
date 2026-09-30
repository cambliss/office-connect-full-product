type RoomParticipant = {
	id: string;
	name: string;
	isHost: boolean;
	audioEnabled: boolean;
	videoEnabled: boolean;
	lastSeen: number;
};

type RoomChatMessage = {
	id: string;
	sender: string;
	text: string;
	time: string;
};

type SignalPayload = {
	id: string;
	senderId: string;
	targetId: string;
	signal: any;
};

type RoomState = {
	meetingId: string;
	participants: Map<string, RoomParticipant>;
	messages: RoomChatMessage[];
	signals: SignalPayload[];
};

declare global {
	// eslint-disable-next-line no-var
	var __videoRooms: Map<string, RoomState> | undefined;
}

const rooms = globalThis.__videoRooms || new Map<string, RoomState>();
if (process.env.NODE_ENV !== "production") {
	globalThis.__videoRooms = rooms;
}

export function getOrCreateRoom(meetingId: string): RoomState {
	let room = rooms.get(meetingId);
	if (!room) {
		room = {
			meetingId,
			participants: new Map<string, RoomParticipant>(),
			messages: [
				{
					id: "1",
					sender: "System",
					text: "Welcome to the meeting room!",
					time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
				},
			],
			signals: [],
		};
		rooms.set(meetingId, room);
	}
	return room;
}

export function cleanupStaleParticipants(room: RoomState) {
	const now = Date.now();
	for (const [id, participant] of room.participants.entries()) {
		if (now - participant.lastSeen > 8000) {
			room.participants.delete(id);
		}
	}
}

export type { RoomParticipant, RoomChatMessage, SignalPayload, RoomState };
