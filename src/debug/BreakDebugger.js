function BreakDebugger(context){
    let self = this;

    this.context = context;

    this.localBreakPoints = [];
    this.hitBreakPoint = null;

    this.watchVars = [];

    this.debugResumeUI = $('#debugresume');
    // this.debugStopUI = $('#debugstop');
    this.debugByStepUI = $('#debugbystep');

    this.debugTabs = $('#debugtabs');

    this.debugBpsTblUI = $('#debugbpstbl');

    this.watchVarTypeUI = $('#watchvartype');
    this.watchVarPathUI = $('#watchvarpath');
    this.addWatchVarUI = $('#addwatchvar');
    this.removeWatchVarUI = $('#removewatchvar');
    this.refreshWatchVarsUI = $('#refreshwatchvars');
    this.debugWatchVarTblUI = $('#watchvartable');

    // 网络切换相关的也先放这里
    this.remoteDebugUI = $("#remoteDebug");

    this.debugResumeUI.on('click', function() {
        if (self.debugResumeUI.linkbutton('options').disabled) return;
        self.SendResume();
        self.SetDebugBreakHit(null);
    });

    // this.debugStopUI.on('click', function() {
    //     if (self.debugStopUI.linkbutton('options').disabled) return;
    //     self.debuggerStop = !self.debuggerStop;
    //     self.SendStop(self.debuggerStop);
    // });

    this.debugByStepUI.on('click', function () {
        if (self.debugByStepUI.linkbutton('options').disabled) return;
        self.lastHitBreakPoint = self.hitBreakPoint;
        self.SendByStep();
        self.SetDebugBreakHit(null);
    });

    this.debugTabs.tabs({
        onSelect: function (title, index) {
            if (title === "变量列表") {
                self.RefreshWatchVars();
            } else if (title === "断点列表") {
                self.RefreshBreakPoints();
            }
        }
    });

    this.initBps();

    this.initWatchVars();

    this.status = "disconnected";

    this.debuggerStop = false;

    BreakDebugger.CurrenBreakDebugger = this;

    this.codeDebugger = new CodeDebugger(this.context, this);

    this.initLocalSavedData();

    this.initIPCEvents();

    BreakDebuggerTool.NotifyMain("DebugObjCheck");
}

BreakDebugger.prototype.Dispose = function () {
    this.localBreakPoints = null;
    this.hitBreakPoint = null;

    _global.Event.removeAllListeners("BreakDebuggerIPC");

    this.debugResumeUI = null;
    // this.debugStopUI = null;
    this.debugByStepUI = null;

    this.debugBpsTblUI = null;

    this.watchVarTypeUI = null;
    this.watchVarPathUI = null;
    this.addWatchVarUI = null;
    this.removeWatchVarUI = null;
    this.refreshWatchVarsUI = null;
    this.debugWatchVarTblUI = null;
    this.debugRefreshWatchVarsUI = null;

    this.watchObjectWin = null;
    if (this.codeDebugger) {
        this.codeDebugger.Dispose();
        this.codeDebugger = null;
    }
}

BreakDebugger.prototype.initIPCEvents = function () {
    let self = this;
    _global.Event.on("BreakDebuggerIPC", function (info) {
        if (info) {
            switch (info.Type) {
                case "BreakDebuggerEvent": {
                    let arg = info.Data;
                    if (!arg || !arg.event) return;
                    let func = self[arg.event];
                    if (func) {
                        func.call(self, arg.data);
                    }
                    break;
                }
                case "UpdateStatus": {
                    self.UpdateStatus(info.Data);
                    break;
                }
                case "DebugBreakHit": {
                    self.OnDebugBreakHit(info.Data);
                    break;
                }
                case "BreakInfo": {
                    let data = info.Data;
                    if (data && data.BreakPoints) {
                        self.AddToLocalBreakPoints(data.BreakPoints);
                        self.CheckSyncBreakPoints(data.BreakPoints);
                        self.NotifyGlobalBreakInfo();
                        // 拉取断点等信息后，发送继续debug消息
                        self.SendStop(false);
                    }
                    break;
                }
                case "GetMsg": {
                    let data = info.Data;
                    if (data && data.Seq && data.Rsp) {
                        if (data.Seq in self.getMsgReqs) {
                            self.getMsgReqs[data.Seq].CallBack(...CommTool.Base64ToValues(data.Rsp));
                            delete self.getMsgReqs[data.Seq];
                        }
                    }
                    break;
                }
                default: break;
            }
        }
    });
}

