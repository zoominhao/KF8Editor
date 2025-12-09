import {Editor} from './editor.js'
class App {
    constructor() {
        let self = this;

        this.preInit();
        this.editor = new Editor();
        this.editor.Event.on('onSave', function () {
            self.save();
        });
        this.editor.Event.on('onCompile', function () {
            self.saveAndCompile();
        });
        this.codelib = new CodeLibrary(this.paths, ['cpp', 'h']);
        this.codelib.Event.on('onDblClick', function (node) {
            if (!node || !node.code) return;
            let name = "";
            let asseturl = "";
            if (node.asseturl) {
                name = node.codeurl.replace(node.asseturl.replace('.blk', '/Code/'), '');
                asseturl = node.asseturl;
            } else {
                name = node.codeurl;
            }
            self.openCode(name, node.asseturl, node.path);
        });
        this.codelib.Event.on('compile', function (node) {
            self.compiler.CompileNode(node, self.codelib.GetData());
        });

        this.codelib_panel_state = { expand: false }
        this.codelib_panel = $('#codelibpanel');
        this.codelib_panel.panel({
            onBeforeCollapse: function () {
                self.codelib_panel_state.expand = false;
            },
            onBeforeExpand: function () {
                self.codelib_panel_state.expand = true;
            },
            tools: [{
                iconCls: 'icon-reload',
                handler: function () {
                    self.codelib.Refresh();
                }
            }]
        });

        this.codelib.Refresh(function () {
            if (self.start_label) {
                self.openCodeByLabel(self.start_label);
            }
        });

        this.compiler = new Compiler(this.paths);

        this.searchui = $('#codelibsearch');
        this.searchui.textbox({
            // prompt:'Search',
            value: '',
            onChange: function (newValue, oldValue) {
                self.codelib.SetSearching(!!newValue);
                if (!newValue) {
                    self.codelib.Refresh();
                } else {
                    self.codelib.DoFilter(newValue);
                }
            }
        });
        // this.searchui.textbox('textbox').bind('keyup', function () {
        //     let value = self.searchui.textbox('getText');
        //     self.codelib.DoFilter(value);
        // });

        this.codeonlyui = $('#codelibcodeonly');
        this.codeonlyui.checkbox({
            onChange: function (checked) {
                self.codelib.SetCodeOnly(checked);
                self.codelib.Refresh();
            }
        });

        this.root = $('#root');
        this.tabs = $('#tt');
        this.tabs.tabs({
            onSelect: function (title, index) {
                let tab = self.tabs.tabs('getTab', index);
                if (!tab) return;
                self.editor.selectModel(tab.panel('options').id);
                self.updateTitle();
                self.root.show();
            },
            onUnselect: function (title, index) {
                let tab = $("#tt").tabs('getTab', index);
                if (!tab) return;
                self.editor.unselectModel(tab.panel('options').id);
            },
            onBeforeClose: function (title, index) {
                let tab = self.tabs.tabs('getTab', index);
                if (!tab) return;
                let id = tab.panel('options').id;
                let model_info = self.editor.getModel(id);
                if (model_info) {
                    if (model_info.changed) {
                        Confirm('警告', '代码修改未保存，是否仍关闭？', function () {
                            self.editor.deleteModel(id);
                            self.tabs.tabs('close', index);
                        });
                        return false;
                    } else {
                        self.editor.deleteModel(id);
                    }
                }
            },
            onClose: function (title, index) {
                let tabs = self.tabs.tabs('tabs');
                if (tabs.length === 0) {
                    self.root.hide();
                    remote.getCurrentWindow().setTitle("empty");
                }
            }
        });

        $('#savecode').click(function (evt) {
            self.save();
        });

        $('#compilecode').click(function (evt) {
            self.saveAndCompile();
        });

        $('#exportcode').click(function (evt) {
            self.exportAll().catch(function (e) {
                Alert('导出失败', e.asseturl + ', ' + e.path);
            });
        });

        $('#backcode').click(function (evt) {
            self.editor.backToBeforePosition();
        });

        $('#forwardcode').click(function (evt) {
            self.editor.forwardPosition();
        });

        ipcRenderer.on("openCodeByLabel", (event, label) => {
            self.openCodeByLabel(label);
        });

        // this.loadCompletion();

        this.layout();
    }

