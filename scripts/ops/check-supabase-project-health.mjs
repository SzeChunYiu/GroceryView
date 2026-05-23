#!/usr/bin/env node
import process from 'node:process';

const SUPABASE_MANAGEMENT_API_BASE_URL = 'https://api.supabase.com/v1';
const DEFAULT_SERVICES = ['db', 'db_postgres_user', 'pooler', 'rest'];

function parseServices(value) {
  const services = String(value ?? '')
    .split(',')
    .map((service) => service.trim())
    .filter(Boolean);
  return services.length > 0 ? services : DEFAULT_SERVICES;
}

function serviceBlocker(service) {
  return `supabase_service_unhealthy:${service.name ?? 'unknown'}`;
}

function sanitizeService(service) {
  return {
    name: service.name,
    healthy: service.healthy === true,
    status: service.status,
    ...(service.info && typeof service.info === 'object' ? { info: service.info } : {}),
    ...(service.error ? { error: String(service.error).replace(/postgres(?:ql)?:\/\/[^\s'"]+/gi, '[redacted_database_url]') } : {})
  };
}

async function fetchJson(fetchImpl, url, token) {
  const response = await fetchImpl(url, {
    headers: {
      accept: 'application/json',
      authorization: `Bearer ${token}`,
      'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)'
    }
  });
  const text = await response.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { message: text };
  }
  if (!response.ok) {
    const message = body?.message ? String(body.message) : `HTTP ${response.status}`;
    throw new Error(`Supabase management API request failed: ${response.status} ${message}`);
  }
  return body;
}

export async function checkSupabaseProjectHealth(env = process.env, options = {}) {
  const token = env.SUPABASE_ACCESS_TOKEN?.trim();
  const projectRef = env.SUPABASE_PROJECT_REF?.trim();
  if (!token) throw new Error('SUPABASE_ACCESS_TOKEN is required.');
  if (!projectRef) throw new Error('SUPABASE_PROJECT_REF is required.');

  const fetchImpl = options.fetchImpl ?? fetch;
  const apiBaseUrl = options.apiBaseUrl ?? SUPABASE_MANAGEMENT_API_BASE_URL;
  const services = parseServices(env.SUPABASE_HEALTH_SERVICES);
  const projectUrl = new URL(`${apiBaseUrl.replace(/\/$/, '')}/projects/${projectRef}`);
  const healthUrl = new URL(`${apiBaseUrl.replace(/\/$/, '')}/projects/${projectRef}/health`);
  for (const service of services) healthUrl.searchParams.append('services', service);

  const project = await fetchJson(fetchImpl, projectUrl, token);
  const healthBody = await fetchJson(fetchImpl, healthUrl, token);
  if (!Array.isArray(healthBody)) throw new Error('Supabase management health response must be an array.');

  const serviceHealth = healthBody.map(sanitizeService);
  const unhealthy = serviceHealth.filter((service) => service.healthy !== true);
  const blockers = [
    ...(project.status && project.status !== 'ACTIVE_HEALTHY' ? [`supabase_project_status:${project.status}`] : []),
    ...unhealthy.map(serviceBlocker)
  ];

  return {
    status: blockers.length === 0 ? 'ready' : 'blocked',
    projectRef,
    projectName: project.name,
    projectStatus: project.status,
    region: project.region,
    services,
    serviceHealth,
    ...(blockers.length > 0 ? { blockers } : {})
  };
}

if (import.meta.url === new URL(process.argv[1], 'file:').href) {
  try {
    const result = await checkSupabaseProjectHealth(process.env);
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    if (result.status !== 'ready') process.exitCode = 1;
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
