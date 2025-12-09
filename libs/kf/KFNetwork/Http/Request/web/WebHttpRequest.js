define(["require", "exports", "../../../../Core/Misc/TypeEvent", "../../../../Core/Meta/KFMetaManager"], function (require, exports, TypeEvent_1, KFMetaManager_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var WebHttpRequest = /** @class */ (function () {
        function WebHttpRequest() {
            this.IO_ERROR_Event = new TypeEvent_1.TypeEvent();
            this.COMPLETE_Event = new TypeEvent_1.TypeEvent();
            this.PROGRESS_Event = new TypeEvent_1.TypeEvent();
            this.timeout = 0;
            this._url = "";
            this._method = "";
        }
        Object.defineProperty(WebHttpRequest.prototype, "response", {
            get: function () {
                if (!this._xhr) {
                    return null;
                }
                if (this._xhr.response != undefined) {
                    return this._xhr.response;
                }
                if (this._responseType == "text") {
                    return this._xhr.responseText;
                }
                if (this._responseType == "arraybuffer" && /msie 9.0/i.test(navigator.userAgent)) {
                    var w = window;
                    return w.convertResponseBodyToText(this._xhr["responseBody"]);
                }
                if (this._responseType == "document") {
                    return this._xhr.responseXML;
                }
                /*if (this._xhr.responseXML) {
                    return this._xhr.responseXML;
                }
                if (this._xhr.responseText != undefined) {
                    return this._xhr.responseText;
                }*/
                return null;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(WebHttpRequest.prototype, "responseType", {
            get: function () {
                return this._responseType;
            },
            set: function (value) {
                this._responseType = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(WebHttpRequest.prototype, "withCredentials", {
            get: function () {
                return this._withCredentials;
            },
            set: function (value) {
                this._withCredentials = value;
            },
            enumerable: true,
            configurable: true
        });
        WebHttpRequest.prototype.getXHR = function () {
            if (window["XMLHttpRequest"]) {
                return new window["XMLHttpRequest"]();
            }
            else {
                return new ActiveXObject("MSXML2.XMLHTTP");
            }
        };
        WebHttpRequest.prototype.open = function (url, method) {
            if (method === void 0) { method = "GET"; }
            this._url = url;
            this._method = method;
            if (this._xhr) {
                this._xhr.abort();
                this._xhr = null;
            }
            var xhr = this.getXHR(); //new XMLHttpRequest();
            if (window["XMLHttpRequest"]) {
                xhr.addEventListener("load", this.onload.bind(this));
                xhr.addEventListener("error", this.onerror.bind(this));
            }
            else {
                xhr.onreadystatechange = this.onReadyStateChange.bind(this);
            }
            xhr.onprogress = this.updateProgress.bind(this);
            xhr.ontimeout = this.onTimeout.bind(this);
            xhr.open(this._method, this._url, true);
            this._xhr = xhr;
        };
        WebHttpRequest.prototype.send = function (data) {
            if (this._responseType != null) {
                this._xhr.responseType = this._responseType;
            }
            if (this._withCredentials != null) {
                this._xhr.withCredentials = this._withCredentials;
            }
            if (this.headerObj) {
                for (var key in this.headerObj) {
                    this._xhr.setRequestHeader(key, this.headerObj[key]);
                }
            }
            this._xhr.timeout = this.timeout;
            this._xhr.send(data);
        };
        WebHttpRequest.prototype.abort = function () {
            if (this._xhr) {
                this._xhr.abort();
            }
        };
        WebHttpRequest.prototype.getAllResponseHeaders = function () {
            if (!this._xhr) {
                return null;
            }
            var result = this._xhr.getAllResponseHeaders();
            return result ? result : "";
        };
        WebHttpRequest.prototype.setRequestHeader = function (header, value) {
            if (!this.headerObj) {
                this.headerObj = {};
            }
            this.headerObj[header] = value;
        };
        WebHttpRequest.prototype.getResponseHeader = function (header) {
            if (!this._xhr) {
                return null;
            }
            var result = this._xhr.getResponseHeader(header);
            return result ? result : "";
        };
        WebHttpRequest.prototype.onTimeout = function () {
            this.IO_ERROR_Event.emit({ "url": this._url, "msg": "timeout" });
        };
        WebHttpRequest.prototype.onReadyStateChange = function () {
            var xhr = this._xhr;
            if (xhr.readyState == 4) { // 4 = "loaded"
                var ioError_1 = (xhr.status >= 400 || xhr.status == 0);
                var url = this._url;
                var self_1 = this;
                window.setTimeout(function () {
                    if (ioError_1) { //请求错误
                        self_1.IO_ERROR_Event.emit({ "url": self_1._url, "msg": "ioerror" });
                    }
                    else {
                        self_1.COMPLETE_Event.emit({ "url": self_1._url });
                    }
                }, 0);
            }
        };
        WebHttpRequest.prototype.updateProgress = function (event) {
            if (event.lengthComputable) {
                this.PROGRESS_Event.emit({ url: this._url,
                    loaded: event.loaded,
                    total: event.total });
            }
        };
        WebHttpRequest.prototype.onload = function () {
            var self = this;
            var xhr = this._xhr;
            var url = this._url;
            var ioError = (xhr.status >= 400);
            window.setTimeout(function () {
                if (ioError) { //请求错误
                    self.IO_ERROR_Event.emit({ url: self._url,
                        msg: "timeout" });
                }
                else {
                    self.COMPLETE_Event.emit({ "url": self._url });
                }
            }, 0);
        };
        WebHttpRequest.prototype.onerror = function () {
            var url = this._url;
            var self = this;
            window.setTimeout(function () {
                self.IO_ERROR_Event.emit({ url: self._url,
                    msg: "timeout" });
            }, 0);
        };
        WebHttpRequest.Meta = new KFMetaManager_1.IKFMeta("WebHttpRequest", function () {
            return new WebHttpRequest();
        });
        return WebHttpRequest;
    }());
    exports.WebHttpRequest = WebHttpRequest;
});
