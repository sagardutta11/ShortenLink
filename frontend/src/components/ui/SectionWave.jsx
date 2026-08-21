/**
 * Reusable wavy section-bottom divider.
 * `fill` should match the *next* section's background color so the wave
 * appears to flow into it.
 * `flip` mirrors the curve vertically (use to alternate direction between sections).
 */
export default function SectionWave({ fill = '#F7FAF9', flip = false }) {
  return (
    <svg
      className={`absolute bottom-0 left-0 w-full ${flip ? 'rotate-180' : ''}`}
      viewBox="0 0 1440 100"
      preserveAspectRatio="none"
      fill={fill}
      aria-hidden="true"
    >
      <path d="M0,40 C360,100 1080,0 1440,50 L1440,100 L0,100 Z" />
    </svg>
  );
}
