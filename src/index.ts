/* eslint-disable max-lines */
import { useLayoutEffect, useRef, useState } from "react";
import { Subscription } from "simple-subscriptions";

export interface SetState<T> {
  (newValue: T): void;
  (fn: (currentValue: T) => T): void;
}

export type PropHookReducer<T, Args extends readonly any[]> = (
  currentState: T,
  ...args: Args
) => T;

type UnWrap<Fn> = Fn extends (currentState: infer T, ...args: infer R) => void
  ? (...args: R) => void
  : never;

interface RawSetProp<
  T,
  Reducers extends Record<string, PropHookReducer<T, any>> = {},
  ForbiddenKeys extends string | number | symbol = never
> {
  <K extends Exclude<KeysOfUnion<T> | keyof Reducers, ForbiddenKeys>>(
    key: K
  ): K extends keyof Reducers
    ? UnWrap<Reducers[K]>
    : SetState<GetValueType<T, K>>;
}

type GetValueType<
  T,
  K extends string | number | symbol
> = T extends readonly any[]
  ? K extends keyof T
    ? T[K]
    : never
  :
      | (T extends { readonly [key in K]: any }
          ? T[K]
          : T extends { readonly [key in K]?: any }
          ? T[K] | undefined
          : never)
      | (K extends keyof NonNullable<T> ? never : undefined);

export interface SetProp<
  T,
  Reducers extends Record<string, PropHookReducer<T, any>> = {},
  ForbiddenKeys extends string | number | symbol = never
> extends CustomFns<T>, RawSetProp<T, Reducers, ForbiddenKeys> {}

type CustomFns<T> = AnyFns<T> & ArrayFns<T>;
type Unsubscribe = () => void;

interface ArrayFns<T> {
  delete: {
    byIndex: (index: number) => void;
    byKey: T extends readonly any[]
      ? <K extends KeysOfUnion<ArrayElement<T>>>(
          key: K
        ) => DeleteByKeyFn<T[number][K]>
      : never;
  };
  getDeleteFn: {
    byIndex: (index: number) => () => void;
  };
}

interface SubscribeToFns<T> {
  change: (fn: ChangeFn<T>) => Unsubscribe;
  propChange: T extends null | undefined
    ? never
    : T extends readonly any[]
    ? <K extends number>(
        key: K
      ) => (
        fn: PropChangeFn<T, GetValueType<T, K> | undefined, K>
      ) => Unsubscribe
    : <K extends KeysOfUnion<T>>(
        key: K
      ) => (fn: PropChangeFn<T, GetValueType<T, K>, K>) => Unsubscribe;
  anyPropChange: T extends null | undefined
    ? never
    : T extends readonly any[]
    ? (
        fn: AnyPropChangeFn<T, GetValueType<T, number> | undefined, number>
      ) => Unsubscribe
    : (
        fn: AnyPropChangeFn<T, GetValueType<T, KeysOfUnion<T>>, KeysOfUnion<T>>
      ) => Unsubscribe;
}

interface AnyFns<T> {
  subscribeTo: SubscribeToFns<T> & {
    direct: SubscribeToFns<T>;
  };
  setState: SetState<T>;
}

type ChangeFn<T> = (prev: T, next: T) => void;
type PropChangeFn<Root, T, K> = (info: {
  prevValue: T;
  nextValue: T;
  key: K;
  parentPrevValue: Root;
  parentNextValue: Root;
}) => void;
type AnyPropChangeFn<Root, T, K> = PropChangeFn<Root, T, K>;

interface DeleteByKeyFn<Val> {
  (value: Val): void;
  (compareFn: (value: Val) => boolean): void;
}

