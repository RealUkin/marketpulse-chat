import type { ConnectionState, Platform, UnifiedMessage } from "../../shared/types";

export type Emit = (msg: UnifiedMessage) => void;
export type StatusFn = (
  platform: Platform,
  state: ConnectionState,
  detail?: string,
) => void;

export interface Adapter {
  stop: () => void;
}
