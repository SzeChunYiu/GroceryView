import locale from "@/locales/sv.json";

type EmptyStateProps = {
  title?: string;
  message?: string;
};

export function EmptyState({
  title = locale.emptyState.title,
  message = locale.emptyState.message,
}: Readonly<EmptyStateProps>) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
      <p className="mt-2 text-sm text-zinc-600">{message}</p>
    </section>
  );
}
