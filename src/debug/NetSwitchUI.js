function NetSwitchUI() {
    let self = this;

    this.Event = new PIXI.utils.EventEmitter();

    this.connectRemoteServerUI = $("#connectRemoteServer");
    this.connectionHostsUI = $("#connectionHosts");

    this.connectRemoteServerUI.checkbox({
        onChange: function (checked) {
            self.connectionHostsUI.combobox("clear");
            self.connectionHostsUI.combobox({
                disabled: !checked
            });
            NetSwitchUI.NotifyMain("OnRemoteServerChange", {Checked: checked});
        }
    });

    this.connectionHostsUI.combobox({
        onSelect:function (host) {
            if (host) {
                NetSwitchUI.NotifyMain("OnConnectionHostsSelect", {Host: host.value});
            }
        }
    });

    this.InitIPCEvents();

    this.Event.on("connectionHostsLoadData", function (data) {
        if (data && data.Items) {
            self.connectionHostsUI.combobox("loadData", data.Items);
        }
    });

    this.Event.on("connectionHostsUnselect", function (data) {
        if (data && data.ConnectedHost) {
            self.connectionHostsUI.combobox("unselect", data.ConnectedHost);
        }
    });

    this.Event.on("connectionHostsSelect", function (data) {
        if (data && data.ConnectedHost) {
            self.connectionHostsUI.combobox("select", data.ConnectedHost);
        }
    });

    this.Event.on("LoadInfo", function (data) {
        if (data) {
            if (data.hasOwnProperty("RemoteServer")) {
                self.connectRemoteServerUI.checkbox(data.RemoteServer ? 'check' : 'uncheck');
            }
            if (data.HostItems) {
                self.connectionHostsUI.combobox("loadData", data.HostItems);
            }
            if (data.ConnectedHost) {
                self.connectionHostsUI.combobox("select", data.ConnectedHost);
            }
        }
    });

    NetSwitchUI.NotifyMain("RequestLoadInfo");
}

NetSwitchUI.prototype.InitIPCEvents = function () {
    let self = this;
    _global.Event.on("NetSwitchIPC", function (info) {
        if (info) {
            self.Event.emit(info.Type, info.Data);
        }
    });
}

NetSwitchUI.NotifyMain = function (event, param) {
    let info = { Type: event, Data: param }
    _global.EmitToMainGlobal("NetSwitchIPC", info);
}
