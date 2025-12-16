package visualize;

import java.util.LinkedHashMap;
import java.util.Map;

import algorithm.BubbleSort;
import algorithm.SelectionSort;
import algorithm.SortAlgorithm;

/**
 * Central place to register algorithms for API/GUI.
 * key = short name used by frontend ("bubble", "selection", ...)
 */
public class AlgorithmRegistry {
    private final Map<String, SortAlgorithm> map = new LinkedHashMap<>();

    public AlgorithmRegistry() {
        registerDefaults();
    }

    private void registerDefaults() {
        register("bubble", new BubbleSort());
        register("selection", new SelectionSort());
    }

    public void register(String key, SortAlgorithm algo) {
        map.put(key, algo);
    }

    public SortAlgorithm get(String key) {
        return map.get(key);
    }

    public Map<String, SortAlgorithm> all() {
        return map;
    }
}
