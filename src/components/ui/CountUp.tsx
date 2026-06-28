"use client";

import CountUp from "react-countup";

type Props = {
  end: number;
  className?: string;
};

export default function AnimatedCount({ end, className }: Props) {
  return (
    <CountUp end={end} duration={0.8} separator=" " className={className} />
  );
}
