import { readFile } from 'node:fs/promises';

const REQUIRED_DEPENDENCIES = [
  '@nestjs/config',
  '@nestjs/swagger',
  'swagger-ui-express',
  'zod',
  'class-validator',
  'class-transformer',
  '@nestjs/mapped-types',
  '@nestjs/terminus',
  '@nestjs/platform-express',
  'reflect-metadata',
  'rxjs',
];

const REQUIRED_DEV_DEPENDENCIES = ['@types/swagger-ui-express'];

const packageJson = JSON.parse(
  await readFile(new URL('../package.json', import.meta.url), 'utf8'),
);

const missingDependencies = REQUIRED_DEPENDENCIES.filter(
  (name) => !packageJson.dependencies?.[name],
);
const missingDevDependencies = REQUIRED_DEV_DEPENDENCIES.filter(
  (name) => !packageJson.devDependencies?.[name],
);

if (missingDependencies.length || missingDevDependencies.length) {
  console.error('Missing required API packages:');

  for (const name of missingDependencies) {
    console.error(`- dependencies.${name}`);
  }

  for (const name of missingDevDependencies) {
    console.error(`- devDependencies.${name}`);
  }

  process.exitCode = 1;
} else {
  console.log('All required API packages are declared.');
}
