function KFDEditTool(editor)
{
    this.editor = editor;
}

KFDEditTool.prototype.Dispose = function()
{

}

KFDEditTool.global = {};
KFDEditTool.instance = {};

KFDEditTool.DisposeInstances = function()
{

}

KFDEditTool.prototype.CopyData = function(dataid)
{
    let uiddata = this.editor.builddatas[dataid];
    let prop = uiddata._prop;
    let typeid = uiddata.vtype;

    let kv = this.editor.GetData2(uiddata);
    if(kv == null) {
        kv = KFDEditor.CastValue(uiddata.vtype, uiddata.value);
        if(kv == null) {
            console.log("not support type");
            return;
        }
    }

    let otype = prop ? prop.otype : null;
    if(!prop && uiddata._parent && uiddata._parent._prop) {
        otype = uiddata._parent._prop.otype;
    }

    // 这里不需要判断mixobject，mixobject肯定有__cls__
    if(typeid === KFDataType.OT_OBJECT && kv) {
        if (prop && prop.otype) {
            // 固定类型对象，使用otype指定类型
            kv.__cls__ = prop.otype;
        } else if(uiddata._parent && uiddata._parent._prop) {
            // 数组元素，固定类型对象，使用otype指定类型
            kv.__cls__ = uiddata._parent._prop.otype;
        }
    }

    let kfbytearr = new KFByteArray();
    KFDJson.write_value(kfbytearr, kv, uiddata._prop);
    kv = bytesToBase64(kfbytearr.GetBuff());

    ClipboardTool.SetClipboard("KFDEditor", {data: kv, vtype: typeid, otype: otype, prop: uiddata._prop});
}

KFDEditTool.IsTypeMatched = function (dt, st) {
    if (KFDataType.Is_Integer(dt) && KFDataType.Is_Integer(st)) return {matched: true, type: 'int'};
    if (KFDataType.Is_Float(dt) && KFDataType.Is_Float(st)) return {matched: true, type: 'float'};
    if (KFDataType.OT_STRING === dt && KFDataType.OT_STRING === st) return {matched: true, type: 'string'};
    if (KFDataType.OT_BOOL === dt && KFDataType.OT_BOOL === st) return {matched: true, type: 'bool'};
    if (KFDataType.OT_BYTES === dt && KFDataType.OT_BYTES === st) return {matched: true, type: 'bytes'};
    if (KFDataType.OT_UNKNOW === dt && KFDataType.OT_UNKNOW === st) return {matched: true, type: 'unknown'};
    if (KFDataType.OT_ARRAY === dt && KFDataType.OT_ARRAY === st) return {matched: true, type: 'array'};
    if (KFDataType.OT_MIXARRAY === dt && KFDataType.OT_MIXARRAY === st) return {matched: true, type: 'mixarray'};
    if (KFDataType.OT_OBJECT === dt && KFDataType.OT_OBJECT === st) return {matched: true, type: 'object'};
    if (KFDataType.OT_MIXOBJECT === dt && KFDataType.OT_MIXOBJECT === st) return {matched: true, type: 'mixobject'};
    return {matched: false};
}

