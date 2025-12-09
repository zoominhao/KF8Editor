define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function kfDateformat(dateobj, format) {
        let date = {
            "M+": dateobj.getMonth() + 1,
            "d+": dateobj.getDate(),
            "h+": dateobj.getHours(),
            "m+": dateobj.getMinutes(),
            "s+": dateobj.getSeconds(),
            "q+": Math.floor((dateobj.getMonth() + 3) / 3),
            "S+": dateobj.getMilliseconds()
        };
        if (/(y+)/i.test(format)) {
            format = format.replace(RegExp.$1, (dateobj.getFullYear() + '').substr(4 - RegExp.$1.length));
        }
        for (let k in date) {
            if (new RegExp("(" + k + ")").test(format)) {
                format = format.replace(RegExp.$1, RegExp.$1.length === 1
                    ? date[k] : ("00" + date[k]).substr(("" + date[k]).length));
            }
        }
        return format;
    }
    exports.kfDateformat = kfDateformat;
});
