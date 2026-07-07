"use client";

import { useLocale } from "next-intl";
import CountUp from "react-countup";

type Props = {
  end: number;
  start?: number;
  className?: string;
};

export default function AnimatedCount({ end, start, className }: Props) {
  const locale = useLocale();
  const formatter = new Intl.NumberFormat(locale);

  return (
    <CountUp
      start={start ?? 0}
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
