import type { vnodeTagType, vnodePropsType, IVnodeType } from "./types";

// 1.调用h函数 返回vnode
function h(
  tag: vnodeTagType,
  props?: vnodePropsType,
  children?: IVnodeType[] | string
): IVnodeType {
  // 返回一个vnode
  return {
    tag,
    props,
    children,
  };
}

let evenListeners: string[] = [];
// 2.将vnode挂载到真实DOM节点上
function mount(vnode: IVnodeType, container: HTMLElement) {
  // 1.创建节点
  const el: HTMLElement = document.createElement(vnode.tag);
  vnode.el = el;
  // beforeMount-----------------------------------------------------------
  // 2.创建props
  if (vnode.props) {
    for (const key in vnode.props) {
      const value = vnode.props[key];
      // 属性有可能是函数
      if (key.startsWith("on")) {
        // 绑定事件
        // 剥离前缀 并且转小写 onClick => click
        el.addEventListener(key.slice(2).toLowerCase(), value as () => any);
        // 做函数内容映射 因为传进来的是匿名函数 无法拿到准确地址
        evenListeners.push(value.toString());
      } else {
        el.setAttribute(key, value as string);
      }
    }
  }

  // Mount-----------------------------------------------------------
  // 3.处理children
  if (vnode.children) {
    if (typeof vnode.children === "string") {
      el.textContent = vnode.children;
    } else {
      for (let i = 0; i < vnode.children.length; i++) {
        mount(vnode.children[i], el);
      }
    }
  }

  // 4.将el挂载到container上
  container.appendChild(el);
  // mounted---------------------------------------------------------
}

// 3.patch操作
function patch(vnode1: IVnodeType, vnode2: IVnodeType) {
  // 如果新旧vnode的标签都不一样 那么直接替换
  if (vnode1.tag !== vnode2.tag) {
    if (vnode1.el) {
      // 拿到父亲 通过父亲来移除原有的儿子
      const n1ElParent = vnode1.el.parentElement;
      n1ElParent?.removeChild(vnode1.el);

      // 然后直接将新节点挂载到父亲上去
      mount(vnode2, n1ElParent as HTMLElement);
    }
  } else {
    // 标签一样的情况下
    if (vnode1.el) {
      // 标签一样 那么el(真实DOM)肯定一样 并且vnode2是需要新插入的虚拟dom 他没有走mount挂载 是没有el的
      // 但是由于他们标签一样 那么el对象肯定必是同一个

      // 1. 取出element对象 并且在vnode2中保存
      vnode2.el = vnode1.el;
      const el = vnode2.el;
      // 2.处理props
      const oldElProps = vnode1.props || {};
      const newElProps = vnode2.props || {};

      // 拿到所有的新属性 判断新属性是否在旧属性中
      for (const key in newElProps) {
        // 新的vnode中的属性 在旧的vnode中
        if (key in oldElProps) {
          if (newElProps[key] !== oldElProps[key]) {
            // 绑定的props是事件
            if (key.startsWith("on")) {
              // 传来的是匿名函数 我们拿不到他的地址 所以无法确定到底绑定的到底是不是重复函数
              // 所以把函数体转成字符串 然后从之前的函数映射数组中依次找
              // 然后进行判断绑定
              const isOldFn = evenListeners.find((fnString) => {
                return fnString === newElProps[key].toString();
              });
              // 如果本次传来的不是之前的函数 那么就说明是新函数 则就需要绑定
              if (!isOldFn) {
                el.addEventListener(
                  key.slice(2).toLowerCase(),
                  newElProps[key] as () => any
                );
                evenListeners.push(newElProps[key].toString());
              }
              // 绑定的props是属性
            } else {
              el.setAttribute(key, newElProps[key] as string);
            }
          }
          // 新的vnode中的属性 不在旧的vnode中
        } else {
          if (key.startsWith("on")) {
            el.addEventListener(
              key.slice(2).toLowerCase(),
              newElProps[key] as () => any
            );
          } else {
            el.setAttribute(key, newElProps[key] as string);
          }
        }
      }

      // 相反的判断 判断旧的在不在新的里面
      // 在的情况上面已经处理过了 不在的话那么直接把旧的节点上的属性给删掉
      for (const key in oldElProps) {
        if (!(key in newElProps)) {
          if (key.startsWith("on")) {
            el.removeEventListener(
              key.slice(2).toLowerCase(),
              oldElProps[key] as () => any
            );
          } else {
            el.removeAttribute(key);
          }
        }
      }

      // 3.处理children
      const oldElChildren = vnode1.children || [];
      const newElChildren = vnode2.children || [];
      // vnode2本身是一个字符串类型
      if (typeof newElChildren === "string") {
        if (oldElChildren !== newElChildren) {
          el.innerHTML = newElChildren;
        }
      } else {
        // vnode2本身是一个数组类型
        if (typeof oldElChildren === "string") {
          el.innerHTML = "";
          for (let i = 0; i < newElChildren.length; i++) {
            // 取到每一个子节点 依次进行挂载
            mount(newElChildren[i], el);
          }
        } else {
          // 两个都是数组
          // oldElChildren : [v1,v2,v3]
          // newElChildren : [v1,v4,x5,v9,v10]

          // 取两个数组的最小长度
          const commonLength = Math.min(
            oldElChildren.length,
            newElChildren.length
          );

          // 先把公共部分进行patch操作：
          // patch操作也就是会依次判断这些节点标签是否相同...  props是否相同... 然后进行替换

          // 相等的情况
          for (let i = 0; i < commonLength; i++) {
            patch(oldElChildren[i], newElChildren[i]);
          }

          // 现在开始处理多余部分：

          // 如果newElChildren大于oldElChildren 那么直接进行挂载后面多出的部分
          // oldElChildren.length < newElChildren.length
          // oldElChildren : [v1,v2,v3]
          // newElChildren : [v1,v4,x5,v9,v10]

          if (oldElChildren.length < newElChildren.length) {
            const extraElChildren = newElChildren.slice(commonLength);
            for (let i = 0; i < extraElChildren.length; i++) {
              mount(extraElChildren[i], el);
            }
          }

          // 如果newElChildren小于oldElChildren 那么直接移除原有部分(移除父亲元素下的旧部分)
          // oldElChildren.length > newElChildren.length
          // oldElChildren : [v1,v2,v3,v7,v9]
          // newElChildren : [v1,v4,x5]

          if (oldElChildren.length > newElChildren.length) {
            const extraElChildren = oldElChildren.slice(commonLength);
            for (let i = 0; i < extraElChildren.length; i++) {
              el.removeChild(extraElChildren[i].el as HTMLElement);
            }
          }
        }
      }
    }
  }
}

export { h, mount, patch };