KFDEditTool.prototype.GetPasteDataMatchType = function (uidata, copyData) {
    let dt = uidata.vtype;
    let st = copyData.vtype;
    let dprop = uidata._prop;
    let dotypeid = -1;
    let dotype = dprop ? dprop.otype : null;
    if(!dprop && uidata._parent && uidata._parent._prop) {
        dotype = uidata._parent._prop.otype;
    }
    if (dotype) {
        dotypeid = KFDataType.GetTypeID(dotype);
    }
    let sotype = null;
    let sotypeid = -1;
    if (copyData.otype) {
        sotype = copyData.otype;
        sotypeid = KFDataType.GetTypeID(copyData.otype);
    }

    let typeret = KFDEditTool.IsTypeMatched(dt, st);
    let ret = {matched: typeret.matched, type: typeret.type}
    if (typeret.matched) {
        switch (typeret.type) {
            case 'array': {
                let otyperet = KFDEditTool.IsTypeMatched(dotypeid, sotypeid)
                ret.matched = otyperet.matched;
                if (otyperet.matched) {
                    if (otyperet.type === 'unknown' && dotype !== sotype) {
                        ret.matched = false;
                    }
                }
                break;
            }
            case 'mixarray': {
                if (dotype !== sotype) {
                    let kfdtable = this.editor.kfdtable;
                    let kfddata = kfdtable.get_kfddata(sotype);
                    ret.matched = kfdtable.is_extend(kfddata, dotype);
                }
                break;
            }
            case 'object': {
                if (dotype !== sotype) {
                    ret.matched = false;
                }
                break;
            }
            case 'mixobject': {
                if (dotype && sotype && dotype !== sotype) {
                    ret.matched = false;
                    if (copyData.data && copyData.data.__cls__) {
                        let kfdtable = this.editor.kfdtable;
                        let kfddata = kfdtable.get_kfddata(copyData.data.__cls__);
                        if (kfdtable.is_extend(kfddata, dotype)) {
                            ret.matched = true;
                        }
                    }
                }
                break;
            }
            default: break;
        }
    } else {
        if (KFDataType.OT_ARRAY === dt) {
            let stypeid = st;
            if (st === KFDataType.OT_OBJECT || st === KFDataType.OT_MIXOBJECT) {
                stypeid = sotypeid;
            }
            let otyperet = KFDEditTool.IsTypeMatched(dotypeid, stypeid)
            ret.matched = otyperet.matched;
            ret.type = "array_add";
            if (otyperet.matched) {
                if (otyperet.type === 'unknown' && copyData.data && dotype !== copyData.data.__cls__) {
                    ret.matched = false;
                }
            }
        } else if (KFDataType.OT_MIXARRAY === dt) {
            if (dotype && sotype) {
                ret.type = "array_add";
                if (dotype !== sotype) {
                    if (copyData.data && copyData.data.__cls__) {
                        let kfdtable = this.editor.kfdtable;
                        let kfddata = kfdtable.get_kfddata(copyData.data.__cls__);
                        if (kfdtable.is_extend(kfddata, dotype)) {
                            ret.matched = true;
                        }
                    }
                } else {
                    ret.matched = true;
                }
            }
        }
    }
    return ret;
}

KFDEditTool.prototype.PasteData = function(dataid) {
    let uidata = this.editor.builddatas[dataid];
    if (!uidata) return;
    let copyData = ClipboardTool.GetClipboard("KFDEditor");
    if (!copyData) return;
    let kfbytearr = new KFByteArray(base64ToBytes(copyData.data));
    copyData.data = KFDJson.read_value(kfbytearr, false, {}, copyData.prop);
    let typeret = this.GetPasteDataMatchType(uidata, copyData);
    if (typeret.matched && typeret.type) {
        if (typeret.type.indexOf('array') === -1) {
            this._PasteData(uidata, copyData);
        } else {
            this._PasteArrayData(uidata, copyData);
        }
    }
}

KFDEditTool.prototype._PasteData = function(uiddata, copyData) {
    let kv = copyData.data;

    if (uiddata.vtype !== KFDataType.OT_OBJECT && uiddata.vtype !== KFDataType.OT_MIXARRAY) {
        uiddata.value = kv;
    }
    this.editor.SetData2(uiddata, kv, false, true);
    this.editor.tg.treegrid("update", {
        id: uiddata.id,
        row: uiddata
    });
}

KFDEditTool.prototype._PasteArrayData = function(uiddata, copyData) {
    let st = copyData.vtype;
    let kv = copyData.data;
    if (st === KFDataType.OT_ARRAY || st === KFDataType.OT_MIXARRAY) {
        for (let i = 0; i < kv.length; ++i) {
            this.editor.AddArrayData(uiddata.id, kv[i]);
        }
    } else {
        this.editor.AddArrayData(uiddata.id, kv);
    }
}

