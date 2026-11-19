/**
 * @fileoverview Test utilities for rendering hooks and components.
 *
 * Lightweight helpers for testing React hooks and components in a
 * jsdom environment using react-dom with proper async support via `act`.
 */
import React from 'react';

const ReactDOMClient = require('react-dom/client');

const { act: reactAct } = require('react');

/**
 * Renders a hook in a wrapper and returns the result.
 * Uses async act to properly flush effects, including resolved promises.
 */
export async function renderHook<T>(
  hookFn: () => T,
  options?: {
    wrapper?: React.ComponentType<{ children: React.ReactNode }>;
  }
): Promise<{ result: { current: T }; unmount: () => void }> {
  const result: { current: T } = {} as { current: T };

  function TestComponent() {
    result.current = hookFn();
    return null;
  }

  const element = options?.wrapper ? (
    <options.wrapper>
      <TestComponent />
    </options.wrapper>
  ) : (
    <TestComponent />
  );

  const container = document.createElement('div');
  document.body.appendChild(container);

  const root = ReactDOMClient.createRoot(container);

  // Use async act to flush effects and microtasks
  await reactAct(async () => {
    root.render(element);
  });

  return {
    result,
    unmount: () => {
      reactAct(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}

/**
 * Synchronous renderHook for cases where no async effects need flushing.
 * Use renderHook (async) when the wrapper contains async providers.
 */
export function renderHookSync<T>(
  hookFn: () => T,
  options?: {
    wrapper?: React.ComponentType<{ children: React.ReactNode }>;
  }
): { result: { current: T }; unmount: () => void } {
  const result: { current: T } = {} as { current: T };

  function TestComponent() {
    result.current = hookFn();
    return null;
  }

  const element = options?.wrapper ? (
    <options.wrapper>
      <TestComponent />
    </options.wrapper>
  ) : (
    <TestComponent />
  );

  const container = document.createElement('div');
  document.body.appendChild(container);

  const root = ReactDOMClient.createRoot(container);

  reactAct(() => {
    root.render(element);
  });

  return {
    result,
    unmount: () => {
      reactAct(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}

/**
 * Finds all elements containing the given text by checking element
 * textContent. Handles cases where JSX interpolation creates multiple
 * text nodes within one element.
 */
function findByTextContent(
  container: HTMLElement,
  text: string | RegExp
): HTMLElement[] {
  const results: HTMLElement[] = [];
  const seen = new Set<HTMLElement>();

  const elements = container.querySelectorAll('*');
  for (const el of elements) {
    const htmlEl = el as HTMLElement;
    const directText = getDirectTextContent(htmlEl);
    const matches =
      typeof text === 'string'
        ? directText.includes(text)
        : text.test(directText);
    if (matches && !seen.has(htmlEl)) {
      seen.add(htmlEl);
      results.push(htmlEl);
    }
  }

  return results;
}

/**
 * Gets the direct text content of an element, concatenating only its
 * immediate text node children (not text from nested elements).
 */
function getDirectTextContent(el: HTMLElement): string {
  let text = '';
  for (const child of el.childNodes) {
    if (child.nodeType === Node.TEXT_NODE) {
      text += child.textContent ?? '';
    }
  }
  return text;
}

interface RenderResult {
  container: HTMLElement;
  /** The element a component marked with `testID`. Throws if there is none. */
  getByTestId: (testId: string) => HTMLElement;
  queryByTestId: (testId: string) => HTMLElement | null;
  /** The element a component gave this accessibility label. */
  getByLabel: (label: string) => HTMLElement;
  /** Render a new element into the same root (an update, not a remount). */
  rerender: (element: React.ReactElement) => Promise<void>;
  getByText: (text: string) => HTMLElement;
  queryByText: (text: string | RegExp) => HTMLElement | null;
  getAllByText: (text: string | RegExp) => HTMLElement[];
  unmount: () => void;
}

/**
 * Renders a React element into a DOM container.
 * Uses async act to properly flush effects (including resolved promises).
 * Returns query helpers for assertions.
 */
export async function render(
  element: React.ReactElement
): Promise<RenderResult> {
  const container = document.createElement('div');
  document.body.appendChild(container);

  const root = ReactDOMClient.createRoot(container);

  // Use async act to flush initial render, effects, and microtasks
  await reactAct(async () => {
    root.render(element);
  });

  const getByText = (text: string): HTMLElement => {
    const results = findByTextContent(container, text);
    if (results.length === 0) {
      throw new Error(`Text "${text}" not found`);
    }
    return results[0];
  };

  const queryByText = (text: string | RegExp): HTMLElement | null => {
    const results = findByTextContent(container, text);
    return results.length > 0 ? results[0] : null;
  };

  const getAllByText = (text: string | RegExp): HTMLElement[] => {
    return findByTextContent(container, text);
  };

  const queryByTestId = (testId: string): HTMLElement | null =>
    container.querySelector(`[data-testid="${testId}"]`);

  const getByTestId = (testId: string): HTMLElement => {
    const found = queryByTestId(testId);
    if (!found) {
      throw new Error(`testID "${testId}" not found`);
    }
    return found;
  };

  const getByLabel = (label: string): HTMLElement => {
    const found = container.querySelector<HTMLElement>(
      `[aria-label="${label}"]`
    );
    if (!found) {
      throw new Error(`Accessibility label "${label}" not found`);
    }
    return found;
  };

  const rerender = async (next: React.ReactElement): Promise<void> => {
    await reactAct(async () => {
      root.render(next);
    });
  };

  return {
    container,
    getByTestId,
    queryByTestId,
    getByLabel,
    rerender,
    getByText,
    queryByText,
    getAllByText,
    unmount: () => {
      reactAct(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}

/**
 * Simulates pressing an element by dispatching a click event.
 */
export function firePress(element: HTMLElement): void {
  reactAct(() => {
    element.click();
  });
}

/**
 * Flush all promises (microtasks) within act.
 */
export async function flushPromises(): Promise<void> {
  await reactAct(async () => {
    await new Promise(resolve => setTimeout(resolve, 0));
  });
}
