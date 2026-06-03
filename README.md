# 小猪快跑游戏发布说明

这是一个纯静态小游戏，包含 `index.html`、`style.css`、`game.js` 和 `assets/character.png`。

## 本地打开

进入当前目录后启动静态服务：

```bash
python -m http.server 4177
```

浏览器打开：

```text
http://127.0.0.1:4177/
```

## 分享给别人玩

`127.0.0.1` 只能自己电脑访问，别人打不开。要分享给别人，需要发布到公网，推荐使用 GitHub Pages。

### GitHub Pages 发布步骤

1. 在 GitHub 新建一个仓库，例如 `pig-run-game`
2. 上传本目录下的所有文件：
   - `index.html`
   - `style.css`
   - `game.js`
   - `assets/character.png`
3. 进入仓库 `Settings`
4. 找到 `Pages`
5. Source 选择 `Deploy from a branch`
6. Branch 选择 `main`
7. Folder 选择 `/root`
8. 保存后等待 1 到 2 分钟

发布成功后会得到类似这样的链接：

```text
https://你的GitHub用户名.github.io/pig-run-game/
```

把这个链接发给别人，别人就可以直接玩。
