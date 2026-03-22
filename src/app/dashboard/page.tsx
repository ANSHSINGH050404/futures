"use client";

import { useEffect, useState } from "react";
import { api } from "@/api";
import { StatusBadge, StatCard, Empty, Spinner } from "../../components/UI";
import { useRouter } from "next/navigation";

interface SimData {
  simulation_id: string;
  project_name?: string;
  status?: string;
  runner_status?: string;
  entities_count?: number;
  current_round?: number;
  total_rounds?: number;
}

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<unknown[]>([]);
  const [sims, setSims] = useState<SimData[]>([]);
  const [reports, setReports] = useState<unknown[]>([]);

  useEffect(() => {
    Promise.all([
      api.graph.listProjects(),
      api.simulation.history(5),
      api.report.list(),
    ]).then(([p, s, r]) => {
      setProjects(p.data ?? []);
      setSims(s.data ?? []);
      setReports(r.data ?? []);
    }).finally(() => setLoading(false));
  }, []);

  const activeSims = sims.filter((s: SimData) => s.runner_status === "running").length;

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title">Dashboard</div>
        <div className="page-sub">Overview of all MiroFish resources</div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-muted"><Spinner /><span>Loading…</span></div>
      ) : (
        <>
          <div className="stat-grid" style={{ marginBottom: 28 }}>
            <StatCard value={projects.length} label="Projects" />
            <StatCard value={sims.length} label="Simulations" />
            <StatCard value={activeSims} label="Running" color="var(--green)" />
            <StatCard value={reports.length} label="Reports" color="var(--blue)" />
          </div>

          {/* Quick actions */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header"><div className="card-title">Quick Actions</div></div>
            <div className="flex gap-3 flex-wrap">
              <button className="btn btn-primary" onClick={() => router.push("/new")}>✦ New Simulation</button>
              <button className="btn btn-secondary" onClick={() => router.push("/projects")}>📁 View Projects</button>
              <button className="btn btn-secondary" onClick={() => router.push("/simulations")}>▶ Simulations</button>
              <button className="btn btn-secondary" onClick={() => router.push("/reports")}>📊 Reports</button>
            </div>
          </div>

          {/* Recent simulations */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Recent Simulations</div>
              <button className="btn btn-ghost btn-sm" onClick={() => router.push("/history")}>View all →</button>
            </div>
            {sims.length === 0 ? (
              <Empty icon="▶" title="No simulations yet" sub="Create a new simulation to get started" />
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>ID</th><th>Project</th><th>Status</th><th>Agents</th><th>Progress</th><th></th></tr>
                  </thead>
                  <tbody>
                    {sims.map((s: SimData) => (
                      <tr key={s.simulation_id}>
                        <td><span className="chip">{s.simulation_id.slice(0, 14)}</span></td>
                        <td>{s.project_name ?? "—"}</td>
                        <td><StatusBadge status={s.runner_status ?? s.status ?? "unknown"} /></td>
                        <td>{s.entities_count ?? 0}</td>
                        <td>
                          {(s.total_rounds ?? 0) > 0 ? (
                            <span className="mono text-sm">{s.current_round}/{s.total_rounds}</span>
                          ) : "—"}
                        </td>
                        <td>
                          <button className="btn btn-ghost btn-sm" onClick={() => router.push(`/simulations/${s.simulation_id}`)}>Open →</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}