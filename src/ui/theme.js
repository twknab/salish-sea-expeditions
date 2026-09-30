// Look and feel: calm, elegant, receding so the sea can be seen (Principle V).
// Everything is laid out in points and multiplied by S (device pixels per point).

export const FONT = {
  serif: 'ui-serif, "New York", "Iowan Old Style", Georgia, serif',
  sans: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif',
  mono: 'ui-monospace, "SF Mono", Menlo, monospace',
};

export const COLOR = {
  ink: 0x0b2b33,
  deep: 0x0e3a45,
  sea: 0x1f5f66,
  foam: 0xe9f1ee,
  fog: 0xcfdcd8,
  mist: 0x9fb8b3,
  kelp: 0xb08a3e,
  madrona: 0xc0553a,
  cedar: 0x6b8f5a,
  sun: 0xf2c572,
  danger: 0xe0765a,
  good: 0x8fd1a8,
};

export const CSS = {
  ink: '#0b2b33', foam: '#e9f1ee', fog: '#cfdcd8', mist: '#9fb8b3', kelp: '#d9b36a',
  sun: '#f2c572', madrona: '#e08a6c', good: '#9fdcb6', danger: '#f0937a',
};

export const layout = {
  S: 1, W: 390, H: 844, // points
  safe: { top: 0, bottom: 0 },
};

export function setLayout({ S, W, H, top, bottom }) {
  Object.assign(layout, { S, W, H });
  layout.safe.top = top;
  layout.safe.bottom = bottom;
}

/** Points → device pixels. */
export const px = (pt) => pt * layout.S;

export function textStyle(size, opts = {}) {
  return {
    fontFamily: opts.serif ? FONT.serif : FONT.sans,
    fontSize: `${Math.round(px(size))}px`,
    fontStyle: opts.weight ?? (opts.serif ? 'normal' : '500'),
    color: opts.color ?? CSS.foam,
    align: opts.align ?? 'left',
    wordWrap: opts.wrap ? { width: px(opts.wrap), useAdvancedWrap: true } : undefined,
    lineSpacing: px(opts.lineSpacing ?? size * 0.32),
    letterSpacing: opts.tracking ? px(opts.tracking) : 0,
  };
}
