import { useEffect, useMemo, useState } from "react";
import { fetchAlgorithms, runSort } from "../api/client";
import type { AlgoInfo, RunResponse, Step } from "../api/client";

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

export default function SortViz() {
  function parseNumbersFromCsvText(text: string): number[] {
    // カンマ・改行・空白・タブ・セミコロンを区切りとして扱う
    const tokens = text
      .replace(/\r/g, "")
      .split(/[,;\n\t ]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const nums = tokens.map((t) => Number(t));
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

      // input欄も更新して見える化（デバッグしやすい）
      setInput(nums.join(","));

      // もし run/steps が残ってるならリセットしておくと事故りにくい
      setRun(null);
      setCursor(0);
      setArray(nums);
      setHighlight(null);
    } catch (e) {
      setError(String(e));
    }
  }

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
  // null: checking, true: online, false: offline

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

    const timer = setInterval(() => {
      checkApiStatus();
    }, 3000); // 3秒ごと

    return () => clearInterval(timer);
  }, []);

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
    if (!run) return;
    if (cursor >= run.steps.length) return;

    const step = run.steps[cursor];

    if (step.type === "COMPARE" || step.type === "SWAP") {
      setHighlight({ i: step.i, j: step.j, type: step.type });
    } else {
      setHighlight(null);
    }

    if (step.type === "DONE") return;

    setArray((prev) => applyStep(prev, step));
    setCursor((c) => c + 1);
  }

  // drawing
  const width = 720;
  const height = 240;
  const padding = 10;

  const maxVal = Math.max(1, ...array);
  const barW = array.length > 0 ? (width - padding * 2) / array.length : 0;

  // Highlight表示用の色（棒グラフの色と一致させる）
  const highlightColor =
    highlight?.type === "SWAP"
      ? "#ffb020"
      : highlight?.type === "COMPARE"
      ? "#4aa3ff"
      : "#666";

  return (
    <div
      style={{
        fontFamily: "system-ui",
        padding: 16,
        maxWidth: 960,
        margin: "0 auto",
        color: "white",
      }}
    >
      <h2>Sorting Visualizer (API connected)</h2>

      <div
        style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}
      >
        <span
          style={{
            width: 12,
            height: 12,
            borderRadius: "50%",
            backgroundColor:
              apiOnline === null ? "#aaa" : apiOnline ? "#2ecc71" : "#e74c3c",
            display: "inline-block",
          }}
        />
        <span style={{ fontSize: 14 }}>
          API:{" "}
          {apiOnline === null ? "checking..." : apiOnline ? "online" : "offline"}
        </span>
      </div>

      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <label>
          Algorithm:
          <select
            value={algoKey}
            onChange={(e) => setAlgoKey(e.target.value)}
            style={{ marginLeft: 8 }}
          >
            {algos.length === 0 ? (
              <>
                <option value="bubble">bubble</option>
                <option value="selection">selection</option>
              </>
            ) : (
              algos.map((a) => (
                <option key={a.key} value={a.key}>
                  {a.name} ({a.key})
                </option>
              ))
            )}
          </select>
        </label>

        <label>
          Array (CSV):
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            style={{ marginLeft: 8, width: 240 }}
          />
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          CSV File:
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onPickCsvFile(f);
              // 同じファイルを連続で選べるようにリセット
              e.currentTarget.value = "";
            }}
          />
        </label>

        <button onClick={onRun} disabled={!parsed}>
          Run (fetch steps)
        </button>

        <button onClick={stepOnce} disabled={!run}>
          Step
        </button>

        <span>
          Cursor: {cursor}
          {run ? ` / ${run.steps.length}` : ""}
        </span>
      </div>

      {error && (
        <div
          style={{
            marginTop: 10,
            padding: 10,
            border: "1px solid #a33",
            borderRadius: 8,
            color: "#ffb3b3",
          }}
        >
          {error}
        </div>
      )}

      {run && (
        <div style={{ marginTop: 10 }}>
          <div>
            <b>Expected Sorted:</b> [{run.sorted.join(", ")}]
          </div>

          {/* Highlight表示を “棒と同じ色のバッジ” にする */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <b>Highlight:</b>
            {highlight ? (
              <span
                style={{
                  background: highlightColor,
                  color: "#111",
                  padding: "2px 10px",
                  borderRadius: 999,
                  fontWeight: 700,
                  fontSize: 12,
                }}
              >
                {highlight.type} ({highlight.i}, {highlight.j})
              </span>
            ) : (
              <span style={{ color: "#aaa" }}>-</span>
            )}
          </div>
        </div>
      )}

      <div
        style={{
          marginTop: 14,
          border: "1px solid #444",
          borderRadius: 8,
          padding: 8,
        }}
      >
        <svg width={width} height={height} style={{ display: "block" }}>
          {array.map((v, idx) => {
            const h = (v / maxVal) * (height - padding * 2);
            const x = padding + idx * barW;
            const y = height - padding - h;

            const isHi = highlight && (idx === highlight.i || idx === highlight.j);
            const fill = isHi
              ? highlight!.type === "SWAP"
                ? "#ffb020"
                : "#4aa3ff"
              : "#888";

            return (
              <g key={idx}>
                <rect
                  x={x + 2}
                  y={y}
                  width={Math.max(0, barW - 4)}
                  height={h}
                  rx={4}
                  fill={fill}
                />
                <text
                  x={x + barW / 2}
                  y={Math.max(12, y - 4)} // 棒の上に出す（上すぎるときは12で下げる）
                  fontSize={12}
                  textAnchor="middle"
                  fill="#ddd"
                >
                  {v}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
