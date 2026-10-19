"use client";

import { useRef, type ReactNode } from "react";
import {
  TransformComponent,
  TransformWrapper,
  type ReactZoomPanPinchRef,
} from "react-zoom-pan-pinch";

type Props = {
  nav: ReactNode;
  children: ReactNode;
};

/**
 * Sticky chrome over a dotted field. Content is sized to fit the viewport
 * at scale 1; light pan/zoom stays available without a huge empty world.
 */
export function CanvasShell({ nav, children }: Props) {
  const transformRef = useRef<ReactZoomPanPinchRef | null>(null);

  return (
    <div className="fixed inset-0 flex flex-col bg-surface">
      <header className="relative z-50 shrink-0 border-b border-line bg-surface-raised/95 px-5 py-4 backdrop-blur-md sm:px-7">
        {nav}
      </header>

      <div className="path-map-field relative min-h-0 flex-1">
        <div className="pointer-events-none absolute right-3 bottom-3 z-10 flex gap-1 sm:right-5 sm:bottom-5">
          <button
            type="button"
            aria-label="Zoom in"
            className="pointer-events-auto border border-line bg-surface-raised px-2.5 py-1 text-sm font-medium text-ink hover:border-accent hover:text-accent"
            onClick={() => transformRef.current?.zoomIn(0.12)}
          >
            +
          </button>
          <button
            type="button"
            aria-label="Zoom out"
            className="pointer-events-auto border border-line bg-surface-raised px-2.5 py-1 text-sm font-medium text-ink hover:border-accent hover:text-accent"
            onClick={() => transformRef.current?.zoomOut(0.12)}
          >
            −
          </button>
          <button
            type="button"
            aria-label="Reset view"
            className="pointer-events-auto border border-line bg-surface-raised px-2.5 py-1 font-mono text-[11px] text-ink hover:border-accent hover:text-accent"
            onClick={() => transformRef.current?.resetTransform()}
          >
            Reset
          </button>
        </div>

        <TransformWrapper
          ref={transformRef}
          initialScale={1}
          minScale={0.7}
          maxScale={1.6}
          centerOnInit
          limitToBounds={false}
          wheel={{ step: 0.05, disabled: true }}
          doubleClick={{ disabled: true }}
          panning={{
            velocityDisabled: true,
            excluded: ["input", "textarea", "button", "a"],
          }}
        >
          <TransformComponent
            wrapperStyle={{
              width: "100%",
              height: "100%",
              cursor: "grab",
            }}
            contentStyle={{ width: "auto", height: "auto" }}
          >
            <div className="flex min-h-[calc(100vh-5.5rem)] w-screen items-center justify-center px-4 py-4 sm:px-6">
              <div className="w-full max-w-[64rem]">{children}</div>
            </div>
          </TransformComponent>
        </TransformWrapper>
      </div>
    </div>
  );
}
