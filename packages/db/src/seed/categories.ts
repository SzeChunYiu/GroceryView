import { pathToFileURL } from 'node:url';

export type SwedishGroceryCategoryChild = {
  name: string;
  slug: string;
};

export type SwedishGroceryCategoryNode = SwedishGroceryCategoryChild & {
  children: SwedishGroceryCategoryChild[];
};

export type SwedishGroceryCategorySeedRow = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
};

type CategoryUpsertArgs = {
  where: { id: string };
  update: {
    name: string;
    slug: string;
    parentId: string | null;
  };
  create: SwedishGroceryCategorySeedRow;
};

export type CategoryPrismaClient = {
  category: {
    upsert(args: CategoryUpsertArgs): Promise<unknown>;
  };
  $disconnect?: () => Promise<void>;
};

export type SwedishGroceryCategorySeedResult = {
  insertedOrUpdated: number;
};

export const swedishGroceryCategoryTree = [
  {
    name: 'Mejeri',
    slug: 'mejeri',
    children: [
      { name: 'Mjölk', slug: 'mjolk' },
      { name: 'Fil & Yoghurt', slug: 'fil-yoghurt' },
      { name: 'Ost', slug: 'ost' },
      { name: 'Smör & Margarin', slug: 'smor-margarin' },
      { name: 'Grädde', slug: 'gradde' },
      { name: 'Ägg', slug: 'agg' },
      { name: 'Laktosfritt', slug: 'laktosfritt' }
    ]
  },
  {
    name: 'Kött & Chark',
    slug: 'kott-chark',
    children: [
      { name: 'Nötkött', slug: 'notkott' },
      { name: 'Fläskkött', slug: 'flaskkott' },
      { name: 'Kyckling', slug: 'kyckling' },
      { name: 'Färs', slug: 'fars' },
      { name: 'Korv', slug: 'korv' },
      { name: 'Pålägg', slug: 'palagg' },
      { name: 'Bacon', slug: 'bacon' }
    ]
  },
  {
    name: 'Fisk & Skaldjur',
    slug: 'fisk-skaldjur',
    children: [
      { name: 'Färsk fisk', slug: 'farsk-fisk' },
      { name: 'Fryst fisk', slug: 'fryst-fisk' },
      { name: 'Räkor', slug: 'rakor' },
      { name: 'Sill', slug: 'sill' },
      { name: 'Lax', slug: 'lax' },
      { name: 'Skaldjur', slug: 'skaldjur' }
    ]
  },
  {
    name: 'Frukt & Grönt',
    slug: 'frukt-gront',
    children: [
      { name: 'Frukt', slug: 'frukt' },
      { name: 'Bär', slug: 'bar' },
      { name: 'Grönsaker', slug: 'gronsaker' },
      { name: 'Rotfrukter', slug: 'rotfrukter' },
      { name: 'Sallad', slug: 'sallad' },
      { name: 'Örter', slug: 'orter' },
      { name: 'Ekologiskt grönt', slug: 'ekologiskt-gront' }
    ]
  },
  {
    name: 'Bröd & Bageri',
    slug: 'brod-bageri',
    children: [
      { name: 'Bröd', slug: 'brod' },
      { name: 'Knäckebröd', slug: 'knackebrod' },
      { name: 'Fikabröd', slug: 'fikabrod' },
      { name: 'Kakor & Kex', slug: 'kakor-kex' },
      { name: 'Tortilla & Wraps', slug: 'tortilla-wraps' }
    ]
  },
  {
    name: 'Skafferi',
    slug: 'skafferi',
    children: [
      { name: 'Pasta', slug: 'pasta' },
      { name: 'Ris & Gryner', slug: 'ris-gryner' },
      { name: 'Mjöl & Bakning', slug: 'mjol-bakning' },
      { name: 'Konserver', slug: 'konserver' },
      { name: 'Såser & Kryddor', slug: 'saser-kryddor' },
      { name: 'Olja & Vinäger', slug: 'olja-vinager' },
      { name: 'Frukostflingor', slug: 'frukostflingor' },
      { name: 'Sylt & Honung', slug: 'sylt-honung' }
    ]
  },
  {
    name: 'Fryst',
    slug: 'fryst',
    children: [
      { name: 'Fryst färdigmat', slug: 'fryst-fardigmat' },
      { name: 'Glass', slug: 'glass' },
      { name: 'Frysta grönsaker', slug: 'frysta-gronsaker' },
      { name: 'Fryst kött', slug: 'fryst-kott' },
      { name: 'Fryst bröd', slug: 'fryst-brod' },
      { name: 'Frysta bär', slug: 'frysta-bar' }
    ]
  },
  {
    name: 'Dryck',
    slug: 'dryck',
    children: [
      { name: 'Kaffe', slug: 'kaffe' },
      { name: 'Te', slug: 'te' },
      { name: 'Läsk', slug: 'lask' },
      { name: 'Juice', slug: 'juice' },
      { name: 'Vatten', slug: 'vatten' },
      { name: 'Saft', slug: 'saft' },
      { name: 'Energidryck', slug: 'energidryck' }
    ]
  },
  {
    name: 'Snacks & Godis',
    slug: 'snacks-godis',
    children: [
      { name: 'Chips', slug: 'chips' },
      { name: 'Nötter', slug: 'notter' },
      { name: 'Choklad', slug: 'choklad' },
      { name: 'Godis', slug: 'godis' },
      { name: 'Popcorn', slug: 'popcorn' },
      { name: 'Bars', slug: 'bars' }
    ]
  },
  {
    name: 'Färdigmat',
    slug: 'fardigmat',
    children: [
      { name: 'Kyld färdigmat', slug: 'kyld-fardigmat' },
      { name: 'Sallader & Deli', slug: 'sallader-deli' },
      { name: 'Soppor', slug: 'soppor' },
      { name: 'Pizza', slug: 'pizza' },
      { name: 'Asiatiskt', slug: 'asiatiskt' },
      { name: 'Texmex', slug: 'texmex' }
    ]
  },
  {
    name: 'Vegetariskt & Veganskt',
    slug: 'vegetariskt-veganskt',
    children: [
      { name: 'Vegofärs', slug: 'vegofars' },
      { name: 'Tofu', slug: 'tofu' },
      { name: 'Växtbaserad dryck', slug: 'vaxtbaserad-dryck' },
      { name: 'Vegopålägg', slug: 'vegopalagg' },
      { name: 'Veganska måltider', slug: 'veganska-maltider' }
    ]
  },
  {
    name: 'Barn & Baby',
    slug: 'barn-baby',
    children: [
      { name: 'Barnmat', slug: 'barnmat' },
      { name: 'Välling & Gröt', slug: 'valling-grot' },
      { name: 'Blöjor', slug: 'blojor' },
      { name: 'Barnsnacks', slug: 'barnsnacks' },
      { name: 'Babyvård', slug: 'babyvard' }
    ]
  },
  {
    name: 'Hushåll',
    slug: 'hushall',
    children: [
      { name: 'Städning', slug: 'stadning' },
      { name: 'Tvätt', slug: 'tvatt' },
      { name: 'Papper', slug: 'papper' },
      { name: 'Disk', slug: 'disk' },
      { name: 'Batterier', slug: 'batterier' },
      { name: 'Ljus & Servetter', slug: 'ljus-servetter' }
    ]
  },
  {
    name: 'Hygien & Hälsa',
    slug: 'hygien-halsa',
    children: [
      { name: 'Hudvård', slug: 'hudvard' },
      { name: 'Hårvård', slug: 'harvard' },
      { name: 'Tandvård', slug: 'tandvard' },
      { name: 'Deodorant', slug: 'deodorant' },
      { name: 'Mensskydd', slug: 'mensskydd' },
      { name: 'Apotek', slug: 'apotek' }
    ]
  },
  {
    name: 'Djurmat',
    slug: 'djurmat',
    children: [
      { name: 'Kattmat', slug: 'kattmat' },
      { name: 'Hundmat', slug: 'hundmat' },
      { name: 'Smådjur', slug: 'smadjur' },
      { name: 'Djurtillbehör', slug: 'djurtillbehor' }
    ]
  },
  {
    name: 'Specialkost',
    slug: 'specialkost',
    children: [
      { name: 'Glutenfritt', slug: 'glutenfritt' },
      { name: 'Sockerfritt', slug: 'sockerfritt' },
      { name: 'Protein & Kosttillskott', slug: 'protein-kosttillskott' },
      { name: 'Ekologiskt skafferi', slug: 'ekologiskt-skafferi' },
      { name: 'Allergivänligt', slug: 'allergivanligt' }
    ]
  }
] satisfies SwedishGroceryCategoryNode[];

