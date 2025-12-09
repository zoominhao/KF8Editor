KFDEditor.prototype.SetEmbeddedScriptStyle = function (parentprop, kv, kvkfd) {
    if (DynExecWrapperTool.IsDynExecData(kv)) {
        kv = kv.Script;
        if (kv && kv.hasOwnProperty("__cls__")) {
            kvkfd = this.kfdtable.get_kfddata(kv.__cls__);
        }
    }

    let name = "";
    let cname = "";
    if (kvkfd) {
        name = KFDEditor._GetKFDLable(kvkfd);
        cname = kvkfd.cname;
    }
    if(parentprop) {
        if(parentprop.type === "mixarr" && parentprop.otype === "KFScriptData") {
            name = "<font color='#ffff00'>" + name + "</font>";
        }
    }
    if (!cname && kv && kv.name) {
        name += " <b>[" + kv.name + "]</b>";
    }
    return name;
}
