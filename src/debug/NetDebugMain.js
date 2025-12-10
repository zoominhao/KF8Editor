// 用于主窗口的NetDebug独立出来
function NetDebugMain() {
    let self = this;

    this.Event = new PIXI.utils.EventEmitter();

    ipcRenderer.on("OpenNetDebugWindow",() => {
        self.CreateNetDebugWindow();
    });

    this.win = null;
    this.winContentsID = null;

    this.initIPCEvents();

    this.BreakDebugger = new BreakDebuggerMain(this);

    this.Event.on("NetDebugWinID", function (data) {
        if (data && data.WinID) {
            self.AttachNetDebugWindow(data.WinID);
            if (self.BreakDebugger) {
                self.BreakDebugger.OnNetDebugWinAttached();
            }
        }
    });

    this.NotifyGlobal("MainStarted");
}

NetDebugMain.prototype.initIPCEvents = function () {
    let self = this;
    _global.Event.on("NetDebugIPC", function (info) {
        if (info) {
            self.Event.emit(info.Type, info.Data);
        }
    });
}

NetDebugMain.prototype.CreateNetDebugWindow = function () {
    const { BrowserWindow } = nodeRequire('@electron/remote');
    let self = this;

    let win = this.win;
    if (!win)  {
        win = new BrowserWindow({
            width: 1024,
            height: 768,
            autoHideMenuBar: true,
            webPreferences: {
                nodeIntegration: true
                ,enableRemoteModule:true
                ,webSecurity : false
                ,contextIsolation:false
            }
        });

        this.win = win;
        this.winContentsID = GetwebContentsIDByWinID(win.id);

        win.on("closed", function () {
            self.OnNetDebugWinClosed();
        });

        win.loadFile(WindowConfig.netDebug,{
            query: {
                apppath:_global.apppath,
                kfdpath:_global.kfdpath,
                appdatapath:_global.appdatapath,
                id:win.id,
                maincid:_global.mainContentsID
            }
        });
    }
    if (win) win.show();
}

NetDebugMain.prototype.AttachNetDebugWindow = function (id) {
    let self = this;

    this.win = GetWinByID(id);
    if (this.win) {
        this.winContentsID = GetwebContentsIDByWinID(this.win.id);
    }

    this.win.on("closed", function () {
        self.OnNetDebugWinClosed();
    });
}

NetDebugMain.prototype.OnNetDebugWinClosed = function () {
    if (this.BreakDebugger) {
        this.BreakDebugger.OnNetDebugWinClosed();
    }

    this.win = null;
    this.winContentsID = null;
}

NetDebugMain.prototype.NotifyNetDebug = function (event, info) {
    if (this.winContentsID) {
        _global.EmitToContentsID(this.winContentsID, event, info);
    }
}

NetDebugMain.prototype.NotifyGlobal = function (event, param) {
    let info = { Type: event, Data: param }
    _global.EmitToGlobal("NetDebugIPC", info);
}
