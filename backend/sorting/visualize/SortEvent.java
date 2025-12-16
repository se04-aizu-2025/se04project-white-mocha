package visualize;

public class SortEvent {

    public enum Type{COMPARE,SWAP,SET,DONE}

    public Type type;

    public Integer i;
    public Integer j;

     // For SET
    public Integer index;
    public Integer value;

    private SortEvent(Type type) {
        this.type = type;
    }

    public static SortEvent compare(int i, int j) {
        SortEvent e = new SortEvent(Type.COMPARE);
        e.i = i;
        e.j = j;
        return e;
    }

    public static SortEvent swap(int i, int j) {
        SortEvent e = new SortEvent(Type.SWAP);
        e.i = i;
        e.j = j;
        return e;
    }

    public static SortEvent set(int index, int value) {
        SortEvent e = new SortEvent(Type.SET);
        e.index = index;
        e.value = value;
        return e;
    }

    public static SortEvent done() {
        return new SortEvent(Type.DONE);
    }
}



