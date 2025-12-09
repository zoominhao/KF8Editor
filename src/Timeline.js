function Timeline(domui,layerDatas) 
{
    this.domui = domui;
    this.uiHeader = domui.uiHeader;
    this.uiFrame = domui.uiFrame;
    this.frameDiv = domui.frameDiv;
    this.headerDiv = domui.headerDiv;
    this.headerDiv = domui.headerDiv;
    this.hfDiv = domui.hfDiv;
    this.hfFrame = domui.hfFrame;
    this.statesel = domui.statesel;
    this.stateCategory = domui.stateCategory;
    this.addLY = domui.addLY;
    this.removeLY = domui.removeLY;
    this.loopflag = domui.loopflag;
    this.loopcount = domui.loopcount;
    this.inheritLoop = domui.inheritLoop;
    this.inheritable = domui.inheritable;
    this.igScriptLayer = domui.igScriptLayer;

    this.stateid = -1;
    this.layerid = 1;
    this.currentState = null;
    this.currentLayer = -1;
    this.currentFrame = -1;
    this.currentHeadFrame = 0;
    // this.copyLayerData = null;
    

    this.c2d = this.uiFrame.get(0).getContext("2d");

    this.frameWidth = 20;
    this.frameHeight = 40;
    this.sizerate = 1;
    this.hframeHeight = 30;

    // this.CopyKeyFrame = null;
    

    this.display = new PIXI.Graphics();

    var self = this;
    
    this._TODInit();
    this._drawInit();
    this._renderBlockInit();
    this._PlotInit();
    this._openActionInit();
    this._descInit();

/*    this.timer = setInterval(() => {
        this.SaveLayerUsingName("Audio_vo");
        this.SaveLayerUsingName("Audio_sfx");
        this.SaveLayerUsingName("Audio_music");
    }, 10 * 1000)*/

    //this._drawHeaderFrames();
    

    var formatter_func = function(value)
    {
        return '<input type="checkbox" value="'+value+'">';
    }
    
    this.uiHeader.datagrid({
        columns:[[
            
        {field:'hide',title:'',width:29,align:'center',formatter:formatter_func},
        {field:'lock',title:'',width:30,align:'center',formatter:formatter_func},
        {field:'name',title:'',width:130,editor:'text'}

        ]]
        ,rowStyler: function(index,row){
            //if (row.listprice>80){
             //   return 'background-color:#6293BB;color:#fff;'; // return inline style
                // the function can return predefined css class and inline style
                // return {class:'r1', style:{'color:#fff'}};
            //}
            let inlinestyle =  'height:' + self.frameHeight +'px;';

            inlinestyle+= "-webkit-touch-callout: none;";
            inlinestyle+= "-webkit-user-select: none;";
            inlinestyle+= "-khtml-user-select: none;";
            inlinestyle+= "-moz-user-select: none;";
            inlinestyle+= "-ms-user-select: none;";
            inlinestyle+= "user-select: none;";

            return inlinestyle;
        }

        /*
        ,data:[]
        ,
        onLoadSuccess:function(data)
        {
            alert(data);
            self._initlayers(layerDatas)
        }*/

        , selectOnCheck:false
        , checkOnSelect:false
        , onRowContextMenu: function (evt,index, row)//图层右键菜单时触发
        {
            evt.preventDefault();
            self.SelectedLayer(index,true, -1);
            $('#tllayermenu').menu('show',{
                left: evt.pageX,
                top:  evt.pageY
            });
        }
        , onSelect:function (index,row)//图层焦点选中时触发
        {
            if(self.currentLayer != index) {
                self.SelectedLayer(index);
                self.OnFrameChange(); 

                self._PlotSelect(row);
            }
        }
        , onClickCell:function(index,field,value)
        {
            /*if(field != "name") return;
            _global.editor.PlotActors["_main_role_0"].Set('Selected', true);*/
        }
        , onDblClickCell:function(index,field,value)//双击单元格时触发
        {

            if(field != "name") return;
            
            //*双击单元格编辑 
            let dg = $(this);
            dg.datagrid('beginEdit', index);
            var ed = dg.datagrid('getEditor', {index:index,field:field});
            $(ed.target).focus();
            ///焦点失去后的事件绑定
            $(ed.target).bind('focusout', function (e) 
                {
                    setTimeout(function () { dg.datagrid('endEdit', index) }, 100);
                }
            );
        }
    });

    this.headframescroll = false;
    this.hfFrame.mousedown(//鼠标按下时间轴指针时触发
       function (evt){
           let point = CVEventPosition(evt);
           let frameindex = Math.floor(point.x / self.frameWidth);

           //if(frameindex == self.currentHeadFrame)
           {
               self.setHeaderCurrentFrame(frameindex);
               self.headframescroll = true;
           }

           if(self.currentFrame != -1)//清除当前选中帧
           {
               self.SelectedLayer(self.currentLayer,false, -1);
               self.OnFrameChange();
           }
        }
    );

    this.hfFrame.click(//鼠标点击时间轴指针时触发
        function (evt){
            //let point = CVEventPosition(evt);
            //let frameindex = Math.floor(point.x / self.frameWidth);
            //self.headframescroll = false;
            //self.setHeaderCurrentFrame(frameindex);
        }
    );



    let timelinecontainer = $("#timelinecontainer");

    timelinecontainer.mousemove(//时间轴指针滑动时触发
        function (evt)
        {
            if(self.headframescroll)
            {
                let point = CVEventPosition(evt);
                let frameindex = Math.floor(point.x / self.frameWidth);
                self.setHeaderCurrentFrame(frameindex);

                let scrollbar = $('#tlvscrollbar')[0];
                let scrollLeft = scrollbar.scrollLeft;
                let scrollWidth = scrollbar.scrollWidth;
                let offset = 30;
                var width = timelinecontainer.width();
                if(evt.clientX < 500 && scrollLeft > 0)
                    scrollbar.scrollLeft -= offset;
                else if(evt.clientX > width - 50 && scrollLeft < scrollWidth)
                    scrollbar.scrollLeft += offset;
            }
        }
    );

    this.uiFrame.mouseover(
        function (event)
        {
            self.uiFrameFocused = true;
        }
    );
    this.uiFrame.mouseout(
        function (event)
        {
            self.uiFrameFocused = false;
        }
    );

    timelinecontainer.mouseup(//鼠标松开时间轴指针时触发
        function ()
        {
            self.headframescroll = false;
        }
    );
    this._inputInit();

    this.uiFrame.click(function (evt)
    {
        if(!self._renderBlockClick(evt))
        {
            self.frameClick(CVEventPosition(evt));
        }
    });

    this.uiFrame.dblclick(function (evt)
    {
        let point = CVEventPosition(evt);

        let frameindex = Math.floor(point.x / self.frameWidth);
        let layerindex = Math.floor(point.y / self.frameHeight);

        let layerdata = self.currentState.layers[layerindex];

        let blocks = layerdata ? layerdata.blocks : [];
        let flag = false;
        for(let i = 0 ; i < blocks.length ; i++)
        {
            if(blocks[i] && blocks[i].keyframes)
            {  
                for(let j = 0 ; j < blocks[i].keyframes.length ; j++)
                {
                    if(blocks[i].keyframes[j].id == frameindex - blocks[i].begin)
                    {
                        flag = true;
                        break;
                    }
                }
            }
            if(flag)
                break;
        }
        
        if(!flag)
        {
            Nt("没有选中关键帧!");
        }
        else
        {
            if(KFDEditor.EditKFFrameData)
            {
                //KFDEditor.EditKFFrameData(self.frameattribui, 5);
                KFDEditor.EditKFFrameDataByName(self.frameattribui, "data");
            }
        }
    });

    this.uiFrame.contextmenu(function (evt)
    {
        evt.preventDefault();
        self.frameClick(CVEventPosition(evt));
        self.SetColorWindowPos(evt.pageX, evt.pageY);
        $('#tlframemenu').menu('show',{
            left: evt.pageX,
            top:  evt.pageY
        });
    });

    this.addLY.bind('click', function()
    {
        self.AddLayer(null,true);
    });
    this.removeLY.bind('click', function()
    {
        self.RemoveLayer();
    });

    this.frameattribui = new KFDEditor(domui.frameattrib);
    this.tbattribui = new KFDEditor(domui.tbattrib);

    this.moreinfoui = new KFDEditor(domui.timelineEdtTG);

    this.tbattribui.Event.on("OnDataChange",function (prop, needUpdate)
    {
        let pname = prop.name;
        if(pname == "begin" || pname == "end")
        {
            if(self.currentState)
            {
                let maxlen = 0;
                for(let i = 0; i < self.currentState.layers.length; ++i)
                {
                    for(let j = 0; j < self.currentState.layers[i].blocks.length; ++j)
                    {
                        if(self.currentState.layers[i].blocks[j].end > maxlen)
                        {
                            maxlen = self.currentState.layers[i].blocks[j].end;
                        }
                    }
                }
                self.currentState.length = maxlen;
                this.ResizeMaxFrames(self.currentState.length);
            }
            
            
            $("#statediv").text( self.currentState.name + '(len: '+ self.currentState.length +')');
            this._redrawIndexLayers([this.currentLayer]);
        }
    }
    , this);

    this.frameattribui.Event.on("OnDataChange",function (prop, needUpdate)
    {
        if(prop)
        {
            let pname = prop.name;
            if(needUpdate)
            {
                this.OnFrameChange();
            }
            if(pname == "id")
            {
                this._redrawIndexLayers([this.currentLayer]);
            }else if(pname == "scripts")
            {
                this._drawFrameIndexs([this.currentFrame]);
            }
        }
        
    }, this);

    this.frameattribui.Event.on("OnFrameBoxChange", function (uidata, srcuidata)
    {
        if(uidata && uidata._src && uidata._prop)
        {
            _global.Event.emit("OnFrameBoxChange",
                uidata._src[uidata._prop.name],
                self.currentFrame,
                self.currentState ? self.currentState.id : -1
            );
        }
    });

    
    

    domui.tlDetailBtn.click(function (){
        /// open detail window...
        domui.timelineEdtWin.window("open").window('center');
    });

    this.vscroll = domui.vscroll;
    let vscontent = this.vscroll.content;
    let vsbar  = this.vscroll.bar;
    let views = this.vscroll.views;
    vsbar.on("scroll", function () {
        let scrollvalue = (vsbar.scrollLeft() * -1) + "px";
        //console.log("scroll", scrollvalue);
        for(let view of views){
            view.css("left",scrollvalue);
        }
    });

    let tldata = {};
    let blkassetId = "";
    if(_global && _global.editor)
    {
        this.Start(_global.editor.context);
        if(_global.editor.blkdata)
        {
            tldata = _global.editor.blkdata.timeline;
            blkassetId = _global.editor.blkdata.asseturl;
        }
    }
    /*(_global.Event.on("onDataRestore", function (curData) {
        self.tldata = curData.timeline;
        self.currentState = curData.timeline.states[self.stateid > -1 ? self.stateid : 0];
        self._redrawAllLayers();
        self.OnFrameChange();
    });*/

    //_global.Event.on("UpdateAttr",this.OnFrameChange.bind(this));


    this.Open(tldata, blkassetId);
}

