import type { ComponentPropsWithoutRef, ElementType } from "react";

type CardOwnProps<T extends ElementType> = {
  as?: T;
  interactive?: boolean;
};

type CardProps<T extends ElementType> = CardOwnProps<T> &
  Omit<ComponentPropsWithoutRef<T>, keyof CardOwnProps<T>>;

const Card = <T extends ElementType = "div">({
  as,
  interactive = false,
  className,
  ...rest
}: CardProps<T>) => {
  const Component = (as ?? "div") as ElementType;
  const classNameValue = (className ?? "") as string;

  return (
    <Component
      className={`card ${classNameValue}`.trim()}
      data-interactive={interactive ? "true" : undefined}
      {...rest}
    />
  );
};

export default Card;
