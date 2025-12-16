// util/ArrayGenerator.java
package util;

import java.util.Random;

public class ArrayGenerator {

    public static int[] randomArray(int size, int bound) {
        Random rand = new Random();
        int[] array = new int[size];

        for (int i = 0; i < size; i++) {
            array[i] = rand.nextInt(bound);
        }
        return array;
    }
}
