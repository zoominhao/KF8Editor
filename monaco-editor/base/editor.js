//const {ipcRenderer} = nodeRequire('electron')
import * as monaco from 'monaco-editor';
import { ConsoleLogger, listen } from 'vscode-ws-jsonrpc';
import {
    MonacoLanguageClient, CloseAction, ErrorAction,
    MonacoServices, createConnection
} from 'monaco-languageclient';
import * as cpp from 'monaco-editor/esm/vs/basic-languages/cpp/cpp'

const ReconnectingWebSocket = require('reconnecting-websocket');
var tmp_path = 'C:/RA/Tools/KF8Editor/tmp.cpp';
var connected = false;
const DefaluLanguage = 'cpp';
export class Editor {
    constructor() {
        this.data = {};
        this.Event = new PIXI.utils.EventEmitter();
        this.init();
        this.definitionNum = 0;
        this.selectRange = new monaco.Range(1,1,1,1);
        this.backStack = [];
        this.forwardStack = [];
        //this.dirPath = "file:///" + path + "/";
        // this.createEditor(path);
    }

    init() {
        let self = this;
        // 定义编辑器主题
        monaco.editor.defineTheme('myTheme',
            {
                "base": "vs-dark",
                "inherit": true,
                "rules": [
                    {
                        "background": "404040",
                        "token": ""
                    },
                    {
                        "foreground": "709070",
                        "fontStyle": "italic",
                        "token": "comment"
                    },
                    {
                        "fontStyle": "bold",
                        "token": "keyword.other.directive"
                    },
                    {
                        "fontStyle": "underline",
                        "token": "keyword.other.directive.line-number"
                    },
                    {
                        "foreground": "ff8080",
                        "token": "constant.character"
                    },
                    {
                        "foreground": "ff2020",
                        "token": "string"
                    },
                    {
                        "foreground": "22c0ff",
                        "token": "constant.numeric"
                    },
                    {
                        "fontStyle": "underline",
                        "token": "constant.numeric.floating-point"
                    },
                    {
                        "foreground": "ffffa0",
                        "token": "keyword"
                    },
                    {
                        "foreground": "ff8000",
                        "fontStyle": "bold",
                        "token": "entity.name.module"
                    },
                    {
                        "foreground": "ff8000",
                        "fontStyle": "bold",
                        "token": "support.other.module"
                    },
                    {
                        "foreground": "ffffa0",
                        "token": "keyword.operator"
                    },
                    {
                        "fontStyle": "underline",
                        "token": "source.ocaml keyword.operator.symbol.infix.floating-point"
                    },
                    {
                        "fontStyle": "underline",
                        "token": "source.ocaml keyword.operator.symbol.prefix.floating-point"
                    },
                    {
                        "foreground": "6080ff",
                        "token": "storage.type"
                    },
                    {
                        "foreground": "4080a0",
                        "token": "entity.name.class.variant"
                    },
                    {
                        "foreground": "f09040",
                        "token": "entity.name.type"
                    },
                    {
                        "foreground": "ffcc66",
                        "fontStyle": "bold",
                        "token": "entity.name.function"
                    },
                    {
                        "foreground": "ffe000",
                        "token": "storage.type.user-defined"
                    },
                    {
                        "foreground": "f4a020",
                        "token": "entity.name.type.class.type"
                    }
                ],
                "colors": {
                    "editor.foreground": "#DEDEDE",
                    "editor.background": "#404040",
                    "editor.selectionBackground": "#A0A0C0",
                    "editor.lineHighlightBackground": "#A0804026",
                    "editorCursor.foreground": "#FFFF66",
                    "editorWhitespace.foreground": "#A8A8A8"
                }
            }
        );
        monaco.editor.setTheme('myTheme');

        // 语法高亮
        this.languageSelected = document.querySelector('.language');
        this.languageSelected.onchange = function () {
            if (self.editor) {
                monaco.editor.setModelLanguage(self.editor.getModel(), self.languageSelected.value)
            }
        }
    }

