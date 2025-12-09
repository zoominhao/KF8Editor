// TODO 考虑ccls语言服务器方案?
function CodeCompletion(completion) {
    this._tipItems = {}
    if (completion) {
        this._tipItems = JSON.parse(completion);
    }
}

CodeCompletion.prototype.CompletionItems = function (model, position) {
    let textUntilPosition = model.getValueInRange({
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column
    });
    let suggestions = [];
    let word = model.getWordUntilPosition(position);
    let range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn
    };

    if(textUntilPosition.charAt(textUntilPosition.length-1) === '_')
    {
        suggestions = this._underscoreTips();
    }
    if(textUntilPosition.charAt(textUntilPosition.length-1) === 'v')
    {
        suggestions = this._vclassTips();
    }
    else if(textUntilPosition.charAt(textUntilPosition.length-1) === '.')
    {
        let preWord = model.getWordUntilPosition({column: position.column-1, lineNumber: position.lineNumber});
        if (preWord && preWord.word)
        {
            let allCode = 'vGCObject _context(__ci);\nvGCObject _this(__ti);\n' + textUntilPosition;
            let tokenType = this._getTokenType(preWord.word, allCode);
            suggestions = this._getTypeSuggestions(tokenType);
        }
    }
    else if(textUntilPosition.substr(textUntilPosition.length-2) === '::')
    {
        let preWord = model.getWordUntilPosition({column: position.column-2, lineNumber: position.lineNumber});
        if (preWord && preWord.word)
        {
            // 直接就是类型
            suggestions = this._getTypeSuggestions(preWord.word);
        }
    }

    return {suggestions: suggestions};
}

CodeCompletion.prototype._getTypeSuggestions = function (type, isBaseClass = false) {
    let suggestions = [];
    if (type) {
        let item = this._tipItems[type];
        if (item) {
            item = $.extend(true, {}, item);
            if (item.completionItems) {
                suggestions.push(...item.completionItems);
            }
            if (item.baseClass) {
                suggestions.push(...this._getTypeSuggestions(item.baseClass, true));
            }
            if (!isBaseClass) {
                suggestions.push(...this._vclassCommTips());
            }
        } else if (type === "vGCObject") {
            suggestions.push(...this._rawobjectTips());
            suggestions.push(...this._gcobjectTips());
        } else if (type === "vAutoObject") {
            suggestions.push(...this._rawobjectTips());
            suggestions.push(...this._autoobjectTips());
        } else if (type === "vRawObject") {
            suggestions.push(...this._rawobjectTips());
        } else if (type === "vkfstr") {
            suggestions.push(...this._vkfstrTips());
        } else if (type === "vkfname") {
            suggestions.push(...this._vkfnameTips());
        }
    }
    for (let item of suggestions) {
        item.documentation = item.label;
        if (!item.hasOwnProperty('kind')) {
            item.kind = monaco.languages.CompletionItemKind.Method;
        }
    }
    return suggestions;
}

CodeCompletion._getPureType = function (type) {
    return type.replaceAll('const', '')
        .replaceAll('static', '')
        .replaceAll('&', '')
        .replaceAll('*', '')
        .trim();
}

