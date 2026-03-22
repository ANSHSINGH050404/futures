"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/api";
import { ProgressBar, Spinner, StatCard, StatusBadge, Toast } from "../../../../components/UI";

type ProjectStatus =
  | "created"
  | "ontology_generated"
  | "graph_building"
  | "graph_completed"
  | "failed";

interface Project {
  project_id: string;
  name?: string;
  project_name?: string;
  status: ProjectStatus | string;
  graph_id?: string | null;
  graph_build_task_id?: string | null;
}

interface Task {
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  message: string;
}

interface GraphNode {
  id: string;
  label: string;
  type: string;
  x: number;
  y: number;
  degree: number;
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
}

interface GraphData {
  graph_id: string;
  project_id: string;
  generated_at: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  stats: {
    node_count: number;
    edge_count: number;
    node_type_counts: Record<string, number>;
    edge_type_counts: Record<string, number>;
  };
}

const PALETTE = [
  "#6366f1",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#3b82f6",
  "#8b5cf6",
  "#14b8a6",
  "#f97316",
  "#22c55e",
  "#e11d48",
];

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

function errorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;
  try {
    return JSON.stringify(e);
  } catch {
    return String(e);
  }
}

export default function ProjectGraphPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };

  const [project, setProject] = useState<Project | null>(null);
  const [task, setTask] = useState<Task | null>(null);
  const [graph, setGraph] = useState<GraphData | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [building, setBuilding] = useState(false);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError("");

      const projRes = await api.graph.getProject(id);
      const p: Project = projRes.data;
      setProject(p);

      if (p.status === "graph_building" && p.graph_build_task_id) {
        const tRes = await api.graph.getTask(p.graph_build_task_id);
        setTask(tRes.data);
      } else {
        setTask(null);
      }

      if (p.status === "graph_completed") {
        const gRes = await api.graph.getProjectGraph(id);
        setGraph(gRes.data);
      } else {
        setGraph(null);
        setSelectedNodeId(null);
      }
    } catch (e: unknown) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
      setBuilding(false);
    }
  }, [id]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const shouldPoll = project?.status === "graph_building" && !!project?.graph_build_task_id;
  useEffect(() => {
    if (!shouldPoll) return;
    const interval = setInterval(() => {
      load();
    }, 1500);
    return () => clearInterval(interval);
  }, [load, shouldPoll]);

  const handleBuildGraph = async () => {
    setBuilding(true);
    setError("");
    try {
      await api.graph.buildGraph(id);
      await load();
    } catch (e: unknown) {
      const msg = errorMessage(e);
      setError(msg || "Failed to start graph build");
      setBuilding(false);
    }
  };

  const typeColors = useMemo(() => {
    const counts = graph?.stats?.node_type_counts ?? {};
    const types = Object.keys(counts).sort();
    const m: Record<string, string> = {};
    types.forEach((t, idx) => {
      m[t] = PALETTE[idx % PALETTE.length]!;
    });
    return m;
  }, [graph]);

  const nodesById = useMemo(() => {
    return new Map<string, GraphNode>((graph?.nodes ?? []).map((n) => [n.id, n]));
  }, [graph]);

  const neighborIds = useMemo(() => {
    if (!graph || !selectedNodeId) return new Set<string>();
    const set = new Set<string>();
    for (const e of graph.edges) {
      if (e.source === selectedNodeId) set.add(e.target);
      if (e.target === selectedNodeId) set.add(e.source);
    }
    return set;
  }, [graph, selectedNodeId]);

  const selectedNode = selectedNodeId ? nodesById.get(selectedNodeId) ?? null : null;

  const W = 1000;
  const H = 620;
  const P = 60;

  return (
    <div className="page">
      <div className="page-header flex-row justify-between items-center border-b pb-6">
        <div>
          <div className="page-title">Graph Viewer</div>
          <div className="page-sub">
            Project: <span className="mono">{id.slice(0, 12)}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-ghost" onClick={() => router.push("/projects")}>
            ← Back
          </button>
          <button className="btn btn-secondary" onClick={() => load()} disabled={loading}>
            Refresh
          </button>
        </div>
      </div>

      {error && <Toast type="error" msg={error} />}

      {loading && !project ? (
        <div className="flex items-center gap-2 text-muted">
          <Spinner />
          <span>Loading project...</span>
        </div>
      ) : !project ? (
        <Toast type="error" msg="Project not found" />
      ) : (
        <>
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                {project.name ?? project.project_name ?? "Unnamed Project"}{" "}
                <span className="ml-2">
                  <StatusBadge status={project.status} />
                </span>
              </div>
              {project.status === "ontology_generated" && (
                <button className="btn btn-primary btn-sm" onClick={handleBuildGraph} disabled={building}>
                  {building ? (
                    <>
                      <Spinner /> Building...
                    </>
                  ) : (
                    "Build Graph"
                  )}
                </button>
              )}
            </div>

            {project.status === "graph_building" && (
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-sm">
                  <div className="text-muted">{task?.message ?? "Building graph..."}</div>
                  <div className="mono">{Math.round(task?.progress ?? 0)}%</div>
                </div>
                <ProgressBar value={task?.progress ?? 0} color="blue" pulse />
                <div className="text-xs text-muted">
                  This is a mock build; refresh is automatic while it runs.
                </div>
              </div>
            )}
          </div>

          {graph && (
            <>
              <div className="stat-grid">
                <StatCard value={graph.stats.node_count} label="Nodes" />
                <StatCard value={graph.stats.edge_count} label="Edges" />
                <StatCard value={Object.keys(graph.stats.node_type_counts).length} label="Node Types" />
                <StatCard value={Object.keys(graph.stats.edge_type_counts).length} label="Edge Types" color="var(--blue)" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="card lg:col-span-2">
                  <div className="card-header">
                    <div className="card-title">Graph</div>
                    <div className="text-xs text-muted">
                      Click a node to highlight neighbors.
                    </div>
                  </div>

                  <div className="w-full overflow-auto rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-black">
                    <svg
                      viewBox={`0 0 ${W} ${H}`}
                      className="w-full h-[520px]"
                      role="img"
                      aria-label="Project graph"
                    >
                      {/* edges */}
                      {graph.edges.map((e) => {
                        const s = nodesById.get(e.source);
                        const t = nodesById.get(e.target);
                        if (!s || !t) return null;

                        const active =
                          !!selectedNodeId &&
                          (e.source === selectedNodeId || e.target === selectedNodeId);

                        const x1 = P + clamp01(s.x) * (W - 2 * P);
                        const y1 = P + clamp01(s.y) * (H - 2 * P);
                        const x2 = P + clamp01(t.x) * (W - 2 * P);
                        const y2 = P + clamp01(t.y) * (H - 2 * P);

                        return (
                          <line
                            key={e.id}
                            x1={x1}
                            y1={y1}
                            x2={x2}
                            y2={y2}
                            stroke={active ? "#3b82f6" : "#94a3b8"}
                            strokeOpacity={selectedNodeId ? (active ? 0.85 : 0.18) : 0.28}
                            strokeWidth={active ? 2 : 1}
                          />
                        );
                      })}

                      {/* nodes */}
                      {graph.nodes.map((n) => {
                        const selected = n.id === selectedNodeId;
                        const neighbor = selectedNodeId ? neighborIds.has(n.id) : false;
                        const visible = !selectedNodeId || selected || neighbor;

                        const x = P + clamp01(n.x) * (W - 2 * P);
                        const y = P + clamp01(n.y) * (H - 2 * P);
                        const fill = typeColors[n.type] ?? "#64748b";

                        return (
                          <g key={n.id} style={{ cursor: "pointer" }} onClick={() => setSelectedNodeId(n.id)}>
                            <circle
                              cx={x}
                              cy={y}
                              r={selected ? 8 : 5.5}
                              fill={fill}
                              fillOpacity={visible ? 0.95 : 0.25}
                              stroke={selected ? "#0f172a" : "rgba(15, 23, 42, 0.25)"}
                              strokeWidth={selected ? 2 : 1}
                            >
                              <title>{`${n.label} • ${n.type} • degree ${n.degree}`}</title>
                            </circle>
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <div className="card-title">Details</div>
                    <button className="btn btn-ghost btn-sm" onClick={() => setSelectedNodeId(null)} disabled={!selectedNodeId}>
                      Clear
                    </button>
                  </div>

                  {!selectedNode ? (
                    <div className="text-sm text-muted">Select a node to view details.</div>
                  ) : (
                    <div className="flex flex-col gap-3 text-sm">
                      <div>
                        <div className="text-muted text-xs uppercase tracking-wider font-semibold">Label</div>
                        <div className="font-medium">{selectedNode.label}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-muted text-xs uppercase tracking-wider font-semibold">Type</div>
                        <span className="badge badge-blue">{selectedNode.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted">Degree</span>
                        <span className="mono">{selectedNode.degree}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted">Neighbors</span>
                        <span className="mono">{neighborIds.size}</span>
                      </div>
                    </div>
                  )}

                  <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 mt-2">
                    <div className="text-muted text-xs uppercase tracking-wider font-semibold mb-2">
                      Node Types
                    </div>
                    <div className="flex flex-col gap-2">
                      {Object.entries(graph.stats.node_type_counts)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 12)
                        .map(([t, c]) => (
                          <div key={t} className="flex items-center justify-between gap-2 text-sm">
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className="inline-block rounded-sm"
                                style={{ width: 10, height: 10, background: typeColors[t] ?? "#64748b" }}
                              />
                              <span className="truncate">{t}</span>
                            </div>
                            <span className="mono text-muted">{c}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {project.status === "graph_completed" && !graph && !loading && (
            <Toast type="warn" msg="Graph completed but no graph data returned. Try Refresh." />
          )}
        </>
      )}
    </div>
  );
}
