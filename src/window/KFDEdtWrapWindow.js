class KFDEdtWrapWindow extends BaseWindow {
    constructor(jWin, kfdTable) {
        super(jWin);
        let tg = this.jWin.find('table.easyui-treegrid');
        tg.treegrid('expandAll');
        this.KFDEdt = new KFDEditor(tg, kfdTable);
        this.beforeCloseFunc = null;
    }

    OnBeforeOpen(params) {
        if (params.hasOwnProperty('title'))
            this.jWin.window({title: params.title})
        if (params.hasOwnProperty('src')) {
            if (params.hasOwnProperty('inprops') == false) {
                params['inprops'] = {"target": {"__state__": "open"}};
            } else if (params['inprops'].hasOwnProperty('target') == false) {
                params['inprops']['target'] = {"__state__": "open"};
            }
            this.KFDEdt.Edit(params['src'], params['inprops']);
        }
        return super.OnBeforeOpen(params);
    }

    OnBeforeClose() {
        if (this.beforeCloseFunc)
            this.beforeCloseFunc.call(this);
        return super.OnBeforeClose();
    }
}