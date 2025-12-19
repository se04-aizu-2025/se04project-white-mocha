package api;

import java.util.*;

public class RandomArrayGenerator {

    public static int[] generate(int count, int max) {
        if (count <= 0 || max <= 0) {
            throw new IllegalArgumentException("count and max must be > 0");
        }
        if (count > max) {
            throw new IllegalArgumentException("count must be <= max (unique constraint)");
        }

        List<Integer> list = new ArrayList<>();
        for (int i = 1; i <= max; i++) {
            list.add(i);
        }

        Collections.shuffle(list);

        int[] result = new int[count];
        for (int i = 0; i < count; i++) {
            result[i] = list.get(i);
        }
        return result;
    }
}
