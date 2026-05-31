/* GroceryView — icon system.
   Clean, geometric, single-weight stroke icons (Feather/Lucide vocabulary)
   tuned for the Bloomberg × Scandinavian look. One <Icon name/> component,
   plus category/sector/product mappers and simple Nordic-cross flags.
   No emoji anywhere. */

const ICON_PATHS = {
  // ---- UI ----
  search: <><circle cx="11" cy="11" r="7" /><line x1="20.5" y1="20.5" x2="16.5" y2="16.5" /></>,
  heart: <path d="M12 20.5C12 20.5 3 15 3 8.8 3 6.1 5 4.2 7.4 4.2c1.7 0 3.2 1 3.9 2.4l.7 1.3.7-1.3c.7-1.4 2.2-2.4 3.9-2.4C21 4.2 21 6.1 21 8.8 21 15 12 20.5 12 20.5z" />,
  heartFill: <path d="M12 20.5C12 20.5 3 15 3 8.8 3 6.1 5 4.2 7.4 4.2c1.7 0 3.2 1 3.9 2.4l.7 1.3.7-1.3c.7-1.4 2.2-2.4 3.9-2.4C21 4.2 21 6.1 21 8.8 21 15 12 20.5 12 20.5z" fill="currentColor" stroke="none" />,
  cart: <><circle cx="9" cy="20" r="1.3" /><circle cx="18" cy="20" r="1.3" /><path d="M2.5 3.5H5l2.1 11.1a1.6 1.6 0 0 0 1.6 1.3h8.6a1.6 1.6 0 0 0 1.6-1.3L21 7.5H6" /></>,
  bell: <><path d="M6 9.5a6 6 0 0 1 12 0c0 4.5 2 5.5 2 5.5H4s2-1 2-5.5z" /><path d="M10 19a2 2 0 0 0 4 0" /></>,
  plus: <><line x1="12" y1="5.5" x2="12" y2="18.5" /><line x1="5.5" y1="12" x2="18.5" y2="12" /></>,
  minus: <line x1="5.5" y1="12" x2="18.5" y2="12" />,
  x: <><line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" /></>,
  check: <polyline points="20 6.5 9.5 17 4 11.5" />,
  arrowRight: <><line x1="4" y1="12" x2="19.5" y2="12" /><polyline points="13.5 5.5 20 12 13.5 18.5" /></>,
  arrowUp: <><line x1="12" y1="20" x2="12" y2="4.5" /><polyline points="5.5 11 12 4.5 18.5 11" /></>,
  arrowDown: <><line x1="12" y1="4" x2="12" y2="19.5" /><polyline points="5.5 13 12 19.5 18.5 13" /></>,
  arrowUpRight: <><line x1="6.5" y1="17.5" x2="17.5" y2="6.5" /><polyline points="8 6.5 17.5 6.5 17.5 16" /></>,
  chevronDown: <polyline points="6 9.5 12 15 18 9.5" />,
  chevronRight: <polyline points="9.5 6 15 12 9.5 18" />,
  chevronLeft: <polyline points="14.5 6 9 12 14.5 18" />,
  mapPin: <><path d="M20 10.5c0 5.5-8 11-8 11s-8-5.5-8-11a8 8 0 0 1 16 0z" /><circle cx="12" cy="10.5" r="2.8" /></>,
  filter: <polygon points="21 4 3 4 10.2 12.5 10.2 19 13.8 21 13.8 12.5" />,
  sliders: <><line x1="4" y1="8" x2="20" y2="8" /><line x1="4" y1="16" x2="20" y2="16" /><circle cx="15" cy="8" r="2.3" /><circle cx="9" cy="16" r="2.3" /></>,
  grid: <><rect x="4" y="4" width="7" height="7" rx="1.2" /><rect x="13" y="4" width="7" height="7" rx="1.2" /><rect x="4" y="13" width="7" height="7" rx="1.2" /><rect x="13" y="13" width="7" height="7" rx="1.2" /></>,
  list: <><line x1="8.5" y1="6.5" x2="20" y2="6.5" /><line x1="8.5" y1="12" x2="20" y2="12" /><line x1="8.5" y1="17.5" x2="20" y2="17.5" /><circle cx="4.5" cy="6.5" r=".6" fill="currentColor" stroke="none" /><circle cx="4.5" cy="12" r=".6" fill="currentColor" stroke="none" /><circle cx="4.5" cy="17.5" r=".6" fill="currentColor" stroke="none" /></>,
  share: <><circle cx="18" cy="5.5" r="2.4" /><circle cx="6" cy="12" r="2.4" /><circle cx="18" cy="18.5" r="2.4" /><line x1="8.1" y1="10.9" x2="15.9" y2="6.6" /><line x1="8.1" y1="13.1" x2="15.9" y2="17.4" /></>,
  download: <><path d="M21 15.5v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3" /><polyline points="7.5 11 12 15.5 16.5 11" /><line x1="12" y1="15.5" x2="12" y2="3.5" /></>,
  info: <><circle cx="12" cy="12" r="9" /><line x1="12" y1="11" x2="12" y2="16.5" /><circle cx="12" cy="7.8" r=".7" fill="currentColor" stroke="none" /></>,
  question: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9.2a2.6 2.6 0 0 1 5 .8c0 1.7-2.5 2-2.5 3.5" /><circle cx="12" cy="16.6" r=".7" fill="currentColor" stroke="none" /></>,
  store: <><path d="M4 10v9a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-9" /><path d="M3 9.5 4.6 4.2A1 1 0 0 1 5.6 3.5h12.8a1 1 0 0 1 1 .7L21 9.5a2.6 2.6 0 0 1-5 .4 2.6 2.6 0 0 1-4 0 2.6 2.6 0 0 1-4 0 2.6 2.6 0 0 1-5-.4z" /></>,
  eye: <><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="3" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 16 14" /></>,
  calendar: <><rect x="3.5" y="5" width="17" height="16" rx="2" /><line x1="3.5" y1="9.5" x2="20.5" y2="9.5" /><line x1="8" y1="3" x2="8" y2="6.5" /><line x1="16" y1="3" x2="16" y2="6.5" /></>,
  swap: <><polyline points="16.5 3 20.5 7 16.5 11" /><path d="M3.5 12.5V11a3.5 3.5 0 0 1 3.5-3.5h13.5" /><polyline points="7.5 21 3.5 17 7.5 13" /><path d="M20.5 11.5V13a3.5 3.5 0 0 1-3.5 3.5H3.5" /></>,
  tag: <><path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0l-7.2-7.2A2 2 0 0 1 2.8 12V4.4a1.6 1.6 0 0 1 1.6-1.6H12a2 2 0 0 1 1.4.6l7.2 7.2a2 2 0 0 1 0 2.8z" /><circle cx="7.2" cy="7.2" r="1.3" /></>,
  target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" /></>,
  pause: <><rect x="6.5" y="5" width="3.5" height="14" rx="1" /><rect x="14" y="5" width="3.5" height="14" rx="1" /></>,
  thumbsUp: <><path d="M7 11v8.5H4.5a1 1 0 0 1-1-1v-6.5a1 1 0 0 1 1-1z" /><path d="M7 11l3.6-7.3a1.8 1.8 0 0 1 2.4 1.6V9h5.2a1.8 1.8 0 0 1 1.78 2.1l-1.1 6A1.8 1.8 0 0 1 18.3 18.6H7" /></>,
  leaf: <><path d="M5 19.5C3.5 13.5 7 4.5 19.5 4c1 11-4.5 15.5-11.5 15.5-1.8 0-2.8-.8-3-.8z" /><path d="M5 19.5C7.5 14 11.5 10.5 17 8.5" /></>,
  scale: <><line x1="12" y1="4.5" x2="12" y2="21" /><line x1="7.5" y1="21" x2="16.5" y2="21" /><line x1="5" y1="7" x2="19" y2="5.5" /><path d="M5 7 2.5 13a3 3 0 0 0 6 0z" /><path d="M19 5.5 16.5 12a3 3 0 0 0 6 0z" /><circle cx="12" cy="4.5" r="1.3" fill="currentColor" stroke="none" /></>,
  truck: <><rect x="1.5" y="6.5" width="13" height="9.5" rx="1.2" /><path d="M14.5 9.5h3.4l3.1 3v3.5h-6.5z" /><circle cx="6" cy="18" r="1.7" /><circle cx="18.5" cy="18" r="1.7" /></>,
  clipboard: <><rect x="5" y="4.5" width="14" height="16.5" rx="2" /><rect x="9" y="2.8" width="6" height="3.6" rx="1.2" /><line x1="8.5" y1="11" x2="15.5" y2="11" /><line x1="8.5" y1="15" x2="13.5" y2="15" /></>,
  box: <><path d="M21 8 12 3 3 8l9 5 9-5z" /><path d="M3 8v8l9 5 9-5V8" /><line x1="12" y1="13" x2="12" y2="21" /></>,
  bolt: <polygon points="13 2.5 4 13.5 11 13.5 10 21.5 20 9.5 13 9.5" />,
  droplet: <path d="M12 3.5s6 6.3 6 10.5a6 6 0 0 1-12 0c0-4.2 6-10.5 6-10.5z" />,
  fuel: <><rect x="4" y="3.5" width="9" height="17" rx="1.5" /><line x1="4" y1="10.5" x2="13" y2="10.5" /><path d="M13 6.5h2.5L18 9v8a2 2 0 0 0 4 0V10l-3-3" /></>,
  pillCapsule: <><rect x="3" y="8.5" width="18" height="7" rx="3.5" /><line x1="12" y1="8.5" x2="12" y2="15.5" /></>,
  tooth: <path d="M6.8 3.2c1.8 0 2.4 1 5.2 1s3.4-1 5.2-1c2 0 3 2 2.4 6-.4 3-1 4-1.5 8-.3 2.2-2.2 2.2-2.5 0l-.6-3.8c-.2-1.3-1.8-1.3-2 0l-.6 3.8c-.3 2.2-2.2 2.2-2.5 0-.5-4-1.1-5-1.5-8-.6-4 .4-6 2.4-6z" />,
  sun: <><circle cx="12" cy="12" r="4" /><line x1="12" y1="2.5" x2="12" y2="5" /><line x1="12" y1="19" x2="12" y2="21.5" /><line x1="2.5" y1="12" x2="5" y2="12" /><line x1="19" y1="12" x2="21.5" y2="12" /><line x1="5.2" y1="5.2" x2="7" y2="7" /><line x1="17" y1="17" x2="18.8" y2="18.8" /><line x1="18.8" y1="5.2" x2="17" y2="7" /><line x1="7" y1="17" x2="5.2" y2="18.8" /></>,
  sparkle: <path d="M12 3l1.9 5.6L19.5 10l-5.6 1.4L12 17l-1.9-5.6L4.5 10l5.6-1.4z" />,
  home: <><path d="M3.5 11 12 3.5 20.5 11" /><path d="M5.5 9.8V20h13V9.8" /></>,
  dashboard: <><rect x="3.5" y="3.5" width="7.5" height="6" rx="1.2" /><rect x="3.5" y="12" width="7.5" height="8.5" rx="1.2" /><rect x="13" y="3.5" width="7.5" height="8.5" rx="1.2" /><rect x="13" y="14.5" width="7.5" height="6" rx="1.2" /></>,
  layers: <><polygon points="12 3 21 8 12 13 3 8" /><polyline points="3 12.5 12 17.5 21 12.5" /></>,
  compass: <><circle cx="12" cy="12" r="9" /><polygon points="15.5 8.5 10.5 10.5 8.5 15.5 13.5 13.5" /></>,
  flame: <path d="M12 3c1 3.5-1.5 4.5-1.5 7 0 1.4 1 2 1 2s-2-.3-2-2.6C7 11 5.5 13 5.5 15.5a6.5 6.5 0 0 0 13 0C18.5 9.5 13 8 12 3z" />,
  trendDown: <><polyline points="3 7 9.5 13.5 13 10 21 18" /><polyline points="21 13 21 18 16 18" /></>,
  trendUp: <><polyline points="3 17 9.5 10.5 13 14 21 6" /><polyline points="21 11 21 6 16 6" /></>,
  bookmark: <path d="M6 4h12v17l-6-4-6 4z" />,
  location: <><circle cx="12" cy="12" r="2.6" /><line x1="12" y1="2.5" x2="12" y2="5.5" /><line x1="12" y1="18.5" x2="12" y2="21.5" /><line x1="2.5" y1="12" x2="5.5" y2="12" /><line x1="18.5" y1="12" x2="21.5" y2="12" /></>,
  panelLeft: <><rect x="3.5" y="4.5" width="17" height="15" rx="2" /><line x1="9.5" y1="4.5" x2="9.5" y2="19.5" /></>,

  // ---- Grocery categories / products ----
  milk: <><path d="M7.5 8 9 4h6l1.5 4v11.5a1 1 0 0 1-1 1H8.5a1 1 0 0 1-1-1z" /><line x1="7.5" y1="8" x2="16.5" y2="8" /><line x1="12" y1="11.5" x2="12" y2="14.5" /></>,
  bread: <><path d="M4.5 12.5a3.8 3.8 0 0 1 3.5-7.5h8a3.8 3.8 0 0 1 3.5 7.5v6a1 1 0 0 1-1 1H5.5a1 1 0 0 1-1-1z" /><line x1="9" y1="9.5" x2="9" y2="18.5" /></>,
  meat: <><path d="M5.5 9.5a6.5 4.5 0 0 1 13 0 6.5 4.5 0 0 1-13 0z" /><path d="M9 9.5a3 2 0 0 1 6 0" /><line x1="12" y1="14" x2="12" y2="20" /></>,
  fish: <><path d="M2.5 12c2.5-3.6 6-4.6 9-4.6 2.2 0 4 .7 5.6 1.7l3.4-2.1v10l-3.4-2.1c-1.6 1-3.4 1.7-5.6 1.7-3 0-6.5-1-9-4.5z" /><circle cx="7" cy="11" r=".7" fill="currentColor" stroke="none" /></>,
  can: <><rect x="6.5" y="5" width="11" height="15" rx="1.5" /><ellipse cx="12" cy="5" rx="5.5" ry="1.6" /><line x1="9" y1="10" x2="15" y2="10" /><line x1="9" y1="13" x2="15" y2="13" /></>,
  candy: <><rect x="4.5" y="4.5" width="15" height="15" rx="2" /><line x1="12" y1="4.5" x2="12" y2="19.5" /><line x1="4.5" y1="12" x2="19.5" y2="12" /></>,
  bottle: <><path d="M10 2.5h4v2.8l1.2 2.2v12a2 2 0 0 1-2 2h-2.4a2 2 0 0 1-2-2v-12L10 5.3z" /><line x1="8.8" y1="12" x2="15.2" y2="12" /></>,
  coffee: <><path d="M4 8h13v5.5a4.5 4.5 0 0 1-4.5 4.5h-4A4.5 4.5 0 0 1 4 13.5z" /><path d="M17 9.5h2.2a2.5 2.5 0 0 1 0 5H17" /><line x1="7" y1="3" x2="7" y2="5.5" /><line x1="11" y1="3" x2="11" y2="5.5" /></>,
  snowflake: <><line x1="12" y1="3" x2="12" y2="21" /><line x1="4" y1="7.5" x2="20" y2="16.5" /><line x1="20" y1="7.5" x2="4" y2="16.5" /></>,
  bowl: <><path d="M3 11.5h18a9 9 0 0 1-18 0z" /><path d="M8.5 11.5c0-2 1-2.8 1-4.5M12 11.5c0-2 1-2.8 1-4.5M15.5 11.5c0-2 1-2.8 1-4.5" /></>,
  sprout: <><path d="M12 21v-7.5" /><path d="M12 14.5C12 9.5 8 7.5 3.5 7.5c0 5 4 7 8.5 7z" /><path d="M12 13.5c0-4 4-6.5 8.5-6.5 0 4-4 6.5-8.5 6.5z" /></>,
  juice: <><path d="M6 4.5h12l-1.4 15.2a1 1 0 0 1-1 .9H8.4a1 1 0 0 1-1-.9z" /><line x1="6.7" y1="9.5" x2="17.3" y2="9.5" /></>,
  rice: <><path d="M7 8.5h10l1 11a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1z" /><path d="M9 8.5c0-2.2 1.3-4 3-4s3 1.8 3 4" /><line x1="9.5" y1="13" x2="14.5" y2="13" /></>,
  butter: <><path d="M4 11l3.5-4h12.5v9.5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" /><line x1="4" y1="11" x2="16.5" y2="11" /><line x1="16.5" y1="11" x2="20" y2="7" /></>,
  lipstick: <><rect x="8.5" y="9.5" width="7" height="10.5" rx="1" /><path d="M9.4 9.5 10.6 3.7a1 1 0 0 1 1-.8h.8a1 1 0 0 1 1 .8l1.2 5.8" /><line x1="8.5" y1="12.5" x2="15.5" y2="12.5" /></>,
  cream: <><rect x="5" y="9" width="14" height="11" rx="2" /><path d="M8 9V7.5a4 4 0 0 1 8 0V9" /><line x1="5" y1="12.5" x2="19" y2="12.5" /></>,
  flower: <><circle cx="12" cy="12" r="2.4" /><path d="M12 9.6c0-3 -1-4.6 0-5.6s2.6.6 0 5.6M12 14.4c0 3 1 4.6 0 5.6s-2.6-.6 0-5.6M9.6 12c-3 0-4.6-1-5.6 0s.6 2.6 5.6 0M14.4 12c3 0 4.6 1 5.6 0s-.6-2.6-5.6 0" /></>,
  spray: <><rect x="8" y="9" width="8" height="11" rx="1.5" /><path d="M10 9V6.5h3.5" /><line x1="15" y1="4" x2="20" y2="4" /><line x1="15" y1="6" x2="19" y2="6" /><line x1="16" y1="5" x2="20" y2="5" /></>
};

