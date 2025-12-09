function SearchImpl(context) {
    let self = this;
    SearchImpl.currentInstance = this;

    this.context = context;

    this.searchLayoutUI = $(".easyui-layout");
    this.searchOptionsDivUI = $('#searchoptionsdiv');
    this.searchResultsDivUI = $('#searchresultsdiv');
    this.searchReplaceUI = $('#searchreplace');
    this.searchDefaultFieldUI = $('#searchdefaultfield');
    this.searchContentObjectUI = $('#searchcontentobject');
    this.searchContentFieldNameUI = $('#searchcontentfieldname');
    this.searchContentFieldValueUI = $('#searchcontentfieldvalue');

    this.searchTypeUI = $('#searchtype');
    this.searchBlkTreeSpanUI = $('#searchblktreespan');
    this.searchBlkTreeUI = $('#searchblktree');
    this.searchMetaUI = $('#searchmeta');
    this.searchGraphUI = $('#searchgraph');
    this.searchTimelineUI = $('#searchtimeline');

    this.searchObjectDivUI = $('#searchobjectdiv');
    // this.searchObjectTreeSpanUI = $('#searchobjecttreespan');
    this.searchObjectTreeUI = $('#searchobjecttree');
    this.searchObjectConditionUI = $('#searchobjectcondition');
    this.searchObjectConditionTreeSpanUI = $('#searchobjectconditiontreespan');
    this.searchObjectConditionTreeUI = $('#searchobjectconditiontree');

    this.searchFieldNameDivUI = $('#searchfieldnamediv');
    // this.searchFieldNameTreeSpanUI = $('#searchfieldnametreespan');
    this.searchFieldNameTreeUI = $('#searchfieldnametree');
    this.searchFieldNameCaseUI = $('#searchfieldnamecase');
    this.searchFieldNameWordUI = $('#searchfieldnameword');
    this.searchFieldNameRegExUI = $('#searchfieldnameregex');
    this.searchFieldNamePathUI = $('#searchfieldnamepath');

    this.searchFieldValueDivUI = $('#searchfieldvaluediv');
    // this.searchFieldValueTreeSpanUI = $('#searchfieldvaluetreespan');
    this.searchFieldValueTreeUI = $('#searchfieldvaluetree');
    this.searchFieldValueCaseUI = $('#searchfieldvaluecase');
    this.searchFieldValueWordUI = $('#searchfieldvalueword');
    this.searchFieldValueRegExUI = $('#searchfieldvalueregex');

    this.searchFieldValueReplaceDivUI = $('#searchfieldvaluereplacediv');
    // this.searchFieldValueReplaceTreeSpanUI = $('#searchfieldvaluereplacetreespan');
    this.searchFieldValueReplaceTreeUI = $('#searchfieldvaluereplacetree');
    this.searchFieldValueReplaceOnlySaveUI = $('#searchfieldvaluereplaceonlysave');
    this.searchFieldValueReplaceStatementUI = $('#searchfieldvaluereplacestatement');

    this.searchDoSearchUI = $('#dosearch');
    this.searchDoReplaceUI = $('#doreplace');

    this.searchResultsUI = $('#searchresults');

    this.useSearchReplace = false;
    this.searchDefaultField = false;
    this.searchContentObject = true;
    this.searchContentFieldName = false;
    this.searchContentFieldValue = false;
    this.searchType = "";
    this.searchMeta = true;
    this.searchGraph = true;
    this.searchTimeline = true;
    this.searchObjectCondition = false;
    this.fieldNameCaseSensitive = false;
    this.fieldNameWholeWord = false;
    this.fieldNameRegEx = false;
    this.fieldNamePath = false;
    this.fieldValueCaseSensitive = false;
    this.fieldValueWholeWord = false;
    this.fieldValueRegEx = false;
    this.searchObjectContent = "";
    this.searchObjectConditionContent = "";
    this.searchFieldNameContent = "";
    this.searchFieldValueContent = "";
    this.searchFieldValueReplaceContent = "";
    this.searchFieldValueReplaceOnlySave = false;
    this.searchFieldValueReplaceStatement = false;
    this.searchOptionsDivUIHeight = this.searchOptionsDivUI.height();

    this.searchOptionsDivUI.panel({
        'onResize': function (width, height) {
            self.searchOptionsDivUIHeight = height;
        }
    });
    this.searchReplaceUI.checkbox({
        onChange: function (checked) {
            self.useSearchReplace = checked;
            if (checked) {
                self.searchFieldValueReplaceDivUI.show();
                self.searchDoReplaceUI.show();
                self.UpdateSearchOptionUI(true);
            } else {
                self.searchFieldValueReplaceDivUI.hide();
                self.searchDoReplaceUI.hide();
                self.UpdateSearchOptionUI(false);
            }
        }
    });
    this.searchDefaultFieldUI.checkbox({
        onChange: function (checked) {
            self.searchDefaultField = checked;
        }
    });
    this.searchContentObjectUI.checkbox({
        onChange: function (checked) {
            self.searchContentObject = checked;
            if (checked) {
                self.searchObjectDivUI.show();
                self.UpdateSearchOptionUI(true);
            } else {
                self.searchObjectDivUI.hide();
                self.UpdateSearchOptionUI(false);
            }
        }
    });
    this.searchContentFieldNameUI.checkbox({
        onChange: function (checked) {
            self.searchContentFieldName = checked;
            if (checked) {
                self.searchFieldNameDivUI.show();
                self.UpdateSearchOptionUI(true);
            } else {
                self.searchFieldNameDivUI.hide();
                self.UpdateSearchOptionUI(false);
            }
        }
    })
    this.searchContentFieldValueUI.checkbox({
        onChange: function (checked) {
            self.searchContentFieldValue = checked;
            if (checked) {
                self.searchFieldValueDivUI.show();
                self.UpdateSearchOptionUI(true);
            } else {
                self.searchFieldValueDivUI.hide();
                self.UpdateSearchOptionUI(false);
            }
        }
    });

    this.searchTypeUI.combobox({
        onSelect: function (record) {
            self.searchType = record.value;
            switch (self.searchType) {
                case "global": {
                    self.searchBlkTreeSpanUI.hide();
                    break;
                }
                case "spec": {
                    self.searchBlkTreeSpanUI.show();
                    break;
                }
                default:
                    break;
            }
        }
    });

    this.searchMetaUI.checkbox({
        onChange: function (checked) {
            self.searchMeta = checked;
        }
    });
    this.searchGraphUI.checkbox({
        onChange: function (checked) {
            self.searchGraph = checked;
        }
    });
    this.searchTimelineUI.checkbox({
        onChange: function (checked) {
            self.searchTimeline = checked;
        }
    });

    this.searchBlkTreeUI.combotree({
        keyHandler: $.extend({}, $.fn.combotree.defaults.keyHandler, {
            query: function(q,e){
                $.fn.combotree.defaults.keyHandler.query.call(this,q,e);
                $(this).combotree('tree').tree('expandAll');
            }
        })
    });

    this.searchObjectTreeUI.combotree('tree').tree({
        onSelect: function (node) {
            self.searchObjectContent = "";
            if (!node || node.value === "invalid") {
                Nt("请选择脚本!");
                self.searchObjectTreeUI.combotree('clear');
                return;
            }
            self.searchObjectContent = node.value;
        }
    });

    this.searchObjectConditionUI.checkbox({
        onChange: function (checked) {
            self.searchObjectCondition = checked;
            if (checked) {
                self.searchObjectConditionTreeSpanUI.show();
            } else {
                self.searchObjectConditionTreeSpanUI.hide();
            }
        }
    });

    this.searchFieldNameCaseUI.checkbox({
        onChange: function (checked) {
            self.fieldNameCaseSensitive = checked;
        }
    });
    this.searchFieldNameWordUI.checkbox({
        onChange: function (checked) {
            self.fieldNameWholeWord = checked;
            if (checked) self.searchFieldNameRegExUI.checkbox('uncheck');
        }
    });
    this.searchFieldNameRegExUI.checkbox({
        onChange: function (checked) {
            self.fieldNameRegEx = checked;
            if (checked) self.searchFieldNameWordUI.checkbox('uncheck');
        }
    });
    this.searchFieldNamePathUI.checkbox({
        onChange: function (checked) {
            self.fieldNamePath = checked;
        }
    });

    this.searchFieldValueCaseUI.checkbox({
        onChange: function (checked) {
            self.fieldValueCaseSensitive = checked;
        }
    });
    this.searchFieldValueWordUI.checkbox({
        onChange: function (checked) {
            self.fieldValueWholeWord = checked;
            if (checked) self.searchFieldValueRegExUI.checkbox('uncheck');
        }
    });
    this.searchFieldValueRegExUI.checkbox({
        onChange: function (checked) {
            self.fieldValueRegEx = checked;
            if (checked) self.searchFieldValueWordUI.checkbox('uncheck');
        }
    });

    this.searchFieldValueReplaceOnlySaveUI.checkbox({
        onChange: function (checked) {
            self.searchFieldValueReplaceOnlySave = checked;
            if (checked) {
                self.searchFieldValueReplaceTreeUI.combotree('disable');
                self.searchFieldValueReplaceStatementUI.checkbox('disable');
            } else {
                self.searchFieldValueReplaceTreeUI.combotree('enable');
                self.searchFieldValueReplaceStatementUI.checkbox('enable');
            }
        }
    });
    this.searchFieldValueReplaceStatementUI.checkbox({
        onChange: function (checked) {
            self.searchFieldValueReplaceStatement = checked;
        }
    });

    this.context.Event.on("OnBlkfilesUpate", this.UpdateBlkFiles, this);
    this.UpdateBlkFiles();
    this.searchBlkTreeUI.combotree('tree').tree({data: this.blkfiles});
    this.searchObjectTreeUI.combotree('loadData', self.GetScriptClsDataAry());
    // 有加载不到文件列表的情况，简单兼容一下
    this.searchBlkTreeInterval = setInterval(function (){
        let roots = self.searchBlkTreeUI.combotree('tree').tree('getRoots');
        if (!roots || roots.length === 0) {
            self.UpdateBlkFiles();
            self.searchBlkTreeUI.combotree('tree').tree({data: self.blkfiles});
        } else if (self.searchBlkTreeInterval) {
            clearInterval(self.searchBlkTreeInterval);
            self.searchBlkTreeInterval = null;
        }
    }, 1000);

    this.searchDoSearchUI.click(function () {
        self.Search();
    });
    this.searchDoReplaceUI.click(function () {
        self.Replace();
    });

    this.searchResultsUI.treegrid({
        rowStyler: function(row) {
            let ret = "";
            if (self.savedFailList && row.value && self.savedFailList.includes(row.value.AssetURL)) {
                ret += 'color:red';
            }
            return ret;
        },
        checkbox: function (row) {
            return self.useSearchReplace;
        },
        // onCheckNode: function (row, checked) {
        // },
        onContextMenu: function (e, node) {
            e.preventDefault();
            if (self.useSearchReplace) {
                $('#searchresultsmenu').menu('show', {
                    left: e.pageX,
                    top: e.pageY
                });
            }
        },
        onDblClickRow: function (row) {
            if (row && row.value && row.value.AssetURL) {
                let v = row.value;
                let pathsuffix = v.AssetURL;
                let pt = row.value;
                let params = null;
                if (pt.hasOwnProperty("StateId")) {
                    params = {
                        'StateId': v.StateId,
                        'LayerId': v.LayerId,
                        'FrameId': v.FrameId,
                        'ScriptId': v.hasOwnProperty('ScriptId') ? v.ScriptId : -1,
                        'FieldPath': v.FieldPath
                    }
                } else if (pt.hasOwnProperty("NodeName")) {
                    params = {
                        'NodeName': v.NodeName,
                        'ScriptId': v.hasOwnProperty('ScriptId') ? v.ScriptId : -1,
                        'FieldPath': v.FieldPath
                    }
                } else if (pt.hasOwnProperty("FieldPath")) {
                    params = {
                        'FieldPath': v.FieldPath
                    }
                }
                if (params) {
                    pathsuffix += "?" + new URLSearchParams(params).toString();
                    let appdir = self.context ? self.context.appdatapath : "";
                    _global.Event.emit("OnBlkOpenNew", {path: appdir + "/" + pathsuffix, asseturl: v.AssetURL});
                }
            }
        }
    })
}

