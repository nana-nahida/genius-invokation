# 开发文档

本项目目前使用 monorepo 划分和管理包，共有如下包：

- **核心部分**
  - `@gi-tcg/core` 核心逻辑与游戏流程
  - `@gi-tcg/data` 官方卡牌数据表示
- **界面部分**
  - `@gi-tcg/webui-core` 基于 Solid 的 Web 用户界面组件
  - `@gi-tcg/webui` 基于 Web Component 的用户界面包装
  - `@gi-tcg/standalone` 用于调试的集成 Web 用户界面
- **对战平台相关**
  - `@gi-tcg/server` 对战平台服务器实现
  - `@gi-tcg/web-client` 对战平台客户端（网页版）实现
- **程序互通信组件**
  - `@gi-tcg/raw-server` 基于 WebSocket 的本地游戏核心服务
- **其它**
  - `@gi-tcg/static-data` 官方静态数据源
  - `@gi-tcg/typings` 定义基本数据类型前后端通信格式
  - `@gi-tcg/utils` 实用工具集合

下一步……
- 如果你需要在你的程序中**使用这些项目组件**，请参阅下方[使用接口](#使用接口)以及对应包的 `README.md`了解使用方式；
- 如果你需要**参与本项目的开发**，请参阅下方[参与开发](#参与开发)，其中的例子可供参考；如有疑问可邮件联系或在 [Discussion](https://github.com/guyutongxue/genius-invokation/discussions) 中发起讨论。

## 使用接口

核心库暴露了 `Game` 类代表对局。其构造参数大致为：

```ts
interface StartOption {
  data: GameData; // import('@gi-tcg/data') 可获取
  playerConfigs: [PlayerConfig, PlayerConfig];
  io: GameIO; // see below
}

interface PlayerConfig {
  readonly cards: number[];
  readonly characters: number[];
}

// 使用：
const game = new Game(option);
const winner = await game.start();
```

大部分字段都是显然的。

- 玩家分别是 0 号玩家和 1 号玩家，0 号玩家总是先手（使用方负责猜先的实现）。每个玩家的 `PlayerConfig` 通常只需指明其角色牌 `characters` 和行动牌 `cards`。
- `data` 如果使用官方卡牌数据，可直接 `import data from "@gi-tcg/data";`。
- `io` 定义了玩家的交互行为。

```ts
interface GameIO {
  pause: (st: GameState) => Promise<unknown>;
  players: [PlayerIO, PlayerIO];
}

interface PlayerIO {
  notify: (notification: NotificationMessage) => void;
  rpc: <M extends RpcMethod>(
    method: M,
    data: RpcRequest[M],
  ) => Promise<RpcResponse[M]>;
}
```

玩家的交互行为在 `io.players` 中定义。其中：
- 在合理的时机游戏会调用玩家的 `notify` 函数以通知玩家有某些牌局的变化；
- 在需要玩家操作（指重投骰子、切换手牌、选择出战角色、选择行动）的时刻，会调用 `rpc` 获取玩家的选择。也可通过实现此接口接入 AI 智能体。

关于玩家 IO 的详细说明，参见 [io](./io.md)。

每次对局进行到一个“暂停点”处，就会调用一次 `pause`，方便使用方调试。

## 参与开发

配置开发环境。安装 [Bun](https://bun.sh)，随后在仓库根目录下执行下述命令既可：

```sh
bun install
bun run build
```

随后即可调试修改数据定义包、核心包或者其它代码。

### 例：启动 `@gi-tcg/standalone` 项目的开发服务器

```
cd packages/standalone
bun dev
```

### 例：修改卡牌定义

定义卡牌数据被设计为“应当”非常简单的操作。请查阅 `@gi-tcg/data` 包的代码。参考文档位于 [data](./data/README.md)。

编辑完成后，可使用 `@gi-tcg/webui-core` 库测试修改。具体来说，可以修改 `webui-core` 库的 `src/dev.tsx` 的 `PlayerConfig` 以包含需要测试的卡牌，并使用 Vite 预览对局。

```sh
cd packages/webui-core
# 编辑 src/dev.tsx
bun dev # 查看效果
```

### 例：参与游戏核心设计细节

在阅读 `@gi-tcg/core` 的源码之前，可以先参阅下述文档：
- **[一份全面但过时的 slides](https://kdocs.cn/l/chWGWwQNLHGo)**
- [核心数据结构](./state.md)
- [结算流程设计](./process.md)

同样地，可以使用 `@gi-tcg/webui-core` 来测试核心的修改情况，流程与上节相同。

### 例：修改前后端通信数据格式

修改 `@gi-tcg/typings` 中定义的数据结构后，请使用 `bun run build` 生成对应的 JSON Schema 文件。（否则核心可能会校验失败，切记！）

核心库中的 `src/io.ts` 中存在翻译 `GameState` 到对应数据格式的代码，你可能也要一并修改。
