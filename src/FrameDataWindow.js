//const {isString} = require("mocha/lib/utils");

function FrameDataWindow(_kfdtable) {
    this.dg = $('#fd_first');
    this.tg = $('#fd_sec');
    this.kfdTable = _kfdtable;
    this.visible = false;
    this.hoverNodeId = -1;

    this.CopyScriptObjs = [];
    this.StartCopy = false;
    this.SelectedRow = null;
    this.comboId = 0;
    this.seqId = 0;
    this.fieldPath = null;
    _global.seqId = 0;
    this.InitUI();

    window.addEventListener("paste", function (e) {
        const clipdata = e.clipboardData || window.clipboardData;
        console.log("主动粘贴", clipdata.getData("text/plain"));
        var str = clipdata.getData("text/plain");
        var stringResult = str.split('_').map(Number);
        if (_global.editor && _global.editor.edaction)
            _global.editor.edaction.AddAction();

        let buff = new Uint8Array(stringResult);
        let kfbytearr = new KFByteArray(buff);
        let newScriptObj = KFDJson.read_value(kfbytearr, false);
        if (!newScriptObj) return;
        newScriptObj.editor = KFDEditor.FDEditorWindow;
        let scriptArr = KFDEditor.FDEditorWindow._src[KFDEditor.FDEditorWindow.scriptProp.name];
        if (scriptArr) {
            scriptArr.push(newScriptObj);
            KFDEditor.FDEditorWindow.dg.datagrid('loadData', {total: scriptArr.length, rows: scriptArr});
        }
    });
}

FrameDataWindow.prototype.Dispose = function () {
    // this.btn_New.off('click');
    // this.btn_Switch.off('click');
    // this.btn_Debug.off('click');
    // this.btn_Delete.off('click');
    // this.parentEditor.fdWindow = null;
}

