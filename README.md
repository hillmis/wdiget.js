```markdown
# 多功能挂件 (MultiWidget)

一个可拖拽、可自定义的浮动工具组件，支持嵌入多种实用功能（如音乐播放器、视频播放器），并允许添加自定义组件。

---

## 功能特性

- **可拖拽定位**：自由拖动挂件到网页的任何位置。
- **可调整大小**：支持自定义组件尺寸。
- **多组件切换**：内置音乐、视频组件，支持快速切换。
- **自定义组件**：可通过URL添加第三方组件。
- **记忆功能**：自动保存位置、大小和上次使用的组件。
- **最小化/固定**：最小化后不干扰浏览，可固定位置防止意外移动。
- **主题切换**：支持深色/浅色主题。

---

## 快速开始

### 1. 引入脚本

在HTML文件中引入挂件脚本：

```html
<script src="widget.js"></script>
```

### 2. 初始化挂件

```javascript
// 默认初始化
MultiWidget.init();

// 自定义配置初始化
MultiWidget.init({
    defaultWidget: 'music',  // 默认显示组件（'music' 或 'video'）
    minimized: true,         // 初始最小化
    position: {              // 初始位置
        right: '20px',
        bottom: '20px'
    }
});
```

---

## 配置选项

| 参数          | 类型    | 默认值                          | 说明               |
|---------------|---------|---------------------------------|--------------------|
| `defaultWidget` | String  | `'music'`                      | 默认显示的组件ID   |
| `minimized`     | Boolean | `true`                         | 初始是否最小化     |
| `position`      | Object  | `{ right: '20px', bottom: '20px' }` | 挂件初始位置       |

---

## API 方法

| 方法               | 说明                |
|--------------------|---------------------|
| `MultiWidget.show()`          | 显示挂件            |
| `MultiWidget.hide()`          | 隐藏挂件            |
| `MultiWidget.toggleMinimize()`| 切换最小化状态      |
| `MultiWidget.togglePin()`     | 切换固定状态        |
| `MultiWidget.addWidget(name, url, icon)` | 添加自定义组件（返回组件ID） |
| `MultiWidget.switchToWidget(widgetId)`   | 切换到指定组件      |
| `MultiWidget.destroy()`       | 销毁挂件            |

---

## 自定义组件

通过以下代码添加自定义组件：

```javascript
// 示例：添加一个自定义网页组件
const widgetId = MultiWidget.addWidget(
    "网页时钟", 
    "https://example.com/clock", 
    "fas fa-clock"
);
```

---

## 示例演示

HTML 中可通过按钮控制挂件显隐：

```html
<button id="toggleWidget">显示/隐藏挂件</button>
<script>
    const toggleBtn = document.getElementById('toggleWidget');
    let isVisible = true;
    toggleBtn.addEventListener('click', () => {
        if (isVisible) {
            MultiWidget.hide();
        } else {
            MultiWidget.show();
        }
        isVisible = !isVisible;
    });
</script>
```

---

## 注意事项

1. **依赖项**：组件依赖 [Font Awesome](https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css) 图标库，会自动加载。
2. **本地存储**：用户设置和组件信息会保存在 `localStorage` 中。
3. **跨域限制**：自定义组件的URL需允许跨域访问（CORS配置）。

---

## 许可证

本项目遵循 MIT 许可证。
