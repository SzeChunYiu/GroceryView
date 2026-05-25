declare module 'vitest' {
  export const describe: typeof import('node:test').describe;
  export const it: typeof import('node:test').it;
  export function expect(value: unknown): {
    toMatchObject(expected: unknown): void;
    toThrow(expected?: string | RegExp): void;
  };
}
