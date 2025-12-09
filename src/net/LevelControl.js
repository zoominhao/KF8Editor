function LevelControl(kfApp, kfdTable) {
    this.kfApp = kfApp;
    this.level = null;
    this.levelActors = [];
    this.levelUiData = null;
    this.disposed = false;
    LevelControl.LevelBlkPath = 'App/Level/';
    this.kfdEdtWindow = new KFDEdtWrapWindow($('#kfdEdtWin'), kfdTable);
    this.offlineRpcMgr = _global.editor.network?.rpcobjsoffline;
    this.DelSomeObjFunc = function (delObj) {
        if (this.levelUiData == null || delObj.__cls__ != 'KF8EditNetUEEditorLevelActor') return;
        for (let i = 0; i != this.levelUiData.children.length; i++) {
            let uChild = this.levelUiData.children[i];
            if (uChild.value.guid == delObj.guid) {
                this.kfApp.blkattrib.RemoveArrayData(uChild.id);
                break;
            }
        }
    };
    this.AddSomeObjFunc = function (newObj) {
        switch (newObj.__cls__) {
            case 'KF8EditNetUEEditorLevel':
                if (this.level == null || this.level.value.guid != newObj.guid) {
                    newObj.RegisterRpc("SaveSceneDataBlk", function (scene_name) {
                        console.log("SaveSceneDataBlk" + scene_name);
                    });
                    this.level = null;
                    this.levelUiData = null;
                    this.kfApp.blkattrib.Edit(null);
                }
                break;
            case 'KF8EditNetUEEditorLevelActor':
                if (this.levelUiData == null) return;
                let exist = false;
                for (let i = 0; i != this.levelUiData.children.length; i++) {
                    exist = false;
                    let uChild = this.levelUiData.children[i];
                    if (uChild.value.guid == newObj.guid) {
                        exist = true;
                        break;
                    }
                }
                if (exist == false) {
                    this.NewBlockUIObj(this.levelUiData, newObj);
                }
                break;
        }
    };
    this.OnNameChangedFunc = function (obj) {
        if (this.levelUiData == null) return;
        for (let i = 0; i != this.levelUiData.children.length; i++) {
            let uChild = this.levelUiData.children[i];
            if (uChild.value.guid == obj.guid && uChild.value.targetData.instname != obj.Name) {
                this.SyncObjName(uChild, obj);
                break;
            }
        }
    }
    if (this.offlineRpcMgr) {
        this.offlineRpcMgr.objmgr.Event.on("OnNetObjDestroy", this.DelSomeObjFunc.bind(this));
        this.offlineRpcMgr.objmgr.Event.on("OnNetObjAdd", this.AddSomeObjFunc.bind(this));
        this.offlineRpcMgr.objmgr.Event.on("OnNameChanged", this.OnNameChangedFunc.bind(this));
    }
}

LevelControl.prototype.Dispose = function () {
    if (this.disposed) {
        console.error("Level Control had been disposed!");
        return;
    }
    this.disposed = true;
    if (this.offlineRpcMgr) {
        this.offlineRpcMgr.objmgr.Event.off("OnNetObjDestroy", this.DelSomeObjFunc.bind(this));
        this.offlineRpcMgr.objmgr.Event.off("OnNetObjAdd", this.AddSomeObjFunc.bind(this));
        this.offlineRpcMgr.objmgr.Event.off("OnNameChanged", this.OnNameChangedFunc.bind(this));
    }
    this.kfApp = null;
    this.level = null;
    this.levelActors = null;
    this.levelUiData = null;
    this.kfdEdtWindow = null;
    this.offlineRpcMgr = null;
}

LevelControl.prototype.SyncObjName = function (uChild, Value) {
    if (this.levelUiData) {
        // let src = uChild._src[0];
        // src.targetData.instname = new parent['KFDName'](Value.Name);
        uChild.value.targetData.instname = new parent['KFDName'](Value.Name);
        this.kfApp.blkattrib.UpdateUIData(uChild, uChild.value);
        this.kfApp.blkattrib.UpdateAllNode(uChild);
    }
}

