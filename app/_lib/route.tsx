"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { getLenis, scrollToAnchor, type Anchor } from "./scroll";

// Internal client-side routing between the home story and the clients view.
export type Route = "home" | "clients";

const RouteCtx = createContext<{
  route: Route;
  navigate: (route: Route, anchor?: Anchor) => void;
}>({ route: "home", navigate: () => {} });

export const useRoute = () => useContext(RouteCtx);

export function RouteProvider({ children }: { children: ReactNode }) {
  const [route, setRoute] = useState<Route>("home");

  useEffect(() => {
    const sync = () => setRoute(window.location.pathname.startsWith("/clients") ? "clients" : "home");
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  const navigate = useCallback(
    (next: Route, anchor?: Anchor) => {
      if (next === route) {
        if (anchor) scrollToAnchor(anchor);
        return;
      }
      window.history.pushState({}, "", next === "clients" ? "/clients" : "/");
      setRoute(next);
      const lenis = getLenis();
      if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
      else window.scrollTo(0, 0);
      // Wait for the new view to mount before measuring / jumping.
      setTimeout(() => {
        ScrollTrigger.refresh();
        if (anchor) scrollToAnchor(anchor, true);
      }, 160);
    },
    [route]
  );

  return <RouteCtx.Provider value={{ route, navigate }}>{children}</RouteCtx.Provider>;
}