export function flattenSwedishGroceryCategories(
  tree: readonly SwedishGroceryCategoryNode[] = swedishGroceryCategoryTree
): SwedishGroceryCategorySeedRow[] {
  return tree.flatMap((parent) => [
    {
      id: parent.slug,
      name: parent.name,
      slug: parent.slug,
      parentId: null
    },
    ...parent.children.map((child) => ({
      id: `${parent.slug}/${child.slug}`,
      name: child.name,
      slug: child.slug,
      parentId: parent.slug
    }))
  ]);
}

export async function seedSwedishGroceryCategories(
  prisma: CategoryPrismaClient,
  rows: readonly SwedishGroceryCategorySeedRow[] = flattenSwedishGroceryCategories()
): Promise<SwedishGroceryCategorySeedResult> {
  for (const row of rows) {
    await prisma.category.upsert({
      where: { id: row.id },
      update: {
        name: row.name,
        slug: row.slug,
        parentId: row.parentId
      },
      create: row
    });
  }

  return { insertedOrUpdated: rows.length };
}

async function main(): Promise<void> {
  const prismaModuleName = '@prisma/client';
  const { PrismaClient } = (await import(prismaModuleName)) as {
    PrismaClient: new () => CategoryPrismaClient;
  };
  const prisma = new PrismaClient();

  try {
    const result = await seedSwedishGroceryCategories(prisma);
    console.log(`Seeded ${result.insertedOrUpdated} Swedish grocery categories.`);
  } finally {
    await prisma.$disconnect?.();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    console.error('Failed to seed Swedish grocery categories.');
    console.error(error);
    process.exitCode = 1;
  });
}