LevelControl.prototype.OpenSomeNode = function (node) {
    let levelCtrl = this;
    if (node.value.__cls__ == 'KF8EditNetUEEditorLevel') {
        ///编辑 关卡Blk
        levelCtrl.OpenLevel(node);
        return true;
    } else if (node.value.__cls__ == 'KF8EditNetUEEditorLevelActor') {
        //编辑关卡Actor
        if (levelCtrl.level == null || levelCtrl.kfApp.editNode != levelCtrl.level) {
            let parentId = node.value.ParentID;
            let robjs = levelCtrl.offlineRpcMgr.remoteobjects;
            let parentNode = FindNodeWithID(parentId, robjs);
            levelCtrl.OpenLevel(parentNode, function (t) {
                if (t)
                    levelCtrl.EditLevelActor(node);
            });
        } else
            levelCtrl.EditLevelActor(node);
        return true;
    }
    return false;

    function FindNodeWithID(id, pool) {
        let len = pool.length;
        for (let i = 0; i != len; i++) {
            if (pool[i].id == id) {
                return pool[i];
                break;
            }
        }
    }
}

LevelControl.prototype.OpenLevel = function (levelNode, onComplete) {
    let levelCtrl = this;
    let newblkName = levelNode.value.Name;
    let path = LevelControl.LevelBlkPath + newblkName + '.blk';
    if (LevelControl.IsBlkPathValid(path) == false) {
        let newblkType = 'KF8LevelLogic';
        Prompt('Question', '未在指定路径(' + path + ')找到该文件，是否创建？或指定已存在文件路径', null, function (newblkPath) {
            if (newblkPath.endsWith('.blk')) {
                if (LevelControl.IsBlkPathValid(newblkPath)) {
                    SetValidLevel(newblkPath, levelNode);
                } else {
                    levelCtrl.kfApp.context.CreateBlk(newblkName, newblkType, LevelControl.LevelBlkPath, function (t) {
                        Msg(t ? '文件创建成功:' : '文件创建失败:' + path);
                        if (!t) return;
                        SetValidLevel(newblkPath, levelNode, onComplete);
                    });
                }
            } else {
                Msg('当前路径为无效的文件路径：' + path);
                if (onComplete)
                    onComplete(false);
            }
        }, function () {
            if (onComplete)
                onComplete(false);
        }, path);

        return;
    }
    SetValidLevel(path, levelNode, onComplete);

    function SetValidLevel(_path, _levelNode, _callback) {
        levelNode.path = _path + '?' + _levelNode.path.split('?')[1];
        levelCtrl.level = _levelNode;
        levelCtrl.kfApp.EditorOpen(_levelNode, function (t, blkdata, blkpath) {
            if (levelCtrl.level) {
                //寻找level的kfEditor的uidata
                if (levelCtrl.kfApp.blkattrib) {
                    let buildDatas = levelCtrl.kfApp.blkattrib.builddatas;
                    let keys = Object.keys(buildDatas);
                    let len = keys.length;
                    for (let i = 0; i != len; i++) {
                        let key = keys[i];
                        let uiData = buildDatas[key];
                        if (uiData._prop && uiData._prop.name == 'blocks') {
                            levelCtrl.levelUiData = uiData;
                            break;
                        }
                    }
                }

                let exist = false;
                ////从现有UI数据中剔除nodes中不存在的
                if (levelCtrl.levelUiData.children) {
                    for (let i = 0; i != levelCtrl.levelUiData.children.length;) {
                        exist = false;
                        let uChild = levelCtrl.levelUiData.children[i];
                        if (levelCtrl.level.children)
                            for (let j = 0; j != levelCtrl.level.children.length; j++) {
                                let dChild = levelCtrl.level.children[j];
                                if (uChild.value.guid == dChild.value.guid) {
                                    exist = true;
                                    if (uChild.value.targetData.instname != dChild.value.Name && uChild._src && uChild._src.length > 0) {
                                        levelCtrl.SyncObjName(uChild, dChild.value);
                                    }
                                    break;
                                }
                            }
                        if (exist == false) {
                            levelCtrl.kfApp.blkattrib.RemoveArrayData(uChild.id);
                            continue;
                        }
                        i++;
                    }
                }
                ///新增Nodes中存在UI数据中不存在的
                if (levelCtrl.level.children)
                    for (let i = 0; i != levelCtrl.level.children.length; i++) {
                        exist = false;
                        let dChild = levelCtrl.level.children[i];
                        if (levelCtrl.levelUiData.children)
                            for (let j = 0; j != levelCtrl.levelUiData.children.length; j++) {
                                let uChild = levelCtrl.levelUiData.children[j];
                                if (uChild.value.guid == dChild.value.guid) {
                                    exist = true;
                                    break;
                                }
                            }
                        if (exist == false) {
                            levelCtrl.NewBlockUIObj(levelCtrl.levelUiData, dChild.value);
                        }
                    }
            }
            if (_callback)
                _callback(t, blkdata, blkpath);
        });

    }
}

