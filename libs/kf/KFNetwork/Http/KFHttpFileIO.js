define(["require", "exports", "../../Core/Meta/KFMetaManager", "./URLLoader", "./URLLoaderDataFormat", "./URLRequest"], function (require, exports, KFMetaManager_1, URLLoader_1, URLLoaderDataFormat_1, URLRequest_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var KFHttpFileIO = /** @class */ (function () {
        function KFHttpFileIO() {
            this.__loader = null;
            this.__loadindex = 0;
        }
        KFHttpFileIO.prototype.asyncCreateDir = function (path, async) {
            return false;
        };
        KFHttpFileIO.prototype.asyncGetFilePaths = function (pathlist, path, recursive, pattern, async) {
        };
        KFHttpFileIO.prototype.asyncIsDirExist = function (path, async) {
            return false;
        };
        KFHttpFileIO.prototype.asyncIsFileExist = function (path, async) {
            return false;
        };
        KFHttpFileIO.prototype.asyncIteratePaths = function (path, recursive, ffilter, async) {
        };
        KFHttpFileIO.prototype.asyncLoadFile = function (path, async, params) {
            var dataft = params;
            var basedir = "";
            if (params && typeof (params) != 'string') {
                dataft = params.dataFormat;
                if (params.basedir) {
                    basedir = params.basedir;
                }
            }
            if (!dataft || dataft == "") {
                dataft = URLLoaderDataFormat_1.URLLoaderDataFormat.BINARY;
            }
            var loader = new URLLoader_1.URLLoader();
            loader.dataFormat = dataft;
            ///增加基础目录
            var request = new URLRequest_1.URLRequest(basedir + path);
            loader.COMPLETE_Event.on(function (currloader) {
                async(true, currloader.data, path);
            });
            loader.IO_ERROR_Event.on(function (currloader) {
                async(false, null, path);
            });
            loader.load(request);
            return true;
        };
        KFHttpFileIO.prototype.asyncLoadFileList = function (filearr, onprogress, async, params) {
            if (this.__loader)
                return;
            var dataft = params;
            var basedir = "";
            if (params && typeof (params) != 'string') {
                dataft = params.dataFormat;
                if (params.basedir) {
                    basedir = params.basedir;
                }
            }
            if (!dataft || dataft == "") {
                dataft = URLLoaderDataFormat_1.URLLoaderDataFormat.BINARY;
            }
            var loader = new URLLoader_1.URLLoader();
            loader.dataFormat = dataft;
            this.__loader = loader;
            this.__loadindex = 0;
            var target = this;
            var currloadpath = "";
            function NextLoad() {
                loader.__recycle();
                if (filearr.length > target.__loadindex) {
                    currloadpath = filearr[target.__loadindex];
                    var request = new URLRequest_1.URLRequest(basedir + currloadpath);
                    loader.load(request);
                    target.__loadindex += 1;
                }
                else {
                    ///清空
                    target.__loader = null;
                    async(true, null, "");
                }
            }
            loader.COMPLETE_Event.on(function (currloader) {
                onprogress(true, currloader.data, currloadpath);
                NextLoad();
            });
            loader.IO_ERROR_Event.on(function (currloader) {
                onprogress(false, null, currloadpath);
                NextLoad();
            });
            NextLoad();
        };
        KFHttpFileIO.prototype.asyncSaveFile = function (path, bytesArr, async) {
            return false;
        };
        KFHttpFileIO.Meta = new KFMetaManager_1.IKFMeta("KFHttpFileIO", function () {
            return new KFHttpFileIO();
        });
        return KFHttpFileIO;
    }());
    exports.KFHttpFileIO = KFHttpFileIO;
});