Timeline.prototype.HideTab = function ()
{
    this.domui.timelineEdtWin.window("close");
}

Timeline.ReCalcStateLength = function(state) {
    ///重新计算下长度
    let maxlen = 1;
    if (state) {
        let layers = state.layers;
        for (let i = 0; i < layers.length; i++) {
            let layer = layers[i];
            let blocks = layer.blocks;

            for (let j = 0; j < blocks.length; j++) {
                let block = blocks[j];
                if (block.end && block.end > maxlen)
                    maxlen = block.end;
            }
        }
    }
    return maxlen;
}

Timeline.prototype.OnFrameChange = function(framelenchg)
{
    let kfframedata = null;
    let frameattribui = this.frameattribui;

    if(this.currentState == null || this.currentFrame == -1 || this.currentLayer == -1 ||(this.currentState.layers[this.currentLayer] && this.currentState.layers[this.currentLayer].option.ban) )
    {
        this.tbattribui.Edit(null);
        this.frameattribui.Edit(null);
    }
    else
    {
        let layerdata = this.currentState.layers[this.currentLayer];
        ///判断是否被块占了
        let retdata = this._GetFrameBlock(this.currentFrame,layerdata,true);

        if(retdata.block)
        {
            if(retdata.block.target && retdata.block.target.instname)
            {
                var instnameStr = retdata.block.target.instname.toString();
                instnameStr = instnameStr.substring(instnameStr.lastIndexOf(".") + 1)
                _global.editor.SelectedInst = instnameStr;
            }

            this.tbattribui.Edit(retdata.block,
                {__ecls__:"KFTimeBlockData"
                    ,ops:false,keyframes:false
                    ,target:{func:false,__state__:"open", asseturl:{__enum__:"OnFileSelected"}}});

            let framedata = FrameTypes.GetFrameInfo(this.currentFrame,retdata.block).data;

            kfframedata = framedata ? framedata.data : null;
            if(kfframedata == null && framedata != null)
            {
                kfframedata = {__cls__:"KFFrameData"};
                framedata.data = kfframedata;
            }

            this.frameattribui.Edit(framedata,
                {
                    __ecls__:"KFKeyFrame"
                    ,args:false
                    , values:{__state__:"open"}
                ,data:{__state__:"open",index:false
                    ,scripts:{__state__:"open"}
                    }
                });

            ///不要随意切换状态页
           // $("#timelineTT").tabs("select",framedata ? 0:1);


        }
        else
            {
                this.tbattribui.Edit(null);
                this.frameattribui.Edit(null);
            }
    }

    if(this.currentState && framelenchg)
    {
        this.currentState.length = Timeline.ReCalcStateLength(this.currentState);

        this.ResizeMaxFrames(this.currentState.length);

        LOG("STATE LEN IS {0}", this.currentState.length);
    }

    _global.Event.emit("OnFrameDataSelected", kfframedata, frameattribui);
    
}

Timeline.prototype.frameClick = function(point)
{
    let frameindex = Math.floor(point.x / this.frameWidth);
    let layerindex = Math.floor(point.y / this.frameHeight);

    if(layerindex != this.currentLayer)
    {
        this.SelectedLayer(layerindex, true, frameindex);
        this.OnFrameChange();
    }
    else
    {
        let oldframe = this.currentFrame;
        if(oldframe != frameindex)
        {
            let frames = [];

            if(oldframe >= 0)
                frames.push(oldframe);

            ///同时刷新前一帧和后一帧有一些残留
            let preframe = oldframe - 1;
            if(preframe >= 0 && preframe != frameindex) {frames.push(preframe);}
            preframe = oldframe + 1;
            if(preframe != frameindex) {frames.push(preframe);}

            if(frameindex >= 0)
                frames.push(frameindex);

            this.currentFrame = frameindex;
            _global.currentFrame = frameindex;
            this.setHeaderCurrentFrame(frameindex);

            if(frames.length > 0)
            {
                this._drawFrameIndexs(frames);
            }
            this.OnFrameChange();
        }
    }
    this.UpdateFrameDescMenu();
}

Timeline.prototype._onScrollFrame = function()
{
    var topv = this.frameDiv.scrollTop();

    if(this._fst != topv)
    {
        this._fst = topv;
        this.headerDiv.scrollTop(topv);

        console.log(topv,this.headerDiv.prop('scrollHeight'),this.frameDiv.prop('scrollHeight'));
    }

    var leftv = this.frameDiv.scrollLeft();
    if(this._fsl != leftv)
    {
        //重设宽度...
        var framewidth = this.frameDiv.width();
        if(framewidth != this.hfDiv.width())
            this.hfDiv.width(framewidth);

        this._fsl = leftv;
        this.hfDiv.scrollLeft(leftv);

        //console.log(this.hfDiv.width(),this.frameDiv.width());
        //console.log(leftv,this.hfDiv.scrollLeft());
    }
}

Timeline.prototype.Start = function(context)
{
    this.context = context;
    this.tbattribui.kfdtable = context.kfdtable;
    this.frameattribui.kfdtable = context.kfdtable;
    this.moreinfoui.kfdtable = context.kfdtable;
}

