# Security Policy

GroceryView is pre-1.0 software. This policy explains what is currently
supported, how to report a vulnerability, and how maintainers handle disclosure.

## Supported versions

| Version or branch | Supported? | Notes |
| --- | --- | --- |
| `main` / the currently deployed GroceryView service | Yes | Security fixes target the active codebase and current deployment first. |
| Open pull-request branches | Limited | Report issues if they could ship to users or expose secrets/data during review. |
| Older commits, forks, or archived deployments | No | Please reproduce on `main` before reporting when possible. |

Because the project does not publish stable release lines yet, there are no
long-term-support branches. If that changes, this table should be updated with
the supported release range and maintenance dates.

## Reporting a vulnerability

Please report suspected vulnerabilities privately before opening a public issue
or pull request with exploit details.

1. Use GitHub's **Report a vulnerability** flow for this repository if it is
   available to you.
2. If private reporting is not available, open a GitHub issue with a minimal
   title such as `Security report` and ask maintainers to arrange a private
   channel. Do not include secrets, exploit payloads, personal data, or detailed
   reproduction steps in the public issue.

Helpful private reports include:

- the affected component, route, package, or deployment;
- a concise impact summary;
- safe reproduction steps or a proof of concept;
- any logs, timestamps, request IDs, or environment details needed to verify the
  issue; and
- whether the issue is already public or shared with any third party.

Please do not run destructive tests, access data that is not yours, persist
access after verification, or degrade service availability while investigating a
suspected vulnerability.

## Disclosure and response policy

Maintainers aim to triage private reports, confirm impact, prepare a fix, and
coordinate disclosure in good faith. Exact response and fix timelines depend on
severity, reproducibility, deployment risk, and maintainer availability.

Public disclosure should wait until maintainers have had a reasonable
opportunity to investigate and ship a fix. If a report affects user data,
credentials, production infrastructure, or active exploitation is suspected,
maintainers may prioritize mitigation before publishing technical details.

## Bounty policy

GroceryView does not currently run a paid bug bounty or rewards program. Reports
are appreciated, but no payment, swag, or other reward is promised by this
policy.
