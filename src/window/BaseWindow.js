class BaseWindow {
    constructor(jWin) {
        if (jWin) {
            this.jWin = jWin;
            this.instId = this.jWin.id;
            this.visible = false;
            this.disposed = false;
            this.winOffset = {};
            this.init();
        }
    }

    init() {
        let inst = this;
        inst.jWin.window({
            onBeforeClose: function () {
                inst.SetGlobalOffset(inst.jWin.offset().left, inst.jWin.offset().top);
                this.visible = false;
                return inst.OnBeforeClose();
            },
            onClose: function () {
                inst.dispose();
            },
            onMove: function (left, top) {
                var width = $(this).panel('options').width;
                var height = $(this).panel('options').height;
                var parentWidth = $("body").width();
                var parentHeight = $("body").height();
                var scrollLeft = document.body.scrollLeft;
                var scrollTop = document.body.scrollTop;
                // 当弹出框尺寸大于浏览器大小时，弹出框自动缩小为浏览器当前尺寸
                if (width > parentWidth)
                    $(this).window('resize', {
                        width: parentWidth - 1
                    });
                if (height > parentHeight)
                    $(this).window('resize', {
                        height: parentHeight - 1
                    });
                // 当弹出框被拖动到浏览器外时，将弹出框定位至浏览器边缘
                if (left < scrollLeft) {
                    $(this).window('move', {
                        left: scrollLeft
                    });
                }
                if (top < scrollTop) {
                    $(this).window('move', {
                        top: scrollTop
                    });
                }
                if (left > scrollLeft && left > parentWidth - width + scrollLeft) {
                    $(this).window('move', {
                        left: parentWidth - width + scrollLeft
                    });
                }
                if (top > scrollTop && top > parentHeight - height + scrollTop) {
                    $(this).window('move', {
                        top: parentHeight - height + scrollTop
                    });
                }
                inst.SetGlobalOffset(inst.jWin.offset().left, inst.jWin.offset().top);
                inst.OnMove(left, top);
            }
        })
    }

    open(params) {
        if (this.OnBeforeOpen(params)) {
            if (params.hasOwnProperty('modal'))
                this.jWin.window({modal: params['modal']});
            this.jWin.window('open').window(this.winOffset == null || (this.winOffset.left == 0 && this.winOffset.top == 0) ? 'center' : {
                left: this.winOffset.left,
                top: this.winOffset.top,
            });
            this.visible = true;
            this.OnAfterOpen();
        }
    }

    dispose() {
        if (this.disposed == false)
            this.OnDispose();
    }

    SetGlobalOffset(left, top) {
        if (!this.winOffset)
            this.winOffset = {};
        this.winOffset.left = left;
        this.winOffset.top = top;
    }


    ///Virtual Override Method
    OnBeforeOpen(params) {
        return true;
    }

    OnAfterOpen() {
    }

    OnMove(left, top) {
    }

    OnBeforeClose() {
        return true;
    }

    OnDispose() {
    }
}