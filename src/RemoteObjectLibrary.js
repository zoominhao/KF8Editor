function RemoteObject(context) {
    let self = this;

    this.context = context;
    this.remoteinfo = null;
    this.ui = $("#ueplaying");
    this.boxDisplay = $("#ueBoxDisplay");
    this.disabled = true;
    this.frameIndex = 0;
    this.stateID = -1;
    this.lastremoteinfo = null;
    this.remotedebug = false;

    context.Event.on("OnDataSet", function () {
        self.UpdateState();
    });

    _global.Event.on("RemoteObjectUpdateState", function () {
        self.UpdateState();
    });

    this.plotOp = new PlotRemoteOP(this);

    this.ui.checkbox({
        onChange: function (checked) {
            self.Set("Editing", checked);
            //_global.editor.plotCtrl.ShowPlotOps(!checked);
            //_global.editor.todCtrl.ShowTODOps(!checked);
            _global.editor.IsPause = checked;
        }
    });

    this.boxDisplay.checkbox({
        onChange: function (checked) {
            self.Set("BoxDisplay", checked);
        }
    });

    _global.Event.on("OnFrameChange", function (frameindex) {
        if (!self.disabled) {
            self.frameIndex = frameindex;
            self.Set("FrameIndex", frameindex);
        }
    });

    _global.Event.on("OnStateChange", function (currentState) {
        if (!self.disabled) {
            self.stateID = currentState.id;
            self.Set("StateID", currentState.id);
        }
    });

    _global.Event.on("OnFrameBoxChange", function (framebox, currentFrame, stateid) {
        ///bytesarray
        let kfbytearr = new KFByteArray();
        KFDJson.write_value(kfbytearr, framebox);
        console.log(framebox, currentFrame, stateid);
        self.Set("KFFrameBox", kfbytearr.buffer, true);
    });

    _global.Event.on("OnKFBoxGenParam", function (boxparam) {
        ///bytesarray
        let kfbytearr = new KFByteArray();
        KFDJson.write_value(kfbytearr, boxparam);
        kfbytearr.SetPosition(0);
        self.Set("KFBoxGenParam", kfbytearr.buffer, true);
    });

    /*_global.Event.on("OnScriptindex", function (scriptindex) {
        if (!self.disabled) {
            self.Set("Scriptindex", scriptindex);
        }
    });*/

    _global.Event.on("OnTestFrameScript", function (script) {
        ///bytesarray
        let kfbytearr = new KFByteArray();
        KFDJson.write_value(kfbytearr, script);
        self.Set("KFFrameTestParam", kfbytearr.buffer, true);
    });

    _global.Event.on("OnBlkSaved", function (blkdata, content) {
        let kfbytearr = GetGlobalKFByteArray();
        let blk = blkdata.blk;
        if (blk) {
            kfbytearr.SetPosition(0);
            kfbytearr.length = 0;
            KFDJson.write_value(kfbytearr, blk);
            self.Set("KFMetaData", kfbytearr.buffer, true);
        }
        let graph = blkdata.graph;
        if (graph) {
            kfbytearr.SetPosition(0);
            kfbytearr.length = 0;
            KFDJson.write_value(kfbytearr, graph);
            self.Set("KFGraphConfig", kfbytearr.buffer, true);
        }
        let timeline = blkdata.timeline;
        if (timeline) {
            kfbytearr.SetPosition(0);
            kfbytearr.length = 0;
            KFDJson.write_value(kfbytearr, timeline);
            self.Set("KFTimelineConfig", kfbytearr.buffer, true);
        }
    });

    _global.Event.on("OnDebugDataChanged", function (info) {
        if (self.info && info.id === self.info.id && _global.graph) {
            _global.graph.UpdateDebugRuntime(info.data);
        }
    });

    _global.Event.on("OnDisconnected", function () {
        if (_global.graph) {
            _global.graph.UpdateDebugRuntime(null);
        }
    });

    _global.Event.on("OnRemoteDebugChange", function (remotedebug) {
        self.remotedebug = remotedebug;
        self.Set("DebugEnable", remotedebug);
    })

    _global.Event.on("OnNetObjDestroy", function (id) {
        if (self.info && self.info.id === id && _global.graph) {
            _global.graph.UpdateDebugRuntime(null);
        }
    })

    _global.Event.on("OnDebugBreakPointHitToGlobals", function(arg) {
        if (arg) {
            _global.debugHitBreakPoint = arg.newbp;
            _global.Event.emit("OnDebugBreakPointHit", arg);
        }
    });

    _global.Event.on("OnDebugBreakPointsChangedToGlobals", function(info) {
        if (info) {
            _global.debugBreakPoints = info.bps;
            _global.Event.emit("OnDebugBreakPointsChanged", info);
        }
    });

    _global.Event.on("OnNewWindowStarted", function (info) {
        if (info && info.phase === "init") {
            _global.EmitToContentsID(info.from, "OnDebugBreakPointHitToGlobals", {newbp: _global.debugHitBreakPoint});
            _global.EmitToContentsID(info.from, "OnDebugBreakPointsChangedToGlobals", {bps: _global.debugBreakPoints});
        }
    });

    _global.Event.on("SetRemoteObjectInfo", function (info) {
        self.SetInfo(info, true);
    });
}

