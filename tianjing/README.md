# 天晶观命

紫微斗数在线排盘网站。输入生辰即可生成命盘、十二宫解读、大限流年、四化飞星等。

## 在线访问

**https://3294098565-cmyk.github.io/gg-/tianjing/**

## 本地运行

```bash
cd ziwei-web
python3 -m http.server 8768
# 打开 http://127.0.0.1:8768
```

如需 GPT 解盘（可选）：

```bash
./start.sh
# 在「AI 解盘」Tab 配置 OpenAI API Key
```

## 部署到 GitHub Pages（让别人也能用）

1. 在 GitHub 新建仓库 `tianjing-guanming`（Public）
2. 推送代码：

```bash
git remote add origin https://github.com/3294098565-cmyk/tianjing-guanming.git
git push -u origin main
```

3. 仓库 **Settings → Pages → Build and deployment → Source** 选 **GitHub Actions**
4. 推送后 Actions 会自动部署，约 1–2 分钟可访问

## 说明

- 公网版：排盘、解读、记录等功能均可正常使用（数据保存在访问者浏览器）
- GPT 深度解盘：需自行本地运行 `server.py` 并配置 API Key（公网静态站因浏览器限制无法直连 OpenAI）

© Wax · 联系作者：Jarad101@outlook.com
