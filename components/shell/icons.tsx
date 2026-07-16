// Ícones inline (stroke 1.8, 18px) — evita dependência de icon lib.
// Uso: <Icon.Opportunities className="w-[18px] h-[18px]" />

type P = { className?: string };
const base = (className?: string) => ({
  className,
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
});

export const Icon = {
  Opportunities: ({ className }: P) => (
    <svg {...base(className)}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  ),
  Reports: ({ className }: P) => (
    <svg {...base(className)}>
      <path d="M3 3v18h18" />
      <path d="M7 15l3-4 3 2 4-6" />
    </svg>
  ),
  Logout: ({ className }: P) => (
    <svg {...base(className)}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  ),
  Invites: ({ className }: P) => (
    <svg {...base(className)}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  ),
  Chevron: ({ className }: P) => (
    <svg {...base(className)}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  ),
};
