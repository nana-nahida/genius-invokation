# 官方卡牌定义的维护

本项目尽可能自动化维护最新的卡牌数据。`@gi-tcg/data` 中的 `scripts` 文件夹，提供了自动维护最新数据（包括平衡性调整）的代码。在安装并更新了开发依赖后，执行 `bun regenerate_data` 任务即可。

本项目数据部分的代码，以及维护程序生成的代码，每个定义都包括如下 JSDoc 样式的文档注释：

```ts
/**
 * @id 11011
 * @name 流天射术
 * @description
 * 造成2点物理伤害。
 */
export const LiutianArchery = ...
```

维护程序依赖于这些“元数据”进行修改和生成：
- `@id` 为该定义的官方 id；
- `@name` 为该定义的官方中文名称；
- `@description` 为该定义的官方描述。

`@gi-tcg/static-data` 从 GenshinData 数据源提取官方数据。`@gi-tcg/data` 的脚本会读取来自 `@gi-tcg/static-data` 的数据，基于 `@id` 和已有的代码进行比较。如果新数据的 `@description` 与原有 `@description` 不同，那么就会产出一条 `@outdated` 标记表明该实体发生了“平衡性调整”，请开发者注意比对两种描述并修改代码。

如果维护程序读取到来自官方数据的一条新定义（文件中未出现对应 `@id`），那么就会自动将生成的模板代码（带有 `TODO` 标记）放在文件末尾。模板代码有概率无法直接编译通过，此时需要开发者手动修改。如果自动生成的模板代码中，有的实体/技能定义是不必要的（比如实现方式的不同或者官方残留的数据），那么建议将 `.done();` 结尾改为 `.reserve();` 结尾，而非直接删去定义。这保证维护程序仍然能正确处理它们，而且不会影响我们的数据生成。

请注意：尽管这种手段能发现并处理大部分平衡性调整，但是**无法处理骰子需求的修改**。请版本更新时特别注意骰子需求的变化，并手动将它们修改到新版本。

## 更新操作备忘录

- 获取最新的 GenshinData；
- 进入 `@gi-tcg/static-data`，设置 `version` 的 `gi-` 版本；
- 指定 `$GENSHIN_DATA` 路径后，运行 `bun generate`；
- 进入 `@gi-tcg/data`，前往 `scripts/generators/config.ts` 设置版本信息；
- 运行 `bun regenerate_data`；
- 修复生成的代码使得编译通过；
- 发布新版本至 `npmjs.org`；
- 前往 `@gi-tcg/assets`，更新依赖；
- 导出游戏内图片资源后，指定 `$TEXTURE2D_FOLDER`，运行 `bun build:image`；
- 使用 `bun dev` 启动状态图标编辑器，维护最新状态图标映射；
- 导出映射文件后，回填至 `@gi-tcg/static-data` 的 `scripts/mappings/buff_icons.json`。

