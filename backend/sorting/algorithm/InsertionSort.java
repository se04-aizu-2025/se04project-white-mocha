package algorithm;

import visualize.SortObserver;

public class InsertionSort implements SortAlgorithm {

    @Override
    public String getName() {
        return "Insertion Sort";
    }

    @Override
    public void sort(int[] array, SortObserver o) {
        int n = array.length;

        for (int i = 1; i < n; i++) {
            int key = array[i];
            int j = i - 1;

            while (j >= 0) {
                // key(元の i) と array[j] の比較として記録
                o.compare(j, i);

                if (array[j] <= key) break;

                // 右にシフト（上書き）: SET
                array[j + 1] = array[j];
                o.set(j + 1, array[j]);

                j--;
            }

            // key を挿入: SET
            array[j + 1] = key;
            o.set(j + 1, key);
        }
    }
}
