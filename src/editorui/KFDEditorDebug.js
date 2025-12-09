KFDEditor.prototype.ProcDebugMenu = function (uidata, menuui) {
    let show = KFDEditor.IsDebugBreakable(uidata);
    let itemEl = $('#fieldbreakpoint')[0];
    if (itemEl) {
        let item = menuui.menu('getItem', itemEl);
        if (item) {
            if (show) $(item.target).show();
            else $(item.target).hide();
        }
    }
}

KFDEditor.IsDebugBreakable = function (uidata) {
    if (uidata && (uidata.vtype === KFDataType.OT_OBJECT || uidata.vtype === KFDataType.OT_MIXOBJECT)) {
        let otype = uidata._prop ? uidata._prop.otype : null;
        if (!uidata._prop && uidata._parent && uidata._parent._prop) {
            otype = uidata._parent._prop.otype;
        }
        let kfddata = uidata._editor.kfdtable.get_kfddata(otype);
        if (kfddata && uidata._editor.kfdtable.is_extend(kfddata, 'KFScriptData', true)) {
            return true;
        }
    }
    return false;
}

KFDEditor.fielddebugbreak = function (editor, dataid) {
    editor.DebugBreak(dataid);
}

KFDEditor.prototype.DebugBreak = function (dataid) {
    let uidata = this.builddatas[dataid];
    if (KFDEditor.IsDebugBreakable(uidata)) {
        let path = KFDEditTool.GetUIDataPath(uidata);
        if (path) {
            _global.Event.emit("OnFrameDataSetBreakPoint", path);
        }
    }
}
