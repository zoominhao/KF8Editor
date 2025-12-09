function KF8Coder() {
}

KF8Coder.LoadJsonFile = async function (jsonpath, succcallback) {
    if (!KF8Coder.loadings) {
        KF8Coder.loadings = {}
    }
    if (!KF8Coder.loadings.hasOwnProperty(jsonpath)) {
        KF8Coder.loadings[jsonpath] = 0;
    }
    if (KF8Coder.loadings[jsonpath] > 0) {
        KF8Coder.loadings[jsonpath] += 1;
    } else {
        do {
            KF8Coder.loadings[jsonpath] = 1;
            await new Promise(function (resolve) {
                IKFFileIO_Type.instance.asyncLoadFile(jsonpath, function (ret, data, path) {
                    if (ret && data) {
                        let strData = data.toString();
                        let obj = JSON.parse(strData);
                        if (succcallback) {
                            succcallback(obj);
                        }
                    }
                    KF8Coder.loadings[jsonpath] -= 1;
                    resolve();
                }, "text");
            });
        } while (KF8Coder.loadings[jsonpath] > 0);
    }
}

KF8Coder.LoadCodeExportFunctions = function () {
    let filePath = _global.kfdpath.replace("KFD", "Code/CodeExportFunctions.json");
    KF8Coder.LoadJsonFile(filePath, function (data) {
        if (data) {
            KF8Coder.exportinfo = data;
            _global.codeseldata = KF8Coder.TransCodeExportsToCodeSelData(data);
        }
    }).catch();
}

KF8Coder.LoadCodeStates = function () {
    let filePath = _global.kfdpath.replace("KFD", "Code/CodeStates.json");
    KF8Coder.LoadJsonFile(filePath, function (data) {
        if (data) {
            KF8Coder.statesinfo = data;
        }
    }).catch();
}

KF8Coder.TransCodeExportsToCodeSelData = function (exportInfo) {
    let nodes = [];
    let nodeid = 0;
    let pushSort = function (a, v) {
        let i = 0;
        for (; i < a.length; ++i) {
            if (v['text'].localeCompare(a[i]['text']) < 0) {
                break;
            }
        }
        return i;
    }
    for (let asseturl in exportInfo) {
        if (!exportInfo.hasOwnProperty(asseturl)) continue;
        let codefilelist = exportInfo[asseturl];
        if (!codefilelist) continue;
        ++nodeid;
        let parentnode = {
            text: asseturl,
            children: [],
            id: nodeid
        };
        let parentpos = pushSort(nodes, parentnode);
        nodes.splice(parentpos, 0, parentnode);
        for (let codefile of codefilelist) {
            for (let m of codefile.methods) {
                ++nodeid;
                let node = {
                    text: m,
                    id: nodeid,
                    value: m + '|' + asseturl
                }
                let pos = pushSort(parentnode.children, node);
                parentnode.children.splice(pos, 0, node);
            }
        }
    }
    return nodes;
}

_global.Event.on('ContextComplete', function () {
    KF8Coder.LoadCodeExportFunctions();
    KF8Coder.LoadCodeStates();
})

_global.Event.on('LoadCodeExport', function () {
    KF8Coder.LoadCodeExportFunctions();
});

_global.Event.on('LoadCodeStates', function () {
    KF8Coder.LoadCodeStates();
});

KF8Coder.Process = function (codecontext) {
    if (codecontext && codecontext.asseturl) {
        if (KF8Coder.statesinfo && KF8Coder.statesinfo[codecontext.asseturl]) {
            codecontext.hasCode = true;
        }
    }
}

KF8Coder.SearchCodeAndProcess = function (asseturl, context) {
    if (asseturl) {
        context.LoadBlk(asseturl, function (ret, blkdata, blkpath) {
            let assetrefs = {};
            assetrefs.type = blkdata.blk.type.toString();
            //定义一个代码的上下文为了查找代码方便
            assetrefs.codecontext =
                {
                    global: _global
                    , asseturl: asseturl
                    , codes: []
                    , outpath: blkdata.timelinepath ?
                        blkdata.timelinepath.replace("timeline.data", "code.data") : ""
                };
            SearchTimeline(blkdata.timeline, assetrefs, context)
            SearchGraph(blkdata.graph, assetrefs, context)
            KF8Coder.Process(assetrefs.codecontext);
        }, true);
    }
}