RemoteObject.prototype.Set = function (name, value, isbytes, info=null) {
    if (info == null) {
        info = this.info;
    }
    if (info) {
        /// arg {id:, datas:[{name:"",value:}]}
        let data = {id: info.id, datas: [{name: name, isbytes: isbytes === true, value: value}]};
        data.ContentsID = _global.currentContentsID;
        _global.EmitToMainGlobal(info.hostname, data);
    }
}

RemoteObject.prototype.SetInfo = function (info, ignoreEvent = false) {
    this.lastremoteinfo = this.info;
    if (info.hostname) {
        this.info = info;
        this.ui.checkbox('enable');
        //this.boxDisplay.checkbox('enable');
        this.disabled = false;
        if (info.hasOwnProperty('remotedebug')) {
            this.remotedebug = info.remotedebug;
        }
    } else {
        this.info = null;
        this.disabled = true;
        this.ui.checkbox('disable');
        //this.boxDisplay.checkbox('disable');
    }
    if (!ignoreEvent) {
        _global.Event.emit("OnRemoteObjectSetInfo", this.info);
    }
}

RemoteObject.prototype.UpdateState = function () {
    let pause = this.ui.checkbox('options').checked;
    let boxDisplay = this.boxDisplay.checkbox('options').checked;
    if (this.stateID !== -1) {
        this.Set("StateID", this.stateID);
        this.Set("FrameIndex", this.frameIndex);
    }

    this.Set("Editing", pause);
    _global.editor.IsPause = pause;

    let plotCtrl = _global.editor.plotCtrl;
    if(plotCtrl) plotCtrl.ShowPlotOps(!pause);

    let todCtrl = _global.editor.todCtrl;
    if(todCtrl) todCtrl.ShowTODOps(!pause);

    this.Set("BoxDisplay", boxDisplay);

    if (this.lastremoteinfo) {
        this.Set("DebugEnable", false, false, this.lastremoteinfo);
    }
    if (this.info) {
        this.Set("DebugEnable", this.remotedebug);
    }
}

/////////////////////////////////
//////////////////////////////////

