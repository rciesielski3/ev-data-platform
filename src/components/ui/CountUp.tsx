"use client";

import { useMemo, useState } from "react";
import { useLocale } from "next-intl";
import CountUp from "react-countup";

type Props = {
  end: number;
  className?: string;
};

const AnimatedCount = ({ end, className }: Props) => {
  const locale = useLocale();
  const formatter = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  const [reducedMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  return (
    <CountUp
      start={0}
      end={end}
      duration={reducedMotion ? 0 : 1.4}
      enableScrollSpy
      scrollSpyOnce
      formattingFn={(value) => formatter.format(value)}
    >
      {({ countUpRef }) => (
        <span ref={countUpRef} className={className}>
          {formatter.format(end)}
        </span>
      )}
    </CountUp>
  );
};

export default AnimatedCount;
