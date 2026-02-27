export default function PlaceholderPage({ title, description }) {
  return (
    <section className="rounded-2xl bg-white p-8 shadow-sm">
      <h3 className="text-2xl font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
    </section>
  );
}
