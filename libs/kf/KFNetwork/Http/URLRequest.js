define(["require", "exports", "./URLRequestMethod"], function (require, exports, URLRequestMethod_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var URLRequest = /** @class */ (function () {
        function URLRequest(url) {
            if (url === void 0) { url = null; }
            this.data = null;
            this.method = URLRequestMethod_1.URLRequestMethod.GET;
            this.url = "";
            this.requestHeaders = [];
            this.url = url;
        }
        return URLRequest;
    }());
    exports.URLRequest = URLRequest;
});
