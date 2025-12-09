function KFDPropTool() {

}

KFDPropTool.SyncLoadBLKObjData = function (assetpath) {
    var fullPath = _global.appdatapath + "/" + assetpath;
    if (fileExists(fullPath)) {
        let blkdata = IKFFileIO_Type.instance.syncLoadFile(fullPath);
        if (blkdata) {
            let bytearr = new KFByteArray(blkdata);
            let blkobj = KFDJson.read_value(bytearr);
            if (blkobj.data) {
                var obj = KFDJson.read_value(blkobj.data.bytes, false);
                blkobj.data.object = obj;
                return blkobj.data;
            }
        }
    }

    return null;
}


KFDPropTool.DisplayParam = false;
KFDPropTool.IsScriptDataProperty = function (classname, kfdtable) {
    if (KFDPropTool.DisplayParam == false) return false;
    let kfdcls = kfdtable.get_kfddata(classname);
    while (kfdcls) {
        let extendcls = kfdcls.extend;
        while (extendcls != "KFScriptData") {
            let extendkfdcls = kfdtable.get_kfddata(extendcls);
            if (extendkfdcls) extendcls = extendkfdcls.extend;
            else break;
        }
        return extendcls == "KFScriptData";
    }
    return classname == "KFScriptData";
}


KFDPropTool.GetCanSelectScriptData = function (objprop, kfdtable) {
    //let showType = KFDEditor.GetPropTag(objprop, "STYPE");
    let showType = objprop.stype;
    let useShowType = false;
    if (showType && showType != "") {
        let subclses = kfdtable.get_kfddatas_extend(objprop.otype);
        for (let ii = 0; ii < subclses.length; ++ii) {
            if (subclses[ii].label == showType) {
                useShowType = true;
                break;
            }
        }
    }

    let allcls = kfdtable.get_kfddatas_extend(useShowType ? showType : objprop.otype, objprop.igobase != 1);
    let stag = objprop.stag;
    if (!stag || stag == "") return allcls;
    let alltagcls = [];
    for (let clsobj of allcls) {
        let clsstag = KFDEditor.GetPropTag(clsobj.value, "STAG");
        if (stag == clsstag) {
            alltagcls.push(clsobj);
        }
    }
    return alltagcls;
}

KFDPropTool.IsFTypeScript = function (clsobj, kfdtable, includeftypeary) {
    let strftype = KFDEditor.GetPropTag(clsobj.value, "FTYPE");
    if (!strftype || strftype == "") return true;
    if (!_global.editcls) return true;

    // 过滤一些FTYPE
    if (strftype) {
        let notFTypeScript = ["abandoned", "hide"];
        let paramFType = "param";
        let t = strftype.toLowerCase();
        if (notFTypeScript.indexOf(t) != -1) return false; // 废弃、隐藏
        if (t == paramFType) { // 参数结构
            if (!includeftypeary  || includeftypeary.indexOf(paramFType) == -1) return false;
            return true;
        }
    }

    var allftypes = strftype.split("|");
    for (let ftype of allftypes) {
        let allSubFtypes = kfdtable.get_kfddatas_extend(ftype);
        for (let subFtype of allSubFtypes) {
            strftype += "|" + subFtype.label;
        }
    }
    // 行为树 strftype == _global.editcls == KFBehaviorTree
    return strftype.indexOf(_global.editcls) != -1;
}

//KFDPropTool.DStatedefs = {};