Timeline.prototype.UpdateStates = function(selindex)
{
    let timeline = this;
    let timelinedata = this.tldata;
    if(timelinedata.states.length > selindex)
    {
        this.ResizeMaxFrames(timelinedata.states[selindex].length);
    }

    // 检查是否有自动打开路径
    let autoOpenStateId = this._checkAutoOpenAction();

    //剧情文件
    $('#statecontainer').layout();
    let blkflag = timeline.PlotUpdateAttrs();

    if(!blkflag)
    {
        var westregion = $('#statecontainer').layout('panel', 'west');
        let stateTabname = this._TODTimeLineTabName();
        westregion.panel('setTitle', stateTabname == "" ? '状态集' : stateTabname);
        $('#statecontainer').layout();
        let formatterStates = timeline.SortStates(timelinedata.states);

        // 状态集排序
        formatterStates.sort(function (x, y)
        {
            if(x.id > y.id) return 1;
            if(x.id < y.id) return -1;
            return 0;
        });
        for(let i = 0; i < formatterStates.length; i++)
        {
            formatterStates[i].children.sort(function (x, y)
            {
                if(x.id > y.id) return 1;
                if(x.id < y.id) return -1;
                return 0;
            });
        }

        this.statesel.tree({
        formatter:function(node){
            var remarks = "";
            if(node.remarks && timeline.remarksflag)
            {
                remarks =  "_" + node.remarks;
            }
            if(node.id >= 10000000)
                return node.name + remarks;
            else
                return "(" +node.id+")" + node.name + remarks;
        },
        data: formatterStates,
        onSelect:function (node){
            for(let i = 0; i < timelinedata.states.length; i++)
            {
                if(timelinedata.states[i].id == node.id)
                {
                    timeline.ChangeState(i, true);
                    break;
                }
            }
        },
        onContextMenu: function (evt, node)
        {
            evt.preventDefault();
            $('#statemenu').menu('show',{
                left: evt.pageX,
                top:  evt.pageY
            });

            // 右键菜单时选择区域
            _global.timeline.statesel.tree('select', node.target);
        },

        onLoadSuccess:function(node,data){
            let id = autoOpenStateId;
            if (id == 0) {
                if(selindex == null) {selindex = data.length > 0 ? 0 : -1;}
                if(selindex >= 0 && selindex < data.length) {
                    id = data[selindex].children[0].id;
                }
            }
            var selnode = timeline.statesel.tree('find', id);
            timeline.statesel.tree('select', selnode.target);
            timeline.statesel.tree('expandTo', selnode.target);
         }
        });
        this.TODUpdateAttrs();
    }

    
    ///显示其中一个STATES
    /*if(selindex != null && selindex >= 0 && selindex < formatterStates.length)
    {
        var node = this.statesel.tree('find', formatterStates[selindex].children[0].id);
        this.statesel.tree('select', node.target);
        this.statesel.tree('expandTo', node);
    }*/
}


Timeline.prototype.SortStates = function(states)
{
    let sortStates = new Array();
    for(let i = 0; i < states.length; i++)
    {
        let flag = 0;
        if(states[i].id < 0) continue;
        //let tmpState = JSON.parse(JSON.stringify(states[i]));
		    let tmpState = $.extend(true, {}, states[i]);
        
        if(states[i].layers != null)
        {
            for(let j = 0; j < states[i].layers.length; j++)
            {
                if(states[i].layers[j] != null && states[i].layers[j].blocks != null)
                {
                    for(let m = 0; m < states[i].layers[j].blocks.length; m++)
                    {
                        if(states[i].layers[j].blocks[m] != null && states[i].layers[j].blocks[m].end > 0)
                        {
                            flag = 1;
                            if(states[i].layers[j].blocks[m].keyframes && states[i].layers[j].blocks[m].keyframes.length)
                            {
                                flag = 2;
                            }
                            if(flag == 2) break;
                        }
                    }
                    if(flag > 1) break;
                }
            }
        }
        if(flag == 0)
        {
            tmpState.iconCls = "icon-stateempty";
        }
        else if(flag == 1)
        {
            tmpState.iconCls = "icon-statenormal";
        } 
        else if(flag == 2)
        {
            tmpState.iconCls = "icon-statekey";
        }

        // 子项备注添加
        if (_global.editor.blkdata) {
            if (_global.editor.blkdata.tldesc) {
                for (let statedesc of _global.editor.blkdata.tldesc.states) {
                    if (statedesc.id == tmpState.id) {
                        if(statedesc.remarks) tmpState.remarks = statedesc.remarks;
                        if(!statedesc.genHurtBox) tmpState.iconCls = "icon-lockfile"
                    }
                }
            }
        }
        sortStates.push(tmpState);
    }

    let startFolderId = 10000000;
    let folderAry = new Array();
    let folderName = "";
    for(let i = 0; i < sortStates.length; i++)
    {
        let folderId = Math.floor(sortStates[i].id / 100);
        folderName = sortStates[i].name;

        if(folderId < 100)
        {
            folderId = folderId + startFolderId;
            if(folderName.indexOf("_") != -1)
            {
                folderName = folderName.substr(0, folderName.indexOf("_"));
            }
            else
            {
                folderName = folderName.substr(0, 2);
            }
        }
        else
        {
            if(folderId >= 100 && folderId < 1000)
            {
                folderId = 100 + startFolderId;
                folderName = "基础动作";
            }
            else if(folderId >= 1000 && folderId < 10000)
            {
                folderId = 1000 + startFolderId;
            }
            else if(folderId >= 10000 && folderId < 100000)
            {
                if(folderId >= 60000 && folderId < 70000)
                {
                    folderId = 60000 + startFolderId;
                    folderName = "剧情动作";
                }
                else
                {
                    folderId = 10000 + startFolderId;
                    folderName = "受击动作";
                }
            }
            else if(folderId > 100000)
            {
                folderId = 100000 + startFolderId;
            }
        }

        let flag = true;
        for(let j = 0; j < folderAry.length; ++j)
        {
            if(folderAry[j].id == folderId)
            {
                folderAry[j].children.push(sortStates[i]);
                flag = false;
                break;
            }
        }
        if(flag)
        {
            let tmpFolder = {
                id: folderId,
                text: folderId,
                state: "closed",
                children: [sortStates[i]],
                iconCls: "icon-briefcase",
                name: folderName
            };
            folderAry.push(tmpFolder);
        }
    }

    // 文件夹备注添加
    if (_global.editor.blkdata) {
        if (_global.editor.blkdata.tldesc) {
            for (let statedesc of _global.editor.blkdata.tldesc.states) {
                for(let j = 0; j < folderAry.length; ++j) {
                    if (statedesc.id == folderAry[j].id) {
                        folderAry[j].remarks = statedesc.remarks;
                    }
                }
            }
        }
    }
    return folderAry;
}

Timeline.prototype.Open = function(timelinedata, assetId)
{
    ///关闭以前的数据先?
    this._openActionInit();
    this._descInit();

    this.frameWidth = 20;
    this.frameHeight = 40;
    this.sizerate = 1;
    this.hframeHeight = 30;

    if(timelinedata == null)
    {
        timelinedata = {}
    }

    this.tldata = timelinedata;
    
    if(!timelinedata.states || timelinedata.states.length == 0)
    {
        let states = [];
        timelinedata.states = states;
        states.push({   "__cls__": "KFTimelineData"
                        ,id: 0
                        ,loop: false
                        ,name: "state0"});
    }

    if(!timelinedata.renderdata) 
    {
        timelinedata.renderdata = {states:[]};
    }
    this.renderStates = timelinedata.renderdata.states;
    this.markRenderFrameId = -1;
    this.assetId = assetId;
    this._TODTimeLineDefaultSet(timelinedata);
    ///把所有的STATE显示到下拉列表中吧
    this.UpdateStates(0);
}

