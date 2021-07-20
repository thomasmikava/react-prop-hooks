/// <reference types="react" />
export interface SetState<T> {
    (newValue: T): void;
    (fn: (currentValue: T) => T): void;
}
export declare type PropHookReducer<T, Args extends readonly any[]> = (currentState: T, ...args: Args) => T;
declare type UnWrap<Fn> = Fn extends (currentState: infer T, ...args: infer R) => void ? (...args: R) => void : never;
interface RawSetProp<T, Reducers extends Record<string, PropHookReducer<T, any>> = {}, ForbiddenKeys extends string | number | symbol = never> {
    <K extends Exclude<KeysOfUnion<T> | keyof Reducers, ForbiddenKeys>>(key: K): K extends keyof Reducers ? UnWrap<Reducers[K]> : SetState<GetValueType<T, K>>;
}
declare type GetValueType<T, K extends string | number | symbol> = T extends readonly any[] ? K extends keyof T ? T[K] : never : (T extends {
    readonly [key in K]: any;
} ? T[K] : T extends {
    readonly [key in K]?: any;
} ? T[K] | undefined : never) | (K extends keyof NonNullable<T> ? never : undefined);
export interface SetProp<T, Reducers extends Record<string, PropHookReducer<T, any>> = {}, ForbiddenKeys extends string | number | symbol = never> extends CustomFns<T>, RawSetProp<T, Reducers, ForbiddenKeys> {
}
declare type CustomFns<T> = AnyFns<T> & ArrayFns<T>;
declare type Unsubscribe = () => void;
interface ArrayFns<T> {
    delete: {
        byIndex: (index: number) => void;
        byKey: T extends readonly any[] ? <K extends KeysOfUnion<ArrayElement<T>>>(key: K) => DeleteByKeyFn<T[number][K]> : never;
    };
    getDeleteFn: {
        byIndex: (index: number) => () => void;
    };
}
interface SubscribeToFns<T> {
    change: (fn: ChangeFn<T>) => Unsubscribe;
    propChange: T extends null | undefined ? never : T extends readonly any[] ? <K extends number>(key: K) => (fn: PropChangeFn<T, GetValueType<T, K> | undefined, K>) => Unsubscribe : <K extends KeysOfUnion<T>>(key: K) => (fn: PropChangeFn<T, GetValueType<T, K>, K>) => Unsubscribe;
    anyPropChange: T extends null | undefined ? never : T extends readonly any[] ? (fn: AnyPropChangeFn<T, GetValueType<T, number> | undefined, number>) => Unsubscribe : (fn: AnyPropChangeFn<T, GetValueType<T, KeysOfUnion<T>>, KeysOfUnion<T>>) => Unsubscribe;
}
interface AnyFns<T> {
    subscribeTo: SubscribeToFns<T> & {
        direct: SubscribeToFns<T>;
    };
    setState: SetState<T>;
}
declare type ChangeFn<T> = (prev: T, next: T) => void;
declare type PropChangeFn<Root, T, K> = (info: {
    prevValue: T;
    nextValue: T;
    key: K;
    parentPrevValue: Root;
    parentNextValue: Root;
}) => void;
declare type AnyPropChangeFn<Root, T, K> = PropChangeFn<Root, T, K>;
interface DeleteByKeyFn<Val> {
    (value: Val): void;
    (compareFn: (value: Val) => boolean): void;
}
interface UsePropFns {
    <T extends Record<any, any> | undefined | null>(setState: SetState<T>): SetProp<T>;
    <T extends Record<any, any> | undefined | null, AdditionaFns extends Record<string, PropHookReducer<T, any>>>(setState: SetState<T>, additionalFns: AdditionaFns): SetProp<T, AdditionaFns>;
    <T extends Record<any, any> | undefined | null, K extends KeysOfUnion<T>>(setState: SetState<T>, forbiddenKeys: readonly K[]): SetProp<T, Record<any, any>, K>;
    <T extends Record<any, any> | undefined | null, AdditionaFns extends Record<string, PropHookReducer<T, any>>, K extends KeysOfUnion<T> | keyof AdditionaFns>(setState: SetState<T>, additionalFns: AdditionaFns, forbiddenKeys: readonly K[]): SetProp<T, AdditionaFns, K>;
}
interface RefObj<T> {
    readonly current: T;
}
interface UsePropFnsWithValue {
    <T extends Record<any, any> | undefined | null>(defaultValue: React.SetStateAction<T>): [T, SetProp<T>, RefObj<T>];
    <T extends Record<any, any> | undefined | null, AdditionaFns extends Record<string, PropHookReducer<T, any>>>(defaultValue: React.SetStateAction<T>, additionalFns: AdditionaFns): [T, SetProp<T, AdditionaFns>, RefObj<T>];
    <T extends Record<any, any> | undefined | null, K extends KeysOfUnion<T>>(defaultValue: React.SetStateAction<T>, forbiddenKeys: readonly K[]): [T, SetProp<T, Record<any, any>, K>, RefObj<T>];
    <T extends Record<any, any> | undefined | null, AdditionaFns extends Record<string, PropHookReducer<T, any>>, K extends KeysOfUnion<T> | keyof AdditionaFns>(defaultValue: React.SetStateAction<T>, additionalFns: AdditionaFns, forbiddenKeys: readonly K[]): [T, SetProp<T, AdditionaFns, K>, RefObj<T>];
}
export declare const getSetProps: UsePropFns;
export declare const useSetProps: UsePropFns;
export declare const useSetPropsWithValue: UsePropFnsWithValue;
declare type KeysOfUnion<T> = T extends readonly any[] ? number & keyof T : keyof T;
declare type ArrayElement<T> = T extends readonly any[] ? T[number] : never;
export {};
