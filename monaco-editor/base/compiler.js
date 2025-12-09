let apifspromises = nodeRequire('fs/promises');
const { execFile } = nodeRequire('child_process')
class Compiler {
    constructor(paths) {
        this.paths = paths;
        this.config = {};
        this.loadCompileConfig();
    }

    loadCompileConfig() {
        let self = this;
        let config_path = this.paths.kfdpath.replace('KFD', 'Code') + '/CompileConfig.json';
        IKFFileIO_Type.instance.asyncLoadFile(config_path, function (ret, data, path) {
            if (ret) {
                let strData = data.toString();
                self.config = JSON.parse(strData);
                if (self.config) return;
            }
            Alert('加载编译配置失败！',
                config_path + '\n请确保配置文件有效！如果没有配置，编译数据将生成到各blk目录下!');
        }, "text");
    }

    getCompileItem(asseturl)  {
        let ret = null;
        if (this.config.hasOwnProperty(asseturl)) {
            ret = this.config[asseturl];
            ret.asseturl = asseturl;
        } else {
            let inPath = function (asseturl, path) {
                return asseturl.indexOf(path) === 0;
            }
            for (let key in this.config) {
                let item = this.config[key];
                if (item && item.nodes) {
                    for (let path of item.nodes) {
                        if (inPath(asseturl, path)) {
                            ret = item;
                            ret.asseturl = key;
                            if (ret.nodes.indexOf(key) === -1) {
                                ret.nodes.push(asseturl);
                            }
                            break;
                        }
                    }
                    if (ret) break;
                }
            }
            if (!ret) {
                ret = {asseturl: asseturl, nodes: [asseturl]};
            }
        }
        return ret;
    }

    hasCodeFile(node) {
        if (node && node.children) {
            for (let child of node.children) {
                if (child.code === 'cpp') return true;
                else if (this.hasCodeFile(child)) {
                    return true;
                }
            }
        }
        return false;
    }

    queryBlkFiles(node, files, allfiles) {
        if (node) {
            if (node.asseturl && !node.code) {
                if (!files.includes(node)) {
                    if (allfiles) allfiles.push(node);
                    if (this.hasCodeFile(node)) {
                        files.push(node);
                    }
                }
            } else if (node.children && !node.childfolderofblk) {
                for (let child of node.children) {
                    this.queryBlkFiles(child, files, allfiles);
                }
            }
        }
    }

    compileItem(item, nodes, callback) {
        if (!item || !item.nodes || !nodes) return;
        let asseturl = item.asseturl;
        let getNodeByPath = function (path) {
            let nodestoselect = nodes;
            let currnode = null;
            let parts = path.split('/');
            for (let part of parts) {
                currnode = null;
                if (nodestoselect) {
                    for (let node of nodestoselect) {
                        if (part === node.text) {
                            currnode = node;
                            nodestoselect = node.children;
                            break;
                        }
                    }
                }
                if (!currnode) break;
            }
            return currnode;
        }
        let allblkfiles = [];
        let codeblkfiles = [];
        for (let path of item.nodes) {
            let node = getNodeByPath(path);
            this.queryBlkFiles(node, codeblkfiles, allblkfiles);
        }
        let codePaths = [];
        for (let file of codeblkfiles) {
            codePaths.push(file.path.replace('.blk', '/Code'));
        }
        let self = this;
        this.runCompile(asseturl, codePaths, function (err) {
            if (err) {
                $.messager.alert({
                    title: "编译失败！",
                    msg:'<div style="color: red"><pre>'
                        + err.replaceAll('<', '&lt;').replaceAll('>', '&gt;')
                        + "</pre></div>",
                    width: 600,
                    height: 480,
                    resizable: true
                });
                if (callback) callback(err);
            } else {
                let nocodeblks = [];
                allblkfiles.forEach(node => {
                    if (node && node.asseturl !== asseturl) {
                        nocodeblks.push(node.asseturl);
                    }
                });
                self.updateRefs(nocodeblks, [asseturl]).then(function () {
                    Msg('<span style="color:yellow">编译成功!' + '[' + asseturl + ']</span>' , 2, "消息", 600);
                    if (callback) callback(err);
                }).catch(function (e) {});
            }
        });
    }