KFDPropTool.GetStateDefData = function (statedef, STATEDEF, category) {
    //if(KFDPropTool.DStatedefs[STATEDEF] != null) return KFDPropTool.DStatedefs[STATEDEF];
    let curDStatedef = {};
    let blkdata = IKFFileIO_Type.instance.syncLoadFile(_global.appdatapath + "/App/Editor/" + STATEDEF + ".blk");
    if (blkdata) {
        let bytearr = new KFByteArray(blkdata);
        let blkobj = KFDJson.read_value(bytearr);
        if (blkobj) {
            if (blkobj.data) {
                let kv = KFDJson.read_value(blkobj.data.bytes, false);
                if (kv && kv.Rows) {
                    for (let item of kv.Rows) {
                        let stateCate = item.desc.split(":")[2];
                        if (stateCate != null && stateCate != category) continue;
                        curDStatedef[item.value] = item.desc.split(":")[1] ? item.desc.split(":")[1] : item.desc;
                    }

                    if (statedef != null) {
                        for (let prop of statedef.propertys) {
                            let stateCate = KFDEditor.GetPropTag(prop, "CATE");
                            if (stateCate != "" && stateCate != category) continue;
                            let id = parseInt(prop.default);
                            if (curDStatedef[id] == null) curDStatedef[id] = prop.cname ? prop.cname : prop.name;
                        }
                    }
                    //KFDPropTool.DStatedefs[STATEDEF] = curDStatedef;
                    return curDStatedef;
                }
            }
        }
    }

    return null;
}

KFDPropTool.Enums = {};

KFDPropTool.GetEnumData = function (enumfile, fixEnums) {
    if (KFDPropTool.Enums[enumfile] != null) return KFDPropTool.Enums[enumfile];
    let dynmicEnums = [];
    let blkdata = IKFFileIO_Type.instance.syncLoadFile(_global.appdatapath + "/App/Editor/" + enumfile + ".blk");
    if (blkdata) {
        let bytearr = new KFByteArray(blkdata);
        let blkobj = KFDJson.read_value(bytearr);
        if (blkobj) {
            if (blkobj.data) {
                let kv = KFDJson.read_value(blkobj.data.bytes, false);
                if (kv && kv.Rows) {
                    for (let item of kv.Rows) {
                        if (item.hasOwnProperty('value') && item.desc) {
                            dynmicEnums.push({
                                value: item.value,
                                desc: item.desc.split(":")[1] ? item.desc.split(":")[1] : item.desc
                            });
                        }
                    }

                    if (fixEnums != null) {
                        for (let i = 0; i < fixEnums.length; i++) {
                            let prop = fixEnums[i];
                            let id = parseInt(prop.default);
                            let needAdd = true;
                            for (let item of kv.Rows) {
                                if (item.value === prop.default) {
                                    needAdd = false;
                                    break;
                                }
                            }
                            if (needAdd) dynmicEnums.push({value: id, desc: prop.cname ? prop.cname : prop.name});
                        }
                    }
                    KFDPropTool.Enums[enumfile] = dynmicEnums;
                    return dynmicEnums;
                }
            }
        }
    }

    return null;
}


KFDPropTool.clsComboId = 0;
KFDPropTool.SelClsAry = function (inAry, includeAndIgnoreCls, kfdTable, ignoredeprecated, catefilters) {
    KFDPropTool.clsComboId = 0;
    let clsAry = [];
    let includeFTypeAry = ["param"];
    for (let i = 0; i < inAry.length; ++i) {
        let clsobj = inAry[i];
        if (!KFDPropTool.IsFTypeScript(clsobj, kfdTable, includeFTypeAry)) continue;

        let DEPRECATED = null;
        if (!ignoredeprecated) {
            DEPRECATED = KFDEditor.GetPropTag(clsobj.value, "DEPRECATED");
        }
        if (!DEPRECATED && includeAndIgnoreCls.includeCls(clsobj.value.class)) {
            let categoryTag = KFDEditor.GetPropTag(clsobj.value, "Category");
            let categories = categoryTag.split("|");
            if (!categoryTag) categories = [];
            let dofilter = true;
            if(catefilters && catefilters.length > 0)
            {
                dofilter = false;
                if(categories.length > 0)
                {
                    for(let catefilter of catefilters)
                    {
                        if(categories[0] == catefilter)
                        {
                            dofilter = true;
                            break;
                        }
                    }
                }
            }
            if(dofilter)
            {
                let ShortcutTag = KFDEditor.GetPropTag(clsobj.value, "Shortcut");
                KFDPropTool.AddToClsAry(clsAry, categories, 0, clsobj, ShortcutTag);
            }
        }
    }
    return clsAry;
}

