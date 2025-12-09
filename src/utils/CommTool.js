function CommTool() {
}

CommTool.ShowMenu = function (menuui, ids, show) {
    for (let id of ids) {
        let itemEl = $(id)[0];
        if (itemEl) {
            let item = menuui.menu('getItem', itemEl);
            if (item) {
                if (show) $(item.target).show();
                else $(item.target).hide();
            }
        }
    }
}

CommTool.WriteValue = function (bytearr, jsonobj) {
    let valueType = typeof jsonobj;
    let propinfo = {}
    if (valueType === "boolean") {
        propinfo["type"] = "bool";
    } else if (valueType === "string") {
        propinfo["type"] = "kfstr";
    } else if (valueType === "number") {
        if (Number.isInteger(jsonobj)) {
            propinfo["type"] = "int";
        } else {
            propinfo["type"] = "double";
        }
    } else if (jsonobj instanceof KFByteArray) {
        propinfo["type"] = "kfBytes";
        jsonobj = {bytes: jsonobj};
    } else {
        propinfo = null
    }
    KFDJson.write_value(bytearr, jsonobj, propinfo);
}

CommTool.ValueToBase64 = function (value) {
    let kfbytearr = new KFByteArray();
    CommTool.WriteValue(kfbytearr, value);
    return bytesToBase64(kfbytearr.GetBuff());
}

CommTool.Base64ToValue = function (data) {
    let kfbytearr = new KFByteArray(base64ToBytes(data));
    return KFDJson.read_value(kfbytearr, false);
}

CommTool.ValuesToBase64 = function (values) {
    let ret = [];
    for (let value of values) {
        ret.push(CommTool.ValueToBase64(value));
    }
    return ret;
}

CommTool.Base64ToValues = function (dataarray) {
    let ret = [];
    for (let data of dataarray) {
        ret.push(CommTool.Base64ToValue(data));
    }
    return ret;
}

CommTool.GetKFDObjectClsName = function (data, prop) {
    return data && data.__cls__ ? data.__cls__ : prop ? prop.otype : "";
}

CommTool.GetKFDInitValue = function (prop, vtype, pprop, kfdtable) {
    return KFDEditor._GetInitValue(prop, vtype, kfdtable, pprop);
}

CommTool.CatNamePath = function (parentPath, currPath) {
    if (parentPath) return parentPath + "." + currPath;
    return currPath;
}

CommTool.FindPathInKFDObject = function (data, pprop, kfdtable, conditionfunc, exceptProps, extra) {
    let result = [];
    if (!data || !kfdtable || !conditionfunc) return result;
    let cls = CommTool.GetKFDObjectClsName(data, pprop);
    if (!cls) return result;
    if (!extra) extra = {};
    let enableDefaultField = extra.enableDefaultField;
    let ignoreObjectFunc = extra.ignoreObjectFunc;
    let savedCallback = extra.savedCallback;
    let parentfullname = extra.parentFullName ? extra.parentFullName : "";
    let kfddata = kfdtable.get_kfddata(cls);
    let allprops = KFDPropTool.GetAllKFDProperty(kfddata, kfdtable);
    for (let prop of allprops) {
        if (!enableDefaultField && !data.hasOwnProperty(prop.name)) {
            continue;
        }
        let newExceptProps = null;
        if (exceptProps) {
            newExceptProps = exceptProps[prop.name];
            if (newExceptProps === true) continue;
        }

        let typeid = KFDataType.GetTypeID(prop.type);
        let value = null;
        let newSavedCallback = savedCallback;
        if (data.hasOwnProperty(prop.name)) {
            value = data[prop.name];
        } else {
            if (typeid === KFDataType.OT_OBJECT) {
                value = {__cls__: prop.otype};
                newSavedCallback = {
                    callback: function () {
                        if (!this.called) {
                            data[prop.name] = value;
                            this.called = true;
                            if (savedCallback && savedCallback.callback) {
                                savedCallback.callback();
                            }
                        }
                    }
                }
            } else {
                value = CommTool.GetKFDInitValue(prop, typeid, pprop, kfdtable);
            }
        }
        let currFullName = CommTool.CatNamePath(parentfullname, prop.name);
        if (conditionfunc(value, typeid, prop, {parent: data, fullname: currFullName}, kfdtable, newSavedCallback)) {
            result.push({path: prop.name, value: value, parent: data, prop: prop, savedCallback: newSavedCallback});
        }
        if (typeid === KFDataType.OT_OBJECT || typeid === KFDataType.OT_MIXOBJECT) {
            if (!ignoreObjectFunc || !ignoreObjectFunc(value, prop, kfdtable)) {
                let items = CommTool.FindPathInKFDObject(value, prop, kfdtable, conditionfunc,
                    newExceptProps, {
                        enableDefaultField: enableDefaultField,
                        ignoreObjectFunc: ignoreObjectFunc,
                        savedCallback: newSavedCallback,
                        parentFullName: currFullName
                    });
                for (let item of items) {
                    result.push({
                        path: prop.name + "." + item.path,
                        value: item.value,
                        parent: item.parent,
                        prop: item.prop,
                        savedCallback: item.savedCallback
                    });
                }
            }
        } else if (typeid === KFDataType.OT_ARRAY || typeid === KFDataType.OT_MIXARRAY) {
            if (!value || !value instanceof Array) continue;
            let otypeid = KFDataType.GetTypeID(prop.otype);
            if (KFDataType.OT_UNKNOW === otypeid) {
                let elemtypeid = KFDataType.OT_OBJECT;
                let elemtype = "object";
                if (typeid === KFDataType.OT_MIXARRAY) {
                    elemtypeid = KFDataType.OT_MIXOBJECT;
                    elemtype = "mixobject";
                }
                for (let i = 0; i < value.length; ++i) {
                    let kv = value[i];
                    let oprop = {type: elemtype, otype: prop.otype, name: i};
                    if (ignoreObjectFunc && ignoreObjectFunc(kv, oprop, kfdtable)) continue;
                    let currentName = prop.name + '[' + i + ']';
                    let currentIndexFullName = CommTool.CatNamePath(parentfullname, currentName);
                    if (conditionfunc(kv, elemtypeid, oprop, {
                        parent: value,
                        fullname: currentIndexFullName
                    }, kfdtable, newSavedCallback)) {
                        result.push({
                            path: currentName,
                            value: kv,
                            parent: value,
                            prop: oprop,
                            savedCallback: newSavedCallback
                        });
                    }
                    let items = CommTool.FindPathInKFDObject(kv, oprop, kfdtable, conditionfunc,
                        newExceptProps, {
                            enableDefaultField: enableDefaultField,
                            ignoreObjectFunc: ignoreObjectFunc,
                            savedCallback: newSavedCallback,
                            parentFullName: currentIndexFullName
                        });
                    for (let item of items) {
                        result.push({
                            path: prop.name + '[' + i + '].' + item.path,
                            value: item.value,
                            parent: item.parent,
                            prop: item.prop,
                            savedCallback: item.savedCallback
                        });
                    }
                }
            } else {
                for (let i = 0; i < value.length; ++i) {
                    let kv = value[i];
                    let oprop = {type: prop.otype, name: i};
                    let currentName = prop.name + '[' + i + ']';
                    let currentIndexFullName = CommTool.CatNamePath(parentfullname, currentName);
                    if (conditionfunc(kv, otypeid, oprop, {
                        parent: value,
                        fullname: currentIndexFullName
                    }, kfdtable, newSavedCallback)) {
                        result.push({
                            path: currentName,
                            value: kv,
                            parent: value,
                            prop: prop,
                            savedCallback: newSavedCallback
                        });
                    }
                }
            }
        }
    }
    return result;
}