Timeline.prototype.ChangeState = function(stateid, disstate)
{
    this.stateid = stateid;
    let stateData = this.tldata.states[stateid];
    if(this.currentState == stateData)
    {
        return;
    }

    if(stateData.loop == undefined)
    {
        /// TODO 后面需要从KFD里读取默认值
    }

    if(disstate)
    {
        $("#statediv").text( stateData.name + '(len: '+ stateData.length +')');

        $('#statediv').tooltip({
            position: 'top',
            content: '<span style="color:#000">'+ '[id:'+ stateData.id + ' 长度:' + stateData.length +'] ' + stateData.name +'</span>',
            onShow: function(){
                $(this).tooltip('tip').css({
                    backgroundColor: '#EEE',
                    borderColor: '#666',
                });
            }
        });
    }
    else
    {
        $("#statediv").text('len: '+ stateData.length);
    }


    this.loopflag.checkbox({
        checked: (stateData.loop == true)
        , onChange: function (checked){
            stateData.loop = checked;
        }
    });

    this.inheritLoop.checkbox({
        checked: (stateData.inheritLoop != false)
        , onChange: function (checked){
            stateData.inheritLoop = checked;
        }
    });
    

    this.loopcount.textbox({
        value: stateData.loopCount == undefined ? 0 : stateData.loopCount,
        onChange: function (nValue)
        {
            stateData.loopCount = parseInt(nValue);
        }
    });
    

    this.inheritable.checkbox({
        checked: (stateData.inheritable == true)
        , onChange: function (checked){
            stateData.inheritable = checked;
        }
    });

    this.igScriptLayer.textbox({
        value: stateData.igScriptLayer == undefined ? 0 : stateData.igScriptLayer,
    onChange: function (nValue)
    {
        stateData.igScriptLayer = parseInt(nValue);
    }
    });

   this._renderBlockChangeState(stateData);

    ///默认初始化
    if(!stateData.length)
    {
        stateData.length = 1;
    }
    this._openState(stateData);
    this.ResizeMaxFrames(stateData.length);
    this._setState();
}


Timeline.prototype._initlayers = function()
{
    if(!this.currentState.layers)
        this.currentState.layers = [];

    let layerDatas = this.currentState.layers;
    if(layerDatas.length == 0)
    {
        layerDatas.push(
            {
                "__cls__": "KFTimelayerData"
                ,   name:"Default"
                ,   option:{standalone:false,lock:false,visible:true,expand:true}
                ,   blocks:[]
            }
             );
    }

    this.layerid = layerDatas.length;
    this._redrawAllLayers();

    this.LAYER_TYPES =
        [
            {typeid:0, typeDesc:"S_Com"},//Script
            {typeid:1, typeDesc:"PS_UI_Dialog"},//PlotScript_Dialog
            {typeid:2, typeDesc:"T_Camera"},//Tween_Camera
            {typeid:3, typeDesc:"T_CHA_"},//Tween_Character
            {typeid:4, typeDesc:"PS_ANI_"},//PlotScript_Character_Animation
            {typeid:5, typeDesc:"S_MainRole"},//Script_MainRole
            {typeid:6, typeDesc:"T_MainRole"},//Tween_MainRole
            {typeid:7, typeDesc:"S_Effect_Scene"},//Script_Effect_Scene
            {typeid:8, typeDesc:"S_Effect_"},//Script_Effect_Character
            {typeid:9, typeDesc:"PS_UI_QTE"},//PlotScript_QTE
            {typeid:10, typeDesc:"Audio_vo"},//Audio_vo
            {typeid:11, typeDesc:"Audio_sfx"},//Audio_sfx
            {typeid:12, typeDesc:"Audio_music"},//Audio_music
            {typeid:13, typeDesc:"Audio"},//Audio
        ];
}

Timeline.prototype.GetLayerTypeDesc = function (layerTypeID)
{
    if (this.LAYER_TYPES)
    {
        for (let i=0; i<this.LAYER_TYPES.length; i++)
        {
            if (this.LAYER_TYPES[i].typeid == layerTypeID)
                return this.LAYER_TYPES[i].typeDesc;
        }
    }
    return "";
}

Timeline.prototype.GetLayerTypeID = function (layerName)
{
    if (this.LAYER_TYPES)
    {
        for (let i=0; i<this.LAYER_TYPES.length; i++)
        {
            if (layerName.indexOf(this.LAYER_TYPES[i].typeDesc)>=0)
                return this.LAYER_TYPES[i].typeid;
        }
    }
    return 0;
}

Timeline.prototype.CreateLayer = function(layerType)
{
    let layerData = {
        "__cls__": "KFTimelayerData"
        ,   name:this.GetLayerTypeDesc(layerType)
        ,   option:{standalone:false,lock:false,visible:true,expand:true}
        ,   blocks:[]
    }
    this.AddLayer(layerData,true);
    this.CreateBlock(this.currentLayer, 0);
    this._drawFrameIndexs([0]);
    this.OnFrameChange(true);
}

Timeline.prototype.CreateBlock = function(layerIndex, frameIndex)
{
    let layerdata = this.currentState.layers[layerIndex];
    if (!layerdata) return;
    let layerType = this.GetLayerTypeID(layerdata.name);
    //判断是否被块占了
    let retdata = this._GetFrameBlock(frameIndex,layerdata,true);
    let blockdata = retdata.block;
    if(!blockdata)
    {
        if(_global.editor && _global.editor.edaction)
            _global.editor.edaction.AddAction();
        ///创建一个新块
        blockdata = {"__cls__":"KFTimeBlockData"};
        blockdata.label = "timeblock" + layerdata.blocks.length;
        blockdata.begin = 0;
        blockdata.end = frameIndex + 1;
        blockdata.keyframes = [];
        layerdata.blocks.push(blockdata);

        switch (layerType)
        {
            case 0://Script
                blockdata.opOption = 64;
                ///创建一个关键帧
                let newkeyframe = {"__cls__":"KFKeyFrame"};
                newkeyframe.data= {"__cls__":"KFFrameData", scripts:[]};
                newkeyframe.id = 0;
                ///按顺序排列索引
                blockdata.keyframes.push(newkeyframe);
                this.CreateKeyFramePassBtn(newkeyframe);
                this.CreateKeyFrameLimitRoleInput(newkeyframe);
                this.CreateKeyFrameHideMainUI(newkeyframe);
                break;
            case 1://PlotScript_Dialog
                blockdata.opOption = 64;
                blockdata.target = {
                    "option": 1,
                    "asseturl": ":KF8PlotNpcDialogPanel",
                };
                blockdata.target.instname = new KFDName("dialog");
                break;
            case 2://Tween_Camera
                blockdata.opOption = 31;
                blockdata.target = {
                    "option": 2,
                    "asseturl": "",
                    "pInstname": {
                        "value": 0
                    },
                    "execSide": 3,
                    "instsid": 0,
                    "usingInitBytes": false,
                    "initBytes": null,
                    "userData": null
                };
                blockdata.target.instname = new KFDName("*._root.KF8CameraManager");
                break;
            case 3://Tween_Character
                blockdata.opOption = 31;
                blockdata.target = {
                    "option": 2,
                    "asseturl": "",
                    "pInstname": {
                        "value": 0
                    },
                    "execSide": 3,
                    "instsid": 0,
                    "usingInitBytes": false,
                    "initBytes": null,
                    "userData": null
                };
                blockdata.target.instname = new KFDName("*._world.60003");
                break;
            case 4://PlotScript_Character_Animation
                blockdata.opOption = 64;
                blockdata.target = {
                    "option": 2,
                    "asseturl": "",
                    "pInstname": {
                        "value": 0
                    },
                    "execSide": 3,
                    "instsid": 0,
                    "usingInitBytes": false,
                    "initBytes": null,
                    "userData": null
                };
                blockdata.target.instname = new KFDName("*._world.60003");
                break;
            case 5://Script_MainRole
                blockdata.opOption = 64;
                blockdata.target = {
                    "option": 2,
                    "asseturl": "",
                    "pInstname": {
                        "value": 0
                    },
                    "execSide": 3,
                    "instsid": 0,
                    "usingInitBytes": false,
                    "initBytes": null,
                    "userData": null
                };
                blockdata.target.instname = new KFDName("*._MainRoleLogic.CurMainRole");
                break;
            case 6://Tween_MainRole
                blockdata.opOption = 31;
                blockdata.target = {
                    "option": 2,
                    "asseturl": "",
                    "pInstname": {
                        "value": 0
                    },
                    "execSide": 3,
                    "instsid": 0,
                    "usingInitBytes": false,
                    "initBytes": null,
                    "userData": null
                };
                blockdata.target.instname = new KFDName("*._MainRoleLogic.CurMainRole");
                break;
            case 7://Script_Effect_Scene
                blockdata.opOption = 64;
                break;
            case 8://Script_Effect_Character
                blockdata.opOption = 64;
                blockdata.target = {
                    "option": 2,
                    "asseturl": "",
                    "pInstname": {
                        "value": 0
                    },
                    "execSide": 3,
                    "instsid": 0,
                    "usingInitBytes": false,
                    "initBytes": null,
                    "userData": null
                };
                blockdata.target.instname = new KFDName("*._world.60003");
                break;
            case 9://PlotScript_QTE
                blockdata.opOption = 64;
                blockdata.target = {
                    "option": 1,
                    "asseturl": ":KF8PlotNpcDialogPanel",
                };
                blockdata.target.instname = new KFDName("qte");
                break;
        }
    }
}

