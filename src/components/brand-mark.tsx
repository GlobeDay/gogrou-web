/**
 * Gogrou brand mark — letter G with internal gear, green→teal gradient.
 *
 * Render strategie:
 *  - Inline SVG (vector, recoloruje gear přes currentColor pokud potřeba)
 *  - Plně self-contained, žádné fetch, žádné race s next/image
 *
 * Pokud máš pixel-perfect PNG verzi, uložením do
 * /public/gogrou-logo.png a swapem komponenty na <Image> ho lze přepnout.
 */
export function BrandMark({ size = 28, className }: { size?: number; className?: string }) {
  const id = `gogrou-grad-${size}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label="Gogrou"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={id} x1="0" x2="1" y1="0.3" y2="0.7">
          {/* Industry theme: flat steel z tokenu — žádné gradienty (non-negotiable #5) */}
          <stop offset="0%" stopColor="var(--primary)" />
          <stop offset="100%" stopColor="var(--primary)" />
        </linearGradient>
      </defs>
      {/* Letter G */}
      <path
        fill={`url(#${id})`}
        d="M 51,4 C 25,4 4,25 4,51 C 4,77 25,98 51,98 C 67,98 81,90 89,77 L 89,49 L 53,49 L 53,62 L 76,62 C 71,72 62,79 51,79 C 36,79 24,67 24,51 C 24,36 36,23 51,23 C 60,23 67,27 73,33 L 86,22 C 77,11 65,4 51,4 Z"
      />
      {/* Inner gear */}
      <g transform="translate(35 51)" fill="white">
        <rect x="-1.7" y="-14.5" width="3.4" height="5" />
        <rect x="-1.7" y="-14.5" width="3.4" height="5" transform="rotate(45)" />
        <rect x="-1.7" y="-14.5" width="3.4" height="5" transform="rotate(90)" />
        <rect x="-1.7" y="-14.5" width="3.4" height="5" transform="rotate(135)" />
        <rect x="-1.7" y="-14.5" width="3.4" height="5" transform="rotate(180)" />
        <rect x="-1.7" y="-14.5" width="3.4" height="5" transform="rotate(225)" />
        <rect x="-1.7" y="-14.5" width="3.4" height="5" transform="rotate(270)" />
        <rect x="-1.7" y="-14.5" width="3.4" height="5" transform="rotate(315)" />
        <circle r="11" />
        <circle r="3.6" fill={`url(#${id})`} />
      </g>
    </svg>
  );
}

/** Wordmark — letterspaced uppercase pro industrial feel. */
export function BrandWordmark({ className }: { className?: string }) {
  return (
    <span
      className={`font-semibold tracking-label uppercase text-[0.95rem] ${className ?? ""}`}
    >
      Gogrou
    </span>
  );
}

/** Full lockup — mark + wordmark. */
export function BrandLockup({ className, markSize = 26 }: { className?: string; markSize?: number }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <BrandMark size={markSize} />
      <BrandWordmark />
    </span>
  );
}
