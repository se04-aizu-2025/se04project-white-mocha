const API_BASE = "http://localhost:7070";

export type AlgoInfo = { key: string; name: string };

export type Step =
  | { type: "COMPARE"; i: number; j: number }
  | { type: "SWAP"; i: number; j: number }
  | { type: "SET"; index: number; value: number }
  | { type: "DONE" };

export type RunResponse = {
  algorithmKey?: string;
  algorithmName?: string;
  initial: number[];
  sorted: number[];
  steps: Step[];
};

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return (await res.json()) as T;
}

export async function fetchAlgorithms(): Promise<AlgoInfo[]> {
  const json = await fetchJson<any>(`${API_BASE}/algorithms`);

  // Accept either:
  // 1) { algorithms: [...] }
  // 2) [...] (array)
  const list = Array.isArray(json) ? json : json?.algorithms;

  if (!Array.isArray(list)) {
    throw new Error("Invalid /algorithms response format");
  }

  // Normalize
  return list.map((a: any) => ({ key: String(a.key), name: String(a.name) })) as AlgoInfo[];
}

export async function generateArray(count: number, max: number): Promise<number[]> {
  const json = await fetchJson<any>(`${API_BASE}/generate?count=${count}&max=${max}`);

  // Accept either:
  // 1) number[]
  // 2) { array: number[] }
  const arr = Array.isArray(json) ? json : json?.array;
  if (!Array.isArray(arr)) throw new Error("Invalid /generate response format");
  return arr.map((n: any) => Number(n));
}

export async function runSort(algorithmKey: string, array: number[]): Promise<RunResponse> {
  return fetchJson<RunResponse>(`${API_BASE}/run?algorithm=${encodeURIComponent(algorithmKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(array),
  });
}