    getCppReady(editor, BASE_DIR = 'file:///', url = 'ws://127.0.0.1:3333/cpp') {

        monaco.languages.register({
            id: 'cpp',
            extensions: ['.cpp', '.c', '.h', '.hpp'],

            aliases: ['cpp', 'CPP', 'c', 'C'],
        });

        monaco.languages.registerCompletionItemProvider('cpp', {
            provideCompletionItems: function (model, position) {
            }
        });

        MonacoServices.install(editor, {
            rootUri: BASE_DIR
        });

        console.log("using Web Socket URL = ", url); 
        if (!connected) {
            const webSocket = this.createWebSocket(url);
            listen({
                webSocket,
                onConnection: connection => {
                    console.log("onConnection!")
                    connected = true;
                    // create and start the language client
                    const languageClient = this.createLanguageClient(connection, editor);
                    const disposable = languageClient.start();
                    connection.onClose(() => disposable.dispose());
                }
            });
        }
    }



    createWebSocket(url) {
        const socketOptions = {
            maxReconnectionDelay: 10000,
            minReconnectionDelay: 1000,
            reconnectionDelayGrowFactor: 1.3,
            connectionTimeout: 10000,
            maxRetries: Infinity,
            debug: false
        };
        return new ReconnectingWebSocket(url, [], socketOptions);
    }


    createLanguageClient(connection, editor) {
        return new MonacoLanguageClient({
            name: "Sample Language Client",
            clientOptions: {
                // use a language id as a document selector        
                documentSelector: [DefaluLanguage],
                // disable the default error handler            
                errorHandler: {
                    error: () => ErrorAction.Continue,
                    closed: () => CloseAction.DoNotRestart
                },
                middleware: {
                    handleDiagnostics: (uri, diagnostics, next) => {
                        var markers = [];
                        diagnostics.forEach(diagnostic => {
                            markers.push({
                                message: diagnostic.message,
                                severity: diagnostic.severity == 1 ? monaco.MarkerSeverity.Error : monaco.MarkerSeverity.Warning,
                                startLineNumber: diagnostic.range.start.line + 1,
                                startColumn: diagnostic.range.start.character + 1,
                                endLineNumber: diagnostic.range.end.line + 1,
                                endColumn: diagnostic.range.end.character + 1
                            })
                        });
                        let model = this.getModelByUri(uri.path.substring(1));
                        if (model)
                        monaco.editor.setModelMarkers(model, "owner", markers);
                        // next(uri, diagnostics);
                    },
                    resolveCodeLens: (codeLens, token, resolveCodeLens) => {
                        return undefined

                    },
                    provideCodeLenses: (model, token) => {
                        return undefined
                    },
                    provideReferences: (document, position, options, token, next) => {
                        const references = next(document, position, options, token)
                        .then(result => {
                            if (result) { 
                                    while (result.length > 20) {
                                        result.pop();
                                    }
                                    let res = result[0];
                                    if (res)
                                    this.selectRange =
                                    {
                                        startLineNumber: res.range.start.line + 1,
                                        startColumn: res.range.start.character + 1,
                                        endLineNumber: res.range.end.line + 1,
                                        endColumn: res.range.end.character + 1
                                    }

                                    result.forEach(res => {
                                    let codepath = decodeURIComponent(res.uri.substring(8));
                                    res.uri = codepath;
                                    //let codepath = res.targetUri;
                                    IKFFileIO_Type.instance.asyncLoadFile(codepath, function (ret, data, codepath) {
                                        if (ret) {
                                            let strData = data.toString();
                                            let extendnameindex = codepath.lastIndexOf('.');
                                            let extendname = "";
                                            if (extendnameindex !== -1) {
                                                extendname = codepath.substring(extendnameindex + 1);
                                            }
                                            let type = ['cpp', 'h'].includes(extendname) ? 'cpp' : ''
                                            let from = {};
                                            from.code = codepath.substring(codepath.lastIndexOf('/') + 1);
                                            window.app.createEditorModel(strData, type, from, codepath);
                                        }
                                    }, "text");
                                })
                            }
                            return result;
                        }
                        )
                        return references
                        
                    },
                    provideDefinition: (document, position, token, next) => {
                        let model = editor.getModel();
                        const definition = next(document, position, token)
                            .then(result => {
                                if (result) {
                                    let res = result[0];
                                    if (res)
                                    this.selectRange =
                                    {
                                        startLineNumber: res.targetSelectionRange.start.line + 1,
                                        startColumn: res.targetSelectionRange.start.character + 1,
                                        endLineNumber: res.targetSelectionRange.end.line + 1,
                                        endColumn: res.targetSelectionRange.end.character + 1
                                    }
                                    
                                    result.forEach(res => {
                                        let codepath = decodeURIComponent(res.targetUri.substring(8));
                                        res.targetUri = codepath;
                                        //let codepath = res.targetUri;
                                        IKFFileIO_Type.instance.asyncLoadFile(codepath, function (ret, data, codepath) {
                                            if (ret) {
                                                let strData = data.toString();
                                                let extendnameindex = codepath.lastIndexOf('.');
                                                let extendname = "";
                                                if (extendnameindex !== -1) {
                                                    extendname = codepath.substring(extendnameindex + 1);
                                                }
                                                let type = ['cpp', 'h'].includes(extendname) ? 'cpp' : ''
                                                let from = {};
                                                from.code = codepath.substring(codepath.lastIndexOf('/') + 1);
                                                window.app.createEditorModel(strData, type, from, codepath);
                                            }
                                        }, "text");
                                    })
                                    editor.setModel(model);
                                }
                                return result;
                            }
                            )
                        return definition
                    }
                }
            },
            // create a language client connection from the JSON RPC connection on demand
            connectionProvider: {
                get: (errorHandler, closeHandler) => {
                    return Promise.resolve(createConnection(connection, errorHandler, closeHandler));
                }
            }
        });
    }

