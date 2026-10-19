"use client";

import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import {
  CONCEPT_BY_ID,
  TRACKS,
  WAVES,
  conceptsInTrack,
  directPrereqs,
  getTrackEdges,
  getTrackLayers,
  getWaveEdges,
  type WaveDef,
} from "@/lib/concepts";
import {
  nodeStyle,
  sectionStyle,
  waveStyle,
} from "@/lib/curriculum-progress";

export type SkillProgress = {
  conceptId: string;
  skillPoints: number;
};

type Props = {
  progress: SkillProgress[];
};

const NODE_W = 200;
const NODE_H = 84;
const GAP_X = 40;
const GAP_Y = 56;
const PAD = 36;
const WORLD_PAD = 20;
const CLICK_SLOP_PX = 10;

type LayoutNode = {
  id: string;
  x: number;
  y: number;
  title: string;
  subtitle: string;
};

type GraphLayout = {
  positions: Map<string, LayoutNode>;
  canvasW: number;
  canvasH: number;
  edges: { from: string; to: string }[];
};

function layoutLayered(
  layers: { id: string; title: string; subtitle: string }[][],
  edges: { from: string; to: string }[],
): GraphLayout {
  let maxRowWidth = 0;
  for (const layer of layers) {
    const count = layer.length;
    const rowWidth = count * NODE_W + Math.max(0, count - 1) * GAP_X;
    maxRowWidth = Math.max(maxRowWidth, rowWidth);
  }

  const graphW = Math.max(maxRowWidth + PAD * 2, 520);
  const graphH =
    PAD * 2 +
    layers.length * NODE_H +
    Math.max(0, layers.length - 1) * GAP_Y;
  const canvasW = graphW + WORLD_PAD * 2;
  const canvasH = graphH + WORLD_PAD * 2;
  const positions = new Map<string, LayoutNode>();

  layers.forEach((layer, li) => {
    const count = layer.length;
    const rowWidth = count * NODE_W + Math.max(0, count - 1) * GAP_X;
    const startX = WORLD_PAD + (graphW - rowWidth) / 2;
    const y = WORLD_PAD + PAD + li * (NODE_H + GAP_Y);
    layer.forEach((node, i) => {
      positions.set(node.id, {
        id: node.id,
        x: startX + i * (NODE_W + GAP_X),
        y,
        title: node.title,
        subtitle: node.subtitle,
      });
    });
  });

  return { positions, canvasW, canvasH, edges };
}

/** Serpentine wave path — fills width instead of a single vertical stack. */
function layoutWaves(): GraphLayout {
  const COLS = 3;
  /** Mild row curve; keep smaller than row gap so mid-column nodes never collide. */
  const CURVE = 14;
  const ROW_GAP = Math.max(GAP_Y, 72);
  const ROW_PITCH = NODE_H + ROW_GAP;
  const count = WAVES.length;
  const rows = Math.ceil(count / COLS);
  const graphW = COLS * NODE_W + (COLS - 1) * GAP_X + PAD * 2;
  const graphH =
    PAD * 2 + rows * NODE_H + Math.max(0, rows - 1) * ROW_GAP + CURVE;
  const canvasW = graphW + WORLD_PAD * 2;
  const canvasH = graphH + WORLD_PAD * 2;
  const positions = new Map<string, LayoutNode>();

  WAVES.forEach((w, i) => {
    const row = Math.floor(i / COLS);
    const indexInRow = i % COLS;
    const itemsInRow =
      row === rows - 1 && count % COLS !== 0 ? count % COLS : COLS;
    // Snake: even rows left→right, odd rows right→left
    const col =
      row % 2 === 0 ? indexInRow : itemsInRow - 1 - indexInRow;
    const rowWidth =
      itemsInRow * NODE_W + Math.max(0, itemsInRow - 1) * GAP_X;
    const rowStartX = WORLD_PAD + (graphW - rowWidth) / 2;
    const t = itemsInRow === 1 ? 0.5 : col / (itemsInRow - 1);
    // Same-direction bow each row so mid-column nodes stay clear
    const bow = Math.sin(t * Math.PI) * CURVE * (row % 2 === 0 ? 1 : 0.55);

    positions.set(String(w.id), {
      id: String(w.id),
      x: rowStartX + col * (NODE_W + GAP_X),
      y: WORLD_PAD + PAD + row * ROW_PITCH + bow,
      title: `${String(w.id).padStart(2, "0")}  ${w.label}`,
      subtitle: w.focus ? "Current focus" : w.blurb,
    });
  });

  const edges = getWaveEdges().map((e) => ({
    from: String(e.from),
    to: String(e.to),
  }));
  return { positions, canvasW, canvasH, edges };
}