CodeCompletion.prototype._getTokenType= function (token, codeText) {
    // 原始手段，只能尽力了
    let regex = new RegExp("(\\w+)\\s+\\b" + token + "\\b");
    let lines = codeText.split('\n');
    let matchedLine = "";
    let matchedResult = null;
    for (let i = 0; i < lines.length; ++i) {
        let line = lines[i].trim();
        matchedResult = line.match(regex);
        if (matchedResult) {
            matchedLine = line;
            break;
        }
    }
    if (!matchedLine) return "";
    if (matchedResult && matchedResult.length > 1) {
        let type = matchedResult[1];
        type = CodeCompletion._getPureType(type);
        if (type !== "auto") {
            return type;
        }
        let equalIndex = matchedLine.indexOf('=');
        if (equalIndex !== -1) {
            let callStr = matchedLine.substring(equalIndex + 1);
            let callIndex = callStr.indexOf('(');
            if (callIndex === -1) {
                // 变量初始化变量
                let initVarStr = callStr.replaceAll(';', '').trim();
                return this._getTokenType(initVarStr, codeText);
            }
            // 先默认只有一层调用
            if (callIndex > 0) {
                let funcStr = callStr.substring(0, callIndex).trim();
                let preFuncIndex = funcStr.indexOf('.');
                let preFuncIndex2 = funcStr.indexOf('::');
                if (preFuncIndex === 0 && preFuncIndex2 === 0) return "";
                else if (preFuncIndex === -1 && preFuncIndex2 === -1) {
                    // 直接认为是构造函数，直接返回类型
                    return funcStr;
                }
                let preType = "";
                let funcName = "";
                if (preFuncIndex > 0) {
                    // .的情况，非静态成员函数调用
                    let preFunc = funcStr.substring(0, preFuncIndex);
                    funcName = funcStr.substring(preFuncIndex + 1);
                    if (!funcName) return "";
                    let asIndex = funcName.indexOf("As<");
                    if (asIndex !== -1) {
                        let templateEndIndex = funcName.indexOf('>');
                        if (templateEndIndex === -1) return "";
                        return funcName.substring(asIndex + 3, templateEndIndex);
                    }
                    preType = this._getTokenType(CodeCompletion._getPureType(preFunc), codeText);
                } else {
                    // ::的情况，静态成员函数调用
                    preType = funcStr.substring(0, preFuncIndex2);
                    funcName = funcStr.substring(preFuncIndex2 + 2);
                    if (!funcName) return "";
                }
                if (!preType) return "";
                let item = this._tipItems[preType];
                if (!item) return "";
                for (let ci of item.completionItems) {
                    let lablefuncNameIndex = ci.label.indexOf(funcName + '(');
                    if (lablefuncNameIndex <= 0) continue;
                    return CodeCompletion._getPureType(ci.label.substring(0, lablefuncNameIndex - 1));
                }
            }
        }
    }
    return ""
}

