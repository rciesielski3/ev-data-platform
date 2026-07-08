"use client";

import { useEffect, useRef } from "react";
import { useLocale } from "next-intl";
import CountUp from "react-countup";

type Props = {
  end: number;
  className?: string;
};

export default function AnimatedCount({ end, className }: Props) {
  const locale = useLocale();
  const formatter = new Intl.NumberFormat(locale);
  const prevEndRef = useRef<number | null>(null);

  useEffect(() => {
    prevEndRef.current = end;
  }, [end]);

  const start = prevEndRef.current ?? end;

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
