"use client";

import { useEffect, useState } from "react";
import { api } from "@/api";
import { useRouter } from "next/navigation";
import { StatusBadge, Spinner, Empty } from "../../components/UI";

interface SimData {
  simulation_id: string;
  project_name?: string;
  status?: string;
  runner_status?: string;
  entities_count?: number;
  current_round?: number;
  total_rounds?: number;
}

export default function Simulations() {
  const router = useRouter();
  const [sims, setSims] = useState<SimData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.simulation.history(50)
      .then((res) => setSims(res.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page">
      <div className="page-header flex-row justify-between items-center border-b pb-6">
        <div>
          <div className="page-title">Simulations</div>
          <div className="page-sub">View and manage all simulations</div>
        </div>
        <button className="btn btn-primary" onClick={() => router.push("/new")}>✦ New Simulation</button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-muted"><Spinner /><span>Loading...</span></div>
      ) : sims.length === 0 ? (
        <Empty icon="▶" title="No simulations yet" sub="Create a new simulation to get started" />
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Project Name</th>
                  <th>Status</th>
                  <th>Agents</th>
                  <th>Progress</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sims.map((s) => (
                  <tr key={s.simulation_id}>
                    <td><span className="chip">{s.simulation_id.slice(0, 14)}</span></td>
                    <td className="font-medium text-zinc-900 dark:text-zinc-100">{s.project_name || "—"}</td>
                    <td><StatusBadge status={s.runner_status ?? s.status ?? "unknown"} /></td>
                    <td>{s.entities_count || 0}</td>
                    <td>
                      {(s.total_rounds ?? 0) > 0 ? (
                        <span className="mono text-sm">{s.current_round || 0}/{s.total_rounds}</span>
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
        </div>
      )}
    </div>
  );
}