    async CompileAsseturls(asseturls, nodes) {
        if (asseturls.length === 0) return;
        let self = this;
        let compileitemcache = new Set();
        let compileitems = [];
        for (let i = 0; i < asseturls.length; ++i) {
            let item = this.getCompileItem(asseturls[i]);
            if (!item || !item.nodes || !item.asseturl) continue;
            if (compileitemcache.has(item.asseturl)) continue;
            compileitemcache.add(item.asseturl);
            compileitems.push(item);
        }
        let len = compileitems.length;
        let progress = false;
        if (len > 1) {
            progress = true;
        }
        let haserr = false;
        for (let j = 0; j < len; ++j) {
            let item = compileitems[j];
            let asseturl = item.asseturl;
            if (progress) {
                $.messager.progress({title: "编译中...", interval: 0, msg: asseturl});
                $.messager.progress('bar').progressbar('setValue', parseInt(j * 100 / len));
            } else {
                $.messager.progress({title: "编译中...", msg: asseturl});
            }
            let err = await new Promise(function (resolve) {
                self.compileItem(item, nodes, function (err) {
                    resolve(err);
                }, progress);
            });
            if (err) {
                haserr = true;
                break;
            }
        }
        if (!haserr) {
            ipcRenderer.send('GlobalEvent', 'LoadCodeStates');
        }

        try { $.messager.progress('close'); } catch (e) {}
    }

    CompileNode(node, nodes) {
        let self = this;
        let asseturls = [];
        if (node.asseturl) {
            asseturls.push(node.asseturl);
        } else if (!node.childfolderofblk) {
            let blkfiles = [];
            this.queryBlkFiles(node, blkfiles, null);
            if (blkfiles.length === 0) return;
            let len = blkfiles.length;
            for (let i = 0; i < len; ++i) {
                asseturls.push(blkfiles[i].asseturl);
            }
        }
        if (asseturls.length > 0) {
            this.CompileAsseturls(asseturls, nodes).catch(e => {});
        }
    }