Timeline.prototype.CreateKeyFrame = function(keytype=0)
{
    let layerdata = this.currentState.layers[this.currentLayer];
    if (!layerdata) return;
    let layerType = this.GetLayerTypeID(layerdata.name);
    ///判断是否增加块到当前帧
    let retdata = this._GetFrameBlock(this.currentFrame,layerdata,true);
    let blockdata = retdata.block;
    if(!blockdata)
        this.IncreaseBlock();
    ///获取当前帧的块信息
    retdata = this._GetBeforBlock(this.currentFrame);
    blockdata = retdata.block;
    if(retdata.inblock)
    {
        if(_global.editor && _global.editor.edaction)
            _global.editor.edaction.AddAction();
        let keyframes = blockdata.keyframes;
        if(!keyframes) {keyframes = [];blockdata.keyframes = keyframes}
        let keyindex = this.currentFrame - blockdata.begin;
        let inserti = -1;
        for(let i = 0 ; i < keyframes.length ;i ++)
        {
            if(keyframes[i].id == keyindex)//当前帧已经是关键帧
                return;
            else if(keyindex < keyframes[i].id)
                inserti = i;
            else
                break;
        }
        ///创建一个关键帧
        let newkeyframe = {"__cls__":"KFKeyFrame"};
        newkeyframe.data= {"__cls__":"KFFrameData", scripts:[]};
        newkeyframe.id = keyindex;
        ///按顺序排列索引
        if (inserti >= 0)
            keyframes.splice(inserti, 0, newkeyframe);
        else
            keyframes.push(newkeyframe);

        switch (layerType)
        {
            case 1://PlotScript_Dialog
                this.CreateKeyFrameDialog(newkeyframe);
                break;
            case 2://Tween_Camera
                this.CreateKeyFrameTween(newkeyframe, true);
                break;
            case 3://Tween_Character
                this.CreateKeyFrameTween(newkeyframe, false);
                break;
            case 4://PlotScript_Character_Animation
                this.CreateKeyFrameAnimation(newkeyframe);
                break;
            case 6://Tween_MainRole
                this.CreateKeyFrameTween(newkeyframe, false);
                break;
            case 7://Script_Effect_Scene
                if (keytype == 0)
                    this.CreateKeyFrameEffect(newkeyframe);
                else if (keytype == 1)
                    this.CreateKeyFrameCameraEffect(newkeyframe);
                break;
            case 8://Script_Effect_Character
                this.CreateKeyFrameCharacterEffect(newkeyframe);
                break;
            case 9://PlotScript_QTE
                this.CreateKeyFrameDialog(newkeyframe);
                break;
            case 10://Audio_vo
                this.CreateKeyFrameVoMusic(newkeyframe);
                break;
            case 11://Audio_sfx
                this.CreateKeyFrameSfxMusic(newkeyframe);
                break;
            case 12://Audio_music
                this.CreateKeyFrameMusic(newkeyframe);
                break;
            case 13://Audio_music
                this.CreateKeyFrameAudio(newkeyframe);
                break;
            default://Script
                break;
        }
        ///刷新时间线
        this._redrawIndexLayers([this.currentLayer]);
        this.OnFrameChange();
    }
}

Timeline.prototype.DiscreaseBlock = function()
{
    let layerdata = this.currentState.layers[this.currentLayer];
    if (!layerdata) return;
    if(_global.editor && _global.editor.edaction)
        _global.editor.edaction.AddAction();
    let layerType = this.GetLayerTypeID(layerdata.name);
    //判断是否被块占了
    let retdata = this._GetFrameBlock(this.currentFrame,layerdata,true);
    let blockdata = retdata.block;
    if(blockdata)
    {
        if (blockdata.end <= 1)//删掉整个block
        {
            for (let i=0; i<layerdata.blocks.length; i++)
            {
                if (blockdata == layerdata.blocks[i])
                {
                    layerdata.blocks.splice(i, 1);
                    break;
                }
            }
        }
        else
        {
            blockdata.end--;
            let keyindex = this.currentFrame - blockdata.begin;
            let curframe;
            if (blockdata.keyframes)
            {
                let keyframes = blockdata.keyframes;
                for(let i=keyframes.length-1; i >=0; i--)
                {
                    if(keyframes[i].id > keyindex)
                    {
                        keyframes[i].id--;
                    }
                    else if (keyframes[i].id == keyindex)
                    {
                        keyframes.splice(i, 1);
                        break;
                    }
                    else if (curframe==null)
                    {
                        curframe = keyframes[i];
                    }
                }
            }
            //处理script.TotalFrames
            if (curframe && curframe.data && curframe.data.scripts)
            {
                let scripts = curframe.data.scripts;
                for (let i = 0; i < scripts.length; i++)
                {
                    keyindex = keyindex - curframe.id;
                    if (scripts[i].TotalFrames!=undefined && keyindex<scripts[i].TotalFrames)
                        scripts[i].TotalFrames--;
                }
            }
        }
        this._drawFrameIndexs([this.currentFrame]);
        this.OnFrameChange(true);
    }
}

Timeline.prototype.IncreaseBlock = function()
{
    let layerdata = this.currentState.layers[this.currentLayer];
    if (!layerdata) return;
    if(_global.editor && _global.editor.edaction)
        _global.editor.edaction.AddAction();
    let layerType = this.GetLayerTypeID(layerdata.name);
    //判断是否被块占了
    let retdata = this._GetFrameBlock(this.currentFrame,layerdata,true);
    let blockdata = retdata.block;
    if(!blockdata)
    {
        retdata = this._GetBeforBlock(this.currentFrame);
        blockdata = retdata.block;
        if (blockdata)
        {
            blockdata.end = this.currentFrame + 1;
        }
        else
        {
            this.CreateBlock(this.currentLayer, this.currentFrame, layerType);
        }
        this._drawFrameIndexs([this.currentFrame]);
        this.OnFrameChange(true);
    }
    else//当前选中帧在时间块内
    {
        blockdata.end++;
        let curframe;
        let keyindex = this.currentFrame - blockdata.begin;
        if (blockdata.keyframes)
        {
            let keyframes = blockdata.keyframes;
            for (let i = 0; i < keyframes.length; i++)
            {
                let frame = keyframes[i];
                if (frame.id >= keyindex)
                {
                    frame.id++;
                }
                else
                {
                    curframe = frame;
                }
            }
        }
        //处理script.TotalFrames
        if (curframe && curframe.data && curframe.data.scripts)
        {
            let scripts = curframe.data.scripts;
            for (let i = 0; i < scripts.length; i++)
            {
                keyindex = keyindex - curframe.id;
                if (scripts[i].TotalFrames!=undefined && keyindex<scripts[i].TotalFrames)
                    scripts[i].TotalFrames++;
            }
        }
        this._drawFrameIndexs([this.currentFrame]);
        this.OnFrameChange(true);
    }
}

Timeline.prototype.CreateKeyFrameCameraEffect = function(keyframe)
{
    if (keyframe.data.scripts && keyframe.data.scripts.length>0)
        return;
    let obj = {
        "type": new KFDName("TSPlayCameraScreenEffectData"),
        "__cls__": "TSPlayCameraScreenEffectData",
        "VisualFXID": "NS_60002_Lxw_Hit_01_Plot",
    };
    keyframe.data.scripts.push(obj);
}