CodeCompletion.prototype._underscoreTips = function () {
    let completion = [
        {
            label: 'int32 _N(const char*)', //显示的提示名称
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: '_N("text")' //选择后粘贴到编辑器中的文字
        },
        {
            label: 'const char* _NS(int32)', //显示的提示名称
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: '_NS(0)' //选择后粘贴到编辑器中的文字
        },
        {
            label: 'ObjectPtr _TI(const char*, int32)', //显示的提示名称
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: '_TI("text",0)' //选择后粘贴到编辑器中的文字
        },
        {
            label: 'const char* _TS(ObjectPtr, int32)', //显示的提示名称
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: '_TS(0,0)' //选择后粘贴到编辑器中的文字
        },
        {
            label: 'ObjectPtr _NewStr(ObjectPtr ptr, int32 flag)', //显示的提示名称
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: '_NewStr(ObjectPtr ptr, int32 flag)' //选择后粘贴到编辑器中的文字
        },
        {
            label: 'void _DeleteStr(ObjectPtr str)', //显示的提示名称
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: '_DeleteStr(ObjectPtr str)' //选择后粘贴到编辑器中的文字
        },
        {
            label: 'int _GetStr(ObjectPtr str)', //显示的提示名称
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: '_GetStr(ObjectPtr str)' //选择后粘贴到编辑器中的文字
        },
        {
            label: 'void _SetStr(ObjectPtr str, const void* cstr)', //显示的提示名称
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: '_SetStr(ObjectPtr str, const void* cstr)' //选择后粘贴到编辑器中的文字
        },
        {
            label: 'int32 _R(ObjectPtr, int32) //Retain 1 Release -1 REFCOUNT 0', //显示的提示名称
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: '_R(0,0)' //选择后粘贴到编辑器中的文字
        },
        {
            label: 'int32 _AnyCall(int64 clsfunc, ObjectPtr target, void* paramPtr, int32 paramSize , int32 paramflags)', //显示的提示名称
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: '_AnyCall(0,0,null,0,0)' //选择后粘贴到编辑器中的文字
        },
        {
            label: 'void _AnyCallT(int64 clsfunc, ObjectPtr target, Args&&... args)', //显示的提示名称
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: '_AnyCallT(int64 clsfunc, ObjectPtr target, Args&&... args)' //选择后粘贴到编辑器中的文字
        },
        {
            label: 'void _AnyCallT(int32 clsid, const char* funcname, ObjectPtr target, Args&&... args)', //显示的提示名称
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: '_AnyCall(int32 clsid, const char* funcname, ObjectPtr target, Args&&... args)' //选择后粘贴到编辑器中的文字
        },
        {
            label: 'void _AnyCallT(const char* clsname, const char* funcname, ObjectPtr target, Args&&... args)', //显示的提示名称
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: '_AnyCallT(const char* clsname, const char* funcname, ObjectPtr target, Args&&... args)' //选择后粘贴到编辑器中的文字
        },
        {
            label: 'int64 _VMMethod(const char* clsname, const char* funcname)', //显示的提示名称
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: '_VMMethod("clsname","funcname")' //选择后粘贴到编辑器中的文字
        },
        {
            label: 'void _CopyTo(ObjectPtr, ObjectPtr)', //显示的提示名称
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: '_CopyTo(0, 0)' //选择后粘贴到编辑器中的文字
        },
        {
            label: 'ObjectPtr _New(const char* cls, ObjectPtr copyTarget = 0)', //显示的提示名称
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: '_New("")' //选择后粘贴到编辑器中的文字
        },
        {
            label: 'ObjectPtr _New(int32 clsid, ObjectPtr copyTarget = 0)', //显示的提示名称
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: '_New(0)' //选择后粘贴到编辑器中的文字
        },
        {
            label: 'void _Delete(ObjectPtr target, const char* cls)', //显示的提示名称
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: '_Delete(0, "")' //选择后粘贴到编辑器中的文字
        },
        {
            label: 'void _Delete(ObjectPtr target, int32 clsid)', //显示的提示名称
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: '_Delete(0, 0)' //选择后粘贴到编辑器中的文字
        },
        {
            label: 'ObjectPtr _As(ObjectPtr fromobj, int32 cls)', //显示的提示名称
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: '_As(ObjectPtr fromobj, int32 cls)' //选择后粘贴到编辑器中的文字
        },
        {
            label: 'ObjectPtr _AsFromTo(ObjectPtr fromobj, int32 fromcls, int32 tocls);', //显示的提示名称
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'ObjectPtr _AsFromTo(ObjectPtr fromobj, int32 fromcls, int32 tocls);' //选择后粘贴到编辑器中的文字
        },
        {
            label: 'ObjectPtr _Meta(ObjectPtr objptr)', //显示的提示名称
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: '_Meta(ObjectPtr objptr)' //选择后粘贴到编辑器中的文字
        },
        {
            label: '_this[vGCObject]', //显示的提示名称
            kind: monaco.languages.CompletionItemKind.Variable,
            insertText: '_this' //选择后粘贴到编辑器中的文字
        },
        {
            label: '_context[vGCObject]', //显示的提示名称
            kind: monaco.languages.CompletionItemKind.Variable,
            insertText: '_context' //选择后粘贴到编辑器中的文字
        },
        {
            label: 'void _Delete(ObjectPtr target, const char* cls)', //显示的提示名称
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: '_Delete(0, "")' //选择后粘贴到编辑器中的文字
        },
    ];
    for (let item of completion) {
        item.documentation = item.label;
    }
    return completion;
}