    runCompile(asseturl, codepaths, callback) {
        let apppath = GetAppPath();
        if (apppath.indexOf("/app.asar") !== -1 || apppath.indexOf("\\app.asar") !== -1) {
            apppath = apppath.replace("/app.asar", "").replace("\\app.asar", "");
        }
        let exepath = apppath + "/tool/Python39/python";
        let editoronlydir = this.paths.kfdpath.replace('KFD', '');
        let blkdatadir = asseturl.replace('.blk', '');
        let params = [];
        params.push(apppath + '/tool/CompileVMCode/compile.py');
        // ["AppPath", "IncludePath", "CodePaths", "OutPath", "TmpPath", "TmpOutNamePrefix"]
        params.push(apppath);
        params.push(editoronlydir + '/Include');
        let currpath = this.paths.appdatapath + '/' + blkdatadir + '/Code';
        params.push(codepaths.join('|'));
        params.push(this.paths.appdatapath + '/' + blkdatadir + '/code.data');
        params.push(editoronlydir + '/Code/Tmp');
        params.push(asseturl.replace(/\//g, "_").replace(".blk", ""));
        let exeprocess = execFile(exepath, params, {cwd: currpath}, function(error, stdout, stderr) {
            if (callback) {
                if (error) {
                    callback(error.toString());
                } else {
                    callback();
                }
            }
        });
        let consoleout = function (chunk) {
            let textChunk = chunk.toString('utf8');// buffer to string
            console.log(textChunk.trim());
        }
        exeprocess.stdout.on('data', consoleout);
        exeprocess.stderr.on('data', consoleout);
    }

    async updateRefs(nocodeasseturls, codeasseturls) {
        if (!nocodeasseturls && !codeasseturls) return;
        let asseturlcodes = {};
        if (nocodeasseturls) {
            nocodeasseturls.forEach(asseturl => asseturlcodes[asseturl] = false);
        }
        if (codeasseturls) {
            codeasseturls.forEach(asseturl => asseturlcodes[asseturl] = true);
        }

        for (let asseturl in asseturlcodes) {
            let code = asseturlcodes[asseturl];
            let codedatapath = this.paths.appdatapath + '/' + asseturl.replace('.blk', '/code.data');
            if (!code) {
                await apifspromises.rm(codedatapath, {force: true});
            }
            let refsdata = null;
            let refspath = this.paths.appdatapath + '/Refs/' + asseturl.replace('.blk', '.refs').replaceAll('/', "_");
            await new Promise(function (resolve) {
                IKFFileIO_Type.instance.asyncLoadFile(refspath, function (ret, data, path) {
                    if (ret) {
                        refsdata = JSON.parse(new KFByteArray(data).readstring());
                        if (refsdata && refsdata.info) {
                            if ((!code && refsdata.info.__code__) || (code && !refsdata.info.__code__)) {
                                refsdata.info.__code__ = code;
                            } else {
                                refsdata = null;
                            }
                        }
                    }
                    resolve();
                }, "");
            });
            if (refsdata) {
                let kfbytearr = new KFByteArray();
                kfbytearr.writestring(JSON.stringify(refsdata));
                await new Promise(function (resolve) {
                    IKFFileIO_Type.instance.asyncSaveFile(refspath, new Uint8Array(kfbytearr.buffer),
                        function (ret) {
                            resolve();
                        },
                        function (err) {
                            Alert('保存Refs错误', refspath);
                            resolve();
                        }
                    );
                });
            }
        }

        let allrefsdata = null;
        let allrefspath = this.paths.appdatapath + '/_refs_.data';
        await new Promise(function (resolve) {
            IKFFileIO_Type.instance.asyncLoadFile(allrefspath, function (ret, data, path) {
                if (ret) {
                    allrefsdata = JSON.parse(new KFByteArray(data).readstring());
                }
                resolve();
            }, "");
        });
        if (allrefsdata) {
            let changed = false;
            for (let asseturl in asseturlcodes) {
                let code = asseturlcodes[asseturl];
                if (allrefsdata.hasOwnProperty(asseturl)) {
                    let refsdata = allrefsdata[asseturl];
                    if (refsdata) {
                        if ((!code && refsdata.__code__) || (code && !refsdata.__code__)) {
                            refsdata.__code__ = code;
                            changed = true;
                        }
                    }
                }
            }
            if (changed) {
                let kfbytearr = new KFByteArray();
                kfbytearr.writestring(JSON.stringify(allrefsdata));
                await new Promise(function (resolve) {
                    IKFFileIO_Type.instance.asyncSaveFile(allrefspath, new Uint8Array(kfbytearr.buffer),
                        function (ret) {
                            resolve();
                        },
                        function (err) {
                            Alert('保存Refs错误', allrefspath);
                            resolve();
                        }
                    );
                });
            }
        }

        let codestatesdir = this.paths.kfdpath.replace('KFD', 'Code');
        if (!fileExists(codestatesdir)) {
            await new Promise(function (resolve) {
                IKFFileIO_Type.instance.asyncCreateDir(codestatesdir, function () {
                    resolve();
                });
            })
        }

        let codestatesdata = null;
        let codestatespath = codestatesdir + '/CodeStates.json';
        await new Promise(function (resolve) {
            IKFFileIO_Type.instance.asyncLoadFile(codestatespath, function (ret, data, path) {
                if (ret) {
                    codestatesdata = JSON.parse(data.toString());
                }
                resolve();
            }, "text");
        });
        let codestateschanged = false;
        if (!codestatesdata) {
            codestatesdata = asseturlcodes;
            codestateschanged = true;
        }
        else {
            for (let asseturl in asseturlcodes) {
                let code = asseturlcodes[asseturl];
                if (codestatesdata.hasOwnProperty(asseturl)) {
                    let oldcode = codestatesdata[asseturl];
                    if ((!code && oldcode) || (code && !oldcode)) {
                        codestatesdata[asseturl] = code;
                        codestateschanged = true;
                    }
                }
            }
        }
        if (codestateschanged) {
            await new Promise(function (resolve) {
                IKFFileIO_Type.instance.asyncSaveFile(codestatespath, JSON.stringify(codestatesdata),
                    function (ret) {
                        resolve();
                    },
                    function (err) {
                        Alert('保存错误', codestatespath);
                        resolve();
                    }
                );
            });
        }
    }
}