    createEditor() {
        let self = this;
        let new_container = document.createElement("DIV");
        new_container.id = "container-0";
        new_container.className = "container";
        document.getElementById('root').appendChild(new_container);
        this.editor = monaco.editor.create(new_container, {
            model: null,
            fontSize: 20,
            glyphMargin: true
        });
        this.editor.onKeyDown((event) => {
            if (event.ctrlKey && event.keyCode === 49) {
                self.Event.emit('onSave');
            } else if (event.code === 'F5') {
                self.Event.emit('onCompile');
            } else if (event.altKey && event.keyCode == 15) {
                self.backToBeforePosition();
            } else if (event.altKey && event.keyCode == 17) {
                self.forwardPosition();
            }

        });

        this.registerOpendCodeEditor();
        this.getCppReady(this.editor)
    }

    registerOpendCodeEditor()
    {
        let self = this;
        var editorService = this.editor._codeEditorService;
        var openEditorBase = editorService.openCodeEditor.bind(editorService);
        editorService.openCodeEditor = async (input, source) => {
            let back = {
                uri: self.editor.getModel().uri,
                position: self.editor.getPosition()
            }
            const result = await openEditorBase(input, source);
            let selection = input.options.selection;
            if (selection)
            if (selection.startLineNumber != selection.endLineNumber || selection.startColumn != selection.endColumn)
                self.selectRange = selection
            let codepath = decodeURIComponent(input.resource.scheme + ":" + input.resource.path);
           // codepath = codepath.substring(1);
            IKFFileIO_Type.instance.asyncLoadFile(codepath, function (ret, data, codepath) {
                if (ret) {
                    let strData = data.toString();
                    let extendnameindex = codepath.lastIndexOf('.');
                    let extendname = "";
                    if (extendnameindex !== -1) {
                        extendname = codepath.substring(extendnameindex + 1);
                    }
                    let type = ['cpp', 'h'].includes(extendname) ? 'cpp' : ''
                    let from = {};
                    from.code = codepath.substring(codepath.lastIndexOf('/') + 1);
                    window.app.setEditorText(strData, type, from, codepath);
                    let selectRange = self.selectRange;
                    if (selectRange != undefined) {
                        source.revealRangeInCenter(selectRange);
                        source.setPosition(new monaco.Position(selectRange.startColumn,selectRange.startColumn));
                        source.setSelection(selectRange);
                    }
                    if (self.backStack.length > 0)
                    {
                        let lastback = self.backStack[self.backStack.length - 1];
                        if (lastback.uri != back.uri || lastback.position != back.position)
                        self.backStack.push(back)
                    }
                    else{
                        self.backStack.push(back);
                    }
                    self.selectRange = new monaco.Range(1,1,1,1);
                    self.forwardStack = [];
                }
            }, "text");
            window.app.updateTitle();

            return result; // always return the base result
        };
    }

    getEditor() {
        return this.editor;
    }

    addNewModel(id, code, language, path, onDidChangeContent) {
        if (!this.editor) {
            this.createEditor();
        }
        console.log(path)
        if (!this.data.hasOwnProperty(id)) {
            let model = monaco.editor.createModel(code, DefaluLanguage, path);
            let model_info = { id: id, model: model };
            model.onDidChangeContent((event) => {
                if (!model_info.changed) {
                    model_info.changed = true;
                    if (onDidChangeContent) {
                        onDidChangeContent();
                    }
                }
            });
            this.data[id] = model_info;
            return model_info;
        }
        return this.data[id];
    }

