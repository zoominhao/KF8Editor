const fs = require("fs");

function EditorFileWatcher(mainvars) {
    this.mainvars = mainvars;
    this.firetimeout = {};
}

EditorFileWatcher.prototype.Listen = function (info) {
    // info = { kfdpath:_global.kfdpath, appdatapath:_global.appdatapath, apppath:_global.apppath };
    let self = this;

    let kfdpath = info.kfdpath;
    console.log("watch kfd files:", kfdpath);
    fs.watch(kfdpath, (event, filename) => {
        /// 此文件的修改不会触发KFD的更新操作
        if (filename.indexOf("_kfdpaths_") !== -1) return;

        let timeoutid = self.firetimeout[kfdpath];
        if (!timeoutid || timeoutid === -1) {
            self.firetimeout[kfdpath] = setTimeout(function () {
                self.firetimeout[kfdpath] = -1;
                self.mainvars.SendGlobalEvent("onKFDChange");
            }, 1000);
        }
    });

    let apppath = info.appdatapath + "/App";
    console.log("watch blk files:", apppath);
    fs.watch(apppath, {recursive: true}, (event, filename) => {
        let timeoutid = self.firetimeout[apppath];
        if (!timeoutid || timeoutid === -1) {
            self.firetimeout[apppath] = setTimeout(function () {
                self.firetimeout[apppath] = -1;
                self.mainvars.SendGlobalEvent("onAppDataChange");
            }, 100);
        }
    });
}

module.exports = EditorFileWatcher;