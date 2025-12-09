const electron = nodeRequire('electron');
const remote = electron.remote;
const systemclipboard = electron.clipboard;

function ClipboardTool() {
}

ClipboardTool._NewClipboard = function () {
    let clipboard = remote.getGlobal('sharedObject').clipboard;
    let newClipboard = null;
    if (clipboard) newClipboard = $.extend(true, {}, clipboard);
    else newClipboard = {};
    return newClipboard;
}

ClipboardTool.SetClipboard = function (type, data, excludekeys) {
    if (!data) return;
    let newClipboard = ClipboardTool._NewClipboard();
    let newdata = $.extend(true, {}, data);
    if (excludekeys) {
        for (let key of excludekeys) {
            delete newdata[key];
        }
    }
    newClipboard[type] = newdata;
    remote.getGlobal('sharedObject').clipboard = newClipboard;
}

ClipboardTool.SetClipboardOfKFD = function (type, data) {
    if (!data) return;
    let newClipboard = ClipboardTool._NewClipboard();
    newClipboard[type] = CommTool.ValueToBase64(data);
    remote.getGlobal('sharedObject').clipboard = newClipboard;
}

ClipboardTool.SetClipboardOfKFDArray = function (type, data) {
    if (!data || !(data instanceof Array)) return;
    let newClipboard = ClipboardTool._NewClipboard();
    let newdata = [];
    for (let item of data) {
        newdata.push(CommTool.ValueToBase64(item));
    }
    newClipboard[type] = newdata;
    remote.getGlobal('sharedObject').clipboard = newClipboard;
}

ClipboardTool.HasClipboard = function (type) {
    let clipboard = remote.getGlobal('sharedObject').clipboard;
    return clipboard && clipboard.hasOwnProperty(type) && clipboard[type];
}

ClipboardTool.GetClipboard = function (type) {
    let clipboard = remote.getGlobal('sharedObject').clipboard;
    if (clipboard && clipboard.hasOwnProperty(type)) {
        return $.extend(true, {}, clipboard[type]);
    }
    return null;
}

ClipboardTool.GetClipboardOfKFD = function (type) {
    let clipboard = remote.getGlobal('sharedObject').clipboard;
    if (clipboard && clipboard.hasOwnProperty(type)) {
        let data = clipboard[type];
        if (data) {
            return CommTool.Base64ToValue(data);
        }
    }
    return null;
}

ClipboardTool.GetClipboardOfKFDArray = function (type) {
    let clipboard = remote.getGlobal('sharedObject').clipboard;
    if (clipboard && clipboard.hasOwnProperty(type)) {
        let data = clipboard[type];
        if (data && data instanceof Array) {
            let ret = [];
            for (let item of data) {
                ret.push(CommTool.Base64ToValue(item));
            }
            return ret;
        }
    }
    return null;
}

ClipboardTool.ClearClipboard = function (type) {
    let newClipboard = ClipboardTool._NewClipboard();
    if (newClipboard && newClipboard.hasOwnProperty(type)) {
        delete newClipboard[type];
    }
}

ClipboardTool.GetSystemClipboard = function () {
    return systemclipboard.readText();
}

ClipboardTool.SetSystemClipboard = function (txt) {
    return systemclipboard.writeText(txt);
}
