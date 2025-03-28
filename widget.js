/**
 * 多功能挂件库
 * 一个可拖拽、可自定义的浮动挂件
 * @version 1.0.0
 */
(function (window) {
    'use strict';

    // 挂件实例
    let widgetInstance = null;

    // 挂件类
    class MultiWidget {
        constructor(options = {}) {
            // 合并默认配置和用户配置
            this.config = {
                defaultWidget: 'music',
                position: { right: '20px', bottom: '20px' },
                minimized: true,
                githubUrl: 'https://github.com/hillmis/wdiget.js',
                ...options
            };

            // 初始化状态变量
            this.isDragging = false;
            this.isResizing = false;
            this.isMinimized = this.config.minimized;
            this.isPinned = false;
            this.currentWidget = this.config.defaultWidget;
            this.startX = 0;
            this.startY = 0;
            this.initialX = 0;
            this.initialY = 0;
            this.startWidth = 0;
            this.startHeight = 0;
            this.currentResizeHandle = null;
            this.panelDragStartTime = 0;
            this.isReallyDragging = false;

            // 初始化设置
            this.settings = {
                autoplay: true,
                opacity: 95,
                rememberPos: true,
                rememberSize: true,
                autoHeight: true,
                showResizeHandles: false,
                theme: 'dark',
                githubUrl: 'https://github.com/hillmis/wdiget.js'
            };

            // 组件配置
            this.widgets = {
                music: {
                    url: 'https://music.liu13.fun/',
                    loaded: false,
                    iframe: null,
                    defaultHeight: 300,
                    defaultWidth: 300,
                    isBuiltIn: true,
                    name: '音乐',
                    icon: 'fas fa-music'
                },
                video: {
                    url: 'https://ss.liu13.fun/',
                    loaded: false,
                    iframe: null,
                    defaultHeight: 300,
                    defaultWidth: 400,
                    isBuiltIn: true,
                    name: '视频',
                    icon: 'fas fa-video'
                }
            };

            // 自定义组件存储键
            this.CUSTOM_WIDGETS_KEY = 'customWidgets';

            // 创建DOM
            this.createDOM();

            // 初始化
            this.init();
        }

        // 创建DOM结构
        createDOM() {
            // 加载Font Awesome
            if (!document.querySelector('link[href*="font-awesome"]')) {
                const fontAwesome = document.createElement('link');
                fontAwesome.rel = 'stylesheet';
                fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css';
                document.head.appendChild(fontAwesome);
            }

            // 创建样式
            const style = document.createElement('style');
            style.textContent = `
                /* 面板基础样式 */
                .widget-panel {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    width: 300px;
                    background: rgba(40, 40, 50, 0.95);
                    border-radius: 12px;
                    backdrop-filter: blur(10px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                    z-index: 9999;
                    transition: all 0.3s ease;
                    overflow: hidden;
                    height: auto;
                    max-height: calc(100vh - 40px);
                    display: flex;
                    flex-direction: column;
                    resize: both;
                    --accent-color: #3498db;
                }

                /* 主题变量 */
                .widget-panel[data-theme="dark"] {
                    --bg-color: rgba(40, 40, 50, 0.95);
                    --header-bg: rgba(30, 30, 40, 0.9);
                    --text-color: #fff;
                    --accent-color: #3498db;
                    --border-color: rgba(255, 255, 255, 0.1);
                }

                .widget-panel[data-theme="light"] {
                    --bg-color: rgba(245, 245, 250, 0.95);
                    --header-bg: rgba(230, 230, 235, 0.9);
                    --text-color: #333;
                    --accent-color: #3498db;
                    --border-color: rgba(0, 0, 0, 0.1);
                    background: var(--bg-color);
                }

                /* 最小化状态 */
                .widget-panel.minimized {
                    width: 40px !important;
                    height: 40px !important;
                    border-radius: 8px;
                    cursor: move;
                    resize: none;
                    box-shadow: 0 3px 12px rgba(0, 0, 0, 0.4);
                    background: var(--accent-color);
                    transition: all 0.2s ease;
                }

                .widget-panel.minimized:hover {
                    transform: scale(1.05);
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.5);
                }

                /* 固定状态 */
                .widget-panel.pinned {
                    box-shadow: 0 0 0 2px var(--accent-color);
                }

                .panel-btn.active {
                    color: var(--accent-color);
                    background: rgba(255, 255, 255, 0.1);
                }

                /* 尺寸调整控件 */
                .resize-handle {
                    position: absolute;
                    width: 10px;
                    height: 10px;
                    background: var(--accent-color);
                    border-radius: 50%;
                    z-index: 10000;
                    transition: opacity 0.3s;
                    opacity: 0;
                }

                .widget-panel.show-resize-handles:hover .resize-handle {
                    opacity: 0.7;
                }

                .resize-handle:hover {
                    opacity: 1;
                    transform: scale(1.2);
                }

                .resize-handle-se {
                    bottom: 5px;
                    right: 5px;
                    cursor: nwse-resize;
                }

                .resize-handle-sw {
                    bottom: 5px;
                    left: 5px;
                    cursor: nesw-resize;
                }

                .resize-handle-ne {
                    top: 5px;
                    right: 5px;
                    cursor: nesw-resize;
                }

                .resize-handle-nw {
                    top: 5px;
                    left: 5px;
                    cursor: nwse-resize;
                }

                /* 最小化图标 */
                .minimize-icon {
                    display: none;
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    justify-content: center;
                    align-items: center;
                    color: white;
                    font-size: 20px;
                    cursor: pointer;
                }

                .widget-panel.minimized .minimize-icon {
                    display: flex;
                }

                /* 面板头部 */
                .panel-header {
                    display: flex;
                    align-items: center;
                    padding: 10px 15px;
                    background: var(--header-bg);
                    cursor: move;
                    user-select: none;
                    color: var(--text-color);
                }

                .widget-panel.minimized .panel-header,
                .widget-panel.minimized .widget-nav,
                .widget-panel.minimized .widget-container,
                .widget-panel.minimized .settings-panel,
                .widget-panel.minimized .add-widget-panel {
                    display: none;
                }

                .panel-title {
                    margin: 0;
                    font-size: 14px;
                    font-weight: 500;
                    flex: 1;
                    color: var(--text-color);
                }

                /* 控制按钮 */
                .panel-controls {
                    display: flex;
                    gap: 5px;
                }

                .panel-btn {
                    background: none;
                    border: none;
                    color: var(--text-color);
                    font-size: 12px;
                    cursor: pointer;
                    padding: 5px;
                    border-radius: 4px;
                    transition: 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .panel-btn:hover {
                    background: rgba(255, 255, 255, 0.1);
                }

                /* 组件导航 */
                .widget-nav {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 5px;
                    padding: 10px;
                    border-bottom: 1px solid var(--border-color);
                    background: var(--bg-color);
                }

                .widget-nav.edit-mode .widget-nav-btn {
                    cursor: move;
                    position: relative;
                    padding-right: 25px;
                }

                .widget-nav-btn {
                    background: rgba(255, 255, 255, 0.05);
                    border: none;
                    color: var(--text-color);
                    padding: 6px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                    transition: 0.2s;
                    display: flex;
                    align-items: center;
                    gap: 5px;
                }

                .widget-nav-btn:hover {
                    background: rgba(255, 255, 255, 0.1);
                }

                .widget-nav-btn.active {
                    background: var(--accent-color);
                    color: white;
                }

                .widget-nav-btn .remove-btn {
                    display: none;
                    position: absolute;
                    right: 5px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: rgba(255, 255, 255, 0.7);
                    cursor: pointer;
                }

                .widget-nav.edit-mode .widget-nav-btn .remove-btn {
                    display: block;
                }

                .widget-nav-btn .remove-btn:hover {
                    color: #ff4757;
                }

                /* 组件容器 */
                .widget-container {
                    flex: 1;
                    position: relative;
                    overflow: hidden;
                    background: var(--bg-color);
                    min-height: 100px;
                    transition: height 0.3s;
                }

                .widget-container.expanded {
                    height: 300px;
                }

                .widget-container.auto-height {
                    height: auto;
                }

                .widget-content {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    display: none;
                    background: var(--bg-color);
                }

                .widget-content.active {
                    display: block;
                }

                .widget-frame {
                    width: 100%;
                    height: 100%;
                    position: relative;
                }

                /* 加载指示器 */
                .loading-indicator {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    background: var(--bg-color);
                    color: var(--text-color);
                    gap: 10px;
                    z-index: 1;
                }

                .loading-indicator i {
                    font-size: 24px;
                    color: var(--accent-color);
                }

                .error-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 10px;
                    color: #ff6b6b;
                }

                .error-state i {
                    font-size: 24px;
                    color: #ff6b6b;
                }

                .error-state button {
                    background: var(--accent-color);
                    color: white;
                    border: none;
                    padding: 5px 10px;
                    border-radius: 4px;
                    cursor: pointer;
                }

                /* 设置面板 */
                .settings-panel {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: var(--bg-color);
                    z-index: 100;
                    display: none;
                    flex-direction: column;
                    padding: 15px;
                    box-sizing: border-box;
                    overflow-y: auto;
                }

                .settings-panel.active {
                    display: flex;
                }

                .settings-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 15px;
                    border-bottom: 1px solid var(--border-color);
                    padding-bottom: 8px;
                }

                .settings-header h4 {
                    margin: 0;
                    color: var(--text-color);
                    font-size: 14px;
                    font-weight: 500;
                }

                .settings-close-btn {
                    background: none;
                    border: none;
                    color: var(--text-color);
                    font-size: 16px;
                    cursor: pointer;
                    padding: 5px;
                    border-radius: 4px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: 0.2s;
                }

                .settings-close-btn:hover {
                    background: rgba(255, 255, 255, 0.1);
                    color: var(--accent-color);
                }

                .settings-section {
                    margin-bottom: 15px;
                }

                .settings-section h4 {
                    margin: 0 0 10px 0;
                    color: var(--text-color);
                    font-size: 14px;
                    font-weight: 500;
                    border-bottom: 1px solid var(--border-color);
                    padding-bottom: 5px;
                }

                .settings-item {
                    display: flex;
                    align-items: center;
                    margin-bottom: 10px;
                    color: var(--text-color);
                }

                .settings-item label {
                    flex: 1;
                    font-size: 13px;
                }

                /* GitHub 链接样式 */
                .github-link {
                    display: flex;
                    justify-content: center;
                    margin-top: 15px;
                    padding-top: 15px;
                    border-top: 1px solid var(--border-color);
                    flex-direction: column;
                    align-items: center;
                    gap: 10px;
                }

                .github-link h4 {
                    color: var(--text-color);
                    font-size: 14px;
                    font-weight: 500;
                    margin: 0 0 5px 0;
                    align-self: flex-start;
                }

                .github-btn {
                    background: rgba(255, 255, 255, 0.1);
                    border: none;
                    color: var(--text-color);
                    padding: 8px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 13px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: 0.2s;
                    text-decoration: none;
                }
                
                .github-btn:hover {
                    background: var(--accent-color);
                    color: white;
                }
                
            
                
                .github-actions {
                    display: flex;
                    gap: 10px;
                    justify-content: flex-end;
                }

                /* 添加组件面板 */
                .add-widget-panel {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: var(--bg-color);
                    z-index: 100;
                    display: none;
                    flex-direction: column;
                    padding: 15px;
                    box-sizing: border-box;
                }

                .add-widget-panel.active {
                    display: flex;
                }

                .add-widget-panel h4 {
                    margin: 0 0 15px 0;
                    color: var(--text-color);
                    font-size: 14px;
                    font-weight: 500;
                    border-bottom: 1px solid var(--border-color);
                    padding-bottom: 5px;
                }

                .add-widget-form {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }

                .form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 5px;
                }

                .form-group label {
                    font-size: 13px;
                    color: var(--text-color);
                }

                .form-group input,
                .form-group select {
                    padding: 8px;
                    border-radius: 4px;
                    border: 1px solid var(--border-color);
                    background: rgba(255, 255, 255, 0.05);
                    color: var(--text-color);
                }

                .form-actions {
                    display: flex;
                    gap: 10px;
                    margin-top: 10px;
                    justify-content: flex-end;
                }

                .btn {
                    padding: 8px 12px;
                    border-radius: 4px;
                    border: none;
                    cursor: pointer;
                    font-size: 13px;
                    transition: 0.2s;
                }

                .btn-primary {
                    background: var(--accent-color);
                    color: white;
                }

                .btn-secondary {
                    background: rgba(255, 255, 255, 0.1);
                    color: var(--text-color);
                }

                .btn:hover {
                    opacity: 0.9;
                }

                .error-message {
                    color: #ff6b6b;
                    font-size: 12px;
                    margin-top: 5px;
                    display: none;
                }
            `;
            document.head.appendChild(style);

            // 创建挂件面板
            const panel = document.createElement('div');
            panel.className = 'widget-panel';
            panel.id = 'widgetPanel';
            panel.dataset.theme = this.settings.theme;
            panel.innerHTML = `
                <!-- 最小化时显示的图标 -->
                <div class="minimize-icon">
                    <i class="fas fa-th-large"></i>
                </div>

                <!-- 面板头部 -->
                <div class="panel-header" id="panelHeader">
                    <h3 class="panel-title">多功能挂件</h3>
                    <div class="panel-controls">
                        <button class="panel-btn" id="btnManageWidgets" title="管理组件">
                            <i class="fas fa-tasks"></i>
                        </button>
                        <button class="panel-btn" id="btnAddWidget" title="添加">
                            <i class="fas fa-plus"></i>
                        </button>
                        <button class="panel-btn" id="btnRefresh" title="刷新">
                            <i class="fas fa-sync-alt"></i>
                        </button>
                        <button class="panel-btn" id="btnSettings" title="设置">
                            <i class="fas fa-cog"></i>
                        </button>
                        <button class="panel-btn" id="btnPin" title="固定">
                            <i class="fas fa-thumbtack"></i>
                        </button>
                        <button class="panel-btn" id="btnMinimize" title="最小化">
                            <i class="fas fa-minus"></i>
                        </button>
                    </div>
                </div>

                <!-- 尺寸调整手柄 -->
                <div class="resize-handle resize-handle-se" id="resizeHandleSE"></div>
                <div class="resize-handle resize-handle-sw" id="resizeHandleSW"></div>
                <div class="resize-handle resize-handle-ne" id="resizeHandleNE"></div>
                <div class="resize-handle resize-handle-nw" id="resizeHandleNW"></div>

                <!-- 设置面板 -->
                <div class="settings-panel" id="settingsPanel">
                    <div class="settings-header">
                        <h4>设置</h4>
                        <button class="settings-close-btn" id="settingsCloseBtn" title="关闭">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="settings-section">
                        <h4>基本设置</h4>
                        <div class="settings-item">
                            <label>透明度</label>
                            <input type="range" id="settingOpacity" min="50" max="100" value="95">
                        </div>
                        <div class="settings-item">
                            <label>主题</label>
                            <select id="settingTheme">
                                <option value="dark">深色</option>
                                <option value="light">浅色</option>
                                <option value="auto">跟随系统</option>
                            </select>
                        </div>
                    </div>
                    <div class="settings-section">
                        <h4>行为设置</h4>
                        <div class="settings-item">
                            <label>自动播放</label>
                            <input type="checkbox" id="settingAutoplay" checked>
                        </div>
                        <div class="settings-item">
                            <label>记住位置</label>
                            <input type="checkbox" id="settingRememberPos" checked>
                        </div>
                        <div class="settings-item">
                            <label>记住尺寸</label>
                            <input type="checkbox" id="settingRememberSize" checked>
                        </div>
                        <div class="settings-item">
                            <label>自动高度</label>
                            <input type="checkbox" id="settingAutoHeight" checked>
                        </div>
                        <div class="settings-item">
                            <label>显示尺寸调整手柄</label>
                            <input type="checkbox" id="settingShowResizeHandles">
                        </div>
                    </div>
                    <!-- GitHub 链接部分 -->
                    <div class="github-link">
                        <h4>关于项目</h4>
                        <a id="githubLinkBtn" class="github-btn" href="#" target="_blank">
                            <i class="fab fa-github"></i> GitHub
                        </a>
                    </div>
                </div>

                <!-- 添加组件面板 -->
                <div class="add-widget-panel" id="addWidgetPanel">
                    <div class="settings-header">
                        <h4></h4>
                        <button class="settings-close-btn" id="addWidgetCloseBtn" title="关闭">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="add-widget-form">
                        <div class="form-group">
                            <label>组件名称</label>
                            <input type="text" id="widgetName" placeholder="输入组件名称">
                        </div>
                        <div class="form-group">
                            <label>图标</label>
                            <select id="widgetIcon">
                                <option value="fas fa-globe">🌐 网页</option>
                                <option value="fas fa-video">🎬 视频</option>
                                <option value="fas fa-music">🎵 音乐</option>
                                <option value="fas fa-chart-bar">📊 图表</option>
                                <option value="fas fa-calendar">📅 日历</option>
                                <option value="fas fa-sticky-note">📝 笔记</option>
                                <option value="fas fa-clock">⏰ 时钟</option>
                                <option value="fas fa-calculator">🧮 计算器</option>
                                <option value="fas fa-map-marker-alt">📍 地图</option>
                                <option value="fas fa-rss">📰 资讯</option>
                                <option value="fas fa-cog">⚙️ 工具</option>
                                <option value="fas fa-gamepad">🎮 游戏</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>URL地址</label>
                            <input type="text" id="widgetUrl" placeholder="输入网页URL">
                        </div>
                        <div class="error-message" id="addWidgetError"></div>
                        <div class="form-actions">
                            <button class="btn btn-secondary" id="cancelAddBtn">取消</button>
                            <button class="btn btn-primary" id="saveWidgetBtn">保存</button>
                        </div>
                    </div>
                </div>

                <!-- 组件导航 -->
                <div class="widget-nav"></div>

                <!-- 组件容器 -->
                <div class="widget-container expanded">
                    <div class="widget-content active" id="musicWidget">
                        <div class="widget-frame">
                            <div class="loading-indicator">
                                <i class="fas fa-spinner fa-spin"></i>
                                <span>加载中...</span>
                            </div>
                        </div>
                    </div>
                    <div class="widget-content" id="videoWidget">
                        <div class="widget-frame">
                            <div class="loading-indicator">
                                <i class="fas fa-spinner fa-spin"></i>
                                <span>加载中...</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(panel);
            this.widgetPanel = panel;
        }

        // 初始化
        init() {
            // 从本地存储加载设置
            this.loadSettings();

            // 默认最小化状态
            this.isMinimized = true;
            this.widgetPanel.classList.add('minimized');

            // 默认位置 - 在屏幕右下角
            if (!localStorage.getItem('widgetPosition')) {
                // 计算默认位置 - 屏幕右下角
                const defaultX = window.innerWidth - 70;
                const defaultY = window.innerHeight - 70;
                this.widgetPanel.style.left = `${defaultX}px`;
                this.widgetPanel.style.top = `${defaultY}px`;

                if (this.settings.rememberPos) {
                    localStorage.setItem('widgetPosition', JSON.stringify({
                        x: defaultX,
                        y: defaultY
                    }));
                }
            }

            // 初始化基本功能
            this.initDrag();
            this.initResize();
            this.initControls();
            this.initAddWidgetUI();
            this.initSettings();

            // 加载自定义组件和创建导航
            this.loadCustomWidgetsFromStorage();

            // 确保组件容器存在且expanded
            const container = this.widgetPanel.querySelector('.widget-container');
            if (container && !container.classList.contains('expanded')) {
                container.classList.add('expanded');
            }

            // 加载最后使用的组件
            this.loadLastUsedWidget();

            // 确保默认组件可见
            this.switchWidget(this.currentWidget);

            // 为最小化图标添加点击事件
            this.widgetPanel.querySelector('.minimize-icon').addEventListener('click', (e) => {
                // 如果正在拖拽，不触发展开
                if (this.isDragging) return;

                // 从最小化状态恢复
                this.widgetPanel.classList.remove('minimized');
                this.isMinimized = false;

                // 移除最小化状态存储
                localStorage.removeItem('widgetMinimized');

                // 获取面板的尺寸信息（如果被记住了）
                let panelWidth = 300; // 默认展开宽度
                let panelHeight = 400; // 估计的展开高度

                if (this.settings.rememberSize) {
                    const savedSize = localStorage.getItem('widgetSize');
                    if (savedSize) {
                        const size = JSON.parse(savedSize);
                        panelWidth = size.width;
                        panelHeight = size.height;
                    }
                }

                // 调用贴近最近边缘的功能
                this.snapToNearestEdge(this.widgetPanel, panelWidth, panelHeight);

                // 阻止事件冒泡
                e.stopPropagation();
            });

            // 如果处于管理模式，初始化排序功能
            const navContainer = this.widgetPanel.querySelector('.widget-nav');
            if (navContainer.classList.contains('edit-mode')) {
                this.initWidgetSorting();
            }

            // 监听窗口大小变化事件，调整面板位置
            window.addEventListener('resize', () => {
                // 如果面板未最小化且非固定状态，重新贴近最近边缘
                if (!this.isMinimized && !this.isPinned) {
                    let panelWidth = this.widgetPanel.offsetWidth;
                    let panelHeight = this.widgetPanel.offsetHeight;
                    this.snapToNearestEdge(this.widgetPanel, panelWidth, panelHeight);
                }
            });

            // 监听来自iframe的消息
            window.addEventListener('message', (event) => {
                try {
                    const data = event.data;
                    if (data && data.type === 'resize') {
                        // 接收到iframe内容的尺寸信息
                        if (this.settings.autoHeight && !this.isResizing) {
                            if (data.height) {
                                const container = this.widgetPanel.querySelector('.widget-container');
                                container.classList.add('auto-height');
                                container.style.height = `${data.height}px`;
                            }

                            if (data.width && data.width > 300) {
                                this.widgetPanel.style.width = `${data.width}px`;
                            }

                            // 存储对应组件的默认尺寸
                            if (this.widgets[this.currentWidget]) {
                                this.widgets[this.currentWidget].defaultHeight = data.height || this.widgets[this.currentWidget].defaultHeight;
                                this.widgets[this.currentWidget].defaultWidth = data.width || this.widgets[this.currentWidget].defaultWidth;
                            }
                        }
                    }
                } catch (error) {
                    console.error('处理iframe消息出错:', error);
                }
            });
        }

        // 从localStorage加载自定义组件
        loadCustomWidgetsFromStorage() {
            const savedWidgets = localStorage.getItem(this.CUSTOM_WIDGETS_KEY);
            if (savedWidgets) {
                try {
                    const customWidgets = JSON.parse(savedWidgets);
                    // 将自定义组件添加到widgets对象
                    customWidgets.forEach(widget => {
                        this.widgets[widget.id] = {
                            url: widget.url,
                            loaded: false,
                            iframe: null,
                            defaultHeight: widget.defaultHeight || 300,
                            defaultWidth: widget.defaultWidth || 400,
                            name: widget.name,
                            icon: widget.icon,
                            isBuiltIn: false
                        };
                    });
                } catch (error) {
                    console.error('解析自定义组件数据失败:', error);
                }
            }
            // 创建组件导航按钮
            this.createWidgetNavButtons();
        }

        // 创建组件导航按钮
        createWidgetNavButtons() {
            const navContainer = this.widgetPanel.querySelector('.widget-nav');
            navContainer.innerHTML = '';

            // 按照自定义顺序排序组件
            const widgetOrder = this.getWidgetOrder();
            const sortedWidgetIds = Object.keys(this.widgets).sort((a, b) => {
                const indexA = widgetOrder.indexOf(a);
                const indexB = widgetOrder.indexOf(b);
                if (indexA === -1) return 1;
                if (indexB === -1) return -1;
                return indexA - indexB;
            });

            // 创建导航按钮
            sortedWidgetIds.forEach(widgetId => {
                const widget = this.widgets[widgetId];
                const btn = document.createElement('button');
                btn.className = 'widget-nav-btn';
                btn.dataset.widget = widgetId;
                if (widgetId === this.currentWidget) {
                    btn.classList.add('active');
                }

                btn.innerHTML = `
                    <i class="${widget.icon}"></i> ${widget.name}
                    ${!widget.isBuiltIn ? '<span class="remove-btn"><i class="fas fa-times"></i></span>' : ''}
                `;

                // 点击切换组件
                btn.addEventListener('click', (e) => {
                    if (navContainer.classList.contains('edit-mode') && !e.target.closest('.remove-btn')) {
                        return; // 编辑模式下不切换组件
                    }

                    // 如果点击的是删除按钮
                    if (e.target.closest('.remove-btn')) {
                        this.removeWidget(widgetId);
                        return;
                    }

                    this.switchWidget(widgetId);
                });

                navContainer.appendChild(btn);
            });

            // 创建组件内容容器
            this.createWidgetContainers();
        }

        // 获取组件顺序
        getWidgetOrder() {
            const savedOrder = localStorage.getItem('widgetOrder');
            if (savedOrder) {
                try {
                    return JSON.parse(savedOrder);
                } catch (e) {
                    console.error('解析组件顺序失败:', e);
                }
            }
            // 默认顺序：内置组件在前，自定义组件在后
            return Object.keys(this.widgets).sort((a, b) => {
                if (this.widgets[a].isBuiltIn && !this.widgets[b].isBuiltIn) return -1;
                if (!this.widgets[a].isBuiltIn && this.widgets[b].isBuiltIn) return 1;
                return 0;
            });
        }

        // 创建组件内容容器
        createWidgetContainers() {
            const container = this.widgetPanel.querySelector('.widget-container');

            // 保留已有的内置组件容器
            const existingContainers = {};
            container.querySelectorAll('.widget-content').forEach(el => {
                existingContainers[el.id.replace('Widget', '')] = el;
            });

            // 清空容器
            container.innerHTML = '';

            // 重新添加所有组件容器
            for (const widgetId in this.widgets) {
                let contentEl;

                // 如果已存在，则重用
                if (existingContainers[widgetId]) {
                    contentEl = existingContainers[widgetId];
                } else {
                    // 否则创建新的
                    contentEl = document.createElement('div');
                    contentEl.className = 'widget-content';
                    contentEl.id = `${widgetId}Widget`;
                    contentEl.innerHTML = `
                        <div class="widget-frame">
                            <div class="loading-indicator">
                                <i class="fas fa-spinner fa-spin"></i>
                                <span>加载中...</span>
                            </div>
                        </div>
                    `;
                }

                // 设置当前活动组件
                if (widgetId === this.currentWidget) {
                    contentEl.classList.add('active');
                } else {
                    contentEl.classList.remove('active');
                }

                container.appendChild(contentEl);
            }
        }

        // 切换组件
        switchWidget(widgetId) {
            if (!this.widgets[widgetId]) return;

            // 更新当前组件
            this.currentWidget = widgetId;
            localStorage.setItem('lastWidget', widgetId);

            // 更新导航按钮状态
            const navBtns = this.widgetPanel.querySelectorAll('.widget-nav-btn');
            navBtns.forEach(btn => {
                if (btn.dataset.widget === widgetId) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });

            // 更新内容显示
            const contentEls = this.widgetPanel.querySelectorAll('.widget-content');
            contentEls.forEach(el => {
                if (el.id === `${widgetId}Widget`) {
                    el.classList.add('active');
                    // 如果组件未加载，加载它
                    if (!this.widgets[widgetId].loaded) {
                        this.loadWidget(widgetId);
                    }
                } else {
                    el.classList.remove('active');
                }
            });

            // 调整容器高度
            this.adjustContainerHeight(widgetId);
        }

        // 加载组件
        loadWidget(widgetId) {
            const widget = this.widgets[widgetId];
            if (!widget || widget.loaded) return;

            const contentEl = this.widgetPanel.querySelector(`#${widgetId}Widget`);
            if (!contentEl) return;

            const frameContainer = contentEl.querySelector('.widget-frame');
            const loadingIndicator = contentEl.querySelector('.loading-indicator');

            // 创建iframe
            const iframe = document.createElement('iframe');
            iframe.style.width = '100%';
            iframe.style.height = '100%';
            iframe.style.border = 'none';
            iframe.style.display = 'block';
            iframe.style.backgroundColor = 'transparent';
            iframe.allowFullscreen = true;

            // 添加加载事件
            iframe.addEventListener('load', () => {
                loadingIndicator.style.display = 'none';
                widget.loaded = true;

                // 尝试调整高度
                this.adjustContainerHeight(widgetId);
            });

            // 添加错误处理
            iframe.addEventListener('error', () => {
                loadingIndicator.innerHTML = `
                    <div class="error-state">
                        <i class="fas fa-exclamation-circle"></i>
                        <span>加载失败</span>
                        <button id="retryBtn-${widgetId}">重试</button>
                    </div>
                `;

                // 添加重试按钮事件
                const retryBtn = loadingIndicator.querySelector(`#retryBtn-${widgetId}`);
                if (retryBtn) {
                    retryBtn.addEventListener('click', () => {
                        loadingIndicator.innerHTML = `
                            <i class="fas fa-spinner fa-spin"></i>
                            <span>加载中...</span>
                        `;
                        iframe.src = widget.url;
                    });
                }
            });

            // 设置iframe源
            iframe.src = widget.url;

            // 保存iframe引用
            widget.iframe = iframe;

            // 添加到DOM
            frameContainer.appendChild(iframe);
        }

        // 调整容器高度
        adjustContainerHeight(widgetId) {
            if (!this.settings.autoHeight) return;

            const widget = this.widgets[widgetId];
            if (!widget) return;

            const container = this.widgetPanel.querySelector('.widget-container');
            if (!container) return;

            // 设置为自动高度
            container.classList.add('auto-height');

            // 使用组件的默认高度
            if (widget.defaultHeight) {
                container.style.height = `${widget.defaultHeight}px`;
            }

            // 调整面板宽度
            if (widget.defaultWidth && widget.defaultWidth > 300) {
                this.widgetPanel.style.width = `${widget.defaultWidth}px`;
            }
        }

        // 移除组件
        removeWidget(widgetId) {
            const widget = this.widgets[widgetId];
            if (!widget || widget.isBuiltIn) return;

            // 确认删除
            if (!confirm(`确定要删除组件 "${widget.name}" 吗？`)) {
                return;
            }

            // 如果当前正在显示该组件，切换到默认组件
            if (this.currentWidget === widgetId) {
                this.switchWidget('music');
            }

            // 从对象中删除
            delete this.widgets[widgetId];

            // 更新存储
            this.saveCustomWidgetsToStorage();

            // 重新创建导航
            this.createWidgetNavButtons();
        }

        // 保存自定义组件到存储
        saveCustomWidgetsToStorage() {
            const customWidgets = [];

            // 收集所有自定义组件
            for (const widgetId in this.widgets) {
                const widget = this.widgets[widgetId];
                if (!widget.isBuiltIn) {
                    customWidgets.push({
                        id: widgetId,
                        name: widget.name,
                        url: widget.url,
                        icon: widget.icon,
                        defaultHeight: widget.defaultHeight,
                        defaultWidth: widget.defaultWidth
                    });
                }
            }

            // 保存到localStorage
            localStorage.setItem(this.CUSTOM_WIDGETS_KEY, JSON.stringify(customWidgets));
        }

        // 加载最后使用的组件
        loadLastUsedWidget() {
            const lastWidget = localStorage.getItem('lastWidget');
            if (lastWidget && this.widgets[lastWidget]) {
                this.currentWidget = lastWidget;
            }
        }

        // 初始化拖拽功能
        initDrag() {
            const panel = this.widgetPanel;
            const header = panel.querySelector('#panelHeader');
            const minimizeIcon = panel.querySelector('.minimize-icon');

            // 面板头部拖拽
            header.addEventListener('mousedown', (e) => {
                // 如果点击的是控制按钮，不触发拖拽
                if (e.target.closest('.panel-btn')) return;

                this.startDrag(e);
            });

            // 最小化状态下的拖拽
            minimizeIcon.addEventListener('mousedown', (e) => {
                this.startDrag(e);
            });

            // 鼠标移动和释放事件
            document.addEventListener('mousemove', (e) => {
                this.onDrag(e);
            });

            document.addEventListener('mouseup', () => {
                this.stopDrag();
            });

            // 触摸事件支持
            header.addEventListener('touchstart', (e) => {
                if (e.target.closest('.panel-btn')) return;
                this.startDrag(e.touches[0]);
            }, { passive: true });

            minimizeIcon.addEventListener('touchstart', (e) => {
                this.startDrag(e.touches[0]);
            }, { passive: true });

            document.addEventListener('touchmove', (e) => {
                this.onDrag(e.touches[0]);
            }, { passive: false });

            document.addEventListener('touchend', () => {
                this.stopDrag();
            });
        }

        // 开始拖拽
        startDrag(e) {
            if (this.isPinned) return;

            this.isDragging = true;
            this.panelDragStartTime = Date.now();
            this.isReallyDragging = false;

            // 记录初始位置
            this.startX = e.clientX;
            this.startY = e.clientY;

            // 获取面板当前位置
            const rect = this.widgetPanel.getBoundingClientRect();
            this.initialX = rect.left;
            this.initialY = rect.top;

            // 添加拖拽中的样式
            this.widgetPanel.style.transition = 'none';
            this.widgetPanel.classList.add('dragging');
        }

        // 拖拽中
        onDrag(e) {
            if (!this.isDragging) return;

            // 计算移动距离
            const dx = e.clientX - this.startX;
            const dy = e.clientY - this.startY;

            // 如果移动距离太小，可能只是点击，不是真正的拖拽
            if (!this.isReallyDragging && Math.abs(dx) + Math.abs(dy) > 5) {
                this.isReallyDragging = true;
            }

            // 更新面板位置
            const newX = this.initialX + dx;
            const newY = this.initialY + dy;

            this.widgetPanel.style.left = `${newX}px`;
            this.widgetPanel.style.top = `${newY}px`;

            // 防止面板被拖出视口
            this.keepInViewport();
        }

        // 停止拖拽
        stopDrag() {
            if (!this.isDragging) return;

            // 如果是真正的拖拽（不是点击），且需要记住位置
            if (this.isReallyDragging && this.settings.rememberPos) {
                const rect = this.widgetPanel.getBoundingClientRect();
                localStorage.setItem('widgetPosition', JSON.stringify({
                    x: rect.left,
                    y: rect.top
                }));
            }

            // 如果不是真正的拖拽，且时间很短，可能是点击
            const dragDuration = Date.now() - this.panelDragStartTime;
            if (!this.isReallyDragging && dragDuration < 200 && this.isMinimized) {
                // 从最小化状态恢复
                this.widgetPanel.classList.remove('minimized');
                this.isMinimized = false;
                localStorage.removeItem('widgetMinimized');

                // 调整位置，避免超出视口
                const panelWidth = this.widgetPanel.offsetWidth;
                const panelHeight = this.widgetPanel.offsetHeight;
                this.snapToNearestEdge(this.widgetPanel, panelWidth, panelHeight);
            }

            // 恢复过渡效果
            this.widgetPanel.style.transition = '';
            this.widgetPanel.classList.remove('dragging');

            // 重置拖拽状态
            this.isDragging = false;
            this.isReallyDragging = false;
        }

        // 确保面板在视口内
        keepInViewport() {
            const rect = this.widgetPanel.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            // 计算新位置，确保面板至少有一部分在视口内
            let newX = rect.left;
            let newY = rect.top;

            // 左边界检查
            if (rect.right < 40) {
                newX = 40 - rect.width;
            }

            // 右边界检查
            if (rect.left > viewportWidth - 40) {
                newX = viewportWidth - 40;
            }

            // 上边界检查
            if (rect.bottom < 40) {
                newY = 40 - rect.height;
            }

            // 下边界检查
            if (rect.top > viewportHeight - 40) {
                newY = viewportHeight - 40;
            }

            // 应用新位置
            if (newX !== rect.left || newY !== rect.top) {
                this.widgetPanel.style.left = `${newX}px`;
                this.widgetPanel.style.top = `${newY}px`;
            }
        }

        // 贴近最近的边缘
        snapToNearestEdge(element, width, height) {
            const rect = element.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            // 计算到各边缘的距离
            const distToLeft = rect.left;
            const distToRight = viewportWidth - rect.right;
            const distToTop = rect.top;
            const distToBottom = viewportHeight - rect.bottom;

            // 找出最近的边缘
            const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);

            // 根据最近的边缘调整位置
            if (minDist === distToLeft) {
                // 贴左边
                element.style.left = '20px';
            } else if (minDist === distToRight) {
                // 贴右边
                element.style.left = `${viewportWidth - width - 20}px`;
            } else if (minDist === distToTop) {
                // 贴顶部
                element.style.top = '20px';
            } else {
                // 贴底部
                element.style.top = `${viewportHeight - height - 20}px`;
            }

            // 确保不超出视口
            this.keepInViewport();
        }

        // 初始化调整大小功能
        initResize() {
            const handles = {
                se: this.widgetPanel.querySelector('#resizeHandleSE'),
                sw: this.widgetPanel.querySelector('#resizeHandleSW'),
                ne: this.widgetPanel.querySelector('#resizeHandleNE'),
                nw: this.widgetPanel.querySelector('#resizeHandleNW')
            };

            // 为每个调整手柄添加事件
            for (const direction in handles) {
                const handle = handles[direction];

                // 鼠标事件
                handle.addEventListener('mousedown', (e) => {
                    this.startResize(e, direction);
                });

                // 触摸事件
                handle.addEventListener('touchstart', (e) => {
                    this.startResize(e.touches[0], direction);
                }, { passive: true });
            }

            // 全局鼠标移动和释放事件
            document.addEventListener('mousemove', (e) => {
                this.onResize(e);
            });

            document.addEventListener('mouseup', () => {
                this.stopResize();
            });

            // 全局触摸移动和结束事件
            document.addEventListener('touchmove', (e) => {
                if (this.isResizing) {
                    e.preventDefault();
                    this.onResize(e.touches[0]);
                }
            }, { passive: false });

            document.addEventListener('touchend', () => {
                this.stopResize();
            });
        }

        // 开始调整大小
        startResize(e, direction) {
            if (this.isMinimized || this.isPinned) return;

            this.isResizing = true;
            this.currentResizeHandle = direction;

            // 记录初始位置和尺寸
            this.startX = e.clientX;
            this.startY = e.clientY;

            const rect = this.widgetPanel.getBoundingClientRect();
            this.initialX = rect.left;
            this.initialY = rect.top;
            this.startWidth = rect.width;
            this.startHeight = rect.height;

            // 添加调整中的样式
            this.widgetPanel.style.transition = 'none';
            this.widgetPanel.classList.add('resizing');

            // 禁用自动高度调整
            const container = this.widgetPanel.querySelector('.widget-container');
            container.classList.remove('auto-height');

            // 阻止事件冒泡和默认行为
            e.stopPropagation();
            e.preventDefault();
        }

        // 调整大小中
        onResize(e) {
            if (!this.isResizing) return;

            // 计算移动距离
            const dx = e.clientX - this.startX;
            const dy = e.clientY - this.startY;

            // 根据当前调整手柄计算新尺寸和位置
            let newWidth, newHeight, newX, newY;

            switch (this.currentResizeHandle) {
                case 'se': // 右下
                    newWidth = this.startWidth + dx;
                    newHeight = this.startHeight + dy;
                    newX = this.initialX;
                    newY = this.initialY;
                    break;
                case 'sw': // 左下
                    newWidth = this.startWidth - dx;
                    newHeight = this.startHeight + dy;
                    newX = this.initialX + dx;
                    newY = this.initialY;
                    break;
                case 'ne': // 右上
                    newWidth = this.startWidth + dx;
                    newHeight = this.startHeight - dy;
                    newX = this.initialX;
                    newY = this.initialY + dy;
                    break;
                case 'nw': // 左上
                    newWidth = this.startWidth - dx;
                    newHeight = this.startHeight - dy;
                    newX = this.initialX + dx;
                    newY = this.initialY + dy;
                    break;
            }

            // 应用最小尺寸限制
            newWidth = Math.max(newWidth, 200);
            newHeight = Math.max(newHeight, 150);

            // 更新面板尺寸和位置
            this.widgetPanel.style.width = `${newWidth}px`;
            this.widgetPanel.style.height = `${newHeight}px`;
            this.widgetPanel.style.left = `${newX}px`;
            this.widgetPanel.style.top = `${newY}px`;

            // 更新容器高度
            const container = this.widgetPanel.querySelector('.widget-container');
            const headerHeight = this.widgetPanel.querySelector('.panel-header').offsetHeight;
            const navHeight = this.widgetPanel.querySelector('.widget-nav').offsetHeight;
            container.style.height = `${newHeight - headerHeight - navHeight}px`;
        }

        // 停止调整大小
        stopResize() {
            if (!this.isResizing) return;

            // 如果需要记住尺寸
            if (this.settings.rememberSize) {
                const rect = this.widgetPanel.getBoundingClientRect();
                localStorage.setItem('widgetSize', JSON.stringify({
                    width: rect.width,
                    height: rect.height
                }));

                // 更新当前组件的默认尺寸
                if (this.widgets[this.currentWidget]) {
                    this.widgets[this.currentWidget].defaultWidth = rect.width;
                    this.widgets[this.currentWidget].defaultHeight = rect.height -
                        this.widgetPanel.querySelector('.panel-header').offsetHeight -
                        this.widgetPanel.querySelector('.widget-nav').offsetHeight;
                }
            }

            // 恢复过渡效果
            this.widgetPanel.style.transition = '';
            this.widgetPanel.classList.remove('resizing');

            // 重置调整状态
            this.isResizing = false;
            this.currentResizeHandle = null;
        }

        // 初始化控制按钮
        initControls() {
            // 最小化按钮
            const btnMinimize = this.widgetPanel.querySelector('#btnMinimize');
            btnMinimize.addEventListener('click', () => {
                this.widgetPanel.classList.add('minimized');
                this.isMinimized = true;
                localStorage.setItem('widgetMinimized', 'true');
            });

            // 固定按钮
            const btnPin = this.widgetPanel.querySelector('#btnPin');
            btnPin.addEventListener('click', () => {
                this.isPinned = !this.isPinned;
                if (this.isPinned) {
                    this.widgetPanel.classList.add('pinned');
                    btnPin.classList.add('active');
                    localStorage.setItem('widgetPinned', 'true');
                } else {
                    this.widgetPanel.classList.remove('pinned');
                    btnPin.classList.remove('active');
                    localStorage.removeItem('widgetPinned');
                }
            });

            // 设置按钮
            const btnSettings = this.widgetPanel.querySelector('#btnSettings');
            const settingsPanel = this.widgetPanel.querySelector('#settingsPanel');
            btnSettings.addEventListener('click', () => {
                const isActive = settingsPanel.classList.contains('active');

                // 隐藏所有面板
                this.hideAllPanels();

                // 切换设置面板
                if (!isActive) {
                    settingsPanel.classList.add('active');
                    btnSettings.classList.add('active');
                } else {
                    btnSettings.classList.remove('active');
                }
            });

            // 设置面板关闭按钮
            const settingsCloseBtn = this.widgetPanel.querySelector('#settingsCloseBtn');
            settingsCloseBtn.addEventListener('click', () => {
                settingsPanel.classList.remove('active');
                btnSettings.classList.remove('active');
            });

            // 刷新按钮
            const btnRefresh = this.widgetPanel.querySelector('#btnRefresh');
            btnRefresh.addEventListener('click', () => {
                // 重新加载当前组件
                const widget = this.widgets[this.currentWidget];
                if (widget && widget.iframe) {
                    widget.iframe.src = widget.url;
                }
            });

            // 添加组件按钮
            const btnAddWidget = this.widgetPanel.querySelector('#btnAddWidget');
            const addWidgetPanel = this.widgetPanel.querySelector('#addWidgetPanel');
            btnAddWidget.addEventListener('click', () => {
                const isActive = addWidgetPanel.classList.contains('active');

                // 隐藏所有面板
                this.hideAllPanels();

                // 切换添加组件面板
                if (!isActive) {
                    addWidgetPanel.classList.add('active');
                    btnAddWidget.classList.add('active');
                } else {
                    btnAddWidget.classList.remove('active');
                }
            });

            // 管理组件按钮
            const btnManageWidgets = this.widgetPanel.querySelector('#btnManageWidgets');
            btnManageWidgets.addEventListener('click', () => {
                const navContainer = this.widgetPanel.querySelector('.widget-nav');
                const isEditMode = navContainer.classList.contains('edit-mode');

                if (!isEditMode) {
                    navContainer.classList.add('edit-mode');
                    btnManageWidgets.classList.add('active');
                    this.initWidgetSorting();
                } else {
                    navContainer.classList.remove('edit-mode');
                    btnManageWidgets.classList.remove('active');
                }
            });
        }

        // 隐藏所有面板
        hideAllPanels() {
            const panels = this.widgetPanel.querySelectorAll('.settings-panel, .add-widget-panel');
            panels.forEach(panel => {
                panel.classList.remove('active');
            });

            // 移除所有活动按钮状态
            const buttons = this.widgetPanel.querySelectorAll('.panel-btn');
            buttons.forEach(btn => {
                if (btn.id !== 'btnPin' || !this.isPinned) {
                    btn.classList.remove('active');
                }
            });
        }

        // 初始化添加组件UI
        initAddWidgetUI() {
            const addWidgetPanel = this.widgetPanel.querySelector('#addWidgetPanel');
            const saveBtn = addWidgetPanel.querySelector('#saveWidgetBtn');
            const cancelBtn = addWidgetPanel.querySelector('#cancelAddBtn');
            const errorMsg = addWidgetPanel.querySelector('#addWidgetError');
            const btnAddWidget = this.widgetPanel.querySelector('#btnAddWidget');

            // 辅助函数 - 重置表单并关闭面板
            const resetFormAndClosePanel = () => {
                // 隐藏面板
                this.hideAllPanels();
                btnAddWidget.classList.remove('active');

                // 重置表单
                addWidgetPanel.querySelector('#widgetName').value = '';
                addWidgetPanel.querySelector('#widgetUrl').value = '';
                errorMsg.style.display = 'none';
            };

            // 保存按钮
            saveBtn.addEventListener('click', () => {
                const nameInput = addWidgetPanel.querySelector('#widgetName');
                const urlInput = addWidgetPanel.querySelector('#widgetUrl');
                const iconSelect = addWidgetPanel.querySelector('#widgetIcon');

                const name = nameInput.value.trim();
                const url = urlInput.value.trim();
                const icon = iconSelect.value;

                // 验证输入
                if (!name) {
                    errorMsg.textContent = '请输入组件名称';
                    errorMsg.style.display = 'block';
                    return;
                }

                if (!url) {
                    errorMsg.textContent = '请输入URL地址';
                    errorMsg.style.display = 'block';
                    return;
                }

                // 验证URL格式
                try {
                    new URL(url);
                } catch (e) {
                    errorMsg.textContent = 'URL格式不正确';
                    errorMsg.style.display = 'block';
                    return;
                }

                // 生成唯一ID
                const id = 'custom_' + Date.now();

                // 添加新组件
                this.widgets[id] = {
                    url: url,
                    loaded: false,
                    iframe: null,
                    defaultHeight: 300,
                    defaultWidth: 400,
                    name: name,
                    icon: icon,
                    isBuiltIn: false
                };

                // 保存到存储
                this.saveCustomWidgetsToStorage();

                // 重新创建导航
                this.createWidgetNavButtons();

                // 切换到新组件
                this.switchWidget(id);

                // 重置表单并关闭面板
                resetFormAndClosePanel();
            });

            // 取消按钮
            cancelBtn.addEventListener('click', resetFormAndClosePanel);

            // 将关闭按钮也连接到重置函数
            const addWidgetCloseBtn = this.widgetPanel.querySelector('#addWidgetCloseBtn');
            addWidgetCloseBtn.addEventListener('click', resetFormAndClosePanel);
        }

        // 初始化组件排序功能
        initWidgetSorting() {
            const navContainer = this.widgetPanel.querySelector('.widget-nav');
            const buttons = navContainer.querySelectorAll('.widget-nav-btn');

            let draggedBtn = null;
            let placeholder = null;
            let initialIndex = -1;

            // 为每个按钮添加拖拽事件
            buttons.forEach((btn, index) => {
                btn.draggable = true;

                btn.addEventListener('dragstart', (e) => {
                    draggedBtn = btn;
                    initialIndex = index;

                    // 创建占位元素
                    placeholder = document.createElement('div');
                    placeholder.className = 'widget-nav-btn placeholder';
                    placeholder.style.width = `${btn.offsetWidth}px`;
                    placeholder.style.height = `${btn.offsetHeight}px`;
                    placeholder.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                    placeholder.style.border = '2px dashed rgba(255, 255, 255, 0.3)';

                    // 设置拖拽图像
                    e.dataTransfer.setDragImage(btn, 0, 0);

                    // 延迟添加拖拽中的样式
                    setTimeout(() => {
                        btn.style.opacity = '0.4';
                    }, 0);
                });

                btn.addEventListener('dragend', () => {
                    btn.style.opacity = '';

                    // 移除占位元素
                    if (placeholder && placeholder.parentNode) {
                        placeholder.parentNode.removeChild(placeholder);
                    }

                    // 保存新的组件顺序
                    this.saveWidgetOrder();
                });

                btn.addEventListener('dragover', (e) => {
                    e.preventDefault();
                });

                btn.addEventListener('dragenter', (e) => {
                    e.preventDefault();

                    if (btn !== draggedBtn) {
                        // 在目标按钮前或后插入占位元素
                        const rect = btn.getBoundingClientRect();
                        const mouseX = e.clientX;
                        const btnCenterX = rect.left + rect.width / 2;

                        if (mouseX < btnCenterX) {
                            navContainer.insertBefore(placeholder, btn);
                        } else {
                            navContainer.insertBefore(placeholder, btn.nextSibling);
                        }
                    }
                });
            });

            // 容器的拖拽事件
            navContainer.addEventListener('dragover', (e) => {
                e.preventDefault();
            });

            navContainer.addEventListener('drop', (e) => {
                e.preventDefault();

                // 将拖拽的按钮插入到占位元素的位置
                if (draggedBtn && placeholder && placeholder.parentNode) {
                    navContainer.insertBefore(draggedBtn, placeholder);
                }
            });
        }

        // 保存组件顺序
        saveWidgetOrder() {
            const navContainer = this.widgetPanel.querySelector('.widget-nav');
            const buttons = navContainer.querySelectorAll('.widget-nav-btn');

            // 收集按钮的组件ID
            const order = Array.from(buttons).map(btn => btn.dataset.widget);

            // 保存到localStorage
            localStorage.setItem('widgetOrder', JSON.stringify(order));
        }

        // 初始化设置
        initSettings() {
            const settingsPanel = this.widgetPanel.querySelector('#settingsPanel');

            // 透明度设置
            const opacitySlider = settingsPanel.querySelector('#settingOpacity');
            opacitySlider.value = this.settings.opacity;
            opacitySlider.addEventListener('input', () => {
                const opacity = opacitySlider.value / 100;
                this.widgetPanel.style.backgroundColor = `rgba(40, 40, 50, ${opacity})`;
                this.settings.opacity = opacitySlider.value;
                this.saveSettings();
            });

            // 主题设置
            const themeSelect = settingsPanel.querySelector('#settingTheme');
            themeSelect.value = this.settings.theme;
            themeSelect.addEventListener('change', () => {
                this.settings.theme = themeSelect.value;
                this.widgetPanel.dataset.theme = themeSelect.value;
                this.saveSettings();
            });

            // 自动播放设置
            const autoplayCheck = settingsPanel.querySelector('#settingAutoplay');
            autoplayCheck.checked = this.settings.autoplay;
            autoplayCheck.addEventListener('change', () => {
                this.settings.autoplay = autoplayCheck.checked;
                this.saveSettings();
            });

            // 记住位置设置
            const rememberPosCheck = settingsPanel.querySelector('#settingRememberPos');
            rememberPosCheck.checked = this.settings.rememberPos;
            rememberPosCheck.addEventListener('change', () => {
                this.settings.rememberPos = rememberPosCheck.checked;
                this.saveSettings();
            });

            // 记住尺寸设置
            const rememberSizeCheck = settingsPanel.querySelector('#settingRememberSize');
            rememberSizeCheck.checked = this.settings.rememberSize;
            rememberSizeCheck.addEventListener('change', () => {
                this.settings.rememberSize = rememberSizeCheck.checked;
                this.saveSettings();
            });

            // 自动高度设置
            const autoHeightCheck = settingsPanel.querySelector('#settingAutoHeight');
            autoHeightCheck.checked = this.settings.autoHeight;
            autoHeightCheck.addEventListener('change', () => {
                this.settings.autoHeight = autoHeightCheck.checked;

                // 更新容器类
                const container = this.widgetPanel.querySelector('.widget-container');
                if (this.settings.autoHeight) {
                    container.classList.add('auto-height');
                } else {
                    container.classList.remove('auto-height');
                }

                this.saveSettings();
            });

            // 显示尺寸调整手柄设置
            const showResizeHandlesCheck = settingsPanel.querySelector('#settingShowResizeHandles');
            showResizeHandlesCheck.checked = this.settings.showResizeHandles;
            showResizeHandlesCheck.addEventListener('change', () => {
                this.settings.showResizeHandles = showResizeHandlesCheck.checked;

                // 更新面板类
                if (this.settings.showResizeHandles) {
                    this.widgetPanel.classList.add('show-resize-handles');
                } else {
                    this.widgetPanel.classList.remove('show-resize-handles');
                }

                this.saveSettings();
            });

            // GitHub 链接设置
            const githubLinkBtn = settingsPanel.querySelector('#githubLinkBtn');

            if (githubLinkBtn) {
                // 如果在配置中提供了GitHub链接，优先使用配置中的
                if (this.config.githubUrl && !this.settings.githubUrl) {
                    this.settings.githubUrl = this.config.githubUrl;
                    this.saveSettings();
                }

                // 设置链接地址
                githubLinkBtn.href = this.settings.githubUrl || '#';

                // 更新按钮文本
                this.updateGithubButtonText();

                // 添加点击事件，在新标签页中打开
                githubLinkBtn.addEventListener('click', (e) => {
                    // 如果链接无效，阻止默认行为
                    if (!this.settings.githubUrl || this.settings.githubUrl === '#') {
                        e.preventDefault();
                        alert('GitHub 项目链接未设置，请在初始化时提供 githubUrl 参数');
                    }
                });
            }
        }

        // 更新GitHub按钮文本
        updateGithubButtonText() {
            const githubLinkBtn = this.widgetPanel.querySelector('#githubLinkBtn');
            if (!githubLinkBtn) return;

            if (!this.settings.githubUrl || this.settings.githubUrl === '#') {
                githubLinkBtn.innerHTML = '<i class="fab fa-github"></i> GitHub 项目';
                githubLinkBtn.style.backgroundColor = 'rgba(255, 100, 100, 0.2)';
            } else {
                githubLinkBtn.innerHTML = '<i class="fab fa-github"></i> GitHub 项目';
                githubLinkBtn.style.backgroundColor = '';
            }
        }

        // 加载设置
        loadSettings() {
            const savedSettings = localStorage.getItem('widgetSettings');
            if (savedSettings) {
                try {
                    const settings = JSON.parse(savedSettings);
                    this.settings = { ...this.settings, ...settings };
                } catch (error) {
                    console.error('解析设置数据失败:', error);
                }
            }

            // 确保 GitHub URL 正确设置
            if (!this.settings.githubUrl && this.config.githubUrl) {
                this.settings.githubUrl = this.config.githubUrl;
            }

            // 应用设置
            this.widgetPanel.dataset.theme = this.settings.theme;

            // 应用透明度
            const opacity = this.settings.opacity / 100;
            this.widgetPanel.style.backgroundColor = `rgba(40, 40, 50, ${opacity})`;

            // 应用尺寸调整手柄显示
            if (this.settings.showResizeHandles) {
                this.widgetPanel.classList.add('show-resize-handles');
            }

            // 加载位置
            const savedPosition = localStorage.getItem('widgetPosition');
            if (savedPosition && this.settings.rememberPos) {
                try {
                    const position = JSON.parse(savedPosition);
                    this.widgetPanel.style.left = `${position.x}px`;
                    this.widgetPanel.style.top = `${position.y}px`;
                } catch (error) {
                    console.error('解析位置数据失败:', error);
                }
            }

            // 加载尺寸
            const savedSize = localStorage.getItem('widgetSize');
            if (savedSize && this.settings.rememberSize) {
                try {
                    const size = JSON.parse(savedSize);
                    this.widgetPanel.style.width = `${size.width}px`;
                    this.widgetPanel.style.height = `${size.height}px`;
                } catch (error) {
                    console.error('解析尺寸数据失败:', error);
                }
            }

            // 加载最小化状态
            if (localStorage.getItem('widgetMinimized') === 'true') {
                this.isMinimized = true;
                this.widgetPanel.classList.add('minimized');
            }

            // 加载固定状态
            if (localStorage.getItem('widgetPinned') === 'true') {
                this.isPinned = true;
                this.widgetPanel.classList.add('pinned');
                const btnPin = this.widgetPanel.querySelector('#btnPin');
                if (btnPin) btnPin.classList.add('active');
            }

            // 更新 GitHub 按钮状态
            this.updateGithubButtonText();
        }

        // 保存设置
        saveSettings() {
            localStorage.setItem('widgetSettings', JSON.stringify(this.settings));
        }

        // 公共方法：显示挂件
        show() {
            this.widgetPanel.style.display = 'flex';
        }

        // 公共方法：隐藏挂件
        hide() {
            this.widgetPanel.style.display = 'none';
        }

        // 公共方法：切换最小化状态
        toggleMinimize() {
            if (this.isMinimized) {
                this.widgetPanel.classList.remove('minimized');
                this.isMinimized = false;
                localStorage.removeItem('widgetMinimized');
            } else {
                this.widgetPanel.classList.add('minimized');
                this.isMinimized = true;
                localStorage.setItem('widgetMinimized', 'true');
            }
        }

        // 公共方法：切换固定状态
        togglePin() {
            this.isPinned = !this.isPinned;
            if (this.isPinned) {
                this.widgetPanel.classList.add('pinned');
                localStorage.setItem('widgetPinned', 'true');
            } else {
                this.widgetPanel.classList.remove('pinned');
                localStorage.removeItem('widgetPinned');
            }
        }

        // 公共方法：添加自定义组件
        addWidget(name, url, icon = 'fas fa-globe') {
            if (!name || !url) return false;

            try {
                new URL(url);
            } catch (e) {
                return false;
            }

            // 生成唯一ID
            const id = 'custom_' + Date.now();

            // 添加新组件
            this.widgets[id] = {
                url: url,
                loaded: false,
                iframe: null,
                defaultHeight: 300,
                defaultWidth: 400,
                name: name,
                icon: icon,
                isBuiltIn: false
            };

            // 保存到存储
            this.saveCustomWidgetsToStorage();

            // 重新创建导航
            this.createWidgetNavButtons();

            return id;
        }

        // 公共方法：切换到指定组件
        switchToWidget(widgetId) {
            if (this.widgets[widgetId]) {
                this.switchWidget(widgetId);
                return true;
            }
            return false;
        }

        // 公共方法：销毁挂件
        destroy() {
            // 移除DOM元素
            if (this.widgetPanel && this.widgetPanel.parentNode) {
                this.widgetPanel.parentNode.removeChild(this.widgetPanel);
            }

            // 清理事件监听器
            window.removeEventListener('resize', this.keepInViewport);

            // 重置实例
            widgetInstance = null;
        }
    }

    // 创建全局API
    window.MultiWidget = {
        // 初始化挂件
        init: function (options) {
            if (!widgetInstance) {
                widgetInstance = new MultiWidget(options);
            }
            return this;
        },

        // 显示挂件
        show: function () {
            if (widgetInstance) widgetInstance.show();
            return this;
        },

        // 隐藏挂件
        hide: function () {
            if (widgetInstance) widgetInstance.hide();
            return this;
        },

        // 切换最小化状态
        toggleMinimize: function () {
            if (widgetInstance) widgetInstance.toggleMinimize();
            return this;
        },

        // 切换固定状态
        togglePin: function () {
            if (widgetInstance) widgetInstance.togglePin();
            return this;
        },

        // 添加自定义组件
        addWidget: function (name, url, icon) {
            if (widgetInstance) return widgetInstance.addWidget(name, url, icon);
            return false;
        },

        // 切换到指定组件
        switchToWidget: function (widgetId) {
            if (widgetInstance) return widgetInstance.switchToWidget(widgetId);
            return false;
        },

        // 销毁挂件
        destroy: function () {
            if (widgetInstance) widgetInstance.destroy();
            return this;
        },

        // 获取挂件实例
        getInstance: function () {
            return widgetInstance;
        }
    };

})(window);
