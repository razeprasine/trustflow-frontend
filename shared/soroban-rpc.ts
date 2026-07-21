import { rpc } from '@stellar/stellar-sdk'
import { SOROBAN_RPC_URL } from './contracts'

/**
 * Shared Soroban RPC client, lazily created so this module has no side effects
 * at import time (safe to import from both client and server code).
 */
let server: rpc.Server | null = null

export function getSorobanServer(): rpc.Server {
  if (!server) {
    server = new rpc.Server(SOROBAN_RPC_URL, { allowHttp: SOROBAN_RPC_URL.startsWith('http://') })
  }
  return server
}
