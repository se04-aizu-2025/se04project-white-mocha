package algorithm;

import visualize.SortObserver;

public class SelectionSort implements SortAlgorithm {

    @Override
    public void sort(int[] array, SortObserver o) {
        int n = array.length;

        for (int i = 0; i < n - 1; i++) {
            int minIndex = i;

            for (int j = i + 1; j < n; j++) {
                o.compare(j, minIndex);   // ★ 追加
                if (array[j] < array[minIndex]) {
                    minIndex = j;
                }
            }

            if (minIndex != i) {
                int temp = array[minIndex];
                array[minIndex] = array[i];
                array[i] = temp;
                o.swap(i, minIndex);      // ★ 追加
            }
        }
    }

    @Override
    public String getName() {
        return "Selection Sort";
    }
}
