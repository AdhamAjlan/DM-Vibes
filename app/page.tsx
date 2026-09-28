"use client";

import { useCallback, useState } from "react";
import { RouteProvider, useRoute } from "./_lib/route";
import { SmoothScroll } from "./_lib/scroll";
import Story from "./_story/Story";
import { ClientsPage } from "./_components/ClientsPage";
import { Navigation } from "./_components/Nav";
import { LoadingScreen } from "./_components/Loader";
import { ProjectApplicationModal } from "./_components/ProjectModal";
import { CustomCursor } from "./_components/ui";

// ═══════════════════════════════════════════════════════════
// PAGE
//   HOME    = the pinned 3D film (scroll is the playhead) → page sections
//   CLIENTS = logo wall (internal route, /clients)
// ═══════════════════════════════════════════════════════════
function PageInner() {
  const { route } = useRoute();
  const [ready, setReady] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const openForm = useCallback(() => setFormOpen(true), []);
  const closeForm = useCallback(() => setFormOpen(false), []);
  const onLoaded = useCallback(() => setReady(true), []);

  return (
    <SmoothScroll paused={!ready}>
      <main className="relative w-full">
        <CustomCursor />
        <LoadingScreen onComplete={onLoaded} />
        <Navigation ready={ready} onOpenForm={openForm} />

        {route === "home" && (
          <>
            <Story ready={ready} onStartProject={openForm} />
          </>
        )}
        {ready && route === "clients" && <ClientsPage />}

        <ProjectApplicationModal open={formOpen} onClose={closeForm} />
      </main>
    </SmoothScroll>
  );
}

export default function Page() {
  return (
    <RouteProvider>
      <PageInner />
    </RouteProvider>
  );
}