SearchImpl.prototype.UpdateSearchOptionUI = function (add = true) {
    let delta = 32;
    if (!add) delta *= -1;
    this.searchOptionsDivUIHeight += delta;
    this.searchOptionsDivUI.panel('resize', {height: this.searchOptionsDivUIHeight});
    this.searchLayoutUI.layout("resize");
}

SearchImpl.prototype.UpdateBlkFiles = function () {
    this.blkfiles = JSON.parse(JSON.stringify(this.context.blkfilespath));
}

SearchImpl.prototype.GetScriptClsDataAry = function () {
    // let allcls = this.context.kfdtable.get_kfddatas_extend("KFScriptData", false);

    // 任意kfd对象
    let allcls = [];
    let kfddata_maps = this.context.kfdtable.kfddata_maps;
    for (let key in kfddata_maps) {
        let data = kfddata_maps[key];
        if (data) {
            var clsname_1 = data["class"];
            ///显用
            var cname = data["cname"];
            var clslabel = (cname ? cname : clsname_1) + "[" + clsname_1 + "]";
            allcls.push({ label: clsname_1, label0: clslabel, value: data });
        }
    }

    // let igclsstr = "";
    // let igclss = this.context.kfdtable.get_kfddatas_extend("VarScriptData", true);
    // for (let clsdef of igclss) {
    //     igclsstr += "," + clsdef.value.class;
    // }

    return KFDPropTool.SelClsAry(allcls, KFDEditor.GetClsInfoIncludedAndIgnored(null, null), this.context.kfdtable, false, []);
}