FrameDataWindow.prototype.InitUI = function () {
    let framedata = this;
    this.dg.datagrid({
        fit: true,
        remoteSort: false,
        singleSelect: true,
        nowrap: false,
        fitColumns: true,
        scrollbarSize: 0,
        rownumbers: true,
        selectOnCheck: false,
        checkOnSelect: false,
        autoRowHeight: true,
        view: detailview,
        detailFormatter: FrameDataWindow.DetailFormatter,

        onLoadSuccess: function (node, data) {
            $(this).datagrid('enableDnd');
            let idx = setTimeout(function () {
                framedata.dg.datagrid('selectRow', framedata.seqId);
                clearTimeout(idx);
            }, 10);
            let func_toolTip_content = function (rowIdx) {
                if (node != undefined && node.rows != undefined && node.rows.length > rowIdx) {
                    let cls_tooltip = undefined;
                    let rowData = node.rows[rowIdx];
                    rowData = FrameDataWindow.GetRowDataForScriptDesc(rowData);
                    cls_tooltip = FrameDataWindow.GetDescBlkValue(rowData.__cls__, 'tooltip');
                    if (cls_tooltip != undefined && cls_tooltip.length > 0) {
                        let result = ScriptDescParser.Parse(new Statement(0, cls_tooltip.length, cls_tooltip), rowData);
                        cls_tooltip = result != undefined ? result.state_str : cls_tooltip;
                    }
                    return cls_tooltip != undefined && cls_tooltip.length > 0 ? cls_tooltip : rowData.__cls__;
                }
                return "";
            };
            $(this).datagrid("getPanel").panel("body").delegate("tr.datagrid-row", {
                "mouseenter.datagrid-extensions": function (e) {
                    let tr = $(this);
                    let attr = tr.attr("datagrid-row-index");
                    let rowIdx = (attr == null || attr == undefined || attr == "") ? -1 : window.parseInt(attr, 10);
                    tr.each(function () {
                        if (!$.data(this, "tooltip")) {
                            $(this).tooltip({
                                content: func_toolTip_content(rowIdx),
                                trackMouse: true,
                                showDelay: 100,
                            }).tooltip("show");
                        }
                    });
                },
                "mouseleave.datagrid-extensions": function () {
                    let tr = $(this);
                    tr = tr || $(target).datagrid("getRowDom", index);
                    tr.tooltip("destroy").children("td[field]").each(function () {
                        $(this).tooltip("destroy");
                    });
                }
            });
        },
        onBeforeSelect: function () {
            if (document && document.activeElement)
                document.activeElement.blur();
        },
        onSelect: function (rowIndex, rowData) {
            $('#fd_sec_label').bind("onchange", function () {
                FrameDataWindow.OnLabelStrChange(this, rowData)
            })
            framedata.seqId = rowIndex;
            _global.seqId = rowIndex;
            FrameDataWindow.OnSelectDGRow(this, rowIndex, rowData);
            rowData._selected = true;
            framedata.fieldPath = null;
            _global.Event.emit("FrameDataSelectedSeqIDChanged", rowIndex);
        },
        onRowContextMenu: function (evt, index, row) {
            KFDEditor.FDEditorWindow.SelectedRow = row;
            evt.preventDefault();
            $('#tlscriptmenu').menu('show', {
                left: evt.pageX,
                top: evt.pageY
            });
        }
    });

    this.fdWin = $('#fdwindow');
    this.fdWin.window({
        onOpen: function () {
            _global.PreventShortKey = true;
        },
        onBeforeClose: function () {
            FrameDataWindow.SetGlobalOffset(this.fdWin.offset().left, this.fdWin.offset().top);
            this.Clear();
            this.visible = false;
            return true;
        }.bind(this),
        onClose: function () {
            _global.PreventShortKey = false;
            this.Dispose();
        }.bind(this),
        onMove: function (left, top) {
            var width = $(this).panel('options').width;
            var height = $(this).panel('options').height;
            var parentWidth = $("body").width();
            var parentHeight = $("body").height();
            var scrollLeft = document.body.scrollLeft;
            var scrollTop = document.body.scrollTop;
            // 当弹出框尺寸大于浏览器大小时，弹出框自动缩小为浏览器当前尺寸
            if (width > parentWidth)
                $(this).window('resize', {
                    width: parentWidth - 1
                });
            if (height > parentHeight)
                $(this).window('resize', {
                    height: parentHeight - 1
                });
            // 当弹出框被拖动到浏览器外时，将弹出框定位至浏览器边缘
            if (left < scrollLeft) {
                $(this).window('move', {
                    left: scrollLeft
                });
            }
            if (top < scrollTop) {
                $(this).window('move', {
                    top: scrollTop
                });
            }
            if (left > scrollLeft && left > parentWidth - width + scrollLeft) {
                $(this).window('move', {
                    left: parentWidth - width + scrollLeft
                });
            }
            if (top > scrollTop && top > parentHeight - height + scrollTop) {
                $(this).window('move', {
                    top: parentHeight - height + scrollTop
                });
            }
            if (FrameDataWindow.fdWindowPos)
                FrameDataWindow.SetGlobalOffset(left, top);
        },

    });

    let KeyEventHandler = function (event) {
        let handled;
        if (event.key !== undefined) {
            handled = event.key;
            // 使用KeyboardEvent.key处理事件，并将handled设置为true。
        }
        if (handled) {
            // 如果事件已处理，则禁止“双重操作”
            if (event.altKey && handled == "c") {
                event.preventDefault();
                FrameDataWindow.CopyScriptObj();
            } else if (event.altKey && handled == "v") {
                event.preventDefault();
                FrameDataWindow.PasteScriptObj();
            } else if (event.altKey && handled == "x") {
                event.preventDefault();
                FrameDataWindow.CutScriptObj();
            } else if (event.altKey && handled == "e") {
                event.preventDefault();
                KFDEditor.FDEditorWindow.StartCopy = true;
                KFDEditor.FDEditorWindow.CopyScriptObjs = [];
                KFDEditor.FDEditorWindow.SelectedRow = null;
            } else if (event.altKey && handled == "q") {
                event.preventDefault();
                KFDEditor.FDEditorWindow.StartCopy = false;
                KFDEditor.FDEditorWindow.CopyScriptObjs = [];
                KFDEditor.FDEditorWindow.SelectedRow = null;
            }
        }
    };
    window.addEventListener("keydown"
        , KeyEventHandler);

    this.btn_New = $('#fd_newAdd');
    this.btn_New.on('click', function () {
        this.OnNewClick();
    }.bind(this));
    this.btn_Switch = $('#fd_onOff');
    this.btn_Switch.on('click', function () {
        this.OnSwitchClick();
    }.bind(this))
    this.btn_Debug = $('#fd_test');
    this.btn_Debug.on('click', function () {
        this.OnDebugClick();
    }.bind(this))
    this.btn_Break = $('#fd_break');
    this.btn_Break.on('click', function () {
        this.OnBreakClick();
    }.bind(this));
    this.btn_Delete = $('#fd_delete');
    this.btn_Delete.on('click', function () {
        this.OnDeleteClick();
    }.bind(this))
    this.tb_FrameIndex = $('#fd_fI');
    this.cc_Once = $('#fd_once');
    this.cc_Once.checkbox({
        onChange: function (checked) {
            if (this._src) {
                this._src['once'] = checked;
            }
        }.bind(this),
    })

    this.cc_paramDis = $('#fd_paramDis');
    this.cc_paramDis.checkbox({
        checked: (KFDPropTool.DisplayParam == true),
        onChange: function (checked) {
            KFDPropTool.DisplayParam = checked;
        }.bind(this),
    })

    this.tb_StartPC = $('#fd_startPC');
    this.tb_StartPC.textbox({
        onChange: function (nValue) {
            if (this._src) {
                let typeid = FrameDataWindow.GetDataVTypeId('startPC', this.kfddata);
                this._src['startPC'] = FrameDataWindow.CastFunc(typeid, nValue);
            }
        }.bind(this),
    })
    this.tb_VarSize = $('#fd_varSize');
    this.tb_VarSize.textbox({
        onChange: function (nValue) {
            if (this._src) {
                let typeid = FrameDataWindow.GetDataVTypeId('varsize', this.kfddata);
                this._src['varsize'] = FrameDataWindow.CastFunc(typeid, nValue);
            }
        }.bind(this),
    })


    this.tb_scriptLayer = $('#fd_scriptLayer').textbox({
        onChange: function (nValue) {
            if (this._src) {
                let typeid = FrameDataWindow.GetDataVTypeId('scriptLayer', this.kfddata);
                this._src['scriptLayer'] = FrameDataWindow.CastFunc(typeid, nValue);
            }
        }.bind(this),
    })

    this.tb_ParamSize = $('#fd_paramSize');
    this.tb_ParamSize.textbox({
        onChange: function (nValue) {
            if (this._src) {
                let typeid = FrameDataWindow.GetDataVTypeId('paramsize', this.kfddata);
                this._src['paramsize'] = FrameDataWindow.CastFunc(typeid, nValue);
            }
        }.bind(this),
    })
    this.cb_ScriptType = $('#fd_scriptCombo');

    this.dg.datagrid({
        rowStyler: function (index, row) {
            let hitBp = _global.debugHitBreakPoint;
            let ret = "";
            if (_global.debugBreakPoints) {
                for (let bp of _global.debugBreakPoints) {
                    if (FrameDataWindow.IsBreakPointMatched(bp, index, row, true)) {
                        // if (!bp.FieldPath) {
                        if (!bp.hasOwnProperty("Enabled") || bp.Enabled) {
                            ret += 'background-color:red';
                        } else {
                            ret += 'background-color:#FA8072';
                        }
                        // } else {
                        //     ret += 'background-color:palevioletred';
                        // }
                    }
                }
            }
            if (hitBp && FrameDataWindow.IsBreakPointMatched(hitBp, index, row)) {
                ret += ret.length === 0 ? "" : ";";
                // if (!hitBp.FieldPath) {
                ret += 'color:yellow;font-weight:bold';
                // } else {
                //     ret += 'color:lightyellow;font-weight:bold';
                // }
            }
            return ret;
        }
    })
    _global.Event.on("OnDebugBreakPointHit", function (info) {
        this.OnBreakChange();
    }.bind(this));

    _global.Event.on("OnDebugBreakPointsChanged", function (info) {
        this.OnBreakChange();
    }.bind(this));
}