CodeCompletion.prototype._vclassTips = function () {
    let completion = [
        {
            label: 'vGCObject', //显示的提示名称
            insertText: 'vGCObject' //选择后粘贴到编辑器中的文字
        },
        {
            label: 'vAutoObject', //显示的提示名称
            insertText: 'vAutoObject' //选择后粘贴到编辑器中的文字
        },
        {
            label: 'vRawObject', //显示的提示名称
            insertText: 'vRawObject' //选择后粘贴到编辑器中的文字
        },
        {
            label: 'vkfVector<T>', //显示的提示名称
            insertText: 'vkfVector<T>' //选择后粘贴到编辑器中的文字
        },
        {
            label: 'vkfMap<K, V>', //显示的提示名称
            insertText: 'vkfMap<K, V>' //选择后粘贴到编辑器中的文字
        },
        {
            label: 'vkfOMap<K, V>', //显示的提示名称
            insertText: 'vkfOMap<K, V>' //选择后粘贴到编辑器中的文字
        },
        {
            label: 'vkfRef<T>', //显示的提示名称
            insertText: 'vkfRef<T>' //选择后粘贴到编辑器中的文字
        },
    ];
    for (let key in this._tipItems) {
        // noinspection JSUnfilteredForInLoop
        completion.push({
            label: key,
            insertText: key
        })
    }
    for (let item of completion) {
        item.documentation = item.label;
        item.kind = monaco.languages.CompletionItemKind.Class;
    }
    return completion;
}

CodeCompletion.prototype._gcobjectTips = function () {
    return [
        {
            label: 'ObjectPtr GetUserData(const char* name, bool at = true)', //显示的提示名称
            insertText: 'GetUserData("")' //选择后粘贴到编辑器中的文字
        },
        {
            label: 'ObjectPtr GetUserData(int32 index = 0, bool at = true)', //显示的提示名称
            insertText: 'GetUserData(0)' //选择后粘贴到编辑器中的文字
        },
        {
            label: 'void SetUserData(ObjectPtr value, const char* name, bool at = true)', //显示的提示名称
            insertText: 'SetUserData(0,"")' //选择后粘贴到编辑器中的文字
        },
        {
            label: 'void SetUserData(ObjectPtr value, int32 index = 0 , bool at = true)', //显示的提示名称
            insertText: 'SetUserData(0,0)' //选择后粘贴到编辑器中的文字
        },
        {
            label: 'CopyTo(const vGCObject& Dest)', //显示的提示名称
            insertText: 'CopyTo(const vGCObject& Dest)' //选择后粘贴到编辑器中的文字
        },
        {
            label: 'vGCObject As(int32 cls)', //显示的提示名称
            insertText: 'As(int32 cls)' //选择后粘贴到编辑器中的文字
        },
        {
            label: 'vGCObject As(const char* clsname)', //显示的提示名称
            insertText: 'As(const char* clsname)' //选择后粘贴到编辑器中的文字
        },
        {
            label: 'T As<T>()', //显示的提示名称
            insertText: 'As<T>()' //选择后粘贴到编辑器中的文字
        },
        {
            label: 'ObjectPtr Meta()', //显示的提示名称
            insertText: 'Meta()' //选择后粘贴到编辑器中的文字
        },
    ];
}

CodeCompletion.prototype._autoobjectTips = function () {
    return [
    ];
}

