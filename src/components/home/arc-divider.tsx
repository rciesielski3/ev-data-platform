import styles from "./home.module.css";

export const ArcDivider = () => (
  <svg
    viewBox="0 0 1200 60"
    className={`${styles.arc} page-shell -mt-6 mb-6 hidden h-12 md:block`}
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M0 30 H420 C470 30 470 10 520 10 H680 C730 10 730 30 780 30 H1200"
      className="stroke-forest/35"
      strokeWidth="2"
      strokeLinecap="round"
      pathLength="1"
    />
  </svg>
);
