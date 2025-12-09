_global = {};
_global.CopyValue = null;
_global.Event = new PIXI.utils.EventEmitter();
_global.editorConfig = {scale: 1.0, bgcolor: 0x000000, align: 0, CurrentFrameIndex: 0};
_global.clipboard = {}
_global.curEditIndex = 0;

_global.kfdpath = Path2Valid(localStorage.getItem("kfdpath"));
_global.appdatapath = Path2Valid(localStorage.getItem("appdatapath"));
_global.apppath = Path2Valid(localStorage.getItem("apppath"));

let workSpacesstr = localStorage.getItem("workSpaces");
workSpacesstr = !workSpacesstr ? "[]" : workSpacesstr;

_global.workSpaces = JSON.parse(workSpacesstr);

_global.saveconfig = function (appdatapath, kfdpath, apppath) {
    appdatapath = Path2Valid(appdatapath);
    kfdpath = Path2Valid(kfdpath);
    apppath = Path2Valid(apppath);

    localStorage.setItem("kfdpath", kfdpath);
    localStorage.setItem("appdatapath", appdatapath);
    localStorage.setItem("apppath", apppath);

    _global.apppath = apppath;
    _global.kfdpath = kfdpath;
    _global.appdatapath = appdatapath;

    let insert = true;
    for (let i = 0; i < _global.workSpaces.length; i++) {
        let hist = _global.workSpaces[i];
        if (hist.apppath === apppath) {
            ///调整到最后来
            _global.workSpaces.splice(i, 1, hist);

            hist.kfdpath = kfdpath;
            hist.appdatapath = appdatapath;
            insert = false;
            break;
        }
    }

    if (insert) {
        _global.workSpaces.splice(0, 0, {apppath: apppath, kfdpath: kfdpath, appdatapath: appdatapath});
    }

    localStorage.setItem("workSpaces", JSON.stringify(_global.workSpaces));
}

NativeInitGlobal(_global);