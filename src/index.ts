import createApp, { h, reactive } from "../core";
const App = {
  // 组件状态
  data: reactive({
    counter: 0,
    divclass: "container",
  }),

  // 1.vue3是通过运行时将模板编译成了render函数
  // 之后render函数会返回vnode
  // 再然后将vnode渲染成真实DOM
  // 2.vue3也可以直接通过render函数返回一个手写的vnode

  render() {
    return h("div", { class: `${this.data.divclass}` }, [
      h("h2", {}, `当前计数:${this.data.counter}`),
      h(
        "button",
        {
          onClick: () => {
            this.data.counter++;
          },
        },
        "+1"
      ),
      h(
        "button",
        {
          onClick: () => {
            this.data.divclass = "box";
            console.log(this.data.divclass);
          },
        },
        "changeProps"
      ),
    ]);
  },
};

// 调用创建实例的方法 返回app实例对象 调用对象下的挂载方法 将其挂载到id为app的DOM节点上
createApp(App).mount("#app");
