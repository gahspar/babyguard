import { Database, DeviceType, SessionStatus } from "./database";

export type DeviceRow = Database["public"]["Tables"]["devices"]["Row"];
export type PairingCodeRow = Database["public"]["Tables"]["pairing_codes"]["Row"];
export type MonitoringSessionRow = Database["public"]["Tables"]["monitoring_sessions"]["Row"];
export type ConnectionEventRow = Database["public"]["Tables"]["connection_events"]["Row"];
export type UserPreferencesRow = Database["public"]["Tables"]["user_preferences"]["Row"];

export interface ActiveSessionInfo {
  session: MonitoringSessionRow;
  station: DeviceRow;
  monitor?: DeviceRow | null;
}

export interface PairingCodePayload {
  plainCode: string;
  codeHash: string;
  expiresAt: string;
  targetDeviceType: DeviceType;
  deviceName: string;
}