BreakDebugger.prototype.UpdateStatus = function(status) {
    this.status = status;
    this.OnStatusChanged();
}

BreakDebugger.prototype.OnStatusChanged = function () {
    switch (this.status) {
        case 'disconnected': {
            this.SetDebugBreakHit(null);
            break;
        }
        case 'debugging': {
            this.debugTabs.tabs('select', 1);
            break;
        }
        default: break;
    }
    this.UpdateUI();
}

BreakDebugger.prototype.UpdateUI = function() {
    switch (this.status) {
        case 'disconnected': {
            this.debugResumeUI.linkbutton('disable');
            // this.debugStopUI.linkbutton('disable');
            this.debugByStepUI.linkbutton('disable');
            break;
        }
        case 'connected': {
            this.debugResumeUI.linkbutton('disable');
            // this.debugStopUI.linkbutton('enable');
            this.debugByStepUI.linkbutton('disable');
            break;
        }
        case 'running': {
            this.debugResumeUI.linkbutton('disable');
            // this.debugStopUI.linkbutton('enable');
            this.debugByStepUI.linkbutton('disable');
            break;
        }
        case 'debugging': {
            this.debugResumeUI.linkbutton('enable');
            // this.debugStopUI.linkbutton('enable');
            this.debugByStepUI.linkbutton('enable');
            this.RefreshWatchVars();
            break;
        }
        case 'debuggerstop': {
            this.debugResumeUI.linkbutton('disable');
            // this.debugStopUI.linkbutton('enable');
            this.debugByStepUI.linkbutton('disable');
            break;
        }
        default: break;
    }
}

BreakDebugger.prototype.AddToLocalBreakPoints = function(bps) {
    for (let bp of bps) {
        if (!BreakDebuggerTool.IsInBreakPoints(this.localBreakPoints, bp)) {
            this.localBreakPoints.push(bp);
            this.OnDebugBreakPointAdd(bp);
        }
    }
}

BreakDebugger.prototype.UpdateLocalBreakPoint = function(bp) {
    if (!bp) return;
    let index = -1;
    for (let i in this.localBreakPoints) {
        let item = this.localBreakPoints[i];
        if (BreakDebuggerTool.IsBreakPointEqual(item, bp)) {
            index = i;
            break;
        }
    }

    if (index === -1) {
        this.localBreakPoints.push(bp);
        this.OnDebugBreakPointAdd(bp);
        return 0;
    } else {
        this.localBreakPoints.splice(index, 1);
        this.OnDebugBreakPointDel(bp);
        return 1;
    }
}

BreakDebugger.prototype.ClearLocalBreakPoints = function () {
    let oldbps = this.localBreakPoints;
    this.localBreakPoints = [];
    this.OnDebugBreakPointChanged(1, oldbps);
}

BreakDebugger.prototype.SetLocalBreakPointEnable = function (bp, enable) {
    bp.Enabled = enable;
    this.OnDebugBreakPointChanged(enable ? 0 : 1, [bp]);
}

BreakDebugger.prototype.SetBpsTblEnable = function (enable) {
    let bps = this.localBreakPoints;
    let op = "uncheckNode";
    if (enable) op = "checkNode";
    for (let i in bps) {
        let bp = bps[i];
        bp.Enabled = enable;
        let id = parseInt(i) + 1;
        this.debugBpsTblUI.treegrid(op, id);
    }
    this.OnDebugBreakPointChanged(enable ? 0 : 1, bps);
}

BreakDebugger.prototype.CheckSyncBreakPoints = function (breakpoints) {
    // let toadds = [];
    // let todels = [];
    // for (let lbp of this.localBreakPoints) {
    //     if (!BreakDebuggerTool.IsInBreakPoints(breakpoints, lbp)) {
    //         toadds.push(lbp);
    //     }
    // }
    // for (let bp of breakpoints) {
    //     if (!BreakDebuggerTool.IsInBreakPoints(this.localBreakPoints, bp)) {
    //         todels.push(bp);
    //     }
    // }
    // for (let bp of toadds) {
    //     this.SendBreakPoint(0, bp);
    // }
    // for (let bp of todels) {
    //     this.SendBreakPoint(1, bp);
    // }
    this.SendBreakPoints();
}

