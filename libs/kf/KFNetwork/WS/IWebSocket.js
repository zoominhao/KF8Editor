define(["require", "exports", "../../Core/Meta/KFMetaManager"], function (require, exports, KFMetaManager_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IWebSocket_Type = new KFMetaManager_1.DefaultType();
    //设置默认就用WEB对象的
    exports.IWebSocket_Type.meta = new KFMetaManager_1.AMeta("WebSocket", function (url) {
        return new WebSocket(url);
    });
});