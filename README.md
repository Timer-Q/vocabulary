# 词根词汇

把原来的词根小程序做成纯前端网页。词库来自讲义和派生词素，不连后端。学习进度记在浏览器本地。

首页看今天该学什么，词库按词根、前缀、后缀找，点进去能看到一组词是怎么拼出来的。关系图一次只展开一个词素或一个讲义中心词，点节点打开单词。学习时先看拆分，翻开后再选不认识、模糊、认识或掌握。

## 本地运行

需要 Node.js 20 以上和 pnpm 9。

```bash
pnpm install
pnpm dev
```

开发地址是 [http://localhost:5173/vocabulary/](http://localhost:5173/vocabulary/)。路径带 `/vocabulary/`，和 GitHub Pages 项目站一致。

`pnpm build` 会先根据 `seed/` 里的词库生成 `public/data/`，再打包到 `dist/`。不要把 `server/.cache` 或 ECDICT 放进这个仓库。

## 发布

推送到 `main` 后，GitHub Actions 会构建并部署到 GitHub Pages。仓库地址按 [https://timer-q.github.io/vocabulary/](https://timer-q.github.io/vocabulary/) 来配。

需要在仓库的 Settings → Pages 里，把 Source 选成 **GitHub Actions**，只做这一次。之后每次推 `main` 都会更新页面。

## 数据

首屏只拉一份很小的索引。词素、讲义组和字母表目录都是点开再加载。派生词库里的例句是模板句，页面不用它们；例句只用讲义里能读的句子。讲义词与词的关系是「中心词连同组词」的星形，图上会限量展开，完整名单在旁边的列表里。
