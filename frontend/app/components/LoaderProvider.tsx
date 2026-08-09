"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

interface LoaderContextType {
  isLoading: boolean;
  markPageReady: () => void;
  markAnimationReady: () => void;
}

const LoaderContext = createContext<LoaderContextType>({
  isLoading: true,
  markPageReady: () => {},
  markAnimationReady: () => {},
});

export const useLoader = () => useContext(LoaderContext);

export function LoaderProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [pageReady, setPageReady] = useState(false);
  const [animationReady, setAnimationReady] = useState(false);

  /*
   * ---------------------------------------------------------------
   * PAGE READY
   * ---------------------------------------------------------------
   *
   * We only wait until React has rendered the initial page.
   *
   * We intentionally DO NOT wait for:
   * - every image
   * - every video
   * - every API request
   * - window.load
   *
   * This keeps the loader fast.
   */
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setPageReady(true);
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, []);

  /*
   * ---------------------------------------------------------------
   * ANIMATION READY
   * ---------------------------------------------------------------
   *
   * Called by Loader.tsx when the branded animation finishes.
   */
  const markAnimationReady = useCallback(() => {
    setAnimationReady(true);
  }, []);

  /*
   * ---------------------------------------------------------------
   * PAGE READY CALLBACK
   * ---------------------------------------------------------------
   *
   * Can be used by other components later if required.
   */
  const markPageReady = useCallback(() => {
    setPageReady(true);
  }, []);

  /*
   * ---------------------------------------------------------------
   * NORMAL LOADER COMPLETION
   * ---------------------------------------------------------------
   *
   * Both conditions must be satisfied:
   *
   * 1. Initial page rendered
   * 2. Brand animation finished
   */
  useEffect(() => {
    if (pageReady && animationReady) {
      setIsLoading(false);
    }
  }, [pageReady, animationReady]);

  /*
   * ---------------------------------------------------------------
   * FAILSAFE
   * ---------------------------------------------------------------
   *
   * If something goes wrong with JavaScript animation,
   * the loader will NEVER stay permanently visible.
   *
   * Maximum: 3 seconds.
   */
  useEffect(() => {
    const failsafe = window.setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    return () => {
      window.clearTimeout(failsafe);
    };
  }, []);

  return (
    <LoaderContext.Provider
      value={{
        isLoading,
        markPageReady,
        markAnimationReady,
      }}
    >
      {children}
    </LoaderContext.Provider>
  );
}