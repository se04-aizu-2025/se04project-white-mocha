package algorithm;

import visualize.SortObserver;

public class BubbleSort implements SortAlgorithm {

    @Override
    public void sort(int[] array, SortObserver o) {
        int n = array.length;

        for (int i = 0; i < n - 1; i++) {
            boolean swapped = false;

            for (int j = 0; j < n - 1 - i; j++) {
                o.compare(j, j + 1);   // ★ 追加
                if (array[j] > array[j + 1]) {
                    int temp = array[j];
                    array[j] = array[j + 1];
                    array[j + 1] = temp;
                    o.swap(j, j + 1); // ★ 追加
                    swapped = true;
                }
            }
            if (!swapped) break;
        }
    }

    @Override
    public String getName() {
        return "Bubble Sort";
    }
}

