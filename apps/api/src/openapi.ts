import 'reflect-metadata';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { type INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';

export const OPENAPI_YAML_PATH = resolve(process.cwd(), 'docs/openapi.yaml');

export function createOpenApiDocument(app: INestApplication) {
  const docsConfig = new DocumentBuilder()
    .setTitle('GroceryView API')
    .setDescription('HTTP API for GroceryView products, stores, prices, users, watchlists, baskets, and alerts.')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  return SwaggerModule.createDocument(app, docsConfig);
}

export function setupOpenApi(app: INestApplication) {
  SwaggerModule.setup('api', app, createOpenApiDocument(app));
}

export function serializeOpenApiDocument(document: unknown): string {
  return `${JSON.stringify(sortKeys(document), null, 2)}\n`;
}

export function createOpenApiYaml(app: INestApplication): string {
  return serializeOpenApiDocument(createOpenApiDocument(app));
}

export async function createStandaloneOpenApiYaml(): Promise<string> {
  const app = await NestFactory.create(AppModule, { logger: false });
  await app.init();
  try {
    return createOpenApiYaml(app);
  } finally {
    await app.close();
  }
}

export async function writeOpenApiYaml(path = OPENAPI_YAML_PATH): Promise<void> {
  const yaml = await createStandaloneOpenApiYaml();
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, yaml);
}

export async function assertOpenApiYamlFresh(path = OPENAPI_YAML_PATH): Promise<void> {
  const expected = await createStandaloneOpenApiYaml();
  let current = '';
  try {
    current = await readFile(path, 'utf8');
  } catch {
    throw new Error(`OpenAPI document is missing at ${path}. Run npm run openapi:generate -w @groceryview/api-app.`);
  }
  if (current !== expected) {
    throw new Error(`OpenAPI document is stale at ${path}. Run npm run openapi:generate -w @groceryview/api-app and commit the result.`);
  }
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, sortKeys(entry)])
  );
}

async function main() {
  const command = process.argv[2] ?? 'generate';
  if (command === 'check') {
    await assertOpenApiYamlFresh();
    return;
  }
  if (command === 'generate') {
    await writeOpenApiYaml();
    return;
  }
  throw new Error(`Unknown OpenAPI command: ${command}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  void main();
}
