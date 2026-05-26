export type InternalCategoryMapping = {
  categoryId: string;
  categoryPath: string[];
  confidence: 'direct' | 'prefix' | 'fallback';
};

type WillysCategoryRule = {
  internal: string;
  path: string[];
  patterns: RegExp[];
};

const fallbackCategory: InternalCategoryMapping = {
  categoryId: 'skafferi',
  categoryPath: ['Skafferi'],
  confidence: 'fallback'
};

const willysCategoryRules: WillysCategoryRule[] = [
  rule('kott-chark/kyckling', ['Kött & Chark', 'Kyckling'], /kott.*chark.*fagel/, /fagel/, /kyckling/),
  rule('kott-chark/notkott', ['Kött & Chark', 'Nötkött'], /not.*kalv/, /notkott/),
  rule('kott-chark/flaskkott', ['Kött & Chark', 'Fläskkött'], /flask/, /flaskkott/),
  rule('kott-chark/fars', ['Kött & Chark', 'Färs'], /kottfars/, /fars/),
  rule('kott-chark/korv', ['Kött & Chark', 'Korv'], /korv/),
  rule('kott-chark/chark', ['Kött & Chark', 'Chark'], /chark/),
  rule('fisk-skaldjur/farsk-fisk', ['Fisk & Skaldjur', 'Färsk fisk'], /farsk.*fisk/),
  rule('fisk-skaldjur/fryst-fisk', ['Fisk & Skaldjur', 'Fryst fisk'], /fryst.*fisk/),
  rule('fisk-skaldjur/skaldjur', ['Fisk & Skaldjur', 'Skaldjur'], /skaldjur/, /rakor/),
  rule('frukt-gront/frukt', ['Frukt & Grönt', 'Frukt'], /frukt/),
  rule('frukt-gront/bar', ['Frukt & Grönt', 'Bär'], /bar/),
  rule('frukt-gront/gronsaker', ['Frukt & Grönt', 'Grönsaker'], /gronsaker/, /gront/),
  rule('frukt-gront/rotfrukter', ['Frukt & Grönt', 'Rotfrukter'], /rotfrukter/, /potatis/),
  rule('frukt-gront/sallad', ['Frukt & Grönt', 'Sallad'], /sallad/),
  rule('mejeri/mjolk', ['Mejeri', 'Mjölk'], /mjolk/),
  rule('mejeri/fil-yoghurt', ['Mejeri', 'Fil & Yoghurt'], /fil/, /yoghurt/, /yogurt/),
  rule('mejeri/ost', ['Mejeri', 'Ost'], /ost/),
  rule('mejeri/smor-margarin', ['Mejeri', 'Smör & Margarin'], /smor/, /margarin/),
  rule('mejeri/gradde', ['Mejeri', 'Grädde'], /gradde/),
  rule('mejeri/agg', ['Mejeri', 'Ägg'], /agg/),
  rule('mejeri/laktosfritt', ['Mejeri', 'Laktosfritt'], /laktosfri/),
  rule('brod-bageri/brod', ['Bröd & Bageri', 'Bröd'], /brod/),
  rule('brod-bageri/knackebrod', ['Bröd & Bageri', 'Knäckebröd'], /knackebrod/),
  rule('brod-bageri/fikabrod', ['Bröd & Bageri', 'Fikabröd'], /fikabrod/, /bullar/, /bakverk/),
  rule('skafferi/pasta', ['Skafferi', 'Pasta'], /pasta/, /nudlar/),
  rule('skafferi/ris-gryner', ['Skafferi', 'Ris & Gryner'], /ris/, /gryner/, /bulgur/, /couscous/),
  rule('skafferi/mjol-bakning', ['Skafferi', 'Mjöl & Bakning'], /mjol/, /bakning/, /socker/),
  rule('skafferi/konserver', ['Skafferi', 'Konserver'], /konserv/),
  rule('skafferi/saser-kryddor', ['Skafferi', 'Såser & Kryddor'], /sas/, /krydd/, /buljong/),
  rule('skafferi/olja-vinager', ['Skafferi', 'Olja & Vinäger'], /olja/, /vinager/),
  rule('skafferi/frukostflingor', ['Skafferi', 'Frukostflingor'], /flingor/, /musli/),
  rule('fryst/fryst-fardigmat', ['Fryst', 'Fryst färdigmat'], /fryst.*fardig/, /fryst.*pizza/),
  rule('fryst/glass', ['Fryst', 'Glass'], /glass/),
  rule('fryst/frysta-gronsaker', ['Fryst', 'Frysta grönsaker'], /frysta.*gronsaker/),
  rule('dryck/kaffe', ['Dryck', 'Kaffe'], /kaffe/),
  rule('dryck/te', ['Dryck', 'Te'], /\bte\b/),
  rule('dryck/lask', ['Dryck', 'Läsk'], /lask/, /cola/),
  rule('dryck/juice', ['Dryck', 'Juice'], /juice/),
  rule('dryck/vatten', ['Dryck', 'Vatten'], /vatten/),
  rule('snacks-godis/chips', ['Snacks & Godis', 'Chips'], /chips/, /snacks/),
  rule('snacks-godis/notter', ['Snacks & Godis', 'Nötter'], /notter/),
  rule('snacks-godis/choklad', ['Snacks & Godis', 'Choklad'], /choklad/),
  rule('snacks-godis/godis', ['Snacks & Godis', 'Godis'], /godis/, /konfektyr/),
  rule('fardigmat/kyld-fardigmat', ['Färdigmat', 'Kyld färdigmat'], /kyld.*fardig/, /fardigmat/),
  rule('fardigmat/sallader-deli', ['Färdigmat', 'Sallader & Deli'], /deli/, /sallad/),
  rule('fardigmat/texmex', ['Färdigmat', 'Texmex'], /texmex/, /taco/),
  rule('vegetariskt-veganskt/vegofars', ['Vegetariskt & Veganskt', 'Vegofärs'], /vegofars/),
  rule('vegetariskt-veganskt/tofu', ['Vegetariskt & Veganskt', 'Tofu'], /tofu/),
  rule('vegetariskt-veganskt/vaxtbaserad-dryck', ['Vegetariskt & Veganskt', 'Växtbaserad dryck'], /vaxtbaserad.*dryck/, /havredryck/),
  rule('barn-baby/barnmat', ['Barn & Baby', 'Barnmat'], /barnmat/),
  rule('barn-baby/blojor', ['Barn & Baby', 'Blöjor'], /blojor/),
  rule('hushall/stadning', ['Hushåll', 'Städning'], /stad/, /rengoring/),
  rule('hushall/tvatt', ['Hushåll', 'Tvätt'], /tvatt/),
  rule('hushall/papper', ['Hushåll', 'Papper'], /papper/, /toalett/, /hushallspapper/),
  rule('hygien-halsa/hudvard', ['Hygien & Hälsa', 'Hudvård'], /hudvard/),
  rule('hygien-halsa/harvard', ['Hygien & Hälsa', 'Hårvård'], /harvard/, /schampo/),
  rule('hygien-halsa/tandvard', ['Hygien & Hälsa', 'Tandvård'], /tand/),
  rule('djurmat/kattmat', ['Djurmat', 'Kattmat'], /katt/),
  rule('djurmat/hundmat', ['Djurmat', 'Hundmat'], /hund/)
];

export function mapWillysCategoryToInternal(value: string | null | undefined): InternalCategoryMapping {
  const normalized = normalizeCategory(value ?? '');
  if (!normalized) return fallbackCategory;

  for (const candidate of willysCategoryRules) {
    if (candidate.patterns.some((pattern) => pattern.test(normalized))) {
      return {
        categoryId: candidate.internal,
        categoryPath: candidate.path,
        confidence: normalized.includes(candidate.internal.replace('/', ' ')) ? 'direct' : 'prefix'
      };
    }
  }

  return fallbackCategory;
}

function rule(internal: string, path: string[], ...patterns: RegExp[]): WillysCategoryRule {
  return { internal, path, patterns };
}

function normalizeCategory(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' och ')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .toLowerCase();
}
