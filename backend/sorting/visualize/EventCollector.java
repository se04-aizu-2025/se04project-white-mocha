package visualize;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Collects SortEvents into a list (replayable steps).
 */
public class EventCollector implements SortObserver {
    private final List<SortEvent> events = new ArrayList<>();

    @Override
    public void compare(int i, int j) {
        events.add(SortEvent.compare(i, j));
    }

    @Override
    public void swap(int i, int j) {
        events.add(SortEvent.swap(i, j));
    }

    @Override
    public void set(int index, int value) {
        events.add(SortEvent.set(index, value));
    }

    public void done() {
        events.add(SortEvent.done());
    }

    public List<SortEvent> getEvents() {
        return Collections.unmodifiableList(events);
    }
}
