import algorithm.SortAlgorithm;
import java.util.Arrays;
import visualize.AlgorithmRegistry;
import visualize.EventCollector;
import visualize.SortEvent;

public class StepDebugMain {
    public static void main(String[] args) {
        // テスト用配列（固定）
        int[] data = {5, 1, 4, 2, 8};

        AlgorithmRegistry reg = new AlgorithmRegistry();

        // "bubble" または "selection" を試す
        SortAlgorithm algo = reg.get("selection");
        if (algo == null) {
            System.out.println("Algorithm not found. (check AlgorithmRegistry keys)");
            return;
        }

        int[] work = Arrays.copyOf(data, data.length);

        // stepsを集める
        EventCollector collector = new EventCollector();
        algo.sort(work, collector);
        collector.done();

        // 結果表示
        System.out.println("Algorithm: " + algo.getName());
        System.out.println("Initial  : " + Arrays.toString(data));
        System.out.println("Sorted   : " + Arrays.toString(work));
        System.out.println("Steps    : " + collector.getEvents().size());

        // stepsを先頭だけ表示（多すぎると見づらいので）
        int limit = Math.min(40, collector.getEvents().size());
        for (int k = 0; k < limit; k++) {
            SortEvent e = collector.getEvents().get(k);
            switch (e.type) {
                case COMPARE -> System.out.printf("%3d: COMPARE i=%d j=%d%n", k, e.i, e.j);
                case SWAP    -> System.out.printf("%3d: SWAP    i=%d j=%d%n", k, e.i, e.j);
                case SET     -> System.out.printf("%3d: SET     index=%d value=%d%n", k, e.index, e.value);
                case DONE    -> System.out.printf("%3d: DONE%n", k);
            }
        }

        if (collector.getEvents().size() > limit) {
            System.out.println("... (" + (collector.getEvents().size() - limit) + " more events)");
        }
    }
}
