import type { IVnodeType } from "../core/render/types";
import { mount, patch } from "../core/render";
import { watchEffect } from "../core/reactive";
function createApp(rootComponent: { data?: object; render: () => IVnodeType }) {
  return {
    mount(selector: string | HTMLElement) {
      let container: HTMLElement;
      if (typeof selector === "string") {
        container = document.querySelector(selector) as HTMLElement;
      } else {
        container = selector;
      }
      let oldVnode: null | IVnodeType = null;

      let isMounted: boolean = false;

      // 第一次收集依赖会先调用一次 此时调用时候会直接触发挂载操作
      // 触发挂载操作即意味着会访问到模板中(在这个案例里是vnode)的变量
      // 然后这些变量都是已经被proxy代理过了 所以这些变量在被访问时候会被触发proxy的访问拦截
      // 访问拦截过程中会依次给这些变量收集副作用函数 副作用函数即为下面这个函数
      // 当下次再次变量被更新时候即触发proxy的设置拦截
      // 设置拦截则会通知副作用函数 即为下面的函数
      // 那么就会拿到新旧vnode 然后进行diff 然后重新执行挂载操作
      watchEffect(() => {
        // 第一次挂载
        if (!isMounted) {
          oldVnode = rootComponent.render();
          mount(oldVnode, container);
          isMounted = true;

          // 更新操作
        } else {
          const newVnode = rootComponent.render();
          patch(oldVnode as IVnodeType, newVnode);
          oldVnode = newVnode;
        }
      });
    },
  };
}

export default createApp;
export { watchEffect, reactive } from "./reactive/index";
export { h } from "./render/index";