    preInit() {
        const search_params = GetURLParams(document.location.toString());
        this.paths = {
            kfdpath: search_params.get('kfdpath'),
            apppath: search_params.get('apppath'),
            appdatapath: search_params.get('appdatapath')
        };
        this.start_label = search_params.get('label');

        HttpRequest_Type.meta = WebHttpRequest.Meta;
        IKFFileIO_Type.meta = KFHttpFileIO.Meta;
        IKFFileIO_Type.new_default();
        ///绑定一些本地行为
        __Native.Ready();
    }


    layout() {
        this.layoutSearchUI();
        this.layoutEditor();
    }

    layoutSearchUI() {
        if (this.codelib_panel_state.expand) {
            this.searchui.textbox({
                width: this.codelib_panel.width() - 36 - 48
            })
        }
    }

    layoutEditor() {
        let height = this.root.height();
        let width = this.root.width();
        let ftwidth = 20;
        if (this.codelib_panel_state.expand) {
            ftwidth = this.codelib_panel.width() + 8;
            this.searchui.textbox({
                width: this.codelib_panel.width() - 36 - 48
            })
        }
        let new_width = width - ftwidth;
        this.editor.layout(new_width, height - 64);

        // let tab = this.tabs.tabs('getSelected');
        // let index = this.tabs.tabs('getTabIndex', tab);
        // this.tabs.tabs({
        // 这样不知道为什么不能生效
        //     selected: index,
        //     width: new_width,
        // });
        // this.tabs.tabs('select', index);
        let options = this.tabs.tabs('options');
        options.width = new_width;
        this.tabs.tabs('resize');
    }

    createEditorModel(text, type, from, path)
    {
        let self = this;
        let tabId = this.getTabId(from);
        let model_info = this.editor.modelExists(path)
        if (!model_info)  {
             model_info = this.editor.addNewModel(tabId, text, type, path, function () {
                 self.updateTitle();
             });
             model_info.from = from;
             model_info.path = path;
         }
         return model_info
    }

    setEditorText(text, type, from, path) {

       // if (!tabId || tabId === this.getCurrId()) return;
        let model_info = this.createEditorModel(text, type, from, path);
        openTab(this.tabs, this.getTabId(model_info.from), this.getTabTitle(model_info.from), function () { });
        this.updateTitle();
        this.layoutEditor();
    }

    getTabId(from) {
        let tabId = "";
        if (from) {
            tabId = Object.keys(from).map(key => from[key]).join('_')
                .replaceAll('/', '_')
                .replaceAll('.', '_')
                .replaceAll('[', '_')
                .replaceAll(']', '_');
        }
        return tabId;
    }

    getTabTitle(from) {
        let title = "";
        if (from) {
            title = Object.keys(from).map(key => from[key]).join('&');
        }
        return title;
    }

    getCurrTab() {
        return this.tabs.tabs('getSelected');
    }

    getCurrId() {
        let tab = this.getCurrTab();
        if (tab) {
            return tab.panel('options').id;
        }
        return "";
    }

    getCurrModel() {
        return this.editor.getModel(this.getCurrId());
    }

    updateTitle() {
        let tab = this.getCurrTab();
        let model_info = this.getCurrModel();
        if (!tab || !model_info) return;
        let title = "";
        if (model_info.from) {
            let from = model_info.from;
            title = Object.keys(from).map(key => key + '=' + from[key]).join('&');
        }
        let tab_title = this.getTabTitle(model_info.from);
        if (model_info.changed) {
            title = "[***]" + title;
            tab_title = "[***]" + tab_title;
        }
        this.tabs.tabs('update', {
            tab: tab,
            options: {
                title: tab_title
            }
        });
        remote.getCurrentWindow().setTitle(title);
    }

