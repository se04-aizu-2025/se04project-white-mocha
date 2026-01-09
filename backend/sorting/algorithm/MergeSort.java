package algorithm;

import visualize.SortObserver;

public class MergeSort implements SortAlgorithm {

    @Override
    public String getName() {
        return "Merge Sort";
    }

    @Override
    public void sort(int[] array, SortObserver o) {
        if (array == null || array.length <= 1) return;
        mergeSort(array, 0, array.length - 1, o);
    }

    private void mergeSort(int[] array, int left, int right, SortObserver o) {
        if (left >= right) return;

        int mid = left + (right - left) / 2;

        mergeSort(array, left, mid, o);
        mergeSort(array, mid + 1, right, o);
        merge(array, left, mid, right, o);
    }

    private void merge(int[] array, int left, int mid, int right, SortObserver o) {
        int n1 = mid - left + 1;
        int n2 = right - mid;

        int[] L = new int[n1];
        int[] R = new int[n2];

        for (int i = 0; i < n1; i++) L[i] = array[left + i];
        for (int j = 0; j < n2; j++) R[j] = array[mid + 1 + j];

        int i = 0, j = 0, k = left;

        while (i < n1 && j < n2) {
            o.compare(left + i, (mid + 1) + j); // 比較イベント

            if (L[i] <= R[j]) {
                array[k] = L[i];
                o.set(k, L[i]);                 // 上書きイベント
                i++;
            } else {
                array[k] = R[j];
                o.set(k, R[j]);                 // 上書きイベント
                j++;
            }
            k++;
        }

        while (i < n1) {
            array[k] = L[i];
            o.set(k, L[i]);
            i++; k++;
        }

        while (j < n2) {
            array[k] = R[j];
            o.set(k, R[j]);
            j++; k++;
        }
    }
}
