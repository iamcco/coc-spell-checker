export interface AutoLoadCache<K, T> {
    (key: K): T;
    get: (key: K) => T;
    clear: () => void;
    has: (key: K) => boolean;
    delete: (key: K) => void;
}
export declare function createAutoLoadCache<K, T>(loader: (key: K) => T): AutoLoadCache<K, T>;
export interface LazyValue<T> {
    (): T;
    get: () => T;
    clear: () => void;
}
export declare function createLazyValue<T>(loader: () => T): LazyValue<T>;
