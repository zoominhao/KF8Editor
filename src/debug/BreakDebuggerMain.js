// 用于主窗口的BreakDebugger独立出来
function BreakDebuggerMain(netdebug) {
    let self = this;

    this.netDebug = netdebug;

    _global.Event.on("OnSetBreakPoints", function (bps) {
        let info = {event: "OnSetBreakPoints", data:bps};
        self.NotifyDebugger("BreakDebuggerEvent", info);
    });

    this.initIPCEvents();

    _global.editor.network.Event.on("OnNetworkChangeFinish", this.debugObjCheck, this);
    BreakDebuggerTool.NotifyGlobal("MainStarted");
}

BreakDebuggerMain.prototype.Dispose = function () {
    this.UninitIPCEvent();
    _global.editor.network.Event.off("OnNetworkChangeFinish", this.debugObjCheck, this);
    _global.Event.removeAllListeners("BreakDebuggerIPC");
}

BreakDebuggerMain.prototype.debugObjCheck = function () {
    let self = this;
    if (!this.netDebug || !this.netDebug.win) return;

    if (_global.editor.network) {
        _global.editor.network.Event.on("DebugObjChanged", function() {
            self.debugObjCheck();
        });
    }
    let debugObj = this.GetDebugNetObj();
    if (debugObj) {
        this.NotifyDebugger("UpdateStatus", "connected");
        debugObj.RegisterRpc("DebugBreakHit", function(msg) {
            self.NotifyDebugger("DebugBreakHit", msg);
        });
        debugObj.Get("BreakInfo", function (info) {
            self.NotifyDebugger("BreakInfo", info);
        });
    } else {
        this.NotifyDebugger("UpdateStatus", "disconnected");
    }
}

BreakDebuggerMain.prototype.initIPCEvents = function () {
    let self = this;
    _global.Event.on("BreakDebuggerIPC", function (info) {
        if (info) {
            switch (info.Type) {
                case "DebugObjCheck": {
                    self.debugObjCheck();
                    break;
                }
                case "SendMsg": {
                    let data = info.Data;
                    if (data) {
                        self.SendDebugObjMsg(data.Function, ...CommTool.Base64ToValues(data.Args));
                    }
                    break;
                }
                case "GetMsg": {
                    let data = info.Data;
                    if (data) {
                        let debugObj = self.GetDebugNetObj();
                        if (debugObj) {
                            debugObj.Get(data.Function, function (...params) {
                                let info = {Seq: data.Seq, Rsp: CommTool.ValuesToBase64(params)};
                                self.NotifyDebugger("GetMsg", info);
                            }, ...CommTool.Base64ToValues(data.Args));
                        }
                    }
                    break;
                }
                default: break;
            }
        }
    });
}

BreakDebuggerMain.prototype.UninitIPCEvent = function () {
    _global.Event.removeAllListeners("BreakDebuggerIPC");
}

BreakDebuggerMain.prototype.SendDebugObjMsg = function (funcname, ...args) {
    let debugObj = this.GetDebugNetObj();
    if (debugObj) {
        debugObj.Set(funcname, ...args);
    }
}

BreakDebuggerMain.prototype.NotifyDebugger = function (event, param) {
    if (this.netDebug && this.netDebug.winContentsID) {
        let info = { Type: event, Data: param }
        _global.EmitToContentsID(this.netDebug.winContentsID, "BreakDebuggerIPC", info);
    }
}

BreakDebuggerMain.prototype.GetDebugNetObj = function() {
    return _global.editor.network.GetDebugNetObj();
}

BreakDebuggerMain.prototype.OnNetDebugWinClosed = function () {
    // 通知停止调试
    let msg = BreakDebuggerTool.MakeKFDObject("KF8DebuggerStop");
    msg.Stop = true;
    this.SendDebugObjMsg("DebuggerStop", msg);

    _global.EmitToGlobal("OnDebugBreakPointHitToGlobals", {newbp: null, oldbp: _global.debugHitBreakPoint});
    _global.EmitToGlobal("OnDebugBreakPointsChangedToGlobals", {"op": 1, "opbps": _global.debugBreakPoints, "bps": []});
    let monacoID = __Native.monaco.id;
    ipcRenderer.send("monacodebugger", monacoID, "variables", {});
    ipcRenderer.send("monacodebugger", monacoID, "breakpoints", {lines:[], has_from:true});
    ipcRenderer.send("monacodebugger", monacoID, "breakpointhit", {line:0});
}

BreakDebuggerMain.prototype.OnNetDebugWinAttached = function () {
    this.debugObjCheck();
}