Timeline.prototype.CreateKeyFrameCharacterEffect = function(keyframe)
{
    if (keyframe.data.scripts && keyframe.data.scripts.length>0)
        return;

    let obj = {
        "type": new KFDName("GSPlayVisualFXScriptData"),
        "__cls__": "GSPlayVisualFXScriptData",
        "VisualFXID": "NS_60002_Lxw_Hit_01_Plot",
        "CustomSocketName":"",
        "FollowTarget":true,
        "IsCreatedByBuff":true,
        "IsCreatedWorldSpace":false,
        "SocketName":"Effect.Socket.LeftHand",
        "WorldPositionZOffsetType": 0,
        "Offset": {
            "X": 0,
            "Y": 0,
            "Z": 0
        },
    };
    keyframe.data.scripts.push(obj);
}

Timeline.prototype.CreateKeyFrameEffect = function(keyframe)
{
    if (keyframe.data.scripts && keyframe.data.scripts.length>0)
        return;
    let obj = {
        "type": new KFDName("GSPlayVisualFXScriptData"),
        "__cls__": "GSPlayVisualFXScriptData",
        "VisualFXID": "NS_60002_Lxw_Hit_01_Plot",
        "WorldPositionZOffsetType": 0,
        "Offset": {
            "X": 90217.8515625,
            "Y": -18286.955078125,
            "Z": 1672.151123046875
        },
        "IsCreatedWorldSpace": true,
    };
    keyframe.data.scripts.push(obj);
}

Timeline.prototype.CreateKeyFrameHideMainUI = function(keyframe, isClosed=true)
{
    let obj = {
        "type": new KFDName("TSUIControlData"),
        "__cls__": "TSUIControlData",
        "comp": 18,
        "hidden": true,
        "defaultState": 1,
        "main_mdt_cls_name": "class RAWorldLevelMediator",
    };
    if (isClosed)
        obj.group = 0; //关闭脚本
    keyframe.data.scripts.push(obj);
}

Timeline.prototype.CreateKeyFrameLimitRoleInput = function(keyframe, isClosed=true)
{
    let obj = {
        "type": new KFDName("GSLimitRoleInputData"),
        "__cls__": "GSLimitRoleInputData",
        "blimitInput": true,
        "blimitInputVkey": true,
    };
    if (isClosed)
        obj.group = 0; //关闭脚本
    keyframe.data.scripts.push(obj);
}

Timeline.prototype.CreateKeyFramePassBtn = function(keyframe, isClosed=true)
{
    let obj = {};
    obj.TargetData ={
        "option": 1,
        "asseturl": ":KF8PlotPassButton",
        "instname": new KFDName("btnPass"),
    };
    obj.type = new KFDName("GSCreateChildScriptData");
    obj.__cls__ = "GSCreateChildScriptData";
    if (isClosed)
        obj.group = 0; //关闭脚本
    keyframe.data.scripts.push(obj);
}

Timeline.prototype.CreateKeyFrameDialog = function(keyframe)
{
    if (keyframe.data.scripts && keyframe.data.scripts.length>0)
        return;

    keyframe.data.scripts = [];
    keyframe.data.scripts.push({
        "type": new KFDName("TSPlayUIData"),
        "TotalFrames": 100,
        "DialogPageParams": {
            "dialogSpeed": 1,
            "dialogIndex": "",
            "__cls__": "TSPlayDialogPageParam"
        },
        "__cls__": "TSPlayUIData"
    });
}

Timeline.prototype.CreateKeyFrameVoMusic = function(keyframe)
{
    if (keyframe.data.scripts && keyframe.data.scripts.length>0)
        return;

    keyframe.data.scripts = [];
    keyframe.data.scripts.push({
        "type": new KFDName("TSPlayAudioData"),
        "arg": {
            "type":2,
            "__cls__":"KFAudioPlayInfo"
        },
        "__cls__": "TSPlayAudioData"
    });
}

Timeline.prototype.CreateKeyFrameSfxMusic = function(keyframe)
{
    if (keyframe.data.scripts && keyframe.data.scripts.length>0)
        return;

    keyframe.data.scripts = [];
    keyframe.data.scripts.push({
        "type": new KFDName("TSPlayAudioData"),
        "__cls__": "TSPlayAudioData"
    });
}

Timeline.prototype.CreateKeyFrameMusic = function(keyframe)
{
    if (keyframe.data.scripts && keyframe.data.scripts.length>0)
        return;

    keyframe.data.scripts = [];
    keyframe.data.scripts.push({
        "type": new KFDName("TSPlayAudioData"),
        "arg": {
            "type":1,
            "__cls__":"KFAudioPlayInfo"
        },
        "__cls__": "TSPlayAudioData"
    });
}

Timeline.prototype.CreateKeyFrameAudio = function(keyframe)
{
    if (keyframe.data.scripts && keyframe.data.scripts.length>0)
        return;

    keyframe.data.scripts = [];
    keyframe.data.scripts.push({
        "type": new KFDName("TSPlayAudioData"),
        "arg": {
            "type":0,
            "__cls__":"KFAudioPlayInfo"
        },
        "__cls__": "TSPlayAudioData"
    });
    keyframe.data.scripts.push({
        "type": new KFDName("TSPlayAudioData"),
        "arg": {
            "type":2,
            "__cls__":"KFAudioPlayInfo"
        },
        "__cls__": "TSPlayAudioData"
    });
}

Timeline.prototype.CreateKeyFrameAnimation = function(keyframe)
{
    if (keyframe.data.scripts && keyframe.data.scripts.length>0)
        return;
    keyframe.data.scripts = [];
    keyframe.data.scripts.push({
        "type": new KFDName("TSPlayAnimationData"),
        "TotalFrames": 100,
        "MotionID": 3050100,
        "__cls__": "TSPlayAnimationData"
    });
}

Timeline.prototype.CreateKeyFrameTween = function(keyframe, isCamera)
{
    keyframe.vals = {"__cls__":"KFFrameValues"};
    if (isCamera)
    {
        keyframe.vals.nameArr = [19,67,17]; //位置:19 旋转:67 fov:17
        keyframe.vals.valArr = [0,0,0, 0,0,0, 90];
    }
    else
    {
        keyframe.vals.nameArr = [19,67]; //位置:19 旋转:67 fov:17
        keyframe.vals.valArr = [0,0,0, 0,0,0];
    }
    keyframe.vals.tween = {"__cls__":"LinearTweenOperation"};
}

Timeline.prototype.AddBlock = function()
{
    if(this.currentFrame < 0)
    {
        Nt("没有选中的帧");
        return;
    }

    if(_global.editor && _global.editor.edaction)
        _global.editor.edaction.AddAction();

    let layerdata = this.currentState.layers[this.currentLayer];
    ///判断是否被块占了
    let retdata = this._GetFrameBlock(this.currentFrame,layerdata,true);
    if(retdata.block)
    {
        Nt("帧已经被其他块占用!");
        return;
    }

    ///创建一个新块
    let blockdata = {"__cls__":"KFTimeBlockData"};

    blockdata.label = "timeblock" + layerdata.blocks.length;
    blockdata.begin = this.currentFrame;
    blockdata.end = this.currentFrame + 1;

    layerdata.blocks.push(blockdata);

    this._drawFrameIndexs([this.currentFrame]);

    this.OnFrameChange(true);
}

Timeline.prototype.RemoveBlock = function()
{
    if(this.currentFrame < 0)
    {
        Nt("没有选中的帧");
        return;
    }

    if(_global.editor && _global.editor.edaction)
        _global.editor.edaction.AddAction();

    let layerdata = this.currentState.layers[this.currentLayer];
    ///判断是否被块占了
    let retdata = this._GetFrameBlock(this.currentFrame,layerdata,true);
    let blockdata = retdata.block;
    if(!blockdata)
    {
        Nt("没有选中块!");
        return;
    }

    let index = layerdata.blocks.indexOf(blockdata);
    if(index != -1)
    {
        layerdata.blocks.splice(index,1);
        this._redrawIndexLayers([this.currentLayer]);

        this.OnFrameChange(true);
    }
}

