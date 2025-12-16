package algorithm;

import visualize.SortObserver;

public interface SortAlgorithm {
    String getName();

    // 既存コード（Main / SortTester）用：そのまま使える
    default void sort(int[] array) {
        sort(array, new SortObserver() {});
    }

    // 可視化・Web用：イベントを吐く
    void sort(int[] array, SortObserver observer);
}
