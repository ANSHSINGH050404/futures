/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useRef } from "react";
import { api } from "@/api";
import { useParams, useRouter } from "next/navigation";
import { Spinner, Toast } from "../../../components/UI";

interface Message {
  role: "user" | "ai";
  content: string;
}

export default function ReportDetail() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.report.get(id)
      .then(res => setReport(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !report?.simulation_id) return;
    
    const userMsg = input;
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setInput("");
    setSending(true);

    try {
      // Map history to the format backend expects (if any, but backend doesn't seem to strictly require a specific format yet, we'll send raw strings or let backend handle it)
      const res = await api.report.chat(report.simulation_id, userMsg, messages);
      setMessages(prev => [...prev, { role: "ai", content: res.data?.response || "No response" }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: "ai", content: `Error: ${err.message}` }]);
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="page justify-center items-center"><Spinner /></div>;
  if (!report) return <div className="page items-center"><Toast type="error" msg="Report not found" /></div>;

  return (
    <div className="page flex-row gap-6 max-w-7xl">
      {/* Left side: Report Markdown */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
        <div className="flex justify-between items-center border-b pb-4">
          <div>
            <h1 className="text-2xl font-bold">Simulation Report</h1>
            <div className="text-sm text-muted mono">Report ID: {report.report_id}</div>
          </div>
          <button className="btn btn-ghost" onClick={() => router.push("/reports")}>← Back to list</button>
        </div>
        
        <div className="card flex-1 overflow-y-auto bg-zinc-50 dark:bg-zinc-950 p-6 whitespace-pre-wrap font-sans text-sm leading-relaxed border border-zinc-200 dark:border-zinc-800">
          {report.markdown_content || "Report is still generating or empty..."}
        </div>
      </div>

      {/* Right side: Chat Interface */}
      <div className="w-96 flex flex-col card h-[calc(100vh-64px)] overflow-hidden">
        <div className="card-header pb-3 mb-0">
          <div className="card-title text-lg">AI Assistant</div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-zinc-50 dark:bg-black" ref={scrollRef}>
          {messages.length === 0 && (
            <div className="text-center text-muted text-sm my-auto">
              Ask questions about the simulation results!
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex flex-col max-w-[85%] ${m.role === "user" ? "self-end items-end" : "self-start items-start"}`}>
              <div className={`text-xs text-muted mb-1 px-1 ${m.role === "user" ? "text-right" : ""}`}>
                {m.role === "user" ? "You" : "AI"}
              </div>
              <div className={`px-4 py-2 rounded-2xl text-sm ${
                m.role === "user" 
                  ? "bg-indigo-600 text-white rounded-br-none" 
                  : "bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-bl-none"
              }`}>
                {m.content}
              </div>
            </div>
          ))}
          {sending && (
            <div className="self-start items-start flex flex-col max-w-[85%]">
              <div className="text-xs text-muted mb-1 px-1">AI</div>
              <div className="px-4 py-2 rounded-2xl text-sm bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-bl-none flex items-center gap-2">
                <Spinner size={14} /> <span className="text-muted text-xs">Thinking...</span>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSend} className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex gap-2">
          <input 
            type="text" 
            className="input flex-1" 
            placeholder="Ask a question..." 
            value={input} 
            onChange={e => setInput(e.target.value)} 
            disabled={sending}
          />
          <button type="submit" className="btn btn-primary px-3" disabled={sending || !input.trim()}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
}