BreakDebugger.prototype.PreProcBreakPoint = function (bp) {
    if (!bp) return false;
    if (this.codeDebugger.IsVMCodeBreakPoint(bp)) {
        return this.codeDebugger.PreProcVMCodeBreakPoint(bp);
    }
    return true;
}

BreakDebugger.prototype.OnSetBreakPoints = function(bps) {
    if (bps) {
        for (let bp of bps) {
            if (!this.PreProcBreakPoint(bp)) continue;
            this.UpdateLocalBreakPoint(bp);
        }
        this.CheckLocalBreakPointsConsistency();
        this.SendBreakPoints();
    }
}

BreakDebugger.prototype.OnDebugBreakHit = function (msg) {
    if (msg && msg.BreakPoint) {
        let bp = msg.BreakPoint;
        this.SetDebugBreakHit(bp);
        if (!this.byStep) {
            this.UpdateStatus("debugging");
        }
    }
}

BreakDebugger.prototype.SetDebugBreakHit = function(bp) {
    let oldbp = this.hitBreakPoint;
    this.hitBreakPoint = bp;
    if (!bp) {
        this.codeDebugger.OnVMCodeBreakPointHit(bp);
        _global.EmitToGlobal("OnDebugBreakPointHitToGlobals", {newbp: bp, oldbp: oldbp});
    } else if (bp.__cls__ === "KF8VMCodeBreakPoint") {
        if (this.byStep &&
            this.lastHitBreakPoint &&
            BreakDebuggerTool.IsBreakPointEqual(this.lastHitBreakPoint.ScriptBreakPoint, bp.ScriptBreakPoint) &&
            this.codeDebugger.CheckByStepContinue(this.lastHitBreakPoint, bp)) {
            this.SendByStep();
            // 还原为之前的断点
            this.hitBreakPoint = oldbp;
            return;
        }
        this.codeDebugger.OnVMCodeBreakPointHit(bp);
    } else {
        _global.EmitToGlobal("OnDebugBreakPointHitToGlobals", {newbp: bp, oldbp: oldbp});
    }
    this.RefreshBreakPoints();
    if (bp) this.byStep = null;
}

BreakDebugger.prototype.OnDebugBreakPointAdd = function(bp) {
    this.OnDebugBreakPointChanged(0, [bp]);
}

BreakDebugger.prototype.OnDebugBreakPointDel = function(bp) {
    this.OnDebugBreakPointChanged(1, [bp]);
}

BreakDebugger.prototype.OnDebugBreakPointChanged = function (op, opbps) {
    this.localToSavedDataChanged = true;
    this.RefreshAndNotifyBreakPoints(op, opbps);
}

BreakDebugger.prototype.RefreshAndNotifyBreakPoints = function (op, opbps) {
    this.RefreshBreakPoints();
    _global.EmitToGlobal("OnDebugBreakPointsChangedToGlobals", {"op": op, "opbps": opbps, "bps": this.localBreakPoints});
    this.codeDebugger.NotifyBreakPoints(this.localBreakPoints);
}

BreakDebugger.prototype.RefreshBreakPoints = function () {
    this.debugBpsTblUI.treegrid("loadData", this.GetLocalBPsTreeGridData());
}

// BreakDebugger.GetDebugNetObj = function() {
//     return _global.editor.network.GetDebugNetObj();
// }

BreakDebugger.prototype.SendMsg = function (funcname, ...args) {
    let info = {Function: funcname, Args: CommTool.ValuesToBase64(args)};
    BreakDebuggerTool.NotifyMain("SendMsg", info);
}

