///KFD结构中，各个属性编辑展示
function KFDEditor(tgui, kfdtable) {
    this.id = tgui.attr('id');
    this.tg = tgui;
    this.kfdtable = kfdtable;
    this.buildid = 0;
    this.builddatas = {};
    this.Event = new PIXI.utils.EventEmitter();

    KFDEditor.instance[this.id] = this;
    let editor = this;

    this.editTool = new KFDEditTool(editor);
    this.buffEditor = new BuffEditor(editor);

    this.recordNodes = [];//used to record expand information of each nodes
    this.SaveSliderPosition = 0;

    this.tg.treegrid({
        "onContextMenu": function (evt, row) {
            evt.preventDefault();
            editor._onContextMenu(row, {
                left: evt.pageX,
                top: evt.pageY
            });
        },
/////////////////////////////////////////////////////
//用于保存树状结构展开信息
        onBeforeExpand: function (node) {
            let i = editor.recordNodes.indexOf(node.id);
            if (i < 0) {
                editor.recordNodes.push(node.id);
            }

        },
        onBeforeCollapse: function (node) {
            let i = editor.recordNodes.indexOf(node.id);
            if (i >= 0) {
                editor.recordNodes.splice(i, 1);
            }
        },
        ///////////////////////////////////////////////////////
        rowStyler: function (row) {
            let ret = "";
            let fieldPath = "";
            let getFieldPath = function () {
                if (fieldPath) return fieldPath;
                fieldPath = KFDEditTool.GetUIDataPath(row);
                return fieldPath;
            }
            if (_global.debugBreakPoints) {
                for (let bp of _global.debugBreakPoints) {
                    if (bp.FieldPath &&
                        FrameDataWindow.IsBreakPointMatched(bp, _global.seqId, row, true) &&
                        getFieldPath() === bp.FieldPath) {
                        if (!bp.hasOwnProperty("Enabled") || bp.Enabled) {
                            ret += 'background-color:red';
                        } else {
                            ret += 'background-color:#FA8072';
                        }
                    }
                }
            }
            let hitBp = _global.debugHitBreakPoint;
            if (hitBp && hitBp.FieldPath &&
                FrameDataWindow.IsBreakPointMatched(hitBp, _global.seqId, row) &&
                getFieldPath() === hitBp.FieldPath) {
                ret += ret.length === 0 ? "" : ";";
                ret += 'color:yellow;font-weight:bold;font-style:italic';
            }
            return ret;
        }
    });
}

KFDEditor.prototype.Dispose = function () {
}

KFDEditor.instance = {};

KFDEditor.DisposeInstances = function () {
}

KFDEditor.caststring = function (val) {
    if (typeof (val) == 'string')
        return val;
    else if (val)
        return val + "";
    else
        return "";
}

KFDEditor.castInt = function (val) {
    let ret = parseInt(val);
    if (isNaN(ret)) return 0;
    return ret;
}

KFDEditor.castFloat = function (val) {
    /*if(typeof(val)=='string')
    {
        val = val.replace("f","");
    }*/

    let ret = parseFloat(val);
    if (isNaN(ret)) return 0;
    return ret;
}

KFDEditor.castBool = function (val) {
    return val == "true";
}

KFDEditor.castfuncstr = function (vtype) {
    let castfunc = "null";
    if (vtype == KFDataType.OT_UNKNOW || KFDataType.Is_Integer(vtype)) {
        castfunc = "KFDEditor.castInt";
    } else if (KFDataType.Is_Float(vtype)) {
        castfunc = "KFDEditor.castFloat";
    }
    return castfunc;
}

KFDEditor.CastValue = function (vtypeid, value) {
    if (vtypeid == KFDataType.OT_UNKNOW || KFDataType.Is_Integer(vtypeid)) {
        return KFDEditor.castInt(value);
    } else if (KFDataType.Is_Float(vtypeid)) {
        return KFDEditor.castFloat(value);
    } else if (vtypeid == KFDataType.OT_BOOL) {
        return KFDEditor.castBool(value);
    }
    return value;
}

KFDEditor.editadd = function (editor, dataid, domele, seldomid) {
    let clsname = "";
    let selcom = document.getElementById(seldomid);

    if (selcom) {
        clsname = selcom.value;
    }
    editor.AddArrayData(dataid, clsname);
}

KFDEditor.editpaste = function (editor, dataid) {
    editor.editTool.PasteData(dataid);
}

KFDEditor.editsyscopy = function (editor, dataid) {
    editor.editTool.CopySysData(dataid);
}


KFDEditor.editsyspaste = function (editor, dataid) {
    editor.editTool.PasteSysData(dataid);
}

KFDEditor.editmixobj = function (editor, dataid, domele, seldomid) {
    let clsname = "";
    let selcom = document.getElementById(seldomid);

    if (selcom) {
        clsname = selcom.value;
    }

    editor.SetData(dataid, clsname);
}

KFDEditor.editremovemix = function (editor, dataid, domele) {

}

KFDEditor.editremove = function (editor, dataid, domele) {
    editor.RemoveArrayData(dataid);
}

KFDEditor.editoneitem = function (editor, dataid, domele) {
    editor.EditOneItemData(dataid);
}

KFDEditor.editcopy = function (editor, dataid, domele) {
    editor.editTool.CopyData(dataid);
}

KFDEditor.editreset = function (editor, dataid, domele) {
    editor.Resetdata(dataid);
}

KFDEditor.watchvar = function (editor, dataid, type) {
    editor.WatchVar(dataid, type);
}

KFDEditor.editEmbedFileData = function (editor, dataid, domele, delfile) {
    editor.LoadEmbedFileData(dataid, domele, delfile);
}


KFDEditor.endselectedit = function (editor, dataid, domele, cast) {
    let realval = cast ? cast(domele.value) : domele.value;
    editor.SetData(dataid, realval);
}

KFDEditor.endbooledit = function (editor, dataid, domele) {
    editor.SetData(dataid, domele.checked);
}

KFDEditor.endtextboxedit = function (editor, dataid, domele, cast) {
    let realval = cast ? cast(domele.value) : domele.value;

    domele.onmousewheel = null;

    if (domele.SetRangeValue) {
        realval = domele.SetRangeValue(realval);
    }

    domele.value = realval + "";
    editor.SetData(dataid, realval);
}

KFDEditor.starttextboxedit = function (editor, dataid, domele, texttype) {
    if (texttype == "") _global.PreventShortKey = true;
}

KFDEditor.opencode = function (editor, dataid, domele) {
    if (editor) {
        let label = editor.GetData(dataid);
        __Native.OpenCode(label);
    }
}

KFDEditor.startrangeslider = function (rangparam, editor, dataid, domele, cast) {
    let params = rangparam.split("|");

    let deltaval = params[1] ? parseFloat(params[1]) : 1;
    let rangvalues = params[0].split("_");

    let min = parseFloat(rangvalues[0]);
    let max = parseFloat(rangvalues[1]);

    if (isNaN(min)) min = 0;
    if (isNaN(max)) max = 0;
    if (isNaN(deltaval)) deltaval = 1;

    _global.PreventShortKey = true;

    domele.SetRangeValue = function (val) {
        if (max > min) {
            if (val > max) val = max;
            if (val < min) val = min;
        }
        return val;
    }

    domele.deltaval = deltaval;

    domele.onmousewheel = function (event) {
        event.preventDefault();

        let realval = cast ? cast(domele.value) : domele.value;
        var down = event.wheelDelta ? event.wheelDelta < 0 : event.detail > 0;

        realval += (down ? 1.0 : -1.0) * this.deltaval;
        realval = domele.SetRangeValue(realval);
        domele.value = realval + "";
        editor.SetData(dataid, realval);
    }

}


