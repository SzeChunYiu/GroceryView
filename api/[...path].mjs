import { createRuntimeHttpHandler, handleNodeHttpRequest } from '../packages/server/dist/index.js';

let handler;

export default async function groceryViewServer(request, response) {
  handler ??= createRuntimeHttpHandler(process.env);
  await handleNodeHttpRequest(request, response, handler);
}