interface UsePropFns {
  <T extends Record<any, any> | undefined | null>(
    setState: SetState<T>
  ): SetProp<T>;
  <
    T extends Record<any, any> | undefined | null,
    AdditionaFns extends Record<string, PropHookReducer<T, any>>
  >(
    setState: SetState<T>,
    additionalFns: AdditionaFns
  ): SetProp<T, AdditionaFns>;
  <T extends Record<any, any> | undefined | null, K extends KeysOfUnion<T>>(
    setState: SetState<T>,
    forbiddenKeys: readonly K[]
  ): SetProp<T, Record<any, any>, K>;
  <
    T extends Record<any, any> | undefined | null,
    AdditionaFns extends Record<string, PropHookReducer<T, any>>,
    K extends KeysOfUnion<T> | keyof AdditionaFns
  >(
    setState: SetState<T>,
    additionalFns: AdditionaFns,
    forbiddenKeys: readonly K[]
  ): SetProp<T, AdditionaFns, K>;
}

interface RefObj<T> {
  readonly current: T;
}

interface UsePropFnsWithValue {
  <T extends Record<any, any> | undefined | null>(
    defaultValue: React.SetStateAction<T>
  ): [T, SetProp<T>, RefObj<T>];
  <
    T extends Record<any, any> | undefined | null,
    AdditionaFns extends Record<string, PropHookReducer<T, any>>
  >(
    defaultValue: React.SetStateAction<T>,
    additionalFns: AdditionaFns
  ): [T, SetProp<T, AdditionaFns>, RefObj<T>];
  <T extends Record<any, any> | undefined | null, K extends KeysOfUnion<T>>(
    defaultValue: React.SetStateAction<T>,
    forbiddenKeys: readonly K[]
  ): [T, SetProp<T, Record<any, any>, K>, RefObj<T>];
  <
    T extends Record<any, any> | undefined | null,
    AdditionaFns extends Record<string, PropHookReducer<T, any>>,
    K extends KeysOfUnion<T> | keyof AdditionaFns
  >(
    defaultValue: React.SetStateAction<T>,
    additionalFns: AdditionaFns,
    forbiddenKeys: readonly K[]
  ): [T, SetProp<T, AdditionaFns, K>, RefObj<T>];
}

type SetPropKepper = {
  setProp: SetProp<any>;
  changeByKeyFns?: Record<any, any>;
  deleteByKeyFns?: Record<any, any>;
  getDeleteFnByIndex?: Record<any, any>;
  changeSubscriber?: Subscription<ChangeFn<any>>;
  propChangeSubscriber?: Record<any, Subscription<PropChangeFn<any, any, any>>>;
  anyPropChangeSubscriber?: Subscription<AnyPropChangeFn<any, any, any>>;
  directChangeSubscriber?: Subscription<ChangeFn<any>>;
  directPropChangeSubscriber?: Record<
    any,
    Subscription<PropChangeFn<any, any, any>>
  >;
  directAnyPropChangeSubscriber?: Subscription<AnyPropChangeFn<any, any, any>>;
} & Record<any, any>;

export const getSetProps: UsePropFns = (...rest: any[]): any => {
  const { setState, additionalFns, forbiddenKeys } = getArgs(rest);

  const result: SetPropKepper = {
    setProp: getSetPropFn({
      getSetPropHelper: () => result,
      getSetState: () => setState,
      getForbiddenKeys: () => forbiddenKeys,
      getAdditionalFns: () => additionalFns,
      getSetProp: () => result.setProp,
    }),
  };
  return result.setProp;
};

export const useSetProps: UsePropFns = (...rest: any[]): any => {
  const { setState, additionalFns, forbiddenKeys } = getArgs(rest);

  const forbiddenKeysRef = useRef<readonly string[] | undefined>(forbiddenKeys);

  const additionalFnsRef = useRef(additionalFns);
  const setStateRef = useRef(setState);

  const result = useRef<SetPropKepper>();

  useLayoutEffect(() => {
    forbiddenKeysRef.current = forbiddenKeys;
    additionalFnsRef.current = additionalFns;
    setStateRef.current = setState;
  });

  if (!result.current) {
    const setProp = getSetPropFn({
      getSetPropHelper: () => result.current!,
      getSetState: () => setStateRef.current!,
      getForbiddenKeys: () => forbiddenKeysRef.current,
      getAdditionalFns: () => additionalFnsRef.current,
      getSetProp: () => setProp,
    });
    result.current = { setProp };
  }
  return result.current!.setProp;
};