LevelControl.prototype.NewBlockUIObj = function (parentUI, nodeVal, instsBlockSrc) {

    let blockUiObj = this.kfApp.blkattrib.AddArrayData(parentUI.id, 'KF8InstInitBlockData');
    let nameID = new parent['KFDName'](nodeVal.Name);
    instsBlockSrc = {
        __cls__: 'KF8InstInitBlockData',
        guid: nodeVal.guid,
        targetData: {option: 1, instname: nameID, asseturl: nodeVal.Path}
    };
    let parentSrc = parentUI._src;
    let child = parentUI.children[parentUI.children.length - 1];
    parentSrc.blocks[parentSrc.blocks.length - 1] = instsBlockSrc;
    this.kfApp.blkattrib.UpdateUIData(blockUiObj, instsBlockSrc);
    this.kfApp.blkattrib.UpdateAllNode(parentUI);

    return blockUiObj;
}

LevelControl.prototype.EditLevelActor = function (actorNode) {
    if (this.level && this.levelUiData) {
        ///寻找当前编辑的levelActor的块始化数据
        let instsBlockSrc = null;
        // let blockAry = this.levelUiData._src.blocks;
        // if (blockAry == null) {
        //     blockAry = this.levelUiData._src.blocks = [];
        // }
        // if (blockAry && blockAry.length > 0) {
        //     for (let i = 0; i != blockAry.length; i++) {
        //         if (blockAry[i].targetData.instname == actorNode.value.Name) {
        //             instsBlockSrc = blockAry[i];
        //             break;
        //         }
        //     }
        // }

        let blockAry = this.levelUiData.children;
        if (blockAry && blockAry.length > 0) {
            for (let i = 0; i != blockAry.length; i++) {
                let val = blockAry[i].value;
                if (val && val.guid == actorNode.value.guid) {
                    instsBlockSrc = blockAry[i].value;
                    break;
                }
            }
        }


        let blockUiObj = null;
        if (instsBlockSrc == null) {
            //如果始终没找到，新增当前levelActor的块目标数据
            blockUiObj = this.NewBlockUIObj(this.levelUiData, actorNode.value, instsBlockSrc);
        } else {
            for (let i = 0; i != this.levelUiData.children.length; i++) {
                let child = this.levelUiData.children[i];
                if (child.value.guid == instsBlockSrc.guid) {
                    blockUiObj = child;
                    break;
                }
            }
        }
        //打开新的小窗口编辑instsBlockSrc;
        if (this.kfdEdtWindow) {
            this.kfdEdtWindow.open({title: '关卡实例初始化', src: instsBlockSrc, inprops: {"target": {"__state__": "open"}}})
            this.kfdEdtWindow.beforeCloseFunc = function () {
                if (this.levelUiData) {
                    this.kfApp.blkattrib.UpdateUIData(blockUiObj, instsBlockSrc);
                    this.kfApp.blkattrib.UpdateAllNode(this.levelUiData);
                }
            }.bind(this);
        }

    }
    return;
}


LevelControl.IsBlkPathValid = function (path) {
    if (path.startsWith('/') == false)
        path = '/' + path;
    let url = _global.appdatapath + path;
    let bExist = IsBlkExists(url);
    return bExist;

    function IsBlkExists(url) {
        let isExists;
        $.ajax({
            url: url,
            async: false,
            type: 'HEAD',
            error: function () {
                isExists = 0;
            },
            success: function () {
                isExists = 1;
            }
        });
        return isExists == 1;
    }
}