// product-slug → icon overrides (else falls back to category)
const PRODUCT_ICON_BY_SLUG = {
  'arla-milk-1l': 'milk',
  'zoegas-coffee-450g': 'coffee',
  'pagen-jattefralla-500g': 'bread',
  'felix-ketchup-1kg': 'can',
  'marabou-mjolkchoklad-200g': 'candy',
  'bregott-normalsaltat-600g': 'butter',
  'kronfagel-kycklingfile-1kg': 'meat',
  'lindahls-kvarg-500g': 'bowl',
  'eldorado-basmati-rice-1kg': 'rice',
  'garant-havregryn-1kg': 'bowl',
  'bravo-apelsinjuice-1l': 'juice',
  'fiskeriet-laxfile-500g': 'fish',
  'bensin-95': 'fuel', 'diesel': 'droplet', 'el-laddning': 'bolt', 'etanol-e85': 'sprout',
  'alvedon-500mg-20': 'pillCapsule', 'ipren-200mg-30': 'pillCapsule',
  'nicorette-2mg-30': 'leaf', 'd-vitamin-2000': 'sun', 'sensodyne-toothpaste': 'tooth',
  'omega3-90': 'droplet',
  'cerave-moisturising-cream-340': 'cream', 'ordinary-niacinamide-30': 'droplet',
  'maybelline-sky-high-mascara': 'lipstick', 'loreal-revitalift-serum-30': 'droplet',
  'olaplex-no3-100': 'spray', 'garnier-micellar-400': 'spray', 'nyx-foundation': 'cream',
  'lancome-la-vie-est-belle-50': 'flower', 'nivea-body-lotion-400': 'cream', 'lyko-daily-shampoo-500': 'spray'
};

