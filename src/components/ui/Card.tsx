import type { ComponentPropsWithoutRef, ElementType } from "react";

type CardOwnProps<T extends ElementType> = {
  as?: T;
  interactive?: boolean;
};

type CardProps<T extends ElementType> = CardOwnProps<T> &
  Omit<ComponentPropsWithoutRef<T>, keyof CardOwnProps<T>>;

const Card = <T extends ElementType = "div">(
  incomingProps: CardProps<T>
) => {
  const {
    as,
    interactive = false,
    className = "",
    ...rest
  } = incomingProps as any;

  const Component = (as ?? "div") as ElementType;

  return (
    <Component
      className={`card ${className}`.trim()}
      data-interactive={interactive ? "true" : undefined}
      {...rest}
    />
  );
};

export default Card;