function RemoteObjectLibrary(domele, objmgr) {
    let self = this;

    this.ui = domele;
    this.objmgr = objmgr;
    this.remoteobjects = [];
    this.selectedID = 0;
    this.nodeOfContext = null;
    this.contentsIDs = {};
    this.netobjschanged = false;
    this.debugObj = null;
    this.Event = new PIXI.utils.EventEmitter();

    this.ui.tree(
        {
            onDblClick: function (node) {
                _global.Event.emit("OnBlkOpen", node);
                node.path.endsWith("id=99999999&hostname=UE4Editor") ? $("#ueBoxDisplay").checkbox('disable') : $("#ueBoxDisplay").checkbox('enable');
            },
            onClick: function (node) {
                if (node.value.hasOwnProperty("Selected")) {
                    node.value.Set("Selected", true);
                    //_global.Event.emit("OnSelectedChanged", true);
                }
            },
            onContextMenu: function (e, node) {
                e.preventDefault();
                _global.CopyValue = node.path;
                //"App/RARole0.blk?id=99999999&hostname=UE4Editor"
                //UE4Editor的99999999网络对象为角色（后面可能会追加特定目录为角色目录的过滤）
                let iseditor = _global.CopyValue.endsWith("hostname=UE4Editor");
                if (!iseditor) {
                    self.nodeOfContext = node;
                }

                let menuui = iseditor ? $('#remoteeditormenu') : $('#remoteruntimemenu');
                menuui.menu('show', {
                    left: e.pageX,
                    top: e.pageY
                });
            },
            onExpand: function (node) {
                //node.state = "open";
            },
            onCollapse: function (node) {
                //node.state = "closed";
            },
            formatter: function (node) {
                return '<span title="' + node.path + '"class="easyui-tooltip" >' + node.text + '</span>'
            },
            onLoadSuccess: function(node, data) {
                if (self.selectedID > 0) {
                    let n = domele.tree('find', self.selectedID);
                    if (n) {
                        domele.tree('select', n.target);
                    }
                }
            }
        });

    this.OnDisconnectedCallback = function () {
        self.UpdateRemoteObjects();
        for (let contentsID in self.contentsIDs) {
            _global.EmitToContentsID(parseInt(contentsID), "OnDisconnected");
        }
    };
    objmgr.Event.on("OnDisconnected", this.OnDisconnectedCallback);

    this.OnNetObjsChangedCallback = function () {
        //self.UpdateRemoteObjects();
        self.netobjschanged = true;
    };
    objmgr.Event.on("OnNetObjsChanged", this.OnNetObjsChangedCallback);

    objmgr.Event.on("OnNetObjAdd", function (obj) {
        if (obj.__cls__ === "KF8NetDebugObject") {
            self.debugObj = obj;
            self.Event.emit("DebugObjChanged");
            if (_global.editor && _global.editor.network) {
                _global.editor.network.Event.emit("DebugObjChanged");
            }
        }
        obj.Event.on("OnNameChanged", function (o) {
            self.netobjschanged = true;
        });
    })

    // 每秒刷新一次
    setInterval(function (){
        if (self.netobjschanged) {
            self.UpdateRemoteObjects();
            self.netobjschanged = false;
        }
    }, 1000);

    this.OnNetObjDestroyCallback = function (netobj) {
        for (let contentsID in self.contentsIDs) {
            let id = netobj.ID;
            if (id === self.contentsIDs[contentsID].id) {
                _global.EmitToContentsID(parseInt(contentsID), "OnNetObjDestroy", netobj.ID);
            }
        }
    }
    objmgr.Event.on("OnNetObjDestroy", this.OnNetObjDestroyCallback);

    ///其他地方来的事件 通知需要做什么
    this.OnHostNameCallback = function (arg) {
        /// arg {id:, datas:[{name:"",value:}]}
        let allObjects = objmgr.GetNetObjects();
        let netobject = allObjects[arg.id];
        if (netobject) {
            for (let pair of arg.datas) {
                let value = pair.value;
                if (pair.isbytes) {
                    value = new KFByteArray(value);
                }
                netobject.Set(pair.name, value);
                console.log("Set", pair.name, value);
                if (self.onSet) {
                    self.onSet(arg.id, pair.name, value, arg.ContentsID);
                }
            }
        }
    };
    _global.Event.on(objmgr.hostname, this.OnHostNameCallback);

    this.onSet = function(id, name, value, fromContentsID) {
        if (name === "DebugEnable") {
            let allObjects = objmgr.GetNetObjects();
            let netobject = allObjects[id];
            if (!netobject) return;
            if (value === true) {
                netobject.Event.on("OnDebugDataChanged", function () {
                    if (netobject.DebugData && netobject.DebugData.RuntimeData) {
                        let info = {id: id, data: netobject.DebugData.RuntimeData};
                        _global.EmitToContentsID(fromContentsID, "OnDebugDataChanged", info);
                    }
                });
                self.contentsIDs[fromContentsID] = {id: id, valid:true};
            } else {
                netobject.Event.removeAllListeners("OnDebugDataChanged");
                self.contentsIDs[fromContentsID] = {id: id, valid:false};
                let info = {id: id, data: null};
                _global.EmitToContentsID(fromContentsID, "OnDebugDataChanged", info);
            }
        }
    }

    _global.editor.network.Event.on("OnRemoteDebugChange", function (remoteDebug) {
        for (let contentsID in self.contentsIDs) {
            _global.EmitToContentsID(parseInt(contentsID), "OnRemoteDebugChange", remoteDebug);
        }
    });

    if (objmgr.IsSessionValid()) {
        objmgr.UpdateNetObjectsFromRemote(null);
    }
}