KFDPropTool.AddToClsAry = function (LevelClsAry, categories, level, clsobj, ShortcutTag) {
    if (categories.length > level) {
        let hit = false;
        for (let i = 0; i < LevelClsAry.length; ++i) {
            if (LevelClsAry[i].text == categories[level]) {
                hit = true;
                if (categories.length == level + 1)  //刚好到当前层
                {
                    LevelClsAry[i].children.push({
                        id: ++KFDPropTool.clsComboId,
                        text: ShortcutTag != "" ? clsobj.label0 + "[" + ShortcutTag + "]" : clsobj.label0,
                        value: clsobj.label
                    });
                } else {
                    this.AddToClsAry(LevelClsAry[i].children, categories, level + 1, clsobj, ShortcutTag);
                }
                break;
            }
        }

        if (!hit) {
            LevelClsAry.push({id: ++KFDPropTool.clsComboId, text: categories[level], value: "invalid", children: []})
            if (categories.length == level + 1) {
                LevelClsAry[LevelClsAry.length - 1].children.push({
                    id: ++KFDPropTool.clsComboId,
                    text: ShortcutTag != "" ? clsobj.label0 + "[" + ShortcutTag + "]" : clsobj.label0,
                    value: clsobj.label
                });
            } else {
                this.AddToClsAry(LevelClsAry[LevelClsAry.length - 1].children, categories, level + 1, clsobj, ShortcutTag);
            }
        }
    } else {
        LevelClsAry.push({
            id: ++KFDPropTool.clsComboId,
            text: ShortcutTag != "" ? clsobj.label0 + "[" + ShortcutTag + "]" : clsobj.label0,
            value: clsobj.label
        });
    }
}


KFDPropTool.SelObjAry = function (index) {
    var ary = _global.editor.SelAry[index];
    let clsAry = new Array();
    KFDPropTool.comboId = 0;
    for (let i in ary) {
        clsAry.push({id: KFDPropTool.comboId++, text: i, value: ary[i]});
    }
    return clsAry;
}


//propsel格式：文件路径:对象组.属性名:只要的文件名(不需要后缀)[不填则选择所有文件，可以|符号填写多个文件名]:选项显示的内容:赋值的内容
//属性筛选函数
KFDPropTool.selPropAry = function (propsel) {
    //获取文件路径数组
    let assetsurls = KFDPropTool.GetFile_Prop(propsel);
    //获取属性组（对象组（例如Rows），单一属性（例如name））
    let propstrings = KFDPropTool.GetProp_Prop(propsel);
    //获取Input（选项显示的内容）
    let input = KFDPropTool.GetInput_Prop(propsel);
    //获取Output（赋值的内容）
    let output = KFDPropTool.GetOutput_Prop(propsel);

    if (output == undefined || output.length <= 0)
        output = input;

    KFDPropTool.comboId = 0;

    //创建数据数组
    let clsAry = new Array();

    //遍历文件路径组
    for (var j = 0; j < assetsurls.length; j++) {
        //获取资源数据
        let blkObjData = KFDPropTool.SyncLoadBLKObjData(assetsurls[j]);
        //获取对象组，例如Rows
        if (!(propstrings.length >= 1 && propstrings[0] in blkObjData.object))//判断对象组是否存在于当前数据中
        {
            continue;
        }
        let TemObj = blkObjData.object[propstrings[0]];

        //数据添加
        for (var i = 0; i < TemObj.length; i++) {
            //获取单个属性
            let prop = "";
            if (propstrings.length >= 2 && propstrings[1] in TemObj[i]) //判断属性是否存在
            {
                prop = TemObj[i][propstrings[1]].toString();
            }
            else{
                prop = TemObj[i].toString();
            }


            //获取输入输入输出字符
            let input_statement = ScriptDescParser.Parse(new Statement(0, input.length, input),
                blkObjData['object'], -1, {"propsel": prop});
            let output_statement = ScriptDescParser.Parse(new Statement(0, output.length, output),
                blkObjData['object'], -1, {"propsel": prop});

            //添加数据给clsAry
            clsAry.push({id: 1, text: input_statement.state_str, value: output_statement.state_str});
        }
    }

    return clsAry;
}

