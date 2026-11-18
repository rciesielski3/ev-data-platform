import { useEffect } from "react";

const SCROLL_THRESHOLD_PX = 48;

export const useCloseOnScroll = (isOpen: boolean, close: () => void) => {
  useEffect(() => {
    if (!isOpen) return;

    const startY = window.scrollY;
    const onScroll = () => {
      if (Math.abs(window.scrollY - startY) > SCROLL_THRESHOLD_PX) close();
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isOpen, close]);
};