    modelExists(path) {
        let cppPath = path + '.cpp'
        let info = undefined
        Object.keys(this.data).map(key => {
            if (cppPath.includes(this.data[key].path + '.cpp')) {
                info = this.data[key]
            }
        })
        return info;
    }

    getModelByUri(path)
    {
        let cppPath = path + '.cpp'
        let model = undefined
        Object.keys(this.data).map(key => {
            if (cppPath.includes(this.data[key].path + '.cpp')) {
                model = this.data[key].model;
            }
        })
        return model;
    }

    getModel(id) {
        if (id) {
            return this.data[id];
        }
        return null;
    }

    selectModel(id) {
        if (!this.editor) return;
        let model_info = this.data[id];
        if (model_info) {
            this.editor.setModel(model_info.model);
            if (model_info.state) {
                this.editor.restoreViewState(model_info.state);
            }
            this.editor.focus();
        }
    }

    unselectModel(id) {
        if (!this.editor) return;
        let model_info = this.data[id];
        if (model_info) {
            model_info.state = this.editor.saveViewState();
        }
    }

    deleteModel(id) {
        if (!this.editor) return;
        let model_info = this.data[id];
        if (model_info) {
            let curr_model = this.editor.getModel();
            if (curr_model === model_info.model) {
                this.editor.setModel(null);
            }
            this.data[id].model.dispose();
            delete this.data[id];
        }
    }

    layout(width, height) {
        if (!this.editor) return;
        this.editor.layout({ width: width, height: height });
    }

    revealText(text) {
        if (this.editor) {
            let model = this.editor.getModel();
            let matches = model.findMatches(text);
            if (matches.length > 0) {
                let range = matches[0].range;
                this.editor.setSelection(range);
                this.editor.revealRangeInCenter(range);
            }
        }
    }

    createCompletion(completion) {
    }

    removeKeybinding(editor, id) {
        editor._standaloneKeybindingService.addDynamicKeybinding(`-${id}`, undefined, () => { })
    }

    backToBeforePosition()
    {
        if (this.backStack.length < 1) return;
        let self = this;
        let back = this.backStack[this.backStack.length - 1];
        let forward = { 
            uri : this.editor.getModel().uri,
            position : this.editor.getPosition()
        }
        self.forwardStack.push(forward);
        let codepath = back.uri;
        IKFFileIO_Type.instance.asyncLoadFile(codepath, function (ret, data, codepath) {
            if (ret) {
                let strData = data.toString();
                let extendnameindex = codepath.lastIndexOf('.');
                let extendname = "";
                if (extendnameindex !== -1) {
                    extendname = codepath.substring(extendnameindex + 1);
                }
                let type = ['cpp', 'h'].includes(extendname) ? 'cpp' : ''
                let from = {};
                from.code = codepath.substring(codepath.lastIndexOf('/') + 1);
                window.app.setEditorText(strData, type, from, codepath);
                self.editor.setPosition(back.position)
                self.editor.revealPositionInCenter(back.position); 
            }
        }, "text");
        self.backStack.pop()
    }
    
    forwardPosition()
    {
        if (this.forwardStack.length < 1) return;
        let self = this;
        let forward = this.forwardStack[this.forwardStack.length - 1];
        let back = { 
            uri : this.editor.getModel().uri,
            position : this.editor.getPosition()
        }
        self.backStack.push(back);
        let codepath = forward.uri;
        IKFFileIO_Type.instance.asyncLoadFile(codepath, function (ret, data, codepath) {
            if (ret) {
                let strData = data.toString();
                let extendnameindex = codepath.lastIndexOf('.');
                let extendname = "";
                if (extendnameindex !== -1) {
                    extendname = codepath.substring(extendnameindex + 1);
                }
                let type = ['cpp', 'h'].includes(extendname) ? 'cpp' : ''
                let from = {};
                from.code = codepath.substring(codepath.lastIndexOf('/') + 1);
                window.app.setEditorText(strData, type, from, codepath);
                self.editor.setPosition(forward.position)
                self.editor.revealPositionInCenter(forward.position); 
            }
        }, "text");
        self.forwardStack.pop()
    }

}