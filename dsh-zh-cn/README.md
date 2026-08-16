# dsh-zh-cn

DeepSeek Harness 中文界面插件（Simplified Chinese UI plugin）。

把 Web 界面中仍然显示英文的地方中文化，参考官方 ui-* 包与 dsh-dream-skin 的客户端插件思路（dsh.client 声明 + cordis.patch.yml loader entry + 浏览器端 apply）。

## 解决的问题

- **官方 zh 字典未翻译的键**：例如轨迹（Trajectory）工具栏的 Duration / Turns / Calls、Cordis 面板、模型选择的 Default 等。
- **硬编码英文标签**：轨迹视图详情（Model、Tokens、Purpose、Throughput、TTFT、System Prompt…）、思考按钮 Think、压缩卡片 compact、Inspect、Plugins、Skill 等，这些文本不经过 locale 系统，只能做 DOM 级替换。
- **启动时确保简体中文**：首次启动把活动语言设为 zh（设置里的语言切换仍然可用）。

## 实现机制（两层）

1. **字典补丁** —— ctx.locale.register() 对已存在的命名空间会抛错，因此直接合并进 locale runtime 内部的 zh 字典（ctx.locale.dicts），再调用 ctx.locale.publish() 通知已渲染的组件刷新。
2. **DOM 文本补丁** —— 一个 MutationObserver 监听整棵 DOM 树：先对「完整精确匹配」映射表的文本节点与 title / aria-label / placeholder 属性做精确替换；未命中时再对 ≤500 字符的短文本做前缀/后缀模式替换（覆盖工具反馈如 Defined…/Removed…/Initialized…、Cordis run … completed successfully、Total/TTFT/Decoding 等带动态值的固定格式文本）。只处理直接文本子节点，跳过 SCRIPT/STYLE/CODE/PRE/INPUT 等，长文本与用户消息不受影响。

## 安装

1. 把本包放入 profile（例如 ~/.dsh/profiles/web）的 node_modules（可直接复制，或用 pnpm add file:../dsh-zh-cn 链接）。
2. 在 profile 的 cordis.patch.yml 追加：

```yaml
- insert:
    - id: zh-cn
      name: 'dsh-zh-cn'
```

   或把包加入 profile package.json 的 dsh.profile.bundles（bundle patch 会自动插入 loader entry）。

3. 重启 dsh web 生效。

## 结构

- lib/index.js —— 宿主端 no-op 入口
- lib/client.js —— 浏览器端实现（字典补丁 + DOM 文本替换）
- cordis.patch.yml —— 本包作为 bundle 时的 patch 层
