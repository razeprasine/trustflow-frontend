/**
 * TrustFlow contract config.
 *
 * Replace the contract IDs with your deployed Soroban contract details.
 * These values are read from environment variables at build time.
 *
 * Env var names follow the convention documented in README.md
 * (NEXT_PUBLIC_STELLAR_NETWORK / NEXT_PUBLIC_SOROBAN_RPC_URL / NEXT_PUBLIC_*_CONTRACT_ID).
 * NEXT_PUBLIC_CONTRACT_ID / NEXT_PUBLIC_RPC_URL are kept as fallbacks for back-compat
 * with existing deployments that only set the older generic names.
 */
export const CONTRACT_ID = process.env.NEXT_PUBLIC_CONTRACT_ID ?? ''
export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL ?? 'https://soroban-testnet.stellar.org'
export const NETWORK_PASSPHRASE =
  process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE ?? 'Test SDF Network ; September 2015'

export const STELLAR_NETWORK = process.env.NEXT_PUBLIC_STELLAR_NETWORK ?? 'TESTNET'

export const SOROBAN_RPC_URL = process.env.NEXT_PUBLIC_SOROBAN_RPC_URL ?? RPC_URL

export const ESCROW_CONTRACT_ID = process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ID ?? CONTRACT_ID

export const DISPUTE_CONTRACT_ID = process.env.NEXT_PUBLIC_DISPUTE_CONTRACT_ID ?? ''
