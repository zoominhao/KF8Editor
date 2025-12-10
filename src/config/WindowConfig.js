/**
 * Window configuration for KF8Editor
 * Centralized window paths management
 */

const WindowConfig = {
    // Main windows
    main: "index.html",

    // Editor windows
    blkEditor: "windows.html",          // BLK file editor window (lowercase)
    kfdEditor: "KFDEditor.html",        // Standalone KFD editor

    // Tool windows
    search: "search.html",              // Global search tool
    netDebug: "netdebug.html",          // Network debugger

    // Embedded pages (in html/ subdirectory)
    graphNode: "html/graphnode.html",   // Graph editor (iframe)
    timeline: "html/timeline.html",     // Timeline editor (iframe)

    // Monaco editor
    monacoEditor: "monaco-editor/base/index.html",

    /**
     * Get window path with optional directory prefix
     * @param {string} key - Window key
     * @param {string} dir - Optional directory prefix (e.g., 'html/')
     * @returns {string} Full window path
     */
    getPath: function(key, dir) {
        const path = this[key];
        if (!path) {
            console.error('Unknown window key:', key);
            return '';
        }
        return dir ? dir + path : path;
    },

    /**
     * Check if current page is in html/ subdirectory
     * @returns {boolean}
     */
    isInHtmlDir: function() {
        const currentPath = window.location.pathname;
        return currentPath.includes('/html/') || currentPath.includes('\\html\\');
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WindowConfig;
}
