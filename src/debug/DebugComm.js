_global.Event.on("OnFrameDataSetBreakPoint", function (fieldPath) {
    let kv = null;
    if (_global.editor.IsInTimeline()) {
        kv = {__cls__: "KF8TimelineScriptBreakPoint"};
        let kvkfd = _global.editor.context.kfdtable.get_kfddata(kv.__cls__);
        KFDJson.init_object(kv, kvkfd);
        kv.AssetURL = _global.editor.blkdata.asseturl;
        kv.StateId = _global.stateId;
        kv.LayerId = _global.currentLayer;
        kv.FrameId = _global.currentFrame;
        kv.ScriptId = _global.seqId;
        if (fieldPath) kv.FieldPath = fieldPath;
        else kv.FieldPath = "";
    } else if (_global.editor.IsInGraph()) {
        kv = {__cls__: "KF8GraphScriptBreakPoint"};
        let kvkfd = _global.editor.context.kfdtable.get_kfddata(kv.__cls__);
        KFDJson.init_object(kv, kvkfd);
        kv.AssetURL = _global.editor.blkdata.asseturl;
        kv.NodeName = _global.currentGraphNodeName;
        kv.ScriptId = _global.seqId;
        if (fieldPath) kv.FieldPath = fieldPath;
        else kv.FieldPath = "";
    }
    if (kv) {
        _global.EmitToMainGlobal("OnSetBreakPoints", [kv]);
    }
});