BreakDebugger.incrSeq = 0;
BreakDebugger.prototype.GetMsg = function (funcname, callbackfunc, ...args) {
    let self = this;
    BreakDebugger.incrSeq += 1;
    let seq = BreakDebugger.incrSeq;
    let info = {Seq: seq,  Function: funcname, Args: CommTool.ValuesToBase64(args)};
    if (!this.getMsgReqs) {
        this.getMsgReqs = {};
    }
    let callback = function (...params) {
        callbackfunc(...params);
    }
    this.getMsgReqs[seq] = {CallBack: callback, Data: info};
    setTimeout(function () {
        if (seq in self.getMsgReqs) {
            self.getMsgReqs[seq].CallBack(null);
            delete self.getMsgReqs[seq];
        }
    }, 3000);
    BreakDebuggerTool.NotifyMain("GetMsg", info);
}

BreakDebugger.prototype.SendByStep = function () {
    this.byStep = true;
    this.SendMsg("ByStep", BreakDebuggerTool.MakeKFDObject("KF8BreakByStep", this.context));
    this.UpdateStatus("running");
}

// BreakDebugger.prototype.SendBreakPoint =  function (...args) {
//     this.SendMsg("BreakPoint", ...args);
// }

BreakDebugger.prototype.SendBreakPoints =  function () {
    let self = this;
    let msg = BreakDebuggerTool.MakeKFDObject("KF8DebugBreakInfo", this.context);
    msg.BreakPoints = this.localBreakPoints.filter(function (bp) {
        if (!bp.hasOwnProperty("Enabled") || bp.Enabled) {
            if (!self.codeDebugger.IsVMCodeBreakPoint(bp) ||
                self.codeDebugger.IsCurrMonacoFromMatched(bp.ScriptBreakPoint)) {
                return true;
            }
        }
    });
    this.SendMsg("BreakPoints", msg);
}

BreakDebugger.prototype.SendResume = function () {
    this.SendMsg("Resume");
    this.UpdateStatus("running");
}

BreakDebugger.prototype.SendStop = function (stop) {
    let msg = BreakDebuggerTool.MakeKFDObject("KF8DebuggerStop", this.context);
    msg.Stop = stop;
    this.SendMsg("DebuggerStop", msg);
    if (stop) this.UpdateStatus("debuggerstop");
}

BreakDebugger.prototype.AddWatchVar = function (type, varPath) {
    for (let item of this.watchVars) {
        if (item.vartype === type && item.varpath === varPath) {
            //Nt("变量已存在");
            this.RefreshWatchVars();
            return;
        }
    }
    this.watchVars.push({vartype: type, varpath: varPath});
    this.OnWatchVarsChanged();
}

BreakDebugger.prototype.initWatchVars = function () {
    let self = this;
    this.addWatchVarUI.on('click', function () {
        let type = self.watchVarTypeUI.combobox('getValue');
        if (!type) {
            Nt("请选择变量类型");
            return;
        }
        let varPath = self.watchVarPathUI.textbox('getText');
        if (!varPath) {
            Nt("请输入变量名");
            return;
        }
        self.AddWatchVar(type, varPath);
    });
    this.removeWatchVarUI.on('click', function () {
        let node = self.debugWatchVarTblUI.treegrid('getSelected');
        if (node && node.srcvar) {
            for (let i in self.watchVars) {
                let srcvar = self.watchVars[i];
                if (srcvar.vartype === node.srcvar.vartype && srcvar.varpath === node.srcvar.varpath) {
                    self.watchVars.splice(i, 1);
                    self.OnWatchVarsChanged();
                    break;
                }
            }
        }
    });
    this.refreshWatchVarsUI.on('click', function () {
        self.RefreshWatchVars();
    });
    this.watchObjectWin = new KFDEdtWrapWindow($('#debugwatchobjectwin'), this.context.kfdtable);

    _global.Event.on("WatchVar", function (info) {
        if (info && info.vartype && info.varpath) {
            self.AddWatchVar(info.vartype, info.varpath);
        }
    })
}

