#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import process from 'node:process';

const REQUIRED_ENV = [
  'GROCERYVIEW_SERVER_URL',
  'GROCERYVIEW_SCANNER_USER_ID',
  'GROCERYVIEW_SCANNER_BEARER_TOKEN'
];

function requireEnv(env, name) {
  const value = env[name];
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Hosted scanner upload smoke requires ${name}.`);
  }
  return value.trim();
}

function trimTrailingSlash(value) {
  return value.replace(/\/+$/, '');
}

function scanIdFromNow(now) {
  return `hosted-scanner-upload-smoke-${now.toISOString().replace(/[:.]/g, '-')}`;
}

async function readJson(response, context) {
  let body;
  try {
    body = await response.json();
  } catch (error) {
    throw new Error(`${context} did not return readable JSON.`);
  }
  return body;
}

function assertReadyTicket(body) {
  const result = body?.result;
  const ticket = result?.ticket;
  if (result?.status !== 'ready') {
    throw new Error('Hosted scanner upload ticket endpoint did not return ready status.');
  }
  if (!ticket || typeof ticket.uploadUrl !== 'string' || ticket.uploadUrl.length === 0) {
    throw new Error('Hosted scanner upload ticket response did not include an upload URL.');
  }
  if (!ticket.headers || typeof ticket.headers !== 'object') {
    throw new Error('Hosted scanner upload ticket response did not include required upload headers.');
  }
  if (typeof ticket.payloadUri !== 'string' || !/^(s3|private-upload):\/\//.test(ticket.payloadUri)) {
    throw new Error('Hosted scanner upload ticket response did not include a private payload URI.');
  }
  return ticket;
}

export async function runHostedScannerUploadSmoke({
  env = process.env,
  fetch: fetchImpl = globalThis.fetch,
  now = new Date(),
  writeFile: writeFileImpl = writeFile,
  mkdir: mkdirImpl = mkdir
} = {}) {
  for (const name of REQUIRED_ENV) requireEnv(env, name);
  if (typeof fetchImpl !== 'function') throw new Error('Hosted scanner upload smoke requires fetch support.');

  const serverUrl = trimTrailingSlash(requireEnv(env, 'GROCERYVIEW_SERVER_URL'));
  const userId = requireEnv(env, 'GROCERYVIEW_SCANNER_USER_ID');
  const bearerToken = requireEnv(env, 'GROCERYVIEW_SCANNER_BEARER_TOKEN');
  const checkedAt = now.toISOString();
  const scanId = scanIdFromNow(now);
  const ticketUrl = `${serverUrl}/api/scans/upload-url?userId=${encodeURIComponent(userId)}`;

  const ticketResponse = await fetchImpl(ticketUrl, {
    method: 'POST',
    headers: new Headers({
      authorization: `Bearer ${bearerToken}`,
      'content-type': 'application/json'
    }),
    body: JSON.stringify({
      scanId,
      kind: 'receipt',
      contentType: 'image/jpeg',
      byteLength: 1,
      requestedAt: checkedAt
    })
  });

  if (!ticketResponse.ok) {
    throw new Error(`Hosted scanner upload ticket request failed with status ${ticketResponse.status}.`);
  }

  const ticketBody = await readJson(ticketResponse, 'Hosted scanner upload ticket request');
  const ticket = assertReadyTicket(ticketBody);

  const putResponse = await fetchImpl(ticket.uploadUrl, {
    method: 'PUT',
    headers: new Headers(ticket.headers),
    body: 'x'
  });

  if (!putResponse.ok) {
    throw new Error(`Hosted scanner signed upload PUT failed with status ${putResponse.status}.`);
  }

  const result = {
    status: 'ready',
    scanId,
    evidence: ['scan_upload_ticket_ready', 'scan_upload_put_succeeded', 'scan_upload_private_payload_uri'],
    checkedAt
  };

  const outputPath = env.HOSTED_SCANNER_UPLOAD_SMOKE_OUTPUT_PATH;
  if (typeof outputPath === 'string' && outputPath.trim().length > 0) {
    await mkdirImpl(dirname(outputPath), { recursive: true });
    await writeFileImpl(outputPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  }

  return result;
}

if (import.meta.url === new URL(process.argv[1], 'file:').href) {
  runHostedScannerUploadSmoke()
    .then((result) => {
      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
      if (process.env.HOSTED_SCANNER_UPLOAD_SMOKE_OUTPUT_PATH) {
        process.stderr.write(`Hosted scanner upload smoke evidence written to ${process.env.HOSTED_SCANNER_UPLOAD_SMOKE_OUTPUT_PATH}\n`);
      }
    })
    .catch((error) => {
      process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
      process.exitCode = 1;
    });
}
