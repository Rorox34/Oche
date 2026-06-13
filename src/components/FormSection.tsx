import type { ReactNode } from 'react';

interface Props {
  label: string;
  children: ReactNode;
}

/** Section de formulaire de configuration : intitulé + contenu. */
export function FormSection({ label, children }: Props) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-muted">
        {label}
      </h2>
      {children}
    </section>
  );
}