//获取文件路径函数
KFDPropTool.GetFile_Prop = function (propsel) {
    //筛选条件为空时返回空数组
    if (propsel == null || propsel == "") return [];

    //分割，获取筛选条件
    let segs = propsel.split(":");
    if (segs.length > 5) return [];

    //获取目录限制，若为空则直接返回
    let paths = "";
    if (segs.length >= 1 && segs[0] != "") {
        paths = segs[0].split("|");
        if (paths.length >= 1 && paths[0] == "") return "";
    }


    //获得要搜索的文件夹目录
    let searchpath = _global.appdatapath.substr(0, _global.appdatapath.length - 5) + "/Data/App";
    for (let i = 0; i < paths.length; ++i) {
        searchpath += "/" + paths[i];
    }

    //后缀
    let suffix = ".blk";

    //文件筛选，将该文件保留
    let filterFiles = [];   //需要保留的文件组
    let filterFlag = false; //如果存在要保留的文件，则开启过滤模式
    if (segs.length >= 3 && segs[1] != "") {    //存储保留的文件组，并开启过滤模式
        filterFlag = true;
        filterFiles = segs[1].split("|");
    }

    //总路径数组
    let allpaths = [];
    //获取所有符合条件的文件
    IKFFileIO_Type.instance.syncGetFilePaths(searchpath, true, suffix, allpaths);

    //文件筛选总路径，保留该文件数组
    let allfilterpaths = [];
    for (let i = 0; i < allpaths.length; ++i) {
        let filtered = filterFlag;

        //过滤这个初始化blk文件
        if (allpaths[i].endsWith("__init__.blk")) {
            continue;
        }
        //获取想要的文件
        for (let j = 0; j < filterFiles.length; ++j) {
            if (allpaths[i].endsWith(filterFiles[j] + suffix)) {
                filtered = !filterFlag;
                break;
            }
        }

        //添加数据
        if (!filtered) {
            allfilterpaths.push((allpaths[i].substr(_global.appdatapath.length + 1)).replace(/\\/g, "/"));
        }
    }

    //返回所有文件
    return allfilterpaths;
}

//获取属性的函数
KFDPropTool.GetProp_Prop = function (propsel) {
    //筛选条件为空时返回空数组
    if (propsel == null || propsel == "") return [];

    //分割筛选条件
    let segs = propsel.split(":");
    if (segs.length > 5) return [];

    //获取属性数组
    let props = "";
    if (segs.length >= 3 && segs[2] && segs[2] != "") {
        props = segs[2].split(".");
    }

    return props;
}
//获取Input方法
KFDPropTool.GetInput_Prop = function (propsel) {
    //筛选条件为空时返回空数组
    if (propsel == null || propsel == "") return [];

    //分割筛选条件
    let segs = propsel.split(":");
    if (segs.length > 5) return [];

    //获取input
    let input = "";
    if (segs.length >= 4 && segs[3] && segs[3] != "") {
        input = segs[3];
    }

    return input;
}

//获取Output方法
KFDPropTool.GetOutput_Prop = function (propsel) {
    //筛选条件为空时返回空数组
    if (propsel == null || propsel == "") return [];

    //分割筛选条件
    let segs = propsel.split(":");
    if (segs.length > 5) return [];

    //获取output
    let output = "";
    if (segs.length >= 5 && segs[4] && segs[4] != "") {
        output = segs[4];
    }

    return output;
}


