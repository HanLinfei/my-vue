// 属性依赖类 => 属性依赖对象，用于保存每个属性的副作用
class Dep {
  // 订阅者
  private subscribers: Set<() => any>;
  constructor() {
    this.subscribers = new Set();
  }

  // 订阅副作用
  depend() {
    if (activeEffect !== null) {
      this.subscribers.add(activeEffect);
    }
  }

  // 通知订阅者触发副作用
  notify() {
    this.subscribers.forEach((effectFn) => {
      effectFn();
    });
  }
}

// 活跃的副作用
// 第一次收集副作用时会触发proxy代理的get劫持 此时通知订阅副作用 此时订阅的副作用就是该活跃的副作用函数
let activeEffect: (() => any) | null = null;
function watchEffect(effectFn: () => any) {
  activeEffect = effectFn;
  effectFn();
  activeEffect = null;
}

// 副作用结构:
// targetMap => 以 响应式对象（target）:object 作为键，以depMap:Map 作为值
// depMap => 以响应式对象的属性(target[key]):string 作为键，以属性依赖作为值(dep):Dep
// 类型 WeakMap<object, Map<string, Dep>>
const targetMap: WeakMap<object, Map<string, Dep>> = new WeakMap();
// 传入需要被响应式的对象，传入响应式对象的每个属性 返回属性依赖
function getDep<T extends object, K extends keyof T>(
  target: T,
  key: K | string
) {
  let depMap = targetMap.get(target);
  if (!depMap) {
    depMap = new Map();
    targetMap.set(target, depMap);
  }
  let dep = depMap.get(key as string);
  if (!dep) {
    dep = new Dep();
    depMap.set(key as string, dep);
  }
  return dep;
}

// 进行对象代理
// 对属性的访问和设置进行劫持
// 访问 => 收集依赖
// 设置 => 通知订阅者
function reactive<T extends object>(raw: T) {
  return new Proxy<T>(raw, {
    get(target, key) {
      const dep = getDep(target, key as string);
      dep.depend();
      return target[key];
    },
    set(target, key, newValue) {
      const dep = getDep(target, key as string);
      if (newValue !== target[key]) {
        target[key] = newValue;
        dep.notify();
        return true;
      } else {
        return false;
      }
    },
  });
}

export { reactive, watchEffect };
