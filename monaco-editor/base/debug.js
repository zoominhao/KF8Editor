class EditorDebugTool {
    constructor() {
    }

    addBreakPoint(editor, line, hit = false, enable = true) {
        let model = editor.getModel();
        if (!model) return;
        let value = {
            range: new monaco.Range(line, 1, line, 1),
            options: {
                isWholeLine: true,
                className: hit ? 'bpHitContentClass' : (enable ? 'bpContentClass' : 'bpDisableContentClass'),
                glyphMarginClassName: hit ? 'bpHitGlyphMarginClass' : (enable ? 'bpGlyphMarginClass' : 'bpDisableGlyphMarginClass')
            }
        }
        model.deltaDecorations([], [value]);
    };

    removeBreakPoint(editor, line, hit = false) {
        let model = editor.getModel();
        if (!model) return;
        let decorations;
        let ids = [];
        if (line > 0) {
            decorations = editor.getLineDecorations(line);
        } else {
            decorations = model.getAllDecorations();
        }
        for (let decoration of decorations) {
            let cls = null;
            if (hit) cls = ['bpHitContentClass'];
            else cls = ['bpContentClass', 'bpDisableContentClass'];
            if (cls.includes(decoration.options.className)) {
                ids.push(decoration.id);
            }
        }
        if (ids && ids.length) {
            model.deltaDecorations(ids, []);
        }
    };

    //判断该行是否存在断点
    hasBreakPoint(editor, line) {
        let decorations = editor.getLineDecorations(line);
        for (let decoration of decorations) {
            if (['bpContentClass', 'bpDisableContentClass'].includes(decoration.options.linesDecorationsClassName)) {
                return true;
            }
        }
        return false;
    }
}

/*
function setEditorDebug(key, data) {
    let current = window.Current;
    if (current && current.Debug) {
        current.Debug[key] = data;
    }
}

function getDebugTools() {
    let current = window.Current;
    return current && current.Debug ? current.Debug.tools : null;
}

function setBreakPoints(data) {
    if (data) {
        if (!data.has_from) {
            ipcRenderer.send('monacodebug', window.Current.id, 'monacosettext', {
                from: window.Current.Debug.from
            });
            return;
        }
        if (data.lines) {
            let tools = getDebugTools();
            if (!tools) return;
            tools.removeBreakPoint(window.CurrentEditor, 0, false);
            for (let line of data.lines) {
                tools.addBreakPoint(window.CurrentEditor, line.line, false, line.enable);
            }
        }
    }
}

function onBreakPointHit(data) {
    if (data) {
        let tools = getDebugTools();
        if (!tools) return;
        if (data.line > 0) {
            tools.addBreakPoint(window.CurrentEditor, data.line, true);
        } else {
            tools.removeBreakPoint(window.CurrentEditor, data.line, true);
        }
    }
}

ipcRenderer.on('debugger', (event,id,type,data)=>{
    switch (type) {
        case 'variables': {
            setEditorDebug('variables', data);
            break;
        }
        case 'breakpoints': {
            setBreakPoints(data);
            break;
        }
        case 'breakpointhit': {
            onBreakPointHit(data);
            break;
        }
        default: break;
    }
})

function isSameFrom(from) {
    let currFrom = null;
    if (window.Current && window.Current.Debug) {
        currFrom = window.Current.Debug.from;
    }
    if (!currFrom || !from) return false;
    if (Object.keys(currFrom).length !== Object.keys(from).length) return false;
    for (let key in from) {
        if (from.hasOwnProperty(key)) {
            if (from[key] !== currFrom[key]) {
                return false;
            }
        }
    }
    return true;
}

*/
