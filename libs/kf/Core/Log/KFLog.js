define(["require", "exports", "../Misc/KFDate"], function (require, exports, KFDate) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function LOG(format) {
        let filename_lineno = _getFileNameAndLineNo();
        let args = _packArguments(...arguments);
        console.log(_formatLog(format, args, "[debug]" + filename_lineno));
    }
    exports.LOG = LOG;

    function LOG_WARNING(format) {
        let filename_lineno = _getFileNameAndLineNo();
        let args = _packArguments(...arguments);
        console.warn(_formatLog(format, args, "[warning]" + filename_lineno));
    }
    exports.LOG_WARNING = LOG_WARNING;

    function LOG_ERROR(format) {
        let filename_lineno = _getFileNameAndLineNo();
        let args = _packArguments(...arguments);
        console.error(_formatLog(format, args, "[error]" + filename_lineno));
    }
    exports.LOG_ERROR = LOG_ERROR;

    let enable_filename_lineno = true;
    function _getFileNameAndLineNo() {
        if (!enable_filename_lineno) {
            return "";
        }
        let err = new Error();
        let strErr = err.stack;
        let strLineErr = strErr.split(/[\r\n]/)[3];
        let arrErrResult = strLineErr.match(/[^/:\\]+/ig);
        arrErrResult.pop();
        let lineNum = +arrErrResult.pop();
        let fileName = arrErrResult.pop();
        return "[" + fileName + ":" + lineNum + "]";
    }
    function _packArguments() {
        let args = [];
        for (let _i = 1; _i < arguments.length; ++_i) {
            args[_i - 1] = arguments[_i];
        }
        return args;
    }
    function _formatLog(format, args, head) {
        if (head === void 0) { head = ""; }
        format = KFDate.kfDateformat(new Date(), " [yyyy/MM/dd hh:mm:ss]") + head + format;
        if (!args || !args.length) {
            return format;
        }
        let i = 0;
        while (i < args.length) {
            let rstr = "\\{" + i + "\\}";
            format = format.replace(new RegExp(rstr, "g"), args[i]);
            i += 1;
        }
        return format;
    }
});
