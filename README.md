<div id="top"></div>

## 使用技術一覧

<p style="display: inline">
  <img src="https://img.shields.io/badge/-Node.js-000000.svg?logo=node.js&style=for-the-badge">
  <img src="https://img.shields.io/badge/-React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB">
  <img src="https://img.shields.io/badge/-Vite-646CFF.svg?logo=vite&style=for-the-badge&logoColor=white">

  <img src="https://img.shields.io/badge/-Java-ED8B00.svg?logo=java&style=for-the-badge&logoColor=white">

  <img src="https://img.shields.io/badge/-GitHub-181717.svg?logo=github&style=for-the-badge">
</p>

---

## 目次

1. [プロジェクトについて](#プロジェクトについて)
2. [操作方法（UI)]
3. [環境](#環境)
4. [ディレクトリ構成](#ディレクトリ構成)
5. [開発環境構築](#開発環境構築)

<p align="right">(<a href="#top">トップへ</a>)</p>

---

## プロジェクト名

**Sorting Visualizer**

---

## プロジェクトについて

本プロジェクトは、**ソートアルゴリズムの学習を目的とした可視化ツール**です。  

Java で実装されたソートアルゴリズムをバックエンド API として提供し、  
React（Vite）製のフロントエンドで **ステップ単位の挙動を視覚的に確認**できます。

### 特徴
- 複数アルゴリズムの切り替え  
  - Bubble Sort  
  - Selection Sort  
  - Insertion Sort  
  - Merge Sort
- 比較・交換・代入（SET）をイベントとして取得
- Step 実行による逐次可視化
- ランダム配列生成に対応
- アルゴリズム追加が容易な設計（Strategy + Observer）
- Step 実行による逐次可視化
- **Auto 再生（Pause / Speed 調整付き）による連続可視化**

---

## 操作方法（UI）

1. **Algorithm**  
   使用するソートアルゴリズムを選択します。

2. **Array (CSV)**  
   `5,1,4,2,8` のようにカンマ区切りで配列を入力します。

3. **Generate**  
   ランダムな配列を生成します（N = 要素数、max = 最大値）。

4. **Run**  
   バックエンドでソートを実行し、可視化用のステップ（イベント列）を取得します。

5. **Step**  
   ソート処理を 1 ステップずつ実行します。

6. **Auto / Pause**  
   ソートの流れを自動で再生／一時停止します。

7. **Speed**  
   自動再生の速度（ミリ秒単位）を調整できます。

### Auto 再生の仕様
- ステップの終端（DONE）に到達すると自動で停止します。
- 実行中に **Generate / Run / Algorithm 変更** を行うと、安全のため自動再生は停止されます。

<p align="right">(<a href="#top">トップへ</a>)</p>

---

## 環境

| 種別 | 技術 | バージョン |
| --- | --- | --- |
| 言語（Backend） | Java | 17+ |
| 言語（Frontend） | TypeScript | 5.x |
| フレームワーク | React | 18.x |
| ビルドツール | Vite | 5.x |
| 実行環境 | Node.js | 18.x 推奨 |

<p align="right">(<a href="#top">トップへ</a>)</p>

---

## ディレクトリ構成

```bash
.
├── backend
│   ├── api
│   │   └── ApiServer.java
│   ├── sorting
│   │   ├── algorithm
│   │   │   ├── BubbleSort.java
│   │   │   ├── SelectionSort.java
│   │   │   ├── InsertionSort.java
│   │   │   ├── MergeSort.java
│   │   │   └── SortAlgorithm.java
│   │   ├── util
│   │   └── visualize
│   │       ├── AlgorithmRegistry.java
│   │       ├── EventCollector.java
│   │       ├── SortEvent.java
│   │       └── SortObserver.java
│   └── StepDebugMain.java
│
├── frontend
│   ├── src
│   │   ├── api
│   │   │   └── client.ts
│   │   ├── components
│   │   │   └── SortViz.tsx
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
│
└── README.md
```

<p align="right">(<a href="#top">トップへ</a>)</p>

---

## 開発環境構築

### Backend（Java API）

**ビルド**

```bash
rm -rf out
mkdir -p out
javac -d out $(find backend -name "*.java")
```

**起動**

```bash
java -cp out api.ApiServer
```

デフォルトで以下の API が利用可能になります：
- `GET /algorithms`
- `POST /run?algorithm=xxx`
- `GET /generate?count=N&max=M`

### Frontend（React + Vite）

**依存関係インストール**

```bash
cd frontend
npm install
```

**開発サーバ起動**

```bash
npm run dev
```

**ブラウザでアクセス**

http://localhost:5173

<p align="right">(<a href="#top">トップへ</a>)</p>