BreakDebugger.prototype.GetWatchVarsTreeGridData = function (vars) {
    let nodes = [];

    let getVar = function (type, path) {
        for (let v of vars) {
            if (v.Type === type && v.Path === path) {
                return v;
            }
        }
        return null;
    }

    for (let i in this.watchVars) {
        let srcvar = this.watchVars[i];
        let node = {};
        node.id = parseInt(i) + 1;
        node.name = srcvar.varpath;
        node.text = "INVALID";
        node.srcvar = srcvar;
        let v = getVar(srcvar.vartype, srcvar.varpath);
        if (v)
        {
            if (v.Type === "object" && !v.ObjectValue) {
                node.text = "NULL";
            }
            if (v.Valid) {
                node.text = "[" + v.Type + "] ";
                switch (v.Type) {
                    case "int": {
                        node.text += v.IntValue.toString();
                        break;
                    }
                    case "float": {
                        node.text += v.FloatValue.toString();
                        break;
                    }
                    case "string": {
                        node.text += v.StrValue;
                        break;
                    }
                    case "object": {
                        let cls = "unknown";
                        if (v.ObjectValue.__cls__) {
                            cls = v.ObjectValue.__cls__;
                        }
                        node.text += cls + "[<a href='javascript:" + "BreakDebugger.WatchObjectVar(" + node.id.toString() + ")'>查看</a>]";
                        node.value = v.ObjectValue;
                        break;
                    }
                    default:
                        break;
                }
            }
        }
        nodes.push(node);
    }
    return nodes;
}

BreakDebugger.WatchObjectVar = function (id) {
    let curr = BreakDebugger.CurrenBreakDebugger;
    if (curr && curr.debugWatchVarTblUI) {
        let node = curr.debugWatchVarTblUI.treegrid('find', id);
        if (node && node.value && curr.watchObjectWin) {
            let inprops = {};
            if (node.value.__cls__) {
                inprops = curr.watchObjectWin.KFDEdt.CreateMetaEditDef(node.value.__cls__).data;
            }
            curr.watchObjectWin.open({src: node.value, inprops: inprops})
        }
    }
}

BreakDebugger.prototype.OnWatchVarsChanged = function () {
    this.localToSavedDataChanged = true;
    this.RefreshWatchVars();
}

BreakDebugger.prototype.RefreshWatchVars = function () {
    let self = this;

    let msg = BreakDebuggerTool.MakeKFDObject("KF8DebugWatchVarsReq", this.context);
    msg.Vars = [];
    for (let wv of this.watchVars) {
        let item = BreakDebuggerTool.MakeKFDObject("DebugWatchVarReqItem", this.context);
        item.Type = wv.vartype;
        item.Path = wv.varpath;
        msg.Vars.push(item);
    }
    this.GetMsg("WatchVars", function (rsp) {
        let vars = [];
        if (rsp && rsp.Vars) {
            vars = rsp.Vars;
        }
        self.debugWatchVarTblUI.treegrid("loadData", self.GetWatchVarsTreeGridData(vars));
    }, msg);
}

BreakDebugger.prototype.initBps = function () {
    let self = this;

    this.debugBpsTblUI.treegrid({
        rowStyler: function(row) {
            let ret = "";
            if (row.invalid) {
                ret = 'font-style:italic;text-decoration:line-through;';
            }
            if (self.hitBreakPoint && row.value && BreakDebuggerTool.IsBreakPointEqual(self.hitBreakPoint, row.value)) {
                ret += 'color:yellow;font-weight:bold';
            }
            return ret;
        },
        checkbox: function (row) {
            if (row && row.value) {
                if (row.nocheckbox) {
                    return false;
                }
                return true;
            }
            return false;
        },
        onCheckNode: function (row, checked) {
            if (row && row.value && row.value.Enabled !== checked) {
                self.SetLocalBreakPointEnable(row.value, checked);
                self.SendBreakPoints();
            }
        },
        onContextMenu: function(e, node){
            e.preventDefault();
            BreakDebugger._contextMenuSelected = node;
            $('#debugbpsmenu').menu('show', {
                left: e.pageX,
                top: e.pageY
            });
        },
        onDblClickRow: function (row) {
            if (row && row.value && row.value.AssetURL && row.value.AssetURL) {
                let v = row.value;
                let pathsuffix = v.AssetURL;
                let param = {};
                switch (row.value.__cls__) {
                    case "KF8TimelineScriptBreakPoint": {
                        params = {
                            'StateId' : v.StateId,
                            'LayerId' : v.LayerId,
                            'FrameId' : v.FrameId,
                            'ScriptId' : v.ScriptId,
                            'FieldPath' : v.FieldPath
                        }
                        break;
                    }
                    case "KF8GraphScriptBreakPoint": {
                        params = {
                            'NodeName' : v.NodeName,
                            'ScriptId' : v.ScriptId,
                            'FieldPath' : v.FieldPath
                        }
                        break;
                    }
                    case "KF8GraphNodeBreakPoint": {
                        params = {
                            'NodeName' : v.NodeName,
                        }
                        break;
                    }
                    default:
                        break;
                }
                pathsuffix += "?" + new URLSearchParams(params).toString();
                let appdir = self.context ? self.context.appdatapath : "";
                _global.Event.emit("OnBlkOpenNew", {path: appdir + "/" + pathsuffix, asseturl:v.AssetURL});
            }
        }
    })
}

