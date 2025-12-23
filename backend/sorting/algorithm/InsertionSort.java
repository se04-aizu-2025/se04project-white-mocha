package algorithm;

import visualize.SortObserver;

public class InsertionSort implements SortAlgorithm {

    @Override
    public String getName() {
        return "Insertion Sort";
    }

    @Override
    public void sort(int[] array, SortObserver observer) {
        int n = array.length;

        for (int i = 1; i < n; i++) {
            int key = array[i];
            int j = i - 1;

            while (j >= 0 && array[j] > key) {
                array[j + 1] = array[j];
                j--
                
                observer.update(array);
            }

            array[j + 1] = key;
            observer.update(array);
        }
    }
}
