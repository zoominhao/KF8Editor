/**
 * Common initialization logic for all KF8Editor windows
 * Reduces code duplication between KFEditorApp.js and Windows.js
 */

const CommonInit = {
    /**
     * Detect if current page is in html/ subdirectory
     * @returns {string} Base path ('../' or '')
     */
    detectBasePath: function() {
        const currentPath = window.location.pathname;
        const inHtmlDir = currentPath.includes('/html/') || currentPath.includes('\\html\\');
        return inHtmlDir ? '../' : '';
    },

    /**
     * Initialize KF modules (KFData, Core, KFNetwork)
     * @param {function} callback - Called when modules are loaded
     */
    initKFModules: function(callback) {
        const basePath = this.detectBasePath();
        const kfLibPath = basePath + "libs/kf/";
        const srcMPath = basePath + "src/m";

        loadjspackage(["KFData", "Core", "KFNetwork"],
            kfLibPath,
            function (jspaths) {
                loadandincludejs(jspaths, function () {
                    // Set up HTTP and FileIO implementations
                    HttpRequest_Type.meta = WebHttpRequest.Meta;
                    IKFFileIO_Type.meta = KFHttpFileIO.Meta;
                    IKFFileIO_Type.new_default();

                    console.log('[CommonInit] KF modules loaded successfully');

                    if (callback) callback();
                });
            },
            [srcMPath]
        );
    },

    /**
     * Initialize native bindings
     */
    initNative: function() {
        __Native.Ready();
    },

    /**
     * Get query parameters from URL
     * @returns {Object} Query parameters
     */
    getQueryParams: function() {
        const current_url = new URL(document.location.toString());
        const search_params = current_url.searchParams;

        return {
            maincid: parseInt(search_params.get('maincid')),
            apppath: search_params.get('apppath'),
            kfdpath: search_params.get('kfdpath'),
            appdatapath: search_params.get('appdatapath'),
            path: search_params.get('path')
        };
    },

    /**
     * Standard initialization sequence for editor windows
     * @param {Object} options - Initialization options
     */
    standardInit: function(options) {
        const {
            onModulesLoaded,
            onReady,
            skipNative = false
        } = options;

        // 1. Load KF modules
        this.initKFModules(() => {
            if (onModulesLoaded) {
                onModulesLoaded();
            }

            // 2. Emit Ready event
            _global.Event.emit("Ready");
        });

        // 3. Listen to Ready event
        _global.Event.on("Ready", () => {
            if (!skipNative) {
                this.initNative();
            }

            if (onReady) {
                onReady();
            }
        });
    }
};
