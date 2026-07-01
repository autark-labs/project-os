# Project OS Styling Cleanup

Pages should use Tailwind mainly for layout, sizing, and one-off positioning. Reusable visual styling should live in small primitives or feature components.

Preferred:

```tsx
<Surface tone="panel" className="p-3">
  ...
</Surface>
```

```tsx
<ApplicationDarkControlButton onClick={onRestart}>
  Restart
</ApplicationDarkControlButton>
```

Discouraged:

```tsx
<div className="rounded-xl border border-sky-400/20 bg-slate-800 p-3 shadow-xl shadow-slate-950/30">
  ...
</div>
```

Raw Tailwind colors are acceptable for local status meaning. Shared surface, panel, border, and action colors should move through semantic variables or reusable primitives as pages are touched.