KFDEditor.formatterEnum = function (editor, uidata, vtype, value) {
    let prop = uidata._prop;
    let denum = KFDEditor.GetPropTag(prop, "DENUM");
    if (prop.enum && prop.enum != "") {
        let curenumkfd = editor.kfdtable.get_kfddata(prop.enum);
        let propertys = [];
        propertys.push.apply(propertys, curenumkfd ? curenumkfd.propertys : []);

        let subenums = editor.kfdtable.get_kfddatas_extend(prop.enum);
        let subenum = null;
        while (subenums.length > 0) {
            subenum = subenums[0].label;
            curenumkfd = editor.kfdtable.get_kfddata(subenum);
            propertys.push.apply(propertys, curenumkfd ? curenumkfd.propertys : []);
            subenums = editor.kfdtable.get_kfddatas_extend(subenum);
        }
        let enumkfd = editor.kfdtable.get_kfddata(subenum ? subenum : prop.enum);
        if (enumkfd) {
            let castfunc = KFDEditor.castfuncstr(vtype);
            let methodstr = 'KFDEditor.endselectedit(KFDEditor.instance.'
                + editor.id
                + ',' + uidata.id
                + ', this, '
                + castfunc + ')';

            let comstr = '<select class="easyui-combobox" style="width:100%;" onchange="' +
                methodstr
                + '">';
            //let propertys = enumkfd.propertys;

            for (let i = 0; i < propertys.length; i++) {
                let eump = propertys[i];

                let CHECKstr = (eump.default == value.toString() || eump.default == "0x" + value.toString(16)) ? "selected" : "";
                if (enumkfd.class == "KFBaseActionID") {
                    comstr += '<option value="' + eump.default + '" '
                        + CHECKstr + '>(' + eump.default + ')' + KFDEditor._GetPropertyLable(eump) + '</option>';
                } else {
                    comstr += '<option value="' + eump.default + '" '
                        + CHECKstr + '>' + KFDEditor._GetPropertyLable(eump) + '</option>';
                }

            }
            comstr += '</select>';

            return comstr;
        }
    } else if (denum) {
        let curenumkfd = editor.kfdtable.get_kfddata(denum);
        let fixEnums = null;
        if (curenumkfd) {
            let propertys = [];
            propertys.push.apply(propertys, curenumkfd ? curenumkfd.propertys : []);
            let subenums = editor.kfdtable.get_kfddatas_extend(prop.enum);
            let subenum = null;
            while (subenums.length > 0) {
                subenum = subenums[0].label;
                curenumkfd = editor.kfdtable.get_kfddata(subenum);
                propertys.push.apply(propertys, curenumkfd ? curenumkfd.propertys : []);
                subenums = editor.kfdtable.get_kfddatas_extend(subenum);
            }
            //let enumkfd = editor.kfdtable.get_kfddata(subenum ? subenum : prop.enum);
            fixEnums = propertys;
        }

        let denumArr = KFDPropTool.GetEnumData(denum, fixEnums);
        if (denumArr) {
            let castfunc = KFDEditor.castfuncstr(vtype);
            let methodstr = 'KFDEditor.endselectedit(KFDEditor.instance.'
                + editor.id
                + ',' + uidata.id
                + ', this, '
                + castfunc + ')';

            let comstr = '<select class="easyui-combobox" style="width:100%;" onchange="' +
                methodstr
                + '">';

            for (let i = 0; i < denumArr.length; i++) {
                let eump = denumArr[i];

                let CHECKstr = (eump.value == (value + "")) ? "selected" : "";

                comstr += '<option value="' + eump.value + '" '
                    + CHECKstr + '>' + eump.desc + '</option>';
            }
            comstr += '</select>';

            return comstr;
        }
    }
    return null;
}


KFDEditor.GetPropTag = function (prop, tag) {
    if (prop && prop.unknowtags) {
        for (let item of prop.unknowtags) {
            if (item.tag == tag)
                return item.val;
        }
    }

    return "";
}

KFDEditor.SetPropTag = function (prop, curtag, curval) {
    let isSet = false;
    if (prop) {
        if (prop.unknowtags) {
            for (let item of prop.unknowtags) {
                if (item.tag == curtag) {
                    item.val = curval;
                    isSet = true;
                    break;
                }
            }
        } else {
            prop.unknowtags = [];
        }
        if (!isSet) {
            prop.unknowtags.push({tag: curtag, val: curval});
        }
    }
}


