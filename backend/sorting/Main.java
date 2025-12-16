// Main.java
import algorithm.*;
import util.*;

public class Main {

    public static void main(String[] args) {

        SortAlgorithm[] algorithms = {
            new BubbleSort(),
            new SelectionSort()
        };

        // 👇 ここに貼る
        for (SortAlgorithm algo : algorithms) {
            boolean allPassed = true;

            for (int i = 0; i < 100; i++) {
                int[] data = ArrayGenerator.randomArray(20, 1000);
                if (!SortTester.test(algo, data)) {
                    allPassed = false;
                    break;
                }
            }

            System.out.println(algo.getName() + " test result: " + allPassed);
        }
    }
}
