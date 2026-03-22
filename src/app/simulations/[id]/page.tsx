/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState } from "react";
import { api } from "@/api";
import { useParams, useRouter } from "next/navigation";
import { StatusBadge, Spinner, ProgressBar, Toast, StatCard } from "../../../components/UI";

export default function SimulationDetail() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const [sim, setSim] = useState<any>(null);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [runStatus, setRunStatus] = useState<any>(null);
  
  const [loading, setLoading] = useState(true);
  const [preparing, setPreparing] = useState(false);
  const [starting, setStarting] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [reporting, setReporting] = useState(false);

  const loadData = async () => {
    try {
      const [simRes, runRes] = await Promise.all([
        api.simulation.get(id),
        api.simulation.runStatus(id),
      ]);

      const simData = simRes.data;
      setSim(simData);
      setRunStatus(runRes.data);

      if (simData?.profiles_count > 0 && ["ready", "running", "completed", "stopped", "paused"].includes(simData?.status)) {
        const profRes = await api.simulation.profiles(id, "reddit"); // Defaulting to reddit for display
        setProfiles(profRes.data.profiles ?? []);
      } else {
        setProfiles([]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadData();
  }, [id]);

  const runnerStatus = runStatus?.runner_status ?? "idle";
  const isPreparing = sim?.status === "preparing" || preparing;
  const isRunning = runnerStatus === "starting" || runnerStatus === "running";
  const shouldPoll = isPreparing || isRunning || sim?.status === "running";

  useEffect(() => {
    if (!shouldPoll) return;
    const interval = setInterval(() => {
      loadData();
    }, 3000);
    return () => clearInterval(interval);
  }, [id, shouldPoll]);

  const handlePrepare = async () => {
    setPreparing(true);
    try {
      await api.simulation.prepare(id);
      loadData();
    } catch (e: any) {
      alert(e.message || "Failed to prepare");
    } finally {
      setPreparing(false);
    }
  };

  const handleStart = async () => {
    setStarting(true);
    try {
      await api.simulation.start(id, "parallel", 5); // 5 rounds default
      loadData();
    } catch (e: any) {
      alert(e.message || "Failed to start");
    } finally {
      setStarting(false);
    }
  };

  const handleStop = async () => {
    setStopping(true);
    try {
      await api.simulation.stop(id);
      loadData();
    } catch (e: any) {
      alert(e.message || "Failed to stop");
    } finally {
      setStopping(false);
    }
  };

  const handleGenerateReport = async () => {
    setReporting(true);
    try {
      await api.report.generate(id);
      router.push("/reports");
    } catch (e: any) {
      alert(e.message || "Failed to generate report");
    } finally {
      setReporting(false);
    }
  };

  if (loading && !sim) {
    return <div className="page justify-center items-center"><Spinner /></div>;
  }

  if (!sim) {
    return <div className="page items-center"><Toast type="error" msg="Simulation not found" /></div>;
  }

  const statusLabel = runnerStatus !== "idle" ? runnerStatus : sim.status;
  const progress = Math.round(Number(runStatus?.progress_percent ?? 0));
  const enabledPlatforms = [sim.enable_twitter ? "twitter" : null, sim.enable_reddit ? "reddit" : null].filter(Boolean);

  return (
    <div className="page">
      <div className="page-header border-b pb-6 flex flex-row justify-between items-start">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="page-title">Simulation <span className="mono text-zinc-500 text-2xl">{id.slice(0, 8)}</span></h1>
            <StatusBadge status={statusLabel} />
          </div>
          <div className="page-sub mt-1">Project ID: <span className="mono">{sim.project_id}</span></div>
        </div>
        <div className="flex gap-2">
          {sim.status === "created" && (
            <button className="btn btn-primary" onClick={handlePrepare} disabled={isPreparing}>
              {isPreparing ? <><Spinner /> Preparing...</> : "Prepare Agents & Config"}
            </button>
          )}
          
          {(sim.status === "ready" || sim.status === "completed" || sim.status === "stopped" || sim.status === "paused" || sim.status === "failed") && !isRunning && (
            <button className="btn btn-primary" onClick={handleStart} disabled={starting}>
              {starting ? <><Spinner /> Starting...</> : "▶ Start Simulation"}
            </button>
          )}
          
          {isRunning && (
            <button className="btn btn-danger" onClick={handleStop} disabled={stopping}>
              {stopping ? <><Spinner /> Stopping...</> : "■ Stop"}
            </button>
          )}
          
          {sim.status === "completed" && (
            <button className="btn btn-secondary" onClick={handleGenerateReport} disabled={reporting}>
              {reporting ? <><Spinner /> Generating...</> : "📊 Generate Report"}
            </button>
          )}
        </div>
      </div>

      <div className="stat-grid">
        <StatCard value={sim.profiles_count || profiles.length || "—"} label="Agents" />
        <StatCard value={runStatus?.total_rounds || "—"} label="Total Rounds" />
        <StatCard value={enabledPlatforms.length} label="Platforms" />
        <StatCard value={runStatus?.current_round || 0} label="Current Round" color="var(--blue)" />
      </div>

      {isRunning && (
        <div className="card">
          <div className="card-header"><div className="card-title">Run Status</div></div>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Round {runStatus?.current_round || 0} of {runStatus?.total_rounds || "?"}</span>
              <span className="text-zinc-500">{progress}%</span>
            </div>
            <ProgressBar value={progress} color="blue" pulse />
          </div>
        </div>
      )}

      <div className="card mt-2">
        <div className="card-header"><div className="card-title">Agent Profiles</div></div>
        {profiles.length === 0 ? (
          <div className="text-muted text-sm">No profiles generated yet. Prepare the simulation first.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Bio / Persona</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((p, idx) => (
                  <tr key={idx}>
                    <td><span className="chip">{p.user_id}</span></td>
                    <td className="font-medium">{p.name}</td>
                    <td>@{p.username}</td>
                    <td className="text-xs text-muted">
                      <div className="font-medium mb-1">{p.bio}</div>
                      <div className="italic">{p.persona}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
