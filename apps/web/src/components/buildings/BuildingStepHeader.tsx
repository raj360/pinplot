export function BuildingStepHeader({
  step,
  label,
  title,
  description,
  optional = false,
}: {
  step: number;
  label: string;
  title: string;
  description?: string;
  optional?: boolean;
}) {
  return (
    <div>
      <p
        className={`text-xs font-semibold uppercase tracking-wide ${
          optional ? "text-muted" : "text-lime-700"
        }`}
      >
        Step {step} · {label}
        {optional ? " · Optional" : ""}
      </p>
      <h2 className="mt-1 text-xl font-bold sm:text-2xl">{title}</h2>
      {description ? (
        <p className="mt-1 text-sm text-muted">{description}</p>
      ) : null}
    </div>
  );
}