KFDEditTool.prototype.CopySysData = function(dataid) {
    let uidata = this.editor.builddatas[dataid];
    if (!uidata) return;
    let otype = this.GetUIObjectType(uidata);
    if (otype !== 'FVector' && otype !== "FRotator") return;

    let kv = this.editor.GetData2(uidata);
    if(kv == null) {
        kv = KFDEditor.CastValue(uidata.vtype, uidata.value);
        if(kv == null) {
            console.log("not support type");
            return;
        }
    }
    let kfddata = this.editor.kfdtable.get_kfddata(otype);
    let allprops = KFDPropTool.GetAllKFDProperty(kfddata, this.editor.kfdtable);
    let Str = "{";
    for (let i = 0; i < allprops.length; ++i) {
        let prop = allprops[i];
        let value = null;
        if (kv.hasOwnProperty(prop.name)) {
            value = kv[prop.name];
        } else {
            value = CommTool.GetKFDInitValue(prop, KFDataType.GetTypeID(prop.type), uidata._prop, this.editor.kfdtable);
        }
        Str += prop.name + "=" + value;
        if (i < allprops.length - 1) {
            Str += ",";
        }
    }
    Str += "}";
    ClipboardTool.SetSystemClipboard(Str);
}

KFDEditTool.prototype.PasteSysData = function(dataid) {
    let uidata = this.editor.builddatas[dataid];
    if (!uidata) return;
    let data = this.ParseSysClipboard(uidata);
    if (!data) return;
    let copyData = {data: data, vtype: KFDataType.OT_OBJECT, otype: data.__cls__};
    let typeret = this.GetPasteDataMatchType(uidata, copyData);
    if (typeret.matched && typeret.type) {
        if (typeret.type.indexOf('array') === -1) {
            this._PasteData(uidata, copyData);
        } else {
            this._PasteArrayData(uidata, copyData);
        }
    }
}

KFDEditTool.prototype.ParseSysClipboardToKFD = function (clsname) {
    let txt = ClipboardTool.GetSystemClipboard();
    if (!txt) return null;
    if (txt[0] !== '(' && txt[txt.length -1] !== ')' && txt.indexOf('=') === -1) return null;
    let kfddata = this.editor.kfdtable.get_kfddata(clsname);
    if (!kfddata || !kfddata.propertys) return null;
    let jsonstr = txt.replace('(', '{').replace(')', '}').replaceAll('=', ':');
    for (let prop of kfddata.propertys) {
        jsonstr = jsonstr.replace(prop.name, '"' + prop.name + '"');
    }
    let jsonobj = null;
    try {
        jsonobj = JSON.parse(jsonstr);
    } catch (e) {}
    if (!jsonobj) return null;
    let kv = {__cls__: clsname};
    KFDJson.init_object(kv, kfddata);
    for (let prop of kfddata.propertys) {
        if (!jsonobj.hasOwnProperty(prop.name)) return null;
        kv[prop.name] = jsonobj[prop.name];
    }
    return kv;
}

KFDEditTool.prototype.GetUIObjectType = function (uidata) {
    let otype = "";
    if (uidata && uidata.vtype === KFDataType.OT_OBJECT) {
        otype = uidata._prop ? uidata._prop.otype : null;
        if (!uidata._prop && uidata._parent && uidata._parent._prop) {
            otype = uidata._parent._prop.otype;
        }
    }
    return otype;
}

KFDEditTool.prototype.ParseSysClipboard = function (uidata) {
    let otype = this.GetUIObjectType(uidata);
    let kv = null;
    switch (otype) {
        case 'FVector': {
            kv = this.ParseSysClipboardToKFD('FVector');
            break;
        }
        case 'FRotator': {
            kv = this.ParseSysClipboardToKFD('FRotator');
            break;
        }
        default:
            break;
    }
    return kv;
}

KFDEditTool.prototype.ProcSysMenu = function (uidata, menuui) {
    let otype = this.GetUIObjectType(uidata);
    if (otype !== 'FVector' && otype !== "FRotator") {
        otype = "";
    }
    let itemEl = $('#editsyscopy')[0];
    if (itemEl) {
        let item = menuui.menu('getItem', itemEl);
        if (item) {
            if (otype) $(item.target).show();
            else $(item.target).hide();
        }
    }

    let kv = this.ParseSysClipboard(uidata);
    itemEl = $('#editsyspaste')[0];
    if (itemEl) {
        let item = menuui.menu('getItem', itemEl);
        if (item) {
            if (kv) $(item.target).show();
            else $(item.target).hide();
        }
    }
}

