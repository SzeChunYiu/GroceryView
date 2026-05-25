# Cross-chain savings study: when switching chains pays off

## Scope and method

- Evidence set: `apps/web/src/lib/ingested/apohem.ts`, generated from public Apohem SSR rows and Apotek Hjärtat public search HTML, retrieved `2026-05-24T22:08:49.876Z`.
- Row base: 3,417 real OTC, supplement, and beauty pharmacy rows; prescription products are excluded by the generator comment in the same file.
- Match rule: exact EAN only. A saving is reported only when both chains have an observed row for the same EAN.
- Savings formula: `(higher observed price - lower observed price) / higher observed price`.
- Coverage note: the current checked-in observed pharmacy set covers Apohem and Apotek Hjärtat. It does not include a comparable DocMorris or Apoteket.se production observation table, so this study does not invent those scenarios.

## Biggest exact-EAN switch opportunities

| Scenario | Exact EAN | Switch from | Switch to | Observed saving | Evidence rows |
| --- | --- | ---: | ---: | ---: | --- |
| Hawaiian Tropic Glowing Protection Lotion SPF30 170 ml | `5099821002800` | Apohem `159.00 SEK` | Apotek Hjärtat `91.50 SEK` | `67.50 SEK` / `42.5%` | `apps/web/src/lib/ingested/apohem.ts:634` and `:3713`; source URLs `apohem.se/sok?q=solskydd`, `apotekhjartat.se/search?q=solskydd` |
| Elexir Pharma Kalcium Magnesium 120 tabletter | `7350023031059` | Apotek Hjärtat `132.00 SEK` | Apohem `83.00 SEK` | `49.00 SEK` / `37.1%` | `apps/web/src/lib/ingested/apohem.ts:1157` and `:5955`; source URLs `apohem.se/sok?q=magnesium`, `apotekhjartat.se/search?q=magnesium` |
| Holistic Elektrolyter Citrusfrukter 140 g | `7350012338510` | Apotek Hjärtat `188.00 SEK` | Apohem `128.00 SEK` | `60.00 SEK` / `31.9%` | `apps/web/src/lib/ingested/apohem.ts:110` and `:2573`; source URLs `apohem.se/sok?q=vitamin`, `apotekhjartat.se/search?q=magnesium` |
| Löwengrip Count On Me Deodorant 50 ml | `7350073862450` | Apotek Hjärtat `115.00 SEK` | Apohem `79.00 SEK` | `36.00 SEK` / `31.3%` | `apps/web/src/lib/ingested/apohem.ts:2340` and `:13251`; source URLs `apohem.se/sok?q=deodorant`, `apotekhjartat.se/search?q=deodorant` |
| CCS Aloe Vera Burn Gel / Burn gel 50 ml | `7315980220557` | Apohem `106.00 SEK` | Apotek Hjärtat `74.25 SEK` | `31.75 SEK` / `30.0%` | `apps/web/src/lib/ingested/apohem.ts:1897` and `:10686`; source URLs `apohem.se/sok?q=brannskada`, `apotekhjartat.se/search?q=sarvard` |
| EVY Sunscreen Mousse SPF 30 150 ml | `5694230167029` | Apohem `247.00 SEK` | Apotek Hjärtat `180.75 SEK` | `66.25 SEK` / `26.8%` | `apps/web/src/lib/ingested/apohem.ts:711` and `:3865`; source URLs `apohem.se/sok?q=solskydd`, `apotekhjartat.se/search?q=solskydd` |
| Abilar 10% Sårsalva 20 g | `6430028950010` | Apotek Hjärtat `199.00 SEK` | Apohem `149.00 SEK` | `50.00 SEK` / `25.1%` | `apps/web/src/lib/ingested/apohem.ts:1952` and `:10895`; source URLs `apohem.se/sok?q=brannskada`, `apotekhjartat.se/search?q=sarvard` |
| Physiomer Strong Jet 210 ml | `7319861011500` | Apohem `99.00 SEK` | Apotek Hjärtat `76.00 SEK` | `23.00 SEK` / `23.2%` | `apps/web/src/lib/ingested/apohem.ts:1382` and `:7608`; source URLs `apohem.se/sok?q=forkylning`, `apotekhjartat.se/search?q=forkylning` |
| BioSalma Multivitamin D3++ Kvinna 100 tabletter | `7350014910547` | Apotek Hjärtat `75.00 SEK` | Apohem `60.00 SEK` | `15.00 SEK` / `20.0%` | `apps/web/src/lib/ingested/apohem.ts:120` and `:2592`; source URLs `apohem.se/sok?q=vitamin`, `apotekhjartat.se/search?q=vitamin` |
| Dr. Baddaky Omega-3 1 liter / 1000 ml | `7090012490015` | Apotek Hjärtat `529.00 SEK` | Apohem `423.00 SEK` | `106.00 SEK` / `20.0%` | `apps/web/src/lib/ingested/apohem.ts:1069` and `:5632`; source URLs `apohem.se/sok?q=omega`, `apotekhjartat.se/search?q=omega` |

## Customer scenarios

1. **Sun care baskets:** check Apotek Hjärtat first for Hawaiian Tropic and EVY SPF rows. Exact-EAN matches show `42.5%` and `26.8%` savings versus the Apohem rows above.
2. **Supplement top-ups:** check Apohem first for Elexir, Holistic, BioSalma, and Dr. Baddaky rows. The exact-EAN evidence above ranges from `20.0%` to `37.1%` savings versus Apotek Hjärtat.
3. **Wound, burn, and nasal-care items:** compare both chains before checkout. The CCS burn gel row favours Apotek Hjärtat by `30.0%`, while the Abilar wound salve row favours Apohem by `25.1%`.
4. **Personal-care replenishment:** Apohem is cheaper for the Löwengrip deodorant row by `31.3%`; Apotek Hjärtat is cheaper for the Physiomer nasal rinse row by `23.2%`.

## Guardrails for product copy

- Say "observed in the checked-in pharmacy ingest" rather than "always cheaper"; these are point-in-time observations from `2026-05-24`.
- Keep recommendations EAN-bound. Similar names with different pack sizes are excluded unless the EAN matches.
- Do not mention DocMorris or Apoteket.se switch savings until production observation rows for those chains are checked in with product identifiers and prices.
