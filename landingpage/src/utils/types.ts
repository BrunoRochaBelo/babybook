// === TYPE DEFINITIONS ===

export interface ScrollProgress {
  progress: number; // 0-1
  percentage: number; // 0-100
  isAtTop: boolean;
  isAtBottom: boolean;
}

export interface SectionBounds {
  top: number;
  bottom: number;
  height: number;
  center: number;
}

export interface AnimationConfig {
  duration?: number;
  easing?: (t: number) => number;
  delay?: number;
}

export interface CarouselOptions {
  autoplay?: boolean;
  autoplayDelay?: number;
  loop?: boolean;
  slidesPerView?: number;
}

export interface AnalyticsEvent {
  category: string;
  action: string;
  label?: string;
  value?: number;
}

// Type Guards
export const isHTMLElement = (element: any): element is HTMLElement => {
  return element instanceof HTMLElement;
};

export const hasDataAttribute = (
  element: HTMLElement,
  attribute: string,
): boolean => {
  return element.hasAttribute(`data-${attribute}`);
};