KFDEditor.formatterTextbox = function (editor, uidata, vtype, value) {
    let stylecssstr = "";
    let valuestr = value + "";
    if (_global.searchvalue && _global.searchvalue != "" && valuestr.indexOf(_global.searchvalue) != -1) {
        stylecssstr = "color:red; ";
    }
    let castfunc = KFDEditor.castfuncstr(vtype);

    let methodstr = 'KFDEditor.endtextboxedit(KFDEditor.instance.'
        + editor.id
        + ',' + uidata.id
        + ', this,'
        + castfunc + ')';

    let contextmenu = "";
    let texttype = "";

    let prop = uidata._prop;
    if (prop) {
        texttype = KFDEditor.GetPropTag(prop, "TEXTTYPE");
    }

    ///文件选择
    if (texttype == "filepath") {
        texttype = "";
        uidata.__enum__ = "OnFileSelected";
    }

    ///有外部枚举
    if (uidata.__enum__) {
        contextmenu = 'onclick="' + uidata.__enum__ + '(event,KFDEditor.instance.' + editor.id
            + "," + uidata.id + ',this)"';
    }

    //GetPropTag获取tag值
    let filesel = KFDEditor.GetPropTag(prop, "FILESEL");
    let arysel = KFDEditor.GetPropTag(prop, "ARYSEL");
    let propsel = KFDEditor.GetPropTag(prop, "PROPSEL");
    let codesel = KFDEditor.GetPropTag(prop, "CODESEL");

    valuestr = valuestr.replace(/\"/g, "&quot;");

    ///判定是否用外部编辑
    let onfocusinmethod = "";
    if (texttype) {
        onfocusinmethod = methodstr.replace("endtextboxedit", "starttextboxedit").replace(castfunc, "'" + texttype + "'");
        methodstr = "";
    } else if (codesel) {
        contextmenu = 'ondblclick="KFDEditor.formatCodeSelWin(event, KFDEditor.instance.' + editor.id
            + "," + uidata.id + ',this,' + "'" + codesel + "')\"";
        let str = '<input class="easyui-textbox" style="width:80%;' + stylecssstr + '" ' + contextmenu + ' onfocusin="' + onfocusinmethod + '" onfocusout="' + methodstr + '" value="' + valuestr + '">';
        let jumpmethod = 'KFDEditor.opencode(KFDEditor.instance.'
            + editor.id
            + ',' + uidata.id
            + ', this)';
        str += '<a href="#" onclick="' + jumpmethod + '">代码</a>';
        return str;
    } else if (arysel && arysel != "" && _global.editor.SelAry && _global.editor.SelAry[Number(arysel)]) {
        contextmenu = 'ondblclick="KFDEditor.formatFileSelWin(event, KFDEditor.instance.' + editor.id
            + "," + uidata.id + ',this,' + arysel + ')"';

        return '<input class="easyui-textbox" style="width:100%;' + stylecssstr + '" ' + contextmenu + ' onfocusin="' + onfocusinmethod + '" onfocusout="' + methodstr + '" value="' + valuestr + '">';
    } else if ((filesel && filesel != "") || (propsel && propsel != "")) {
        contextmenu = 'ondblclick="KFDEditor.formatFileSelWin(event, KFDEditor.instance.' + editor.id
            + "," + uidata.id + ',this)"';

        return '<input class="easyui-textbox" style="width:100%;' + stylecssstr + '" ' + contextmenu + ' onfocusin="' + onfocusinmethod + '" onfocusout="' + methodstr + '" value="' + valuestr + '">';
    } else {
        ///数值区域选择
        let NUMRANGE = KFDEditor.GetPropTag(prop, "NUMRANGE");
        if (NUMRANGE && NUMRANGE != "") {
            //return retcomuistr + '<br/><input style="width: 100%;" type="range" id="volume" name="volume" min="0" max="11">';
            onfocusinmethod = methodstr.replace("endtextboxedit(",
                ("startrangeslider" + "('" + NUMRANGE + "',")
            );

            stylecssstr = stylecssstr + "cursor:s-resize;";
        } else {
            onfocusinmethod = methodstr.replace("endtextboxedit", "starttextboxedit").replace(castfunc, "'" + texttype + "'");
        }
    }
    //////////////

    return '<input class="easyui-textbox" style="width:100%;' + stylecssstr + '" ' + contextmenu + ' onfocusin="' + onfocusinmethod + '" onfocusout="' + methodstr + '" value="' + valuestr + '">';
}

KFDEditor.RemoveMixObjSet = function (e, ed, did, domui) {
    let uidata = ed.builddatas[did];
    let editor = uidata._editor;
    editor.SetData(uidata.id, "");
    editor.tg.treegrid("refresh", uidata.id);
}

KFDEditor.formatFileSetWin = function (e, ed, did, domui) {
    $('#selectwindow').window({
        left: e.pageX - 80,
        top: e.pageY + 20
    });

    $('#selectwindow').window('open');

    let uidata = ed.builddatas[did];
    let objprop = uidata._prop;
    if (uidata && objprop) {
        let clsAry = KFDEditor.GetClsDataAry(uidata);
        let editor = uidata._editor;
        let srcdata = editor.GetData(uidata.id, true);
        let defaultvalue = "";
        if (srcdata && objprop.otype != srcdata.__cls__) {
            let allcls = KFDPropTool.GetCanSelectScriptData(objprop, editor.kfdtable);
            for (let curcls of allcls) {
                if (curcls.label == srcdata.__cls__) {
                    defaultvalue = curcls.label0;
                    break;
                }
            }
        }

        $('#sw_scriptCombo').combotree('loadData', clsAry);
        $('#sw_scriptCombo').combotree('setValue', defaultvalue);
        $('#sw_scriptCombo').combotree('tree').tree({
            onSelect: function (node) {
                let editor = uidata._editor;
                editor.SetData(uidata.id, node.value, true);
                editor.tg.treegrid("refresh", uidata.id);
                $('#selectwindow').window('close');
            }
        });
    }
}

KFDEditor.formatFileSelWin = function (e, ed, did, domui, div) {

    $('#selectwindow').window({
        left: e.pageX - 80,
        top: e.pageY + 20
    });

    $('#selectwindow').window('open');

    let uidata = ed.builddatas[did];
    if (uidata && uidata._prop) {
        let clsAry = null;
        if (div == 99999) {
            clsAry = KFDEditor.GetClsDataAry(uidata);
        } else if (div != null) {
            clsAry = KFDPropTool.SelObjAry(div);
        } else {
            let filesel = KFDEditor.GetPropTag(uidata._prop, "FILESEL");
            let propsel = KFDEditor.GetPropTag(uidata._prop, "PROPSEL");

            if (filesel && filesel != "") {
                clsAry = KFDPropTool.SelPathAry(filesel);
            } else if (propsel && propsel != "") {
                clsAry = KFDPropTool.selPropAry(propsel);
            }

        }

        if (clsAry == null) return;

        let defaultvalue = domui.value;

        $('#sw_scriptCombo').combotree('loadData', clsAry);
        $('#sw_scriptCombo').combotree('setValue', defaultvalue);
        $('#sw_scriptCombo').combotree('tree').tree({
            onSelect: function (node) {
                if (div == 99999) {
                    if (node.children || node.value === "invalid") {
                        return;
                    }
                    let editor = uidata._editor;
                    editor.AddArrayData(uidata.id, node.value);
                } else {
                    domui.value = node.value;
                    domui.focus();
                }
                $('#selectwindow').window('close');
            }
        });
    }
}

KFDEditor.formatCodeSelWin = function (e, ed, did, domui, codesel) {
    let selectWin = $('#selectwindow');
    let combotree = $('#sw_scriptCombo');
    selectWin.window({
        left: e.pageX - 80,
        top: e.pageY + 20
    });
    selectWin.window('open');

    let uidata = ed.builddatas[did];
    if (uidata && _global.codeseldata) {
        let codeseldata = _global.codeseldata;
        if (codesel) {
            let blkmatchstrs = codesel.split('|');
            for (let i = 0; i < blkmatchstrs.length; ++i) {
                let matchstr = blkmatchstrs[i];
                if (matchstr === '__THIS_BLK__') {
                    blkmatchstrs[i] = _global.editor.blkdata.asseturl;
                }
            }
            codeseldata = [];
            for (let node of _global.codeseldata) {
                for (let matchstr of blkmatchstrs) {
                    if (node.text.match(matchstr)) {
                        codeseldata.push(node);
                    }
                }
            }
        }
        let defaultvalue = domui.value;
        combotree.combotree('loadData', codeseldata);
        combotree.combotree('setValue', defaultvalue);
        combotree.combotree('tree').tree({
            onSelect: function (node) {
                if (!node.children && node.value) {
                    domui.value = node.value;
                    domui.focus();
                }
                selectWin.window('close');
            }
        });
    }
}

KFDEditor.collapseRows = function (e, ed, did, domui, div) {
    let uidata = ed.builddatas[did];
    let sheet_name = uidata._src.__cls__;
    if (BuffEditor.IsBuffSheet(sheet_name) || BuffEditor.IsEffectSheet(sheet_name)) {
        BuffEditor.CollapseRows(ed, uidata);
    }
}

KFDEditor.sortRows = function (e, ed, did, domui, div) {
    let uidata = ed.builddatas[did];
    let sheet_name = uidata._src.__cls__;
    if (BuffEditor.IsBuffSheet(sheet_name) || BuffEditor.IsEffectSheet(sheet_name)) {
        BuffEditor.SortRows(ed, uidata);
    }
}

KFDEditor.GetClsInfoIncludedAndIgnored = function (prop, kfdtable) {
    let ret = {
        includes: [],
        ignores: [],
        includeCls: function (cls) {
            return this.includes.includes(cls) ||
                (this.includes.length === 0 && !this.ignores.includes(cls));
        }
    };
    if (!prop) return ret;
    let parseClassesStr= function (str) {
        let clsAry = [];
        let strParts = str.split('|');
        for (let item of strParts) {
            let itemParts = item.split(':');
            if (itemParts.length > 0) {
                let cls = itemParts[0];
                if (cls) {
                    let includeSelf = !(itemParts.length > 1 && Number(itemParts[1]) === 0);
                    let classess = kfdtable.get_kfddatas_extend(cls, includeSelf);
                    for (let clsdef of classess) {
                        clsAry.push(clsdef.value.class);
                    }
                }
            }
        }
        return clsAry;
    }
    let includeOTypesStr = KFDEditor.GetPropTag(prop, 'IncludeOTypes');
    if (includeOTypesStr) {
        ret.includes = parseClassesStr(includeOTypesStr);
    }
    if (prop.igotype) {
        ret.ignores = parseClassesStr(prop.igotype);
    }
    return ret;
}

KFDEditor.GetClsDataAry = function (uidata) {
    let objprop = uidata._prop;
    let editor = uidata._editor;
    if (objprop) {
        let curr__cls = "";
        if (uidata._src) {
            let currval = uidata._src[objprop.name];
            if (currval)
                curr__cls = currval.__cls__;
        }

        let selcomid = "selcls_" + editor.id + "_" + uidata.id;
        /*let addstr = 'KFDEditor.editmixobj(KFDEditor.instance.'
            + editor.id
            + ',' + uidata.id
            + ', this,\'' + selcomid + '\')';*/

        let allcls = KFDPropTool.GetCanSelectScriptData(objprop, editor.kfdtable);

        ///乎略一个分支
        let includeAndIgnoreCls = KFDEditor.GetClsInfoIncludedAndIgnored(objprop, editor.kfdtable);
        if (uidata._editor.id == "blkattrib")
            return KFDPropTool.SelClsAry(allcls, includeAndIgnoreCls, editor.kfdtable, false, []);
        else
            return KFDPropTool.SelClsAry(allcls, includeAndIgnoreCls, editor.kfdtable, false, ["KF","HD","RA"]);
    }
}

KFDEditor.name_formatter = function (value, uidata, index) {
    let vtype = uidata.vtype;
    let editor = uidata._editor;
    if (KFDEditor.IsSwitchVarEnabled(editor.curInprops)) {
        // 检查是否是转换变量
        let switchedVar = DynExecWrapperTool.GetSwitchedVar(uidata)
        if (switchedVar) {
            // 如果是数组元素，改掉名字
            if ((vtype === KFDataType.OT_OBJECT || vtype === KFDataType.OT_MIXOBJECT) && uidata.hasOwnProperty('_arrayindex')) {
                return "[动态变量对象]";
            }
        }
    }
    return value;
}

KFDEditor.formatter = function (value, uidata, index) {
    let vtype = uidata.vtype;
    let editor = uidata._editor;

    if (KFDEditor.IsSwitchVarEnabled(editor.curInprops)) {
        // 检查是否是转换变量
        let switchedVar = DynExecWrapperTool.GetSwitchedVar(uidata)
        if (switchedVar) {
            return KFDEditor.formatterVarTextbox(editor, uidata, vtype, value, switchedVar);
        }
    }

    if (KFDataType.Is_UnknowOrBaseType(vtype)) {
        let deletcomstr = "";
        if (uidata.uivalue == "#delete") {
            let removestr = 'KFDEditor.editremove(KFDEditor.instance.'
                + editor.id
                + ',' + uidata.id
                + ', this)';
            let colorstyle = 'white';
            if (uidata.uicolor)
                colorstyle = uidata.uicolor;
            deletcomstr = '<a href="#" onclick="' + removestr + '" style="color:' + colorstyle + '">删除</a>';
        }

        if (vtype == KFDataType.OT_BOOL) {
            let valuestr = value + "";

            let methodstr = 'KFDEditor.endbooledit(KFDEditor.instance.'
                + editor.id
                + ',' + uidata.id
                + ', this)';

            let CHECKSTR = (valuestr == "false" ? "" : 'checked');
            return deletcomstr + '<input type="checkbox" class="checkboxdef" onchange="' + methodstr + '" ' + CHECKSTR + '>';

        } else if (vtype == KFDataType.OT_BYTES) {
            return value;
        } else {
            //KFDEditor.GetPropTag(clsobj.value, "DEPRECATED");
            //<input type="range" id="volume" name="volume" min="0" max="11">

            ///查看是否有联动
            let comuistr = KFDEditor.formatterEnum(editor, uidata, vtype, value);
            if (comuistr) {
                return deletcomstr + comuistr;
            }
            let retcomuistr = deletcomstr + KFDEditor.formatterTextbox(editor, uidata, vtype, value);

            return retcomuistr;
        }
    } else if (vtype == KFDataType.OT_ARRAY) {
        if (uidata.uivalue && uidata.uivalue == "#NoAdd") {
            return "";
        } else {
            let addstr = 'KFDEditor.editadd(KFDEditor.instance.'
                + editor.id
                + ',' + uidata.id
                + ', this)';

            let colorstyle = 'white';
            if (uidata.uicolor)
                colorstyle = uidata.uicolor;

            return '<a href="#" onclick="' + addstr + '" style="color:' + colorstyle + '">添加</a>';
        }

    } else if (vtype == KFDataType.OT_MIXARRAY) {
        /*let selcomid = "selcls_" + editor.id + "_" + uidata.id;
        let addstr = 'KFDEditor.editadd(KFDEditor.instance.'
            + editor.id
            + ',' + uidata.id
            + ', this,\'' + selcomid + '\')';


        let allcls = editor.kfdtable.get_kfddatas_extend(uidata._prop.otype, uidata._prop.igobase != 1);
        ///乎略一个分支
        let igclsstr = "";
        if (uidata._prop.igotype) {
            igclss = editor.kfdtable.get_kfddatas_extend(uidata._prop.igotype, true);
            for (let clsdef of igclss) {
                igclsstr += "," + clsdef.value.class;
            }
        }

        let comstr = '<select id="' + selcomid + '" class="easyui-combobox" style="width: 60%;">';

        for (let i = 0; i < allcls.length; i++) {
            let clsobj = allcls[i];

            let DEPRECATED = KFDEditor.GetPropTag(clsobj.value, "DEPRECATED");
            if (DEPRECATED == "" || DEPRECATED == undefined) {
                if (igclsstr.indexOf("," + clsobj.value.class) == -1) {
                    comstr += '<option value="' + clsobj.label + '">' + clsobj.label0 + '</option>';
                }
            }
        }
        comstr += '</select>';
        return '<a href="#" onclick="' + addstr + '">添加</a>' + comstr;*/
        let add_str = '<a href="#" onclick="KFDEditor.formatFileSelWin(event, KFDEditor.instance.' + editor.id + ',' + uidata.id + ',this, 99999)">添加</a>';
        add_str += BuffEditor.RowsFormatter(editor, uidata);
        return add_str;
    } else if (vtype == KFDataType.OT_MIXOBJECT) {
        ///对象属性的MIXOBJECT才处理，MIXARRAY的不用处理
        /*let objprop = uidata._prop;
        if (objprop) {
            let curr__cls = "";
            if (uidata._src) {
                let currval = uidata._src[objprop.name];
                if (currval)
                    curr__cls = currval.__cls__;
            }

            let selcomid = "selcls_" + editor.id + "_" + uidata.id;
            let addstr = 'KFDEditor.editmixobj(KFDEditor.instance.'
                + editor.id
                + ',' + uidata.id
                + ', this,\'' + selcomid + '\')';


            let allcls = KFDPropTool.GetCanSelectScriptData(objprop, editor.kfdtable);
            
            let comstr = '<select id="' + selcomid + '" class="easyui-combobox" style="width: 60%;">';

            ///乎略一个分支
            let igclsstr = "";
            if (uidata._prop.igotype) {
                igclss = editor.kfdtable.get_kfddatas_extend(uidata._prop.igotype, true);
                for (let clsdef of igclss) {
                    igclsstr += "," + clsdef.value.class;
                }
            }

            for (let i = 0; i < allcls.length; i++) {
                let clsobj = allcls[i];
                let DEPRECATED = KFDEditor.GetPropTag(clsobj.value, "DEPRECATED");
                if (DEPRECATED == "" || DEPRECATED == undefined) {
                    if (igclsstr.indexOf("," + clsobj.value.class) == -1) {
                        if (clsobj.label == curr__cls)
                            comstr += '<option value="' + clsobj.label + '" selected>' + clsobj.label0 + '</option>';
                        else
                            comstr += '<option value="' + clsobj.label + '">' + clsobj.label0 + '</option>';
                    }
                }
            }
            comstr += '<option value="">清除</option>';
            comstr += '</select>';
            return '<a href="#" onclick="' + addstr + '">设置</a>' + comstr;
        }*/
        if (uidata && uidata._prop) {
            let objprop = uidata._prop;
            let defaultvalue = "";
            let srcdata = editor.GetData(uidata.id);
            //let srcdata = uidata._src;

            if (srcdata) {
                if (objprop.otype != srcdata.__cls__ || (uidata.children && uidata.children.length > 0)) //有点僵硬，要再思考下
                {
                    let allcls = KFDPropTool.GetCanSelectScriptData(objprop, editor.kfdtable);
                    for (let curcls of allcls) {
                        if (curcls.label == srcdata.__cls__) {
                            defaultvalue = curcls.label0;
                            defaultvalue = defaultvalue.split('[')[0];
                            break;
                        }
                    }
                }
            }
            if (defaultvalue == "") {
                return '<a href="#" onclick="KFDEditor.formatFileSetWin(event, KFDEditor.instance.' + editor.id + ',' + uidata.id + ',this)">设置</a>';
            } else {
                return '<font color="#ffff00">' + defaultvalue + '</font><a href="#" onclick="KFDEditor.formatFileSetWin(event, KFDEditor.instance.' + editor.id + ',' + uidata.id + ',this)"> 重设</a> <a href="#" onclick="KFDEditor.RemoveMixObjSet(event, KFDEditor.instance.' + editor.id + ',' + uidata.id + ',this)">清除</a>';
            }
        }
    } else if (vtype == KFDataType.OT_OBJECT) {
        let prop = uidata._prop;
        if (prop) {
            if (prop.otype === "EmbedFileData") {
                uidata.getHtmlString = function () {
                    let loadfilestr = 'KFDEditor.editEmbedFileData(KFDEditor.instance.'
                        + uidata._editor.id
                        + ',' + uidata.id
                        + ', this)';

                    let label = "浏览...";

                    let srcdata = uidata._src;
                    if (srcdata) {
                        let currdata = srcdata[prop.name];
                        if (currdata) {
                            label = currdata.path;
                            let delfilestr = 'KFDEditor.editEmbedFileData(KFDEditor.instance.'
                                + uidata._editor.id
                                + ',' + uidata.id
                                + ', this, true)';

                            return '<button onclick="' + delfilestr + '">清除</button><a href="#" onclick="' + loadfilestr + '">' + label + '</a>';
                        }
                    }

                    return '<a href="#" onclick="' + loadfilestr + '">' + label + '</a>';
                };

                return uidata.getHtmlString();
            } else if (prop.otype === 'hdNum'){
                if (uidata.value) {
                    let hdnum = hdNumToNumber(uidata.value);
                    return KFDEditor.formatterTextbox(editor, uidata, vtype, hdnum);
                }
            }
        }
    }

    if (uidata.uivalue == "#delete") {
        let removestr = 'KFDEditor.editremove(KFDEditor.instance.'
            + editor.id
            + ',' + uidata.id
            + ', this)';
        let colorstyle = 'white';
        if (uidata.uicolor)
            colorstyle = uidata.uicolor;
        return '<a href="#" onclick="' + removestr + '" style="color:' + colorstyle + '">删除</a>';
    }

    // 编辑 AND 删除
    if (uidata.uivalue == "#edit_delete") {
        let removestr_link = 'KFDEditor.editremove(KFDEditor.instance.'
            + editor.id
            + ',' + uidata.id
            + ', this)';
        let removestr = '<a href="#" onclick="' + removestr_link + '">删除</a>';
        let editstr_link = 'KFDEditor.editoneitem(KFDEditor.instance.'
            + editor.id
            + ',' + uidata.id
            + ', this)';
        let editstr = '<a href="#" onclick="' + editstr_link + '">编辑</a>';
        let extrastr = BuffEditor.FormatRowItem(uidata);
        return editstr + '      ' + removestr + extrastr;
    }

    return value;
}

KFDEditor._GetPropertyVarLable = function (prop) {
    if (prop.cname && prop.cname != "") return prop.cname + "(" + prop.name + ")";
    return prop.name;
}

KFDEditor._GetPropertyLable = function (prop) {
    if (prop.cname && prop.cname != "") return prop.cname;
    return prop.name;
}

KFDEditor._GetKFDLable = function (kfd) {
    if (kfd.cname && kfd.cname != "") return kfd.cname;
    return kfd.class;
}

KFDEditor._GetEnumValStr = function (defval, enumkfd) {
    ///形如class::xx,class.xx
    let defpropname = defval.replace(enumkfd["class"], "")
        .replace(/\:/g, "")
        .replace(/\./g, "");

    let propertys = enumkfd.propertys;
    for (let i = 0; i < propertys.length; i++) {
        let prop = propertys[i];
        if (prop.name == defpropname)
            return prop.default;
    }
    return null;
}

KFDEditor._GetInitValue = function (prop, vtype, kfdtable, pprop) {
    if (prop && pprop && pprop.default) {
        var pdefault = pprop.default;
        var sidx = pdefault.indexOf(prop.name + ":");
        if (sidx !== -1) {
            sidx = pdefault.indexOf(":", sidx);
            let eidx = pdefault.indexOf("|", sidx);
            prop.default = pdefault.substring(sidx + 1, eidx);
        }
    }
    let getdefaultstr = function (prop, defval) {
        let enumcls = prop.enum;
        if (enumcls && defval.indexOf(enumcls) != -1) {
            let enumkfd = kfdtable.get_kfddata(enumcls);
            if (enumkfd) {
                let defvarstr = KFDEditor._GetEnumValStr(defval, enumkfd);
                if (defvarstr)
                    return defvarstr;
            }
        }
        return defval;
    }

    if (vtype === KFDataType.OT_UNKNOW || KFDataType.Is_Number(vtype)) {
        let defval = 0;
        if (prop && prop.default) {
            defval = KFDEditor.CastValue(KFDataType.GetTypeID(prop.type), getdefaultstr(prop, prop.default));
        }
        return isNaN(defval) ? 0 : defval;
    } else if (vtype === KFDataType.OT_STRING) {
        let defval = prop && prop.default ? getdefaultstr(prop, prop.default) : "";
        if (prop && prop.type === "kfname") {
            return new KFDName(defval);
        }
        return defval;
    } else if (vtype === KFDataType.OT_BOOL) {
        return prop && prop.default ? prop.default === "true" : false;
    } else if (vtype === KFDataType.OT_OBJECT && prop.otype === 'hdNum') {
        return prop && prop.default ? hdNumFromDefaultStr(prop.default) : hdNumZero();
    }

    return null;
}

KFDEditor.prototype._onContextMenu = function (uidata, pos) {
    let menuui = $('#copymenu');

    _global.clipboard.editor = this;
    _global.clipboard.dataid = uidata.id;
    _global.clipboard.selcomid = "selcls_" + this.id + "_" + uidata.id;

    DynExecWrapperTool.ProcVarMenu(uidata, menuui);
    this.editTool.ProcCopyMenu(uidata, menuui);
    this.editTool.ProcSysMenu(uidata, menuui);
    this.ProcDebugMenu(uidata, menuui);

    menuui.menu('show', pos);
}

KFDEditor.prototype._newuidata = function (prop, parentdata) {
    let uidata = {};
    this.buildid += 1;
    this.builddatas[this.buildid] = uidata;
    uidata.id = this.buildid;
    uidata._editor = this;
    uidata._parent = parentdata;

    ///定义几个事件值
    let changeEvent = KFDEditor.GetPropTag(prop, "CHANGE");
    if (changeEvent) {
        let Event = this.Event;
        uidata._change = function (srcuidata) {
            Event.emit(changeEvent, uidata, srcuidata);
        }

        uidata._changEvent = 1;
    } else if (parentdata && parentdata._changEvent == 1) {
        uidata._changEvent = 1;
    }

    return uidata;
}

KFDEditor.prototype._BuildPropertyvalue = function (prop, uidata, data, inprops) {
    let typeid = KFDataType.GetTypeID(prop.type);
    let pname = prop.name;
    let pvalue = null;

    ///数据类型
    uidata.vtype = typeid;

    if (data && data.hasOwnProperty(pname)) {
        pvalue = data[pname];
    }
    let propiginfo = inprops ? inprops[pname] : null;

    if (KFDataType.Is_UnknowOrBaseType(typeid)) {
        ///有动态绑定的ENUM则可以用右键乎出
        let ecls = null;
        let nodestate = "";

        if (propiginfo) {
            if (propiginfo.__enum__)
                uidata.__enum__ = propiginfo.__enum__;
            ecls = propiginfo.__ecls__;
            nodestate = propiginfo.__state__ ? propiginfo.__state__ : "closed";
        }

        if (typeid == KFDataType.OT_BYTES && ecls != null) {
            bytesDatacls = ecls.class;
            let initfunc = ecls.init;

            ///如果是bytes对应的值
            if (pvalue == null) {
                pvalue = new KFBytes();
                data[pname] = pvalue;
            } else if (pvalue.object == null && pvalue.bytes) {
                let newobj = {__cls__: bytesDatacls};
                if (initfunc) {
                    initfunc(newobj);
                }

                if (newobj.read) {
                    newobj.read(pvalue.bytes);
                } else
                    newobj = KFDJson.read_value(pvalue.bytes, false, newobj);

                pvalue.object = newobj;
            }

            if (pvalue.object == null || pvalue.object.__cls__ == undefined) {
                pvalue.object = {__cls__: bytesDatacls};
                if (initfunc) {
                    initfunc(pvalue.object);
                }
            }

            uidata.value = "";
            uidata.state = nodestate;

            uidata.children = this._BuildObjectPropertyData(
                pvalue.object
                , this.kfdtable.get_kfddata(bytesDatacls)
                , propiginfo
                , uidata);
        } else if (pvalue == null) {
            let pprop = uidata._parent && uidata._parent._prop ? uidata._parent._prop : null;
            uidata.value = KFDEditor._GetInitValue(prop, typeid, this.kfdtable, pprop) + "";
        } else
            uidata.value = pvalue;
    } else {
        uidata.value = "";
        uidata.state = (propiginfo && propiginfo.__state__) ? propiginfo.__state__ : "closed";

        if (typeid == KFDataType.OT_OBJECT) {
            let kfdadata = this.kfdtable.get_kfddata(prop.otype);
            if (kfdadata && kfdadata.class === "hdNum") {
                if (!pvalue) {
                    let pprop = uidata._parent && uidata._parent._prop ? uidata._parent._prop : null;
                    uidata.value = KFDEditor._GetInitValue(prop, typeid, this.kfdtable, pprop);
                } else {
                    uidata.value = hdNumClone(pvalue);
                }
                // hdNum不创建子节点
                delete uidata.state
            } else {
                uidata.children = this._BuildObjectPropertyData(
                    pvalue
                    , kfdadata
                    , propiginfo
                    , uidata);
            }
        } else if (typeid == KFDataType.OT_MIXOBJECT) {
            uidata._propiginfo = propiginfo;

            if (pvalue && pvalue.hasOwnProperty("__cls__")) {
                let kfdadata = this.kfdtable.get_kfddata(pvalue.__cls__);
                uidata.children = this._BuildObjectPropertyData(
                    pvalue
                    , kfdadata
                    , propiginfo
                    , uidata);
            }
        } else if (
            typeid == KFDataType.OT_ARRAY
            || typeid == KFDataType.OT_MIXARRAY) {
            let arrchildren = [];

            uidata.children = arrchildren;
            ///保存住初始化的乎略信息
            uidata._propiginfo = propiginfo;

            ///数值类的数组
            let otypeid = KFDataType.GetTypeID(prop.otype);
            if (KFDataType.OT_UNKNOW == otypeid) {
                ///数组里包括子对象
                if (pvalue && (pvalue instanceof Array)) {
                    let itemkfd = this.kfdtable.get_kfddata(prop.otype);
                    // BUFF总表、效果表只显示ID+名字
                    let only_show_brief = BuffEditor.OnlyShowBrief(this.buffEditor.blkpath);
                    for (let k = 0; k < pvalue.length; k++) {
                        let kv = pvalue[k];
                        if (kv == null) continue;
                        let kuiobj = this._newuidata(prop, uidata);

                        kuiobj.vtype = typeid == KFDataType.OT_ARRAY
                            ? KFDataType.OT_OBJECT : KFDataType.OT_MIXOBJECT;
                        kuiobj._src = pvalue;
                        kuiobj.uivalue = "#delete";
                        kuiobj._arrayindex = k;

                        let kvkfd = null;
                        if (typeid == KFDataType.OT_ARRAY) {
                            kvkfd = itemkfd;
                        } else if (kv.hasOwnProperty("__cls__")) {
                            kvkfd = this.kfdtable.get_kfddata(kv.__cls__);
                        }

                        ///显示类的名称吧
                        kuiobj.name = this.SetEmbeddedScriptStyle(prop, kv, kvkfd);

                        // BUFF总表、效果表只显示ID+名字
                        if (!only_show_brief) {
                            kuiobj.children = this._BuildObjectPropertyData(kv, kvkfd, propiginfo, kuiobj);
                        }
                        kuiobj.value = kv;

                        // BUFF表显示ID+BUFF名字
                        BuffEditor.SetShowName(kuiobj);

                        arrchildren.push(kuiobj);
                    }
                }

            } else {
                //基础数据类型的数组
                if (pvalue && (pvalue instanceof Array)) {
                    for (let k = 0; k < pvalue.length; k++) {
                        let kv = pvalue[k];

                        let oprop = {type: prop.otype, name: k, enum: prop.enum, unknowtags: prop.unknowtags};
                        let kuiobj = this._newuidata(oprop, uidata);

                        kuiobj.name = k + "";
                        kuiobj.value = kv;
                        kuiobj.vtype = otypeid;
                        kuiobj._src = pvalue;
                        kuiobj._prop = oprop;
                        kuiobj.uivalue = "#delete";
                        kuiobj._arrayindex = k;

                        arrchildren.push(kuiobj);
                    }
                }
            }
        }
    }
}

KFDEditor.prototype._UpdateChildrenData = function (destdata, srcdata) {
    if (destdata.children == null || srcdata.children == null) return;
    if (destdata.children.length != srcdata.children.length) return;
    for (let i = 0; i < destdata.children.length; i++) {
        destdata.children[i].value = srcdata.children[i].value;
        destdata.children[i]._parent = destdata;
        destdata.children[i]._parentId = destdata.id;
        //destdata.children[i]._src = srcdata.children[i]._src;

        if (destdata.children[i].children != null && srcdata.children[i].children != null) {
            this._UpdateChildrenData(destdata.children[i], srcdata.children[i]);
        }
    }
}


KFDEditor.EditKFFrameData = null;
KFDEditor.prototype._BuildObjectPropertyData = function (data, kfddata, inprops, uiparentdata) {
    // 检查是否是转换变量，如果是子节点就不创建了
    if (uiparentdata && KFDEditor.IsSwitchVarEnabled(this.curInprops)) {
        let switchedVar = DynExecWrapperTool.GetSwitchedVar(uiparentdata)
        if (switchedVar) return null;
    }

    if (!this.ignoreKFFrameData && KFDEditor.EditKFFrameData && kfddata.class == "KFFrameData") {
        let editfunc = 'KFDEditor.EditKFFrameData(KFDEditor.instance.'
            + this.id
            + ',' + uiparentdata.id
            + ')';
        uiparentdata.value = "<a href='javascript:" + editfunc + "'>编辑</a>";
        return null;
    }

    let dynExecData = null;
    if (data && kfddata) {
        if (kfddata.class === "KFBlockTargetData") {
            ///判定类型的一致性
            let ceditor = _global.editor;
            let refs = (ceditor && ceditor.context) ? ceditor.context.refs : null;
            if (refs && data.asseturl && data.usingInitBytes) {
                var blkObjData = KFDPropTool.SyncLoadBLKObjData(data.asseturl);
                if (data.initBytes == null && blkObjData)
                    data.initBytes = blkObjData;
                let objref = refs[data.asseturl];
                if (objref && objref.type) {
                    let metadef = this.CreateMetaEditDef(objref.type);
                    if (inprops) {
                        inprops.initBytes = metadef.data;
                    } else {
                        inprops = {initBytes: metadef.data};
                    }
                }
            } else if (false == data.usingInitBytes) {
                data.initBytes = null;
            }
        } else if (kfddata.class === "SDMap") {
            if (inprops) {
                inprops.vars = {__ecls__: {class: "eAttribList", init: VarsInit}}
            } else {
                inprops = {vars: {__ecls__: {class: "eAttribList", init: VarsInit}}}
            }
        } else if (kfddata.class === "GSDynamicExecuteData") {
            if (KFDEditor.IsSwitchVarEnabled(this.curInprops)) {
                let newData = DynExecWrapperTool.PrepareEditorData(data, kfddata, uiparentdata, this);
                if (newData) {
                    if (newData.Invalid) return null;
                    if (newData.Data) {
                        if (!newData.NoDynExec) {
                            dynExecData = data;
                        }
                        data = newData.Data;
                        kfddata = this.kfdtable.get_kfddata(data.__cls__);
                    }
                }
            }
        }
    }

    /// 正常的流程

    let uidatas = [];
    let allprops = KFDPropTool.GetAllKFDProperty(kfddata, this.kfdtable);

    for (let i = 0; i < allprops.length; i++) {
        let prop = allprops[i];
        // 标记为仅网络同步的字段，跳过
        if (prop["net"] && (prop["net"].toLowerCase() == "only")) continue;

        if ((inprops && inprops[prop.name] == false) || KFDEditor.GetPropTag(prop, "EDIT") == "NO") {
            continue;
        }

        if (!KFDPropTool.VisibleProp(prop, allprops, data)) continue;

        let pdata = this._newuidata(prop, uiparentdata);
        if (data && KFDPropTool.IsScriptDataProperty(data.__cls__, this.kfdtable)) {
            pdata.name = KFDEditor._GetPropertyVarLable(prop);
        } else {
            pdata.name = KFDEditor._GetPropertyLable(prop);
        }
        pdata._prop = prop;
        pdata._src = data;
        pdata._editor = this;
        if (dynExecData) pdata._dynExecData = dynExecData;

        ///获取数据类型
        this._BuildPropertyvalue(prop, pdata, data, inprops);

        uidatas.push(pdata);
    }

    return uidatas;
}


KFDEditor.prototype._BuildSrcData = function (uidata) {
    if (uidata._src) {
        return uidata._src;
    }

    let parentdata = uidata._parent;
    if (parentdata) {
        let parentsrc = parentdata._src;
        if (!parentsrc) {
            parentsrc = this._BuildSrcData(parentdata);
        }
        if (parentsrc) {
            ///不存在数组的可能性
            let prop = parentdata._prop;
            let newsrc = parentsrc[prop.name];

            if (!newsrc) {
                newsrc = {__cls__: prop.otype};
                parentsrc[prop.name] = newsrc;
            }

            uidata._src = newsrc;

            return newsrc;
        }
    }

    return null;
}

KFDEditor.prototype.FireChangeEvent = function (uidata, srcuidata) {
    //_changEvent

    if (uidata && uidata._changEvent == 1) {
        if (!srcuidata)
            srcuidata = uidata;

        if (uidata._change) {
            uidata._change(srcuidata);
        }
        this.FireChangeEvent(uidata._parent, srcuidata);
    }

    // BUFF总表变动
    BuffEditor.OnBuffChange(uidata);

    if (KFDEditor.IsSwitchVarEnabled(this.curInprops)) {
        DynExecWrapperTool.OnChangeEvent(uidata);
    }
}
KFDEditor.prototype.UpdateAllNode = function (uiddata) {
    if (uiddata.children) {
        for (let childdata of uiddata.children) {
            this.UpdateAllNode(childdata);
        }
    } else {
        this.tg.treegrid("update", {id: uiddata.id, row: uiddata});
    }
}
KFDEditor.prototype.UpdateUIData = function (uidata, newsrcdata) {
    if (uidata.children && newsrcdata) {
        if (uidata.vtype == KFDataType.OT_ARRAY || uidata.vtype == KFDataType.OT_MIXARRAY || (uidata._parent && uidata._parent.vtype == KFDataType.OT_ARRAY) || (uidata._parent && uidata._parent.vtype == KFDataType.OT_MIXARRAY)) {
            if (uidata._src == null) {
                uidata.value = newsrcdata;
                uidata._src.push(uidata.value);
            }
            let index = uidata._parent.children.indexOf(uidata);
            uidata.value = uidata._src[index] = newsrcdata;
        } else if (uidata.vtype == KFDataType.OT_OBJECT || uidata.vtype == KFDataType.OT_MIXOBJECT || (uidata._parent && uidata._parent.vtype == KFDataType.OT_OBJECT) || (uidata._parent && uidata._parent.vtype == KFDataType.OT_MIXOBJECT)) {
            let index = uidata.children.indexOf(uidata);
            uidata._src = uidata.value = newsrcdata;
        }
        let keys = Object.keys(newsrcdata);
        if (keys && keys.length > 0) {
            for (let k = 0; k != keys.length; k++) {
                let key = keys[k];
                let len = uidata.children.length;
                for (let i = 0; i != len; i++) {
                    let childItem = uidata.children[i];
                    if (childItem._prop && childItem._prop.name == key) {
                        let _src = newsrcdata[key];
                        this.UpdateUIData(childItem, _src);
                        break;
                    }
                }
            }
        }
        return;
    }
    if (uidata._src == null)
        uidata._src = {};
    uidata._src = uidata.value = newsrcdata;
}

KFDEditor.prototype.Resetdata2 = function (uiddata) {
    if (!uiddata) return;

    let srcdata = uiddata._src;
    if (srcdata) {
        let srcprp = uiddata._prop;
        if (srcprp) {
            delete srcdata[srcprp.name];
            /// 值对象
            if (!uiddata.children) {
                uiddata.value = KFDEditor._GetInitValue(srcprp, KFDataType.GetTypeID(srcprp.type), this.kfdtable) + "";
            }
        }
    }

    if (uiddata.children) {
        for (let childdata of uiddata.children) {
            this.Resetdata2(childdata);
        }
    }
}

KFDEditor.prototype.Resetdata = function (dataid) {
    let uiddata = this.builddatas[dataid];
    this.Resetdata2(uiddata);
    this.UpdateAllNode(uiddata);
}

KFDEditor.prototype.WatchVar = function (dataid, type) {
    let uiddata = this.builddatas[dataid];
    if (uiddata && uiddata.value) {
        let varpath = "";
        if (typeof uiddata.value == "string") {
            varpath = uiddata.value;
        } else if (uiddata.value instanceof KFDName) {
            varpath = uiddata.value.toString();
        }
        if (varpath != "") {
            _global.EmitToGlobal("WatchVar", {"vartype": type, "varpath": varpath});
        }
    }
}

KFDEditor.prototype.SetData = function (dataid, value, force = false) {
    let uiddata = this.builddatas[dataid];
    this.SetData2(uiddata, value, force);
}

KFDEditor.prototype.SetData2 = function (uiddata, value, force = false, frompaste = false) {
    let srcdata = uiddata ? uiddata._src : null;
    if (_global.editor && _global.editor.edaction)
        _global.editor.edaction.AddAction();
    if (!srcdata) {
        srcdata = this._BuildSrcData(uiddata);
    }
    if (!srcdata) return;

    let srcprp = null;
    let ptype = null;

    // 检查是否是转换变量
    let switchedVar = null;
    if (KFDEditor.IsSwitchVarEnabled(this.curInprops)) {
        switchedVar = DynExecWrapperTool.GetSwitchedVar(uiddata);
    }
    if (!frompaste && switchedVar) {
        DynExecWrapperTool.SetVarPath(switchedVar, value);
    } else {
        if (uiddata._prop) {
            ///由传入者决定值的正确性
            ///特殊处理下KFDName 或其他
            srcprp = uiddata._prop;
            ptype = srcprp.type;

            if (ptype === "kfname" && typeof (value) === 'string') {
                let kfnvalue = srcdata[srcprp.name];
                if (!kfnvalue) {
                    kfnvalue = new KFDName();
                    srcdata[srcprp.name] = kfnvalue;
                }

                kfnvalue.setString(value);
            } else if (ptype === "mixobject") {
                let pvalue = srcdata[srcprp.name]
                if (pvalue) {
                    if (pvalue.__cls__ === value && !force)
                        return;
                    ///删除原来的子项
                    let deli = uiddata.children ? uiddata.children.length - 1 : -1;
                    while (deli >= 0) {
                        this.tg.treegrid("remove", uiddata.children[deli].id);
                        deli -= 1;
                    }
                }

                ///清空数据
                if (value === "") {
                    srcdata[srcprp.name] = null;
                    this.FireChangeEvent(uiddata);
                    return;
                }

                if (typeof (value) === 'string') {
                    pvalue = {__cls__: value};
                } else {
                    pvalue = value;
                }
                srcdata[srcprp.name] = pvalue;
                ///构建MIXOBJECT的显示
                let propiginfo = uiddata._propiginfo;
                let children = this._BuildObjectPropertyData(
                    pvalue
                    , this.kfdtable.get_kfddata(pvalue.__cls__)
                    , propiginfo
                    , uiddata);

                //uiddata.children = children;
                //this.tg.treegrid("refresh",uiddata.id);
                this.tg.treegrid("append",
                    {
                        parent: uiddata.id,
                        data: children
                    });
            } else if (ptype === "object") {
                if (srcprp && srcprp.otype === 'hdNum') {
                    let pvalue = uiddata.value;
                    if (pvalue) {
                        if (frompaste) {
                            pvalue.rawValue = hdNumRaw(value);
                        } else {
                            if (hdNumToNumber(pvalue) !== Number(value)) {
                                pvalue.rawValue = hdNumRawValueFromNumber(Number(value));
                            }
                        }
                        srcdata[srcprp.name] = hdNumClone(pvalue);
                    }
                } else {
                    ///删除原来的子项
                    let deli = uiddata.children ? uiddata.children.length - 1 : -1;
                    while (deli >= 0) {
                        this.tg.treegrid("remove", uiddata.children[deli].id);
                        deli -= 1;
                    }
                    let pvalue = value;
                    srcdata[srcprp.name] = pvalue;
                    ///构建OBJECT的显示
                    let propiginfo = uiddata._propiginfo;
                    let children = this._BuildObjectPropertyData(
                        pvalue
                        , this.kfdtable.get_kfddata(srcprp.otype)
                        , propiginfo
                        , uiddata);
                    this.tg.treegrid("append",
                        {
                            parent: uiddata.id,
                            data: children
                        });
                }
            } else {
                srcdata[srcprp.name] = value;
            }
        } else {
            // 理论上只有复制粘贴相关设置会走到这个分支
            // 并且当前的状态是：父级是数组类型，并且当前为object或mixobject
            if (uiddata._parent && uiddata._parent._prop) {
                srcprp = uiddata._parent._prop;
                ptype = srcprp.type;
                if (ptype === 'arr' || ptype === 'mixarr') {
                    if (uiddata._parent.children) {
                        let index = uiddata._parent.children.indexOf(uiddata);
                        if (index === -1) return;
                        ///删除原来的子项
                        let deli = uiddata.children ? uiddata.children.length - 1 : -1;
                        while (deli >= 0) {
                            this.tg.treegrid("remove", uiddata.children[deli].id);
                            deli -= 1;
                        }
                        srcdata[index] = value;
                        let clsname = value && value.__cls__ ? value.__cls__ : "";
                        if (!clsname && uiddata._parent._prop && uiddata._parent._prop.otype) {
                            clsname = uiddata._parent._prop.otype;
                        }
                        ///构建显示
                        let propiginfo = uiddata._propiginfo;
                        let children = this._BuildObjectPropertyData(
                            value
                            , this.kfdtable.get_kfddata(clsname)
                            , propiginfo
                            , uiddata);
                        this.tg.treegrid("append",
                            {
                                parent: uiddata.id,
                                data: children
                            });
                    }
                }
            }
        }
    }

    let curData = uiddata;
    let curParentData = uiddata;
    while (curParentData != null) {
        curData = curParentData
        curParentData = curData._parent;
    }
    let refreshFlag = true;
    if (srcprp) {
        if (document.getElementById("frameproperty")) {
            this.SaveSliderPosition = document.getElementById("frameproperty").scrollTop;
        }
        this.Event.emit("OnDataChange", srcprp, refreshFlag);
    }
    _global.PreventShortKey = false;
    this.FireChangeEvent(uiddata);
    this.Refresh(uiddata, refreshFlag);
    /*if(uiddata.relateUiId > 0)
    {
        this.tg.treegrid("refresh",uiddata.relateUiId);
    }
    else if(uiddata._parent && uiddata._parent.relateUiId > 0)
    {
        this.tg.treegrid("refresh",uiddata._parent.relateUiId);
    }*/
}

///只能用于字符串的获取哈，其他没有验证
KFDEditor.prototype.GetData = function (dataid, nullbuild) {
    let uiddata = this.builddatas[dataid];
    return this.GetData2(uiddata, nullbuild);
}

KFDEditor.prototype.GetDataByName = function (dataname, nullbuild) {

    for (var key in this.builddatas) {
        if (this.builddatas[key].name == dataname) {
            uiddata = this.builddatas[key];
            return this.GetData2(uiddata, nullbuild);
        }
    }

    return null;
}

KFDEditor.prototype.GetData2 = function (uiddata, nullbuild) {
    if (!uiddata) {
        return null;
    }

    let srcdata = uiddata._src;
    let srcprp = uiddata._prop;
    if (srcdata && srcprp) {
        let editdata = srcdata[srcprp.name];
        if (!editdata && nullbuild && srcprp.otype) {
            editdata = {__cls__: srcprp.otype};
            srcdata[srcprp.name] = editdata;
        }
        return editdata;
    }

    return null;
}


KFDEditor.prototype.AddArrayData = function (dataid, value) {
    let uiddata = this.builddatas[dataid];
    if (_global.editor && _global.editor.edaction)
        _global.editor.edaction.AddAction();

    let srcdata = uiddata._src;

    if (!srcdata) {
        srcdata = this._BuildSrcData(uiddata);
    }

    if (srcdata) {
        let srcprp = uiddata._prop;
        let arrdata = srcdata[srcprp.name];
        if (!arrdata || !arrdata.push) {
            arrdata = [];
            srcdata[srcprp.name] = arrdata;
        }
        ///在数组中增加一项
        let k = arrdata.length;
        let kuiobj = null;
        ///数值类的数组
        let otypeid = KFDataType.GetTypeID(srcprp.otype);
        if (KFDataType.OT_UNKNOW == otypeid) {
            ///数组里包括子对象
            let itemkfd = this.kfdtable.get_kfddata(srcprp.otype);
            let typeid = uiddata.vtype;
            let kv = {};
            let objvalue = false;
            if (typeof (value) !== 'string' && value) {
                objvalue = true;
                kv = value;
            }
            kuiobj = this._newuidata(null, uiddata);
            kuiobj.vtype = typeid == KFDataType.OT_ARRAY ? KFDataType.OT_OBJECT : KFDataType.OT_MIXOBJECT;
            kuiobj._src = arrdata;
            kuiobj.value = kv;

            let kvkfd = null;
            if (typeid == KFDataType.OT_ARRAY) {
                kvkfd = itemkfd;
            } else {
                if (objvalue) {
                    kvkfd = this.kfdtable.get_kfddata(value.__cls__);
                } else {
                    kvkfd = this.kfdtable.get_kfddata(value);
                    kv.__cls__ = value;
                }
            }

            ///判定是否需要初始化
            if (!objvalue) {
                KFDJson.init_object(kv, kvkfd);
            }

            kuiobj.name = this.SetEmbeddedScriptStyle(srcprp, kv, kvkfd);

            kuiobj.children = this._BuildObjectPropertyData(kv, kvkfd, uiddata._propiginfo, kuiobj);
            kuiobj.uivalue = "#delete";
            kuiobj._arrayindex = k;

            arrdata.push(kv);
            //uiddata.children.push(kuiobj);

            this.tg.treegrid("append", {
                parent: uiddata.id,
                data: [kuiobj]
            });

            this.tg.treegrid("expand", uiddata.id);
        } else {

            //基础数据类型的数组
            let oprop = {name: k, type: srcprp.otype, enum: srcprp.enum, unknowtags: srcprp.unknowtags};
            let kv = value;
            if (value == null || value === "") {
                kv = KFDEditor._GetInitValue(oprop, otypeid, this.kfdtable);
            }
            kuiobj = this._newuidata(oprop, uiddata);
            kuiobj.name = k + "";
            kuiobj.vtype = otypeid;
            kuiobj._src = arrdata;
            kuiobj._prop = oprop
            kuiobj.value = kv;
            kuiobj.uivalue = "#delete";
            kuiobj._arrayindex = k;

            arrdata.push(kv);

            //uiddata.children.push(kuiobj);
            this.tg.treegrid("append",
                {
                    parent: uiddata.id,
                    data: [kuiobj]
                });

            this.tg.treegrid("expand", uiddata.id);
        }

        this.Event.emit("OnDataChange", srcprp, false);
        _global.PreventShortKey = false;
        this.FireChangeEvent(uiddata);
        return kuiobj;
    }
}

KFDEditor.prototype.RemoveArrayData = function (dataid) {
    let uiddata = this.builddatas[dataid];
    let uiparent = uiddata._parent;

    let srcdata = uiddata._src;

    if (srcdata) {
        if (_global.editor && _global.editor.edaction)
            _global.editor.edaction.AddAction();

        for (let i = srcdata.length - 1; i >= 0; i--) {
            if (srcdata[i] == uiddata.value) {
                srcdata.splice(i, 1);
                break;
            }
        }

        ///从UI中删除吧
        this.tg.treegrid("remove", uiddata.id);
        this.Event.emit("OnDataChange", uiparent._prop, true);
        _global.PreventShortKey = false;
        this.FireChangeEvent(uiddata);
    }
}

KFDEditor.prototype.EditOneItemData = function (dataid) {
    let uidata = this.builddatas[dataid];
    //let uiparent = uiddata._parent;
    //let srcdata = uiddata._src;

    if (uidata.value.__cls__ == "KF8SpecialStatusInfo") {
        this.buffEditor.EditOneBuff(uidata);
    } else if (uidata._parent._src.__cls__ == "KF8SSEFSheet") {
        this.buffEditor.EditOneBuffEffect(uidata);
    }
}


KFDEditor.prototype.LoadEmbedFileData = function (dataid, domele, delfile) {
    let uiddata = this.builddatas[dataid];
    let srcdata = uiddata._src;

    if (delfile) {

        if (srcdata) {
            let srcprp = uiddata._prop;
            let propname = srcprp.name;
            delete srcdata[propname];
        }

        domele.parentElement.innerHTML = uiddata.getHtmlString();

        return;
    }

    if (!srcdata) {
        srcdata = this._BuildSrcData(uiddata);
    }

    if (srcdata) {
        let srcprp = uiddata._prop;
        let propname = srcprp.name;
        let embeddata = srcdata[propname];
        let defpath = (embeddata ? embeddata.path : _global.appdatapath);

        let editor = this;

        defpath = defpath.replace(/\//g, "\\");

        let files = fileOpenDialog({properties: ['openFile'], defaultPath: defpath});
        if (files) {
            IKFFileIO_Type.instance.asyncLoadFile(files[0],
                function (ret, data, path) {
                    if (!ret) {
                        Alert("错误", "文件加载失败:" + path);
                    } else {
                        if (embeddata == null) {
                            embeddata = {__cls__: "EmbedFileData"};
                            srcdata[propname] = embeddata;
                        }

                        embeddata.path = path.replace(/\\/g, "/");

                        let kfbytes = new KFBytes();

                        kfbytes.bytes = new KFByteArray(data);
                        embeddata.data = kfbytes;

                        if (domele) {
                            domele.parentElement.innerHTML = uiddata.getHtmlString();
                        }
                    }
                }
                , "");
        }
    }
}

KFDEditor.prototype.Refresh = function (uidata, needRefresh = true, forceRefresh = false) {

    let refreshTag = false;
    if (forceRefresh) {
        refreshTag = true
    } else if (uidata && uidata._prop && needRefresh) {
        refreshTag = KFDEditor.GetPropTag(uidata._prop, "Refresh");
    }
    if (refreshTag && this.curData && this.curInprops) {
        this.Edit(this.curData, this.curInprops);
        //this.tg.treegrid('expandAll');
        this.IterExpand(uidata);
    }

}

KFDEditor.prototype.IterExpand = function (uidata) {
    if (uidata._parent != null) {
        this.tg.treegrid("expand", uidata._parentId);
        this.IterExpand(uidata._parent)
    }
}

KFDEditor.prototype.Edit = function (data, inprops) {
    this.uidatas = null;
    let uidatas = null;

    this.curData = data;
    this.curInprops = inprops;

    if (data) {
        if (!data.hasOwnProperty("__cls__")) {
            if (inprops && inprops.hasOwnProperty("__ecls__")) {
                data.__cls__ = inprops.__ecls__;
            } else {
                Nt("未知类型不能编辑");
                return;
            }
        }

        let clsname = data.__cls__;
        let kfddata = this.kfdtable.get_kfddata(clsname);

        this.buildid = 0;
        this.builddatas = {};

        uidatas = this._BuildObjectPropertyData(data, kfddata, inprops);
        if (!uidatas) return;
    } else
        uidatas = [];
    var flag = this.PreEdit(uidatas);
    this.tg.treegrid('loadData', uidatas);
    // 仅针对帧属性展开
    if (flag) {
        if (uidatas && uidatas.length > 2 && uidatas[1].children && uidatas[1].children.length > 1) {
            this.tg.treegrid('remove', uidatas[1].children[0].id);
        }
        for (let i = 0; i < uidatas.length; i++) {
            if (uidatas[i].children) {
                this.tg.treegrid("expand", uidatas[i].id);
            }
        }
        //this.tg.treegrid("expandAll");
    }

    let list = [];
    for (let j = 0; j < this.recordNodes.length; j++) {
        list.push(this.recordNodes[j]);
    }
    if (list.length) {
        this.tg.treegrid("collapseAll");
        for (let i = 0; i < list.length; i++) {
            this.tg.treegrid("expand", list[i]);
        }
    }


    this.uidatas = uidatas;

    if (document.getElementById("frameproperty")) {
        document.getElementById("frameproperty").scrollTop = this.SaveSliderPosition;
    }
}

KFDEditor.prototype.SelectFieldPath = function (fieldPath) {
    if (this.uidatas) {
        let uidata = KFDEditTool.GetUIDataByFieldPath(fieldPath, this.uidatas);
        if (uidata) {
            this.IterExpand(uidata);
            this.tg.treegrid('scrollTo', uidata.id).treegrid('select', uidata.id);
        }
    }
}

KFDEditor.prototype.CreateMetaEditDef = function (metaclass) {
    return {
        fields: false
        , classData: {__state__: "open"}
        , data: {
            __state__: "open"
            , __ecls__: {class: metaclass}
            , vars: {__ecls__: {class: "eAttribList", init: VarsInit}}
        }
    };
}

KFDEditor.prototype.IsMonacoSrcUIDMatched = function (uid) {
    return KFDEditor.monacosrcuid === uid;
}

//framedata
KFDEditor.OpenFDEditorWindow = function (srcdata, editor, autoopen, seqId, fieldPath) {
    if (!autoopen && (KFDEditor.FDEditorWindow == null || KFDEditor.FDEditorWindow.visible == false)) return;

    if (!KFDEditor.FDEditorWindow) {
        KFDEditor.FDEditorWindow = new FrameDataWindow(editor.kfdtable);
    }

    KFDEditor.FDEditorWindow.Open(srcdata, "KFFrameData", seqId, fieldPath);

    KFDEditor.monacosrcuid = null;
}

KFDEditor.CloseFDEditorWindow = function () {
    if (KFDEditor.FDEditorWindow)
        KFDEditor.FDEditorWindow.Close();
}

KFDEditor.EditKFFrameData = function (editor, dataid, seqId = 0, fieldPath = null) {
    let srcdata = editor.GetData(dataid, true);
    KFDEditor.OpenFDEditorWindow(srcdata, editor, true, seqId, fieldPath);
}

KFDEditor.EditKFFrameDataByName = function (editor, dataname, seqId = 0, fieldPath = null) {
    let srcdata = editor.GetDataByName(dataname, true);
    KFDEditor.OpenFDEditorWindow(srcdata, editor, true, seqId, fieldPath);
}

_global.Event.on("OnFrameDataSelected", function (srcdata, editor, autoopen, seqId, fieldPath) {
    KFDEditor.OpenFDEditorWindow(srcdata, editor, autoopen, seqId, fieldPath);
});

_global.Event.on("OnFrameDataSelectedByName", function (dataname, editor, autoopen, seqId, fieldPath) {
    let srcdata = editor.GetDataByName(dataname, true);
    KFDEditor.OpenFDEditorWindow(srcdata, editor, autoopen, seqId, fieldPath);
});

_global.Event.on('FrameDataSelectedSeqIDChanged', function (seqID) {
    KFDEditor.monacosrcuid = null;
});

_global.Event.on("Ready", function () {
    ///临时支持一下FName吧
    KFDataType.GetTypeID("FName");
    KFDataType.Type_to_ids["FName"] = KFDataType.OT_STRING;
})