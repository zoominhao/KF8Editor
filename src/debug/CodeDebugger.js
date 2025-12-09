const ref = nodeRequire('ref-napi');
const ffi = nodeRequire('ffi-napi');
const RefStruct = nodeRequire('ref-struct-di')(ref);
const RefArray = nodeRequire('ref-array-di')(ref);

const cuint64ptr = ref.refType(ref.types.uint64);
const cdwarfhandle = ref.refType(ref.types.void);

const CMembersTypeVoidPtr = ref.refType(ref.types.void);
const CVariableTypeVoidPtr = ref.refType(ref.types.void);
const CVariableItemVoidPtr = ref.refType(ref.types.void);

const CMembersType = RefStruct({
    count: ref.types.uint8,
    members: RefArray(CVariableItemVoidPtr, 256)
});
const CVariableType = RefStruct({
    orig_name: RefArray(ref.types.char, 128),
    name: RefArray(ref.types.char, 128),
    is_base: ref.types.bool,
    is_array: ref.types.bool,
    is_struct: ref.types.bool,
    is_pointer: ref.types.bool,
    size: ref.types.uint32,
    type: CVariableTypeVoidPtr,
    members: CMembersTypeVoidPtr
});
const CVariableItem = RefStruct({
    name: RefArray(ref.types.char, 128),
    type: CVariableType,
    offset_addr: ref.types.uint64
});
const CVariablesInfo = RefStruct({
    location_type: ref.types.uint32,
    location_i: ref.types.uint32,
    count: ref.types.int,
    variables: RefArray(CVariableItem, 128)
});

function CodeDebugger(context, parent) {
    let self = this;
    this.context = context;
    this.parentDebugger = parent;
    this.currMonacoFrom = null;
    this.initDLLFunctionsLink();
    this.initIPCEvent();
    // _global.Event.on("CompileEndForCodeDebugger", function (arg) {
    //     if (!arg || !arg.asseturl) return;
    //     self.PrepareDebugFiles(arg.asseturl, function () {
    //         self.OnDebugReady(arg.asseturl);
    //     });
    // });
}

CodeDebugger.prototype.initIPCEvent = function () {
    let self = this;
    _global.Event.on("onmonacodebug", function (info) {
        if (!info || !info.event) return;
        switch (info.event) {
            case 'monacobreakpoint':
            {
                self.OnMonacoBreakPoint(info.data);
                break;
            }
            case 'monacosettext':
            {
                self.OnMonacoSetText(info.data);
                break;
            }
            case 'monacowinclosed':
            {
                self.OnMonacoWinClosed();
                break;
            }
            case 'monacocompileend':
            {
                let arg = info.data;
                if (!arg || !arg.asseturl) return;
                self.PrepareDebugFiles(arg.asseturl, function () {
                    self.OnDebugReady(arg.asseturl);
                });
                break;
            }
            default: break;
        }
    });
}

CodeDebugger.prototype.OnMonacoBreakPoint = function (data) {
    if (!data || !data.from) return;
    let from = data.from;
    let bp = { __cls__: "KF8VMCodeBreakPoint" };
    let bpkfd = this.context.kfdtable.get_kfddata(bp.__cls__);
    KFDJson.init_object(bp, bpkfd);
    bp.Line = data.line;
    let kv = BreakDebuggerTool.MonacoFromToBreakPoint(from, this.context);
    if (!kv) return;
    bp.ScriptBreakPoint = kv;
    _global.EmitToMainGlobal("OnSetBreakPoints", [bp]);
}

CodeDebugger.prototype.OnMonacoSetText = function (data) {
    if (!data || !data.from) return;
    this.currMonacoFrom = data.from;
    if(!fileExists(CodeDebugger.GetDWARFFilePath(data.from.asseturl)) ||
        !fileExists(CodeDebugger.GetLineInfoPath(data.from.asseturl))) {
        KF8Coder.SearchCodeAndProcess(data.from.asseturl, this.context);
    } else {
        let self = this;
        this.PrepareDebugFiles(data.from.asseturl, function () {
            self.OnDebugReady(data.from.asseturl);
        });
    }
}