function edgePath(a: LayoutNode, b: LayoutNode): string {
  const acx = a.x + NODE_W / 2;
  const acy = a.y + NODE_H / 2;
  const bcx = b.x + NODE_W / 2;
  const bcy = b.y + NODE_H / 2;
  const dx = bcx - acx;
  const dy = bcy - acy;

  if (Math.abs(dx) >= Math.abs(dy)) {
    const x1 = dx >= 0 ? a.x + NODE_W : a.x;
    const y1 = acy;
    const x2 = dx >= 0 ? b.x : b.x + NODE_W;
    const y2 = bcy;
    const midX = (x1 + x2) / 2;
    return `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;
  }

  const x1 = acx;
  const y1 = dy >= 0 ? a.y + NODE_H : a.y;
  const x2 = bcx;
  const y2 = dy >= 0 ? b.y : b.y + NODE_H;
  const midY = (y1 + y2) / 2;
  return `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
}

function layoutWaveTracks(wave: number): GraphLayout {
  const trackLayers = getTrackLayers(wave);
  const layers = trackLayers.map((layer) =>
    layer.tracks.map((t) => ({
      id: t.id,
      title: t.label,
      subtitle: t.blurb,
    })),
  );
  return layoutLayered(layers, getTrackEdges(wave));
}

function trackHeadId(trackId: string) {
  return `track:${trackId}`;
}

function layoutTrackSkills(trackId: string): GraphLayout {
  const track = TRACKS.find((t) => t.id === trackId);
  const skills = conceptsInTrack(trackId);
  const inTrack = new Set(skills.map((c) => c.id));
  const headId = trackHeadId(trackId);

  const externalIds = new Set<string>();
  for (const skill of skills) {
    for (const parent of directPrereqs(skill.id)) {
      if (!inTrack.has(parent) && CONCEPT_BY_ID[parent]) {
        externalIds.add(parent);
      }
    }
  }

  const depthMemo = new Map<string, number>();
  function inTrackDepth(id: string, stack: Set<string>): number {
    if (depthMemo.has(id)) return depthMemo.get(id)!;
    if (stack.has(id)) return 0;
    stack.add(id);
    const parents = directPrereqs(id).filter((p) => inTrack.has(p));
    const d =
      parents.length === 0
        ? 0
        : 1 + Math.max(...parents.map((p) => inTrackDepth(p, stack)));
    stack.delete(id);
    depthMemo.set(id, d);
    return d;
  }

  for (const skill of skills) inTrackDepth(skill.id, new Set());

  const maxDepth =
    skills.length === 0 ? -1 : Math.max(0, ...[...depthMemo.values()]);
  const skillLayers: { id: string; title: string; subtitle: string }[][] = [];
  for (let d = 0; d <= maxDepth; d++) {
    skillLayers.push(
      skills
        .filter((c) => depthMemo.get(c.id) === d)
        .map((c) => ({
          id: c.id,
          title: c.label,
          subtitle: c.hintSyntax,
        })),
    );
  }

  const layers: { id: string; title: string; subtitle: string }[][] = [];
  if (externalIds.size > 0) {
    layers.push(
      [...externalIds].map((id) => {
        const c = CONCEPT_BY_ID[id]!;
        return {
          id: c.id,
          title: c.label,
          subtitle: "Prerequisite",
        };
      }),
    );
  }
  layers.push([
    {
      id: headId,
      title: track?.label ?? trackId,
      subtitle: track?.blurb ?? "Section",
    },
  ]);
  for (const layer of skillLayers) {
    if (layer.length > 0) layers.push(layer);
  }

  const edges: { from: string; to: string }[] = [];
  for (const skill of skills) {
    const inTrackParents = directPrereqs(skill.id).filter((p) =>
      inTrack.has(p),
    );
    const externalParents = directPrereqs(skill.id).filter((p) =>
      externalIds.has(p),
    );

    if (inTrackParents.length === 0) {
      edges.push({ from: headId, to: skill.id });
    } else {
      for (const parent of inTrackParents) {
        edges.push({ from: parent, to: skill.id });
      }
    }
    for (const parent of externalParents) {
      edges.push({ from: parent, to: skill.id });
    }
  }

  return layoutLayered(layers, edges);
}

type DrillLevel = "waves" | "tracks" | "skills";

export function CurriculumWaterfall({ progress }: Props) {
  const router = useRouter();
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const [openWaveId, setOpenWaveId] = useState<number | null>(null);
  const [openTrackId, setOpenTrackId] = useState<string | null>(null);

  const pointsMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const row of progress) {
      if (!CONCEPT_BY_ID[row.conceptId]) continue;
      m.set(row.conceptId, row.skillPoints);
    }
    return m;
  }, [progress]);

  const openWave: WaveDef | null =
    WAVES.find((w) => w.id === openWaveId) ?? null;
  const openTrack = TRACKS.find((t) => t.id === openTrackId) ?? null;

  const drillLevel: DrillLevel =
    openTrackId != null
      ? "skills"
      : openWaveId != null
        ? "tracks"
        : "waves";

  const layout = useMemo(() => {
    if (openTrackId != null) return layoutTrackSkills(openTrackId);
    if (openWaveId != null) return layoutWaveTracks(openWaveId);
    return layoutWaves();
  }, [openWaveId, openTrackId]);

  const { positions, canvasW, canvasH, edges } = layout;

  function onNodePointerDown(e: React.PointerEvent) {
    pointerStart.current = { x: e.clientX, y: e.clientY };
  }

  function isTap(e: React.PointerEvent) {
    const start = pointerStart.current;
    pointerStart.current = null;
    if (!start) return false;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    return dx * dx + dy * dy <= CLICK_SLOP_PX * CLICK_SLOP_PX;
  }

  function onWavePointerUp(waveId: number, e: React.PointerEvent) {
    if (!isTap(e)) return;
    setOpenWaveId(waveId);
    setOpenTrackId(null);
  }

  function onTrackPointerUp(trackId: string, e: React.PointerEvent) {
    if (!isTap(e)) return;
    setOpenTrackId(trackId);
  }

  function onSkillPointerUp(skillId: string, e: React.PointerEvent) {
    if (!isTap(e)) return;
    if (!CONCEPT_BY_ID[skillId]) return;
    router.push(`/?start=${encodeURIComponent(skillId)}#learn`);
  }

  function backOneLevel() {
    if (openTrackId != null) {
      setOpenTrackId(null);
      return;
    }
    setOpenWaveId(null);
  }

  return (
    <section id="path" className="flex flex-col gap-2.5">
      <div className="flex flex-wrap items-center gap-3 border border-line bg-surface-raised px-3.5 py-2 text-xs text-ink/80">
        <span className="inline-flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-sm"
            style={{ background: "#c5ccc8" }}
          />
          Not started
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-sm"
            style={{
              background:
                "linear-gradient(90deg, #f5efd0 0%, #d4a017 100%)",
            }}
          />
          In progress
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-sm"
            style={{ background: "#2f6f4e" }}
          />
          Mastered
        </span>
      </div>

      <div
        key={`${drillLevel}-${openWaveId ?? "root"}-${openTrackId ?? ""}`}
        className="path-drill-view relative"
      >
        {drillLevel !== "waves" ? (
          <button
            type="button"
            onClick={backOneLevel}
            className="mb-3 border border-line bg-surface-raised px-2.5 py-1 text-sm font-medium text-ink hover:border-accent hover:text-accent"
          >
            {drillLevel === "skills"
              ? `← Wave ${openWave?.id ?? ""} sections`
              : "← All waves"}
          </button>
        ) : null}

        <svg
          width={canvasW}
          height={canvasH}
          viewBox={`0 0 ${canvasW} ${canvasH}`}
          className="h-auto max-h-[min(72vh,640px)] w-full select-none"
          role="img"
          aria-label={
            drillLevel === "skills" && openTrack
              ? `${openTrack.label} skills`
              : openWave
                ? `Wave ${openWave.id} sections path`
                : "Curriculum waves path"
          }
        >
          {edges.map((edge, edgeIndex) => {
            const a = positions.get(edge.from);
            const b = positions.get(edge.to);
            if (!a || !b) return null;
            return (
              <path
                key={`${edge.from}->${edge.to}`}
                className="path-edge"
                d={edgePath(a, b)}
                fill="none"
                stroke="#c9d2cc"
                strokeWidth={2}
                pathLength={1}
                style={{
                  animationDelay: `${edgeIndex * 45}ms, ${700 + edgeIndex * 45}ms`,
                }}
              />
            );
          })}

          {[...positions.values()].map((node, nodeIndex) => {
            const nodeDelay = `${120 + nodeIndex * 55}ms`;
            if (drillLevel === "waves") {
              const waveNum = Number(node.id);
              const style = waveStyle(waveNum, pointsMap);
              const wave = WAVES.find((w) => w.id === waveNum);
              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  onPointerDown={onNodePointerDown}
                  onPointerUp={(e) => onWavePointerUp(waveNum, e)}
                  style={{ cursor: "pointer" }}
                >
                  <g
                    className="path-node path-node-hit"
                    style={{ animationDelay: nodeDelay }}
                  >
                    <rect
                      width={NODE_W}
                      height={NODE_H}
                      rx={6}
                      fill={style.fill}
                      stroke={wave?.focus ? "#0f766e" : "#c9d2cc"}
                      strokeWidth={wave?.focus ? 2.5 : 1}
                    />
                    <foreignObject width={NODE_W} height={NODE_H}>
                      <div
                        className="pointer-events-none flex h-full flex-col justify-center px-3 py-2"
                        style={{ color: style.labelColor }}
                      >
                        <span className="text-[15px] font-semibold leading-snug">
                          {node.title}
                        </span>
                        <span
                          className="mt-1 font-mono text-[11px]"
                          style={{
                            color:
                              style.kind === "green"
                                ? "rgb(247 250 248 / 0.92)"
                                : "rgb(18 21 26 / 0.78)",
                          }}
                        >
                          {style.total > 0
                            ? `${style.seen}/${style.total} skills`
                            : "Roadmap"}
                          {style.kind === "green" ? " · done" : ""}
                        </span>
                      </div>
                    </foreignObject>
                  </g>
                </g>
              );
            }

            if (drillLevel === "tracks") {
              const style = sectionStyle(node.id, pointsMap);
              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  onPointerDown={onNodePointerDown}
                  onPointerUp={(e) => onTrackPointerUp(node.id, e)}
                  style={{ cursor: "pointer" }}
                >
                  <g
                    className="path-node path-node-hit"
                    style={{ animationDelay: nodeDelay }}
                  >
                    <rect
                      width={NODE_W}
                      height={NODE_H}
                      rx={6}
                      fill={style.fill}
                      stroke="#c9d2cc"
                      strokeWidth={1}
                    />
                    <foreignObject width={NODE_W} height={NODE_H}>
                      <div
                        className="pointer-events-none flex h-full flex-col justify-center px-3 py-2"
                        style={{ color: style.labelColor }}
                      >
                        <span className="text-[15px] font-semibold leading-snug">
                          {node.title}
                        </span>
                        <span
                          className="mt-1 font-mono text-[11px]"
                          style={{
                            color:
                              style.kind === "green"
                                ? "rgb(247 250 248 / 0.92)"
                                : "rgb(18 21 26 / 0.78)",
                          }}
                        >
                          {style.total > 0
                            ? `${style.seen}/${style.total} skills`
                            : "Planned"}
                          {style.kind === "green" ? " · done" : ""}
                        </span>
                      </div>
                    </foreignObject>
                  </g>
                </g>
              );
            }

            const isTrackHead = node.id.startsWith("track:");
            if (isTrackHead) {
              const trackId = node.id.slice("track:".length);
              const style = sectionStyle(trackId, pointsMap);
              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                >
                  <g
                    className="path-node"
                    style={{ animationDelay: nodeDelay }}
                  >
                    <rect
                      width={NODE_W}
                      height={NODE_H}
                      rx={6}
                      fill={style.fill}
                      stroke="#0f766e"
                      strokeWidth={2.5}
                    />
                    <foreignObject width={NODE_W} height={NODE_H}>
                      <div
                        className="pointer-events-none flex h-full flex-col justify-center px-3 py-2"
                        style={{ color: style.labelColor }}
                      >
                        <span className="text-[15px] font-semibold leading-snug">
                          {node.title}
                        </span>
                        <span
                          className="mt-1 font-mono text-[11px]"
                          style={{
                            color:
                              style.kind === "green"
                                ? "rgb(247 250 248 / 0.92)"
                                : "rgb(18 21 26 / 0.78)",
                          }}
                        >
                          Section · skills below
                        </span>
                      </div>
                    </foreignObject>
                  </g>
                </g>
              );
            }

            const style = nodeStyle(node.id, pointsMap);
            const isPrereq = node.subtitle === "Prerequisite";
            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onPointerDown={onNodePointerDown}
                onPointerUp={(e) => onSkillPointerUp(node.id, e)}
                style={{ cursor: "pointer" }}
              >
                <g
                  className="path-node path-node-hit"
                  style={{ animationDelay: nodeDelay }}
                >
                  <rect
                    width={NODE_W}
                    height={NODE_H}
                    rx={6}
                    fill={style.fill}
                    stroke="#c9d2cc"
                    strokeWidth={1}
                  />
                  <foreignObject width={NODE_W} height={NODE_H}>
                    <div
                      className="pointer-events-none flex h-full flex-col justify-center px-3 py-2"
                      style={{ color: style.labelColor }}
                    >
                      <span className="text-[14px] font-semibold leading-snug">
                        {node.title}
                      </span>
                      <span
                        className="mt-1 font-mono text-[11px]"
                        style={{
                          color:
                            style.kind === "green"
                              ? "rgb(247 250 248 / 0.92)"
                              : "rgb(18 21 26 / 0.78)",
                        }}
                      >
                        {isPrereq ? "Prerequisite · Learn" : "Open in Learn"}
                      </span>
                    </div>
                  </foreignObject>
                </g>
              </g>
            );
          })}
        </svg>
      </div>
    </section>
  );
}