    openCode(name, asseturl, codepath, revealtext) {
        if (!codepath) return;
        let self = this;
        IKFFileIO_Type.instance.asyncLoadFile(codepath, function (ret, data, path) {
            if (ret) {
                let strData = data.toString();
                let extendnameindex = codepath.lastIndexOf('.');
                let extendname = "";
                if (extendnameindex !== -1) {
                    extendname = codepath.substring(extendnameindex + 1);
                }
                let type = ['cpp', 'h'].includes(extendname) ? 'cpp' : ''
                let from = {};
                if (asseturl) from.asseturl = asseturl;
                from.code = name;
                self.setEditorText(strData, type, from, codepath);
                if (revealtext) self.editor.revealText(revealtext);
            } else {
                Alert('打开代码失败', codepath);
            }
        }, "text");
    }

    openCodeByLabel(label) {
        console.log(label)
        if (label) {
            let parts = label.split('|');
            if (parts.length >= 0) {
                this.openCodeByFuncName(parts[0]);
            }
        }
    }

    openCodeByFuncName(name) {
        let self = this;
        this.getExportFunction(name, function (info) {
            if (!info) return;
            let codename = info.codeurl.replace(info.asseturl.replace('.blk', '/Code/'), '');
            let codepath = self.paths.appdatapath + '/' + info.codeurl;
            self.codelib.ExpandByPath(codepath);
            self.openCode(codename, info.asseturl, codepath, name);
        }).catch();
    }

    save(succ_callback) {
        let self = this;
        let model_info = this.getCurrModel();
        if (model_info && model_info.path) {
            if (!model_info.changed) {
                Msg('内容没有改变!', 2, "消息", 600);
                if (succ_callback) succ_callback();
                return;
            }
            if (!self.saving) {
                self.saving = {};
                $.messager.progress({ title: "保存中..." });
                $.messager.progress('bar').progressbar({
                    text: '请等待...'
                });
            }
            IKFFileIO_Type.instance.asyncSaveFile(model_info.path, model_info.model.getValue(), function (ret) {
                try { $.messager.progress('close'); } catch (e) { }
                if (ret) {
                    model_info.changed = false;
                    self.updateTitle();
                    Msg('<span style="color:yellow">保存成功!</span>', 2, "消息", 600);
                    if (succ_callback) succ_callback();
                } else {
                    self.clearSaving();
                    Nt("保存代码失败，请注意备份代码！");
                }
            });
        }
    }

    compile() {
        let model_info = this.getCurrModel();
        if (model_info && model_info.from && model_info.from.asseturl) {
            this.compiler.CompileAsseturls([model_info.from.asseturl], this.codelib.GetData()).catch(e => { });
        }
    }

    saveAndCompile() {
        let self = this;
        this.save(function () {
            self.compile();
        });
    }

    clearSaving(timeout) {
        if (this.saving) {
            if (timeout) {
                this.saving.timeoutHandle = null;
            }
            if (this.saving.timeoutHandle) {
                clearTimeout(this.saving.timeoutHandle);
            }
            delete this.saving;
        }
    }