FrameDataWindow.CastFunc = function (vtypeid, value) {
    return KFDEditor.CastValue(vtypeid, value);
}

FrameDataWindow.GetDataVTypeId = function (vname, kfddata) {
    if (kfddata && kfddata.propertys) {
        for (let i = 0; i < kfddata.propertys.length; i++) {
            let prop = kfddata.propertys[i];
            if (prop.name == vname) {
                return KFDataType.GetTypeID(prop.type);
            }
        }
    }
    return -1;
}

FrameDataWindow.prototype.Open = function (srcdata, cls, seqId, fieldPath) {
    if (seqId != null) {
        this.seqId = seqId;
        _global.seqId = seqId;
        if (fieldPath) {
            this.fieldPath = fieldPath;
        }
    }
    FrameDataWindow.LoadDescBlkSheet();
    if (this.RefreshData(srcdata, cls)) {
        if (!FrameDataWindow.fdWindowPos) {
            FrameDataWindow.fdWindowPos = {};
            this.fdWin.window('open').window('center');
        } else {
            this.fdWin.window({
                left: FrameDataWindow.fdWindowPos.left,
                top: FrameDataWindow.fdWindowPos.top,
            });

            this.fdWin.window('open');
        }
        this.Clear();
        this.visible = true;
        KFDEditor.FDEditorWindow.StartCopy = false;
    }

    for (let i = 0; i < this.dg.datagrid('getRows').length; i++) {
        this.dg.datagrid('refreshRow', i);
    }
}

FrameDataWindow.prototype.Close = function () {
    this.seqId = 0;
    this.fieldPath = null;
    this.fdWin.window('close')
}

FrameDataWindow.prototype.RefreshData = function (srcdata, cls) {
    if (!srcdata) {
        srcdata = {__cls__: "KFFrameData"};
    }
    if (srcdata) {
        this._src = srcdata;
        this.kfddata = this.kfdTable.get_kfddata(cls);
        if (this.kfddata) {
            for (let i = 0; i < this.kfddata.propertys.length; i++) {
                let prop = this.kfddata.propertys[i];
                let typeid = KFDataType.GetTypeID(prop.type);
                if (!this._src[prop.name])
                    if (typeid == KFDataType.OT_MIXARRAY || typeid == KFDataType.OT_ARRAY) {
                        this._src[prop.name] = [];
                    } else {
                        if (prop.default)
                            this._src[prop.name] = FrameDataWindow.CastFunc(KFDataType.GetTypeID(prop.type), prop.default);
                    }
            }

            //part of common
            this.tb_FrameIndex.textbox({
                value: this._src[this.kfddata.propertys[0].name] ? this._src[this.kfddata.propertys[0].name] : this.kfddata.propertys[0].default,
            });

            this.cc_Once.checkbox({
                value: this._src[this.kfddata.propertys[1].name] ? this._src[this.kfddata.propertys[1].name] : this.kfddata.propertys[1].default,
                label: this.kfddata.propertys[1].name + '',
            });
            this.cc_Once.checkbox(this._src[this.kfddata.propertys[1].name] ? 'check' : 'uncheck');

            this.tb_StartPC.textbox({
                value: this._src[this.kfddata.propertys[2].name] ? this._src[this.kfddata.propertys[2].name] : this.kfddata.propertys[2].default,
            });

            this.tb_VarSize.textbox({
                value: this._src[this.kfddata.propertys[3].name] ? this._src[this.kfddata.propertys[3].name] : this.kfddata.propertys[3].default,
            });

            this.tb_ParamSize.textbox({
                value: this._src[this.kfddata.propertys[4].name] ? this._src[this.kfddata.propertys[4].name] : this.kfddata.propertys[4].default,
            });

            ///fd_scriptLayer
            this.tb_scriptLayer.textbox({
                value: this._src[this.kfddata.propertys[5].name] ? this._src[this.kfddata.propertys[5].name] : this.kfddata.propertys[5].default,
            });

            //part of datagrid
            this.scriptProp = this.kfddata.propertys[6];
            if (this.scriptProp) {
                this.InitScriptComboBox(this.scriptProp.otype);
                let scriptArr = this._src[this.scriptProp.name];
                if (scriptArr) {
                    let lgt = scriptArr.length;
                    for (let i = lgt - 1; i >= 0; i--) {
                        let row = scriptArr[i];
                        if (!row) 
                        {
                            //row = scriptArr[i] = {};
                            scriptArr.splice(i, 1);
                        }
                        else{
                            if (!row.editor) {
                                row.editor = this;
                            }
                        }
                        
                    }

                    this.dg.datagrid('loadData', {total: lgt, rows: scriptArr});
                } else {
                    arrdata = {};
                    arrdata.total = 0;
                    arrdata.rows = [];
                    this._src[this.scriptProp.name] = arrdata;
                }
            }
            return true;
        }
    }
    return false;
}

