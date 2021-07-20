"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSetPropsWithValue = exports.useSetProps = exports.getSetProps = void 0;
/* eslint-disable max-lines */
const react_1 = require("react");
const simple_subscriptions_1 = require("simple-subscriptions");
const getSetProps = (...rest) => {
    const { setState, additionalFns, forbiddenKeys } = getArgs(rest);
    const result = {
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
exports.getSetProps = getSetProps;
const useSetProps = (...rest) => {
    const { setState, additionalFns, forbiddenKeys } = getArgs(rest);
    const forbiddenKeysRef = react_1.useRef(forbiddenKeys);
    const additionalFnsRef = react_1.useRef(additionalFns);
    const setStateRef = react_1.useRef(setState);
    const result = react_1.useRef();
    react_1.useLayoutEffect(() => {
        forbiddenKeysRef.current = forbiddenKeys;
        additionalFnsRef.current = additionalFns;
        setStateRef.current = setState;
    });
    if (!result.current) {
        const setProp = getSetPropFn({
            getSetPropHelper: () => result.current,
            getSetState: () => setStateRef.current,
            getForbiddenKeys: () => forbiddenKeysRef.current,
            getAdditionalFns: () => additionalFnsRef.current,
            getSetProp: () => setProp,
        });
        result.current = { setProp };
    }
    return result.current.setProp;
};
exports.useSetProps = useSetProps;
const useSetPropsWithValue = (def, ...rest) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [state, setState] = react_1.useState(def);
    const fn = exports.useSetProps(setState, ...rest);
    const stateRef = react_1.useRef(state);
    stateRef.current = state;
    return [state, fn, stateRef];
};
exports.useSetPropsWithValue = useSetPropsWithValue;
const getSetPropFn = (helperArgs) => {
    const normalizedHelperArgs = Object.assign(Object.assign({}, helperArgs), { getSetState: () => getModifiedSetState(helperArgs) });
    const setProp = getRawSetProp(normalizedHelperArgs);
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
        anyPropChange: getSubscribeToAnyPropChangeFn(helperArgs, "anyPropChangeSubscriber"),
        direct: {
            change: getSubscribeToChangeFn(helperArgs, "directChangeSubscriber"),
            propChange: getSubscribeToChangeByKeyFn(helperArgs, "directPropChangeSubscriber"),
            anyPropChange: getSubscribeToAnyPropChangeFn(helperArgs, "directAnyPropChangeSubscriber"),
        },
    };
    setProp.setState = (...args) => {
        return normalizedHelperArgs.getSetState()(...args);
    };
    return setProp;
};
const getModifiedSetState = ({ getSetState: getRawSetState, getSetPropHelper, }) => {
    return (valueOrFn, meta) => {
        const getNewValue = toDispatchable(valueOrFn);
        const rawSetState = getRawSetState();
        const su = new simple_subscriptions_1.Subscription();
        let isCalled = false;
        rawSetState(prev => {
            isCalled = true;
            const newValue = getNewValue(prev);
            if (prev === newValue)
                return newValue;
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
                }
                else {
                    fn();
                }
            }, timeout);
        };
        fn();
    };
};
const handleSubscriptions = ({ prev, newValue, propsHelper, meta, }) => {
    if (prev === newValue)
        return;
    if (propsHelper.changeSubscriber) {
        propsHelper.changeSubscriber.broadcast(prev, newValue);
    }
    if (meta.isTopCall && propsHelper.directChangeSubscriber) {
        propsHelper.directChangeSubscriber.broadcast(prev, newValue);
    }
    if (!propsHelper.propChangeSubscriber &&
        !propsHelper.anyPropChangeSubscriber &&
        !propsHelper.directPropChangeSubscriber &&
        !propsHelper.directAnyPropChangeSubscriber) {
        return;
    }
    handlePropsSubscriptions({
        prev,
        newValue,
        propsHelper,
        meta,
    });
};
const handlePropsSubscriptions = ({ prev, newValue, propsHelper, meta, }) => {
    var _a, _b, _c, _d, _e, _f;
    const allKeys = Object.keys(prev || {}).concat(Object.keys(newValue || {}));
    const fixedKeys = {};
    for (const key of allKeys) {
        if (fixedKeys[key]) {
            continue;
        }
        fixedKeys[key] = true;
        const prevPropValue = getPropertySafely(prev, key);
        const newPropValue = getPropertySafely(newValue, key);
        if (prevPropValue === newPropValue)
            continue;
        const normalizedKey = (Array.isArray(prev) || Array.isArray(newValue)) &&
            key === parseInt(key) + ""
            ? +key
            : key;
        const info = {
            key: normalizedKey,
            nextValue: newPropValue,
            prevValue: prevPropValue,
            parentNextValue: newValue,
            parentPrevValue: prev,
        };
        (_a = propsHelper.anyPropChangeSubscriber) === null || _a === void 0 ? void 0 : _a.broadcast(info);
        (_c = (_b = propsHelper.propChangeSubscriber) === null || _b === void 0 ? void 0 : _b[key]) === null || _c === void 0 ? void 0 : _c.broadcast(info);
        if (!meta.isTopCall && meta.key + "" === key + "") {
            (_d = propsHelper.directAnyPropChangeSubscriber) === null || _d === void 0 ? void 0 : _d.broadcast(info);
            (_f = (_e = propsHelper.directPropChangeSubscriber) === null || _e === void 0 ? void 0 : _e[key]) === null || _f === void 0 ? void 0 : _f.broadcast(info);
        }
    }
};
const getSubscribeToChangeFn = ({ getSetPropHelper }, key) => {
    return (fn) => {
        const propsHelper = getSetPropHelper();
        if (!propsHelper[key]) {
            propsHelper[key] = new simple_subscriptions_1.Subscription();
        }
        return propsHelper[key].subscribe(fn);
    };
};
const getSubscribeToChangeByKeyFn = ({ getSetPropHelper }, topKey) => {
    return (key) => {
        const propsHelper = getSetPropHelper();
        if (!propsHelper[topKey]) {
            propsHelper[topKey] = {};
        }
        if (!propsHelper[topKey][key]) {
            propsHelper[topKey][key] = new simple_subscriptions_1.Subscription();
        }
        return propsHelper[topKey][key].subscribe;
    };
};
const getSubscribeToAnyPropChangeFn = ({ getSetPropHelper }, key) => {
    return (fn) => {
        const propsHelper = getSetPropHelper();
        if (!propsHelper[key]) {
            propsHelper[key] = new simple_subscriptions_1.Subscription();
        }
        return propsHelper[key].subscribe(fn);
    };
};
const getPropertySafely = (parent, key) => {
    if (!parent || typeof parent !== "object")
        return undefined;
    return parent[key];
};
const toDispatchable = (val) => {
    return (typeof val === "function" ? val : () => val);
};
const getRawSetProp = (helperArgs) => {
    return ((key) => {
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
    });
};
const getSetPropertyFnForKey = (key, { getSetState, getForbiddenKeys, getAdditionalFns }) => {
    return (...args) => {
        assertForbiddenKey(getForbiddenKeys(), key);
        const setState = getSetState();
        const additionalFns = getAdditionalFns();
        if (additionalFns && typeof additionalFns[key] === "function") {
            const additionalFn = additionalFns;
            const getFinalValue = additionalFn[key];
            setState((x) => {
                return getFinalValue(x, ...args);
            }, { isTopCall: false, key, specialFn: true });
            return;
        }
        const val = args[0];
        const valGetter = toDispatchable(val);
        setState((x) => {
            if (!x)
                return x;
            const oldVal = x[key];
            const newVal = valGetter(oldVal);
            if (newVal === oldVal)
                return x;
            const finalVal = Array.isArray(x) ? [...x] : Object.assign({}, x);
            finalVal[key] = newVal;
            return finalVal;
        }, { isTopCall: false, key, specialFn: false });
    };
};
const assertForbiddenKey = (forbiddenKeys, key) => {
    const isForbidden = forbiddenKeys ? forbiddenKeys.indexOf(key) > -1 : false;
    if (isForbidden) {
        throw new Error(`The key ${key} is set as forbidden and the value cannot be changed`);
    }
};
const getDeleteByIndexFn = ({ getSetState }) => {
    return (index) => {
        const setState = getSetState();
        setState((x) => {
            if (!x)
                return x;
            assertArray(x, "delete.byIndex");
            return x.filter((e, i) => i !== index);
        });
    };
};
const getDeleteByIndexFnGetter = ({ getSetPropHelper, getSetProp, }) => {
    return (index) => {
        const helper = getSetPropHelper();
        if (!helper.getDeleteFnByIndex) {
            helper.getDeleteFnByIndex = {};
        }
        if (!helper.getDeleteFnByIndex[index]) {
            helper.getDeleteFnByIndex[index] = () => getSetProp().delete.byIndex(index);
        }
        return helper.getDeleteFnByIndex[index];
    };
};
const getDeleteByKeyFn = ({ getSetState, getSetPropHelper }) => {
    return (key) => {
        const propsHelper = getSetPropHelper();
        if (!propsHelper.deleteByKeyFns) {
            propsHelper.deleteByKeyFns = {};
        }
        if (propsHelper.deleteByKeyFns[key]) {
            return propsHelper.deleteByKeyFns[key];
        }
        const fn = (value) => {
            const setState = getSetState();
            const comp = typeof value === "function" ? value : (e) => e !== value;
            setState((x) => {
                if (!x)
                    return x;
                assertArray(x, "delete.byKey");
                return x.filter((e, i) => {
                    const elemValue = e[key];
                    return comp(elemValue);
                });
            });
        };
        propsHelper.deleteByKeyFns[key] = fn;
        return propsHelper.deleteByKeyFns[key];
    };
};
function assertArray(x, key) {
    if (!Array.isArray(x)) {
        throw new Error(`state value during calling ${key} must be an array, null or undefined. instead received ${x}`);
    }
}
const getArgs = (args) => {
    const setState = args[0];
    let additionalFns = undefined;
    let forbiddenKeys = undefined;
    for (let i = 1; i < args.length; i++) {
        if (Array.isArray(args[i])) {
            forbiddenKeys = args[i];
        }
        else if (args[i] && typeof args[i] === "object") {
            additionalFns = args[i];
        }
    }
    return { setState, additionalFns, forbiddenKeys };
};
