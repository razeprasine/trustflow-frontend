import { useWallet, AccountInfo } from "./useWallet";

// Re-export AccountInfo for backward compatibility
export type { AccountInfo };

/**
 * Convenience hook that returns only the connected account info.
 *
 * For full wallet state (network, connect/disconnect, loading/error states)
 * use {@link useWallet} from `hooks/useWallet` instead.
 */
export function useAccount(): AccountInfo | null {
  return useWallet().account;
}
