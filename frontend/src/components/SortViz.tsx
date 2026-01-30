import { useEffect, useMemo, useState, useRef } from "react";
import { fetchAlgorithms, generateArray, runSort } from "../api/client";
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

type Highlight =
  | { type: "COMPARE" | "SWAP"; i: number; j: number }
  | { type: "SET"; index: number }
  | null;

/* =====================
 * Component
 * ===================== */
export default function SortViz() {
  /* ---------- State ---------- */
  const [algos, setAlgos] = useState<AlgoInfo[]>([]);
  const [algoKey, setAlgoKey] = useState("bubble");

  const [input, setInput] = useState("5,1,4,2,8");
  const parsed = useMemo(() => {
    const parts = input
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .map((s) => Number(s));
    if (parts.some((n) => !Number.isFinite(n))) return null;
    return parts.map((n) => Math.trunc(n));
  }, [input]);

  const [run, setRun] = useState<RunResponse | null>(null);
  const [cursor, setCursor] = useState(0);
  const [array, setArray] = useState<number[]>([5, 1, 4, 2, 8]);
  const [highlight, setHighlight] = useState<Highlight>(null);

  const [error, setError] = useState<string | null>(null);
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);

    /* ---------- Auto Play ---------- */
  const [isAuto, setIsAuto] = useState(false);
  const [speedMs, setSpeedMs] = useState(300); // 速度(ms)
  const timerRef = useRef<number | null>(null);


  /* ---------- Random generator UI ---------- */
  const [genCount, setGenCount] = useState("5");
  const [genMax, setGenMax] = useState("10");

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

        // いまのalgoKeyが一覧に存在しない場合だけ先頭へ
        if (list.length > 0 && !list.some((a) => a.key === algoKey)) {
          setAlgoKey(list[0].key);
        }

        setApiOnline(true);
      } catch (e) {
        setError(String(e));
        setApiOnline(false);
      }
    };

    load();
    const timer = setInterval(checkApiStatus, 3000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ★アルゴリズム切り替え時：再生状態をリセット
  useEffect(() => {
    setIsAuto(false);
    setRun(null);
    setCursor(0);
    setHighlight(null);
  }, [algoKey]);

  /* ---------- Random Generate ---------- */
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
      const nums = await generateArray(count, max);
      setInput(nums.join(","));
      setArray(nums);
      setRun(null);
      setCursor(0);
      setHighlight(null);
      setIsAuto(false);
    } catch (e) {
      setError(String(e));
    }
  }

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
      setIsAuto(false); 
    } catch (e) {
      setError(String(e));
    }
  }

  function stepOnce() {
    if (!run || cursor >= run.steps.length) return;

    const step = run.steps[cursor];

    // highlight
    if (step.type === "COMPARE" || step.type === "SWAP") {
      setHighlight({ i: step.i, j: step.j, type: step.type });
    } else if (step.type === "SET") {
      setHighlight({ type: "SET", index: step.index });
    } else {
      setHighlight(null);
    }

    // apply (DONE は配列を変えない)
    if (step.type !== "DONE") {
      setArray((prev) => applyStep(prev, step));
    }

    // ★重要：DONEでも cursor を進める（DONEで止まるのを防ぐ）
    setCursor((c) => c + 1);
  }

    /* ---------- Auto Play Effect ---------- */
  useEffect(() => {
    // Auto OFF ならタイマー停止
    if (!isAuto) {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    // 走る前に条件チェック（runがない / 終了してる）
    if (!run || cursor >= run.steps.length) {
      setIsAuto(false);
      return;
    }

    // Auto ON → stepOnce を一定間隔で呼ぶ
    timerRef.current = window.setInterval(() => {
      // DONE まで行ったら停止
      if (!run || cursor >= run.steps.length) {
        setIsAuto(false);
        return;
      }
      stepOnce();
    }, speedMs);

    // クリーンアップ
    return () => {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isAuto, speedMs, run, cursor]);


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
      : highlight?.type === "SET"
      ? "#b38bff"
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
                {a.name} ({a.key})
              </option>
            ))}
          </select>
        </label>

        <label>
          Array (CSV):
          <input value={input} onChange={(e) => setInput(e.target.value)} style={{ width: 240 }} />
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
            onChange={(e) => setGenCount(e.target.value.replace(/\D/g, "").replace(/^0+/, ""))}
          />
        </label>

        <label>
          max:
          <input
            type="text"
            inputMode="numeric"
            value={genMax}
            onChange={(e) => setGenMax(e.target.value.replace(/\D/g, "").replace(/^0+/, ""))}
          />
        </label>

        <button onClick={onGenerate}>Generate</button>

        <button onClick={onRun} disabled={!parsed}>
          Run
        </button>

        <button onClick={stepOnce} disabled={!run || cursor >= (run?.steps.length ?? 0) || isAuto}>
          Step
        </button>

        {/* Auto Play Button */}
        <button
          onClick={() => setIsAuto((v) => !v)}
          disabled={!run || cursor >= (run?.steps.length ?? 0)}
        >
          {isAuto ? "Pause" : "Auto"}
        </button>

        {/* Speed Controller */}
        <label style={{ fontSize: 12, color: "#aaa" }}>
          Speed:
          <input
            type="range"
            min={10}
            max={1000}
            step={10}
            value={1000 - speedMs + 10}  // ← 表示値を反転
            onChange={(e) => {
              const v = Number(e.target.value);
              setSpeedMs(1000 - v + 10); // ← 右に行くほど速くなる
            }}
            style={{ verticalAlign: "middle", marginLeft: 6, marginRight: 6 }}
          />
          {speedMs} ms
        </label>


      </div>

            {run && cursor >= run.steps.length && (
        <div
          style={{
            marginTop: 12,
            padding: "6px 12px",
            borderRadius: 8,
            background: "#2ecc71",
            color: "#000",
            fontWeight: "bold",
            display: "inline-block",
          }}
        >
          ✔ Finished
        </div>
      )}



      {/* Info */}
      {run && (
        <div style={{ marginTop: 10 }}>
          <b>Expected Sorted:</b> [{run.sorted.join(", ")}]
          <div style={{ marginTop: 4 }}>
            <b>Highlight:</b>{" "}
            {highlight ? (
              highlight.type === "SET" ? (
                <span style={{ background: highlightColor, padding: "2px 8px", borderRadius: 999 }}>
                  SET ({highlight.index})
                </span>
              ) : (
                <span style={{ background: highlightColor, padding: "2px 8px", borderRadius: 999 }}>
                  {highlight.type} ({highlight.i}, {highlight.j})
                </span>
              )
            ) : (
              "-"
            )}
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

          const isHi =
            (highlight?.type === "SET" && i === highlight.index) ||
            ((highlight?.type === "COMPARE" || highlight?.type === "SWAP") && (i === highlight.i || i === highlight.j));

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