    async exportAll() {
        let self = this;
        this.codelib.Refresh();
        let nodes = this.codelib.GetData();
        if (!nodes) return;

        let queryCodeFiles = function (node, files) {
            if (node) {
                if (node.code) {
                    files.push(node);
                } else if (node.children) {
                    for (let child of node.children) {
                        queryCodeFiles(child, files);
                    }
                }
            }
        }
        let codefiles = [];
        for (let node of nodes) {
            queryCodeFiles(node, codefiles);
        }

        let code_export_path = this.paths.kfdpath.replace('KFD', 'Code');
        if (!fileExists(code_export_path)) {
            await new Promise(function (resolve) {
                IKFFileIO_Type.instance.asyncCreateDir(code_export_path, function () {
                    resolve();
                });
            })
        }

        let export_infos = {};
        let len = codefiles.length;
        $.messager.progress({ title: "导出中...", interval: 0 });
        for (let i = 0; i < len; ++i) {
            let file = codefiles[i];
            $.messager.progress('bar').progressbar('setValue', parseInt(i * 100 / len));
            await new Promise(function (resolve, reject) {
                self.exportOne(file, export_infos, function (ret) {
                    if (ret) resolve();
                    else reject(file);
                });
            });
        }

        this.export_info = export_infos;

        IKFFileIO_Type.instance.asyncSaveFile(code_export_path + '/CodeExportFunctions.json', JSON.stringify(export_infos), function (ret) {
            try { $.messager.progress('close'); } catch (e) { }
            if (ret) {
                ipcRenderer.send('GlobalEvent', 'LoadCodeExport');
                Msg('<span style="color:yellow">导出成功!</span>', 2, "消息", 600);
            } else {
                Alert('保存导出文件失败！', code_export_path);
            }
        });
    }

    exportOne(file, infos, callback) {
        if (file && infos) {
            let self = this;
            IKFFileIO_Type.instance.asyncLoadFile(file.path, function (ret, data, path) {
                if (ret) {
                    let strData = data.toString();
                    let parser = new CodeParser(strData);
                    let methods = parser.GetMethods();
                    if (methods.length > 0) {
                        let codefilelist = null
                        if (infos.hasOwnProperty(file.asseturl)) {
                            codefilelist = infos[file.asseturl];
                        } else {
                            codefilelist = [];
                            infos[file.asseturl] = codefilelist;
                        }
                        codefilelist.push({
                            // path: file.path,
                            codeurl: file.codeurl,
                            methods: parser.GetMethods()
                        });
                    }
                }
                callback(ret);
            }, "text");
        } else {
            callback(false);
        }
    }

    async getExportFunction(name, callback) {
        let self = this;
        if (!this.export_info) {
            let export_info_path = this.paths.kfdpath.replace('KFD', 'Code')
                + '/CodeExportFunctions.json';
            await new Promise(function (resolve) {
                IKFFileIO_Type.instance.asyncLoadFile(export_info_path, function (ret, data, path) {
                    if (ret) {
                        let strData = data.toString();
                        let export_info = JSON.parse(strData);
                        if (export_info) self.export_info = export_info;
                    } else {
                        Alert('加载导出函数信息文件失败', export_info_path);
                    }
                    resolve();
                }, "text");
            });
        }
        let ret = null;
        if (this.export_info) {
            for (let key in this.export_info) {
                let codes = this.export_info[key];
                for (let code of codes) {
                    if (code.methods && code.methods.includes(name)) {
                        ret = {
                            asseturl: key,
                            codeurl: code.codeurl
                        }
                        break;
                    }
                }
                if (ret) break;
            }
        }
        if (callback) callback(ret);
    }

    loadCompletion() {
        let self = this;
        let completionpath = this.paths.kfdpath.replace('KFD', '/Include/Generated/vCompletion.json');
        IKFFileIO_Type.instance.asyncLoadFile(completionpath, function (ret, data, path) {
            if (ret && self.editor) {
                let strData = data.toString();
                self.editor.createCompletion(strData);
            }
        }, "text");
    }
}



window.onload = function () {
    __non_webpack_require__(['../node_modules/monaco-editor/min/vs/editor/editor.main'], function () {
    //require(['../node_modules/monaco-editor/min/vs/editor/editor.main'], function () {
    // setTimeout(function () {
        ///加载需要有库
        loadjspackage(
            [
                "KFData"
                , "Core"
                , "KFNetwork"
            ]
            , "./libs/kf/"
            , function (jspaths) {
                var jspathss = [];
                jspaths.forEach(element => {
                    jspathss.push("../../" + element);
                });
                requirejs.config({
                    paths: {

                    }
                });
                loadandincludejs(jspathss
                    , function () {
                        window.app = new App();
                    });
            }
            , null);
        // }, 3000);
    });
}

