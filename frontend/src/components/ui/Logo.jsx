/**
 * brand mark: two linked loops that resolve into a single straight
 * line — visualizing "tangled long URL becomes one clean link."
 * `size` controls the square bounding box in px.
 */
export default function Logo({ size = 32, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect width="32" height="32" rx="9" fill="#14B8A6" />
      <path
        d="M12 20L20 12"
        stroke="white"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <rect
        x="8.2"
        y="15.2"
        width="7.2"
        height="7.2"
        rx="3.6"
        transform="rotate(-45 11.8 18.8)"
        stroke="white"
        strokeWidth="2.1"
      />
      <rect
        x="16.6"
        y="9.6"
        width="7.2"
        height="7.2"
        rx="3.6"
        transform="rotate(-45 20.2 13.2)"
        stroke="white"
        strokeWidth="2.1"
      />
    </svg>
  );
}