Timeline.prototype.AddBlockFrame = function(keyframe)
{
    let retdata = this._GetBeforBlock(this.currentFrame);
    let blockdata = retdata.block;

    if(blockdata) {

        keyframe = keyframe ? keyframe : false;

        if (keyframe)
        {
            ///创建一个关键帧
            if(retdata.inblock)
            {
                if(_global.editor && _global.editor.edaction)
                    _global.editor.edaction.AddAction();
                let keyframes = blockdata.keyframes;
                if(!keyframes) {keyframes = [];blockdata.keyframes = keyframes}

                let keyindex = this.currentFrame - blockdata.begin;
                let inserti = 0;

                for(let i = 0 ; i < keyframes.length ;i ++)
                {
                    let keyframedata = keyframes[i];
                    let findex = keyframedata.id;

                    if(findex == keyindex)
                    {
                        Nt("已经是关键帧");
                        return;
                    }
                    else if(keyindex < findex)
                    {
                        inserti = i;
                    }
                }

                let newkeyframe = {"__cls__":"KFKeyFrame"};
                newkeyframe.data= {"__cls__":"KFFrameData"};
                newkeyframe.id = keyindex;
                ///按顺序排列索引
                keyframes.splice(inserti, 0, newkeyframe);
                ///刷新时间线
                this._redrawIndexLayers([this.currentLayer]);

                this.OnFrameChange();

            }else
                Nt("不在块内不能创建关键帧");
        }
        else {
            if(retdata.inblock)
            {
                Nt("块已经包括此帧");
            }else
                {
                    if(_global.editor && _global.editor.edaction)
                        _global.editor.edaction.AddAction();
                    blockdata.end = this.currentFrame + 1;
                    this._redrawIndexLayers([this.currentLayer]);
                    this.OnFrameChange(true);
                }
        }
    }else
        {
            Nt("请先创建一个块!");
        }
}

Timeline.prototype.RemoveBlockFrame = function()
{
    let layerdata = this.currentState.layers[this.currentLayer];
    ///判断是否被块占了
    let retdata = this._GetFrameBlock(this.currentFrame,layerdata,true);
    let blockdata = retdata.block;
    if(!blockdata)
    {
        Nt("没有选中块!");
        return;
    }

    if(!retdata.frameData)
    {
        Nt("没有选中关键帧!");
        return;
    }

    let index = blockdata.keyframes.indexOf(retdata.frameData);
    if(index != -1)
    {
        if(_global.editor && _global.editor.edaction)
            _global.editor.edaction.AddAction();
        blockdata.keyframes.splice(index,1);
        this._redrawIndexLayers([this.currentLayer]);
        this.OnFrameChange();
    }

}

Timeline.prototype.CopyFrame = function()
{
    let retframedata = this._GetFrameBlock(this.currentFrame, null, true);
    if(retframedata) {
        if(retframedata.frameData)
        {
            ClipboardTool.SetClipboardOfKFD("KeyFrame", retframedata.frameData);
            // this.CopyKeyFrame = retframedata;
        }
        else
        {
            $.messager.alert('警告','复制的非关键帧');
        }
    }
}

Timeline.prototype.PasteFrame = function()
{
    let copyKeyFrame = ClipboardTool.GetClipboardOfKFD('KeyFrame');
    let retframedata = this._GetFrameBlock(this.currentFrame, null, true);
    if(retframedata && copyKeyFrame)
    {
        if(retframedata.frameData)
        {
            _global.timeline = this;
            $.messager.confirm('警告','你是否覆盖以存在的关键帧？', function (c){
                if(c) {
                    _global.timeline.FrameCover();
                }
            });
        }
        else
        {
            this.FrameCover();
        }
    }
}

Timeline.prototype.FrameCover = function ()
{
    if(_global.editor && _global.editor.edaction)
        _global.editor.edaction.AddAction();
    let retdata = this._GetBeforBlock(this.currentFrame);
    let blockdata = retdata.block;
    if(blockdata) {
        if(retdata.inblock)
        {
            let newkeyframe = ClipboardTool.GetClipboardOfKFD('KeyFrame');
            if (!newkeyframe) return;

            let keyframes = blockdata.keyframes;
            if(!keyframes) {keyframes = [];blockdata.keyframes = keyframes}
            let keyindex = this.currentFrame - blockdata.begin;
            let inserti = 0;
            let delCount = 0;

            // let kfbytearr = new KFByteArray();
            // KFDJson.write_value(kfbytearr, this.CopyKeyFrame.frameData);
            // kfbytearr.SetPosition(0);
            // let newkeyframe = KFDJson.read_value(kfbytearr, false);
            newkeyframe.id = keyindex;

            for(let i = 0; i < keyframes.length; i++)
            {
                let keyframedata = keyframes[i];
                if (keyframedata.id === keyindex)
                {
                    inserti = i;
                    delCount = 1;
                    break;
                } else if (keyframedata.id < keyindex) {
                    // 没有相同的，顺便找个合适位置
                    inserti = i + 1;
                }
            }
            keyframes.splice(inserti, delCount, newkeyframe);

            this._redrawIndexLayers([this.currentLayer]);
            this.OnFrameChange();
        }
    }
}

Timeline.prototype.CutFrame = function()
{
    let retframedata = this._GetFrameBlock(this.currentFrame, null, true);
    if(retframedata) {
        if(retframedata.frameData)
        {
            if(_global.editor && _global.editor.edaction)
                _global.editor.edaction.AddAction();
            ClipboardTool.SetClipboardOfKFD("KeyFrame", retframedata.frameData);
            // this.CopyKeyFrame = retframedata;
            this.RemoveBlockFrame();
        }
        else
        {
            $.messager.alert('警告','剪切的非关键帧');
        }
    }
}

// layerData  = {header:{name:,hide:false,lock:false} , frames:[]}
Timeline.prototype.AddLayer = function(layerData, drawall)
{
    if(this.currentState)
    {
        if(_global.editor && _global.editor.edaction)
            _global.editor.edaction.AddAction();

        let layers = this.currentState.layers;

        if(!layerData)
        {
            layerData = {
                    "__cls__": "KFTimelayerData"
                ,   name:"Layer" + this.layerid ++
                ,   option:{standalone:false,lock:false,visible:true,expand:true}
                ,   blocks:[]
            }
        }

        if (layers.indexOf(layerData) == -1)
        {
            let inserti = this.currentLayer + 1;
            if(inserti > 0 && inserti < layers.length)
            {
                layers.splice(inserti, 0, layerData);
                this.currentLayer = inserti;
            }
            else {
                layers.push(layerData);
                this.currentLayer = layers.length - 1;
            }

            this.currentFrame = -1;

            if (drawall)
            {
                this._redrawAllLayers();
            }

            this.OnFrameChange();
        }
    }
    else
    {
        Nt("currentState is null!");
    }
}

Timeline.prototype.ClearKeyFrames = function(sure)
{
    if(!sure)
    {
        $('#dlg').dialog('open').dialog('setTitle','删数据告警');
    }
    else
    {
        if(this.currentLayer == -1 || this.currentLayer > this.currentState.layers.length)
            return;

        let layerdata = this.currentState.layers[this.currentLayer];

        let blocks = layerdata ? layerdata.blocks : [];

        for(let i = 0 ; i < blocks.length ; i++)
        {
            if(blocks[i] && blocks[i].keyframes)
                blocks[i].keyframes = [];
        }

        this._redrawAllLayers();

        this.OnFrameChange();
    }
}

Timeline.prototype.ClearInvalidFrames = function()
{
    if(this.currentLayer == -1 || this.currentLayer > this.currentState.layers.length)
        return;

    let layerdata = this.currentState.layers[this.currentLayer];

    let blocks = layerdata ? layerdata.blocks : [];

    //目前强制只有一个block
    blocks.splice(1, blocks.length - 1);
    //目前强制只有一个block
    for(let i = 0 ; i < blocks.length ; i++)
    {
        if(blocks[i] && blocks[i].keyframes)
        {
            let tmpFrames = new Array();
            for(let j = 0 ; j < blocks[i].keyframes.length ; j++)
            {
                if(blocks[i].keyframes[j].id >= 0 && blocks[i].keyframes[j].id < blocks[i].end - blocks[i].begin)
                {
                    tmpFrames.push(blocks[i].keyframes[j]);
                }
            }
            blocks[i].keyframes = tmpFrames;
        }
    }

    this._redrawAllLayers();

    this.OnFrameChange();    
}

