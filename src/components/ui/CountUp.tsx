"use client";

import CountUp from "react-countup";

type Props = {
  end: number;
  start?: number;
  className?: string;
};

export default function AnimatedCount({ end, start, className }: Props) {
  return (
    <CountUp
      start={start ?? 0}
      end={end}
      duration={0.8}
      separator=","
      className={className}
    />
  );
}