CodeCompletion.prototype._rawobjectTips = function () {
    return [
        {
            label: 'num1 GetFloat(const char* index, bool at = true) const', //显示的提示名称
            insertText: 'GetFloat()' //选择后粘贴到编辑器中的文字
        },
        {
            label: 'num1 GetFloat(int32 index = 0, bool at = true) const', //显示的提示名称
            insertText: 'GetFloat()' //选择后粘贴到编辑器中的文字
        },
        {
            label: 'void SetFloat(num1 value, const char* index, bool at = true) const', //显示的提示名称
            insertText: 'SetFloat(0)' //选择后粘贴到编辑器中的文字
        },
        {
            label: 'void SetFloat(num1 value, int32 index = 0, bool at = true) const', //显示的提示名称
            insertText: 'SetFloat(0)' //选择后粘贴到编辑器中的文字
        },
        {
            label: 'int32 GetInt32(const char* index, bool at = true) const', //显示的提示名称
            insertText: 'GetInt32(0)' //选择后粘贴到编辑器中的文字
        },
        {
            label: 'int32 GetInt32(int32 index = 0, bool at = true) const', //显示的提示名称
            insertText: 'GetInt32(0)' //选择后粘贴到编辑器中的文字
        },
        {
            label: 'void SetInt32(int32 value, const char* index, bool at = true) const', //显示的提示名称
            insertText: 'SetInt32(0)' //选择后粘贴到编辑器中的文字
        },
        {
            label: 'void SetInt32(int32 value, int32 index = 0, bool at = true) const', //显示的提示名称
            insertText: 'SetInt32(0)' //选择后粘贴到编辑器中的文字
        },
        {
            label: 'const char* GetString(const char* index, bool at = true) const', //显示的提示名称
            insertText: 'GetString()' //选择后粘贴到编辑器中的文字
        },
        {
            label: 'const char* GetString(int32 index = 0, bool at = true) const', //显示的提示名称
            insertText: 'GetString()' //选择后粘贴到编辑器中的文字
        },
        {
            label: 'void SetString(const char* value, const char* index, bool at = true) const', //显示的提示名称
            insertText: 'SetString("")' //选择后粘贴到编辑器中的文字
        },
        {
            label: 'void SetString(const char* value, int32 index = 0, bool at = true) const', //显示的提示名称
            insertText: 'SetString("")' //选择后粘贴到编辑器中的文字
        },
        {
            label: 'vAutoObject GetRawValue(const char* index, bool at = true) const', //显示的提示名称
            insertText: 'GetRawValue()' //选择后粘贴到编辑器中的文字
        },
        {
            label: 'vAutoObject GetRawValue(int32 index = 0, bool at = true) const', //显示的提示名称
            insertText: 'GetRawValue()' //选择后粘贴到编辑器中的文字
        },
        {
            label: 'T GetRawValueAs(const char* index, bool at = true) const', //显示的提示名称
            insertText: 'GetRawValueAs<T>(const char* index, bool at = true)' //选择后粘贴到编辑器中的文字
        },
        {
            label: 'T GetRawValueAs(int32 index = 0, bool at = true) const', //显示的提示名称
            insertText: 'GetRawValueAs<T>(int32 index = 0, bool at = true)' //选择后粘贴到编辑器中的文字
        },
        {
            label: 'void SetRawValue(const vAutoObject& value, const char* index, bool at = true) const', //显示的提示名称
            insertText: 'SetRawValue(0)' //选择后粘贴到编辑器中的文字
        },
        {
            label: 'void SetRawValue(const vAutoObject& value, int32 index = 0, bool at = true) const', //显示的提示名称
            insertText: 'SetRawValue(0)' //选择后粘贴到编辑器中的文字
        },
        {
            label: 'vGCObject GetValue(const char* index, bool at = true) const', //显示的提示名称
            insertText: 'GetValue()' //选择后粘贴到编辑器中的文字
        },
        {
            label: 'vGCObject GetValue(int32 index = 0, bool at = true) const', //显示的提示名称
            insertText: 'GetValue()' //选择后粘贴到编辑器中的文字
        },
        {
            label: ' T GetValueAs(const char* index, bool at = true) const', //显示的提示名称
            insertText: 'GetValueAs<T>(const char* index, bool at = true)' //选择后粘贴到编辑器中的文字
        },
        {
            label: ' T GetValueAs(int32 index = 0, bool at = true) const', //显示的提示名称
            insertText: 'GetValueAs<T>(int32 index = 0, bool at = true)' //选择后粘贴到编辑器中的文字
        },
        {
            label: 'void SetValue(const vGCObject& value, const char* index, bool at = true) const', //显示的提示名称
            insertText: 'SetValue(0)' //选择后粘贴到编辑器中的文字
        },
        {
            label: 'void SetValue(const vGCObject& value, int32 index = 0, bool at = true) const', //显示的提示名称
            insertText: 'SetValue(0)' //选择后粘贴到编辑器中的文字
        },
        {
            label: 'ObjectPtr RawObjectPtr() const', //显示的提示名称
            insertText: 'RawObjectPtr()' //选择后粘贴到编辑器中的文字
        },
        {
            label: 'int32 ClassName() const', //显示的提示名称
            insertText: 'ClassName()' //选择后粘贴到编辑器中的文字
        },
        {
            label: 'ObjectPtr* RawObjectAddr()', //显示的提示名称
            insertText: 'RawObjectPtr()' //选择后粘贴到编辑器中的文字
        },
        {
            label: 'const ObjectPtr* RawObjectAddr() const', //显示的提示名称
            insertText: 'RawObjectPtr()' //选择后粘贴到编辑器中的文字
        },
        {
            label: 'void Call(const char* funcname, Args&&... args)', //显示的提示名称
            insertText: 'Call(const char* funcname, Args&&... args)' //选择后粘贴到编辑器中的文字
        },
        {
            label: 'void Reset()', //显示的提示名称
            insertText: 'Reset()' //选择后粘贴到编辑器中的文字
        },
    ];
}

