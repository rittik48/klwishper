export type Room = { id: string; name: string; description: string | null; type: string };
export type PublicPost = { id: string; content: string; created_at: string; room: Room; anonymous_label: string; reply_count: number; reaction_count: number };