Timeline.prototype.SaveLayer = function()
{
    if(this.currentLayer == -1 || this.currentLayer > this.currentState.layers.length)
        return;

    //1,2 层不能单独保存
    if (this.currentLayer == 0 || this.currentLayer == 1)
    {
        Alert("Warning","动画逻辑层不需单独保存!");
        return;
    }
    if (_global.editor.blkdata) {
        _global.editor.context.SaveLayer(_global.editor.blkdata, this.currentLayer);
    }
}

Timeline.prototype.SaveAudioLayer = function()
{
    if(this.currentLayer == -1 || this.currentLayer > this.currentState.layers.length)
        return;

    if (this.currentState.layers[this.currentLayer].name != "Audio")
    {
        Alert("Warning","非音频层不支持保存!");
        return;
    }

    if (_global.editor.blkdata) {
        _global.editor.context.SaveLayer(_global.editor.blkdata, "Audio");
    }
}

Timeline.prototype.SaveLayerUsingName = function(layerName)
{
    var layerIndex= -1;
    if(this.currentState)
    {
        for(var i = 0; i < this.currentState.layers.length; i++)
        {
            if(this.currentState.layers[i].name == layerName)
            {
                layerIndex = i;
                break;
            }
        }
    }

    if (_global.editor.blkdata && layerIndex != -1) {
        _global.editor.context.SaveLayer(_global.editor.blkdata, layerIndex,true);
    }
}

Timeline.prototype.RemoveLayer = function()
{
    if(this.currentLayer == -1 || this.currentLayer > this.currentState.layers.length)
        return;

    if(_global.editor && _global.editor.edaction)
        _global.editor.edaction.AddAction();


    this.currentState.layers.splice(this.currentLayer,1);
    this.currentLayer = -1;
    this.currentFrame = -1;

    
    this._redrawAllLayers();

    this.OnFrameChange();
}


Timeline.prototype.BanLayer = function()
{
    if(this.currentLayer == -1 || this.currentLayer > this.currentState.layers.length)
        return;

    if(_global.editor && _global.editor.edaction)
        _global.editor.edaction.AddAction();

    var layerOption = this.currentState.layers[this.currentLayer].option;
    if(layerOption)
    {
        if(layerOption.ban == true)
        {
            layerOption.ban = false;
        }
        else
        {
            layerOption.ban = true;
        }
    }

    this._redrawAllLayers();

    this.OnFrameChange();
}

Timeline.prototype.SelectedLayer = function(layerindex, rightsel, frameindex)
{
    let old = this.currentLayer;
    let oldframe = this.currentFrame;

    this.currentLayer = layerindex;
    this.currentFrame = frameindex === undefined  ? -1 : frameindex;

    _global.currentLayer = this.currentLayer
    _global.currentFrame = this.currentFrame

    if(this.currentFrame != -1){
        this.setHeaderCurrentFrame(this.currentFrame);
    }

    if(rightsel)
    {
        this.uiHeader.datagrid("selectRow", layerindex);
    }

    let indexs = [];
    if(layerindex >= 0)
    {
        indexs.push(layerindex);
    }
    if(old >= 0 && old != layerindex)
    {
        indexs.push(old);
    }
    this._redrawIndexLayers(indexs);

}

Timeline.prototype.CopyLayer = function ()
{
     let copyLayer = this.currentState.layers[this.currentLayer];
     if(copyLayer)
     {
         copyLayer.__cls__ = "KFTimelayerData";
         ClipboardTool.SetClipboardOfKFD('TimelineLayer', copyLayer);
         // this.copyLayerData = JSON.parse(JSON.stringify(copyLayer));
     }
     else
     {
         // this.copyLayerData = null;
         $.messager.alert('警告','复制图层为空');
     }
}

Timeline.prototype.PasteLayer = function ()
{
    let copyLayerData = ClipboardTool.GetClipboardOfKFD('TimelineLayer');
    if(!copyLayerData)
    {
        $.messager.alert('警告','未设置复制源图层');
        return;
    }
    this.currentState.layers[this.currentLayer] = copyLayerData;
    this.currentState.length = Timeline.ReCalcStateLength(this.currentState);
    // this.copyLayerData = JSON.parse(JSON.stringify(this.copyLayerData));
    
    this.uiHeader.datagrid('refreshRow', this.currentLayer);
    this._redrawIndexLayers([this.currentLayer]);
    this.OnFrameChange();
}

Timeline.prototype.CutLayer = function ()
{
    let copyLayer = this.currentState.layers[this.currentLayer];
    if(copyLayer)
    {
        copyLayer.__cls__ = "KFTimelayerData";
        ClipboardTool.SetClipboardOfKFD('TimelineLayer', copyLayer);
        // this.copyLayerData = JSON.parse(JSON.stringify(copyLayer));

        this.RemoveLayer();
        this.uiHeader.datagrid('refreshRow', this.currentLayer);
        this._redrawIndexLayers([this.currentLayer]);
        this.OnFrameChange();
    }
    else
    {
        // this.copyLayerData = null;
        $.messager.alert('警告','复制图层为空');
    }
}

Timeline.prototype._addHeader = function(header)
{
    this.uiHeader.datagrid('appendRow',header);
}

Timeline.prototype._reloadHeaders = function(data)
{
    this.uiHeader.datagrid('loadData',data);
}

Timeline.prototype._GetBeforBlock = function(frameindex,layerdata)
{
    if(!frameindex) frameindex = this.currentFrame;
    if(!layerdata) layerdata = this.currentState.layers[this.currentLayer];

    let blockdata = null;
    let inblock = false;
    let beforeend = -1;//上一个块的END
    let blocks = layerdata.blocks;

    for(let z = 0 ; z < blocks.length ; z ++)
    {
        let block = blocks[z];

        if(     frameindex >= block.begin
            &&  frameindex < block.end)
        {
            blockdata = block;
            inblock = true;
            break;
        }else if(frameindex >= block.end)
            {
                if(block.end > beforeend)
                {
                    blockdata = block;
                    beforeend = block.end;
                }
            }
    };


    return {block:blockdata
        ,inblock:inblock};
}

Timeline.prototype._GetFrameBlock = function(frameindex
                                             , layerdata
                                             , oneframe)
{
    oneframe = oneframe ? oneframe : false;

    if(!layerdata)
        layerdata = this.currentState.layers[this.currentLayer];

    let blockdata = null;
    let blocks = layerdata ? layerdata.blocks : [];
    let frameTypes = [];
    let currFrameType = 0;
    let cuffFrameData = null;

    for(let z = 0 ; z < blocks.length ; z ++)
    {
        let block = blocks[z];

        if(     frameindex >= block.begin
            &&  frameindex < block.end)
        {
            blockdata = block;

            if(oneframe)
            {
                let retinfo = FrameTypes.GetFrameInfo(frameindex, blockdata);
                cuffFrameData = retinfo.data;
                currFrameType = retinfo.frameType;
                break;
            }
        }

        if(!oneframe)
        {
            ///展开数据
            for (let zf = block.begin; zf < block.end; zf++)
            {
                frameTypes[zf] = block.opOption == 31  ? FrameTypes.BlockTweenFrame * 1000000 : FrameTypes.BlockFrame * 1000000;
            }

            let bkfs = block.keyframes;
            if(bkfs)
            {
                for(let zkf = 0;zkf < bkfs.length; zkf ++)
                {
                    let keyfd = bkfs[zkf];
                    let fdata = keyfd.data;
                    let box = keyfd.box;
                    let tweenType = null;
                    if(keyfd.vals && keyfd.vals.tween)
                    {
                        tweenType = keyfd.vals.tween.__cls__;
                    }
                    let blockType = block.opOption;
                    /*frameTypes[block.begin + keyfd.id] = box && box.AttackBoxes && box.AttackBoxes.length > 0 ? FrameTypes.BlockAtkBoxFrame :
                        (fdata.scripts && fdata.scripts.length > 0 ?
                            FrameTypes.BlockScriptFrame
                        : FrameTypes.BlockKeyFrame);*/
                    frameTypes[block.begin + keyfd.id] = FrameTypes.GetFrameType(blockType, tweenType, fdata, box);
                }
            }
        }
    }

    let retobj  = {}

    retobj.frameType = currFrameType;
    retobj.frameData = cuffFrameData;
    retobj.frameTypes = frameTypes;
    retobj.block = blockdata;

    return retobj;
}
