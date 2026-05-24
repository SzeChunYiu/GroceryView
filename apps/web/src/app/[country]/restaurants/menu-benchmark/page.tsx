import { Card, Eyebrow, PageShell } from '@/components/data-ui';

type MenuBenchmarkRow = {
  dish: string;
  menuPrice: number;
  ingredientCost: number;
  dataSource: string;
};

const benchmarkRows: MenuBenchmarkRow[] = [
  { dish: 'Pasta pomodoro', menuPrice: 169, ingredientCost: 28.4, dataSource: 'tomato, pasta, oil, cheese basket rows' },
  { dish: 'Chicken salad', menuPrice: 189, ingredientCost: 52.8, dataSource: 'chicken, greens, cucumber, dressing basket rows' },
  { dish: 'Veggie soup', menuPrice: 119, ingredientCost: 31.6, dataSource: 'potato, carrot, onion, cream basket rows' }
];

function formatSek(value: number) {
  return new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 2 }).format(value);
}

function markup(row: MenuBenchmarkRow) {
  return row.ingredientCost > 0 ? row.menuPrice / row.ingredientCost : 0;
}

function verdict(row: MenuBenchmarkRow) {
  const ratio = markup(row);
  if (ratio >= 5) return { label: 'Priced unusually high vs cost', tone: 'bg-amber-50 text-amber-950' };
  if (ratio <= 2.5) return { label: 'Priced unusually low vs cost', tone: 'bg-sky-50 text-sky-950' };
  return { label: 'Within benchmark band', tone: 'bg-emerald-50 text-emerald-950' };
}

export default async function MenuBenchmarkPage({ params }: Readonly<{ params: Promise<{ country: string }> }>) {
  const { country } = await params;

  return (
    <PageShell>
      <Eyebrow>{country.toUpperCase()} restaurants</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Menu pricing benchmark</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        Upload or paste a restaurant menu, then compare dish prices against GroceryView ingredient-cost estimates. The benchmark flags dishes priced unusually high or low versus visible grocery data and keeps the calculation audit-friendly.
      </p>

      <Card className="mt-6 border-cyan-200 bg-cyan-50">
        <h2 className="text-2xl font-black text-slate-950">Menu intake</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <label className="text-sm font-black text-slate-950" htmlFor="menu-upload">
            Upload menu file
            <input className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold" id="menu-upload" name="menu" type="file" />
          </label>
          <label className="text-sm font-black text-slate-950" htmlFor="menu-text">
            Or paste menu text
            <textarea
              className="mt-2 min-h-32 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold"
              defaultValue={'Pasta pomodoro 169 kr\nChicken salad 189 kr\nVeggie soup 119 kr'}
              id="menu-text"
              name="menuText"
            />
          </label>
        </div>
        <p className="mt-4 rounded-2xl bg-white p-4 text-sm font-bold text-cyan-950">
          Auth can be added around persistence; the benchmark itself is safe to preview because it uses only visible dish text and public ingredient cost rows.
        </p>
      </Card>

      <Card className="mt-6">
        <h2 className="text-2xl font-black text-slate-950">Ingredient-cost benchmark</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left">
            <caption className="sr-only">Restaurant menu prices compared with estimated ingredient costs</caption>
            <thead>
              <tr className="border-b border-slate-200 text-sm font-black text-slate-600">
                <th className="px-3 py-3">Dish</th>
                <th className="px-3 py-3">Menu price</th>
                <th className="px-3 py-3">Ingredient cost</th>
                <th className="px-3 py-3">Markup</th>
                <th className="px-3 py-3">Flag</th>
              </tr>
            </thead>
            <tbody>
              {benchmarkRows.map((row) => {
                const flag = verdict(row);
                return (
                  <tr className="border-b border-slate-100" key={row.dish}>
                    <th className="px-3 py-4 font-black text-slate-950">{row.dish}</th>
                    <td className="px-3 py-4 font-semibold">{formatSek(row.menuPrice)}</td>
                    <td className="px-3 py-4 font-semibold">{formatSek(row.ingredientCost)}</td>
                    <td className="px-3 py-4 font-semibold">{markup(row).toFixed(1)}×</td>
                    <td className="px-3 py-4">
                      <span className={`rounded-full px-3 py-1 text-sm font-black ${flag.tone}`}>{flag.label}</span>
                      <p className="mt-2 text-xs font-semibold text-slate-500">{row.dataSource}</p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </PageShell>
  );
}