const CATEGORY_ICON = {
  dairy: 'milk', bread: 'bread', meat: 'meat', fish: 'fish', produce: 'leaf',
  pantry: 'can', snacks: 'candy', beverages: 'bottle', frozen: 'snowflake',
  breakfast: 'bowl', coffee: 'coffee', 'plant-based': 'sprout',
  pain: 'pillCapsule', vitamins: 'sun', wellness: 'leaf', oral: 'tooth',
  skincare: 'cream', makeup: 'lipstick', haircare: 'spray', fragrance: 'flower', bodycare: 'droplet'
};

const SECTOR_ICON = { groceries: 'cart', fuel: 'fuel', pharmacy: 'pillCapsule', beauty: 'lipstick' };

function Icon({ name, size = 18, stroke = 1.75, className = '', style, title }) {
  const inner = ICON_PATHS[name];
  if (!inner) return null;
  // wrap so we can apply data-fill children as filled
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
    className={'gv-icon ' + className} style={{ display: 'block', flexShrink: 0, ...style }}
    aria-hidden={title ? undefined : 'true'} role={title ? 'img' : undefined}>
      {title && <title>{title}</title>}
      {inner}
    </svg>);

}

function iconForProduct(p) {
  if (!p) return 'box';
  return PRODUCT_ICON_BY_SLUG[p.slug] || CATEGORY_ICON[p.category] || 'box';
}
function iconForCategory(slug) {return CATEGORY_ICON[slug] || 'box';}
function iconForSector(id) {return SECTOR_ICON[id] || 'box';}

