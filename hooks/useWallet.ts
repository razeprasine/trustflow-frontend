import { useEffect, useState, useCallback, useRef } from "react";
import {
  isConnected,
  getUserInfo,
  getNetworkDetails,
  isAllowed,
  signTransaction as freighterSignTransaction,
} from "@stellar/freighter-api";

export interface AccountInfo {
  address: string;
  displayName: string;
}

export interface NetworkInfo {
  network: string; // e.g. "Test SDF Network ; September 2015"
  networkUrl: string;
  networkPassphrase: string;
}

export interface WalletState {
  /** The connected Stellar account, or null if not connected */
  account: AccountInfo | null;
  /** Network details from Freighter, or null if unavailable */
  network: NetworkInfo | null;
  /** Whether the app is currently listed as allowed in Freighter */
  isAllowed: boolean | null;
  /** Whether a connect/disconnect action is in progress */
  isBusy: boolean;
  /** Most recent connection error message, if any */
  error: string | null;
  /** Trigger the Freighter connection flow (calls setAllowed) */
  connect: () => Promise<void>;
  /** Clear the local connection state so the UI prompts to connect again */
  disconnect: () => void;
  /** Requests a Freighter signature for a transaction XDR envelope, returning the signed XDR */
  signTransaction: (xdr: string) => Promise<string>;
}

/**
 * Manages the full lifecycle of a Freighter wallet connection:
 * - Detects existing connection and account info on mount
 * - Provides `connect()` to trigger setAllowed + immediate public key fetch
 * - Provides `disconnect()` to clear local state
 * - Polls for network and account changes every 2 seconds
 *
 * Freighter does **not** support programmatic network switching via the API.
 * To switch networks, the user must open the Freighter extension and switch
 * manually. The hook will detect the change within a polling cycle.
 */
export function useWallet(): WalletState {
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [network, setNetwork] = useState<NetworkInfo | null>(null);
  const [isAllowedState, setIsAllowed] = useState<boolean | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tracks whether the user has explicitly disconnected; when true, polling
  // ignores Freighter's isConnected() result so the UI stays in "connect" mode.
  const disconnectedRef = useRef(false);

  // ── Core sync logic ──────────────────────────────────────────

  const sync = useCallback(async () => {
    if (disconnectedRef.current) {
      setAccount(null);
      return;
    }

    try {
      const connected = await isConnected();
      if (!connected) {
        setAccount(null);
        setIsAllowed(false);
        setNetwork(null);
        return;
      }

      // Fetch each piece independently so one failing call doesn't
      // prevent the others from updating the UI.
      try {
        const user = await getUserInfo();
        if (user?.publicKey) {
          setAccount({
            address: user.publicKey,
            displayName: `${user.publicKey.slice(0, 4)}...${user.publicKey.slice(-4)}`,
          });
        } else {
          setAccount(null);
        }
      } catch {
        // keep previous account on transient failure
      }

      try {
        const allowed = await isAllowed();
        setIsAllowed(allowed);
      } catch {
        // keep previous allowed state
      }

      try {
        const netDetails = await getNetworkDetails();
        if (netDetails) {
          setNetwork({
            network: netDetails.network,
            networkUrl: netDetails.networkUrl,
            networkPassphrase: netDetails.networkPassphrase,
          });
        }
      } catch {
        // keep previous network info
      }
    } catch {
      // Freighter may not be installed or may throw during polling;
      // silently ignore transient errors to avoid flickering the UI.
    }
  }, []);

  // ── Polling ───────────────────────────────────────────────────

  useEffect(() => {
    sync();
    const interval = setInterval(sync, 2000);
    return () => clearInterval(interval);
  }, [sync]);

  // ── Public API ────────────────────────────────────────────────

  const connect = useCallback(async () => {
    setIsBusy(true);
    setError(null);
    disconnectedRef.current = false;

    try {
      // setAllowed() is called by the ConnectButton component itself;
      // here we just reset state and sync so the UI updates promptly.
      await sync();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to connect wallet";
      setError(message);
      disconnectedRef.current = true;
    } finally {
      setIsBusy(false);
    }
  }, [sync]);

  const disconnect = useCallback(() => {
    disconnectedRef.current = true;
    setAccount(null);
    setNetwork(null);
    setIsAllowed(false);
    setError(null);
  }, []);

  const signTransaction = useCallback(
    async (xdr: string): Promise<string> => {
      if (!account) {
        throw new Error("Connect a wallet before signing a transaction");
      }

      return freighterSignTransaction(xdr, {
        networkPassphrase: network?.networkPassphrase,
        accountToSign: account.address,
      });
    },
    [account, network]
  );

  return {
    account,
    network,
    isAllowed: isAllowedState,
    isBusy,
    error,
    connect,
    disconnect,
    signTransaction,
  };
}