KFDEditTool.prototype.ProcCopyMenu = function (uidata, menuui) {
    if (!uidata) return;

    let copyData = ClipboardTool.GetClipboard("KFDEditor");
    if (!copyData) return;
    let kfbytearr = new KFByteArray(base64ToBytes(copyData.data));
    try {
        copyData.data = KFDJson.read_value(kfbytearr, false, {}, copyData.prop);
    } catch (e) {
        copyData.data = undefined;
    }
    let enable = false;
    if (copyData.data !== undefined) {
        let typeret = this.GetPasteDataMatchType(uidata, copyData);
        enable = typeret.matched;
    }
    let itemEl = $('#editpaste')[0];
    if (itemEl) {
        if (enable) menuui.menu('enableItem', itemEl);
        else menuui.menu('disableItem', itemEl);
    }
}

KFDEditTool.Regulation =  function(editor)
{
    //各种损坏修正放到这里
    if (editor.blkdata) {
        if(editor.blkdata.timeline)
        {
            if(editor.blkdata.timeline.states)
            {
                //修复state的length
                for(let i = 0; i < editor.blkdata.timeline.states.length; ++i)
                {
                    let curState = editor.blkdata.timeline.states[i];
                    
                    if(curState.layers)
                    {
                        let maxlen = 0;
                        for(let m = 0; m < curState.layers.length; ++m)
                        {
                            for(let n = 0; n < curState.layers[m].blocks.length; ++n)
                            {
                                if(curState.layers[m].blocks[n].end > maxlen)
                                {
                                    maxlen = curState.layers[m].blocks[n].end;
                                }
                            }
                        }
                        curState.length = maxlen;
                    }
                }
            }
        }
        Msg("修正完成: " + editor.blkdata.path);
    } else
        Nt("没有打开任何文件");
}

KFDEditTool.Search =  function(editor)
{
    self = this;
    if(editor && editor.blkdata)
        {
            $('#searchwindow').window({
                right: 0,
                top: 10
            });
        
            $('#searchwindow').window('open');

            $('#searchcontent').textbox({
                prompt:'Search',
                value:'',
                onChange: function (newValue,oldValue) {
                    _global.searchvalue = newValue;
                    _global.hitdata = [];
                    $('#blkattrib').treegrid({  
                        rowStyler:function(index,row){  
                            if(_global.searchvalue != "" && index && index.value)
                            {
                                let valuestr = index.value + "";
                                if(valuestr.indexOf(_global.searchvalue) != -1)
                                {
                                    _global.hitdata.push(index);
                                    return 'background-color:black;color:red;font-weight:bold;'; 
                                }
                            }
                        }  
                    });
                    let meta = editor.blkdata.blk;
                    let metaclass = meta.type.toString();
                    editor.blkattrib.Edit(meta, editor.blkattrib.CreateMetaEditDef(metaclass));

                    $('#searchwindow').window('close');
                    for(const uidata of _global.hitdata)
                    {
                        self.IterExpand(uidata);
                    }
                }
            })
        }

        this.IterExpand = function (uidata) {
            if(uidata._parent != null)
            {
                $('#blkattrib').treegrid("expand", uidata._parentId);
                this.IterExpand(uidata._parent)
            }
        }
}

KFDEditTool.GetUIDataByFieldPath = function (fieldPath, uidatas) {
    if (!fieldPath || !uidatas) return null;
    let parts = fieldPath.split(KFDEditor.VarNameMemberOpToken);
    let ret = null;
    for (let part of parts) {
        if (!uidatas) {
            ret = null;
            break;
        }
        let indexBegin = part.indexOf(KFDEditor.VarNameIndexBeginToken);
        let indexEnd = part.indexOf(KFDEditor.VarNameIndexEndToken);
        if (indexBegin === -1 && indexEnd === -1) {
            for (let uidata of uidatas) {
                if (uidata._prop && uidata._prop.name === part) {
                    ret = uidata;
                    uidatas = uidata.children;
                    break;
                }
            }
        } else if (indexBegin !== -1 && indexBegin < indexEnd) {
            let arrayName = part.slice(0, indexBegin);
            let index = parseInt(part.slice(indexBegin + 1, indexEnd));
            for (let uidata of uidatas) {
                if (uidata._prop && uidata._prop.name === arrayName) {
                    if (uidata.children && index < uidata.children.length) {
                        ret = uidata.children[index];
                        uidatas =  ret.children;
                        break;
                    }
                }
            }
        }
    }
    return ret;
}