SearchImpl.prototype.CheckInput = function (replace = false) {
    if (!this.searchType) {
        Nt("请选择搜索范围!");
        return false;
    } else if (!this.searchMeta &&
        !this.searchGraph &&
        !this.searchTimeline) {
        Nt("没有选中参数/流程图/时间线任何一个!");
        return false;
    } else if (!this.searchContentObject &&
        !this.searchContentFieldName &&
        !this.searchContentFieldValue) {
        Nt("没有选中搜索内容类型!");
        return false;
    }

    if (this.searchContentObject) {
        if (!this.searchObjectContent) {
            Nt("请选择搜索对象!");
            return false;
        }
        if (this.searchObjectCondition) {
            this.searchObjectConditionContent = this.searchObjectConditionTreeUI.combotree('getText');
            if (!this.searchObjectConditionContent) {
                Nt("请输入搜索对象自定义条件!");
                return false;
            } else if (!this.MakeSearchObjectConditionExpr()) {
                Nt("搜索对象自定义条件解析失败!");
                return false;
            }
        }
    }
    if (this.searchContentFieldName) {
        this.searchFieldNameContent = this.searchFieldNameTreeUI.combotree('getText');
        if (!this.searchFieldNameContent) {
            Nt("请输入字段名搜索内容!");
            return false;
        }
    }
    if (this.searchContentFieldValue) {
        this.searchFieldValueContent = this.searchFieldValueTreeUI.combotree('getText');
        if (!this.searchFieldValueContent) {
            Nt("请输入字段值搜索内容!");
            return false;
        }
    }
    if (replace && this.useSearchReplace) {
        if (this.searchContentObject && !this.searchContentFieldName && !this.searchContentFieldValue &&
            !this.searchFieldValueReplaceOnlySave) {
            if (!this.searchFieldValueReplaceStatement) {
                Nt("需要选中\'仅保存不替换\'或者\'使用赋值语句\'!");
                return false;
            }
        }
        if (!this.searchFieldValueReplaceOnlySave) {
            this.searchFieldValueReplaceContent = this.searchFieldValueReplaceTreeUI.combotree('getText');
            if (!this.searchFieldValueReplaceContent) {
                Nt("请输入替换内容!");
                return false;
            }
            if (this.searchFieldValueReplaceStatement && !this.MakeReplaceStatementExpr()) {
                Nt("赋值语句表达式解析失败!");
                return false;
            }
        }
        this.toReplaceNodes = [];
        // getCheckedNodes总是有莫名其妙的bug，可能有残留checked数据
        // 不要用getCheckedNodes，保留代码在这里，是为了下次能看到
        // let nodes = this.searchResultsUI.treegrid('getCheckedNodes');
        // for (let node of nodes) {
        //     if (node && node.value) this.toReplaceNodes.push(node.value);
        // }
        let nodes = this.searchResultsUI.treegrid('getData');
        for (let node of nodes) {
            if (node && node.value && node.checked) this.toReplaceNodes.push(node.value);
        }
        if (this.toReplaceNodes.length === 0) {
            Nt("未选中任何要替换的记录!");
            return false;
        }
    }

    return true;
}

SearchImpl.prototype.DoSearch = function (replace) {
    if (!this.CheckInput(replace)) return;

    this.doReplacing = replace;

    this.results = [];
    this.resultsAfterObjectSearched = [];
    this.ClearSearchResultsUI();

    // 如果是替换，那只加载选中的项相关的blk文件
    if (replace) {
        this.SearchToReplaced();
    } else {
        switch (this.searchType) {
            case 'global' : {
                this.SearchGlobal();
                break;
            }
            case 'spec': {
                this.SearchSpec();
                break;
            }
            default:
                break;
        }
    }
}

SearchImpl.prototype.Search = function () {
    this.DoSearch(false);
}

SearchImpl.prototype.Replace = function () {
    this.DoSearch(true);
}

SearchImpl.prototype.SearchComplete = function () {
    if (this.resultsAfterObjectSearched.length > 0) {
        this.results = this.resultsAfterObjectSearched;
    }
    this.searchResultsUI.treegrid('loadData', this.GetResultsTreeData());
}

SearchImpl.prototype.GetResultsTreeData = function () {
    if (!this.results) return [];

    let newNode = function (i, pt) {
        let node = {};
        node.id = parseInt(i) + 1;
        node.name = node.id.toString();
        node.text = "";
        node.iconCls = "";
        node.value = pt;
        let keys = Object.keys(pt);
        let texts = [];
        for (let k in keys) {
            let key = keys[k];
            let text = pt[key];
            if (key === "NodeName") {
                texts.splice(0, 0, "[Graph]");
            } else if (key === "StateId") {
                texts.splice(0, 0, "[Timeline]");
            } else if (key === "FieldPath") {
                if (text.startsWith('__meta__')) {
                    texts.splice(0, 0, "[Meta]");
                } else if (text.startsWith('__graph__')) {
                    texts.splice(0, 0, "[Graph]");
                } else if (text.startsWith('__timeline__')) {
                    texts.splice(0, 0, "[Timeline]");
                }
            }
            texts.push(text);
        }
        node.text = texts.join(' ');
        return node;
    }

    let nodes = [];
    for (let i = 0; i < this.results.length; ++i) {
        let pt = this.results[i].pt;
        let node = newNode(i, pt);
        if (this.useSearchReplace) {
            node.checked = true;
        }
        nodes.push(node);
    }
    return nodes;
}

SearchImpl.prototype.SearchToReplaced = function () {
    if (!this.toReplaceNodes) return;
    let files = [];
    let fileSet = new Set();
    for (let node of this.toReplaceNodes) {
        let path = _global.appdatapath + '/' + node.AssetURL;
        if (!fileSet.has(path)) {
            fileSet.add(path);
            files.push(path);
        }
    }
    if (files.length > 0) {
        this.SearchFiles(files);
    }
}

