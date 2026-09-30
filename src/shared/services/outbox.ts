import { getDatabase } from "./sqlite";

export interface OutboxItem {
  id: number;
  client_uuid: string;
  action_type: string;
  endpoint: string;
  method: string;
  payload: string | null;
  created_at: string;
  status: "PENDING" | "APPLIED" | "CONFLICT" | "REJECTED";
  attempts: number;
  last_error: string | null;
}

export const outboxService = {
  async add(item: {
    client_uuid: string;
    action_type: string;
    endpoint: string;
    method: string;
    payload?: unknown;
  }): Promise<void> {
    const db = await getDatabase();
    const payloadStr = item.payload ? JSON.stringify(item.payload) : null;
    const now = new Date().toISOString();

    await db.runAsync(
      `INSERT OR REPLACE INTO outbox (client_uuid, action_type, endpoint, method, payload, created_at, status, attempts)
       VALUES (?, ?, ?, ?, ?, ?, 'PENDING', 0)`,
      [item.client_uuid, item.action_type, item.endpoint, item.method, payloadStr, now]
    );
  },

  async getPending(): Promise<OutboxItem[]> {
    const db = await getDatabase();
    return await db.getAllAsync<OutboxItem>(
      "SELECT * FROM outbox WHERE status = 'PENDING' ORDER BY id ASC"
    );
  },

  async markApplied(id: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync("UPDATE outbox SET status = 'APPLIED' WHERE id = ?", [id]);
  },

  async markFailed(id: number, error: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      "UPDATE outbox SET attempts = attempts + 1, last_error = ? WHERE id = ?",
      [error, id]
    );
  },
};