CodeDebugger.prototype.PrepareDebugFiles = function (assetURL, func) {
    let self = this;
    this.ReleaseDWARFHandle(assetURL);
    IKFFileIO_Type.instance.asyncLoadFile(CodeDebugger.GetLineInfoPath(assetURL), function (ret, data, path) {
        if (ret) {
            let strData = data.toString();
            let savedObj = JSON.parse(strData);
            if (savedObj) {
                if (savedObj.CodeLineInfos) {
                    self.currCodeLineInfos = savedObj.CodeLineInfos;
                    for (let lineInfo of self.currCodeLineInfos) {
                        lineInfo.asseturl = assetURL;
                    }
                    func();
                    return;
                }
            }
        }
        Nt("无法读取代码行信息文件！");
    }, "text");
}

CodeDebugger.prototype.OnDebugReady = function (assetURL) {
    let bps = this.ReCalcBreakPoints();
    this.NotifyBreakPoints(this.parentDebugger.localBreakPoints);
    this.OnVMCodeBreakPointHit(this.parentDebugger.hitBreakPoint);
    this.parentDebugger.RefreshBreakPoints();
    this.parentDebugger.SendBreakPoints();
    if (bps.length > 0) {
        for (let bp of bps) {
            this.parentDebugger.UpdateLocalBreakPoint(bp);
        }
        this.parentDebugger.SendBreakPoints();
    }
}

CodeDebugger.prototype.OnMonacoWinClosed = function () {
    this.currMonacoFrom = null;
    this.parentDebugger.RefreshBreakPoints();
    this.parentDebugger.SendBreakPoints();
}

CodeDebugger.prototype.MonacoID  = function () {
    if (this.currMonacoFrom) return this.currMonacoFrom.id;
    return 1;
}

CodeDebugger.prototype.initDLLFunctionsLink = function () {
    let dllPath = GetAppPath() + '/tool/Debugger/libdwarf-wasm.dll';
    //console.log(dllPath);
    this.dwarfWasm = new ffi.Library(dllPath, {
        'load_dwarf_file':[cdwarfhandle, ['string']],
        'release_dwarf':[ref.types.void, [cdwarfhandle]],
        'calc_code_offsets':['int32', [cdwarfhandle, 'uint32', cuint64ptr, cuint64ptr]],
        'get_variables_by_pc':['int32', [cdwarfhandle, ref.types.uint64, ref.refType(CVariablesInfo)]],
        'get_variable_type_from_void_ptr':['int32', [CVariableTypeVoidPtr, ref.refType(CVariableType)]],
        'get_variable_item_from_void_ptr':['int32', [CVariableItemVoidPtr, ref.refType(CVariableItem)]],
        'get_members_type_from_void_ptr':['int32', [CMembersTypeVoidPtr, ref.refType(CMembersType)]],
        'calc_code_line': ['int32', [cdwarfhandle, ref.types.uint64, 'string', ref.refType(ref.types.uint32)]],
    });
}

CodeDebugger.prototype.Dispose = function () {
    if (this.dwarfWasm) {
        if (this.dwarfHandles) {
            for (let handle of this.dwarfHandles.values()) {
                this.dwarfWasm.release_dwarf(handle);
            }
            this.dwarfHandles = null;
        }
    }
    this.dwarfWasm = null;
}

