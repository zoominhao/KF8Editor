KFDEditor.VarNameIndexBeginToken = '[';
KFDEditor.VarNameIndexEndToken = ']';
KFDEditor.VarNameMemberOpToken = '.';

KFDEditor.editswitchvar = function (editor, dataid, type) {
    editor.SwitchVar(dataid, type);
}

KFDEditor.prototype.SwitchVar = function (dataid, type) {
    let uidata = this.builddatas[dataid];
    DynExecWrapperTool.SwitchVar(uidata, type);
}

KFDEditor.formatterVarTextbox = function (editor, uidata, vtype, value, switchedVar) {
    if (!switchedVar) return value;
    let stylecssstr = "color:purple;border:4px solid #800080";
    let valuestr = switchedVar.varPath;
    if(_global.searchvalue && valuestr.indexOf(_global.searchvalue) !== -1) {
        stylecssstr = "color:red; ";
    }

    let methodstr = 'KFDEditor.endtextboxedit(KFDEditor.instance.'
        + editor.id
        + ',' + uidata.id
        + ', this,'
        + 'null)';

    valuestr = valuestr.replace(/\"/g, "&quot;");

    let onfocusinmethod = methodstr.replace("endtextboxedit", "starttextboxedit").replace('null', "''");
    return '<input class="easyui-textbox" style="width:100%;' + stylecssstr + '" onfocusin="' + onfocusinmethod + '" onfocusout="' + methodstr + '" value="' + valuestr + '">';
}

KFDEditor.IsSwitchVarEnabled = function (inprops) {
    return inprops && inprops.__enable_switch_var__;
}

function DynExecWrapperTool() {
}

DynExecWrapperTool.IsDynExecData = function (data) {
    return data && data.__cls__ === "GSDynamicExecuteData";
}

DynExecWrapperTool.GetSrcData = function (uidata) {
    if (!uidata) return null;
    let srcData = {};
    srcData.src = uidata._src;
    let prop = uidata._prop;
    let index = uidata._arrayindex;
    srcData.name = prop ? prop.name : index != null ? index.toString(): "";
    return srcData;
}

DynExecWrapperTool.PrepareEditorData = function (data, kfddata, uiparentdata, editor) {
    if (!DynExecWrapperTool.IsDynExecData(data)) return null;
    if (!DynExecWrapperTool.CheckDynExeDataValid(data, editor, DynExecWrapperTool.GetSrcData(uiparentdata))) {
        if (!uiparentdata) {
            return {Invalid: true}
        } else {
            return {Data: data.Script, NoDynExec: true};
        }
    }
    if (data.Script) {
        return {Data: data.Script};
    }
    return null;
}

DynExecWrapperTool.CanSwitchVar = function (uidata) {
    if (!uidata) return false;
    let vtype = uidata.vtype;
    return !!(KFDataType.Is_Number(vtype) ||
        KFDataType.OT_BOOL === vtype ||
        KFDataType.OT_MIXOBJECT === vtype ||
        KFDataType.OT_STRING === vtype);
}

DynExecWrapperTool.GetDynExecDataAndPath = function (uidata) {
    if (uidata && DynExecWrapperTool.CanSwitchVar(uidata)) {
        let dynExecData = null;
        let top = false;
        let srcData = null;
        let path = KFDEditTool.GetUIDataPath(uidata, function (iteruidata) {
            if (iteruidata && iteruidata._dynExecData) {
                dynExecData = iteruidata._dynExecData;
                if (!iteruidata._parent) top = true;
                else {
                    srcData = DynExecWrapperTool.GetSrcData(iteruidata._parent);
                }
                return true;
            }
        });
        return dynExecData ? {dynExecData: dynExecData, path: path, top: top, srcData: srcData} : {path: path};
    }
    return null;
}

DynExecWrapperTool.VarItemTypeStrs = ["int", "float", "string", "object"];

DynExecWrapperTool.VarItemTypeToStr = function (type) {
    if (type < DynExecWrapperTool.VarItemTypeStrs.length) {
        return DynExecWrapperTool.VarItemTypeStrs[type];
    }
    return "unknown";
}

DynExecWrapperTool.GetSwitchedVar = function (uidata) {
    let ret = DynExecWrapperTool.GetDynExecDataAndPath(uidata);
    if (ret && ret.dynExecData && ret.path) {
        let dynExecData = ret.dynExecData;
        if (!dynExecData.Items) return null;
        for (let item of dynExecData.Items) {
            let name = item.Name ? item.Name.toString() : "";
            let varPath = item.VarPath ? item.VarPath.toString() : "";
            if (name !== ret.path) continue;
            return {
                name: name,
                type: DynExecWrapperTool.VarItemTypeToStr(item.Type),
                varPath: varPath,
                srcItem: item
            }
        }
    }
    return null;
}

DynExecWrapperTool.SetVarPath = function (switchedVar, value) {
    if (switchedVar && switchedVar.srcItem) {
        switchedVar.srcItem.VarPath = new KFDName(value);
    }
}

DynExecWrapperTool.ProcVarMenu = function (uidata, menuui) {
    if (!uidata || !uidata._editor
        || !KFDEditor.IsSwitchVarEnabled(uidata._editor.curInprops)
        || !DynExecWrapperTool.CanSwitchVar(uidata)) {
        CommTool.ShowMenu(menuui, ['#switchvar', '#switchexpr', '#resetconst'], false);
    } else {
        let switchedVar = DynExecWrapperTool.GetSwitchedVar(uidata);
        if (switchedVar) {
            CommTool.ShowMenu(menuui, ['#switchvar', '#switchexpr', '#resetconst'], true);
        } else {
            CommTool.ShowMenu(menuui, ['#switchvar', '#switchexpr'], true);
            CommTool.ShowMenu(menuui, ['#resetconst'], false);
        }
    }
}

DynExecWrapperTool.GetVarItemTypeFromPropType = function (typeID, type) {
    if (type === "expr") return 4;
    // let typeID = KFDataType.GetTypeID(propType);
    if(KFDataType.Is_Integer(typeID) || typeID === KFDataType.OT_BOOL) return 0;
    else if (typeID === KFDataType.OT_FLOAT || typeID === KFDataType.OT_DOUBLE) return 1;
    else if (typeID === KFDataType.OT_STRING) return 2;
    else return 3;
}

DynExecWrapperTool.GetClosestScriptData = function (uidata, kfdtable) {
    if (!uidata) return null;
    let scriptData = null;
    let path = KFDEditTool.GetUIDataPath(uidata, function (iteruidata) {
        if (iteruidata && iteruidata._parent) {
            let parent = iteruidata._parent;
            let prop = parent._prop;
            let disabledynexec = KFDEditor.GetPropTag(prop, "DisableDynExec") === "1";
            let vtype = parent.vtype;
            let otype = prop ? prop.otype : null;
            if(!prop && parent._parent && parent._parent._prop) {
                otype = parent._parent._prop.otype;
                disabledynexec = KFDEditor.GetPropTag(parent._parent._prop, "DisableDynExec") === "1";
            }
            if (!disabledynexec && otype && otype === "KFScriptData" && (vtype === KFDataType.OT_OBJECT || vtype === KFDataType.OT_MIXOBJECT)) {
                scriptData = DynExecWrapperTool.GetSrcData(parent);
                if (scriptData && scriptData.src && scriptData.name) {
                    scriptData.value = scriptData.src[scriptData.name];
                    return true;
                }
            }
        }
    });
    return scriptData ? {scriptData: scriptData, path: path} : null;
}

DynExecWrapperTool.SwitchVar = function (uidata, type) {
    if (!uidata || !uidata._editor || !uidata._editor.kfdtable) return;
    let ret = DynExecWrapperTool.GetDynExecDataAndPath(uidata);
    if (!ret || !ret.path) return;
    let editor = uidata._editor;
    let kfdtable = editor.kfdtable;
    let curData = null;
    let wrapper = 0;
    let top = false;
    let refresh = false;
    let path = ret.path;
    if (!ret.dynExecData) {
        if (type !== 'const') {
            let dynExecData = {__cls__: 'GSDynamicExecuteData'};
            let dynExecDataKFD = kfdtable.get_kfddata(dynExecData.__cls__);
            KFDJson.init_object(dynExecData, dynExecDataKFD);
            ret.dynExecData = dynExecData;
            let data = DynExecWrapperTool.GetClosestScriptData(uidata, kfdtable);
            if (data && data.scriptData && data.scriptData.value) {
                ret.dynExecData.Script = data.scriptData.value;
                data.scriptData.src[data.scriptData.name] = ret.dynExecData;
                path = data.path;
            } else {
                curData = ret.dynExecData;
                top = true;
            }
            wrapper = 1;
        }
    } else {
        top = ret.top;
    }
    if (ret.dynExecData) {
        if (!ret.dynExecData.Items) {
            ret.dynExecData.Items = [];
        }
        let found = -1;
        for (let i = 0; i < ret.dynExecData.Items.length; ++i) {
            let item = ret.dynExecData.Items[i];
            if (item.Name && item.Name.toString() === path) {
                found = i;
                break;
            }
        }
        if (found !== -1) {
            let item = ret.dynExecData.Items[found];
            if (type === "const") {
                ret.dynExecData.Items.splice(found, 1);
                refresh = true;
                if (ret.dynExecData.Items.length === 0) {
                    if (top) {
                        curData = ret.dynExecData.Script;
                    } else if (ret.srcData) {
                        let srcData = ret.srcData;
                        if (srcData.src && srcData.name) {
                            srcData.src[srcData.name] = ret.dynExecData.Script;
                        }
                    }
                    wrapper = -1;
                }
            } else {
                let newType = DynExecWrapperTool.GetVarItemTypeFromPropType(uidata._prop.type, type);
                if (item.Type !== newType) {
                    ret.dynExecData.Items[found].Type = newType;
                    refresh = true;
                }
            }
        } else {
            if (type !== 'const') {
                let newItemData = {__cls__: 'DynamicSetVarItem'};
                let newItemDataKFD = kfdtable.get_kfddata(newItemData.__cls__);
                KFDJson.init_object(newItemData, newItemDataKFD);
                newItemData.Name = new KFDName(path);
                newItemData.Type = DynExecWrapperTool.GetVarItemTypeFromPropType(uidata.vtype, type);
                ret.dynExecData.Items.push(newItemData);
                refresh = true;
            }
        }
    }
    if (top && curData) {
        switch (wrapper) {
            case 1: {
                editor.Event.emit('WrapDynExecData', curData);
                break;
            }
            case -1: {
                editor.Event.emit('UnWrapDynExecData', curData);
                break;
            }
            default: {
                editor.Refresh(uidata, true, true);
            }
        }
    } else if (refresh) {
        editor.Refresh(uidata, true, true);
    }
}

DynExecWrapperTool.OnChangeEvent = function (uidata) {
    let ret = DynExecWrapperTool.GetDynExecDataAndPath(uidata);
    if (!ret || !ret.path) return;
    let editor = uidata._editor;
    if (editor && ret.dynExecData) {
        DynExecWrapperTool.CheckDynExeDataValid(ret.dynExecData, editor, ret.srcData);
    }
}

DynExecWrapperTool.IsDynExecItemNameMatched = function(name, data, kfdtable) {
    let ret = CommTool.GetValueByPathName(name, data, null, kfdtable, true);
    return !!(ret && ret.result);
}

DynExecWrapperTool.CheckDynExeDataValid = function (data, editor, srcData) {
    if (data && data.Script && editor) {
        if (data.Items) {
            for (let i = data.Items.length - 1; i >= 0; --i) {
                let item = data.Items[i];
                if (item.Name) {
                    let name = item.Name.toString();
                    let newName = name.replaceAll('{', KFDEditor.VarNameIndexBeginToken)
                        .replaceAll('}', KFDEditor.VarNameIndexEndToken)
                        .replaceAll('@', KFDEditor.VarNameMemberOpToken);
                    item.Name.setString(newName);
                }
                if (!item.Name
                    || !DynExecWrapperTool.IsDynExecItemNameMatched(item.Name.toString(), data.Script, editor.kfdtable)) {
                    let logstr = "当前脚本检查到无效动态变量或表达式：" + (item.Name ? item.Name.toString() : "") + ", 将自动删除，请检查";
                    //Alert("动态变量自动清除提示", logstr);
                    console.warn(logstr);
                    data.Items.splice(i, 1);
                }
            }
        }
        if (!data.Items || data.Items.length === 0) {
            if (!srcData) {
                editor.Event.emit('UnWrapDynExecData', data.Script);
                return false;
            } else {
                if (srcData.src && srcData.name) {
                    srcData.src[srcData.name] = data.Script;
                }
            }
        }
    }
    return true;
}