//filesel格式：路径条件:后缀:过滤文件名:显示模式:过滤模式
KFDPropTool.SelPathAry = function (filesel) {
    //筛选文件，获得所有文件的路径
    let files = KFDPropTool.SelFiles(filesel);
    //获得搜索路径
    let searchPath = KFDPropTool.SelSearchPath(filesel);
    //获得显示模式
    let displayMode = KFDPropTool.SelDisplayMode(filesel);

    KFDPropTool.comboId = 0;
    let clsAry = new Array();

    for (let i = 0; i < files.length; ++i) {
        if (displayMode == 1) {
            var filelevels = files[i].substr(searchPath.length + 1).split("/");
            var filename = filelevels.pop();

            KFDPropTool.AddToSelPathAry(clsAry, filelevels, 0, filename, filename.split(".")[0]);
        } else {
            // clsAry.push({id: i + 1, text: files[i].substr(searchPath.length + 1), value: files[i]});
            clsAry.push({id: i + 1, text: files[i].substr(searchPath.length + 1), value: files[i]});
        }
    }

    return clsAry;
}

KFDPropTool.AddToSelPathAry = function (fileClsAry, filelevels, level, filename, filenameval) {
    if (filelevels.length > level) {
        let hit = false;
        for (let i = 0; i < fileClsAry.length; ++i) {
            if (fileClsAry[i].text == filelevels[level]) {
                hit = true;
                if (filelevels.length == level + 1)  //刚好到当前层
                {
                    fileClsAry[i].children.push({id: ++KFDPropTool.comboId, text: filename, value: filenameval});
                } else {
                    KFDPropTool.AddToSelPathAry(fileClsAry[i].children, filelevels, level + 1, filename, filenameval);
                }
                break;
            }
        }

        if (!hit) {
            fileClsAry.push({id: ++KFDPropTool.comboId, text: filelevels[level], value: "invalid", children: []})
            if (filelevels.length == level + 1) {
                fileClsAry[fileClsAry.length - 1].children.push({
                    id: ++KFDPropTool.comboId,
                    text: filename,
                    value: filenameval
                });
            } else {
                KFDPropTool.AddToSelPathAry(fileClsAry[fileClsAry.length - 1].children, filelevels, level + 1, filename, filenameval);
            }
        }
    } else {
        fileClsAry.push({id: ++KFDPropTool.comboId, text: filename, value: filenameval});
    }
}

//文件筛选
KFDPropTool.SelSearchPath = function (filesel) {
    //筛选条件为空，返回空
    if (filesel == null || filesel == "") return "";

    let segs = filesel.split(":");
    if (segs.length > 5) return "";

    //获取路径
    let paths = segs[0].split("|");
    if (paths[0] == "") return "";

    let searchpath = "";
    let i = 0;
    //Data 目录特殊处理一下
    if (paths[0] == "Data") i = 1;

    for (; i < paths.length; ++i) {
        searchpath += paths[i];
        if (i < paths.length - 1) {
            searchpath += "/";
        }
    }

    //返回筛选路径
    return searchpath;
}


KFDPropTool.SelDisplayMode = function (filesel) {
    //筛选为空或筛选条件过多时，返回空
    if (filesel == null || filesel == "") return "";
    let segs = filesel.split(":");
    if (segs.length > 5) return "";

    //获取文件路径
    let paths = segs[0].split("|");
    if (paths[0] == "") return "";


    let disPlayMode = 0;
    if (segs.length == 4) {
        disPlayMode = Number(segs[3]);
    }

    return disPlayMode;
}

