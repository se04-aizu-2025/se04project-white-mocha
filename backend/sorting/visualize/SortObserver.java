package visualize;




public interface SortObserver{
    default void compare(int i, int j){}
    default void swap(int i,int j){}
    default void set(int index, int value){}
    
} 