const Wordmark = ({
  textFill = "#14201A",
  className = "h-8 w-auto",
}: {
  textFill?: string;
  className?: string;
}) => (
  <svg viewBox="0 0 220 48" className={className} aria-hidden="true">
    <rect x="0" y="4" width="40" height="40" rx="10" fill="#059669" />
    <path
      d="M25 17 L15.5 17 C11.5 17 11.5 24 15.5 24 L24.5 24 C28.5 24 28.5 31 24.5 31 L15 31"
      fill="none"
      stroke="#F7FAF7"
      strokeWidth="4.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <text
      x="52"
      y="31"
      fontFamily="Helvetica, Arial, sans-serif"
      fontSize="22"
      fontWeight="700"
      fill={textFill}
    >
      EV<tspan fill="#059669">Source</tspan>
    </text>
  </svg>
);

export default Wordmark;