FrameDataWindow.prototype._GetAllKFDProperty = function (cls_name) {

    let kfddata = this.kfdTable.get_kfddata(cls_name);
    if (kfddata == undefined)
        return [];

    let propertys = kfddata.propertys;
    let orprops = kfddata.orprops;

    if (!orprops) orprops = [];

    let allprops = orprops.concat(propertys);
    let extendcls = kfddata.extend;

    if (extendcls) {
        let extenddata = this.kfdTable.get_kfddata(extendcls);
        let extendprops = this._GetAllKFDProperty(extenddata);

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

FrameDataWindow.prototype.Clear = function () {
    // this.fdWin.clear();
    $('#fd_sec_label').val("");
    $('#fd_sec_label').attr("disabled", true);
    $('#fd_sec').treegrid('loadData', {});
}

FrameDataWindow.prototype.OnNewClick = function () {
    //var e = document.getElementById("fd_scriptCombo");
    //var selectedValue = e.options[e.selectedIndex].value;

    var item = $('#fd_scriptCombo').combotree('tree').tree('getSelected');

    var selectedValue = "invalid";
    if (item != null) selectedValue = item.value;
    //alert(selectedValue);
    // let selectedValue = this.cb_ScriptType.combobox('getValue');
    if (this._src && selectedValue != "invalid") {
        if (_global.editor && _global.editor.edaction)
            _global.editor.edaction.AddAction();
        let scriptArr = this._src[this.scriptProp.name];
        if (scriptArr) {
            let scriptObj = {};
            let src = {};
            src.__cls__ = selectedValue;
            let scriptkfd = this.kfdTable.get_kfddata(selectedValue);
            KFDJson.init_object(src, scriptkfd);
            scriptObj.__cls__ = selectedValue;
            // scriptObj._src = src;
            // scriptObj.children = this.parentEditor._BuildObjectPropertyData(src, scriptkfd);
            // scriptObj.group = this.GetDefaultGroup(scriptObj.__cls__);
            scriptObj.editor = this;
            scriptObj.label = this.GetClsLabel(this.scriptProp.otype, selectedValue);
            scriptObj.type = selectedValue;
            scriptArr.push(scriptObj);
            this.dg.datagrid('loadData', {total: scriptObj.length, rows: scriptArr});
        }
    }
}

FrameDataWindow.prototype.OnSwitchClick = function () {
    var row = this.dg.datagrid('getSelected');
    if (!row) {
        $.messager.alert('提示', '请先选择目标脚本！');
        return null;
    }
    FrameDataWindow.UpdateDGRow(this.dg, row, function () {
        if (_global.editor && _global.editor.edaction)
            _global.editor.edaction.AddAction();
        if (row.group && row.group != 0) {
            row.group = 0;
        } else {
            if (row.group != undefined)
                delete row.group;
            else {
                row.group = 0;
            }
        }
        // row.group = row.group != 0 ? 0 : this.GetDefaultGroup(row.__cls__);
    }.bind(this));
}

FrameDataWindow.prototype.OnDebugClick = function () {
    var row = this.dg.datagrid('getSelected');
    if (!row) {
        $.messager.alert('提示', '请先选择目标脚本！');
    } else {
        let kvkfd = _global.editor.context.kfdtable.get_kfddata("KFFrameTestParam");
        let kv = {};
        kv.__cls__ = "KFFrameTestParam";
        KFDJson.init_object(kv, kvkfd);

        kv.scriptdata = row;
        kv.stateId = _global.stateId;
        kv.layerId = _global.currentLayer;
        kv.frameId = _global.currentFrame;
        kv.scriptId = this.dg.datagrid('getRowIndex', row);
        _global.Event.emit("OnTestFrameScript", kv);
    }
}

FrameDataWindow.prototype.OnBreakClick = function () {
    var row = this.dg.datagrid('getSelected');
    if (!row) {
        $.messager.alert('提示', '请先选择目标脚本！');
    } else {
        _global.Event.emit("OnFrameDataSetBreakPoint", null);
    }
}

FrameDataWindow.prototype.OnBreakChange = function () {
    if (!this._src || !this.scriptProp) return;
    let scriptArr = this._src[this.scriptProp.name];
    if (scriptArr) {
        this.dg.datagrid('loadData', {total: scriptArr.length, rows: scriptArr});
    }
}

FrameDataWindow.prototype.OnDeleteClick = function () {
    var row = this.dg.datagrid('getSelected');
    if (!row) {
        if (KFDEditor.FDEditorWindow.SelectedRow != null) {
            row = KFDEditor.FDEditorWindow.SelectedRow;
        } else {
            $.messager.alert('提示', '请先选择目标脚本！');
            return;
        }
    }

    if (_global.editor && _global.editor.edaction)
        _global.editor.edaction.AddAction();
    let index = this.dg.datagrid('getRowIndex', row);
    this.dg.datagrid('deleteRow', index);

    this.Clear();
}

FrameDataWindow.DeleteRow = function (index) {
    let dg = $('#fd_first');
    if (dg) {
        let rows = dg.datagrid('getRows');
        if (index <= rows.length - 1) {
            dg.datagrid('deleteRow', index);
        }
    }
}

FrameDataWindow.prototype.InitScriptComboBox = function (otype) {
    let allcls = this.kfdTable.get_kfddatas_extend(otype, this.scriptProp.igobase != 1);

    let includeAndIgnoreCls = KFDEditor.GetClsInfoIncludedAndIgnored(this.scriptProp, this.kfdTable);
    let clsAry = new Array();
    this.comboId = 0;
    for (let i = 0; i < allcls.length; i++) {
        let clsobj = allcls[i];
        if (!KFDPropTool.IsFTypeScript(clsobj, this.kfdTable)) continue;

        let DEPRECATED = KFDEditor.GetPropTag(clsobj.value, "DEPRECATED");
        if (!DEPRECATED && includeAndIgnoreCls.includeCls(clsobj.value.class)) {
            // 配置的类别标
            var categoryTag = FrameDataWindow.GetDescBlkValue(clsobj.value.class, "Category");
            if (categoryTag == null) {
                categoryTag = KFDEditor.GetPropTag(clsobj.value, "Category");
            }
            var categories = categoryTag.split("|");
            if (categoryTag == "") categories = [];

            // 将KF的改为HD，这样可以一起分类展示
            if(categories.length > 0 && categories[0] === "KF") {
                categories[0] = "HD";
            }

            if(categories.length > 0 && (categories[0] == "HD" || categories[0] == "RA"))
            {
                var ShortcutTag = KFDEditor.GetPropTag(clsobj.value, "Shortcut");
                this.AddToClsAry(clsAry, categories, 0, clsobj, ShortcutTag);
            }
        }
    }

    $('#fd_scriptCombo').combotree('loadData', clsAry);

    $('#fd_scriptCombo').combotree('tree').tree({
        onSelect: function (node) {
            if (node != null && node.value == "invalid") {
                Nt("请选择脚本!");
                //var newnode = $('#fd_scriptCombo').combotree('tree').tree('find', 1);
                $('#fd_scriptCombo').combotree('tree').tree('select', null);
            }
        }
    });

    /*$('#fd_scriptCombo').combotree('loadData', [{
        text: 'Languages',
        value: 'tttt',
        children: [{
            id: 11,
            text: 'Java',
            value: 'gggg',
        },{
            id: 12,
            text: 'C++',
            value: 'jjjjjj',
        }]
    }]);*/
}

FrameDataWindow.prototype.AddToClsAry = function (LevelClsAry, categories, level, clsobj, ShortcutTag) {
    if (categories.length > level) {
        let hit = false;
        for (let i = 0; i < LevelClsAry.length; ++i) {
            if (LevelClsAry[i].text == categories[level]) {
                hit = true;
                if (categories.length == level + 1)  //刚好到当前层
                {
                    LevelClsAry[i].children.push({
                        id: ++this.comboId,
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
            LevelClsAry.push({id: ++this.comboId, text: categories[level], value: "invalid", children: []})
            if (categories.length == level + 1) {
                LevelClsAry[LevelClsAry.length - 1].children.push({
                    id: ++this.comboId,
                    text: ShortcutTag != "" ? clsobj.label0 + "[" + ShortcutTag + "]" : clsobj.label0,
                    value: clsobj.label
                });
            } else {
                this.AddToClsAry(LevelClsAry[LevelClsAry.length - 1].children, categories, level + 1, clsobj, ShortcutTag);
            }
        }
    } else {
        LevelClsAry.push({
            id: ++this.comboId,
            text: ShortcutTag != "" ? clsobj.label0 + "[" + ShortcutTag + "]" : clsobj.label0,
            value: clsobj.label
        });
    }
}

FrameDataWindow.prototype.InitScriptComboBox2 = function (otype) {

    let scriptCombo = document.getElementById("fd_scriptCombo");
    scriptCombo.innerHTML = "";
    let allcls = this.kfdTable.get_kfddatas_extend(otype, this.scriptProp.igobase != 1);
    ///乎略一个分支
    let includeAndIgnoreCls = KFDEditor.GetClsInfoIncludedAndIgnored(this.scriptProp, this.kfdTable);
    for (let i = 0; i < allcls.length; i++) {
        let clsobj = allcls[i];
        let DEPRECATED = KFDEditor.GetPropTag(clsobj.value, "DEPRECATED");
        if (!DEPRECATED && includeAndIgnoreCls.includeCls(clsobj.value.class)) {
            var option = document.createElement("option");
            option.text = clsobj.label0;
            option.value = clsobj.label;
            if (i == 0)
                option.selected = true;
            scriptCombo.add(option);
        }
    }
}

FrameDataWindow.prototype.GetClsObj = function (otype, cls) {
    let allcls = this.kfdTable.get_kfddatas_extend(otype, true);
    for (let i = 0; i < allcls.length; i++) {
        let clsobj = allcls[i];
        if (clsobj.label == cls) {
            return clsobj;
        }
    }
}

FrameDataWindow.prototype.GetClsLabel = function (otype, cls) {
    let clsObj = this.GetClsObj(otype, cls);
    if (clsObj != undefined)
        return clsObj.label0;
    return undefined;
}

FrameDataWindow.prototype.GetClsObjDesc = function (otype, cls) {
    let cls_desc = undefined;
    let clsObj = this.GetClsObj(otype, cls);
    if (clsObj != undefined &&
        (clsObj.hasOwnProperty('value') || clsObj['value'] != undefined)) {
        if (clsObj['value'].hasOwnProperty('unknowtags') || clsObj['value']['unknowtags'] != undefined) {
            for (let i = 0; i < clsObj['value']['unknowtags'].length; i++) {
                let obj = clsObj['value']['unknowtags'][i];
                if (obj.tag == 'Desc') {
                    cls_desc = obj.val;
                    break;
                }
            }
        }
    }
    cls_desc = FrameDataWindow.GetDescBlkValue(cls, 'desc');
    return cls_desc == undefined || cls_desc.length <= 0 ?
        clsObj != undefined ? clsObj.label0 : cls_desc
        : cls_desc;
}

FrameDataWindow.prototype.GetDefaultGroup = function (cls) {
    let scriptkfd = this.kfdTable.get_kfddata(cls);
    if (scriptkfd) {
        if (scriptkfd.orprops) {
            for (let i = 0; i < scriptkfd.orprops.length; i++) {
                let oprop = scriptkfd.orprops[i];
                if (oprop.name == 'group') {
                    return this.GetDefaultGroupValue(oprop.default);
                }
            }
        }
        if (scriptkfd.propertys) {
            for (let i = 0; i < scriptkfd.propertys.length; i++) {
                let prop = scriptkfd.propertys[i];
                if (prop.name == 'group') {
                    return this.GetDefaultGroupValue(prop.default);
                }
            }
        }
        if (scriptkfd.extend) {
            return this.GetDefaultGroup(scriptkfd.extend);
        }
    }
    return 4;
}

FrameDataWindow.prototype.GetDefaultGroupValue = function (delVal) {
    if (typeof (delVal) == 'number') {
        return delVal;
    } else {
        switch (delVal) {
            case "KFScriptGroupType::Undefined":
                return 0;
            case "KFScriptGroupType::Target":
                return 1;
            case "KFScriptGroupType::Domain":
                return 2;
            case "KFScriptGroupType::TargetRender":
                return 3;
            case "KFScriptGroupType::Global":
                return 4;
            case "KFScriptGroupType::GlobalRender":
                return 6;
            case "KFScriptGroupType::LowLevel":
                return 100;
            case "KFScriptGroupType::NetVar":
                return 101;
        }
    }
    return 4;
}

FrameDataWindow.DescBlkSheetObj = undefined;
FrameDataWindow.LoadDescBlkSheet = function () {
    FrameDataWindow.DescBlkSheetObj = {};
    let blkdata = IKFFileIO_Type.instance.syncLoadFile(_global.appdatapath + "/App/Config/ScriptDesc.blk");
    if (blkdata) {
        let bytearr = new KFByteArray(blkdata);
        let blkobj = KFDJson.read_value(bytearr);
        if (blkobj) {
            if (blkobj.data) {
                let kv = KFDJson.read_value(blkobj.data.bytes, false);
                if (kv && kv.Rows) {
                    for (let item of kv.Rows) {
                        FrameDataWindow.DescBlkSheetObj[item.cls_name] = {
                            'desc': item.cls_desc,
                            'tooltip': item.cls_tooltip,
                            "detail": item.cls_detail,
                            'Category':item.cls_category,
                            'FTYPE':item.cls_ftype
                        };
                    }
                    return FrameDataWindow.DescBlkSheetObj;
                }
            }
        }
    }
}

FrameDataWindow.GetDescBlkValue = function(cls, k) {
    if (FrameDataWindow.DescBlkSheetObj == undefined) return null;
    if (!FrameDataWindow.DescBlkSheetObj.hasOwnProperty(cls)) return null;
    let item = FrameDataWindow.DescBlkSheetObj[cls];
    if (item == null || !item.hasOwnProperty(k)) return null;
    let v = item[k];
    if (v == null || v.length <= 0) return null;
    return v;
}

FrameDataWindow.GetRowDataForScriptDesc = function (row) {
    if (row.__cls__ === 'GSDynamicExecuteData') {
        if (row.Script) {
            return row.Script;
        }
    }
    return row;
}

FrameDataWindow.NameFormatter = function (value, row, index) {
    // return '[' + row.type + '] ' + row.editor.GetClsLabel(row.editor.scriptProp.otype, row.type);
    let editor = row.editor;
    row = FrameDataWindow.GetRowDataForScriptDesc(row);
    let cls_lbl = editor.GetClsLabel(editor.scriptProp.otype, row.__cls__);
    let cls_desc = editor.GetClsObjDesc(editor.scriptProp.otype, row.__cls__);

    if (cls_desc != undefined && cls_desc.length > 0) {
        let result = ScriptDescParser.Parse(new Statement(0, cls_desc.length, cls_desc), row, 80);
        cls_desc = result != undefined ? result.state_str : cls_desc;
    }
    //let lbl_str = '</br> <font size="' + 1 + '">(' + cls_lbl + ')</font>';
    let lbl_str = '</br>';
    return cls_desc != undefined && cls_desc.length > 0 ? cls_desc + lbl_str : cls_lbl;
}

FrameDataWindow.StatusFormatter = function (value, row, index) {
    if (row.group == undefined || row.group != 0) {
        return "√";
    }
    return "×";
}

FrameDataWindow.ActionFormatter = function (value, row, index) {
    // <a id="fd_delete" href="#" class="easyui-linkbutton" data-options="iconCls:'icon-remove'" style="border: none;">删除</a>
    let delMethodStr = 'FrameDataWindow.DeleteRow(' + index + ')';
    let delBtnStr = '<a id="fd_delete_' + index + '" href=\'#\' class="easyui-linkbutton" onclick="' + delMethodStr + '" data-options="iconCls:\'icon-remove\'" style="border: none;">删除</a>'
    return delBtnStr;
}

FrameDataWindow.DetailFormatter = function (rowIndex, rowData) {
    rowData = FrameDataWindow.GetRowDataForScriptDesc(rowData);
    let cls_tooltip = "";
    if (rowData != undefined && (rowData["__cls__"] != undefined || rowData.hasOwnProperty("__cls__"))) {
        cls_tooltip = FrameDataWindow.GetDescBlkValue(rowData.__cls__, 'detail');
        ///找不到自定义值，自动化搜寻嵌套脚本并进行细节填充
        if (cls_tooltip == undefined || cls_tooltip.length <= 0) {
            cls_tooltip = "";
            let detail_props = [];
            let all_props = KFDEditor.FDEditorWindow._GetAllKFDProperty(rowData.__cls__);
            for (let i = 0; i != all_props.length; i++) {
                if (all_props[i]['type'] == 'mixarr') {
                    detail_props.push(all_props[i]);
                }
            }
            for (let i = 0; i != detail_props.length; i++) {
                let _state = detail_props[i].cname + ": " + "[#" + detail_props[i].name + "]"
                cls_tooltip += _state;
                if (i < detail_props.length - 1) {
                    cls_tooltip += '<br>';
                }
            }
        }
        let result = ScriptDescParser.Parse(new Statement(0, cls_tooltip.length, cls_tooltip), rowData);
        cls_tooltip = result != undefined ? result.state_str : cls_tooltip;
    }
    return '<a>' + cls_tooltip + '</a>';
}

FrameDataWindow.UpdateDGRow = function (dg, row, ChangeFunc) {
    let index = parseInt(dg.datagrid('getRowIndex', row));
    if (ChangeFunc != undefined)
        ChangeFunc();
    dg.datagrid('updateRow', {
        index: index,
        row: {data: row}
    });
}

FrameDataWindow.OnLabelStrChange = function (domale) {
    let dgui = $('#fd_first');
    let row = dgui.datagrid('getSelected');
    if (row && domale) {
        FrameDataWindow.UpdateDGRow(dgui, row, function () {
            row.label = domale.value;
        })
    }
}

FrameDataWindow.OnSelectDGRow = function (docmle, rowIndex, rowData) {
    $('#fd_sec_l abel').attr("disabled", false);
    $('#fd_sec_label').val(rowData.label);
    let tg = $("#fd_sec");
    let sectgEditor = new KFDEditor(tg, rowData.editor.kfdTable);
    sectgEditor.ignoreKFFrameData = true;

    sectgEditor.Event.on("OnDataChange", function (prop) {
            //let pname = prop.name;
            //let dgui = $('#fd_first');
            let curRowData = $('#fd_first').datagrid('getSelected');
            if (curRowData != undefined) {
                FrameDataWindow.UpdateDGRow($('#fd_first'), curRowData);
            }
        }
        , this);
    sectgEditor.Event.on("WrapDynExecData", function (newData) {
        if (newData) {
            newData.Script = rowData;
            newData.editor = rowData.editor;
            newData._selected = rowData._selected;
            delete rowData.editor
            let scriptArr = newData.editor._src[newData.editor.scriptProp.name];
            if (scriptArr) {
                scriptArr[rowIndex] = newData;
                newData.editor.dg.datagrid('loadData', {total: scriptArr.length, rows: scriptArr});
                // newData.editor.dg.datagrid('selectRow', rowIndex);
            }
        }
    });

    sectgEditor.Event.on("UnWrapDynExecData", function (newData) {
        if (newData) {
            newData.editor = rowData.editor;
            newData._selected = rowData._selected;
            let scriptArr = newData.editor._src[newData.editor.scriptProp.name];
            if (scriptArr) {
                scriptArr[rowIndex] = newData;
                newData.editor.dg.datagrid('loadData', {total: scriptArr.length, rows: scriptArr});
                // newData.editor.dg.datagrid('selectRow', rowIndex);
            }
        }
    });

    sectgEditor.Edit(rowData, {"target": {"__state__": "open"}, "__enable_switch_var__": true});

    tg.treegrid('expandAll');

    if (rowData.editor.fieldPath) {
        sectgEditor.SelectFieldPath(rowData.editor.fieldPath);
    }
}

FrameDataWindow.SetGlobalOffset = function (left, top) {
    if (!FrameDataWindow.fdWindowPos) {
        FrameDataWindow.fdWindowPos = {};
        FrameDataWindow.fdWindowPos.left = left;
        FrameDataWindow.fdWindowPos.top = top;
    }
}

// FrameDataWindow.prototype.copyText = function(text) {
//     var input = document.createElement('textarea');
//     document.body.appendChild(input);
//     // 将文本赋值给输入框
//     input.value = text;
//     // 聚焦并选中
//     input.focus();
//     input.select();
//
//     // document.queryCommandEnabled()方法返回一个布尔值，表示当前是否可用document.execCommand()的某个命令。
//     // 比如copy命令只有存在文本选中时才可用，如果没有选中文本，就不可用。
//     if (document.queryCommandEnabled('copy')) {
//         // 执行 copy 命令
//         var success = document.execCommand('copy');
//         // 移除输入框节点
//         input.remove();
//         console.log('Copy Ok');
//     } else {
//         console.log('queryCommandEnabled is false');
//     }
// }

FrameDataWindow.CopyScriptObj = function () {
    let row = KFDEditor.FDEditorWindow.dg.datagrid('getSelected');
    if (!row) {
        if (KFDEditor.FDEditorWindow.SelectedRow != null) {
            row = KFDEditor.FDEditorWindow.SelectedRow;
        } else {
            $.messager.alert('提示', '请先选择目标脚本！');
            return;
        }
    }

    if (KFDEditor.FDEditorWindow.StartCopy) {
        KFDEditor.FDEditorWindow.CopyScriptObjs.push(row);
    } else {
        KFDEditor.FDEditorWindow.CopyScriptObjs[0] = row;
    }

    ClipboardTool.SetClipboardOfKFDArray("FrameScript", KFDEditor.FDEditorWindow.CopyScriptObjs);

    // 系统粘贴板测试
    // let kfbytearr = new KFByteArray();
    // KFDJson.write_value(kfbytearr, row);
    // var str = "";
    // for(var i = 0; i < kfbytearr._bytes.length; i++)
    // {
    //     if(i != 0)
    //     {
    //         str = str + '_';
    //     }
    //     str = str + kfbytearr._bytes[i];
    // }
    // KFDEditor.FDEditorWindow.copyText(str);
}

FrameDataWindow.PasteScriptObj = function () {
    //document.execCommand('paste');
    let CopyScriptObjs = ClipboardTool.GetClipboardOfKFDArray('FrameScript');
    if (CopyScriptObjs && CopyScriptObjs.length > 0) {
        if (_global.editor && _global.editor.edaction)
            _global.editor.edaction.AddAction();
        let scriptArr = KFDEditor.FDEditorWindow._src[KFDEditor.FDEditorWindow.scriptProp.name];
        if (scriptArr) {
            for (let item of CopyScriptObjs) {
                item.editor = KFDEditor.FDEditorWindow;
                scriptArr.push(item);
            }
        }
        KFDEditor.FDEditorWindow.dg.datagrid('loadData', {total: scriptArr.length, rows: scriptArr});
    }
}

FrameDataWindow.CutScriptObj = function () {
    var row = KFDEditor.FDEditorWindow.dg.datagrid('getSelected');
    if (!row) {
        if (KFDEditor.FDEditorWindow.SelectedRow != null) {
            row = KFDEditor.FDEditorWindow.SelectedRow;
        } else {
            $.messager.alert('提示', '请先选择目标脚本！');
            return;
        }
    }
    if (_global.editor && _global.editor.edaction)
        _global.editor.edaction.AddAction();
    if (KFDEditor.FDEditorWindow.StartCopy) {
        KFDEditor.FDEditorWindow.CopyScriptObjs.push(row)
    } else {
        KFDEditor.FDEditorWindow.CopyScriptObjs[0] = row
    }

    ClipboardTool.SetClipboardOfKFDArray("FrameScript", KFDEditor.FDEditorWindow.CopyScriptObjs);

    let index = KFDEditor.FDEditorWindow.dg.datagrid('getRowIndex', row);
    KFDEditor.FDEditorWindow.dg.datagrid('deleteRow', index);
    KFDEditor.FDEditorWindow.Clear();
}

FrameDataWindow.IsBreakPointMatched = function (bp, index, row, ignoreValid = false) {
    if (!bp) return false;
    if (!ignoreValid) {
        let valid = !bp.hasOwnProperty("Enabled") || bp.Enabled;
        if (!valid) return false;
    }
    if (_global.editor.IsInTimeline() && bp.__cls__ === "KF8TimelineScriptBreakPoint") {
        if (bp.AssetURL === _global.editor.blkdata.asseturl &&
            bp.StateId === _global.stateId &&
            bp.LayerId === _global.currentLayer &&
            bp.FrameId === _global.currentFrame &&
            bp.ScriptId === index) {
            return true;
        }
    } else if (_global.editor.IsInGraph() && bp.__cls__ === "KF8GraphScriptBreakPoint") {
        if (bp.AssetURL === _global.editor.blkdata.asseturl &&
            bp.NodeName === _global.currentGraphNodeName &&
            bp.ScriptId === index) {
            return true;
        }
    }
    return false;
}