//筛选文件函数
KFDPropTool.SelFiles = function (filesel) {
    //筛选条件为空时返回空数组
    if (filesel == null || filesel == "") return [];

    let segs = filesel.split(":");
    if (segs.length > 5) return [];

    //获取目录限制，若为空则直接返回
    let paths = segs[0].split("|");
    if (paths[0] == "") return "";

    //Data 目录特殊处理一下
    let searchpathPrefix = paths[0] == "Data" ? _global.appdatapath : _global.appdatapath.substr(0, _global.appdatapath.length - 5);
    let searchpath = _global.appdatapath.substr(0, _global.appdatapath.length - 5);
    for (let i = 0; i < paths.length; ++i) {
        searchpath += "/" + paths[i];
    }

    //后缀处理
    let suffix = "";
    if (segs.length >= 2 && segs[1] != "") {
        suffix = "." + segs[1];
    }

    //文件筛选，将该文件过滤掉
    let filterFiles = [];
    if (segs.length >= 3 && segs[2] != "") {
        filterFiles = segs[2].split("|");
    }

    //获取筛选模式
    let filterFlag = false;
    if (segs.length == 5) {
        filterFlag = segs[4] == "true" ? true : false;
    }

    //总路径数组
    let allpaths = [];

    //获取所有符合条件的文件
    IKFFileIO_Type.instance.syncGetFilePaths(searchpath, true, suffix, allpaths);

    //文件筛选总路径，保留该文件数组
    let allfilterpaths = [];
    for (let i = 0; i < allpaths.length; ++i) {
        let filtered = filterFlag;
        for (let j = 0; j < filterFiles.length; ++j) {
            if (allpaths[i].endsWith(filterFiles[j] + suffix)) {
                filtered = !filterFlag;
                break;
            }
        }
        if (!filtered) {
            allfilterpaths.push((allpaths[i].substr(searchpathPrefix.length + 1)).replace(/\\/g, "/"));
        }
    }

    //返回所有文件
    return allfilterpaths;
}

//属性联动 Visible
KFDPropTool.VisibleProp = function (prop, allprops, data) {
    //if(data == null) return true;
    var visibleTag = KFDEditor.GetPropTag(prop, "Visible");

    return KFDPropTool.__EvaluateVisibleExpr(visibleTag, allprops, data);
}

KFDPropTool.__GetType = function (condname, allprops) {
    for (let i = 0; i < allprops.length; ++i) {
        if (allprops[i].name == condname) {
            return KFDataType.GetTypeID(allprops[i].type);
        }
    }

    return KFDataType.OT_UNKNOW;
}

KFDPropTool.__SetRefreshTag = function (name, allprops) {
    for (let i = 0; i < allprops.length; ++i) {
        if (allprops[i].name == name) {
            KFDEditor.SetPropTag(allprops[i], "Refresh", 1);
            return allprops[i].default;
        }
    }
}

KFDPropTool.__VisableExprDefines = {
    Group: {
        BeginEnds: {
            '[': ']'
        },
    },
    Variable: {
        CheckBegin: function (expr) {
            let cc = expr.charCodeAt();
            // a..zA..Z _
            return (cc >= 65 && cc <= 90) || (cc >= 97 && cc <= 122) || cc === 95;
        },
        CheckPart: function (ch) {
            let cc = ch.charCodeAt();
            return (cc >= 65 && cc <= 90) || // A...Z
                (cc >= 97 && cc <= 122) || // a...z
                (cc >= 48 && cc <= 57) || // 0...9
                cc === 95; // _
        },
    },
    Number: {
        CheckBegin: function (ch) {
            let cc = ch.charCodeAt();
            return cc >= 48 && cc <= 57; // 0...9
        },
        CheckDigit: function (ch) {
            let cc = ch.charCodeAt();
            return cc >= 48 && cc <= 57; // 0...9
        },
        CheckNumber: null
    },
    String: {
        BeginEnds: {
            "'": "'",
            '"': '"'
        },
        EscapeChar: '\\',
        EscapeReturn: function (ch) {
            let ret = '';
            switch (ch) {
                case 'n':
                    ret = '\n';
                    break;
                case 'r':
                    ret = '\r';
                    break;
                case 't':
                    ret = '\t';
                    break;
                case 'b':
                    ret = '\b';
                    break;
                case 'f':
                    ret = '\f';
                    break;
                case 'v':
                    ret = '\x0B';
                    break;
                default:
                    ret = ch;
            }
            return ret;
        }

    },
    Space: {
        Includes: [' ']
    },
    BinaryOperator: {
        Includes: {
            '|': {Precedence: 1, Logic: true},
            '&': {Precedence: 2, Logic: true},
            ':': {Precedence: 6, Logic: true},
            '~': {Precedence: 6, Logic: true},
            '<': {Precedence: 7, Logic: true},
            '>': {Precedence: 7, Logic: true},
        }
    },
    OnGetLogicOpValue: function (leftValue, operator, getRight) {
        // 如果是逻辑运算的&&和||，那么可能不需要解析右边的值
        if (operator === '&' && !leftValue) {
            return false;
        }
        if (operator === '|' && !!leftValue) {
            return true;
        }
        const rightValue = getRight();
        switch (operator) {
            case '&':
                return leftValue && rightValue;
            case '|':
                return leftValue || rightValue;
            case '>':
                return leftValue > rightValue;
            case '<':
                return leftValue < rightValue;
            case ':':
                return leftValue === rightValue;
            case '~':
                return leftValue !== rightValue;
            // skip default case
        }
    }
}

