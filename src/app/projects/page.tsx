/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { api } from "@/api";
import { useRouter } from "next/navigation";
import { StatusBadge, Spinner, Empty, Toast } from "../../components/UI";

export default function Projects() {
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showNew, setShowNew] = useState(false);
  const [projName, setProjName] = useState("");
  const [simReq, setSimReq] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const loadProjects = () => {
    setLoading(true);
    api.graph.listProjects()
      .then((res) => setProjects(res.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projName || !simReq || !files || files.length === 0) {
      setError("Please fill all fields and select a file");
      return;
    }
    setError("");
    setGenerating(true);
    
    try {
      const fd = new FormData();
      fd.append("project_name", projName);
      fd.append("simulation_requirement", simReq);
      for (let i = 0; i < files.length; i++) {
        fd.append("files", files[i]);
      }
      
      await api.graph.generateOntology(fd);
      setShowNew(false);
      setProjName("");
      setSimReq("");
      setFiles(null);
      loadProjects();
    } catch (err: any) {
      setError(err.message || "Failed to create project");
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;
    try {
      await api.graph.deleteProject(id);
      loadProjects();
    } catch (err: any) {
      alert(err.message || "Failed to delete");
    }
  };
  
  const handleBuild = async (id: string) => {
    try {
      await api.graph.buildGraph(id);
      loadProjects();
    } catch (err: any) {
      alert(err.message || "Failed to build graph");
    }
  };

  return (
    <div className="page">
      <div className="page-header flex-row justify-between items-center border-b pb-6">
        <div>
          <div className="page-title">Projects</div>
          <div className="page-sub">Manage your knowledge graphs and simulation environments</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowNew(!showNew)}>
          {showNew ? "Cancel" : "✦ New Project"}
        </button>
      </div>

      {showNew && (
        <div className="card">
          <div className="card-header"><div className="card-title">Create New Project</div></div>
          {error && <Toast type="error" msg={error} />}
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <div>
              <label className="label">Project Name</label>
              <input type="text" className="input mt-1" value={projName} onChange={e => setProjName(e.target.value)} placeholder="My Project" required />
            </div>
            <div>
              <label className="label">Simulation Requirement</label>
              <textarea className="input mt-1 h-24 resize-none" value={simReq} onChange={e => setSimReq(e.target.value)} placeholder="Describe the simulation scenario..." required />
            </div>
            <div>
              <label className="label">Upload Documents</label>
              <input type="file" multiple className="mt-1 block w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-zinc-100 file:text-zinc-700 hover:file:bg-zinc-200 dark:file:bg-zinc-800 dark:file:text-zinc-300" onChange={e => setFiles(e.target.files)} required />
            </div>
            <div className="flex justify-end mt-2">
              <button type="submit" className="btn btn-primary" disabled={generating}>
                {generating ? <><Spinner /> Generating Ontology...</> : "Generate Ontology"}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-muted"><Spinner /><span>Loading projects...</span></div>
      ) : projects.length === 0 ? (
        <Empty icon="📁" title="No projects found" sub="Create a new project to get started" />
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Project Name</th>
                  <th>ID</th>
                  <th>Status</th>
                  <th>Documents</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => (
                  <tr key={p.project_id}>
                    <td className="font-medium text-zinc-900 dark:text-zinc-100">{p.name ?? p.project_name ?? "Unnamed Project"}</td>
                    <td><span className="chip">{p.project_id.slice(0, 8)}</span></td>
                    <td><StatusBadge status={p.status} /></td>
                    <td>{p.files?.length || 0} files</td>
                    <td>
                      <div className="flex gap-2">
                        {p.status === "ontology_generated" && (
                          <button className="btn btn-secondary btn-sm" onClick={() => handleBuild(p.project_id)}>Build Graph</button>
                        )}
                        {p.status === "graph_building" && (
                          <button className="btn btn-secondary btn-sm" disabled>Building...</button>
                        )}
                        {p.status === "graph_completed" && (
                          <button className="btn btn-secondary btn-sm" onClick={() => router.push(`/projects/${p.project_id}/graph`)}>View Graph</button>
                        )}
                        <button className="btn btn-ghost btn-sm text-red-500" onClick={() => handleDelete(p.project_id)}>Delete</button>
                      </div>
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