KFDEditTool.GetUIDataPath = function (uidata, OnIterData) {
    let curData = uidata;
    let path = "";
    while(curData)
    {
        let name = "";
        if (curData.hasOwnProperty('_arrayindex')) {
            name = KFDEditor.VarNameIndexBeginToken
                + curData._arrayindex
                + KFDEditor.VarNameIndexEndToken;
        } else if (curData._prop) {
            name = curData._prop.name;
        }
        if (!name) return null;
        let sep = KFDEditor.VarNameMemberOpToken;
        if (curData._prop) {
            let typeid = KFDataType.GetTypeID(curData._prop.type);
            if (typeid === KFDataType.OT_ARRAY || typeid === KFDataType.OT_MIXARRAY) {
                sep = '';
            }
        }
        path = path ? name + sep + path : name;
        if (OnIterData && OnIterData(curData)) {
            break;
        }
        curData = curData._parent;
    }
    return path;
}

//////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////KFTimeTool//////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////
function KFTimeTool()
{
    this.Init();
}

KFTimeTool.prototype.Init = function()
{
    this.nowTime = 0;
}

KFTimeTool.prototype.Start = function()
{
    var dateInst = new Date();
    this.nowTime = dateInst.getTime();
}

KFTimeTool.prototype.Stop = function(info)
{
    var dateInst = new Date();
    let costTime = dateInst.getTime() - this.nowTime;
    
    if(info == null) info = "";

    console.log(info + " time cost : " + costTime);
}

KFTimeTool.prototype.Record = function(info)
{
    var dateInst = new Date();
    let costTime = dateInst.getTime() - this.nowTime;
    this.nowTime = dateInst.getTime();

    if(info == null) info = "";
    
    console.log(info + " time cost : " + costTime);
}


//////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////KFEditorAction//////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////
function KFEditorAction(editor)
{
    this.Init();
    this.UndoCapacity = 10;
    this.RedoCapacity = 10;
    this.editor = editor;
}

KFEditorAction.prototype.Init = function()
{
    this.UndoActions = []
    this.RedoActions = []
}

KFEditorAction.prototype.AddAction = function() 
{
    if(this.UndoActions.length >= this.UndoCapacity)
        this.UndoActions.shift()
    if(this.editor && this.editor.context && this.editor.context.currentdata)
    {
        let contextdata = $.extend(true,{},this.editor.context.currentdata);
        this.UndoActions.push(contextdata);
    }
}

KFEditorAction.prototype.UndoAction = function()
{
    if(this.UndoActions.length == 0) return;
    let curAction = this.UndoActions.pop()
    if(this.RedoActions.length >= this.RedoCapacity)
        this.RedoActions.shift()
    if(this.editor && this.editor.context && this.editor.context.currentdata)
    {
        let contextdata = $.extend(true,{},this.editor.context.currentdata);
        this.RedoActions.push(contextdata);
    }
    if(this.editor && this.editor.context)
    {
        this.editor.context.SetCurrentData(curAction);
        _global.Event.emit("onDataRestore", curAction);
    }
}

KFEditorAction.prototype.RedoAction = function()
{
    if(this.RedoActions.length == 0) return;
    let curAction = this.RedoActions.pop()
    if(this.UndoActions.length >= this.UndoCapacity)
        this.UndoActions.shift()
    if(this.editor && this.editor.context && this.editor.context.currentdata)
    {
        let contextdata = $.extend(true,{},this.editor.context.currentdata);
        this.UndoActions.push(contextdata);
    }
    if(this.editor && this.editor.context)
    {
        this.editor.context.SetCurrentData(curAction);
        _global.Event.emit("onDataRestore", curAction);
    }
}