BreakDebugger.breakPointShowKeys = {
    'KF8TimelineScriptBreakPoint': ['__cls__', 'AssetURL', 'StateId', 'LayerId', 'FrameId', 'ScriptId', 'FieldPath'],
    'KF8GraphScriptBreakPoint': ['__cls__', 'AssetURL', 'NodeName', 'ScriptId', 'FieldPath'],
    'KF8GraphNodeBreakPoint': ['__cls__', 'AssetURL', 'NodeName'],
    'KF8VMCodeBreakPoint': ['__cls__', 'Line', 'CodeStart', 'CodeEnd', 'ScriptBreakPoint'],
};

BreakDebugger.newBreakPointKeyChildren = function (id, bp, ignoreHead) {
    let children = [];
    let keys = Object.keys(bp);
    if (bp && bp.__cls__ && BreakDebugger.breakPointShowKeys.hasOwnProperty(bp.__cls__)) {
        keys = BreakDebugger.breakPointShowKeys[bp.__cls__];
    }
    let texts = [];
    for (let k in keys) {
        let key = keys[k];
        if (["type", "Enabled"].includes(key)) {
            continue;
        }
        let text = bp[key];
        let child = {
            id: id * 100 + parseInt(k) + 1,
            name: key,
            text: text,
            checked: false
        };
        if (Object.prototype.toString.call(text) === '[object Object]') {
            let childrenInfo = BreakDebugger.newBreakPointKeyChildren(child.id, text, true);
            text = childrenInfo.text;
            child.text = text;
            child.children = childrenInfo.children;
        }
        children.push(child);
        if (key === "__cls__") {
            if (!ignoreHead) {
                if (text === "KF8TimelineScriptBreakPoint") {
                    texts.splice(0, 0, "[TimelineScript]");
                } else if (text === "KF8GraphScriptBreakPoint") {
                    texts.splice(0, 0, "[GraphScript]");
                } else if (text === "KF8GraphNodeBreakPoint") {
                    texts.splice(0, 0, "[GraphNode]");
                } else if (text === "KF8VMCodeBreakPoint") {
                    texts.splice(0, 0, "[Code]");
                }
            }
        } else {
            texts.push(text);
        }
    }
    return {children: children, text: texts.join(' ')};
}

BreakDebugger.newBreakPointTreeNode = function (i, bp) {
    let node = {};
    node.id = i + 1;
    node.name = i.toString();
    node.state = "closed"
    node.value = bp;
    let childrenInfo = BreakDebugger.newBreakPointKeyChildren(node.id, bp);
    node.children = childrenInfo.children;
    node.text = childrenInfo.text;
    return node;
}

BreakDebugger.prototype.GetLocalBPsTreeGridData = function () {
    let nodes = [];
    let ishitIn = false;
    for (let i = 0; i < this.localBreakPoints.length; ++i) {
        let bp = this.localBreakPoints[i];
        if (this.hitBreakPoint && BreakDebuggerTool.IsBreakPointEqual(this.hitBreakPoint, bp)) {
            ishitIn = true;
        }
        let node = BreakDebugger.newBreakPointTreeNode(i, bp);
        node.checked = !bp.hasOwnProperty("Enabled") || bp.Enabled;
        node.invalid = (this.codeDebugger.IsVMCodeBreakPoint(bp) &&
            !this.codeDebugger.IsCurrMonacoFromMatched(bp.ScriptBreakPoint));
        nodes.push(node);
    }
    // 如果当前断点不在列表里，加进去
    if (this.hitBreakPoint && !ishitIn) {
        let node = BreakDebugger.newBreakPointTreeNode(this.localBreakPoints.length, this.hitBreakPoint);
        node.nocheckbox = true;
        nodes.push(node);
    }
    return nodes;
}

