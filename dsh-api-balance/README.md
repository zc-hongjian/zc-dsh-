# dsh-api-balance

DeepSeek Harness 左下角实时余额 / 用量插件。

一个悬浮在 Web 界面左侧**设置按钮上方**的胶囊，实时显示当前 DeepSeek API Key 的余额，
以及当前会话累计的 Token 用量；鼠标悬停时胶囊放大、发光，并向上滑出详情面板
（余额构成、可用状态、更新时间、输入 / 输出 / 缓存 Token 明细），点击胶囊或
面板内刷新按钮可立即刷新。

## 功能

- **实时余额**：通过宿主进程（host half）代理 DeepSeek `GET /user/balance`，
  API Key 始终留在宿主进程内，不会下发到浏览器页面。
- **实时用量**：读取宿主下发的 `tokenUsage` 投影（当前会话累计输入 / 输出 /
  缓存命中 / 缓存写入 Token），随会话事件实时更新。
- **动态效果**：悬停放大 + 品牌色光晕 + 面板滑出；刷新时状态点脉冲动画；
  余额随可用性显示绿 / 黄 / 红状态点；跟随主题的 CSS 变量配色。
- **自动刷新**：默认每 30 秒轮询一次（页面可见时刷新，宿主侧另有 4 秒缓存），
  点击胶囊或刷新按钮可手动刷新。

## 安装

1. 将本目录复制到 Web profile 的 node_modules：

   ```powershell
   Copy-Item -Recurse . 'C:\Users\20378\.dsh\profiles\web\node_modules\dsh-api-balance'
   ```

2. 在 `C:\Users\20378\.dsh\profiles\web\cordis.patch.yml` 中追加加载条目：

   ```yaml
   - insert:
       - id: api-balance
         name: 'dsh-api-balance'
         inject:
           - webServer
   ```

3. **重启 harness**（停止并重新运行 `dsh web`），刷新页面。

## API Key 配置

插件通过宿主凭证通道读取 `DEEPSEEK_API_KEY`：

- 环境变量 `DEEPSEEK_API_KEY`，或
- 网页端「模型」设置中保存的 DeepSeek 凭证（写入后可即时生效，无需重启）。

自定义 API 地址可用环境变量 `DEEPSEEK_BASE_URL` 覆盖（默认 `https://api.deepseek.com`）。

## 工作原理

```
浏览器页面（client half）             宿主进程（host half）
┌─────────────────────────┐         ┌──────────────────────────────┐
│ 左下角悬浮胶囊（Shadow DOM）│  fetch  │  GET /dsh-balance（同源路由）   │
│  · 每 30s 轮询余额        │ ──────▶ │  · 凭证通道解析 API Key        │
│  · 订阅 tokenUsage 投影   │         │  · 代理 /user/balance（4s 缓存）│
│  · 悬停展开详情面板        │ ◀────── │  · 返回 JSON，Key 不下发       │
└─────────────────────────┘         └──────────────────────────────┘
```

## 说明

- 本插件仅做展示；余额接口为 DeepSeek 官方公开接口。
- `dsh.client.inject` 声明了 `@deepseek-ai/dsh-client-runtime`，保证 `ctx.sessions`
  在浏览器端可用；宿主编译期依赖 `@deepseek-ai/dsh-credentials`（Web profile 已内置）。

## License

MIT