SearchImpl.prototype.SearchGlobal = function () {
    let getFiles = function (nodes, files) {
        for (let node of nodes) {
            if (!node) continue;
            if (node.children) {
                getFiles(node.children, files);
            } else if (node.path) {
                files.push(node.path);
            }
        }
    }
    let files = [];
    getFiles(this.blkfiles, files);
    if (files.length > 0) {
        this.SearchFiles(files);
    }
}

SearchImpl.prototype.SearchSpec = function () {
    let files = [];
    let ids = this.searchBlkTreeUI.combotree('getValues');
    if (ids) {
        for (let id of ids) {
            let node = this.searchBlkTreeUI.combotree('tree').tree('find', id);
            if (node && !node.children) {
                files.push(node.path);
            }
        }
    }
    if (files.length > 0) {
        this.SearchFiles(files);
    } else {
        Nt("没有搜索文件!");
    }
}

SearchImpl.prototype.SearchFiles = function (files) {
    let self = this;
    let i = 0;
    let len = files.length;
    $.messager.progress({title: "搜索中...", interval: 0});
    // let bar = $.messager.progress('bar');
    let catchError = false;
    let savedCount = 0;
    this.savedFailList = [];
    let currSaving = null;
    this.replacedCount = 0;
    let loadNext = function (fromsaved) {
        if (fromsaved) {
            $.messager.progress({title: "搜索中...", interval: 0});
        }
        $.messager.progress('bar').progressbar('setValue', parseInt(i * 100 / len));
        if (i < len) {
            let file = files[i];
            self.context.LoadBlk(file, function (ret, blkdata, blkpath) {
                try {
                    self.SearchContent(blkdata);
                    i += 1;
                    if (self.doReplacing && self.replaced) {
                        let codeEnd = false;
                        let hasCode = false;
                        let codeFail = false;
                        // 需要保存数据
                        _global.Event.once("OnBlkSaved", function (saveddata, context) {
                            if (currSaving !== blkdata.asseturl) return;
                            if (context && context.refs) {
                                let assetrefs = context.refs[blkdata.asseturl];
                                if (assetrefs && assetrefs.__code__) {
                                    hasCode = true;
                                }
                            }
                            if (hasCode) {
                                if (codeEnd) {
                                    if (codeFail) {
                                        self.savedFailList.push(blkdata.asseturl);
                                    } else {
                                        savedCount += 1;
                                    }
                                    loadNext(true);
                                } else {
                                    $.messager.progress({title: "保存编译中..."});
                                    $.messager.progress('bar').progressbar({
                                        text: '请等待...'
                                    });
                                }
                            } else {
                                savedCount += 1;
                                loadNext(true);
                            }
                            // loadNext(true);
                        });
                        _global.Event.once("CompileEnd", function (arg) {
                            if (currSaving !== blkdata.asseturl) return;
                            codeEnd = true;
                            codeFail = !!arg.error;
                            if (codeFail) {
                                console.error(arg.error);
                                Msg('<span style="color:red">编译失败! ' + '[' + blkdata.asseturl + ']' + '</span>' , 3, "消息");
                            } else {
                                Msg('<span style="color:yellow">编译成功! ' + '[' + blkdata.asseturl + ']' + '</span>' , 3, "消息");
                            }
                            if (hasCode) {
                                try { $.messager.progress('close'); } catch (e) {}
                                if (codeFail) {
                                    self.savedFailList.push(blkdata.asseturl);
                                } else {
                                    savedCount += 1;
                                }
                                loadNext(true);
                            }
                        });
                        _global.Event.once("OnBlkSavedFail", function (saveddata, context) {
                            if (currSaving !== blkdata.asseturl) return;
                            self.savedFailList.push(blkdata.asseturl);
                            loadNext(true);
                        });
                        currSaving = blkdata.asseturl;
                        self.context.SaveBlk(blkdata);
                    } else {
                        loadNext();
                    }
                } catch (e) {
                    Alert('执行错误', '文件: ' + blkpath + '</br>' + e.message + '</br>' + e.stack);
                    catchError = true;
                    i = len;
                    loadNext();
                }
            }, true);
        } else {
            if (!catchError) self.SearchComplete();
            $.messager.progress('close');
            let allCount = savedCount + self.savedFailList.length;
            if (allCount > 0) {
                let msg = "总共保存" + allCount + "个文件</br>" +
                    savedCount + "个文件替换保存成功</br>" +
                    "总共替换" + self.replacedCount + "处</br>";
                if (self.savedFailList.length > 0) {
                    msg += "失败文件" + self.savedFailList.length + "个：</br>" + self.savedFailList.join('</br>');
                }
                Nt(msg);
            }
        }
    }

    loadNext();
}

SearchImpl.prototype.SearchContent = function (blkdata) {
    let condfunc = this.GetSearchFunc();
    if (!condfunc) return;
    this.replaced = false;
    let pt = {'AssetURL': blkdata.asseturl};
    if (this.searchMeta) this.SearchMeta(blkdata.blk, condfunc, pt);
    if (this.searchGraph) this.SearchGraph(blkdata.graph, condfunc, pt);
    if (this.searchTimeline) this.SearchTimeline(blkdata.timeline, condfunc, pt);
    this.SetCurrPath(null);

    // 有对象搜索，如果还有字段搜索，就需要对找到的对象再进行字段搜索
    if (this.searchContentObject && (this.searchContentFieldName || this.searchContentFieldValue)) {
        this.SearchFieldAfterObjectSearched();
    }
}

SearchImpl.prototype.GetSearchFunc = function () {
    let condfunc = null;
    if (this.searchContentObject) {
        condfunc = this.SearchObjectFunc.bind(this);
    } else if (this.searchContentFieldName || this.searchContentFieldValue) {
        condfunc = this.SearchFieldFunc.bind(this);
    }
    return condfunc;
}

SearchImpl.prototype.SearchObjectFunc = function (value, typeid, prop, extra, kfdtable, savedCallback) {
    let matched = false;
    if (typeid === KFDataType.OT_OBJECT || typeid === KFDataType.OT_MIXOBJECT) {
        let cls = CommTool.GetKFDObjectClsName(value, prop);
        if (cls === this.searchObjectContent) {
            if (this.searchObjectCondition) {
                matched = this.EvaluateSearchObjectConditon(value, prop);
            } else {
                matched = true;
            }
            if (matched && this.doReplacing) {
                if (!this.searchContentFieldName && !this.searchContentFieldValue) {
                    if (extra && this.IsReplaceNodeMatched(extra.fullname)) {
                        if (this.searchFieldValueReplaceOnlySave) {
                            this.replaced = true;
                        } else if (this.searchFieldValueReplaceStatement) {
                            this.SearchAndReplaceStatement(value, prop, savedCallback);
                        }
                        return true;
                    }
                    return false;
                }
            }
        }
    }
    return matched;
}