// generated studio placeholder photos live at images/ph-<icon>.png
const PLACEHOLDER_ICONS = new Set(['milk','coffee','bread','can','candy','butter','meat','bowl','rice','juice','fish','bottle','snowflake','sprout','leaf','fuel','droplet','bolt','pillCapsule','sun','tooth','box','cream','lipstick','spray','flower']);
function imageForProduct(p) {
  if (p && p.image) return p.image;             // real photo wins if one is ever added
  const ic = iconForProduct(p);
  return 'images/ph-' + (PLACEHOLDER_ICONS.has(ic) ? ic : 'box') + '.png';
}

// ---- Nordic-cross flags (simple rects, real flag colors) ----
const FLAG_DEFS = {
  SE: { bg: '#005293', a: '#FECB00' }, // blue + gold cross
  NO: { bg: '#BA0C2F', a: '#FFFFFF', b: '#00205B' }, // red + white + blue
  IS: { bg: '#02529C', a: '#FFFFFF', b: '#DC1E35' } // blue + white + red
};
function Flag({ code, size = 18, radius = 2.5 }) {
  const d = FLAG_DEFS[code] || FLAG_DEFS.SE;
  const W = 24,H = 16,vx = 7,vw = 3.4,hy = 6.3,hh = 3.4; // cross geometry
  return (
    <svg width={size * 1.5} height={size} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', borderRadius: radius, flexShrink: 0 }} aria-label={code}>
      <rect width={W} height={H} fill={d.bg} />
      {d.b ?
      <>
          <rect x={vx - 0.6} y="0" width={vw + 1.2} height={H} fill={d.a} />
          <rect x="0" y={hy - 0.6} width={W} height={hh + 1.2} fill={d.a} />
          <rect x={vx + 0.6} y="0" width={vw - 1.2} height={H} fill={d.b} />
          <rect x="0" y={hy + 0.6} width={W} height={hh - 1.2} fill={d.b} />
        </> :

      <>
          <rect x={vx} y="0" width={vw} height={H} fill={d.a} />
          <rect x="0" y={hy} width={W} height={hh} fill={d.a} />
        </>
      }
    </svg>);

}

Object.assign(window, { Icon, Flag, iconForProduct, iconForCategory, iconForSector, imageForProduct, ICON_PATHS, CATEGORY_ICON });