package api;

import algorithm.SortAlgorithm;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.*;
import visualize.AlgorithmRegistry;
import visualize.EventCollector;
import visualize.SortEvent;

/**
 * Minimal HTTP API server (no external libs).
 *
 * Endpoints:
 *  - GET  /algorithms
 *      -> {"algorithms":[{"key":"bubble","name":"Bubble Sort"}, ...]}
 *
 *  - POST /run?algorithm=bubble
 *      Body: either JSON array like [5,1,4,2,8]  OR CSV like 5,1,4,2,8
 *      -> {"initial":[...],"sorted":[...],"steps":[...]}
 *
 *  - GET /generate?count=N&max=n
 *      -> [random unique integers in range 1..n]
 *
 * CORS enabled for local React dev.
 */
public class ApiServer {

    public static void main(String[] args) throws Exception {
        int port = 7070;

        AlgorithmRegistry registry = new AlgorithmRegistry();
        HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);

        /* =======================
         * Random Array Generator
         * ======================= */
        server.createContext("/generate", ex -> {
            if (handleCors(ex)) return;

            if (!"GET".equalsIgnoreCase(ex.getRequestMethod())) {
                sendJson(ex, 405, "{\"error\":\"Method Not Allowed\"}");
                return;
            }

            try {
                Map<String, String> params = parseQuery(ex.getRequestURI().getRawQuery());
                int count = Integer.parseInt(params.get("count"));
                int max = Integer.parseInt(params.get("max"));

                int[] arr = RandomArrayGenerator.generate(count, max);
                sendJson(ex, 200, intArrayJson(arr));

            } catch (Exception e) {
                sendJson(ex, 400, "{\"error\":\"" + escape(e.getMessage()) + "\"}");
            }
        });

        /* =======================
         * Algorithm List
         * ======================= */
        server.createContext("/algorithms", ex -> {
            if (handleCors(ex)) return;

            if (!"GET".equalsIgnoreCase(ex.getRequestMethod())) {
                sendJson(ex, 405, "{\"error\":\"Method Not Allowed\"}");
                return;
            }

            StringBuilder sb = new StringBuilder();
            sb.append("{\"algorithms\":[");
            boolean first = true;
            for (Map.Entry<String, SortAlgorithm> ent : registry.all().entrySet()) {
                if (!first) sb.append(",");
                first = false;
                sb.append("{\"key\":\"")
                  .append(escape(ent.getKey()))
                  .append("\",\"name\":\"")
                  .append(escape(ent.getValue().getName()))
                  .append("\"}");
            }
            sb.append("]}");

            sendJson(ex, 200, sb.toString());
        });

        /* =======================
         * Run Sorting Algorithm
         * ======================= */
        server.createContext("/run", ex -> {
            if (handleCors(ex)) return;

            if (!"POST".equalsIgnoreCase(ex.getRequestMethod())) {
                sendJson(ex, 405, "{\"error\":\"Method Not Allowed\"}");
                return;
            }

            Map<String, String> query = parseQuery(ex.getRequestURI().getRawQuery());
            String key = query.getOrDefault("algorithm", "bubble");

            SortAlgorithm algo = registry.get(key);
            if (algo == null) {
                sendJson(ex, 400, "{\"error\":\"Unknown algorithm\"}");
                return;
            }

            String body = readAll(ex.getRequestBody()).trim();
            int[] initial;
            try {
                initial = parseArray(body);
            } catch (IllegalArgumentException e) {
                sendJson(ex, 400, "{\"error\":\"Invalid array\"}");
                return;
            }

            int[] work = Arrays.copyOf(initial, initial.length);
            EventCollector collector = new EventCollector();
            algo.sort(work, collector);
            collector.done();

            String json = buildRunResponse(initial, work, collector.getEvents(), algo.getName(), key);
            sendJson(ex, 200, json);
        });

        server.setExecutor(null);
        server.start();