SearchImpl.prototype.GetFieldSearchValueAndFlag = function (searchValue, caseSensitive, wholeWord, regEx) {
    let replaceValue = null;
    let flag = "g";
    if (!caseSensitive) {
        flag += 'i';
    }
    if (wholeWord) {
        let comm = "([\\s\.])";
        searchValue = "(^)" + searchValue + "($)" + "|" +
            "(^)" + searchValue + comm + "|" +
            comm + searchValue + "($)" + "|" +
            comm + searchValue + comm;
        // searchValue = "\\b" + searchValue + "\\b";
        replaceValue = "$1{__REPLACE_STR__}$2";
    } else if (!regEx) {
        searchValue = CommTool.EscapeRegEx(searchValue);
    }
    return {searchValue: searchValue, flag: flag, replaceValue: replaceValue};
}

SearchImpl.prototype.IsReplaceNodeMatched = function (fullname) {
    if (!this.toReplaceNodes) return true;
    let pt = $.extend(true, {}, this.currSearchPath);
    fullname = CommTool.CatNamePath(pt.FieldPath, fullname || "");
    if (pt.hasOwnProperty('FieldPath')) delete pt.FieldPath;
    for (let i = 0; i < this.toReplaceNodes.length; ++i) {
        let item = this.toReplaceNodes[i];
        let name = item.FieldPath || "";
        if (CommTool.IsObjectEqualFirstBased(pt, item) && fullname === name) {
            return true;
        }
    }
    return false;
}

SearchImpl.prototype.SearchAndReplaceStatement = function (data, prop, savedCallback) {
    this.ExecuteReplaceStatement(data, prop, savedCallback);
}

SearchImpl.prototype.SearchFieldFunc = function (value, typeid, prop, extra, kfdtable, savedCallback) {
    let processed = false;
    let matched = true;
    if (this.searchContentFieldName) {
        matched = this.SearchFieldNameFunc(value, typeid, prop, extra, kfdtable, savedCallback);
        processed = true;
    }
    if (matched && this.searchContentFieldValue) {
        matched = this.SearchFieldValueFunc(value, typeid, prop, extra, kfdtable, savedCallback);
        processed = true;
    }
    if (processed && matched && this.doReplacing) {
        if (!this.normalReplace) {
            if (extra && this.IsReplaceNodeMatched(extra.fullname)) {
                if (this.searchFieldValueReplaceOnlySave || !this.searchFieldValueReplaceStatement) {
                    if (this.searchFieldValueReplaceOnlySave) {
                        this.replaced = true;
                    } else if (this.ReplaceFieldValue(value, typeid, prop, extra, kfdtable, savedCallback)) {
                        this.replaced = true;
                        this.replacedCount += 1;
                    }
                } else {
                    if (typeid === KFDataType.OT_OBJECT || typeid === KFDataType.OT_MIXOBJECT) {
                        this.SearchAndReplaceStatement(value, prop, savedCallback);
                    }
                }
                return true;
            }
            return false;
        } else {
            if (this.ReplaceFieldValue(value, typeid, prop, extra, kfdtable, savedCallback)) {
                this.replaced = true;
                this.replacedCount += 1;
            }
            return true;
        }
    }
    return processed && matched;
}

SearchImpl.prototype.SearchFieldNameFunc = function (value, typeid, prop, extra, kfdtable, savedCallback) {
    if (prop && (prop.name && typeof prop.name === 'string' || prop.cname)) {
        let sp = this.GetFieldSearchValueAndFlag(this.searchFieldNameContent,
            this.fieldNameCaseSensitive,
            this.fieldNameWholeWord,
            this.fieldNameRegEx);
        let regex = new RegExp(sp.searchValue, sp.flag);
        if (this.fieldNamePath) {
            if (extra && extra.fullname) {
                let fullname = extra.fullname;
                if (this.currSearchPath) {
                    fullname = CommTool.CatNamePath(this.currSearchPath.FieldPath, fullname || "");
                }
                return !!fullname.match(regex);
            }
        } else {
            return !!(prop.name && prop.name.match(regex)) || !!(prop.cname && prop.cname.match(regex));
        }
    }
    return false;
}

SearchImpl.GetValueStr = function (value, typeid) {
    let strValue = "";
    if (KFDataType.Is_Number(typeid) || KFDataType.OT_BOOL === typeid) {
        strValue = value.toString();
    } else if (KFDataType.OT_STRING === typeid) {
        if (value instanceof KFDName) {
            strValue = value.toString();
        } else {
            strValue = value;
        }
    }
    return strValue;
}

SearchImpl.prototype.SearchFieldValueFunc = function (value, typeid, prop, extra, kfdtable, savedCallback) {
    if (value != null) {
        let strValue = SearchImpl.GetValueStr(value, typeid);
        let sp = this.GetFieldSearchValueAndFlag(this.searchFieldValueContent,
            this.fieldValueCaseSensitive,
            this.fieldValueWholeWord,
            this.fieldValueRegEx);
        let regex = new RegExp(sp.searchValue, sp.flag);
        return !!(strValue && strValue.match(regex));
    }
    return false;
}

SearchImpl.prototype.GetFieldReplaceContent = function (value, typeid) {
    let strReplace = this.searchFieldValueReplaceContent;
    if (this.searchContentFieldValue) {
        if (value != null) {
            let strValue = SearchImpl.GetValueStr(value, typeid);
            let sp = this.GetFieldSearchValueAndFlag(this.searchFieldValueContent,
                this.fieldValueCaseSensitive,
                this.fieldValueWholeWord,
                this.fieldValueRegEx);
            let regex = new RegExp(sp.searchValue, sp.flag);
            if (sp.replaceValue) {
                strReplace = sp.replaceValue.replaceAll('{__REPLACE_STR__}', strReplace);
            }
            strReplace = strValue.replaceAll(regex, strReplace);
        } else {
            strReplace = null;
        }
    }
    return strReplace;
}

SearchImpl.prototype.ReplaceFieldValue = function (value, typeid, prop, extra, kfdtable, savedCallback) {
    let ret = false;
    if (prop.name == null || prop.name === "" || !extra || !extra.parent) return;
    let parent = extra.parent;
    let replaceContent = this.GetFieldReplaceContent(value, typeid);
    if (replaceContent != null) {
        if (KFDataType.Is_Number(typeid) || KFDataType.OT_BOOL === typeid) {
            parent[prop.name] = Number(replaceContent);
            ret = true;
        } else if (KFDataType.OT_STRING === typeid) {
            if (value && value instanceof KFDName) {
                value.setString(replaceContent);
            } else {
                parent[prop.name] = replaceContent;
            }
            ret = true;
        }
        if (ret && savedCallback && savedCallback.callback) {
            savedCallback.callback();
        }
    }
    return ret;
}