export const useSetPropsWithValue: UsePropFnsWithValue = (
  def,
  ...rest: any[]
): any => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [state, setState] = useState(def);
  const fn = (useSetProps as any)(setState, ...rest);
  const stateRef = useRef(state);
  stateRef.current = state;
  return [state, fn, stateRef];
};

interface HelperArgs {
  getSetPropHelper: () => SetPropKepper;
  getSetState: () => SetState<any>;
  getForbiddenKeys: () => readonly string[] | undefined;
  getAdditionalFns: () => Record<any, any> | undefined;
  getSetProp: () => SetProp<any>;
}

const getSetPropFn = (helperArgs: HelperArgs): SetProp<any> => {
  const normalizedHelperArgs: HelperArgs = {
    ...helperArgs,
    getSetState: () => getModifiedSetState(helperArgs),
  };
  const setProp = getRawSetProp(normalizedHelperArgs) as SetProp<any>;
  setProp.delete = {
    byIndex: getDeleteByIndexFn(normalizedHelperArgs),
    byKey: getDeleteByKeyFn(normalizedHelperArgs),
  };
  setProp.getDeleteFn = {
    byIndex: getDeleteByIndexFnGetter(normalizedHelperArgs),
  };
  setProp.subscribeTo = {
    change: getSubscribeToChangeFn(helperArgs, "changeSubscriber"),
    propChange: getSubscribeToChangeByKeyFn(helperArgs, "propChangeSubscriber"),
    anyPropChange: getSubscribeToAnyPropChangeFn(
      helperArgs,
      "anyPropChangeSubscriber"
    ),
    direct: {
      change: getSubscribeToChangeFn(helperArgs, "directChangeSubscriber"),
      propChange: getSubscribeToChangeByKeyFn(
        helperArgs,
        "directPropChangeSubscriber"
      ),
      anyPropChange: getSubscribeToAnyPropChangeFn(
        helperArgs,
        "directAnyPropChangeSubscriber"
      ),
    },
  };
  setProp.setState = (...args: any[]) => {
    return (normalizedHelperArgs.getSetState() as any)(...args);
  };
  return setProp;
};

const getModifiedSetState = ({
  getSetState: getRawSetState,
  getSetPropHelper,
}: HelperArgs) => {
  return (
    valueOrFn: Parameters<ReturnType<typeof getRawSetState>>[0],
    meta?: Meta
  ) => {
    const getNewValue = toDispatchable(valueOrFn);
    const rawSetState = getRawSetState() as any;
    const su = new Subscription();
    let isCalled = false;
    rawSetState(prev => {
      isCalled = true;
      const newValue = getNewValue(prev);
      if (prev === newValue) return newValue;
      const unsubscribe = su.subscribe(() => {
        handleSubscriptions({
          prev,
          newValue,
          propsHelper: getSetPropHelper(),
          meta: meta || { isTopCall: true },
        });
        unsubscribe();
      });
      return newValue;
    }, meta);
    let timeout = 0;
    const fn = () => {
      setTimeout(() => {
        timeout = 1;
        if (isCalled) {
          su.broadcast();
        } else {
          fn();
        }
      }, timeout);
    };
    fn();
  };
};

type Meta =
  | { isTopCall: true }
  | { isTopCall: false; key: any; specialFn: boolean };

interface SubscriptionHelperArgs {
  prev: any;
  newValue: any;
  propsHelper: SetPropKepper;
  meta: Meta;
}

const handleSubscriptions = ({
  prev,
  newValue,
  propsHelper,
  meta,
}: SubscriptionHelperArgs) => {
  if (prev === newValue) return;
  if (propsHelper.changeSubscriber) {
    propsHelper.changeSubscriber.broadcast(prev, newValue);
  }
  if (meta.isTopCall && propsHelper.directChangeSubscriber) {
    propsHelper.directChangeSubscriber.broadcast(prev, newValue);
  }
  if (
    !propsHelper.propChangeSubscriber &&
    !propsHelper.anyPropChangeSubscriber &&
    !propsHelper.directPropChangeSubscriber &&
    !propsHelper.directAnyPropChangeSubscriber
  ) {
    return;
  }
  handlePropsSubscriptions({
    prev,
    newValue,
    propsHelper,
    meta,
  });
};

