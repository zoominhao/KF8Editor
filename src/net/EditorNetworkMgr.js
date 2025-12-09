const os = nodeRequire('os');

function EditorNetworkMgr(context) {
    let self = this;
    this.context = context;
    this.Event = new PIXI.utils.EventEmitter();
    this.network = null;
    this.rpcobjsonline = null;
    this.rpcobjsoffline = null;
    this.connectedHost = "";
    this.connectedHostLost = false;
    this.onNetworkChangeCallback = null;
    this.remoteServer = null;
    this.remoteDebug = false;
    this.breakDebugger = null;
    this.debugNetObj = null;

    this.InitIPCEvents();

    this.Event.on("OnRemoteServerChange", function (data) {
        if (data && data.hasOwnProperty("Checked")) {
            self.SwitchNetwork(data.Checked);
        }
    });

    this.Event.on("OnConnectionHostsSelect", function (data) {
        if (data && data.Host) {
            self.SwitchConnectionToHost(data.Host);
        }
    });

    this.Event.on("OnRemoteDebugUIChange", function (data) {
        if (data) {
            self.remoteDebug = (data.Checked === true);
            self.Event.emit("OnRemoteDebugChange", self.remoteDebug);
        }
    });

    this.Event.on("RequestLoadInfo", function () {
        if (self.hostItems) {
            self.NotifyNetSwitchUI("connectionHostsLoadData", {"Items": self.hostItems});
        }
        self.NotifyNetSwitchUI("LoadInfo", {
            "RemoteServer": self.remoteServer,
            "HostItems": self.hostItems,
            "ConnectedHost": self.connectedHost
        });
    });

    this.Event.on("RequestRemoteDebug", function () {
        self.NotifyNetDebug("RemoteDebug", {"RemoteDebug": self.remoteDebug});
    });

    this.InitNetDebug();

    if (_global.editor && _global.editor.netObjSelector) {
        _global.editor.netObjSelector.SetEditorNetworkMgr(this);
    }
}

EditorNetworkMgr.prototype.InitIPCEvents = function () {
    let self = this;
    _global.Event.on("NetSwitchIPC", function (info) {
        if (info) {
            self.Event.emit(info.Type, info.Data);
        }
    });
    _global.Event.on("NetDebugIPC", function (info) {
        if (info) {
            self.Event.emit(info.Type, info.Data);
        }
    });
}

EditorNetworkMgr.prototype.OnRemoteNodesChanged = function () {
    if (!this.network) {
        return;
    }
    let hosts = this.network.GetValidRemoteHosts();
    let items = [];
    for (let h in hosts) {
        items.push({label: h === "Localhost" ? h : hosts[h], value: h});
    }
    this.hostItems = items;

    this.NotifyNetSwitchUI("connectionHostsLoadData", {"Items": items});

    if (this.connectedHost) {
        if (!hosts.hasOwnProperty(this.connectedHost)) {
            this.NotifyNetSwitchUI("connectionHostsUnselect", {"ConnectedHost": this.connectedHost});
            this.connectedHostLost = true;
        } else if (this.connectedHostLost) {
            this.NotifyNetSwitchUI("connectionHostsSelect", {"ConnectedHost": this.connectedHost});
            this.connectedHostLost = false;
        }
    }

    if (this.remoteServer === false && !this.connectedHost && items.length > 0) {
        let host = items[0].value;
        this.SwitchConnectionToHost(host);
        this.NotifyNetSwitchUI("connectionHostsSelect", {"ConnectedHost": host});
    }
}

