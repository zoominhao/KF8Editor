function NetDebug(context) {
    let self = this;

    this.Event = new PIXI.utils.EventEmitter();

    this.NetSwitchUI = new NetSwitchUI();
    this.BreakDebugger = new BreakDebugger(context);

    this.remoteDebugUI = $("#remoteDebug");

    this.remoteDebugUI.checkbox({
        onChange:function (checked) {
            self.NotifyMain("OnRemoteDebugUIChange", {"Checked": checked});
        }
    })

    this.InitIPCEvents();

    this.Event.on("RemoteDebug", function (data) {
        if (data) {
            self.remoteDebugUI.checkbox(data.RemoteDebug? 'check' : 'uncheck');
        }
    });

    this.Event.on("MainStarted", function (data) {
        self.NotifyMain("NetDebugWinID", {WinID: _global.windowID});
        if (self.BreakDebugger) {
            self.BreakDebugger.OnMainStarted();
        }
    })

    this.NotifyMain("RequestRemoteDebug");
}

NetDebug.prototype.InitIPCEvents = function () {
    let self = this;
    _global.Event.on("NetDebugIPC", function (info) {
        if (info) {
            self.Event.emit(info.Type, info.Data);
        }
    });
}

NetDebug.prototype.NotifyMain = function (event, param) {
    let info = { Type: event, Data: param }
    _global.EmitToMainGlobal("NetDebugIPC", info);
}