CodeDebugger.GetDWARFFilePath = function (assetURL) {
    let path = _global.kfdpath.replace("KFD","Tmp/Dbg/");
    return path + assetURL.replace(/\//g, "_").replace(".blk","@.dbg");
}

CodeDebugger.GetLineInfoPath = function (assetURL) {
    let path = _global.kfdpath.replace("KFD","Tmp/Dbg/");
    return path + assetURL.replace(/\//g, "_").replace(".blk","@.lineinfo");
}

CodeDebugger.GetCodeCppPath = function (assetURL) {
    let path = _global.kfdpath.replace("KFD","Tmp/Code/");
    return path + assetURL.replace(/\//g, "_").replace(".blk","@.cpp");
}

CodeDebugger.prototype.GetDWARFHandle = function (assetURL) {
    if (!this.dwarfWasm) return null;

    if (!this.dwarfHandles) {
        this.dwarfHandles = new Map();
    }
    if (this.dwarfHandles.has(assetURL)) {
        return this.dwarfHandles.get(assetURL);
    }

    let file = CodeDebugger.GetDWARFFilePath(assetURL);
    let handle = this.dwarfWasm.load_dwarf_file(file);
    if (!handle || handle.isNull()) return null;
    this.dwarfHandles.set(assetURL, handle);
    return handle;
}

CodeDebugger.prototype.ReleaseDWARFHandle = function (assetURL) {
    if (this.dwarfWasm && this.dwarfHandles) {
        if (this.dwarfHandles.has(assetURL)) {
            let dwarfhanle = this.dwarfHandles.get(assetURL);
            this.dwarfWasm.release_dwarf(dwarfhanle);
            return this.dwarfHandles.delete(assetURL);
        }
    }
    return false;
}

CodeDebugger.prototype.CalcCodeStartEnd = function (assetURL, line) {
    let dwarfHandle = this.GetDWARFHandle(assetURL);
    if (!dwarfHandle) return null;
    const codeStartRef = ref.alloc(ref.types.uint64);
    const codeEndRef = ref.alloc(ref.types.uint64);
    const ret = this.dwarfWasm.calc_code_offsets(dwarfHandle, line, codeStartRef, codeEndRef);
    if (ret === 0) {
        //console.log(codeStartRef.deref(), codeEndRef.deref());
        return {CodeStart:codeStartRef.deref(), CodeEnd:codeEndRef.deref()};
    }
    return null;
}

CodeDebugger.maxPathLen = 256;

CodeDebugger.prototype.CalcCodeLineFromCodeStart = function (assetURL, codeStart) {
    let dwarfHandle = this.GetDWARFHandle(assetURL);
    if (!dwarfHandle) return null;
    var fileNameBuffer = new Buffer(CodeDebugger.maxPathLen);
    const line = ref.alloc(ref.types.uint32);
    const ret = this.dwarfWasm.calc_code_line(dwarfHandle, codeStart, fileNameBuffer, line);
    if (ret === 0) {
        //console.log("GetLineFromCodeStart", line.deref());
        return {filename: ref.readCString(fileNameBuffer, 0), line: line.deref()};
    }
    return null;
}

CodeDebugger.prototype.GetVariables = function (assetURL, pc) {
    let dwarfHandle = this.GetDWARFHandle(assetURL);
    if (!dwarfHandle) return null;
    const variablesRef = ref.alloc(CVariablesInfo);
    let ret = this.dwarfWasm.get_variables_by_pc(dwarfHandle, pc, variablesRef);
    if (ret === 0) {
        let info = variablesRef.deref();
        //console.log(info.location_type, info.location_i);
        // for (let i = 0; i < info.count; ++i) {
        //     let variable = info.variables[i];
        //     let strName = new Buffer(variable.name);
        //     console.log(i, ref.readCString(strName), variable.offset_addr);
        // }
        return this.TransCVariablesInfo(info);
    }
    return null;
}

function VariablesInfo() {
}

function VariableItem() {
}
VariableItem.prototype.GetSize = function () {
    if (this.type) return this.type.GetSize();
    return 0;
}

function VariableType() {
}
VariableType.prototype.GetSize = function () {
    if (this.is_base || this.is_struct || this.is_pointer) return this.size;
    if (this.is_array && this.type) return this.size * this.type.GetSize();
    return 0;
}

function MembersType() {
}

CodeDebugger.prototype.TransCVariablesInfo = function (cInfo) {
    if (!cInfo) return null;
    let info = new VariablesInfo();
    info.location_type = cInfo.location_type;
    info.location_i = cInfo.location_i;
    info.variables = [];
    for (let i = 0; i < cInfo.count; ++i) {
        info.variables.push(this.TransCVariableItem(cInfo.variables[i]));
    }
    return info;
}

CodeDebugger.prototype.TransCVariableType = function (cType) {
    if (!cType) return null;
    let varType = new VariableType();
    if (cType.orig_name) {
        varType.orig_name = ref.readCString(new Buffer(cType.orig_name));
    }
    if (cType.name) {
        varType.name = ref.readCString(new Buffer(cType.name));
    }
    varType.is_base = cType.is_base;
    varType.is_array = cType.is_array;
    varType.is_struct = cType.is_struct;
    varType.is_pointer = cType.is_pointer;
    varType.size = cType.size;
    if (cType.type && !cType.type.isNull()) {
        varType.type = this.TransCVariableType(this.GetVariableTypeFromVoidPtr(cType.type));
    }
    if (cType.members && !cType.members.isNull()) {
        varType.members = this.TransCMembersType(this.GetMembersTypeFromVoidPtr(cType.members));
    }
    return varType;
}

CodeDebugger.prototype.TransCMembersType = function (cType) {
    if (!cType) return null;
    let membersType = new MembersType();
    membersType.count = cType.count;
    membersType.members = [];
    for (let i = 0; i < cType.count; ++i) {
        let ptr = cType.members[i];
        if (ptr && !ptr.isNull()) {
            let member = this.TransCVariableItem(this.GetVariableItemFromVoidPtr(ptr));
            if (member) membersType.members.push(member);
        }
    }
    return membersType;
}

CodeDebugger.prototype.TransCVariableItem = function (cItem) {
    if (!cItem) return null;
    let varItem = new VariableItem();
    if (cItem.name) {
        varItem.name = ref.readCString(new Buffer(cItem.name));
    }
    varItem.type = this.TransCVariableType(cItem.type);
    varItem.offset_addr = cItem.offset_addr;
    return varItem;
}

CodeDebugger.prototype.GetVariableTypeFromVoidPtr = function (ptr) {
    const varType = ref.alloc(CVariableType);
    let ret = this.dwarfWasm.get_variable_type_from_void_ptr(ptr, varType);
    if (ret === 0) return varType.deref();
    return null;
}

CodeDebugger.prototype.GetVariableItemFromVoidPtr = function (ptr) {
    const varItem = ref.alloc(CVariableItem);
    let ret = this.dwarfWasm.get_variable_item_from_void_ptr(ptr, varItem);
    if (ret === 0) return varItem.deref();
    return null;
}

CodeDebugger.prototype.GetMembersTypeFromVoidPtr = function (ptr) {
    const membersType = ref.alloc(CMembersType);
    let ret = this.dwarfWasm.get_members_type_from_void_ptr(ptr, membersType);
    if (ret === 0) return membersType.deref();
    return null;
}

CodeDebugger.prototype.GetVMMemReqFromVariableInfo = function (info) {
    let msg = BreakDebuggerTool.MakeKFDObject("KF8DebugVMMemReq", this.context);
    msg.LocationType = info.location_type;
    msg.LocationI = info.location_i;
    msg.Items = [];
    for (let variable of info.variables) {
        let item = BreakDebuggerTool.MakeKFDObject("DebugVMMemReqItem", this.context);
        item.ID = variable.name;
        item.Offset = variable.offset_addr;
        item.Size = variable.GetSize();
        msg.Items.push(item);
    }
    return msg;
}

CodeDebugger.prototype.GetVariableValue = function (type, data) {
    if (!type || !data || !data.bytes) return null;
    let buffer = new Buffer(data.bytes.data.buffer);
    let value = {};
    if (type.is_base) {
        value.type_name = type.name;
        switch (type.name) {
            case 'long long unsigned int':
            {
                value.value = buffer.readBigUInt64LE().toString();
                break;
            }
            case 'long long int':
            {
                value.value = buffer.readBigInt64LE().toString();
                break;
            }
            case 'long int':
            case 'int':
            {
                value.value = buffer.readInt32LE().toString();
                break;
            }
            case 'unsigned int':
            case 'long unsigned int':
            {
                value.value = buffer.readUInt32LE().toString();
                break;
            }
            case 'char':
            {
                value.value = BreakDebuggerTool.ToCharFormat(String.fromCharCode(buffer.readInt8()));
                value.value += " " + BreakDebuggerTool.ToBytesFormat(buffer);
                break;
            }
            default:
            {
                value.value = type.name;
                break;
            }
        }
    } else if (type.is_array) {
        if (!type.type) return null;
        if (type.type.is_base) {
           value.type_name = type.type.name + "[" + type.size.toString() + "]";
           switch (type.type.name) {
               case 'char':
               {
                   value.value = BreakDebuggerTool.ToStringFormat(new TextDecoder().decode(buffer));
                   value.value += " " + BreakDebuggerTool.ToBytesFormat(buffer);
                   break;
               }
               default:
               {
                   value.value = type.type.name + " array";
                   break;
               }
           }
        }
    }
    return value;
}

CodeDebugger.prototype.GetVariablesShowContent = function (info, req, rsp) {
    if (!req || !rsp) return null;
    let content = {};
    for (let variable of info.variables) {
        for (let item of rsp.Items) {
            if (variable.name === item.ID) {
                content[item.ID] = this.GetVariableValue(variable.type, item.Data);
            }
        }
    }
    return content;
}

CodeDebugger.prototype.IsCurrMonacoFromMatched = function (bp) {
    if (!this.currMonacoFrom || !bp) return false;
    let frombp = BreakDebuggerTool.MonacoFromToBreakPoint(this.currMonacoFrom, this.context);
    if (!frombp) return false;
    return BreakDebuggerTool.IsBreakPointEqual(frombp, bp);
}

CodeDebugger.prototype.CalcBreakPointLine = function (bp) {
    if (bp && !bp.Line && bp.CodeStart > 0) {
        let lineInfo = this.CalcCodeLineFromCodeStart(bp.ScriptBreakPoint.AssetURL, bp.CodeStart);
        if (lineInfo) {
            bp.FileName = lineInfo.filename;
            bp.Line = lineInfo.line - this.GetLineOffSet();
        }
    }
}

CodeDebugger.prototype.CheckByStepContinue = function (lastHitBP, hitBP) {
    if (this.IsVMCodeBreakPoint(lastHitBP) &&
        this.IsVMCodeBreakPoint(hitBP) &&
        this.IsCurrMonacoFromMatched(lastHitBP.ScriptBreakPoint) &&
        this.IsCurrMonacoFromMatched(hitBP.ScriptBreakPoint)) {
        this.CalcBreakPointLine(lastHitBP);
        this.CalcBreakPointLine(hitBP);
        if (!hitBP.FileName || hitBP.FileName !== CodeDebugger.GetCodeCppPath(hitBP.ScriptBreakPoint.AssetURL)) return true;
        if (lastHitBP.Line && hitBP.Line && lastHitBP.Line === hitBP.Line) return true;
    }
    return false;
}

CodeDebugger.prototype.OnVMCodeBreakPointHit = function (bp) {
    let self = this;

    //console.log(bp);

    let line = 0;
    let isMatched = false;

    if (this.IsVMCodeBreakPoint(bp)) {
        if (this.IsCurrMonacoFromMatched(bp.ScriptBreakPoint)) {
            if (!bp.Line && bp.CodeStart > 0) {
               let lineInfo = this.CalcCodeLineFromCodeStart(bp.ScriptBreakPoint.AssetURL, bp.CodeStart) - this.GetLineOffSet();
               if (lineInfo) {
                   bp.FileName = lineInfo.filename;
                   bp.Line = lineInfo.line;
               }
            }
            isMatched = true;
            line = bp.Line;
        }
    }
    ipcRenderer.send("monacodebugger", this.MonacoID(), "breakpointhit", {line: line});

    if (isMatched && bp.CodeStart > 0) {
        let info = this.GetVariables(bp.ScriptBreakPoint.AssetURL, bp.CodeStart);
        //console.log(info);
        if (info) {
            let msg = this.GetVMMemReqFromVariableInfo(info);
            this.parentDebugger.GetMsg("VMMem", function (rsp) {
                //console.log(rsp);
                let content = self.GetVariablesShowContent(info, msg, rsp);
                ipcRenderer.send("monacodebugger", self.MonacoID(), "variables", content);
            }, msg);
        }
    }
}

CodeDebugger.prototype.NotifyBreakPoints = function (bps) {
    if (!bps) return;

    if (!this.currMonacoFrom) {
        ipcRenderer.send("monacodebugger", this.MonacoID(), "breakpoints", {lines:[], has_from: false});
        return;
    }
    let hasFrom = !!this.currMonacoFrom;
    let lines = [];
    if (hasFrom) {
        for (let bp of bps) {
            if (bp.__cls__ === "KF8VMCodeBreakPoint" && this.IsCurrMonacoFromMatched(bp.ScriptBreakPoint)) {
                lines.push({line:bp.Line, enable: (!bp.hasOwnProperty('Enabled') || bp.Enabled)});
            }
        }
    }
    ipcRenderer.send("monacodebugger", this.MonacoID(), "breakpoints", {lines:lines, has_from:hasFrom});
}

CodeDebugger.prototype.IsVMCodeBreakPoint = function (bp) {
    return !!(bp && bp.__cls__ === "KF8VMCodeBreakPoint");
}

CodeDebugger.DefaultLineOffset = -10000000;

CodeDebugger.prototype.GetLineInfo = function () {
    if (this.currMonacoFrom && this.currCodeLineInfos) {
        for (let lineInfo of this.currCodeLineInfos) {
            if (CommTool.IsObjectEqualFirstBased(this.currMonacoFrom, lineInfo)) {
                return lineInfo;
            }
        }
    }
    return null;
}

CodeDebugger.prototype.GetLineOffSet = function () {
    let lineInfo = this.GetLineInfo();
    if (lineInfo) {
        return lineInfo.lineOffset;
    }
    return CodeDebugger.DefaultLineOffset;
}

CodeDebugger.prototype.GetLineCount = function () {
    let lineInfo = this.GetLineInfo();
    if (lineInfo) {
        return lineInfo.lineCount;
    }
    return 0;
}

CodeDebugger.prototype.ReCalcBreakPointCodeStartEnd = function(bp) {
    if (bp && bp.ScriptBreakPoint && bp.ScriptBreakPoint.AssetURL) {
        let codeStartEnd = this.CalcCodeStartEnd(bp.ScriptBreakPoint.AssetURL, bp.Line + this.GetLineOffSet());
        if (codeStartEnd) {
            bp.CodeStart = codeStartEnd.CodeStart;
            bp.CodeEnd = codeStartEnd.CodeEnd;
            return !(bp.CodeStart === 0 && bp.CodeEnd === 0);
        }
    }
    return false;
}

CodeDebugger.prototype.PreProcVMCodeBreakPoint = function (bp) {
    return this.ReCalcBreakPointCodeStartEnd(bp);
}

CodeDebugger.prototype.ReCalcBreakPoints = function () {
    let bps = [];
    for (let bp of this.parentDebugger.localBreakPoints) {
        if (this.IsVMCodeBreakPoint(bp) && this.IsCurrMonacoFromMatched(bp.ScriptBreakPoint)) {
            if (!this.ReCalcBreakPointCodeStartEnd(bp)) {
                bps.push(bp);
            }
        }
    }
    return bps;
}
