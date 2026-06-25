import type { ReactNode } from "react";

import Card from "@/components/ui/Card";

type NoticeTone = "warning" | "neutral" | "success";

const TONE_CLASSES: Record<NoticeTone, string> = {
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  neutral: "text-center",
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
};

const Notice = ({
  title,
  tone = "neutral",
  children,
}: {
  title: string;
  tone?: NoticeTone;
  children?: ReactNode;
}) => (
  <Card as="section" className={TONE_CLASSES[tone]}>
    <h2
      className={
        tone === "warning" ? "mb-2 text-lg font-medium" : "text-lg font-medium"
      }
    >
      {title}
    </h2>
    {children}
  </Card>
);

export default Notice;
