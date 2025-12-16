// util/SortTester.java
package util;

import algorithm.SortAlgorithm;
import java.util.Arrays;

public class SortTester {

    public static boolean test(SortAlgorithm algorithm, int[] array) {
        int[] copy = Arrays.copyOf(array, array.length);
        algorithm.sort(copy);
        return isSorted(copy);
    }

    private static boolean isSorted(int[] array) {
        for (int i = 0; i < array.length - 1; i++) {
            if (array[i] > array[i + 1]) return false;
        }
        return true;
    }
}
