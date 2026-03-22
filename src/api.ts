/* eslint-disable @typescript-eslint/no-explicit-any */
const BASE = "/api";

async function req<T>(
  method: string,
  path: string,
  body?: unknown,
  form?: FormData,
): Promise<T> {
  const opts: RequestInit = { method };
  if (form) {
    opts.body = form;
  } else if (body) {
    opts.headers = { "Content-Type": "application/json" };
    opts.body = JSON.stringify(body);
  }
  const r = await fetch(BASE + path, opts);
  if (!r.ok && !r.headers.get("content-type")?.includes("application/json")) {
    throw new Error(`API error: ${r.status} ${r.statusText}`);
  }
  const json = await r.json();
  if (!json.success) throw new Error(json.error ?? "API error");
  return json;
}

const get = <T>(p: string) => req<T>("GET", p);
const post = <T>(p: string, b?: unknown) => req<T>("POST", p, b);
const del_ = <T>(p: string) => req<T>("DELETE", p);
const postForm = <T>(p: string, f: FormData) => req<T>("POST", p, undefined, f);

// ─── Projects / Graph ─────────────────────────────────────────────────────────
export const api = {
  graph: {
    listProjects: () => get<any>("/graph/project/list"),
    getProject: (id: string) => get<any>(`/graph/project/${id}`),
    deleteProject: (id: string) => del_<any>(`/graph/project/${id}`),
    resetProject: (id: string) => post<any>(`/graph/project/${id}/reset`),
    generateOntology: (form: FormData) =>
      postForm<any>("/graph/ontology/generate", form),
    buildGraph: (projectId: string) =>
      post<any>("/graph/build", { project_id: projectId }),
    getTask: (id: string) => get<any>(`/graph/task/${id}`),
    listTasks: () => get<any>("/graph/tasks"),
  },
  simulation: {
    create: (
      projectId: string,
      graphId?: string,
      enableTwitter = true,
      enableReddit = true,
    ) =>
      post<any>("/simulation/create", {
        project_id: projectId,
        graph_id: graphId,
        enable_twitter: enableTwitter,
        enable_reddit: enableReddit,
      }),
    list: (projectId?: string) =>
      get<any>(
        `/simulation/list${projectId ? `?project_id=${projectId}` : ""}`,
      ),
    history: (limit = 20) => get<any>(`/simulation/history?limit=${limit}`),
    get: (id: string) => get<any>(`/simulation/${id}`),
    prepare: (simId: string, force = false) =>
      post<any>("/simulation/prepare", {
        simulation_id: simId,
        force_regenerate: force,
      }),
    prepareStatus: (taskId?: string, simId?: string) =>
      post<any>("/simulation/prepare/status", {
        task_id: taskId,
        simulation_id: simId,
      }),
    start: (simId: string, platform = "parallel", maxRounds?: number) =>
      post<any>("/simulation/start", {
        simulation_id: simId,
        platform,
        max_rounds: maxRounds,
      }),
    stop: (simId: string) =>
      post<any>("/simulation/stop", { simulation_id: simId }),
    runStatus: (id: string) => get<any>(`/simulation/${id}/run-status`),
    profiles: (id: string, platform = "reddit") =>
      get<any>(`/simulation/${id}/profiles?platform=${platform}`),
    config: (id: string) => get<any>(`/simulation/${id}/config`),
    agentStats: (id: string) => get<any>(`/simulation/${id}/agent-stats`),
    envStatus: (simId: string) =>
      post<any>("/simulation/env-status", { simulation_id: simId }),
  },
  report: {
    generate: (simId: string, force = false) =>
      post<any>("/report/generate", {
        simulation_id: simId,
        force_regenerate: force,
      }),
    generateStatus: (taskId?: string, simId?: string) =>
      post<any>("/report/generate/status", {
        task_id: taskId,
        simulation_id: simId,
      }),
    get: (id: string) => get<any>(`/report/${id}`),
    list: (simId?: string) =>
      get<any>(`/report/list${simId ? `?simulation_id=${simId}` : ""}`),
    check: (simId: string) => get<any>(`/report/check/${simId}`),
    bySimulation: (simId: string) => get<any>(`/report/by-simulation/${simId}`),
    delete: (id: string) => del_<any>(`/report/${id}`),
    chat: (simId: string, message: string, history: any[] = []) =>
      post<any>("/report/chat", {
        simulation_id: simId,
        message,
        chat_history: history,
      }),
  },
};
