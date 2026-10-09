export function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="max-w-2xl">
      <p className="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-ember">
        {eyebrow}
      </p>
      <h2 className="font-display text-4xl leading-none tracking-wide text-cream sm:text-5xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-3 text-base text-muted">{description}</p>
      ) : null}
    </div>
  );
}
