/**
 * Toolbar configurations for different windows
 * Centralized button definitions to reduce duplication
 */

const ToolbarConfig = {
    /**
     * Common buttons used across multiple windows
     */
    common: {
        openDevPanel: {
            id: 'opendevpanel',
            icon: 'icon-help',
            label: '调试面板',
            action: function() {
                if (typeof WindowUtils !== 'undefined') {
                    WindowUtils.openDevTools(_global.windowID);
                } else {
                    OpenDevToolsByID(_global.windowID);
                }
            }
        },

        reloadPage: {
            id: 'reloadpage',
            icon: 'icon-reload',
            label: '刷新页面',
            action: function() {
                if (typeof WindowUtils !== 'undefined') {
                    WindowUtils.reloadWindow(_global.windowID);
                } else {
                    location.reload();
                }
            }
        },

        save: {
            id: 'save',
            icon: 'icon-save',
            label: '保存',
            // action defined by specific window
        },

        undo: {
            id: 'undo',
            icon: 'icon-undo',
            label: '撤销',
            // action defined by specific window
        },

        redo: {
            id: 'redo',
            icon: 'icon-redo',
            label: '重做',
            // action defined by specific window
        },

        search: {
            id: 'search',
            icon: 'icon-search',
            label: '搜索...',
            // action defined by specific window
        }
    },

    /**
     * Main window toolbar
     */
    main: [
        'openDevPanel',
        'reloadPage',
        {id: 'setting', icon: 'icon-setting', label: '设置'},
        {id: 'menucreateblk', icon: 'icon-add', label: 'BLK'},
        {id: 'menusaveblk', icon: 'icon-save', label: '保存'},
        {id: 'menuimport', icon: 'icon-more', label: '导入'},
        {id: 'rebuildrefs', icon: 'icon-reload', label: '刷新依赖'},
        {id: 'debugrun', icon: 'icon-ok', label: '调试'},
        'undo',
        'redo',
        'search'
    ],

    /**
     * Single window (BLK editor) toolbar
     */
    singlewindow: [
        'openDevPanel',
        'reloadPage',
        {id: 'newsaveblk', icon: 'icon-save', label: '保存'},
        'undo',
        'redo'
    ],

    /**
     * Network debugger toolbar
     */
    netdebug: [
        'openDevPanel',
        'reloadPage',
        {id: 'debugresume', icon: 'icon-play', label: '继续运行'},
        {id: 'debugbystep', icon: 'icon-continue', label: '单步'}
    ],

    /**
     * Search window toolbar
     */
    search: [
        'openDevPanel',
        'reloadPage',
        {id: 'executesearch', icon: 'icon-search', label: '执行搜索'},
        {id: 'executereplace', icon: 'icon-edit', label: '执行替换'}
    ],

    /**
     * Get toolbar configuration by window type
     * @param {string} type - Window type (main, singlewindow, netdebug, search)
     * @returns {Array} Button configurations
     */
    get: function(type) {
        const config = this[type];
        if (!config) {
            console.warn('[ToolbarConfig] Unknown window type:', type);
            return [];
        }

        // Resolve button references
        return config.map(btn => {
            if (typeof btn === 'string') {
                return this.common[btn];
            }
            return btn;
        });
    },

    /**
     * Render toolbar HTML
     * @param {string} type - Window type
     * @returns {string} HTML string
     */
    renderHTML: function(type) {
        const buttons = this.get(type);
        return buttons.map(btn => {
            return `<a id="${btn.id}" href="#" class="easyui-linkbutton"
                       data-options="iconCls:'${btn.icon}'"
                       style="border: none;">${btn.label}</a>`;
        }).join('\n        ');
    },

    /**
     * Bind toolbar events
     * @param {string} type - Window type
     * @param {Object} customActions - Custom action overrides
     */
    bindEvents: function(type, customActions = {}) {
        const buttons = this.get(type);

        buttons.forEach(btn => {
            const action = customActions[btn.id] || btn.action;
            if (action) {
                $(`#${btn.id}`).click(action);
            }
        });
    }
};