SearchImpl.fieldPathMapToPaths = function (fieldPaths, pt) {
    let ret = [];
    for (let j = 0; j < fieldPaths.length; ++j) {
        let item = fieldPaths[j];
        let newpt = $.extend(true, {}, pt);
        newpt.FieldPath = item.path;
        ret.push({pt: newpt, extra: item});
    }
    return ret;
}

SearchImpl.prototype.PushFieldPathsToResult = function (fieldPaths, pt, mapfunc) {
    if (fieldPaths && fieldPaths.length > 0) {
        if (mapfunc) {
            for (let item of fieldPaths) {
                item.path = mapfunc(item.path);
            }
        }
        this.results.push(...SearchImpl.fieldPathMapToPaths(fieldPaths, pt));
    }
}

SearchImpl.prototype.SetCurrPath = function (pt) {
    this.currSearchPath = pt;
}

SearchImpl.prototype.SearchMeta = function (meta, condfunc, parentpt) {
    if (!meta) return;
    let pt = $.extend(true, {}, parentpt);
    let prefixPath = '__meta__';
    this.SetCurrPath($.extend(true, {FieldPath: prefixPath}, pt));
    let matchedPaths = CommTool.FindPathInKFDObject(meta, {otype: 'KFMetaData'}, this.context.kfdtable,
        condfunc, {data: true}, {enableDefaultField: this.searchDefaultField});
    this.PushFieldPathsToResult(matchedPaths, pt, item => prefixPath + '.' + item);
    // 对象数据
    this.SearchObjectBytesData(meta.data, condfunc, pt, meta.type.toString(), prefixPath + '.data');
}

SearchImpl.prototype.SearchObjectBytesData = function (data, condfunc, parentpt, metaclass, prefixPath) {
    if (!data) return;
    let pt = $.extend(true, {}, parentpt);
    if (metaclass) {
        data.object = {__cls__: metaclass};
    } else {
        data.object = {};
    }
    KFDJson.read_value(data.bytes, false, data.object);
    this.SetCurrPath($.extend(true, {FieldPath: prefixPath}, pt));
    let matchedPaths = CommTool.FindPathInKFDObject(data.object, {otype: metaclass}, this.context.kfdtable,
        condfunc, {vars: true}, {enableDefaultField: this.searchDefaultField});
    this.PushFieldPathsToResult(matchedPaths, pt, item => prefixPath + '.' + item);
    // 动态属性
    this.SearchVarsData(data.object.vars, condfunc, pt, prefixPath + '.vars');
}

SearchImpl.prototype.SearchVarsData = function (data, condfunc, parentpt, prefixPath) {
    if (!data) return;
    let pt = $.extend(true, {}, parentpt);
    data.object = {};
    VarsInit(data.object);
    if (data.object.read) {
        data.object.read(data.bytes);
        this.SetCurrPath($.extend(true, {FieldPath: prefixPath}, pt));
        let matchedPaths = CommTool.FindPathInKFDObject(data.object, {otype: 'eAttribList'}, this.context.kfdtable,
            condfunc, null, {enableDefaultField: this.searchDefaultField});
        this.PushFieldPathsToResult(matchedPaths, pt, item => prefixPath + '.' + item);
    }
}

SearchImpl.prototype.SearchGraph = function (graph, condfunc, parentpt) {
    if (!graph) return;
    let pt = $.extend(true, {}, parentpt);
    this.SetCurrPath(pt);
    let matchedPaths = CommTool.FindPathInKFDObject(graph, {otype: 'KFGraphConfig'}, this.context.kfdtable,
        condfunc, {data: {blocks: true}}, {enableDefaultField: this.searchDefaultField});
    this.PushFieldPathsToResult(matchedPaths, pt, item => "__graph__." + item);
    if (!graph.data || !graph.data.blocks) return;
    for (let block of graph.data.blocks) {
        this.SearchGraphBlock(block, condfunc, pt);
    }
}

SearchImpl.prototype.SearchGraphBlock = function (block, condfunc, parentpt) {
    if (!block) return;
    let pt = $.extend(true, {}, parentpt);
    pt.NodeName = block.name.toString();
    this.SetCurrPath(pt);
    let matchedPaths = CommTool.FindPathInKFDObject(block, {otype: 'KFGraphBlockData'}, this.context.kfdtable,
        condfunc, {target: {initBytes: true}, frame: true}, {enableDefaultField: this.searchDefaultField});
    this.PushFieldPathsToResult(matchedPaths, pt);
    // 对象初始化数据
    if (block.target && block.target.initBytes) {
        this.SearchObjectBytesData(block.target.initBytes, condfunc, pt, '', 'target.initBytes');
    }
    this.SearchFrame(block.frame, condfunc, pt, "frame");
}

SearchImpl.prototype.SearchFrame = function (frame, condfunc, parentpt, prefixPath) {
    if (!frame) return;
    let pt = $.extend(true, {}, parentpt);
    this.SetCurrPath($.extend(true, prefixPath ? {FieldPath: prefixPath} : {}, pt));
    let matchedPaths = CommTool.FindPathInKFDObject(frame, {otype: 'KFFrameData'}, this.context.kfdtable,
        condfunc, {scripts: true}, {enableDefaultField: this.searchDefaultField});
    this.PushFieldPathsToResult(matchedPaths, pt, prefixPath ? item => prefixPath + "." + item : null);
    if (!frame.scripts) return;
    for (let i = 0; i < frame.scripts.length; ++i) {
        let script = frame.scripts[i];
        if (!script) continue;
        pt.ScriptId = i;
        this.SetCurrPath(pt);
        let prop = {type: "mixobject", otype: "KFScriptData", name: i};
        if (condfunc(script, KFDataType.OT_MIXOBJECT, prop, {parent: frame.scripts}, this.context.kfdtable)) {
            this.results.push({
                pt: $.extend(true, {}, pt),
                extra: {path: "", value: script, parent: frame.scripts, prop: prop}
            });
        }
        matchedPaths = CommTool.FindPathInKFDObject(script, null, this.context.kfdtable,
            condfunc, null, {enableDefaultField: this.searchDefaultField});
        this.PushFieldPathsToResult(matchedPaths, pt);
    }
}

