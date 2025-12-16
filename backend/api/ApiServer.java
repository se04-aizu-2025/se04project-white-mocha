package api;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

import algorithm.SortAlgorithm;
import visualize.AlgorithmRegistry;
import visualize.EventCollector;
import visualize.SortEvent;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.*;

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
 * CORS enabled for local React dev.
 */
public class ApiServer {

    public static void main(String[] args) throws Exception {
        int port = 7070;

        AlgorithmRegistry registry = new AlgorithmRegistry();

        HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);

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
                sendJson(ex, 400, "{\"error\":\"Invalid array. Use JSON [1,2,3] or CSV 1,2,3\"}");
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
        System.out.println("POST /run?algorithm=bubble   body: [5,1,4] or 5,1,4");
    }

    // ---- CORS / Helpers ----

    private static boolean handleCors(HttpExchange ex) throws IOException {
        // Allow React dev server (or any origin for now)
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
        byte[] buf = is.readAllBytes();
        return new String(buf, StandardCharsets.UTF_8);
    }

    private static Map<String, String> parseQuery(String rawQuery) {
        Map<String, String> map = new HashMap<>();
        if (rawQuery == null || rawQuery.isEmpty()) return map;

        for (String pair : rawQuery.split("&")) {
            int eq = pair.indexOf('=');
            if (eq < 0) continue;
            String k = urlDecode(pair.substring(0, eq));
            String v = urlDecode(pair.substring(eq + 1));
            map.put(k, v);
        }
        return map;
    }

    private static String urlDecode(String s) {
        return URLDecoder.decode(s, StandardCharsets.UTF_8);
    }

    /**
     * Accept either:
     *  - JSON array: [5,1,4,2]
     *  - CSV: 5,1,4,2
     */
    private static int[] parseArray(String body) {
        if (body == null || body.isEmpty()) throw new IllegalArgumentException();

        String s = body.trim();
        if (s.startsWith("[")) {
            // very small JSON array parser (integers only)
            if (!s.endsWith("]")) throw new IllegalArgumentException();
            s = s.substring(1, s.length() - 1).trim();
            if (s.isEmpty()) return new int[0];
            String[] parts = s.split(",");
            int[] a = new int[parts.length];
            for (int i = 0; i < parts.length; i++) {
                a[i] = Integer.parseInt(parts[i].trim());
            }
            return a;
        } else {
            // CSV
            String[] parts = s.split(",");
            int[] a = new int[parts.length];
            for (int i = 0; i < parts.length; i++) {
                a[i] = Integer.parseInt(parts[i].trim());
            }
            return a;
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
        for (int k = 0; k < steps.size(); k++) {
            if (k > 0) sb.append(",");
            SortEvent e = steps.get(k);
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
        StringBuilder sb = new StringBuilder();
        sb.append("[");
        for (int i = 0; i < a.length; i++) {
            if (i > 0) sb.append(",");
            sb.append(a[i]);
        }
        sb.append("]");
        return sb.toString();
    }

    private static String escape(String s) {
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