RemoteObjectLibrary.prototype.Dispose = function () {
    this.objmgr.Event.off("OnDisconnected", this.OnDisconnectedCallback);
    this.objmgr.Event.off("OnNetObjsChanged", this.OnNetObjsChangedCallback);
    _global.Event.off(this.objmgr.hostname, this.OnHostNameCallback);
    this.ui.tree({data:[]});
    this.ui = null;
    this.objmgr = null;
    this.remoteobjects = null;
    this.selectedID = 0;
    this.nodeOfContext = null;
    this.OnDisconnectedCallback = null;
    this.OnNetObjsChangedCallback = null;
    this.OnHostNameCallback = null;
}

RemoteObjectLibrary.prototype.UpdateRemoteObjects = function () {
    if (!this.objmgr) return;
    let allObjects = this.objmgr.GetNetObjects();
    let hostname = this.objmgr.hostname;
    this.remoteobjects.length = 0;
    this.selectedID = 0;
    let cache = {};

    for (let sid in allObjects) {
        let orgobj = allObjects[sid];
        let objinfo = cache[orgobj.ID];
        if (objinfo == null) objinfo = {};

        objinfo.id = orgobj.ID;
        objinfo.text = (!orgobj.UEName ? (!orgobj.Name ? "" : orgobj.Name) : orgobj.UEName) +
            "[" + orgobj.InstName + "]" + "(id=" + sid + ")";
        objinfo.path = orgobj.Path + "?id=" + orgobj.ID + "&hostname=" + hostname;
        objinfo.iconCls = orgobj.OwnControl ? "icon-ok" : "icon-filter";
        if(orgobj.Path && orgobj.Path.indexOf("Plot") !== -1)
        {
            objinfo.iconCls = "icon-large-clipart";
        }
        if(orgobj.Path && orgobj.Path.indexOf("TOD") !== -1)
        {
            objinfo.iconCls = "icon-large-clipart";
        }
        objinfo.value = orgobj;
        if (orgobj.Selected === true) {
            this.selectedID = orgobj.ID;
        }

        cache[orgobj.ID] = objinfo;

        let ParentID = orgobj.ParentID;

        if (ParentID !== 0) {
            let pinfo = cache[ParentID];
            if (pinfo == null) {
                pinfo = {children: []};
                cache[ParentID] = pinfo;
            } else if (pinfo.children == null) {
                pinfo.children = [];
            }
            if(pinfo.path && pinfo.path.indexOf("Plot") !== -1)
            {
                pinfo.iconCls = "icon-large-clipart";
            }
            else if(pinfo.path && pinfo.path.indexOf("TOD") !== -1)
            {
                pinfo.iconCls = "icon-large-clipart";
            }
            else
            {
                delete pinfo.iconCls;
            }
            
            pinfo.children.push(objinfo);
        } else {
            this.remoteobjects.push(objinfo);
        }
    }

    this.ui.tree({data: this.remoteobjects});
}

RemoteObjectLibrary.prototype.AsyncAccessRuntimeDataOfContext = function (after_get_data_func) {
    if (!this.nodeOfContext || !this.nodeOfContext.value) {
        return;
    }
    let node = this.nodeOfContext;
    if (node.value.__cls__ === 'KF8EditNetUELog') {
        if (!this.logwin) {
            this.logwin = new RemoteLogWindow();
        }
        this.logwin.Open(node.value);
        return null;
    } else {
        let info = {}
        node.value.Get("LogicObjectProperties", function (data) {
            if (data && after_get_data_func) {
                info.data = data;
                after_get_data_func(data);
            }
        })
        return function () {
            if (info.data) {
                let bytearray = new KFByteArray();
                KFDJson.write_value(bytearray, info.data);
                node.value.Set("LogicObjectProperties", bytearray);
            }
        }
    }
}