SearchImpl.prototype.SearchTimeline = function (timeline, condfunc, parentpt) {
    if (!timeline) return;
    let pt = $.extend(true, {}, parentpt);
    this.SetCurrPath(pt);
    let matchedPaths = CommTool.FindPathInKFDObject(timeline, {otype: 'KFTimelineConfig'}, this.context.kfdtable,
        condfunc, {states: true}, {enableDefaultField: this.searchDefaultField});
    this.PushFieldPathsToResult(matchedPaths, pt, item => "__timeline__." + item);
    if (!timeline.states) return;
    for (let state of timeline.states) {
        this.SearchTimelineState(state, condfunc, pt);
    }
}

SearchImpl.prototype.SearchTimelineState = function (state, condfunc, parentpt) {
    if (!state) return;
    let pt = $.extend(true, {}, parentpt);
    pt.StateId = state.id;
    this.SetCurrPath(pt);
    let matchedPaths = CommTool.FindPathInKFDObject(state, {otype: 'KFTimelineData'}, this.context.kfdtable,
        condfunc, {layers: true}, {enableDefaultField: this.searchDefaultField});
    this.PushFieldPathsToResult(matchedPaths, pt);
    if (!state.layers) return;
    for (let layerId = 0; layerId < state.layers.length; ++layerId) {
        this.SearchTimelineLayer(state.layers[layerId], condfunc, pt, layerId);
    }
}

SearchImpl.prototype.SearchTimelineLayer = function (layer, condfunc, parentpt, layerId) {
    if (!layer) return;
    let pt = $.extend(true, {}, parentpt);
    pt.LayerId = layerId;
    this.SetCurrPath(pt);
    let matchedPaths = CommTool.FindPathInKFDObject(layer, {otype: 'KFTimelayerData'}, this.context.kfdtable,
        condfunc, {blocks: {keyframes: true}}, {enableDefaultField: this.searchDefaultField});
    this.PushFieldPathsToResult(matchedPaths, pt);

    if (!layer.blocks) return;
    for (let block of layer.blocks) {
        if (!block.keyframes) continue;
        for (let frame of block.keyframes) {
            this.SearchTimelineKeyFrame(block.hasOwnProperty('begin') ? block.begin : 0, frame, condfunc, pt);
        }
    }
}

SearchImpl.prototype.SearchTimelineKeyFrame = function (beginid, frame, condfunc, parentpt) {
    if (!frame) return;
    let pt = $.extend(true, {}, parentpt);
    pt.FrameId = frame.id + beginid;
    this.SetCurrPath(pt);
    let matchedPaths = CommTool.FindPathInKFDObject(frame, {otype: 'KFKeyFrame'}, this.context.kfdtable,
        condfunc, {data: true}, {enableDefaultField: this.searchDefaultField});
    this.PushFieldPathsToResult(matchedPaths, pt);
    this.SearchFrame(frame.data, condfunc, pt, "data");
}

SearchImpl.prototype.SearchFieldAfterObjectSearched = function () {
    let searchObjSet = new Set();
    let objectResults = this.results;
    this.results = [];
    for (let item of objectResults) {
        if (item.extra && item.extra.value) {
            searchObjSet.add(item.extra.value);
        }
    }
    for (let item of objectResults) {
        if (!item.pt || !item.extra) continue;
        let extra = item.extra;
        if (extra.value) {
            this.SetCurrPath(item.pt);
            let matchedPaths = CommTool.FindPathInKFDObject(extra.value, extra.prop, this.context.kfdtable,
                this.SearchFieldFunc.bind(this), null, {
                    enableDefaultField: this.searchDefaultField,
                    ignoreObjectFunc: function (obj, prop, kfdtable) {
                        return searchObjSet.has(obj);
                    },
                    savedCallback: extra.savedCallback
                });
            this.PushFieldPathsToResult(matchedPaths, item.pt, elem => item.pt.FieldPath ? item.pt.FieldPath + '.' + elem : elem);
        }
    }
    this.resultsAfterObjectSearched.push(...this.results);
}