const handlePropsSubscriptions = ({
  prev,
  newValue,
  propsHelper,
  meta,
}: SubscriptionHelperArgs) => {
  const allKeys = Object.keys(prev || {}).concat(Object.keys(newValue || {}));
  const fixedKeys: Record<any, boolean> = {};
  for (const key of allKeys) {
    if (fixedKeys[key]) {
      continue;
    }
    fixedKeys[key] = true;
    const prevPropValue = getPropertySafely(prev, key);
    const newPropValue = getPropertySafely(newValue, key);
    if (prevPropValue === newPropValue) continue;
    const normalizedKey =
      (Array.isArray(prev) || Array.isArray(newValue)) &&
      key === parseInt(key) + ""
        ? +key
        : key;
    const info: Parameters<PropChangeFn<any, any, any>>[0] = {
      key: normalizedKey,
      nextValue: newPropValue,
      prevValue: prevPropValue,
      parentNextValue: newValue,
      parentPrevValue: prev,
    };
    propsHelper.anyPropChangeSubscriber?.broadcast(info);
    propsHelper.propChangeSubscriber?.[key]?.broadcast(info);

    if (!meta.isTopCall && meta.key + "" === key + "") {
      propsHelper.directAnyPropChangeSubscriber?.broadcast(info);
      propsHelper.directPropChangeSubscriber?.[key]?.broadcast(info);
    }
  }
};

const getSubscribeToChangeFn = (
  { getSetPropHelper }: HelperArgs,
  key: "changeSubscriber" | "directChangeSubscriber"
) => {
  return (fn: ChangeFn<any>) => {
    const propsHelper = getSetPropHelper();
    if (!propsHelper[key]) {
      propsHelper[key] = new Subscription<ChangeFn<any>>();
    }
    return propsHelper[key]!.subscribe(fn);
  };
};

const getSubscribeToChangeByKeyFn = (
  { getSetPropHelper }: HelperArgs,
  topKey: "propChangeSubscriber" | "directPropChangeSubscriber"
) => {
  return (key: any) => {
    const propsHelper = getSetPropHelper();
    if (!propsHelper[topKey]) {
      propsHelper[topKey] = {};
    }
    if (!propsHelper[topKey]![key]) {
      propsHelper[topKey]![key] = new Subscription<
        PropChangeFn<any, any, any>
      >();
    }
    return propsHelper[topKey]![key].subscribe;
  };
};

const getSubscribeToAnyPropChangeFn = (
  { getSetPropHelper }: HelperArgs,
  key: "anyPropChangeSubscriber" | "directAnyPropChangeSubscriber"
) => {
  return (fn: AnyPropChangeFn<any, any, any>) => {
    const propsHelper = getSetPropHelper();
    if (!propsHelper[key]) {
      propsHelper[key] = new Subscription<AnyPropChangeFn<any, any, any>>();
    }
    return propsHelper[key]!.subscribe(fn);
  };
};

const getPropertySafely = (parent: any, key: string | number | symbol) => {
  if (!parent || typeof parent !== "object") return undefined;
  return parent[key];
};

const toDispatchable = <T extends any>(
  val: T
): T extends (...args: any[]) => any ? T : (value: T) => T => {
  return (typeof val === "function" ? val : () => val) as any;
};

const getRawSetProp = (helperArgs: HelperArgs): RawSetProp<any, any, any> => {
  return ((key: string) => {
    const propsHelper = helperArgs.getSetPropHelper();
    if (!propsHelper.changeByKeyFns) {
      propsHelper.changeByKeyFns = {};
    }
    if (propsHelper.changeByKeyFns[key]) {
      return propsHelper.changeByKeyFns[key];
    }
    const fn = getSetPropertyFnForKey(key, helperArgs);
    propsHelper.changeByKeyFns[key] = fn;
    return fn;
  }) as any;
};