CommTool.EscapeRegEx = function (str) {
    return str.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

CommTool.GetValueByPathName = function (name, data, prop, kfdtable, enableDefaultField) {
    if (!data || !name || !kfdtable) return null;
    let parts = name.split(KFDEditor.VarNameMemberOpToken);
    for (let part of parts) {
        if (!data) return null;
        let indexBegin = part.indexOf(KFDEditor.VarNameIndexBeginToken);
        let indexEnd = part.indexOf(KFDEditor.VarNameIndexEndToken);
        if (indexBegin === -1 && indexEnd === -1) {
            let cls = data && data.__cls__ ? data.__cls__ : prop ? prop.otype : "";
            let pprop = prop;
            prop = KFDPropTool.GetClsProp(cls, part, kfdtable);
            if (prop) {
                if (enableDefaultField) {
                    if (data.hasOwnProperty(prop.name)) {
                        data = data[prop.name];
                    } else {
                        let typeid = KFDataType.GetTypeID(prop.type);
                        if (typeid === KFDataType.OT_OBJECT) {
                            data = {__cls__: prop.otype};
                        } else {
                            data = CommTool.GetKFDInitValue(prop, typeid, pprop, kfdtable);
                        }
                    }
                } else {
                    data = data[prop.name];
                }
                continue;
            }
        } else if (indexBegin !== -1 && indexBegin < indexEnd) {
            let arrayName = part.slice(0, indexBegin);
            let index = parseInt(part.slice(indexBegin + 1, indexEnd));
            let cls = data && data.__cls__ ? data.__cls__ : prop ? prop.otype : "";
            prop = KFDPropTool.GetClsProp(cls, arrayName, kfdtable);
            if (prop) {
                let typeid = KFDataType.GetTypeID(prop.type);
                if (typeid === KFDataType.OT_ARRAY || typeid === KFDataType.OT_MIXARRAY) {
                    arrayData = data[prop.name];
                    if (arrayData && arrayData instanceof Array) {
                        if (index >= arrayData.length) return null;
                        data = arrayData[index];
                        let otypeid = KFDataType.GetTypeID(prop.otype);
                        if (otypeid === KFDataType.OT_UNKNOW) {
                            let type = typeid === KFDataType.OT_ARRAY ? 'object' : 'mixobject';
                            prop = {type: type, otype: prop.otype, name: index, unknowtags: prop.unknowtags};
                        } else {
                            prop = {type: prop.otype, name: index, enum: prop.enum, unknowtags: prop.unknowtags};
                        }
                        continue;
                    }
                }
            }
        }
        return null;
    }
    return {data: data, prop: prop, result: true};
}

CommTool.IsObjectEqualFirstBased = function (f1, f2) {
    if (!f1 || !f2) return false;
    for (let key in f1) {
        if (f1.hasOwnProperty(key)) {
            if (f1[key] !== f2[key]) {
                return false;
            }
        }
    }
    return true;
}
