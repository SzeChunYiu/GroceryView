import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { summarizeDeploymentManifestValidationReport, validateDeploymentManifest, type DeploymentManifest } from '../index.js';

const validManifest: DeploymentManifest = {
  version: 1,
  services: [
    {
      name: 'groceryview-server',
      type: 'node-http',
      workspace: '@groceryview/server',
      startCommand: 'node packages/server/dist/index.js',
      healthCheck: { path: '/api/health', expectedStatus: 200 },
      requiredEnv: ['AUTH_SECRET', 'DATABASE_URL', 'PUBLIC_WEB_URL']
    },
    {
      name: 'groceryview-web',
      type: 'static-site',
      workspace: '@groceryview/web',
      buildCommand: 'npm run build -w @groceryview/web',
      outputDirectory: 'apps/web/dist',
      healthCheck: { path: '/', expectedStatus: 200 },
      requiredEnv: []
    }
  ]
};

describe('validateDeploymentManifest', () => {
  it('accepts a deployable web plus server manifest', () => {
    assert.deepEqual(validateDeploymentManifest(validManifest), {
      status: 'ready',
      blockers: [],
      warnings: ['no_required_env:groceryview-web'],
      serviceNames: ['groceryview-server', 'groceryview-web']
    });
  });

  it('fails closed on duplicate services and missing runtime commands', () => {
    const manifest: DeploymentManifest = {
      version: 1,
      services: [
        {
          name: 'groceryview-server',
          type: 'node-http',
          workspace: '@groceryview/server',
          healthCheck: { path: '/api/health', expectedStatus: 200 },
          requiredEnv: ['DATABASE_URL']
        },
        {
          name: 'groceryview-server',
          type: 'static-site',
          workspace: '@groceryview/web',
          buildCommand: '',
          outputDirectory: '',
          healthCheck: { path: 'health', expectedStatus: 500 },
          requiredEnv: ['bad-env-name']
        }
      ]
    };

    assert.deepEqual(validateDeploymentManifest(manifest), {
      status: 'blocked',
      blockers: [
        'start_command_missing:groceryview-server',
        'duplicate_service:groceryview-server',
        'health_check_path_invalid:groceryview-server',
        'health_check_status_invalid:groceryview-server',
        'required_env_invalid:groceryview-server',
        'build_command_missing:groceryview-server',
        'output_directory_missing:groceryview-server'
      ],
      warnings: [],
      serviceNames: ['groceryview-server', 'groceryview-server']
    });
  });

  it('summarizes manifest validation blockers for release dashboards', () => {
    const report = validateDeploymentManifest({
      version: 2,
      services: [
        {
          type: '',
          workspace: 'server',
          healthCheck: { path: 'health', expectedStatus: 500 },
          requiredEnv: ['bad-env-name']
        },
        {
          name: 'groceryview-web',
          type: 'static-site',
          workspace: '@groceryview/web',
          buildCommand: '',
          outputDirectory: '',
          healthCheck: { path: '/', expectedStatus: 200 },
          requiredEnv: []
        },
        {
          name: 'groceryview-web',
          type: 'node-http',
          workspace: '@groceryview/server',
          healthCheck: { path: '/api/health', expectedStatus: 200 },
          requiredEnv: ['DATABASE_URL']
        }
      ]
    });

    assert.deepEqual(summarizeDeploymentManifestValidationReport(report), {
      status: 'blocked',
      serviceCount: 3,
      totalBlockers: 11,
      totalWarnings: 1,
      unsupportedVersion: 1,
      missingServices: 0,
      duplicateServices: 1,
      serviceMetadata: 2,
      invalidWorkspaces: 1,
      commandOrOutput: 3,
      healthChecks: 2,
      requiredEnv: 1,
      servicesWithoutRequiredEnv: 1
    });
  });

  it('blocks empty or unsupported manifests before deploy workflows use them', () => {
    assert.deepEqual(validateDeploymentManifest({ version: 2, services: [] }), {
      status: 'blocked',
      blockers: ['manifest_version_not_supported', 'services_missing'],
      warnings: [],
      serviceNames: []
    });
  });
});
