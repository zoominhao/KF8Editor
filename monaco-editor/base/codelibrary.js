class CodeLibrary {
    constructor(paths, types) {
        let self = this;
        this.paths = paths;
        this.types = types
        this.Event = new PIXI.utils.EventEmitter();
        this.data = null;
        this.fileid = 0;
        this.fileids = {};
        this.states = {};
        this.codeonly = false;
        this.searching = false;
        this.ui = $('#codelibtree');
        this.foldernodemenu = $('#foldernodemenu');
        this.blknodemenu = $('#blknodemenu');
        this.blkchildfoldernodemenu = $('#blkchildfoldernodemenu');
        this.codenodemenu = $('#codenodemenu');
        this.ui.tree({
            filter: function (q, node) {
                return node.text.toLowerCase().indexOf(q.toLowerCase()) >= 0;
            },
            onDblClick: function (node) {
                self.Event.emit('onDblClick', node);
            },
            onContextMenu: function (e, node) {
                e.preventDefault();
                self.contextmenunode = node;
                let currmenu = null;
                if (node.asseturl) {
                    if (!node.code) {
                        currmenu = self.blknodemenu;
                    } else {
                        currmenu = self.codenodemenu;
                    }
                } else {
                    if (node.childfolderofblk) {
                        currmenu = self.blkchildfoldernodemenu;
                    } else {
                        currmenu = self.foldernodemenu;
                    }
                }
                if (currmenu) {
                    currmenu.menu('show', {
                        left: e.pageX,
                        top: e.pageY
                    });
                }
            },
            onExpand: function (node) {
                if (!self.searching) {
                    self.states[node.path] = true;
                }
            },
            onCollapse: function (node) {
                if (!self.searching) {
                    self.states[node.path] = false;
                }
            }
        });
    }

    getFileID(path) {
        if (this.fileids.hasOwnProperty(path)) {
            return this.fileids[path];
        }
        ++this.fileid;
        this.fileids[path] = this.fileid;
        return this.fileid;
    }

    SetSearching(flag) {
        this.searching = flag;
    }

    DoFilter(value) {
        this.ui.tree('doFilter', value);
        this.ui.tree("expandAll");
    }

    SetCodeOnly(flag) {
        this.codeonly = flag;
    }

    GetData() {
        return this.data;
    }

    getSelectedPath() {
        let selectpath = "";
        let node = this.ui.tree('getSelected');
        if (node) selectpath = node.path;
        return selectpath;
    }

    ExpandByPath(path) {
        if (this.fileids.hasOwnProperty(path)) {
            let node = this.ui.tree('find', this.fileids[path]);
            if (node) {
                this.ui.tree('expandTo', node.target);
                // scrollTo不起作用
                // this.ui.tree('scrollTo', node.target);
                this.ui.tree('select', node.target);
            }
        }
    }

    Refresh(callback) {
        let self = this;
        let selectedpath = this.getSelectedPath();
        this.SearchFolder(GetAppPath() + "/tool/CompileVMCode/include", function (ret0, paths0) {
            if (paths0 && paths0[0]) {
                paths0[0].text = '公共头文件';
            }
            self.SearchFolder(self.paths.kfdpath.replace("KFD", "Include/Generated"), function (ret1, paths1) {
                if (paths1 && paths1[0]) {
                    paths1[0].text = '生成头文件';
                }
                paths0.push.apply(paths0, paths1);
                self.SearchFolder(self.paths.appdatapath, function (ret2, paths2) {
                    self.data = paths2;
                    paths0.push.apply(paths0, paths2);
                    self.ui.tree({data: paths0});
                    self.ExpandByPath(selectedpath);
                    if (callback) callback();
                }, self.states);
            }, self.states, true);
        }, this.states, true);
    }

    SearchFolder(seachpath, endfunc, statesmap, notblk = false) {
        let self = this;
        seachpath = seachpath.replace(/\\/g, "/");

        let allpaths = [];
        let dirmap = {};

        let PushSort = function (a, v) {
            let i = 0;
            for (; i < a.length; ++i) {
                if (v['text'].localeCompare(a[i]['text']) < 0) {
                    break;
                }
            }
            return i;
        }

        let getOrCreateDirObj = function (dir, childofblk = false) {
            let parentobj = dirmap[dir];
            if (!parentobj) {
                let dirarr = dir.split("/");
                parentobj = null;
                let cdir = "";

                for (let i = 0; i < dirarr.length; i++) {
                    let dirname = dirarr[i];
                    cdir = (cdir === "" ? "" : (cdir + "/")) + dirname;
                    let tmpdiro = dirmap[cdir];

                    if (!tmpdiro) {
                        let path = ((parentobj ? parentobj.path : seachpath) + "/" + dirname);
                        if (childofblk) path = path.replaceAll('.blk', '/Code');
                        tmpdiro = {
                            text: dirname
                            , path: path
                            , id: self.getFileID(path)
                            , children: []
                            , state: "closed"
                            , childfolderofblk: childofblk
                        };

                        if (statesmap && statesmap[tmpdiro.path]) {
                            tmpdiro["state"] = "open";
                        }

                        let myArray = null;
                        if (parentobj) {
                            //parentobj.children.push(tmpdiro);
                            myArray = parentobj.children;
                            if (!myArray) {
                                myArray = [];
                                parentobj.children = myArray;
                            }
                        } else {
                            //allpaths.push(tmpdiro);
                            myArray = allpaths;
                        }

                        let pos = PushSort(myArray, tmpdiro);
                        myArray.splice(pos, 0, tmpdiro);

                        dirmap[cdir] = tmpdiro;
                    }

                    parentobj = tmpdiro;
                }
            }
            return parentobj;
        }

        let searchBlkCodeMethods = {
            blkfiles: [],
            codedirs: {},
            codefiles: {},
            iteratePath: function (path, isdir) {
                if (!isdir) {
                    let lindex = path.lastIndexOf("/");
                    let filename = path.substr(lindex + 1);
                    //console.log(str.substr(0,lindex));

                    if (filename.indexOf(".blk") !== -1) {
                        this.blkfiles.push({
                            text: filename
                            , path: path
                            , children: []
                            , state: "closed"
                            , id: self.getFileID(path)
                            , asseturl: path.replace(seachpath + '/', "")
                        });
                    } else {
                        let type = self.matchType(filename);
                        if (type) {
                            let codeindex = path.indexOf('/Code');
                            while (codeindex !== -1) {
                                let blkpath = path.substr(seachpath.length + 1, codeindex - seachpath.length - 1);
                                if (blkpath) {
                                    blkpath += '.blk';
                                    let codefilelist = null;
                                    if (this.codefiles.hasOwnProperty(blkpath)) {
                                        codefilelist = this.codefiles[blkpath];
                                    } else {
                                        codefilelist = [];
                                        this.codefiles[blkpath] = codefilelist;
                                    }
                                    let codefileinfo = {
                                        text: filename
                                        , path: path
                                        , asseturl: blkpath
                                        , code: type
                                        , codeurl: path.replace(seachpath + '/', "")
                                    };
                                    codefilelist.push({
                                        logicpath: blkpath + path.substring(codeindex + 5, lindex),
                                        nodeinfo: codefileinfo
                                    });
                                }
                                codeindex = path.indexOf('/Code', codeindex + 5);
                            }
                        }
                    }
                } else {
                    let codeindex = path.indexOf('/Code');
                    while (codeindex !== -1) {
                        let blkpath = path.substr(seachpath.length + 1, codeindex - seachpath.length - 1);
                        if (blkpath) {
                            blkpath += '.blk';
                            let codedirlist = null
                            if (this.codedirs.hasOwnProperty(blkpath)) {
                                codedirlist = this.codedirs[blkpath];
                            } else {
                                codedirlist = [];
                                this.codedirs[blkpath] = codedirlist;
                            }
                            codedirlist.push(blkpath + path.substring(codeindex + 5));
                        }
                        codeindex = path.indexOf('/Code', codeindex + 5);
                    }
                }
            },
            pushtodir: function (dir, fileinfo) {
                if (self.codeonly && !this.codefiles.hasOwnProperty(fileinfo.asseturl)) {
                    return;
                }

                let parentobj = getOrCreateDirObj(dir);

                if (fileinfo.text !== "__init__.blk") {
                    let pos = PushSort(parentobj.children, fileinfo);
                    parentobj.children.splice(pos, 0, fileinfo);
                    dirmap[fileinfo.asseturl] = fileinfo;
                    if (this.codefiles.hasOwnProperty(fileinfo.asseturl)) {
                        let codefilelist = this.codefiles[fileinfo.asseturl];
                        if (codefilelist && codefilelist.length > 0) {
                            for (let codefileinfo of codefilelist) {
                                codefileinfo.nodeinfo.id = self.getFileID(codefileinfo.nodeinfo.path);
                                let codefileparent = getOrCreateDirObj(codefileinfo.logicpath, true);
                                if (codefileparent && codefileparent.children) {
                                    let pos = PushSort(codefileparent.children, codefileinfo.nodeinfo);
                                    codefileparent.children.splice(pos, 0, codefileinfo.nodeinfo);
                                }
                            }
                        }
                    }
                    if (this.codedirs.hasOwnProperty(fileinfo.asseturl)) {
                        for (let item of this.codedirs[fileinfo.asseturl]) {
                            getOrCreateDirObj(item, true);
                        }
                    }
                }
            },
            iterateEnd: function () {
                for (let fileinfo of this.blkfiles) {
                    let index = fileinfo.asseturl.lastIndexOf('/');
                    let blkdirpath = fileinfo.asseturl.substr(0, index);
                    if (blkdirpath) {
                        this.pushtodir(blkdirpath, fileinfo);
                    }
                }
            }
        }

        let searchNormalCodeMethods = {
            codefiles: [],
            iteratePath: function (path, isdir) {
                if (!isdir) {
                    let lindex = path.lastIndexOf("/");
                    let filename = path.substr(lindex + 1);

                    let type = self.matchType(filename);
                    if (type) {
                        this.codefiles.push ({
                            text: filename
                            , path: path
                            , code: type
                            , codeurl: path.replace(seachpath + '/', "")
                        });
                    }
                }
            },
            pushtodir: function (dir, fileinfo) {
                let parentobj = getOrCreateDirObj(dir);
                fileinfo.id = self.getFileID(fileinfo.path);
                if (parentobj && parentobj.children) {
                    let pos = PushSort(parentobj.children, fileinfo);
                    parentobj.children.splice(pos, 0, fileinfo);
                }
            },
            iterateEnd: function () {
                for (let fileinfo of this.codefiles) {
                    let index = fileinfo.codeurl.lastIndexOf('/');
                    let filedirpath = fileinfo.codeurl.substr(0, index);
                    this.pushtodir(filedirpath, fileinfo);
                }
            }
        }

        let searchMethods = searchBlkCodeMethods;
        if (notblk) searchMethods = searchNormalCodeMethods;

        IKFFileIO_Type.instance.asyncIteratePaths(seachpath, true
            , function (path, isdir) {
                path = path.replace(/\\/g, "/");
                searchMethods.iteratePath(path, isdir);
            },
            function (ret, data, path) {
                if (path === "" && endfunc) {
                    searchMethods.iterateEnd();
                    endfunc(ret, allpaths);
                }
            });
    }

    matchType(name) {
        if (this.types) {
            for (let i = 0; i < this.types.length; ++i) {
                let type = this.types[i];
                if (name.indexOf('.' + type) !== -1) {
                    return type;
                }
            }
        }
        return null;
    }

    GetFolderPathFromMenuContext(code = false) {
        let path = "";
        if (this.contextmenunode) {
            if (this.contextmenunode.asseturl) {
                if (this.contextmenunode.code) {
                    let index = this.contextmenunode.path.lastIndexOf('/');
                    path = this.contextmenunode.path.substring(0, index);
                } else {
                    if (code) {
                        path = this.contextmenunode.path.replace('.blk', '/Code');
                    } else {
                        let index = this.contextmenunode.path.lastIndexOf('/');
                        path = this.contextmenunode.path.substring(0, index);
                    }
                }
            } else {
                path = this.contextmenunode.path;
            }
        }
        return path;
    }

    GetParentFolderFromMenuContext() {
        let path = this.GetFolderPathFromMenuContext(true);
        if (path && this.contextmenunode && !this.contextmenunode.code) {
            let index = path.lastIndexOf('/');
            if (index !== -1) {
                path = path.substring(0, index);
            }
        }
        return path;
    }

    OpenFolderFromMenuContext(code = false) {
        let path = this.GetFolderPathFromMenuContext(code);
        if (path) {
            if (!fileExists(path)) {
                Alert("失败", "文件夹" + path + "不存在！");
                return;
            }
            OpenFolder(path);
        }
    }

    CreateFolderFromMenuContext() {
        if (this.contextmenunode) {
            if ((this.contextmenunode.asseturl && !this.contextmenunode.code) ||
                (!this.contextmenunode.asseturl && this.contextmenunode.childfolderofblk)) {
                let path = this.GetFolderPathFromMenuContext(true);
                if (!path) return;
                Prompt('创建文件夹', '请输入文件夹名：', null, function (val) {
                    let newdir = path + "/" + val;
                    IKFFileIO_Type.instance.asyncCreateDir(newdir, function (ret) {
                        if (ret) {
                            Msg('<span style="color:yellow">创建文件夹' + newdir + '成功!</span>', 2, "消息", 600);
                            self.Refresh();
                        } else {
                            Alert("创建文件夹失败", "创建文件夹" + newdir + "失败！");
                        }
                    });
                });
            }
        }
    }

    CreateCodeFileFromMenuContext() {
        let self = this;
        if (this.contextmenunode) {
            if ((this.contextmenunode.asseturl && !this.contextmenunode.code) ||
                (!this.contextmenunode.asseturl && this.contextmenunode.childfolderofblk)) {
                let path = this.GetFolderPathFromMenuContext(true);
                if (!path) return;
                Prompt('创建代码文件', '请输入文件名：', null, function (val) {
                    if (!self.matchType(val)) {
                        Alert("创建文件失败", "不支持的文件类型！只支持[.cpp, .h]");
                        return;
                    }
                    let newpath = path + "/" + val;
                    if (!fileExists(newpath)) {
                        IKFFileIO_Type.instance.asyncSaveFile(newpath, '', function (ret) {
                            if (ret) {
                                Msg('<span style="color:yellow">创建文件' + newpath + '成功!</span>', 2, "消息", 600);
                                self.Refresh();
                            } else {
                                Alert("创建文件失败", "创建文件" + newpath + "失败！");
                            }
                        });
                    } else {
                        Alert("创建文件失败", "文件" + newpath + "已存在！");
                    }
                });
            }
        }
    }

    RenameFromMenuContext() {
        let self = this;
        if (this.contextmenunode) {
            let path = this.GetParentFolderFromMenuContext(true);
            if (!path) return;
            let rename = function (val) {
                let newpath = path + "/" + val;
                apifs.rename(self.contextmenunode.path, newpath, function (err) {
                    if (!err) {
                        Msg('<span style="color:yellow">重命名成功!</span>['
                            + self.contextmenunode.path + ' -> ' + newpath + ']', 2, "消息", 600);
                        self.Refresh();
                    } else {
                        Alert("重命名失败", '重命名[' + self.contextmenunode.path + ' -> ' + newpath + "]失败！");
                    }
                });
            }
            if (this.contextmenunode.asseturl && this.contextmenunode.code) {
                Prompt('重命名', '请输入新文件名：', null, function (val) {
                    if (val.indexOf('/') !== -1 && !self.matchType(val)) {
                        Alert("重命名文件失败", "不支持的文件类型！只支持[.cpp, .h]");
                        return;
                    }
                    rename(val);
                });
            } else if (!this.contextmenunode.asseturl && this.contextmenunode.childfolderofblk) {
                Prompt('重命名', '请输入新目录名：', null, function (val) {
                    if (val.indexOf('/') !== -1) {
                        Alert("重命名目录失败", "不支持路径！");
                        return;
                    }
                    rename(val);
                });
            }
        }
    }

    DeleteFromMenuContext() {
        let self = this;
        if (this.contextmenunode) {
            let rm = function () {
                apifs.rm(self.contextmenunode.path, {recursive: true}, function (err) {
                    if (!err) {
                        Msg('<span style="color:yellow">删除成功!</span>['
                            + self.contextmenunode.path + ']', 2, "消息", 600);
                        self.Refresh();
                    } else {
                        Alert("删除失败", '删除[' + self.contextmenunode.path + "]失败！");
                    }
                });
            }
            if ((this.contextmenunode.asseturl && this.contextmenunode.code) ||
                (!this.contextmenunode.asseturl && this.contextmenunode.childfolderofblk)) {
                Confirm('删除', '确认删除吗？', function () {
                    rm();
                });
            }
        }
    }

    EmitEventFromMenuContext(evt) {
        this.Event.emit(evt, this.contextmenunode);
    }
}