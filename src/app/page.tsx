import React from "react";

async function getBackendHealth() {
  try {
    const res = await fetch("http://localhost:4000/api/health", {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  } catch (error) {
    return { status: "error", error: String(error) };
  }
}

export default async function Home() {
  const health = await getBackendHealth();

  return (
    <div className="flex flex-col flex-1 items-center justify-center min-h-screen bg-zinc-50 font-sans dark:bg-black p-8">
      <main className="flex flex-col w-full max-w-3xl bg-white dark:bg-zinc-900 shadow-xl rounded-2xl p-12 gap-8 border border-zinc-200 dark:border-zinc-800">
        <div className="flex flex-col gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-6">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            🐟 MiroFish
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            Frontend is up and running. Checking backend connection...
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`w-4 h-4 rounded-full ${
                health.status === "ok" ? "bg-emerald-500 animate-pulse" : "bg-red-500"
              }`}
            />
            <h2 className="text-2xl font-semibold text-zinc-800 dark:text-zinc-200">
              Backend Status: {health.status === "ok" ? "Connected" : "Disconnected"}
            </h2>
          </div>

          <div className="bg-zinc-100 dark:bg-zinc-950 p-6 rounded-xl font-mono text-sm overflow-x-auto border border-zinc-200 dark:border-zinc-800">
            <pre className="text-zinc-800 dark:text-zinc-300">
              {JSON.stringify(health, null, 2)}
            </pre>
          </div>
        </div>

        {health.status === "error" && (
          <div className="p-4 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-lg text-sm">
            Make sure the Express backend is running on port 4000.
          </div>
        )}
      </main>
    </div>
  );
}
