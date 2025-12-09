/**
 * useScrollRestoration - Scroll Position Preservation Hook
 *
 * Saves and restores scroll position when navigating between pages.
 * Essential for timeline UX - users expect to return to same position.
 */

import { useEffect, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";

interface ScrollPositionMap {
  [key: string]: number;
}

// Store scroll positions in memory (survives across re-renders)
const scrollPositions: ScrollPositionMap = {};

/**
 * Hook that automatically saves and restores scroll position for a route.
 *
 * @param containerRef - Optional ref for scrollable container (uses window if not provided)
 * @param key - Optional unique key to identify the scroll position (uses pathname if not provided)
 *
 * @example
 * ```tsx
 * function TimelinePage() {
 *   useScrollRestoration();
 *   return <div>...</div>;
 * }
 * ```
 *
 * @example
 * ```tsx
 * function TimelinePage() {
 *   const containerRef = useRef<HTMLDivElement>(null);
 *   useScrollRestoration({ containerRef });
 *   return <div ref={containerRef} className="overflow-auto">...</div>;
 * }
 * ```
 */
export function useScrollRestoration(options?: {
  containerRef?: React.RefObject<HTMLElement>;
  key?: string;
  delay?: number;
}) {
  const { containerRef, key: customKey, delay = 0 } = options || {};
  const location = useLocation();
  const scrollKey = customKey || location.pathname;
  const hasRestored = useRef(false);

  // Save scroll position before unmounting or navigating away
  const saveScrollPosition = useCallback(() => {
    if (containerRef?.current) {
      scrollPositions[scrollKey] = containerRef.current.scrollTop;
    } else {
      scrollPositions[scrollKey] = window.scrollY;
    }
  }, [containerRef, scrollKey]);

  // Restore scroll position after content loads
  const restoreScrollPosition = useCallback(() => {
    const savedPosition = scrollPositions[scrollKey];

    if (savedPosition !== undefined) {
      const restore = () => {
        if (containerRef?.current) {
          containerRef.current.scrollTop = savedPosition;
        } else {
          window.scrollTo(0, savedPosition);
        }
        hasRestored.current = true;
      };

      if (delay > 0) {
        setTimeout(restore, delay);
      } else {
        restore();
      }
    }
  }, [containerRef, scrollKey, delay]);

  // Clear saved position (useful after creating new content)
  const clearScrollPosition = useCallback(() => {
    delete scrollPositions[scrollKey];
  }, [scrollKey]);

  // Scroll to top (useful for fresh navigation)
  const scrollToTop = useCallback(() => {
    if (containerRef?.current) {
      containerRef.current.scrollTop = 0;
    } else {
      window.scrollTo(0, 0);
    }
  }, [containerRef]);

  // Save on scroll (debounced via requestAnimationFrame)
  useEffect(() => {
    let rafId: number;

    const handleScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(saveScrollPosition);
    };

    const target = containerRef?.current || window;
    target.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      cancelAnimationFrame(rafId);
      target.removeEventListener("scroll", handleScroll);
    };
  }, [containerRef, saveScrollPosition]);

  // Restore on mount (after initial render + data load)
  useEffect(() => {
    if (!hasRestored.current) {
      // Use RAF to wait for DOM paint
      requestAnimationFrame(() => {
        restoreScrollPosition();
      });
    }
  }, [restoreScrollPosition]);

  // Save before unmount
  useEffect(() => {
    return () => {
      saveScrollPosition();
    };
  }, [saveScrollPosition]);

  return {
    saveScrollPosition,
    restoreScrollPosition,
    clearScrollPosition,
    scrollToTop,
    savedPosition: scrollPositions[scrollKey],
  };
}

/**
 * useScrollToElement - Scroll to a specific element on mount
 *
 * Useful for deep linking to a specific moment in the timeline.
 */
export function useScrollToElement(options: {
  selector?: string;
  elementRef?: React.RefObject<HTMLElement>;
  enabled?: boolean;
  behavior?: ScrollBehavior;
  block?: ScrollLogicalPosition;
}) {
  const {
    selector,
    elementRef,
    enabled = true,
    behavior = "smooth",
    block = "center",
  } = options;

  useEffect(() => {
    if (!enabled) return;

    const element =
      elementRef?.current ||
      (selector ? document.querySelector(selector) : null);

    if (element) {
      // Wait for layout to stabilize
      requestAnimationFrame(() => {
        element.scrollIntoView({ behavior, block });
      });
    }
  }, [selector, elementRef, enabled, behavior, block]);
}

/**
 * useInfiniteScroll - Trigger callback when scrolling near bottom
 *
 * Useful for loading more moments as user scrolls.
 */
export function useInfiniteScroll(options: {
  containerRef?: React.RefObject<HTMLElement>;
  onLoadMore: () => void;
  threshold?: number;
  enabled?: boolean;
  hasMore?: boolean;
}) {
  const {
    containerRef,
    onLoadMore,
    threshold = 200,
    enabled = true,
    hasMore = true,
  } = options;

  const isLoading = useRef(false);

  useEffect(() => {
    if (!enabled || !hasMore) return;

    const handleScroll = () => {
      if (isLoading.current) return;

      const target = containerRef?.current;
      const scrollHeight =
        target?.scrollHeight ?? document.documentElement.scrollHeight;
      const scrollTop = target?.scrollTop ?? window.scrollY;
      const clientHeight = target?.clientHeight ?? window.innerHeight;

      if (scrollHeight - scrollTop - clientHeight < threshold) {
        isLoading.current = true;
        onLoadMore();
        // Reset loading state after a short delay
        setTimeout(() => {
          isLoading.current = false;
        }, 500);
      }
    };

    const target = containerRef?.current || window;
    target.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      target.removeEventListener("scroll", handleScroll);
    };
  }, [containerRef, onLoadMore, threshold, enabled, hasMore]);
}
