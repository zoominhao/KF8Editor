/**
 * Window utility functions
 * Common window operations for all KF8Editor windows
 */

const WindowUtils = {
    /**
     * Open Chrome DevTools for current or specific window
     * @param {number} windowId - Optional window ID
     */
    openDevTools: function(windowId) {
        try {
            if (windowId) {
                OpenDevToolsByID(windowId);
            } else {
                const {remote} = nodeRequire('@electron/remote');
                const win = remote.getCurrentWindow();
                if (win) {
                    win.webContents.openDevTools();
                }
            }
        } catch (e) {
            console.error('[WindowUtils] Failed to open DevTools:', e);
        }
    },

    /**
     * Reload current or specific window
     * @param {number} windowId - Optional window ID
     */
    reloadWindow: function(windowId) {
        try {
            const {remote} = nodeRequire('@electron/remote');
            const win = windowId ?
                remote.BrowserWindow.fromId(windowId) :
                remote.getCurrentWindow();

            if (win) {
                win.reload();
                console.log('[WindowUtils] Window reloaded');
            }
        } catch (e) {
            console.error('[WindowUtils] Failed to reload window:', e);
            // Fallback
            location.reload();
        }
    },

    /**
     * Close current or specific window
     * @param {number} windowId - Optional window ID
     */
    closeWindow: function(windowId) {
        try {
            const {remote} = nodeRequire('@electron/remote');
            const win = windowId ?
                remote.BrowserWindow.fromId(windowId) :
                remote.getCurrentWindow();

            if (win) {
                win.close();
            }
        } catch (e) {
            console.error('[WindowUtils] Failed to close window:', e);
        }
    },

    /**
     * Get current window ID
     * @returns {number} Window ID
     */
    getCurrentWindowId: function() {
        try {
            const {remote} = nodeRequire('@electron/remote');
            return remote.getCurrentWindow().id;
        } catch (e) {
            console.error('[WindowUtils] Failed to get window ID:', e);
            return null;
        }
    },

    /**
     * Show window
     * @param {number} windowId - Window ID
     */
    showWindow: function(windowId) {
        try {
            const {remote} = nodeRequire('@electron/remote');
            const win = remote.BrowserWindow.fromId(windowId);
            if (win) {
                win.show();
                win.focus();
            }
        } catch (e) {
            console.error('[WindowUtils] Failed to show window:', e);
        }
    },

    /**
     * Hide window
     * @param {number} windowId - Window ID
     */
    hideWindow: function(windowId) {
        try {
            const {remote} = nodeRequire('@electron/remote');
            const win = remote.BrowserWindow.fromId(windowId);
            if (win) {
                win.hide();
            }
        } catch (e) {
            console.error('[WindowUtils] Failed to hide window:', e);
        }
    },

    /**
     * Minimize window
     * @param {number} windowId - Window ID
     */
    minimizeWindow: function(windowId) {
        try {
            const {remote} = nodeRequire('@electron/remote');
            const win = remote.BrowserWindow.fromId(windowId);
            if (win) {
                win.minimize();
            }
        } catch (e) {
            console.error('[WindowUtils] Failed to minimize window:', e);
        }
    },

    /**
     * Maximize window
     * @param {number} windowId - Window ID
     */
    maximizeWindow: function(windowId) {
        try {
            const {remote} = nodeRequire('@electron/remote');
            const win = remote.BrowserWindow.fromId(windowId);
            if (win) {
                if (win.isMaximized()) {
                    win.unmaximize();
                } else {
                    win.maximize();
                }
            }
        } catch (e) {
            console.error('[WindowUtils] Failed to maximize window:', e);
        }
    },

    /**
     * Get window bounds
     * @param {number} windowId - Window ID
     * @returns {Object} {x, y, width, height}
     */
    getWindowBounds: function(windowId) {
        try {
            const {remote} = nodeRequire('@electron/remote');
            const win = windowId ?
                remote.BrowserWindow.fromId(windowId) :
                remote.getCurrentWindow();

            if (win) {
                return win.getBounds();
            }
        } catch (e) {
            console.error('[WindowUtils] Failed to get window bounds:', e);
        }
        return null;
    },

    /**
     * Set window bounds
     * @param {number} windowId - Window ID
     * @param {Object} bounds - {x, y, width, height}
     */
    setWindowBounds: function(windowId, bounds) {
        try {
            const {remote} = nodeRequire('@electron/remote');
            const win = windowId ?
                remote.BrowserWindow.fromId(windowId) :
                remote.getCurrentWindow();

            if (win) {
                win.setBounds(bounds);
            }
        } catch (e) {
            console.error('[WindowUtils] Failed to set window bounds:', e);
        }
    }
};
