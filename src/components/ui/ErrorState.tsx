import type { ReactNode } from "react";

import Button from "@/components/ui/Button";
import Notice from "@/components/ui/Notice";

const ErrorState = ({
  title,
  body,
  retryLabel,
  onRetry,
  children,
}: {
  title: string;
  body: string;
  retryLabel: string;
  onRetry: () => void;
  children?: ReactNode;
}) => (
  <Notice title={title} tone="warning">
    <p className="mt-2">{body}</p>
    <div className="mt-4 flex flex-wrap gap-3">
      <Button type="button" variant="warning" onClick={onRetry}>
        {retryLabel}
      </Button>
      {children}
    </div>
  </Notice>
);

export default ErrorState;
