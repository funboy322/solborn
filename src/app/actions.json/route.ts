/**
 * Solana Actions domain registration — lets Blink clients (Phantom, dial.to)
 * discover all agent Blinks served under /api/blinks/*.
 * Spec: https://solana.com/docs/advanced/actions#actionsjson
 */
import { NextResponse } from 'next/server'

export const runtime = 'edge'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

export function GET() {
  return new NextResponse(
    JSON.stringify({
      rules: [
        { pathPattern: '/blink/*', apiPath: '/api/blinks/*' },
        { pathPattern: '/api/blinks/**', apiPath: '/api/blinks/**' },
      ],
    }),
    { status: 200, headers: CORS },
  )
}
