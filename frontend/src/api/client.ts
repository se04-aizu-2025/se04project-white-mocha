const API_BASE = "http://localhost:7070";

export type AlgoInfo = { key: string; name: string };

export type Step =
  | { type: "COMPARE"; i: number; j: number }
  | { type: "SWAP"; i: number; j: number }
  | { type: "SET"; index: number; value: number }
  | { type: "DONE" };

export type RunResponse = {
  algorithmKey: string;
  algorithmName: string;
  initial: number[];
  sorted: number[];
  steps: Step[];
};

export async function fetchAlgorithms(): Promise<AlgoInfo[]> {
  const res = await fetch(`${API_BASE}/algorithms`);
  if (!res.ok) throw new Error("Failed to fetch algorithms");
  const json = await res.json();
  return json.algorithms as AlgoInfo[];
}

export async function runSort(algorithmKey: string, array: number[]): Promise<RunResponse> {
  const res = await fetch(`${API_BASE}/run?algorithm=${encodeURIComponent(algorithmKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(array),
  });
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()) as RunResponse;
}
