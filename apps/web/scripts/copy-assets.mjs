import { buildStaticPages } from './pages.mjs';
import { cp, mkdir } from 'node:fs/promises';

await mkdir(new URL('../dist/', import.meta.url), { recursive: true });
await cp(new URL('../public/', import.meta.url), new URL('../dist/', import.meta.url), { recursive: true });

await buildStaticPages(new URL('../dist/', import.meta.url).pathname);
