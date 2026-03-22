/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { api } from "@/api";
import { useRouter } from "next/navigation";
import { Spinner, Toast } from "../../components/UI";

export default function NewSimulation() {
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [projectId, setProjectId] = useState("");
  const [enableTwitter, setEnableTwitter] = useState(true);
  const [enableReddit, setEnableReddit] = useState(true);
  
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.graph.listProjects()
      .then((res) => {
        const readyProjects = (res.data ?? []).filter((p: any) => p.status === "graph_completed");
        setProjects(readyProjects);
        if (readyProjects.length > 0) setProjectId(readyProjects[0].project_id);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) {
      setError("Please select a valid project");
      return;
    }
    setError("");
    setCreating(true);
    
    try {
      const res = await api.simulation.create(projectId, undefined, enableTwitter, enableReddit);
      if (res.data?.simulation_id) {
        router.push(`/simulations/${res.data.simulation_id}`);
      } else {
        throw new Error("No simulation ID returned");
      }
    } catch (err: any) {
      setError(err.message || "Failed to create simulation");
      setCreating(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header border-b pb-6">
        <div className="page-title">New Simulation</div>
        <div className="page-sub">Create a new simulation instance from a project</div>
      </div>

      <div className="card max-w-2xl mt-4">
        {loading ? (
          <div className="flex items-center gap-2 text-muted"><Spinner /><span>Loading ready projects...</span></div>
        ) : projects.length === 0 ? (
          <div className="text-zinc-600 dark:text-zinc-400">
            No projects with completed graphs found. Please go to the <a href="/projects" className="text-indigo-500 hover:underline">Projects</a> page and build a graph first.
          </div>
        ) : (
          <form onSubmit={handleCreate} className="flex flex-col gap-6">
            {error && <Toast type="error" msg={error} />}
            
            <div>
              <label className="label">Select Project</label>
              <select className="input mt-1" value={projectId} onChange={e => setProjectId(e.target.value)} required>
                {projects.map(p => (
                  <option key={p.project_id} value={p.project_id}>{p.name ?? p.project_name ?? "Unnamed Project"}</option>
                ))}
              </select>
              <p className="text-xs text-muted mt-1">Only projects with completed graphs are shown here.</p>
            </div>

            <div>
              <label className="label mb-2">Social Platforms</label>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-sm text-zinc-800 dark:text-zinc-200 cursor-pointer">
                  <input type="checkbox" className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-600" checked={enableTwitter} onChange={e => setEnableTwitter(e.target.checked)} />
                  Enable Twitter Simulation
                </label>
                <label className="flex items-center gap-2 text-sm text-zinc-800 dark:text-zinc-200 cursor-pointer">
                  <input type="checkbox" className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-600" checked={enableReddit} onChange={e => setEnableReddit(e.target.checked)} />
                  Enable Reddit Simulation
                </label>
              </div>
            </div>

            <div className="flex justify-end border-t border-zinc-100 dark:border-zinc-800 pt-4 mt-2">
              <button type="submit" className="btn btn-primary" disabled={creating}>
                {creating ? <><Spinner /> Creating...</> : "Create Simulation"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