const getSetPropertyFnForKey = (
  key: string,
  { getSetState, getForbiddenKeys, getAdditionalFns }: HelperArgs
) => {
  return (...args: any[]) => {
    assertForbiddenKey(getForbiddenKeys(), key);
    const setState = getSetState() as (
      val: any | (() => any),
      meta: Meta
    ) => void;
    const additionalFns = getAdditionalFns();
    if (additionalFns && typeof additionalFns[key] === "function") {
      const additionalFn = additionalFns;
      const getFinalValue = additionalFn[key]!;
      setState(
        (x: any) => {
          return getFinalValue(x, ...args);
        },
        { isTopCall: false, key, specialFn: true }
      );
      return;
    }
    const val = args[0];
    const valGetter = toDispatchable(val);
    setState(
      (x: any) => {
        if (!x) return x;
        const oldVal = x[key];
        const newVal = valGetter(oldVal);
        if (newVal === oldVal) return x;
        const finalVal = Array.isArray(x) ? [...x] : { ...x };
        finalVal[key] = newVal;
        return finalVal;
      },
      { isTopCall: false, key, specialFn: false }
    );
  };
};

const assertForbiddenKey = (
  forbiddenKeys: readonly string[] | undefined,
  key: string
) => {
  const isForbidden = forbiddenKeys ? forbiddenKeys.indexOf(key) > -1 : false;
  if (isForbidden) {
    throw new Error(
      `The key ${key} is set as forbidden and the value cannot be changed`
    );
  }
};

const getDeleteByIndexFn = ({ getSetState }: HelperArgs) => {
  return (index: number) => {
    const setState = getSetState();
    setState((x: any) => {
      if (!x) return x;
      assertArray(x, "delete.byIndex");
      return x.filter((e, i) => i !== index);
    });
  };
};

const getDeleteByIndexFnGetter = ({
  getSetPropHelper,
  getSetProp,
}: HelperArgs) => {
  return (index: number) => {
    const helper = getSetPropHelper();
    if (!helper.getDeleteFnByIndex) {
      helper.getDeleteFnByIndex = {};
    }
    if (!helper.getDeleteFnByIndex[index]) {
      helper.getDeleteFnByIndex[index] = () =>
        getSetProp().delete.byIndex(index);
    }
    return helper.getDeleteFnByIndex[index]!;
  };
};

const getDeleteByKeyFn = ({ getSetState, getSetPropHelper }: HelperArgs) => {
  return (key: any) => {
    const propsHelper = getSetPropHelper();
    if (!propsHelper.deleteByKeyFns) {
      propsHelper.deleteByKeyFns = {};
    }
    if (propsHelper.deleteByKeyFns[key]) {
      return propsHelper.deleteByKeyFns[key];
    }
    const fn: DeleteByKeyFn<any> = (value: any) => {
      const setState = getSetState();
      const comp =
        typeof value === "function" ? value : (e: any) => e !== value;
      setState((x: any) => {
        if (!x) return x;
        assertArray(x, "delete.byKey");
        return x.filter((e, i) => {
          const elemValue = e[key];
          return comp(elemValue);
        });
      });
    };
    propsHelper.deleteByKeyFns![key] = fn;
    return propsHelper.deleteByKeyFns![key];
  };
};

function assertArray(x: unknown, key: string): asserts x is any[] {
  if (!Array.isArray(x)) {
    throw new Error(
      `state value during calling ${key} must be an array, null or undefined. instead received ${x}`
    );
  }
}

const getArgs = (args: any) => {
  const setState = args[0];
  let additionalFns: Record<any, any> | undefined = undefined;
  let forbiddenKeys: any[] | undefined = undefined;
  for (let i = 1; i < args.length; i++) {
    if (Array.isArray(args[i])) {
      forbiddenKeys = args[i];
    } else if (args[i] && typeof args[i] === "object") {
      additionalFns = args[i];
    }
  }
  return { setState, additionalFns, forbiddenKeys };
};

type KeysOfUnion<T> = T extends readonly any[] ? number & keyof T : keyof T;
type ArrayElement<T> = T extends readonly any[] ? T[number] : never;