CodeCompletion.prototype._vclassCommTips = function () {
    return [
        {
            "label": "static int32 getClsID()",
            "insertText": "getClsID()",
            "kind": monaco.languages.CompletionItemKind.Method
        },
        {
            "label": "static char const * clsname",
            "insertText": "clsname",
            "kind": monaco.languages.CompletionItemKind.Variable
        },
    ];
}

CodeCompletion.prototype._vkfstrTips = function () {
    return [
        {
            label: 'void Reset()',
            insertText: 'Reset()'
        },
        {
            label: 'ObjectPtr RawObjectPtr() const',
            insertText: 'RawObjectPtr()'
        },
        {
            label: 'ObjectPtr* RawObjectAddr()', //显示的提示名称
            insertText: 'RawObjectPtr()' //选择后粘贴到编辑器中的文字
        },
        {
            label: 'const ObjectPtr* RawObjectAddr() const', //显示的提示名称
            insertText: 'RawObjectPtr()' //选择后粘贴到编辑器中的文字
        },
        {
            label: 'std::string GetStr()',
            insertText: 'GetStr()'
        },
        {
            label: 'const char* c_str() //注: 返回const char*用完即弃，不能缓存',
            insertText: 'c_str()'
        },
        {
            label: 'void SetStr(const char* cstr)',
            insertText: 'SetStr(const char* cstr)'
        },
        {
            label: 'void ClearStr()',
            insertText: 'ClearStr()'
        },
    ];
}

CodeCompletion.prototype._vkfnameTips = function () {
    return [
        {
            label: 'int32 ToValue() const',
            insertText: 'ToValue()'
        },
        {
            label: 'int32* ValueAddr()',
            insertText: 'ValueAddr()'
        },
        {
            label: 'const int32* ValueAddr() const',
            insertText: 'ValueAddr()'
        },
        {
            label: 'int32 RawObjectPtr() const',
            insertText: 'RawObjectPtr()'
        },
        {
            label: 'const char* c_str() //注: 返回const char*用完即弃，不能缓存',
            insertText: 'c_str()'
        },
    ];
}

CodeCompletion.prototype._vkfrefTips = function () {
    return [
        {
            label: 'const T& GetObj() const',
            insertText: 'GetObj()'
        },
        {
            label: 'T& GetObj()',
            insertText: 'GetObj()'
        },
    ];
}

CodeCompletion.prototype._vkfvectorTips = function () {
    return [
    ];
}

CodeCompletion.prototype._vkfmapTips = function () {
    return [
    ];
}

CodeCompletion.prototype._vkfomapTips = function () {
    return [
    ];
}
