# 🤝 贡献指南

欢迎为本项目贡献词库、题库与功能改进！本项目坚持三条原则：

1. **纯离线**：不引入任何网络请求与外部依赖
2. **零构建**：保持"下载解压双击即用"，不引入打包工具链
3. **数据本地**：不收集、不上传任何用户数据

## 贡献词库

词库文件在 `js/data/words/`，每行一个词条：

```js
["word","ˈwɜːrd","n.","释义；多义项用中文分号分隔"],
```

要求：全小写、美音 IPA（ɔːr / ɜːr 卷舌写法）、释义 ≤18 汉字、不含引号反斜杠。
新增词条请加入对应档位文件（t4c/t4h/t4s/t6h/t6s/zt/tl），避免与其他档重复。

熟词僻义（考试义置前）请加到 `sense-overrides.js`，并同步在 `examples.js` /
`examples2.js` 补一条真题风格例句。

## 贡献题库

- 阅读：`reading_careful.js`（文章+5 题四选一，需中文解析）/ `reading_matching.js`（9 段 5 匹配）/ `reading_cloze.js`（15 选 10）
- 听力：`listening_cet4.js` / `listening_cet6.js`（逐句原文+译文+3-4 题），并在 `listening_loc.js` 补题目定位句映射
- 写作：`writing_data.js`（题目/范文/可复用句式）；翻译：`translation_data.js`（中文段+参考译文+关键表达）

命题要求：答案分布均匀、干扰项有迷惑性、解析必须说明定位依据与排除理由。

## 提交前自检

1. 语法检查：`node --check 文件名` 或在浏览器控制台确认无报错
2. 数据校验：`python tools/validate.py`
3. E2E：本地起服务后按 `tools/e2e-suite.js` 注入运行全部用例
4. 提交信息使用中文，说明改动内容

## 发布流程（维护者）

1. 更新 `js/util.js` 中的 `App.VERSION`
2. `index.html` 中资源版本号整体 +1
3. 打包 `release/` ZIP（index.html + css/ + js/ + 使用说明.txt）
4. 提交推送后创建 GitHub Release（Tag 用 `v主.次.修订`）
