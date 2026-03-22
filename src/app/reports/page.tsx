/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { api } from "@/api";
import { useRouter } from "next/navigation";
import { Spinner, Empty } from "../../components/UI";

interface ReportData {
  report_id: string;
  simulation_id: string;
  created_at: string;
}

export default function Reports() {
  const router = useRouter();
  const [reports, setReports] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.report.list()
      .then((res) => {
        setReports(res.data ?? []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this report?")) return;
    try {
      await api.report.delete(id);
      setReports(r => r.filter(x => x.report_id !== id));
    } catch (e: any) {
      alert(e.message || "Failed to delete");
    }
  };

  return (
    <div className="page">
      <div className="page-header border-b pb-6 flex flex-row justify-between items-start">
        <div>
          <h1 className="page-title">Reports</h1>
          <div className="page-sub">Analytics and summaries generated from simulations</div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : reports.length === 0 ? (
        <Empty icon="📊" title="No reports generated" sub="Run a simulation and click Generate Report when it finishes" />
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Report ID</th>
                  <th>Simulation ID</th>
                  <th>Date Generated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.report_id}>
                    <td><span className="chip">{r.report_id.slice(0, 14)}</span></td>
                    <td className="mono text-zinc-500">{r.simulation_id.slice(0, 14)}</td>
                    <td className="text-zinc-500 text-sm">
                      {r.created_at ? new Date(r.created_at).toLocaleString() : "Unknown"}
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn btn-primary btn-sm" onClick={() => router.push(`/reports/${r.report_id}`)}>View Report</button>
                        <button className="btn btn-ghost btn-sm text-red-500" onClick={() => handleDelete(r.report_id)}>Delete</button>
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