/** Taza de café con arte latte sobre su plato, en los colores de la marca. Decorativa. */
export function TazaIlustracion({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 220 200" className={className} aria-hidden="true">
      {/* vapor */}
      <g fill="none" stroke="#0F2E22" strokeWidth="5" strokeLinecap="round" opacity="0.55">
        <path d="M86 52 C76 40 96 32 86 18" />
        <path d="M110 48 C100 34 120 26 110 10" />
        <path d="M134 52 C124 40 144 32 134 18" />
      </g>
      {/* plato */}
      <ellipse cx="110" cy="178" rx="92" ry="14" fill="#0F2E22" />
      <ellipse cx="110" cy="173" rx="92" ry="12" fill="#1D4A37" />
      <ellipse cx="110" cy="172" rx="58" ry="7" fill="#0F2E22" opacity="0.45" />
      {/* asa */}
      <path d="M168 92 C200 92 200 140 160 140" fill="none" stroke="#4B2348" strokeWidth="13" strokeLinecap="round" />
      {/* cuerpo */}
      <path d="M44 78 L176 78 L168 140 C164 162 150 172 130 172 L90 172 C70 172 56 162 52 140 Z" fill="#4B2348" />
      {/* franja lila */}
      <path d="M47.5 104 L172.5 104 L170.4 120 L49.6 120 Z" fill="#E6D3EE" />
      {/* borde y café */}
      <ellipse cx="110" cy="78" rx="66" ry="14" fill="#36172F" />
      <ellipse cx="110" cy="79" rx="58" ry="10.5" fill="#7A4E3A" />
      {/* corazón de leche */}
      <path d="M110 87 C96 80 100 71 106 73 C108 74 110 76 110 78 C110 76 112 74 114 73 C120 71 124 80 110 87 Z" fill="#FFF7EE" />
      {/* galleta en el plato */}
      <circle cx="40" cy="168" r="15" fill="#C99A1E" />
      <circle cx="35" cy="164" r="2.6" fill="#7A4E3A" />
      <circle cx="44" cy="166" r="2.2" fill="#7A4E3A" />
      <circle cx="39" cy="172" r="2.4" fill="#7A4E3A" />
    </svg>
  );
}
