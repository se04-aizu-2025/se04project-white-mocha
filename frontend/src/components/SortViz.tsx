import { useEffect, useMemo, useState } from "react";
import { fetchAlgorithms, runSort } from "../api/client";
import type { AlgoInfo, RunResponse, Step } from "../api/client";

/* =====================
 * Utility
 * ===================== */
function applyStep(arr: number[], step: Step): number[] {
  const a = [...arr];
  if (step.type === "SWAP") {
    const t = a[step.i];
    a[step.i] = a[step.j];
    a[step.j] = t;
  } else if (step.type === "SET") {
    a[step.index] = step.value;
  }
  return a;
}

/* =====================
 * Component
 * ===================== */
export default function SortViz() {
  /* ---------- CSV parser ---------- */
  function parseNumbersFromCsvText(text: string): number[] {
    const tokens = text
      .replace(/\r/g, "")
      .split(/[,;\n\t ]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const nums = tokens.map(Number);
    if (nums.some((n) => !Number.isFinite(n))) {
      throw new Error("CSV contains non-numeric values");
    }
    return nums.map((n) => Math.trunc(n));
  }

  async function onPickCsvFile(file: File) {
    setError(null);
    try {
      const text = await file.text();
      const nums = parseNumbersFromCsvText(text);

      setInput(nums.join(","));
      setArray(nums);
      setRun(null);
      setCursor(0);
      setHighlight(null);
    } catch (e) {
      setError(String(e));
    }
  }

  /* ---------- State ---------- */
  const [algos, setAlgos] = useState<AlgoInfo[]>([]);
  const [algoKey, setAlgoKey] = useState("bubble");

  const [input, setInput] = useState("5,1,4,2,8");
  const parsed = useMemo(() => {
    const parts = input.split(",").map((s) => Number(s.trim()));
    if (parts.some((n) => !Number.isFinite(n))) return null;
    return parts.map((n) => Math.trunc(n));
  }, [input]);

  const [run, setRun] = useState<RunResponse | null>(null);
  const [cursor, setCursor] = useState(0);
  const [array, setArray] = useState<number[]>([5, 1, 4, 2, 8]);
  const [highlight, setHighlight] = useState<{
    i: number;
    j: number;
    type: "COMPARE" | "SWAP";
  } | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);

  /* ---------- Random generator UI ---------- */
  // ★ number ではなく string で持つ
  const [genCount, setGenCount] = useState("5");
  const [genMax, setGenMax] = useState("10");

  async function onGenerate() {
    setError(null);

    const count = Number(genCount);
    const max = Number(genMax);

    if (!Number.isInteger(count) || !Number.isInteger(max)) {
      setError("Invalid number");
      return;
    }
    if (count <= 0 || max <= 0) {
      setError("Numbers must be positive");
      return;
    }
    if (count > max) {
      setError("Array Size must be ≤ Max Number");
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:7070/generate?count=${count}&max=${max}`
      );
      if (!res.ok) throw new Error(await res.text());

      const nums: number[] = await res.json();
      setInput(nums.join(","));
      setArray(nums);
      setRun(null);
      setCursor(0);
      setHighlight(null);
    } catch (e) {
      setError(String(e));
    }
  }

  /* ---------- API status ---------- */
  async function checkApiStatus() {
    try {
      await fetchAlgorithms();
      setApiOnline(true);
    } catch {
      setApiOnline(false);
    }
  }

  useEffect(() => {
    const load = async () => {
      try {
        const list = await fetchAlgorithms();
        setAlgos(list);
        if (list.length > 0) setAlgoKey(list[0].key);
        setApiOnline(true);
      } catch (e) {
        setError(String(e));
        setApiOnline(false);
      }
    };
    load();

    const timer = setInterval(checkApiStatus, 3000);
    return () => clearInterval(timer);
  }, []);

  /* ---------- Run / Step ---------- */
  async function onRun() {
    setError(null);
    if (!parsed) {
      setError("Invalid CSV");
      return;
    }
    try {
      const res = await runSort(algoKey, parsed);
      setRun(res);
      setCursor(0);
      setArray(res.initial);
      setHighlight(null);
    } catch (e) {
      setError(String(e));
    }
  }

  function stepOnce() {
    if (!run || cursor >= run.steps.length) return;

    const step = run.steps[cursor];
    if (step.type === "COMPARE" || step.type === "SWAP") {
      setHighlight({ i: step.i, j: step.j, type: step.type });
    } else {
      setHighlight(null);
    }

    if (step.type !== "DONE") {
      setArray((prev) => applyStep(prev, step));
      setCursor((c) => c + 1);
    }
  }

  /* ---------- Drawing ---------- */
  const width = 720;
  const height = 240;
  const padding = 10;
  const maxVal = Math.max(1, ...array);
  const barW = array.length ? (width - padding * 2) / array.length : 0;

  const highlightColor =
    highlight?.type === "SWAP"
      ? "#ffb020"
      : highlight?.type === "COMPARE"
      ? "#4aa3ff"
      : "#666";

  /* =====================
   * Render
   * ===================== */
  return (
    <div style={{ fontFamily: "system-ui", padding: 16, maxWidth: 960, margin: "0 auto", color: "white" }}>
      <h2>Sorting Visualizer</h2>

      {/* API status */}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <span
          style={{
            width: 12,
            height: 12,
            borderRadius: "50%",
            background: apiOnline === null ? "#aaa" : apiOnline ? "#2ecc71" : "#e74c3c",
          }}
        />
        <span>API: {apiOnline ? "online" : "offline"}</span>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 8 }}>
        <label>
          Algorithm:
          <select value={algoKey} onChange={(e) => setAlgoKey(e.target.value)}>
            {algos.map((a) => (
              <option key={a.key} value={a.key}>
                {a.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Array (CSV):
          <input value={input} onChange={(e) => setInput(e.target.value)} style={{ width: 240 }} />
        </label>

        <label>
          CSV File:
          <input type="file" accept=".csv" onChange={(e) => e.target.files && onPickCsvFile(e.target.files[0])} />
        </label>

        {/* Random Array Generator description */}
        <div style={{ fontSize: 12, color: "#aaa", lineHeight: 1.4 }}>
          <b>Random Array Generator</b>
          <div>- Array Size: number of elements (N)</div>
          <div>- Max Number: maximum value (1 to max, unique)</div>
        </div>

        {/* Random generator inputs */}
        <label>
          N:
          <input
            type="text"
            inputMode="numeric"
            value={genCount}
            onChange={(e) =>
              setGenCount(
                e.target.value.replace(/\D/g, "").replace(/^0+/, "")
              )
            }
          />
        </label>

        <label>
          max:
          <input
            type="text"
            inputMode="numeric"
            value={genMax}
            onChange={(e) =>
              setGenMax(
                e.target.value.replace(/\D/g, "").replace(/^0+/, "")
              )
            }
          />
        </label>

        <button onClick={onGenerate}>Generate</button>
        <button onClick={onRun} disabled={!parsed}>Run</button>
        <button onClick={stepOnce} disabled={!run}>Step</button>
      </div>

      {/* Info */}
      {run && (
        <div style={{ marginTop: 10 }}>
          <b>Expected Sorted:</b> [{run.sorted.join(", ")}]
          <div style={{ marginTop: 4 }}>
            <b>Highlight:</b>{" "}
            {highlight ? (
              <span style={{ background: highlightColor, padding: "2px 8px", borderRadius: 999 }}>
                {highlight.type} ({highlight.i}, {highlight.j})
              </span>
            ) : "-"}
          </div>
        </div>
      )}

      {error && <div style={{ color: "#ff9999", marginTop: 8 }}>{error}</div>}

      {/* Visualization */}
      <svg width={width} height={height} style={{ marginTop: 12 }}>
        {array.map((v, i) => {
          const h = (v / maxVal) * (height - padding * 2);
          const x = padding + i * barW;
          const y = height - padding - h;
          const isHi = highlight && (i === highlight.i || i === highlight.j);

          return (
            <g key={i}>
              <rect
                x={x + 2}
                y={y}
                width={barW - 4}
                height={h}
                rx={4}
                fill={isHi ? highlightColor : "#888"}
              />
              <text x={x + barW / 2} y={Math.max(12, y - 4)} textAnchor="middle" fontSize={12} fill="#ddd">
                {v}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