        System.out.println("API server running on http://localhost:" + port);
        System.out.println("GET  /algorithms");
        System.out.println("POST /run?algorithm=bubble");
        System.out.println("GET  /generate?count=N&max=n");
    }

    /* =======================
     * Random Array Generator
     * ======================= */
    static class RandomArrayGenerator {
        static int[] generate(int count, int max) {
            if (count <= 0 || max <= 0)
                throw new IllegalArgumentException("count and max must be > 0");
            if (count > max)
                throw new IllegalArgumentException("count must be <= max (unique constraint)");

            List<Integer> list = new ArrayList<>();
            for (int i = 1; i <= max; i++) list.add(i);
            Collections.shuffle(list);

            int[] res = new int[count];
            for (int i = 0; i < count; i++) res[i] = list.get(i);
            return res;
        }
    }

    /* =======================
     * CORS & Helpers
     * ======================= */
    private static boolean handleCors(HttpExchange ex) throws IOException {
        ex.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
        ex.getResponseHeaders().add("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
        ex.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type");

        if ("OPTIONS".equalsIgnoreCase(ex.getRequestMethod())) {
            ex.sendResponseHeaders(204, -1);
            ex.close();
            return true;
        }
        return false;
    }

    private static void sendJson(HttpExchange ex, int status, String json) throws IOException {
        byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
        ex.getResponseHeaders().set("Content-Type", "application/json; charset=utf-8");
        ex.sendResponseHeaders(status, bytes.length);
        try (OutputStream os = ex.getResponseBody()) {
            os.write(bytes);
        }
    }

    private static String readAll(InputStream is) throws IOException {
        return new String(is.readAllBytes(), StandardCharsets.UTF_8);
    }

    private static Map<String, String> parseQuery(String rawQuery) {
        Map<String, String> map = new HashMap<>();
        if (rawQuery == null || rawQuery.isEmpty()) return map;

        for (String pair : rawQuery.split("&")) {
            int eq = pair.indexOf('=');
            if (eq < 0) continue;
            map.put(
                URLDecoder.decode(pair.substring(0, eq), StandardCharsets.UTF_8),
                URLDecoder.decode(pair.substring(eq + 1), StandardCharsets.UTF_8)
            );
        }
        return map;
    }

    private static int[] parseArray(String body) {
        String s = body.trim();
        if (s.startsWith("[")) {
            s = s.substring(1, s.length() - 1).trim();
            if (s.isEmpty()) return new int[0];
            return Arrays.stream(s.split(","))
                    .mapToInt(v -> Integer.parseInt(v.trim()))
                    .toArray();
        } else {
            return Arrays.stream(s.split(","))
                    .mapToInt(v -> Integer.parseInt(v.trim()))
                    .toArray();
        }
    }

    private static String buildRunResponse(int[] initial, int[] sorted, List<SortEvent> steps, String algoName, String key) {
        StringBuilder sb = new StringBuilder();
        sb.append("{");
        sb.append("\"algorithmKey\":\"").append(escape(key)).append("\",");
        sb.append("\"algorithmName\":\"").append(escape(algoName)).append("\",");
        sb.append("\"initial\":").append(intArrayJson(initial)).append(",");
        sb.append("\"sorted\":").append(intArrayJson(sorted)).append(",");
        sb.append("\"steps\":[");
        for (int i = 0; i < steps.size(); i++) {
            if (i > 0) sb.append(",");
            SortEvent e = steps.get(i);
            sb.append("{\"type\":\"").append(e.type).append("\"");
            if (e.i != null) sb.append(",\"i\":").append(e.i);
            if (e.j != null) sb.append(",\"j\":").append(e.j);
            if (e.index != null) sb.append(",\"index\":").append(e.index);
            if (e.value != null) sb.append(",\"value\":").append(e.value);
            sb.append("}");
        }
        sb.append("]}");
        return sb.toString();
    }

    private static String intArrayJson(int[] a) {
        return Arrays.toString(a);
    }

    private static String escape(String s) {
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