EditorNetworkMgr.prototype.SwitchNetwork = function(remoteServer) {
    if (this.remoteServer === remoteServer) {
        return;
    }

    this.Event.emit("OnNetworkChangeStart");

    if (this.network) {
        this.network.Shutdown();
    }
    let option = {userName:"Localhost|KF8Editor",localID:100,token:"abc"};
    if (remoteServer) {
        option.userName = os.hostname() + "|KF8Editor";
    }
    this.network = new KF8NetManager(option, this.context);
    if (remoteServer) {
        this.network.Connect("ws://109.244.212.150:18091/ws");
    } else {
        this.network.Connect("ws://127.0.0.1:8001/ws");
    }
    this.remoteServer = remoteServer;
    this.network.Event.on("OnRemoteNodesChanged", this.OnRemoteNodesChanged.bind(this));

    if (this.rpcobjsonline) {
        this.rpcobjsonline.Dispose();
        this.rpcobjsonline = null;
    }
    if (this.rpcobjsoffline) {
        this.rpcobjsoffline.Dispose();
        this.rpcobjsoffline = null;
    }
    this.connectedHost = "";

    this.Event.emit("OnNetworkChangeFinish");
}

EditorNetworkMgr.prototype.SwitchConnectionToHost = function(host) {
    if (this.connectedHost === host) {
        return;
    }

    this.Event.emit("OnNetworkChangeStart");

    if (this.rpcobjsonline) {
        this.rpcobjsonline.Dispose();
    }
    if (this.rpcobjsoffline) {
        this.rpcobjsoffline.Dispose();
    }
    this.rpcobjsonline = new RemoteObjectLibrary($("#rpcobjsonline")
        , this.network.GetNetObjMgr(host + "|UE4Runtime"));

    this.rpcobjsoffline = new RemoteObjectLibrary($("#rpcobjsoffline")
        , this.network.GetNetObjMgr(host + "|UE4Editor"));
    
    this.connectedHost = host;
    this.connectedHostLost = false;

    this.Event.emit("OnNetworkChangeFinish");
}

EditorNetworkMgr.prototype.IsRemoteDebug = function() {
    return this.remoteDebug;
}

EditorNetworkMgr.prototype.InitNetDebug = function () {
    let self = this;

    this.Event.once("OnNetworkChangeFinish", function () {
        self.netDebug = new NetDebugMain();
    });
}

EditorNetworkMgr.prototype.GetDebuggerSession = function() {
    if (!this.network || !this.connectedHost) return null;
    return this.network.GetSession(this.connectedHost + "|KF8Debugger");
}

EditorNetworkMgr.prototype.GetDebugNetObj = function() {
    if (this.debugNetObj) {
        return this.debugNetObj;
    }

    let netmgrs = [];
    if (this.rpcobjsoffline && this.rpcobjsoffline.objmgr) {
        netmgrs.push(this.rpcobjsoffline.objmgr);
    }
    if (this.rpcobjsonline && this.rpcobjsonline.objmgr) {
        netmgrs.push(this.rpcobjsonline.objmgr);
    }
    if (netmgrs.length <= 0) return null;

    for (let netmgr of netmgrs) {
        let netobjs = netmgr.GetNetObjects();
        for (let k in netobjs) {
            // noinspection JSUnfilteredForInLoop
            let obj = netobjs[k];
            if (obj.__cls__ === "KF8NetDebugObject") {
                this.debugNetObj = obj;
                break;
            }
        }
        if (this.debugNetObj) {
            let self = this;
            netmgr.Event.on("OnDisconnected", function() {
                self.debugNetObj = null;
                self.Event.emit("DebugObjChanged");
            });
            netmgr.Event.on("OnNetObjDestroy", function(obj) {
                if (obj && self.debugNetObj && obj.ID === self.debugNetObj.ID) {
                    self.debugNetObj = null;
                    self.Event.emit("DebugObjChanged");
                }
            });
            break;
        }
    }

    return this.debugNetObj;
}

EditorNetworkMgr.prototype.NotifyNetSwitchUI = function (event, param) {
    if (this.netDebug) {
        let info = { Type: event, Data: param }
        this.netDebug.NotifyNetDebug("NetSwitchIPC", info);
    }
}

EditorNetworkMgr.prototype.NotifyNetDebug = function (event, param) {
    if (this.netDebug) {
        let info = { Type: event, Data: param }
        this.netDebug.NotifyNetDebug("NetDebugIPC", info);
    }
}
