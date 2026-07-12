"use client";

import { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import CountUp from "react-countup";

type Props = {
  end: number;
  className?: string;
};

export default function AnimatedCount({ end, className }: Props) {
  const locale = useLocale();
  const formatter = new Intl.NumberFormat(locale);
  const [start, setStart] = useState<number | null>(null);

  useEffect(() => {
    setStart((prevStart) => prevStart ?? end);
  }, [end]);

  // On first mount, start is null, so show the end value immediately
  if (start === null) {
    return <span className={className}>{formatter.format(end)}</span>;
  }

  return (
    <CountUp
      start={start}
      end={end}
      duration={0.8}
      formattingFn={(value) => formatter.format(value)}
    >
      {({ countUpRef }) => (
        <span ref={countUpRef} className={className}>
          {formatter.format(end)}
        </span>
      )}
    </CountUp>
  );
}