BreakDebugger.RemoveBreakPoint = function () {
    let node = BreakDebugger._contextMenuSelected;
    if (node && node.value) {
        let inst = BreakDebugger.CurrenBreakDebugger;
        if (inst) {
            inst.UpdateLocalBreakPoint(node.value);
            inst.SendBreakPoints();
        }
    }
}

BreakDebugger.RemoveAllBreakPoints = function () {
    let inst = BreakDebugger.CurrenBreakDebugger;
    if (inst) {
        inst.ClearLocalBreakPoints();
        inst.SendBreakPoints();
    }
}

BreakDebugger.EnableAllBreakPoints = function (enable) {
    let inst = BreakDebugger.CurrenBreakDebugger;
    if (inst) {
        inst.SetBpsTblEnable(enable);
        inst.SendBreakPoints();
    }
}

BreakDebugger.prototype.initLocalSavedData = function () {
    let self = this;
    this.localSavedDataFinished = false;

    const savedDir = "Saved";
    const savedFileName = savedDir + "/debugger_data.json";

    let savedFileSucc = function () {
        self.localSavedDataFinished = true;
    }

    let savedFile = function () {
        let savedObj = {BreakPoints: self.localBreakPoints, WatchVars: self.watchVars};
        IKFFileIO_Type.instance.asyncSaveFile(savedFileName, JSON.stringify(savedObj), function (ret) {
            if (ret) {
                savedFileSucc();
            }
        });
    }

    let onLoadSavedFileSucc = function () {
        self.RefreshAndNotifyBreakPoints(0, self.localBreakPoints);
        self.RefreshWatchVars();
    }

    IKFFileIO_Type.instance.asyncLoadFile(savedFileName, function (ret, data, path) {
        if (ret) {
            let strData = data.toString();
            let savedObj = JSON.parse(strData);
            if (savedObj) {
                if (savedObj.BreakPoints) {
                    self.localBreakPoints = savedObj.BreakPoints;
                }
                if (savedObj.WatchVars) {
                    self.watchVars = savedObj.WatchVars;
                }
                onLoadSavedFileSucc();
            }
            self.localSavedDataFinished = true;
        } else {
            LOG("{0} 文件不存在,自动创建", savedFileName);
            IKFFileIO_Type.instance.asyncCreateDir(savedDir, savedFile);
        }
    }, "text");

    setInterval(function () {
        if (self.localSavedDataFinished && self.localToSavedDataChanged) {
            self.localSavedDataFinished = false;
            self.localToSavedDataChanged = false;
            savedFile();
        }
    }, 1000);
}

// 节点内脚本断点与节点断点不能同时存在
BreakDebugger.prototype.CheckLocalBreakPointsConsistency = function () {
    let graphNodeBps = [];
    let graphScriptBps = [];
    for (let bp of this.localBreakPoints) {
        if (bp.__cls__ === "KF8GraphNodeBreakPoint") {
            graphNodeBps.push(bp);
        } else if (bp.__cls__ === "KF8GraphScriptBreakPoint") {
            graphScriptBps.push(bp);
        }
    }
    for (let nbp of graphNodeBps) {
        for (let sbp of graphScriptBps) {
            if (nbp.AssetURL === sbp.AssetURL && nbp.NodeName === sbp.NodeName) {
                this.UpdateLocalBreakPoint(nbp);
            }
        }
    }
}

BreakDebugger.prototype.NotifyGlobalBreakInfo = function () {
    _global.EmitToGlobal("OnDebugBreakPointHitToGlobals", {newbp: this.hitBreakPoint, oldbp: this.hitBreakPoint});
    _global.EmitToGlobal("OnDebugBreakPointsChangedToGlobals", {"op": 1, "opbps": this.localBreakPoints, "bps": this.localBreakPoints});
}

BreakDebugger.prototype.OnMainStarted = function () {
    this.UpdateStatus("disconnected");
    this.NotifyGlobalBreakInfo();
}

