define(["require", "exports"],function(require, exports) {

    function AnimationCCImport(context) {
        this.spritesheet = {};
        this.symbolmap = {};
        this.context = context;
    }

    AnimationCCImport.prototype.Import = function () {
        let filepaths = fileOpenDialog({properties: ['openFile', 'openDirectory']});
        if(filepaths && filepaths.length > 0){
           filepath = filepaths[0].replace(/\\/g,"/");
           LOG(filepath);
           this.LoadJson(filepath);
        }
    };

    AnimationCCImport.prototype.LoadJson = function(path){
        let pathdir = path + "/";

        let self = this;
        let jsondata = {};

        IKFFileIO_Type.instance.asyncLoadFileList([
                pathdir + "Animation.json",
                pathdir + "spritemap1.json"
            ]
            ,function (ret,data,path) {

            if(ret){
                if(path.indexOf("Animation") != -1){
                    jsondata["Animation"] = JSON.parse(data);
                }else{
                    jsondata["Sprites"] = JSON.parse(data);
                    }
                }
            }, function (ret,data,xpath) {
                if(ret){
                    self.SaveBlks(jsondata, path);
                }else{
                    Nt("Animation CC 文件加载失败!");
                }
            }
            ,"text");
    };

    AnimationCCImport.prototype.MapSprites = function(spritemap1, AnimName) {

        let newjson = {};
        let meta = spritemap1.meta;

        newjson.meta = meta;
        meta.scale = 1;
        meta.app = "kfeditor";

        let frames = {};
        newjson.frames = frames;
        let indexs = [];
        newjson.indexs = indexs;

        let SPRITES = spritemap1.ATLAS.SPRITES;
        for(let i = 0;i < SPRITES.length; i ++) {
            let sprite = SPRITES[i].SPRITE;
            let spname = sprite.name;

            this.spritesheet[spname] = sprite;
            let orgw = sprite.w;let orgh = sprite.h;
            let rotated = sprite.rotated;

            if(rotated) {
                let tmpv = orgw;
                orgw = orgh;
                orgh = tmpv;
            }

            let spinfo = {
                frame: {x:sprite.x,y:sprite.y,w:orgw,h:orgh},
                rotated: rotated,
                trimmed: true,
                spriteSourceSize: {x:0,y:0,w:orgw,h:orgh},
                sourceSize: {w:orgw,h:orgh}
            };

            let newspname = AnimName + "_" + spname;

            indexs.push(newspname);
            frames[newspname] = spinfo;

            sprite.display = i;
        }

        this.spritemap1 = newjson;
    }


    AnimationCCImport.prototype.SaveBlks = function(data, srcfiledir) {

        let self = this;
        let animdata = data.Animation;
        let AnimNode = animdata.ANIMATION;
        let flaname = AnimNode.name;
        let AnimName = AnimNode.SYMBOL_name;

        this.MapSprites(data.Sprites, AnimName);


        let shapename =  AnimName + "__sprites";

        this.fladir = flaname + "/";
        this.shapeblk = this.fladir  + shapename + ".blk";

        let Symbols = animdata.SYMBOL_DICTIONARY.Symbols.concat();
        Symbols.push(AnimNode);

        ///按依赖关系排序
        Symbols = this.SortSymbols(Symbols);

        let tlconfigs = [];
        this.ReadSymbols(Symbols, tlconfigs);

        ///创建shape集合
        let dirpath = this.context.appdatapath + "/" + flaname + "/";
        let shapedir = dirpath + shapename;
        let mustmkdirs = [];

        mustmkdirs.push(shapedir);

        let metadata = new KFBytes();

        let ssurl = flaname + "/" +  shapename + "/spritemap1.json";

        metadata.object = {__cls__:"PIXIShapes", ssurl:ssurl};

        let shapedata = {__cls__:"PIXIShapesData",ssurl:ssurl};
        let shapeMeta = {__cls__:"KFMetaData", name:shapename, type:"PIXIShapes", data:metadata,classData:shapedata};

        let blklist = [{asseturl:this.shapeblk
            , blk:shapeMeta
            , path:shapedir + ".blk"}];

        for(let i = 0;i < tlconfigs.length ;i ++) {
            let tlconfig = tlconfigs[i];
            if(tlconfig._type == "movieclip") {

                let mcname = tlconfig.name;
                let mcfiledir = dirpath + mcname;

                mustmkdirs.push(mcfiledir);

                ///设置自动进入0状态
                let actorconf = new KFBytes();
                actorconf.object = {__cls__:"PIXIMovieClip",autoStateID:0};
                ///用图形模式播放此元件
                if(tlconfig._graphic){
                    actorconf.object.bGraphic = true;
                }

                let blkdata = {};

                blkdata.asseturl = flaname + "/" + mcname + ".blk";

                blkdata.blk = {__cls__:"KFMetaData", name:mcname, type:"PIXIMovieClip",data:actorconf};
                blkdata.path = mcfiledir + ".blk";

                blkdata.graph = {"__cls__":"KFGraphConfig",data:{blocks:[]}};
                blkdata.graphpath = mcfiledir + "/graph.data";

                blkdata.timeline = tlconfig;
                blkdata.timelinepath = mcfiledir + "/timeline.data";

                blklist.push(blkdata);
            }
        }

        let copyfiles = function() {
            IKFFileIO_Type.instance.asyncCopyFiles(["spritemap1.png"]
                , srcfiledir, shapedir, function (ret) {
                if (ret) {

                    let savelist = [];
                    let jsonbytes = new KFByteArray();
                    jsonbytes.writeUTFBytes(JSON.stringify(self.spritemap1));
                    savelist.push({data:jsonbytes, path:shapedir + "/spritemap1.json"});
                    ///用context的保存会自动更新依赖关系
                    self.context.SaveBlkList(blklist,savelist,function (ret) {
                        Nt("导入资源:" + ret? "成功" : "失败");
                        if(ret){
                            ///更新资源库
                            self.context.UpdateBLKPaths();
                        }
                    });
                }
            });
        };

        IKFFileIO_Type.instance.asyncCreateDir(mustmkdirs
            ,function (ret) {
            if(ret){
                copyfiles();
            }
        });

    };

    AnimationCCImport.prototype.SortSymbols = function(Symbols) {

        let SymbolsMap = {};
        ///根据依赖关系排列
        for(let i = 0; i < Symbols.length;i ++){

            let symbol = Symbols[i];
            let symname = symbol.SYMBOL_name;
            let TIMELINE = symbol.TIMELINE;
            let LAYERS = TIMELINE.LAYERS;
            let mapinfo =  {data:symbol,name:symname,depends:[]};

            SymbolsMap[symname] = mapinfo;

            let depends = mapinfo.depends;

            for(let l = 0 ;l < LAYERS.length; l++){
                let LAYER = LAYERS[l];
                let Frames = LAYER.Frames;
                for(let f = 0; f < Frames.length; f ++){
                    let Frame = Frames[f];
                    let elements = Frame.elements;

                    for(let e = 0; e < elements.length; e ++){
                        let ele = elements[e];
                        let sybinst = ele.SYMBOL_Instance;
                        if(sybinst){
                            let sybinstname = sybinst.SYMBOL_name;
                            if(depends.indexOf(sybinstname) == -1) {
                                depends.push(sybinstname);
                            }
                        }
                    }
                }
            }

        }

        let SortSymbols = [];

        while (Symbols.length > 0) {

            let i = Symbols.length - 1;
            while (i >= 0) {

                let symbol =  Symbols[i];
                let symname = symbol.SYMBOL_name;
                let syminfo = SymbolsMap[symname];

                let depends = syminfo.depends;
                let del = true;

                for (let d = depends.length - 1; d >= 0 ; d--) {
                    if(SymbolsMap[depends[d]]){
                        del = false;
                        break;
                    } else {
                        depends.splice(d,1);
                    }
                }

                if(del) {
                    Symbols.splice(i,1);
                    delete SymbolsMap[symname];
                    SortSymbols.push(symbol);
                }

                i -= 1;
            }
        }

        return SortSymbols;
    }

    AnimationCCImport.prototype.ReadSymbols = function(Symbols,tlconfigs){

        for(let i = 0; i < Symbols.length; i ++) {
            let sitem = Symbols[i];
            let tlcfg = {__cls__:"KFTimelineConfig",states:[]};
            tlcfg.name = sitem.SYMBOL_name;
            this.symbolmap[tlcfg.name] = tlcfg;
            let stl = sitem.TIMELINE;
            this.ReadTimeline(stl,tlcfg);
            tlconfigs.push(tlcfg);
        }
    };

    AnimationCCImport.prototype.ReadTimeline = function(stl, tlcfg){
        let state = {__cls__:"KFTimelineData"
            ,id:tlcfg.states.length
            ,name:"Default"
            ,loop: true
            ,layers:[]};
        tlcfg.states.push(state);
        let LAYERS = stl.LAYERS;
        for(let i = 0;i < LAYERS.length;i++) {
            let LY = LAYERS[i];
            this.ReadLayer(LY, state);
        }
        ///只有一层和一帧且没有symbol的就当graphic处理
        if(tlcfg._hassymbol || state.layers.length > 1 || state.layers[0].length > 1) {
            tlcfg._type = "movieclip";
        }
        else {
            tlcfg._type = "graphic";
        }
    };

    AnimationCCImport.prototype.ReadLayer = function(ly, state) {

        let layers = state.layers;
        let Blocks = [];
        let Frames = ly.Frames;
        let totallen = Frames.length;
        let maxframe = 0;
        
        let FindBLK = function (syname,framei) {
            for(let k = 0;k < Blocks.length; k++) {
                let fk = Blocks[k];
                if(fk._syname == syname && undefined == fk._indexs[framei]){
                    return fk;
                }
            }
            return null;
        }

        for(let i = 0;i < totallen;i ++){
            let Frame = Frames[i];
            let findex = Frame.index;
            let elements = Frame.elements;
            for(let j = 0; j < elements.length; j ++) {
                let ele = elements[j];
                let data = ele.SYMBOL_Instance;
                let findblock = null;
                let syname = "";
                let instname = "";
                let fgraphic = false;

                if(data) {

                    syname = data.SYMBOL_name;
                    instname = data.Instance_Name;
                    ///强制当图形处理
                    fgraphic = data.symbolType == "graphic";
                    if(fgraphic) {
                        ///先这样处理，也有可能同样的元件有做图形有直接播放的
                        ///那时候再处理
                        let tlcfg = this.symbolmap[syname];
                        tlcfg._graphic = true;
                    }
                    //if(!tlcfg._type) {
                    //    tlcfg._type = symbolType;
                    //}
                    ///拥有元件
                    state._hassymbol = true;

                } else {
                    data = ele.ATLAS_SPRITE_instance;
                }

                findblock = FindBLK(syname,findex);
                if(!findblock) {
                    findblock = {keyframes:[]
                        , _indexs:{}
                    , _syname: syname
                    , _instname: instname
                    , _graphic: fgraphic};

                    Blocks.push(findblock);
                }

                if(findblock) {

                    let framedata = {__cls__:"KFKeyFrame",data:{}};

                    framedata.id = findex;
                    framedata._duration = Frame.duration;
                    framedata._data = data;

                    findblock.keyframes.push(framedata);
                    findblock._indexs[findex] = true;
                }

                let lastend = findex + Frame.duration;
                if(lastend > maxframe)
                    maxframe = lastend;
            }
        }

        state.length = maxframe;
        //整理下BLOCK 以及加入到层中
        let layerdata = {__cls__:"KFTimelayerData",blocks:[]};
        layers.push(layerdata);

        layerdata.name = ly.Layer_name;
        layerdata.length = maxframe;
        layerdata.tag = "cc";

        let setend = 0;
        let newtimes = 1;

        for(let i = 0;i < Blocks.length;i ++) {
            let blk = Blocks[i];
            this.CalBlock(blk);
            if(!blk._null) {

                if(blk.begin < setend) {
                    layerdata = {__cls__:"KFTimelayerData",blocks:[]};
                    layers.push(layerdata);
                    layerdata.name = ly.Layer_name + newtimes;
                    layerdata.length = maxframe;
                    layerdata.tag = "cc";
                    newtimes += 1;
                }

                layerdata.blocks.push(blk);
                setend = blk.end;
            }
        }
    }

    AnimationCCImport.prototype.CalBlock = function(block) {

        let keyframes = block.keyframes;
        let keysize = keyframes.length;

        if(keysize > 0) {

            let begini = keyframes[0].id;
            block.begin = begini;
            let lastframe = keyframes[keysize - 1];
            block.end = lastframe.id +  lastframe._duration;
            block.opOption = KFTimeBlockOpOption.P3_R1_S3_SK2;
            let _syname = block._syname;
            let _graphic = block._graphic;

            ///遍历每一帧获取相关的转换属性
            let endframei = -1;
            for(let i = 0;i < keysize;i ++) {
                let keyf = keyframes[i];
                let data = keyf._data;
                let shapemt3 = null;

                ///设置显示
                if(_syname == "")
                {
                    let spritename = data.name;
                    keyf.display = this.spritesheet[spritename].display;
                }
                else
                    {
                        let firstFrame = data.firstFrame;
                        if(!firstFrame){
                            firstFrame = 0;
                        }

                    let findsyb = this.symbolmap[_syname];
                    if(findsyb._type == "graphic"){
                        ///如果是强制图形还是有些问题,需要逐层找目标帧
                        ///查找帧号
                        let blk = findsyb.states[0].layers[0].blocks[0];
                        let sybdata = this.FindDataInBlock(blk,firstFrame);
                        let spritename = sybdata.name;
                        shapemt3 = sybdata.Matrix3D;
                        firstFrame = this.spritesheet[spritename].display;
                    }

                    keyf.display = firstFrame;
                }
                ///查看是否需要填充空帧
                if(endframei >= 0 && endframei < keyf.id) {
                    let empty = {__cls__:"KFKeyFrame",data:{}};
                    ///ID需要转换到目标中来
                    empty.id = endframei - begini;
                    empty._duration = keyf.id - endframei;
                    empty.display = -1;
                    keyframes.splice(i,0,empty);
                    i += 1;
                    keysize += 1;
                }
                endframei = keyf.id + keyf._duration;
                ///id需要重置
                keyf.id -= begini;

                ///设置转换
                let values = keyf.values = [];
                let mt3d = data.Matrix3D;

                if(shapemt3){
                    mt3d = AnimationCC.multiplymt3d(shapemt3,mt3d);
                }
                let tf = AnimationCC.decMatrix3d(mt3d);
                let v3 = tf.position;

                values.push(v3.x,v3.y,v3.z);
                values.push(tf.rotation);
                v3 = tf.scale;
                values.push(v3.x,v3.y,v3.z);
                v3 = tf.skew;
                values.push(v3.x,v3.y);

                let color = data.color;
                if(color && color.mode == "Tint") {
/*
* "color": {
                                            "mode": "Tint",
                                            "tintColor": "#195D70",
                                            "tintMultiplier": 1.0
                                        }*/
                    let tint = parseInt(color.tintColor.replace("#","0x"),16);
                    let tintMul = color.tintMultiplier;
                    let orgMul = 1 - tintMul;

                    const r = tint >> 16 & 0xFF;
                    const g = tint >> 8 & 0xFF;
                    const b = tint & 0xFF;

                    values.push(orgMul);
                    values.push(r / 255 * tintMul , g / 255 * tintMul, b / 255 * tintMul);
                }

            }

            ///设置block的目标数据
            let targetdata = {option:KFBlockTargetOption.Create};
            block.target = targetdata;

            let syname = block._syname;
            let instname = block._instname;

            if(syname != ""){
                let findsyb = this.symbolmap[syname];
                if( !findsyb || findsyb._type == "graphic") {
                    syname = "";
                }
            }
            if(!syname || syname == "") {
                targetdata.asseturl = this.shapeblk;
                targetdata.instname = instname;
            } else {
                targetdata.asseturl = this.fladir + syname + ".blk";
                targetdata.instname = instname;
            }
        }
        else {
            block._null = true;
        }
    }


    AnimationCCImport.prototype.FindDataInBlock = function(block,frame) {

        let keyframes = block.keyframes;
        let keysize = keyframes.length;
        let data = null;

        for(let i = 0;i < keysize;i ++){
            let kf = keyframes[i];
            if((kf.id + kf._duration) > frame){
                data = kf._data;
                break;
            }
        }

        return data;
    }


    exports.AnimationCCImport = AnimationCCImport;
});


