import assert from 'node:assert/strict';
import test from 'node:test';
import { extractCutPreparation, normalizeCutInput } from '../lib/extractors/cut.js';
import type { CutPreparation } from '../lib/extractors/cut.js';

type Fixture = readonly [string, CutPreparation];

function asFixtures(names: string[], expected: CutPreparation): Fixture[] {
  return names.map((name): Fixture => [name, expected]);
}

const beefTenderloin = asFixtures([
  'Oxfilé', 'oxfile', 'Ox filé', 'ox filén', 'Nötfilé', 'Nöt filé bit', 'notfile',
  'beef tenderloin', 'fillet of beef', 'Ekologisk oxfilé 500g', 'fryst oxfilé',
  'oxfiléer', 'oxfiléerna', 'hel oxfilé', 'ox-file', 'premium oxfilé'
], { animal: 'beef', cut: 'tenderloin', preparation: 'fillet' });

const beefRibeye = asFixtures([
  'Ribeye', 'rib eye', 'ribeye steak', 'Rib eye steak', 'beef ribeye', 'entrecôte',
  'entrecote', 'entrecoten', 'entrecote stek', 'entrecôte stek', 'entrecote-steak',
  'grillad ribeye', 'mörad ribeye', 'Angus ribeye', 'stor entrecote', 'färsk entrecôte'
], { animal: 'beef', cut: 'ribeye', preparation: 'steak' });

const falukorv = asFixtures([
  'Falukorv', 'falukorv', 'falukorven', 'falu korv', 'Falu korv', 'falu-korv',
  'falu sausage', 'Swedish sausage', 'Scan falukorv 800g', 'ring falukorv',
  'klassisk falukorv', 'lättrökt falukorv', 'falukorv skivad', 'falu korv bit',
  'falukorv extra kött', 'stor falukorv'
], { animal: 'mixed', cut: 'sausage', preparation: 'sausage' });

const porkCollarSteaks = asFixtures([
  'Fläskkarré', 'fläskkarré', 'fläsk karre', 'flaskkarre', 'karré', 'karre',
  'fläskkarrén', 'pork collar', 'pork neck', 'nakkekotelett', 'nakkekoteletten',
  'benfri fläskkarré', 'marinerad fläskkarré', 'grillkarré', 'svensk fläskkarré'
], { animal: 'pork', cut: 'pork_collar', preparation: 'steak' });

const porkCollarSliced = asFixtures([
  'skivad fläskkarré', 'fläskkarré skivor', 'sliced pork neck', 'sliced pork collar',
  'skivad karre', 'skivad karré', 'flaskkarre skivor', 'grill skivad fläskkarré'
], { animal: 'pork', cut: 'pork_collar', preparation: 'sliced' });

const chickenBreast = asFixtures([
  'Kycklingfilé', 'kycklingfile', 'kyckling filé', 'kyckling filen', 'kycklingfiléer',
  'kycklingfiléerna', 'kycklingbröst', 'kycklingbröstet', 'kyckling bröst filé',
  'kycklingbröstfilé', 'chicken fillet', 'chicken fillets', 'chicken breast',
  'chicken breasts', 'fryst kycklingfilé', 'svensk kycklingfilé'
], { animal: 'chicken', cut: 'chicken_breast', preparation: 'fillet' });

const chickenThigh = asFixtures([
  'Kycklinglårfilé', 'kycklinglarfile', 'kyckling lår filé', 'kyckling lår filen',
  'kycklinglårfiléer', 'kycklinglårfiléerna', 'lårfilé', 'lår filé',
  'chicken thigh fillet', 'chicken thigh fillets', 'boneless chicken thigh',
  'boneless chicken thighs', 'marinerad kycklinglårfilé', 'grillad lårfilé',
  'fryst kycklinglårfilé', 'svensk kyckling lårfilé'
], { animal: 'chicken', cut: 'chicken_thigh', preparation: 'fillet' });

const chickenWing = asFixtures([
  'Kycklingvinge', 'kycklingvinge', 'kycklingvingar', 'kycklingvingarna',
  'kyckling vinge', 'kyckling vingar', 'chicken wing', 'chicken wings', 'wings',
  'grillade wings', 'frysta kycklingvingar', 'buffalo chicken wings',
  'marinerade kycklingvingar', 'svenska kyckling vingar', 'vingar kyckling'
], { animal: 'chicken', cut: 'chicken_wing', preparation: 'whole' });

const fixtures: Fixture[] = [
  ...beefTenderloin,
  ...beefRibeye,
  ...falukorv,
  ...porkCollarSteaks,
  ...porkCollarSliced,
  ...chickenBreast,
  ...chickenThigh,
  ...chickenWing
];

test('cut extractor covers 100+ Swedish meat naming fixtures', () => {
  assert.ok(fixtures.length >= 100, `expected at least 100 fixtures, got ${fixtures.length}`);

  for (const [name, expected] of fixtures) {
    assert.deepEqual(extractCutPreparation(name), expected, name);
  }
});

test('cut extractor normalizes Swedish diacritics before matching', () => {
  assert.equal(normalizeCutInput('Fläskkarré & Kycklinglårfilé'), 'flaskkarre kycklinglarfile');
});

test('cut extractor returns null when no supported meat cut is visible', () => {
  assert.equal(extractCutPreparation('ekologiska bananer 1 kg'), null);
});
