package algorithm;

import visualize.SortObserver;

public class MergeSort implements SortAlgorithm {

    @Override
    public String getName() {
        return "Merge Sort";
    }

    @Override
    public void sort(int[] array, SortObserver observer) {
        if (array == null || array.length <= 1) return;
        mergeSort(array, 0, array.length - 1, observer);
    }

    private void mergeSort(int[] array, int left, int right, SortObserver observer) {
        if (left >= right) return;

        int mid = (left + right) / 2;

        mergeSort(array, left, mid, observer);
        mergeSort(array, mid + 1, right, observer);
        merge(array, left, mid, right, observer);
    }

    private void merge(int[] array, int left, int mid, int right, SortObserver observer) {
        int n1 = mid - left + 1;
        int n2 = right - mid;

        int[] L = new int[n1];
        int[] R = new int[n2];

        for (int i = 0; i < n1; i++)
            L[i] = array[left + i];
        for (int j = 0; j < n2; j++)
            R[j] = array[mid + 1 + j];

        int i = 0, j = 0, k = left;

        while (i < n1 && j < n2) {
            if (L[i] <= R[j]) {
                array[k++] = L[i++];
            } else {
                array[k++] = R[j++];
            }
            observer.update(array);
        }

        while (i < n1) {
            array[k++] = L[i++];
            observer.update(array);
        }

        while (j < n2) {
            array[k++] = R[j++];
            observer.update(array);
        }
    }
}