SearchImpl.statementExprDefines = {
    Group: {
        BeginEnds: {
            '(': ')'
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
                cc === 95 || // _
                cc === 46; // .
        },
    },
    Number: {
        CheckBegin: function (ch) {
            let cc = ch.charCodeAt();
            return cc >= 48 && cc <= 57; // 0...9
        },
        CheckDigit: function (ch) {
            let cc = ch.charCodeAt();
            return (cc >= 48 && cc <= 57) || cc === 46; // 0...9&.
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
        Includes: [' ', '\t', '\n', '\r']
    },
    UnaryOperator: {
        Includes: ['!', '-', '+']
    },
    BinaryOperator: {
        Includes: {
            ';': {Precedence: 1, Logic: true},
            '=': {Precedence: 2, Logic: true},
            '||': {Precedence: 3, Logic: true},
            '&&': {Precedence: 4, Logic: true},
            '===': {Precedence: 6, Logic: true},
            '!==': {Precedence: 6, Logic: true},
            '<': {Precedence: 7, Logic: true},
            '>': {Precedence: 7, Logic: true},
            '<=': {Precedence: 7, Logic: true},
            '>=': {Precedence: 7, Logic: true},
            '+': {Precedence: 9},
            '-': {Precedence: 9},
            '*': {Precedence: 10},
            '/': {Precedence: 10},
            '%': {Precedence: 10},
            'include': {Precedence: 11},
        }
    },
    OnGetLogicOpValue: function (leftValue, operator, getRight) {
        let rightValue = getRight();
        if (rightValue instanceof SearchImpl.SearchReplaceObject) {
            rightValue = rightValue.GetValueFunc();
        }
        if (operator === '=') {
            if (leftValue instanceof SearchImpl.SearchReplaceObject) {
                let strValue = SearchImpl.ToStr(rightValue);
                if (strValue !== undefined) {
                    leftValue.DoReplaceFunc(strValue);
                    return true;
                }
            }
            return false;
        }
        if (leftValue instanceof SearchImpl.SearchReplaceObject) {
            leftValue = leftValue.GetValueFunc();
        }
        switch (operator) {
            case '&&': return leftValue && rightValue;
            case '||': return leftValue || rightValue;
            case '>': return leftValue > rightValue;
            case '>=': return leftValue >= rightValue;
            case '<': return leftValue < rightValue;
            case '<=': return leftValue <= rightValue;
            case '===': return leftValue === rightValue;
            case '!==': return leftValue !== rightValue;
            case 'include': return leftValue.toString &&
                rightValue.toString &&
                leftValue.toString().indexOf(rightValue.toString()) !== -1;
            // skip default case
        }
        return false;
    },
    OnGetBinaryOpValue: function (leftValue, operator, rightValue) {
        if (leftValue instanceof SearchImpl.SearchReplaceObject) {
            leftValue = leftValue.GetValueFunc();
        }
        if (rightValue instanceof SearchImpl.SearchReplaceObject) {
            rightValue = rightValue.GetValueFunc();
        }
        switch (operator) {
            case '+': return leftValue + rightValue;
            case '-': return leftValue - rightValue;
            case '*': return leftValue * rightValue;
            case '/': return leftValue / rightValue;
            case '%': return leftValue % rightValue;
            // skip default case
        }
    },
    OnGetUnaryOpValue: function (value, operator) {
        if (value instanceof SearchImpl.SearchReplaceObject) {
            value = value.GetValueFunc();
        }
        switch (operator) {
            case '!': return !value;
            case '+': return +value;
            case '-': return -value;
            // skip default case
        }
    }
}

SearchImpl.prototype.MakeSearchObjectConditionExpr = function () {
    if (this.searchObjectConditionContent) {
        let expression = new ExpressionParser(SearchImpl.statementExprDefines);
        expression.parse(this.searchObjectConditionContent);
        let hasError = false;
        expression.onError((message, index, ch) => {
            hasError = true;
            //在控制台提示下
            console.warn("搜索对象条件表达式解析失败", message, expr, index, ch);
        });
        if (!hasError) {
            this.searchObjectConditionExpr = expression;
            return true;
        }
    }
    return false;
}

SearchImpl.prototype.EvaluateSearchObjectConditon = function (data, prop) {
    if (!this.searchObjectConditionExpr) return true;
    const expression = this.searchObjectConditionExpr;
    expression.onGetVariableValue((name) => {
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
        if (ret !== undefined) return ret;
        ret = CommTool.GetValueByPathName(name, data, prop, this.context.kfdtable, this.searchDefaultField);
        return ret && ret.result ? ret.data : undefined;
    });
    return !!expression.evaluate();
}

SearchImpl.SelectAllRows = function (checkAll) {
    if (!SearchImpl.currentInstance) return;
    let inst = SearchImpl.currentInstance;
    let op = "uncheckNode";
    if (checkAll) op = "checkNode";
    let nodes = inst.searchResultsUI.treegrid('getData');
    for (let node of nodes) {
        let id = node.id;
        inst.searchResultsUI.treegrid(op, id);
    }
    // for (let i = 0; i < inst.results.length; ++i) {
    //     let item = inst.results[i];
    //     let id = i + 1;
    //     inst.searchResultsUI.treegrid(op, id);
    // }
}

// 不清楚为什么loadData空数组后，通过getCheckedNodes还能拿到数据，只能把CheckedNodes再清一次
// 不要用getCheckedNodes，保留代码在这里是为了下次能看到
SearchImpl.prototype.ClearSearchResultsUI = function () {
    // let nodes = this.searchResultsUI.treegrid('getData');
    // for (let node of nodes) {
    //     let id = node.id;
    //     this.searchResultsUI.treegrid('uncheckNode', id);
    //     this.searchResultsUI.treegrid('remove', id);
    // }
    // let checked_nodes = this.searchResultsUI.treegrid('getCheckedNodes');
    // for (let node of nodes) {
    //     let id = node.id;
    //     this.searchResultsUI.treegrid('uncheckNode', id);
    //     this.searchResultsUI.treegrid('remove', id);
    // }
    this.searchResultsUI.treegrid('loadData', []);
}

SearchImpl.prototype.MakeReplaceStatementExpr = function () {
    if (this.searchFieldValueReplaceContent) {
        let expression = new ExpressionParser(SearchImpl.statementExprDefines);
        expression.parse(this.searchFieldValueReplaceContent);
        let hasError = false;
        expression.onError((message, index, ch) => {
            hasError = true;
            //在控制台提示下
            console.warn("赋值语句表达式解析失败", message, expr, index, ch);
        });
        if (!hasError) {
            this.replaceStatementExpr = expression;
            return true;
        }
    }
    return false;
}

SearchImpl.SearchReplaceObject = function (getvaluefunc, doreplacefunc) {
    this.GetValueFunc = getvaluefunc;
    this.DoReplaceFunc = doreplacefunc;
}

SearchImpl.ToStr = function (value) {
    let type = typeof value;
    if (type === 'number') return value.toString();
    if (type === 'string') return value;
    if (type === 'boolean') return value.toString();
    if (value && value instanceof KFDName) return value.toString();
    return undefined;
}

SearchImpl.prototype.ExecuteReplaceStatement = function (data, prop, savedCallback) {
    if (!this.replaceStatementExpr) return true;
    let self = this;
    const expression = this.replaceStatementExpr;
    expression.onGetVariableValue((name) => {
        let val = undefined;
        switch (name) {
            case "true": {
                val = true;
                break;
            }
            case "false": {
                val = false;
                break;
            }
            default:
                break;
        }
        if (val !== undefined) return val;
        let getValueFunc = function () {
            let ret = CommTool.GetValueByPathName(name, data, prop, self.context.kfdtable, self.searchDefaultField);
            return ret && ret.result ? ret.data : undefined;
        }
        let doReplaceFunc = function (value) {
            self.normalReplace = true;
            let oldSearchContentFieldName = self.searchContentFieldName;
            let oldSearchFieldNameContent = self.searchFieldNameContent;
            let oldSearchFieldValueReplaceContent = self.searchFieldValueReplaceContent;
            let oldFieldNameCaseSensitive = self.fieldNameCaseSensitive;
            let oldFieldNamePath = self.fieldNamePath;
            let oldFieldNameRegEx = self.fieldNameRegEx;
            let oldcurrSearchPath = self.currSearchPath;
            self.searchContentFieldName = true;
            self.searchFieldNameContent = "^" + name + "$";
            self.searchFieldValueReplaceContent = value;
            self.fieldNameCaseSensitive = true;
            self.fieldNamePath = true;
            self.fieldNameRegEx = true;
            self.SetCurrPath(null);
            CommTool.FindPathInKFDObject(data, prop, self.context.kfdtable,
                self.SearchFieldFunc.bind(self), null, {
                    enableDefaultField: self.searchDefaultField,
                    savedCallback: savedCallback
                });
            self.searchContentFieldName = oldSearchContentFieldName;
            self.searchFieldNameContent = oldSearchFieldNameContent;
            self.searchFieldValueReplaceContent = oldSearchFieldValueReplaceContent;
            self.fieldNameCaseSensitive = oldFieldNameCaseSensitive;
            self.fieldNamePath = oldFieldNamePath;
            self.fieldNameRegEx = oldFieldNameRegEx;
            self.SetCurrPath(oldcurrSearchPath);
            delete self.normalReplace;
        }
        return new SearchImpl.SearchReplaceObject(getValueFunc, doReplaceFunc);
    });
    expression.evaluate();
}
