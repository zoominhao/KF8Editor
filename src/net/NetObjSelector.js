function NetObjSelector() {
    let self = this;

    this.editorNetworkMgr = null;

    this.netObjsUI = $("#netobjs");

    this.netObjsUI.combobox({
        onSelect:function (record) {
            if (record) {
                self.lastSelectedInfo = self.selectedInfo;
                self.selectedInfo = record.info;
                self.SetRemoteObjectInfo();
            }
        },
        onLoadSuccess:function () {
            $(".combobox-item").css({"white-space":"nowrap"});
        }
    });

    this.data = null;
    _global.Event.on("NetObjSelectorLoadData", function (data) {
        self.data = data;
        self.LoadData();
    });

    _global.Event.on("OnNewWindowStarted", function (info) {
        if (info && info.phase === "complete") {
            _global.EmitToContentsID(info.from, "NetObjSelectorLoadData", self.data);
        }
    });

    _global.Event.on("OnRemoteObjectSetInfo", function (info) {
        self.remoteObjectInfo = info;
        self.selectedInfo = null;
    });

    this.LoadData();
}

NetObjSelector.prototype.SetEditorNetworkMgr = function (mgr) {
    if (!mgr) return;
    this.editorNetworkMgr = mgr;
    let self = this;
    mgr.Event.on("OnNetworkChangeFinish", function () {
        if (mgr.rpcobjsoffline) {
            mgr.rpcobjsoffline.objmgr.Event.on("OnDisconnected", function () {
                self.RefreshNetObjs();
            });
            mgr.rpcobjsoffline.objmgr.Event.on("OnNetObjsChanged", function () {
                self.RefreshNetObjs();
            });
        }
        if (mgr.rpcobjsonline) {
            mgr.rpcobjsonline.objmgr.Event.on("OnDisconnected", function () {
                self.RefreshNetObjs();
            });
            mgr.rpcobjsonline.objmgr.Event.on("OnNetObjsChanged", function () {
                self.RefreshNetObjs();
            });
        }
        self.RefreshNetObjs();
    });
}

NetObjSelector.prototype.Start = function (context) {
    if (!context) return;

    let self = this;
    // context.Event.on("OnDataClear", function (blk) {
    //     self.LoadData();
    // });

    context.Event.on("OnDataSet", function (blk) {
        self.remoteObjectReady = true;
        self.LoadData();
    });
}

NetObjSelector.GetObjLabel = function (obj) {
    if (!obj) return "";
    return (!obj.UEName ? (!obj.Name ? "" : obj.Name) : obj.UEName) +
        "[" + obj.InstName + "]" + "(" + obj.ID + ")";
}

NetObjSelector.prototype.RefreshNetObjs = function () {
    let items = [];
    if (this.editorNetworkMgr) {
        let mgr = this.editorNetworkMgr;
        if (mgr.rpcobjsoffline) {
            let objs = mgr.rpcobjsoffline.objmgr.GetNetObjects();
            for (let id in objs) {
                // noinspection JSUnfilteredForInLoop
                let obj = objs[id];
                items.push({
                    label: NetObjSelector.GetObjLabel(obj) + '<编辑>',
                    value: {
                        id: obj.ID,
                        path: obj.Path,
                        hostname: mgr.rpcobjsoffline.objmgr.hostname,
                        instname: obj.Name + "_" + obj.ID
                    }
                });
            }
        }
        if (mgr.rpcobjsonline) {
            let objs = mgr.rpcobjsonline.objmgr.GetNetObjects();
            for (let id in objs) {
                // noinspection JSUnfilteredForInLoop
                let obj = objs[id];
                items.push({
                    label: NetObjSelector.GetObjLabel(obj) + '<游戏>',
                    value: {
                        id: obj.ID,
                        path: obj.Path,
                        hostname: mgr.rpcobjsonline.objmgr.hostname,
                        instname: obj.InstName
                    }
                });
            }
        }
    }
    _global.EmitToGlobal("NetObjSelectorLoadData", {Items: items});
}

NetObjSelector.prototype.FilterShowItems = function (items) {
    let filteredItems = [];
    filteredItems.push({label: '网络对象<空>', value: 0});
    if (!items) return filteredItems;
    let curblk = _global.editor.context.currentdata;
    let path = "";
    if (curblk) path = curblk.asseturl;
    if (!path) return filteredItems;
    for (let item of items) {
        if (item.value && item.value.path === path) {
            filteredItems.push({label: item.label, value: item.value.id, info: item.value});
        }
    }
    return filteredItems;
}

NetObjSelector.prototype.LoadData = function () {
    let items = null;
    if (this.data) {
        items = this.data.Items;
    }
    let filteredItems = this.FilterShowItems(items);
    let selectedID = this.ChooseTheOne(filteredItems);
    this.netObjsUI.combobox("loadData", filteredItems);
    this.netObjsUI.combobox("select", selectedID);
}

NetObjSelector.prototype.ChooseTheOne = function (items) {
    let id = 0;
    let minDistance = Number.MAX_SAFE_INTEGER;
    let nearestID = 0;
    let minID = Number.MAX_SAFE_INTEGER;
    let info = null;
    let compareInstName = false;
    if (this.selectedInfo) {
        info = this.selectedInfo;
        compareInstName = true;
    } else if (this.remoteObjectInfo) {
        info = this.remoteObjectInfo;
        compareInstName = false;
    } else if (this.lastSelectedInfo) {
        info = this.lastSelectedInfo;
        compareInstName = true;
    }
    if (info) {
        let sid = info.id;
        let instname = info.instname;
        for (let item of items) {
            if (!item.info) continue;
            if (compareInstName && instname && item.info.instname === instname) {
                id = item.info.id;
                break;
            } else if (!compareInstName && sid && item.info.id === sid) {
                id = item.info.id;
                break;
            } else if (sid) {
                let dis = Math.abs(item.info.id - sid);
                if (dis < minDistance) {
                    minDistance = dis;
                    nearestID = item.info.id;
                }
            }
        }
    } else {
        for (let item of items) {
            if (!item.info) continue;
            minID = item.info.id < minID ? item.info.id : minID;
        }
    }

    if (id) return id;
    else if (nearestID) return nearestID;
    else if (minID < Number.MAX_SAFE_INTEGER) return minID;

    return 0;
}

NetObjSelector.prototype.SetRemoteObjectInfo = function () {
    let sinfo = this.selectedInfo;
    if (sinfo) {
        if (this.remoteObjectInfo && this.remoteObjectInfo.id === sinfo.id) return;
        if (this.lastSelectedInfo && this.lastSelectedInfo.id === sinfo.id &&
            this.lastSelectedInfo.instname === sinfo.instname) return;
    }

    let info = {};
    if (sinfo) {
        info.hostname = sinfo.hostname;
        info.id = sinfo.id;
        info.path = sinfo.path;
    }
    _global.Event.emit("SetRemoteObjectInfo", info);
    if (this.remoteObjectReady) {
        _global.Event.emit("RemoteObjectUpdateState");
    }
}
