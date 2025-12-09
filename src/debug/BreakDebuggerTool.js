// BreakDebugger工具独立出来
function BreakDebuggerTool() {
}

BreakDebuggerTool.NotifyMain = function (event, param) {
    let info = { Type: event, Data: param }
    _global.EmitToMainGlobal("BreakDebuggerIPC", info);
}

BreakDebuggerTool.NotifyGlobal = function (event, param) {
    let info = { Type: event, Data: param }
    _global.EmitToGlobal("BreakDebuggerIPC", info);
}

BreakDebuggerTool.BreakPointKeys = {
    "KF8TimelineScriptBreakPoint" : {"AssetURL":0, "StateId":0, "LayerId":0, "FrameId":0, "ScriptId":0, "FieldPath":0},
    "KF8GraphScriptBreakPoint" : {"AssetURL":0, "NodeName":0, "ScriptId":0, "FieldPath":0},
    "KF8GraphNodeBreakPoint" : {"AssetURL":0, "NodeName":0},
    "KF8VMCodeBreakPoint": {"ScriptBreakPoint":1, "Line":0}
}

BreakDebuggerTool.IsBreakPointEqual = function(bp1, bp2) {
    if (!bp1 && !bp2) return true;
    if (!bp1 || !bp2) return false;
    if (bp1.__cls__ !== bp2.__cls__) return false;

    let keys = BreakDebuggerTool.BreakPointKeys[bp1.__cls__];
    if (!keys) return false;

    let matched = true;
    for (let key of Object.keys(keys)) {
        let recursion = keys[key];
        if (recursion === 0) {
            if (bp1[key] !== bp2[key]) {
                matched = false;
                break;
            }
        } else {
            if (!BreakDebuggerTool.IsBreakPointEqual(bp1[key], bp2[key])) {
                matched = false;
                break;
            }
        }
    }
    return matched;
}

BreakDebuggerTool.IsInBreakPoints = function(bps, bp) {
    let notin = true;
    for (let item of bps) {
        if (BreakDebuggerTool.IsBreakPointEqual(bp, item)) {
            notin = false;
            break;
        }
    }
    return !notin;
}

BreakDebuggerTool.MakeKFDObject = function (cls, context) {
    let kv = {};
    kv.__cls__ = cls;

    if (!context && _global.editor) {
        context = _global.editor.context;
    }

    if (context) {
        let kvkfd = context.kfdtable.get_kfddata(kv.__cls__);
        KFDJson.init_object(kv, kvkfd);
    }

    return kv;
}

BreakDebuggerTool.ToCharFormat = function (str) {
    return "'" + str + "'";
}

BreakDebuggerTool.ToStringFormat = function (str) {
    return '"' + str + '"';
}

BreakDebuggerTool.ToHexFormat = function (str) {
    return '[' + str  + ']';
}

BreakDebuggerTool.ToBytesFormat = function (buffer) {
    let str = "[";
    for (let i = 0; i < buffer.length; ++i) {
        str += "0x"  + buffer.readInt8(i).toString(16)
        if (i + 1 < buffer.length) {
            str += " ";
        }
    }
    str += "]";
    return str;
}

BreakDebuggerTool.MonacoFromToBreakPoint = function (from, context) {
    if (from.hasOwnProperty("stateId")) {
        let kv = { __cls__: "KF8TimelineScriptBreakPoint" };
        let kvkfd = context.kfdtable.get_kfddata(kv.__cls__);
        KFDJson.init_object(kv, kvkfd);
        kv.AssetURL = from.asseturl;
        kv.StateId = from.stateId;
        kv.LayerId = from.layer;
        kv.FrameId = from.currentFrame;
        kv.ScriptId = from.seqId;
        kv.FieldPath = from.fieldPath;
        return kv;
    } else if (from.hasOwnProperty("graphNodeName")) {
        let kv = { __cls__: "KF8GraphScriptBreakPoint" };
        let kvkfd = context.kfdtable.get_kfddata(kv.__cls__);
        KFDJson.init_object(kv, kvkfd);
        kv.AssetURL = from.asseturl;
        kv.NodeName = from.graphNodeName;
        kv.ScriptId = from.seqId;
        kv.FieldPath = from.fieldPath;
        return kv;
    }
    return null;
}

BreakDebuggerTool.BreakPointToMonacoFrom = function (bp) {
    let from = null;
    if (bp.hasOwnProperty("StateId")) {
        from = {
            asseturl: bp.AssetURL,
            stateId: bp.StateId,
            layer: bp.LayerId,
            currentFrame: bp.FrameId,
            seqId: bp.ScriptId
        };
    } else if (bp.hasOwnProperty("NodeName")) {
        from = {
            asseturl: bp.AssetURL,
            graphNodeName: bp.NodeName,
            seqId: bp.ScriptId
        };
    }
    return from;
}