KFDPropTool.__TransferToTypeValue = function (valstr, valtype) {
    let retVal = valstr;
    if (KFDataType.Is_Number(valtype)) {
        retVal = Number(valstr);
    } else if (valtype == KFDataType.OT_BOOL) {
        retVal = valstr === "true";
    }
    return retVal;
}

KFDPropTool.__EvaluateVisibleExpr = function (expr, allprops, data) {
    if (!expr) return true;
    let hasError = false;
    const expression = new ExpressionParser(KFDPropTool.__VisableExprDefines);
    expression.onError((message, index, ch) => {
        hasError = true;
        //在控制台提示下
        console.warn("属性联动表达式解析失败", message, expr, index, ch);
    }).onGetVariableValue((name) => {
        let ret = undefined;
        switch (name) {
            case "true": {
                ret = true;
                break;
            }
            case "false": {
                ret = false;
                break;
            }
            default:
                break;
        }
        if (ret != undefined) return ret;
        let defaultValStr = KFDPropTool.__SetRefreshTag(name, allprops);
        let val = data ? data[name] : undefined;
        return val !== undefined ? val :
            KFDPropTool.__TransferToTypeValue(defaultValStr, KFDPropTool.__GetType(name, allprops));
    });
    expression.parse(expr);
    if (hasError) return true;
    return !!expression.evaluate();
}
//属性联动 Visible

KFDPropTool.GetAllKFDProperty = function (kfddata, kfdtable) {
    if (kfddata == null)
        return [];

    let propertys = kfddata.propertys;
    let orprops = kfddata.orprops;

    if (!orprops) orprops = [];

    let allprops = orprops.concat(propertys);
    let extendcls = kfddata.extend;

    if (extendcls) {
        let extenddata = kfdtable.get_kfddata(extendcls);
        let extendprops = KFDPropTool.GetAllKFDProperty(extenddata, kfdtable);

        let haspropnames = {};
        for (let i = 0; i < allprops.length; i++) {
            haspropnames[allprops[i].name] = true;
        }

        for (let i = 0; i < extendprops.length; i++) {
            let eprop = extendprops[i];
            if (!haspropnames.hasOwnProperty(eprop.name)) {
                allprops.splice(0, 0, eprop);
            }
        }
    }

    return allprops;
}

KFDPropTool.GetClsProp = function (cls, name, kfdtable) {
    if (kfdtable && cls && name) {
        let kfddata = kfdtable.get_kfddata(cls);
        let allprops = KFDPropTool.GetAllKFDProperty(kfddata, kfdtable);
        for (let prop of allprops) {
            if (prop.name === name) {
                return prop;
            }
        }
    }
    return null;
}
