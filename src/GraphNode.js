

function truncWithEllipsis(text, style, maxWidth)
{
    let metrics = PIXI.TextMetrics.measureText(text, style);
    let maxLineWidth = metrics.maxLineWidth;

    if(maxLineWidth > maxWidth)
    {
        let len = text.length;
        let maxlen = Math.floor(maxWidth / maxLineWidth * len) - 1;
        text = text.slice(0,maxlen) + "...";
    }

    return text;
}

function GraphIO(node, ioindex, label, width, inputdata, outputdata) {
    let NodeStyle = GraphNode.Style;// node.style???

    this.node = node;
    this.ioindex = ioindex;
    this.isEvt = (node.blockdata.type >= 5 && node.blockdata.type < 8);
    this.isPull = (node.blockdata.type >= 8);
    this.canvas = null;
    this.inputdata = inputdata;
    this.outputdata = outputdata;
    this.iostyle = NodeStyle.iostyle;

    ///输出的线条
    this.outlines = [];
    ///输入的线条
    this.inlines = [];

    this.spaceborder = NodeStyle.border;
    //this.spacecolor = NodeStyle.bgcolor;

    if (GraphIO.styleinstance == null) {
        GraphIO.styleinstance = new PIXI.TextStyle(this.iostyle.txt);
    }
    if (GraphIO.foldstyleinstance == null) {
        GraphIO.foldstyleinstance = new PIXI.TextStyle(this.iostyle.foldtxt);
    }

    this.iotxtstyle = GraphIO.styleinstance;
    this.foldtxtstyle = GraphIO.foldstyleinstance;

    this.label = label;
    this.width = width;
    this.radius = 8;

    this.display = new PIXI.Graphics();
    this.iotext = new PIXI.Text("", this.iotxtstyle);

    this.display.addChild(this.iotext);

    this.foldtext = new PIXI.Text("", this.foldtxtstyle);
    this.display.addChild(this.foldtext);

    this.drawbackground();
    this.setlabel(label);
}

GraphIO.prototype.update = function () {
    if (this.outputdata && this.outputdata.func && this.outputdata.func.name) {
        this.label = this.outputdata.func.name.toString();
        this.setlabel(this.label);
    }
}

GraphIO.prototype.setoutline = function (line) {
    let outline = line;
    outline.outdata = this.outputdata;
    outline.outio = this;
    this.outlines[0] = outline;
}

GraphIO.prototype.setinline = function (line) {
    let inline = line;
    inline.inputdata = this.inputdata;
    inline.inio = this;
    this.inlines[0] = inline;
}

GraphIO.prototype.Buildconnection = function () {
    if (this.canvas) {
        ///处理两种情况 push 和 pull
        if (false == this.isPull) {
            if (this.outputdata && this.outputdata.name) {

                let innodename = this.outputdata.name;
                ///找目标
                let innode = this.canvas.FindNodeByKFName(innodename);
                if (innode) {
                    ///把名称先关联上去
                    this.outputdata.name = innode.blockdata.name;
                    ///画线
                    let newline = new GraphLine(this.outputdata);
                    this.canvas.background.addChild(newline.display);
                    ///设置起点和终点
                    this.setoutline(newline);
                    ///添加到输入端
                    let dest = this.outputdata.dest;
                    if (isNaN(dest)) dest = 0;
                    let ioitem = innode.ioitems[dest];

                    newline.inio = ioitem;
                    ioitem.addinlines(newline);

                    newline.updateioconnected();

                }
            }
        } else {
            if (this.inputdata && this.inputdata.name) {

                let outnodename = this.inputdata.name;
                ///找目标
                let outnode = this.canvas.FindNodeByKFName(outnodename);
                if (outnode) {
                    ///把名称先关联上去
                    this.inputdata.name = outnode.blockdata.name;
                    ///画线
                    let newline = new GraphLine(null, this.inputdata);
                    this.canvas.background.addChild(newline.display);
                    ///设置起点和终点
                    this.setinline(newline);
                    ///添加到输入端
                    let dest = this.inputdata.dest;
                    if (isNaN(dest)) dest = 0;
                    let ioitem = outnode.ioitems[dest];

                    newline.outio = ioitem;
                    ioitem.addoutlines(newline);

                    newline.updateioconnected();

                }
            }
        }
    }
}

GraphIO.prototype.RemoveInputs = function () {
    ///让所有连到我这边的线都断连
    for (let i = this.inlines.length - 1; i >= 0; i--) {
        let inline = this.inlines[i];
        inline.break();
    }
    this.inlines.length = 0;
}

GraphIO.prototype.Disconnect = function (clear) {
    ///是否需要清理很干净否则只要删除视图
    if (clear) {
        ///让所有连到我这边的线都断连
        for (let inline of this.inlines) {
            inline.break();
        }
        ///让我连接的线也断开
        for (let outline of this.outlines) {
            outline.break();
        }
        if (false == this.isPull) {
            this.inlines.length = 0;
        } else {
            this.outlines.length = 0;
        }
    }

    if (false == this.isPull) {
        for (let outline of this.outlines) {
            this.canvas.background.removeChild(outline.display);
        }
        this.outlines.length = 0;
    } else {

        for (let inline of this.inlines) {
            this.canvas.background.removeChild(inline.display);
        }
        this.inlines.length = 0;
    }

    this.outputdata = null;
    this.inputdata = null;
}

GraphIO.prototype.updateioconnected = function () {
    for (let outline of this.outlines) {
        outline.updateioconnected();
    }

    for (let i = 0; i < this.inlines.length; i++) {
        this.inlines[i].updateioconnected();
    }
}

GraphIO.prototype.redrawlines = function () {
    if (this.isPull == false) {

        for (let outline of this.outlines) {
            outline.updateioconnected();
        }
    } else {
        for (let inline of this.inlines) {
            inline.updateioconnected();
        }
    }
}

GraphIO.prototype.removeinlines = function (line) {
    for (let i = 0; i < this.inlines.length; i++) {
        if (this.inlines[i] == line) {
            this.inlines.splice(i, 1);
            return i;
        }
    }
    return -1;
}

GraphIO.prototype.removeoutlines = function (line) {
    for (let i = 0; i < this.outlines.length; i++) {
        if (this.outlines[i] == line) {
            this.outlines.splice(i, 1);
            return i;
        }
    }
    return -1;
}

GraphIO.prototype.addinlines = function (line) {
    this.inlines.push(line);
}

GraphIO.prototype.addoutlines = function (line) {
    this.outlines.push(line);
}

GraphIO.prototype.getposglobal = function (isin) {
    if (isin) {
        if (this.innode)
            return this.innode.toGlobal(new PIXI.Point(0, 0))
    } else if (this.outnode) {
        return this.outnode.toGlobal(new PIXI.Point(0, 0));
    }

    return this.display.toGlobal(new PIXI.Point(0, 0));
}

GraphIO.prototype.onDragStart = function (event) {
    this._dragdata = event.data;
    this._dragtarget = event.currentTarget;

    let outstart = this._dragtarget == this.outnode;
    // 如果当前节点是折叠状态，就不允许Drag
    if (outstart && this.node.IsFolded()) {
        return;
    }

    this._dragging = true;
    let newevt = {
        currentTarget: this, orgevent: event, data: event.data
        , pos: this._dragtarget.toGlobal(new PIXI.Point(0, 0))
        , outstart: outstart
    };

    GraphIO.Event.emit("onIOStart", newevt);

}

GraphIO.prototype.onDragEnd = function (event) {
    if (this._dragging) {
        this._dragging = false;
        this._dragdata = null;
        this._dragtarget = null;
        ///
        let newevt = {currentTarget: this, orgevent: event, data: event.data};
        GraphIO.Event.emit("onIOEnd", newevt);
    } else {
        let outstart = event.currentTarget == this.outnode;
        // 如果当前节点是折叠状态，就不允许Drag
        if (outstart && this.node.IsFolded()) {
            return;
        }
        let newevt = {
            currentTarget: this
            , orgevent: event
            , data: event.data
            , outstart: outstart
        };

        GraphIO.Event.emit("onIOConnected", newevt);
    }
}

GraphIO.prototype.ShowFold = function (folded) {
    if (folded) {
        this.foldtext.anchor.set(0.5, 0.5);
        this.foldtext.text = "+";
    } else {
        this.foldtext.anchor.set(0.5, 0.6);
        this.foldtext.text = "-";
    }
}

GraphIO.prototype.ClearFold = function () {
    this.foldtext.text = "";
}

GraphIO.prototype.onOutputMouseOver = function (event) {
    this.node.ShowFold();
}

GraphIO.prototype.onOutputMouseOut = function (event) {
    this.node.ClearFold();
}

GraphIO.prototype.onOutputClick = function (event) {
    this.node.ChangeFold();
}

GraphIO.prototype.Fold = function (hide) {
    for (line of item.outlines) {
        line.Fold(hide);
    }
    this.display.visible = !hide;
}

GraphIO.prototype.FoldOutput = function (hide) {
    for (line of item.outlines) {
        line.Fold(hide);
    }
    this.ShowFold(hide);
}

///def global event
GraphIO.Event  = new PIXI.utils.EventEmitter();



GraphIO.prototype.setlabel = function(txt)
{
    this.iotext.text = truncWithEllipsis(txt
    , this.iotxtstyle
    , this.width - this.radius);
    this.iotext.x = (this.width - this.iotext.width) / 2;
    this.iotext.y = (this.iostyle.height - this.iotext.height) / 2;
}

GraphIO.prototype.drawbackground = function()
{
    let graphics = this.display;
    let setting = this.iostyle;
    
    graphics.clear();

    ///不画那条横线了吧
    //graphics.lineStyle(setting.linesize,setting.linecolor);
    //graphics.moveTo(this.width,setting.height);
    //graphics.lineTo(0,setting.height);

    let iopdata =
        this.isPull == false ?
    {
        linesize : 4,
        linecolor :0xFF9999,
        bgcolor:0xFFEEEE,
        radius:this.radius
    }:
            {
                linesize : 4,
                linecolor :0xAAAAFF,
                bgcolor:0xEEEEFF,
                radius:this.radius
            }
    ;

    if(this.inputdata)
    {
        graphics.lineStyle(iopdata.linesize,iopdata.linecolor);
        graphics.beginFill(iopdata.bgcolor,1);

        let inx = - this.spaceborder;
        let iny = setting.height / 2;

        graphics.drawCircle(inx , iny ,iopdata.radius);
        graphics.endFill();

        this.innode = new PIXI.DisplayObject();
        this.innode.interactive = true;
        this.innode.buttonMode = true;

        this.innode
        // events for drag start
        .on('mousedown', this.onDragStart, this)
        .on('touchstart', this.onDragStart,this)
        // events for drag end
        .on('mouseup', this.onDragEnd,this)
        .on('mouseupoutside', this.onDragEnd,this)
        .on('touchend', this.onDragEnd,this)
        .on('touchendoutside', this.onDragEnd,this);

        this.innode.x = inx ;
        this.innode.y = iny ;

        this.innode.hitArea = new PIXI.Rectangle(
              - iopdata.radius
            , - iopdata.radius
            , iopdata.radius * 2
            , iopdata.radius * 2);

        this.display.addChild(this.innode);
    }

    iopdata = this.isPull == false?
    {
        linesize : 2,
        linecolor : (this.ioindex > 0 && this.isEvt) ? 0x99FF99 : 0xFF9999, //0xAAAAFF,
        bgcolor: (this.ioindex > 0 && this.isEvt) ? 0x99FF99 : 0xFF9999, //0x8888FF,
        radius: this.radius
    }:
        {
    linesize : 2,
        linecolor : 0x8888FF,
        bgcolor: 0x8888FF,
        radius: this.radius
        };
        
    if(this.outputdata)
    {

        let outx = this.width + this.spaceborder;
        let outy = setting.height / 2;

        graphics.lineStyle(iopdata.linesize, iopdata.linecolor);
        graphics.beginFill(iopdata.bgcolor, 1);
        graphics.drawCircle(outx, outy, iopdata.radius);
        graphics.endFill();
        this.foldtext.anchor.set(0.5);
        this.foldtext.x = outx;
        this.foldtext.y = outy;

        this.outnode = new PIXI.DisplayObject();
        this.outnode.interactive = true;
        this.outnode.buttonMode = true;
        // events for drag start
        this.outnode.on('mousedown', this.onDragStart, this)
            .on('touchstart', this.onDragStart, this)
            // events for drag end
            .on('mouseup', this.onDragEnd, this)
            .on('mouseupoutside', this.onDragEnd, this)
            .on('touchend', this.onDragEnd, this)
            .on('touchendoutside', this.onDragEnd, this)
            .on('mouseover', this.onOutputMouseOver, this)
            .on('mouseout', this.onOutputMouseOut, this)
            .on('click', this.onOutputClick, this);

        this.outnode.x = outx
        this.outnode.y = outy;
        this.outnode.hitArea = new PIXI.Rectangle(
            -iopdata.radius
            , -iopdata.radius
            , iopdata.radius * 2
            , iopdata.radius * 2);

        this.display.addChild(this.outnode);
    }

    //graphics.beginFill(setting.bgcolor);
    //if(setting.radius == 0)
    //    graphics.drawRect(0, 0, this.width, setting.height,setting.radius);
    //else
    //    graphics.drawRoundedRect(0, 0, this.width, setting.height,setting.radius);
    //graphics.endFill();
}


function GraphButton(node, index)
{
    let style = {
        linesize : 4,
        linecolor :0xCCCCFF,
        bgcolor:0xEEEEFF
    };

    this.node = node;
    this.style = style;
    this.display = new PIXI.Graphics();
    this.display.x = index * 25 + 15;
    this.display.y = -12.5;

    this.display.interactive = true;
    this.display.buttonMode = true;
    let self = this;
    this.display.on('mousedown',function (event) {
        let ctrlkey = event.data.originalEvent.ctrlKey;

        self.ToggleState(false,false, ctrlkey);
    });


    this.tag = index + 1;
    this.Update();
}

GraphButton.prototype.ToggleState = function(force, flag, ctrlkey)
{
    let blockdata = this.node.blockdata;
    let tag = this.tag;
    let execType = blockdata.execType;
    let enabled = (execType & tag) == tag;

    if(!force)
    {
        ///主运行不关闭的
        if (tag == 1 && enabled) return;
        ///辅助运行可以有多个
        if(tag == 1 || ctrlkey == false) {

            this.OffOthers();
        }
    }
    else if(flag == enabled)
    {
        return;
    }

    if(enabled) {
        blockdata.execType = (execType & (~tag));
    }else {
        blockdata.execType = (execType | tag);
    }

    this.Update();
}

GraphButton.prototype.OffOthers = function()
{
    let AllNodes =  this.node.canvas.AllNodes;
    for(let node of AllNodes){
       if(node.pullNode) {
           if(node.buttons){
               let tagbtn = node.tagbtns[this.tag - 1];
               if(tagbtn){
                   tagbtn.ToggleState(true,false);
               }
           }
       }
    }
}


GraphButton.prototype.Update = function ()
{
    let blockdata = this.node.blockdata;

    let tag = this.tag;
    let execType = blockdata.execType;
    let enabled = (execType & tag) == tag;
    let ecolor = tag == 1 ? 0xFFAAAA : 0xAAFFAA;
    let style = this.style;

    let graphics = this.display;

    graphics.clear();
    graphics.lineStyle(style.linesize,style.linecolor);
    graphics.beginFill(enabled ? ecolor : 0xffffff);
    graphics.drawRoundedRect(0, 0, 20, 20, 7);
    graphics.endFill();
}


function GraphNode(value,canvas)
{
    this.defaultlabel = "";
    this.canvas = canvas;
    this.blockdata = value;
    this.selected = false;
    this.pullNode = value.type == 8;
    this.style = this.pullNode ? GraphNode.StylePull : GraphNode.Style;

    this.display = new PIXI.Container();
    this.background = new PIXI.Graphics();
    this.content = new PIXI.Container();
    this.buttons = null;
    this.bounds =  {x:0,y:0,w:0,h:0};


    if(this.pullNode)
    {
        this.tagbtns = [];
        this.buttons = new PIXI.Container();
        let btn0 = new GraphButton(this,0);
        this.tagbtns.push(btn0);
        this.buttons.addChild(btn0.display);
        let btn1 = new GraphButton(this,1);
        this.buttons.addChild(btn1.display);
        this.tagbtns.push(btn1);
    }

    if(!GraphNode.headstyle)
    {
        GraphNode.headstyle = new PIXI.TextStyle(this.style.headstyle);
    }
    if (!GraphNode.breakpointhitheadstyle) {
        GraphNode.breakpointhitheadstyle = new PIXI.TextStyle(this.style.breakpointhitheadstyle);
    }

    this.headtxtstyle = GraphNode.headstyle;
    this.breakpointheadtxtstyle = GraphNode.breakpointhitheadstyle;
    this.headtext = new PIXI.Text('', this.headtxtstyle);

    this.display.addChild(this.background);
    this.display.addChild(this.headtext);
    this.display.addChild(this.content);
    if(this.buttons){
        this.display.addChild(this.buttons);
    }


    let setting = this.style;

    this.headloc = {    x:setting.border,
        y:setting.border,
        width: setting.width - setting.border * 2,
        height:setting.headheight
    };

    this.contentloc = { x:setting.border, 
        y:setting.border + setting.headheight,
        width:setting.width - setting.border * 2,
        height:0
    };

    this.updatecontent();
    this.drawbackground();

    //this.headtext.width = this.headloc.width;
    //this.headtext.height = this.headloc.height;
    //this.headtext.scale.set(1);

    this.setheadtext(value ? value.name.toString() : "undefined");
    this.initdragging();

    ///初始化位置
    let v3 = value ? value.position : null;
    if(!v3)
    {
        v3 = KFMath.v3New();
        value.position = v3;
    }
    this.setposition(KFMath.v3Val("x",v3) ,KFMath.v3Val("y",v3));
}

GraphNode.prototype.InRect = function(rect)
{
    let pixirect = this.bounds;


    //console.log(pixirect.x,pixirect.y,pixirect.w,pixirect.h,":", rect.x,rect.y,rect.w,rect.h);


    let maxx = pixirect.x + pixirect.w;
    let maxy = pixirect.y + pixirect.h;

    let rmaxx = rect.x + rect.w;
    let rmaxy = rect.y + rect.h;

    let xmin = Math.max(pixirect.x,rect.x);
    let ymin = Math.max(pixirect.y,rect.y);
    let xmax = Math.min(maxx,rmaxx);
    let ymax = Math.min(maxy,rmaxy);

    if(xmin > xmax || ymin > ymax){
        return false;
    }else
        return true;

}


GraphNode.prototype.Refresh = function()
{
    let value = this.blockdata;
    this.setheadtext(value ? value.name.toString() : "undefined");

    if(value.type >= 5 || value.type == 0)
    {
        let updatebg = false;

        let outputDatas = this.blockdata.outputs;
        let inputdatas = this.blockdata.inputs;
        let delstart = -1;
        let outcount = outputDatas.length;
        let inputcount = inputdatas.length;

        for(let o = 0; o < this.ioitems.length; o++)
        {
            let ioitem = this.ioitems[o];
            if(    ioitem.outputdata == outputDatas[o]
                && ioitem.inputdata == inputdatas[o])
            {
                ioitem.update();
            }
            else
            {

                delstart = o;
                break;
            }
        }

        if(delstart != -1)
        {
            let delitems = this.ioitems.concat();
            for (let d = delstart; d < delitems.length; d++)
            {
                this.RemoveIONode(delitems[d]);
                updatebg = true;
            }
        }

        let nexti = this.ioitems.length;
        let maxcount = outcount > inputcount ? outcount : inputcount;

        for(let i = nexti; i < maxcount; i ++)
        {
            let outputdata = outputDatas[i];
            if(outputdata && outputdata.func == null)
            {
                outputdata.func = {name:new KFDName(i == 0 ? this.defaultlabel : "undefine")}
            }

            this.AddIONode(outputdata, inputdatas[i]);
            updatebg = true;
        }


        if(updatebg)
        {
            this.drawbackground();
        }
    }
}

GraphNode.prototype.Redrawlines = function()
{
    for(let i = 0 ; i < this.ioitems.length ; i ++)
    {
        this.ioitems[i].redrawlines();
    }
}


GraphNode.Style = 
{
    width  : 140,
    height : 100,
    linesize : 3,
    debuglinesize : 4,
    linecolor:0xAAAAAA,
    sellinecolor:0xFFAAAA,
    debuglinecolor:0x00FF00,
    bgcolor: 0x666666,
    breakpointbgcolor: 0xFF0000,
    breakpointdisablebgcolor: 0xFA8072,// 橙红
    breakpointhitbgcolor: 0xFFFF00,
    border : 8,
    headheight: 30,
    ccolor: 0xFFFFFF,
    radius : 15,

    headstyle:{
        fontFamily : 'Arial'
        , fontSize: 16
        , fontWeight: 'normal'
        , fill : 0xFFEEEE
        , align : 'center'
        //, lineHeight: 35
    },

    breakpointhitheadstyle:{
        fontFamily : 'Arial'
        , fontSize: 16
        , fontWeight: 'bold'
        , fill : 'yellow'
        , align : 'center'
        //, lineHeight: 35
    },

    iostyle:{
        txt:
            {
                fontFamily : 'Arial'
                    , fontSize: 14
                    , fill : 0xEEEEEE
                    , align : 'center'
                    //, lineHeight: 35
                },
            foldtxt:
                {
                    fontFamily : 'Arial'
                    , fontSize: 18
                    , fill : 0xEEEEEE
                    , align : 'center'
                },
        height: 30,
        bgcolor: 0xFFFFFF,
            linesize : 3,
            linecolor:0xDDDDDD,
            radius : 15
    }
    ,connectlinecolor:0xBBBBBB
    ,debugconnectlinecolor:0x00FF00
    ,connectlinesize:4
};


GraphNode.StylePull =
    {
        width  : 140,
        height : 100,
        linesize : 3,
        linecolor:0xAAFFAA,
        sellinecolor:0xFFAAAA,
        bgcolor: 0x666666,
        breakpointbgcolor: 0xFF0000,
        breakpointdisablebgcolor: 0xFA8072,// 橙红
        breakpointhitbgcolor: 0xFFFF00,
        border : 8,
        headheight: 30,
        ccolor: 0xFFFFFF,
        radius : 15,

        headstyle:{
            fontFamily : 'Arial'
            , fontSize: 16
            , fill : 0xFFEEEE
            , align : 'center'
            //, lineHeight: 35
        },

        breakpointhitheadstyle:{
            fontFamily : 'Arial'
            , fontSize: 16
            , fontWeight: 'bold'
            , fill : 'yellow'
            , align : 'center'
            //, lineHeight: 35
        },

        iostyle:{
            txt:
                {
                    fontFamily : 'Arial'
                    , fontSize: 14
                    , fill : 0xEEEEEE
                    , align : 'center'
                    //, lineHeight: 35
                }
            ,
            height: 30,
            bgcolor: 0xFFFFFF,
            linesize : 3,
            linecolor:0xDDDDDD,
            radius : 15
        }
        ,connectlinecolor:0xBBBBBB
        ,connectlinesize:4
    };

GraphNode.prototype.drawbackground = function(debug=false)
{
    let graphics = this.background;
    let setting = this.style;

    let bounds = this.bounds;

    bounds.x = this.display.x;
    bounds.y = this.display.y;

    graphics.clear();


    let graphheight = setting.border * 2 + setting.radius + setting.headheight
    + this.contentloc.height;

    bounds.w = setting.width;
    bounds.h = graphheight;

    graphics.lineStyle(this.GetLineSize(debug), this.GetLineColor(debug));
    graphics.beginFill(this.GetBgColor());
    if(setting.radius == 0)
        graphics.drawRect(0, 0, setting.width, graphheight,setting.radius);
    else
        graphics.drawRoundedRect(0, 0, setting.width, graphheight,setting.radius);
    graphics.endFill();
}

GraphNode.prototype.setheadtext = function(txt)
{
    let headtextstyle = this.headtxtstyle;
    let hitBp = _global.debugHitBreakPoint;
    if (hitBp && this.IsBreakPointMatched(hitBp, true)) {
        headtextstyle = this.breakpointheadtxtstyle;
    }
    this.headtext.style = headtextstyle;

    this.headtext.text = truncWithEllipsis(txt
    , headtextstyle
    , this.headloc.width);
    this.headtext.x = this.headloc.x + (this.headloc.width - this.headtext.width) / 2;
    this.headtext.y = this.headloc.y + (this.headloc.height - this.headtext.height) / 2;
}

GraphNode.prototype.setposition = function(x,y)
{
    if(this.display != null)
    {
        this.display.x = x;
        this.display.y = y;

        if(this.bounds){
            this.bounds.x = x;
            this.bounds.y = y;
        }
    }
}

GraphNode.prototype.OpenNodeChild = function()
{
    let tdata = this.blockdata.target;
    if(tdata && tdata.option == 1)
    {
        let asseturl = tdata.asseturl;
        if(asseturl && asseturl != "")
        {
            ///打开新的资源
            let appdir = this.canvas.GetAppDir();
            _global.Event.emit("OnBlkOpenNew", {path:appdir + "/" + asseturl ,asseturl:asseturl});
            return true;
        }
    }

    return false;
}

GraphNode.prototype.CanOpenNodeChild = function () {
    if (this.blockdata) {
        let tdata = this.blockdata.target;
        return !!tdata && tdata.option === 1 && !!tdata.asseturl;
    }
    return false;
}

GraphNode.prototype.initdragging = function()
{
    this.clicktime = (new Date()).getTime();
    let itm = this.background;

    function onDragStart(event)
    {
        /// todo 暂时这样失去一下焦点
        if(document.activeElement) document.activeElement.blur();

        let nowtime = (new Date()).getTime();
        if(nowtime - this.clicktime < 200 ) {
            if (this.blockdata && this.blockdata.frame) {
                _global.Event.emit("OnFrameDataSelected", this.blockdata.frame, this.canvas.graphapp.graphnodeattrib, true, this.getLastSelectedSeqID());
            }
            return;
        }

        this.clicktime = nowtime;
        if (!this._dragging) {

            this._dragdata = event.data;
            this._dragstartloc = this._dragdata.getLocalPosition(this.display);
            this._dragging = true;
            //console.log("drag start....");

            let parent = this.display.parent;
            parent.setChildIndex(this.display, parent.children.length - 1);

            // events for drag end
            itm.on('mouseup', onDragEnd, this)
                .on('mouseupoutside', onDragEnd, this)
                .on('touchend', onDragEnd, this)
                .on('touchendoutside', onDragEnd, this)
                // events for drag move
                .on('mousemove', onDragMove, this)
                .on('touchmove', onDragMove, this);

            ///选中状态
            this.canvas.OnSelectNode(this, event.data.originalEvent.ctrlKey);
        }
    }

    function onDragEnd()
    {
        if(this._dragging)
        {
            this._dragging = false;
            this._dragdata = null;
            this._dragstartloc = null;

            itm.removeListener('mouseup', onDragEnd,this)
            .removeListener('mouseupoutside', onDragEnd,this)
            .removeListener('touchend', onDragEnd,this)
            .removeListener('touchendoutside', onDragEnd,this)
            // events for drag move
            .removeListener('mousemove', onDragMove,this)
            .removeListener('touchmove', onDragMove,this);

            ///设置位置
            if(this.blockdata)
            {
                let pos = this.display.position;
                KFMath.v3Setxyz(this.blockdata.position, pos.x, pos.y, 0);
            }
        }
    }

    function onDragMove()
    {
        if (this._dragging)
        {
            var newPosition = this._dragdata.getLocalPosition(this.display.parent);
            var deltax = newPosition.x - this._dragstartloc.x;
            var deltay = newPosition.y - this._dragstartloc.y;
            var oldpos = this.display.position;

            deltax -= oldpos.x;
            deltay -= oldpos.y;

            this.canvas.ChgSeletedPos(deltax,deltay);
        }
    }

    itm.interactive = true;
    //itm.buttonMode = true;
    // setup events
    itm
        // events for drag start
        .on('mousedown', onDragStart, this)
        .on('touchstart', onDragStart,this).on("rightdown",function (event) {
        this.canvas.OnSelectNode(this, event.data.originalEvent.ctrlKey);
    },this);

        //removeListener
}

GraphNode.prototype.updateioconnected = function()
{
    for(let i = 0 ; i < this.ioitems.length ; i ++)
    {
        this.ioitems[i].updateioconnected();    
    }
}

GraphNode.prototype.RemoveAllInputs = function(){

    for(let i = 0 ; i < this.ioitems.length ; i ++)
    {
        this.ioitems[i].RemoveInputs();
    }
}

GraphNode.prototype.updatecontent = function()
{
    this.content.x = this.contentloc.x;
    this.content.y = this.contentloc.y;
    let iostyle = this.style.iostyle;

    let ioitems = [];
    this.ioitems = ioitems;
    let iocount = 1;
    let nodetype = this.blockdata.type;

    let defaultNames = [
        "Normal","Input","Output","OutputDomain","OutputGlobal"
        ,"Event","EventDomain","EventGlobal","PullNode"
    ];

    let defaultInFlags = [
        true,false,true,true,true
        ,true,true,true,false
    ];

    let HasInput = defaultInFlags[nodetype];

    let outputDatas = this.blockdata.outputs;
    if(!outputDatas || outputDatas.length == 0)
    {
        outputDatas = [{__cls__: "KFGraphBlockOPinData"}];
        this.blockdata.outputs = outputDatas;
    }

    let inputdata = null;
    let inputDatas = this.blockdata.inputs;

    if(HasInput)
    {
        if (!inputDatas || inputDatas.length == 0)
        {
            inputDatas = [{__cls__: "KFGraphBlockOPinData"}];
            this.blockdata.inputs = inputDatas;
        }
    }
    else if(inputDatas == null)
    {
        inputDatas = [];
        this.blockdata.inputs = inputDatas;
    }

    inputdata = inputDatas ? inputDatas[0] : null;
    let output = outputDatas[0];

    this.defaultlabel = defaultNames[nodetype];

    let itm = new GraphIO(this, 0, this.defaultlabel, this.contentloc.width, inputdata, output);
    itm.canvas = this.canvas;
    itm.display.y = 0;
    this.content.addChild(itm.display);
    ioitems.push(itm);

    if (nodetype >= 5 || nodetype == 0) {
        let inputcount = inputDatas.length;
        let outputcount = outputDatas.length;
        let maxcount = inputcount > outputcount ? inputcount : outputcount;


        for (let o = 1; o < maxcount; o++) {
            let outputdata = outputDatas[o];
            let inputdata = inputDatas[o];

            if (outputdata && outputdata.func == null) {
                outputdata.func = {name: new KFDName(this.blockdata.name)};
            }

            this.AddIONode(outputdata, inputdata);
        }
    }

    this.contentloc.height =  iostyle.height * ioitems.length;
}

GraphNode.prototype.AddIONode = function(output, inputdata = null)
{
    let labelname = output ? output.func.name.toString()
        : (this.ioitems.length == 0 ? this.defaultlabel : "");
    let ioindex = this.ioitems.length;

    let iostyle = GraphNode.Style.iostyle;
    let itm = new GraphIO(this, ioindex, labelname, this.contentloc.width, inputdata, output);

    itm.canvas = this.canvas;
    itm.display.y = iostyle.height * ioindex;

    this.content.addChild(itm.display);
    this.ioitems.push(itm);

    this.contentloc.height =  iostyle.height * this.ioitems.length;
}

GraphNode.prototype.RemoveIONode = function(item){

    let index = this.ioitems.indexOf(item);
    if(index != -1)
    {
        item.Disconnect(true);
        this.ioitems.splice(index,1);
        this.content.removeChild(item.display);
        this.contentloc.height =  GraphNode.Style.iostyle.height * this.ioitems.length;
    }
}


GraphNode.prototype.Buildconnection = function()
{
    for(let i = 0 ; i < this.ioitems.length ; i ++)
    {
        this.ioitems[i].Buildconnection();
    }
}

GraphNode.prototype.Dispose = function (clear)
{
    for(let i = 0 ; i < this.ioitems.length ; i ++)
    {
        this.ioitems[i].Disconnect(clear);
    }
    this.ioitems.length = 0;
    this.blockdata = null;
}

GraphNode.prototype.GetLineSize = function (debug) {
    let linesize = this.style.linesize;
    if (debug) {
        linesize = this.style.debuglinesize;
    }
    return linesize;
}


GraphNode.prototype.GetLineColor = function (debug) {
    let linecolor = this.selected ? this.style.sellinecolor : this.GetColor().lineColor;
    if (debug) {
        linecolor = this.style.debuglinecolor;
    }
    return linecolor;
}

GraphNode.prototype.GetBgColor = function()
{
    if (_global.debugBreakPoints) {
        for (let bp of _global.debugBreakPoints) {
            if (this.IsBreakPointMatched(bp, true)) {
                if (!bp.hasOwnProperty("Enabled") || bp.Enabled) {
                    return this.style.breakpointbgcolor;
                } else {
                    return this.style.breakpointdisablebgcolor;
                }
            }
        }
    }
    return this.GetColor().bgColor;
}

GraphNode.prototype.CanFold = function () {
    let hasoutline = false;
    for (item of this.ioitems) {
        if (item.outlines.length > 0) {
            hasoutline = true;
        }
    }
    return hasoutline;
}

GraphNode.prototype.ShowFold = function() {
    if (!this.CanFold()) return;

    for (item of this.ioitems) {
        item.ShowFold(this.IsFolded());
    }
}

GraphNode.prototype.ClearFold = function() {
    if (this.IsFolded()) return;

    for (item of this.ioitems) {
        item.ClearFold();
    }
}

GraphNode.prototype.FoldOutput = function (hide) {
    GraphNode.currentBeginFoldNode = this;

    for (item of this.ioitems) {
        item.FoldOutput(hide);
    }
}

GraphNode.prototype.ChangeFold = function(nosendenv) {
    if (!this.CanFold()) return;

    this.SetFolded(!this.IsFolded());
    this.FoldOutput(this.IsFolded());
    this.ShowFold();
    if (!nosendenv) {
        this.canvas.Event.emit("onChangeFold", this);
    }
}

GraphNode.prototype.Fold = function (hide) {
    if (GraphNode.currentBeginFoldNode == this) {
        let nodename = "";
        if (this.blockdata && this.blockdata.name) {
            nodename = this.blockdata.name.toString();
        }
        Nt("节点[" + nodename +  "]折叠操作发现循环，可能存在异常");
        return;
    }

    if (!this.IsFolded()) {
        for (item of this.ioitems) {
            item.Fold(hide);
        }
    }
    this.display.visible = !hide;
}

GraphNode.prototype.IsVisible = function () {
    return this.display.visible;
}

GraphNode.prototype.IsBreakPointMatched = function (bp, ignoreValid= false)
{
    if (bp && this.blockdata && this.blockdata.name) {
        if (!ignoreValid) {
            let valid = !bp.hasOwnProperty("Enabled") || bp.Enabled;
            if (!valid) return false;
        }
        if ((bp.__cls__ == "KF8GraphNodeBreakPoint" || bp.__cls__ == "KF8GraphScriptBreakPoint") &&
            bp.AssetURL == _global.editor.blkdata.asseturl &&
            bp.NodeName == this.blockdata.name.toString()) {
            return true;
        }
    }
    return false;
}

GraphNode.prototype.UpdateBreakPointStatus = function () {
    let value = this.blockdata;
    this.setheadtext(value ? value.name.toString() : "undefined");
    this.drawbackground();
}

GraphNode.prototype.CheckBreakPoints = function () {
    let bps = _global.debugBreakPoints;
    if (!bps) return null;

    let retbps = [];
    for (let bp of bps) {
        if (this.IsBreakPointMatched(bp, true)) {
            retbps.push(bp);
        }
    }
    if (retbps.length > 0) return retbps;

    if (this.blockdata && this.blockdata.frame) {
        let scripts = this.blockdata.frame.scripts;
        if (scripts && scripts.length > 0) {
            for (let i in scripts) {
                let script = scripts[i];
                if (script.group == void 0 || script.group != 0) {
                    let kv = {};
                    kv.__cls__ = "KF8GraphScriptBreakPoint";
                    let kvkfd = _global.editor.context.kfdtable.get_kfddata(kv.__cls__);
                    KFDJson.init_object(kv, kvkfd);
                    kv.AssetURL = _global.editor.blkdata.asseturl;
                    kv.NodeName = _global.currentGraphNodeName;
                    kv.ScriptId = parseInt(i);
                    kv.FieldPath = "";
                    retbps.push(kv);
                }
            }
        }
    }
    if (retbps.length > 0) return retbps;

    let kv = {};
    kv.__cls__ = "KF8GraphNodeBreakPoint";
    let kvkfd = _global.editor.context.kfdtable.get_kfddata(kv.__cls__);
    KFDJson.init_object(kv, kvkfd);
    kv.AssetURL = _global.editor.blkdata.asseturl;
    kv.NodeName = _global.currentGraphNodeName;
    retbps.push(kv);
    return retbps;
}

function GraphLine(outdata,inputdata)
{
    this.display = new PIXI.Graphics();
    ///输出的点
    this.outio = null;
    ///输入的点
    this.inio = null;
    this.linestyle = GraphNode.Style;
    ///关联的数据
    this.outdata = outdata;
    this.inputdata = inputdata;
}

GraphLine.Event  = new PIXI.utils.EventEmitter();

GraphLine.prototype.clear = function()
{
    this.display.clear();
}

GraphLine.prototype.break = function()
{
    if(this.inio != null)
    {
        this.inio.removeinlines(this);
        this.inio = null;
        this.updateioconnected(true);
    }
}


GraphLine.prototype.updateioconnected = function(change, debug=false)
{
    this.clear();

    if(this.outio && this.inio)
    {
        let from = this.outio.getposglobal(false);
        let to = this.inio.getposglobal(true);

        let parent = this.display.parent;
        
        from = parent.toLocal(from);
        to = parent.toLocal(to);
        
        this.fromto(from.x,from.y,to.x,to.y, debug);
    }

    if(change)
    {
        ///也有处理两种情况
        if(this.outdata) {

            if (this.outio && this.inio) {
                ///直接关联对象变更一起变更
                let innode = this.inio.node;
                if (innode) {
                    this.outdata.name = innode.blockdata.name;
                    this.outdata.dest = this.inio.ioindex;
                } else
                    this.outdata.name = null;
            } else {
                    this.outdata.name = null;
            }
            GraphLine.Event.emit("onBlockDataChanged");
        } else if(this.inputdata){

            if (this.outio && this.inio) {
                ///直接关联对象变更一起变更
                let outnode = this.outio.node;
                if (outnode) {
                    this.inputdata.name = outnode.blockdata.name;
                    this.inputdata.dest = this.outio.ioindex;
                } else
                    this.inputdata.name = null;
            } else {
                this.inputdata.name = null;
            }
            GraphLine.Event.emit("onBlockDataChanged");
        }
    }
}

GraphLine.prototype.fromto = function(x,y,tx,ty,debug=false)
{
    let graphics = this.display;
    graphics.clear();
    if (debug) {
        graphics.lineStyle(
            this.linestyle.connectlinesize
            ,   this.linestyle.debugconnectlinecolor);
    } else {
        graphics.lineStyle(
            this.linestyle.connectlinesize
            ,   this.linestyle.connectlinecolor);
    }
    graphics.moveTo(x,y);
    //graphics.bezierCurveTo(200,100,200,300,300,300);
    //graphics.lineTo(tx,ty);
    ///----->
    let cx0 = x;
    let cx1 = x;
    let dirline = false;
    let dx = (tx - x);

    if(dx > 100)
    {
        cx0 = cx1 = dx / 2 + x;
    }
    else
    {
        let dy = (ty - y);

        if(dx <= 20 || (dx * dx + dy * dy) > 10000)
        {
            cx0 = x + 200;
            cx1 = tx - 200;
        }
        else
        {
            dirline = true;
        }
    }
    if(dirline)
    {
        graphics.lineTo(tx,ty);
    }
    else
    {
        graphics.bezierCurveTo(cx0,y,cx1,ty,tx,ty);
    }
}

GraphLine.prototype.Fold = function (hide) {
    if (this.inio && this.inio.node) {
        this.inio.node.Fold(hide);
    }
    this.display.visible = !hide;
}

function GraphCanvas(graphapp)
{
    let app = graphapp.app;

    this.graphapp = graphapp;
    this.app = app;
    this.stage  = app.stage;
    this.AllNodes = [];
    this.SelectedNodes = [];
    
    this.display = new PIXI.Container();

    this.background = new PIXI.Graphics();
    this.frontground = new PIXI.Graphics();
    this.nodecontainer = new PIXI.Container();
    this.preline = new GraphLine();
    this.preline.linestyle = 
    {
        connectlinesize  : 5,
        connectlinecolor : 0x999999
    };

    this.display.addChild(this.background);
    this.display.addChild(this.nodecontainer);
    this.display.addChild(this.preline.display);
    this.display.addChild(this.frontground);

    this.stage.addChild(this.display);

    ///是否右键的拖动呢？
    this.rightdragging = false;
    ///是否画框
    this.drawrect = null;

    this.Event  = new PIXI.utils.EventEmitter();

    this.drawbackground();
    this.initdragging();
    this.initline();

}

GraphCanvas.prototype.GetAppDir = function(){

    let context = this.graphapp.context;
    if(!context) return  "";
    return  context.appdatapath;
}

GraphCanvas.prototype.resize  = function()
{
    this.drawbackground();
}

GraphCanvas.prototype.initdragging = function()
{
    let self = this;
    let itm = this.background;

    let onDragStart = function(event)
    {
        /// todo 暂时这样失去一下焦点
        if(document.activeElement) document.activeElement.blur();

        let evtdata  = event.data;

        if(evtdata.button == 2) {
            self.rightdragging = false;
        }else{

        }

        ///按下了ALT键
        if((evtdata.button == 2 || evtdata.originalEvent.altKey) && !this._dragging)
        {
            this._dragdata = evtdata;
            this._dragstartloc = this._dragdata.getLocalPosition(this.display);
            this._dragging = true;
            //console.log("drag start....");


        }else{

            self.OnSelectNode(null);
            this.drawrect = {x:0,y:0,w:0,h:0};
            this._dragdata = evtdata;
            this._dragstartloc = this._dragdata.getLocalPosition(this.display);
        }

        // events for drag end
        itm.on('mouseup', onDragEnd,this)
            .on('mouseupoutside', onDragEnd,this)
            .on('touchend', onDragEnd,this)
            .on('touchendoutside', onDragEnd,this)
            .on('rightup', onDragEnd,this)
            .on('rightupoutside', onDragEnd,this)
            // events for drag move
            .on('mousemove', onDragMove,this)
            .on('touchmove', onDragMove,this);
    }

    function onDragEnd()
    {
        if(this._dragging || this.drawrect)
        {
            this._dragging = false;

            if(this.drawrect)
            {
                let rect = this.drawrect;

                let minpoint = this.display.toGlobal(rect);
                let maxpoint = this.display.toGlobal({x: rect.x + rect.w,y:rect.y + rect.h});

                self.RectSelectNodes(minpoint, maxpoint);

                this.frontground.clear();
                this.drawrect = null;
            }

            // set the interaction data to null
            this._dragdata = null;
            this._dragstartloc = null;

            itm.removeListener('mouseup', onDragEnd,this)
            .removeListener('mouseupoutside', onDragEnd,this)
            .removeListener('touchend', onDragEnd,this)
            .removeListener('touchendoutside', onDragEnd,this)
            // events for drag move
            .removeListener('mousemove', onDragMove,this)
            .removeListener('touchmove', onDragMove,this);
        }
    }



    function onDragMove()
    {
        if (this._dragging)
        {
            let newPosition = this._dragdata.getLocalPosition(this.display.parent);

            self.rightdragging = true;

            this.display.position.x = newPosition.x - this._dragstartloc.x;
            this.display.position.y = newPosition.y - this._dragstartloc.y;

            this.drawbackground();
        }
        else if(this.drawrect)
        {
            let newPosition = this._dragdata.getLocalPosition(this.display);


            let minx = newPosition.x;
            let maxx = this._dragstartloc.x;

            if(minx > maxx) {maxx = minx; minx = this._dragstartloc.x;}

            let miny = newPosition.y;
            let maxy = this._dragstartloc.y;

            if(miny > maxy){maxy = miny; miny = this._dragstartloc.y;}

            this.drawrect.x = minx;
            this.drawrect.y = miny;
            this.drawrect.w = maxx - minx;
            this.drawrect.h = maxy - miny;

            this.frontground.clear();
            this.frontground.lineStyle(
                1
                ,   0xFFAAAA);
            this.frontground.drawRect(this.drawrect.x,this.drawrect.y
                , this.drawrect.w, this.drawrect.h);
        }
    }

    itm.interactive = true;
    //itm.buttonMode = true;
    // setup events
    itm
        // events for drag start
        .on('mousedown', onDragStart, this)
        .on('touchstart', onDragStart,this)
        .on('rightdown', onDragStart,this);
}

GraphCanvas.prototype.cleardragging = function(){
    this.rightdragging = false;
}

GraphCanvas.prototype.drawbackground = function()
{
    let startx = -this.display.x;
    let starty = -this.display.y;


    let rect = this.app.screen;
    let width = rect.width;
    let height = rect.height;
    let gridsize = 100;
    let linesize = 1;
    let colors = [0x555555, 0x333333];
    let colors0 = [0x555555, 0x333333];
    let bgcolor = 0x222222;

    let xcount = Math.floor(startx / gridsize);
    let ycount = Math.floor(starty / gridsize);

    if((xcount % 2) != 0) {let a = colors[0]; colors[0] = colors[1];colors[1] = a;}
    if((ycount % 2) != 0) {let a = colors0[0]; colors0[0] = colors0[1];colors0[1] = a;}

    let spacex = startx - xcount * gridsize;
    let spacey = starty - ycount * gridsize;

    if(spacex > 0) spacex = gridsize - spacex;
    else spacex = gridsize + spacex;

    if(spacey > 0) spacey = gridsize - spacey;
    else spacey = gridsize + spacey;

    this.background.clear();
    this.background.beginFill(bgcolor);
    this.background.drawRect(startx,starty,width,height);
    this.background.endFill();

   
    let maxx = startx + width;
    let maxy = starty + height;

    /////x
    
    this.background.lineStyle(linesize,colors[0]);

    let pos = startx + spacex;    

    while(pos < maxx)
    {
        this.background.moveTo(pos,starty);
        this.background.lineTo(pos,starty + height);

        pos += gridsize * 2;
    }
    /////y
    this.background.lineStyle(linesize,colors0[0]);
    pos = starty + spacey;
    while(pos < maxy)
    {
        this.background.moveTo(startx,pos);
        this.background.lineTo(startx + width,pos);

        pos += gridsize * 2;
    }

    this.background.lineStyle(linesize,colors[1]);
    pos =  startx + spacex + gridsize;
    while(pos < maxx)
    {
        this.background.moveTo(pos,starty);
        this.background.lineTo(pos,starty + height);

        pos += gridsize * 2;
    }

    this.background.lineStyle(linesize,colors0[1]);
    pos = starty + spacey + gridsize;
    while(pos < maxy)
    {
        this.background.moveTo(startx,pos);
        this.background.lineTo(startx + width,pos);
        pos += gridsize * 2;
    }
}

GraphCanvas.prototype.initline = function()
{
    function IOMove(event)
    {
        if(this._ioing)
        {
            let newpos =  event.data.getLocalPosition(this.background);
            
            if(this._outstart)
            {
                this.preline.fromto(this._iostartloc.x,this._iostartloc.y
                ,newpos.x,newpos.y);
            }
            else
            {
                this.preline.fromto(
                    newpos.x, newpos.y,
                    this._iostartloc.x,this._iostartloc.y
                    );
            }

        }
    }

    function IOStart(event)
    {
        if(!this._ioing)
        {
            this._ioing = true;

            this.background
            .on('mousemove', IOMove,this)
            .on('touchmove', IOMove,this);

            this._outstart = event.outstart;
            this._currenttarget = event.currentTarget;
            this._iostartloc = this.background.toLocal(event.pos);

        }
    }

    function IOEnd(event)
    {
        if(this._ioing)
        {
            this.background
            .removeListener('mousemove', IOMove,this)
            .removeListener('touchmove', IOMove,this);

            this.preline.clear();
            this._ioing = false;
        }
    }

    function IOConnected(event)
    {
        if(     this._outstart != event.outstart
             && this._currenttarget != event.currentTarget)
        {
            if(_global.editor && _global.editor.edaction)
                _global.editor.edaction.AddAction();
            let outio = this._outstart ? this._currenttarget : event.currentTarget;
            let inio = this._outstart ? event.currentTarget :this._currenttarget;

            if(outio.isPull != inio.isPull)
            {
                return;
            }

            if(false == outio.isPull) {

                ///找到输出的线
                let outline = outio.outlines[0];
                if (outline == null) {
                    outline = new GraphLine();
                    this.background.addChild(outline.display);
                    outio.setoutline(outline);
                }

                ///删除掉原来的输入的方向
                if (outline.inio) {
                    outline.inio.removeinlines(outline);
                    outline.inio = null;
                }

                ///增加一个新的输入方向
                outline.inio = inio;
                inio.addinlines(outline);

                ///更新线条
                outline.updateioconnected(true);
            }else{

                ///找到输入的线
                let inline = inio.inlines[0];
                if (inline == null) {
                    inline = new GraphLine();
                    this.background.addChild(inline.display);
                    inio.setinline(inline);
                }

                ///删除掉原来的输出的方向
                if (inline.outio) {
                    inline.outio.removeoutlines(inline);
                    inline.outio = null;
                }

                ///增加一个新的输入方向
                inline.outio = outio;
                outio.addoutlines(inline);

                ///更新线条
                inline.updateioconnected(true);
            }
        }
    }

    GraphIO.Event.on("onIOStart", IOStart, this);
    GraphIO.Event.on("onIOEnd", IOEnd, this);
    GraphIO.Event.on("onIOConnected",IOConnected, this);

    GraphLine.Event.on("onBlockDataChanged", this._OnBlockDataChanged, this);
}

GraphCanvas.prototype.Clear = function()
{
    /// 删除节点
    for(let i = 0;i < this.AllNodes.length; i ++ )
    {
        let node = this.AllNodes[i];
        node.Dispose();
        this.nodecontainer.removeChild(node.display);
    }

    this.AllNodes.length = 0;

    // 这里之前没有清，导致莫名其妙的错误
    this.SelectedNodes.length = 0;

    ///回到原来的位置
    this.ZoomContainer(0,null,{x:1,y:1});
}

GraphCanvas.prototype.RefreshSelectedNodes = function()
{
    for(let i = 0 ;i < this.SelectedNodes.length ;i ++)
    {
        let node = this.SelectedNodes[i];
        node.Refresh();
    }
}

GraphCanvas.prototype.ChgSeletedPos = function(deltax,deltay) {

    for(let i = 0 ;i < this.SelectedNodes.length ;i ++)
    {
        let node = this.SelectedNodes[i];
        let display = node.display;

        display.position.x  += deltax;
        display.position.y += deltay;
        node.updateioconnected();
    }
}

GraphCanvas.prototype.ClearSelectedNodes = function()
{
    for (let i = 0; i < this.SelectedNodes.length; i++)
    {
        let node = this.SelectedNodes[i];
        node.selected = false;
        node.drawbackground();
    }

    this.SelectedNodes.length = 0;
}

GraphCanvas.prototype.OnSelectNode = function(newnode, multi, ignoreChange)
{
    if(this.SelectedNodes.indexOf(newnode) != -1 /*&& multi*/)
    {
        return;
    }

    if(!multi)
    {
        this.ClearSelectedNodes();
    }

    if(newnode)
    {
        this.SelectedNodes.push(newnode);

        newnode.selected = true;
        newnode.drawbackground();
    }

    this.Event.emit("OnSelectNodeChanged");

    if(!ignoreChange)
    {
        this.graphapp.OnNodeChange(newnode);
    }
}

GraphCanvas.prototype.RectSelectNodes = function(minpoint, maxpoint)
{
    let locmin = this.nodecontainer.toLocal(minpoint);
    let locmax = this.nodecontainer.toLocal(maxpoint);
    let rect = {x:locmin.x,y:locmin.y,w:locmax.x - locmin.x,h:locmax.y - locmin.y};

    let lastnode = null;
    for( let node of this.AllNodes){
        if(node.InRect(rect) && node.IsVisible()){
            lastnode = node;
            this.OnSelectNode(node, true, true);
        }
    }
    if(lastnode){
        this.graphapp.OnNodeChange(lastnode);
    }
}

GraphCanvas.prototype._CreateNode = function(block)
{
    let node = new GraphNode(block, this);
    //node.setposition(30*i,300);
    this.nodecontainer.addChild(node.display);
    this.AllNodes.push(node);
    return node;
}

GraphCanvas.prototype.FindNodeByStrName = function(namestr)
{
    return this.FindNodeByKFName(KFDName._Param.setString(namestr));
}

GraphCanvas.prototype.FindNodeByKFName = function(kfname)
{
    for(let i = 0 ; i < this.AllNodes.length; i ++)
    {
        let node = this.AllNodes[i];
        let bdata = node.blockdata;

        if(bdata.name.value == kfname.value)
        {
            return node;
        }
    }

    return null;
}


GraphCanvas.prototype._CreateNodes = function(blocks)
{
    for(let i = 0 ; i < blocks.length; i ++)
    {
        this._CreateNode(blocks[i]);
    }

    for(let i = 0 ; i < this.AllNodes.length; i ++)
    {
        this.AllNodes[i].Buildconnection();
    }
}


GraphCanvas.prototype.NewAddNode = function(type,pos)
{
    if(this.graphData) {

        this.nodeidstart  += 1;
        let pref = "Node";
        if(type == 1) {
            pref = "Start";
        }else if(type == 2){
            pref = "FireEvent";
        }else if(type == 3 || type == 4){
            pref = "FireGlobalEvent";
        }else if(type == 5){
            pref = "Event";
        }else if(type == 6 || type == 7){
            pref = "GlobalEvent";
        }else if(type == 8){
            pref = "PullNode";
        }

        let blockdata = {__cls__: "KFGraphBlockData"};
        blockdata.type = type;
        blockdata.name = new KFDName(pref + this.nodeidstart);
        blockdata.position = KFMath.v3New(pos.x, pos.y, 0);
        this._CreateNode(blockdata);
        this.graphData.blocks.push(blockdata);
        this._OnBlockDataChanged();
    }
    else
    {
        Nt("没有打开可编辑的文件");
    }
}

GraphCanvas.prototype.NewAddNodeWithBlockDatas = function(blockdatas)
{
    if(this.graphData) {
        if (!blockdatas) return;
        let newnodenames = {};
        for (let i = 0; i < blockdatas.length; ++i) {
            let blockdata = blockdatas[i];
            if (!blockdata.name) continue;
            this.nodeidstart += 1;
            //判断节点名字是否已被占用
            let srcNameStr = blockdata.name.toString();
            while (this.FindNodeByKFName(blockdata.name))
            {
                let newname = new KFDName(blockdata.name.toString() + "_Copy" + this.nodeidstart.toString());
                newnodenames[srcNameStr] = newname.toString();
                blockdata.name = newname;
            }
        }
        for (let i = 0; i < blockdatas.length; ++i) {
            let blockdata = blockdatas[i];
            for (let m = 0; m < blockdata.inputs.length; ++m) {
                let pin = blockdata.inputs[m];
                if (pin.name) {
                    let pinNameStr = pin.name.toString();
                    if (newnodenames.hasOwnProperty(pinNameStr)) {
                        pin.name.setString(newnodenames[pinNameStr]);
                    }
                }
            }
            for (let m = 0; m < blockdata.outputs.length; ++m) {
                let pin = blockdata.outputs[m];
                if (pin.name) {
                    let pinNameStr = pin.name.toString();
                    if (newnodenames.hasOwnProperty(pinNameStr)) {
                        pin.name.setString(newnodenames[pinNameStr]);
                    }
                }
            }
        }

        let newnodes = [];
        for (let i = 0; i < blockdatas.length; ++i) {
            let blockdata = blockdatas[i];
            let node = this._CreateNode(blockdata);
            this.graphData.blocks.push(blockdata);
            newnodes.push(node);
        }
        for (let i = 0; i < newnodes.length; ++i) {
            let node = newnodes[i];
            node.Buildconnection();
        }
        this._OnBlockDataChanged();
    }
    else
    {
        Nt("没有打开可编辑的文件");
    }
}

GraphCanvas.prototype.ZoomContainer = function(zoom, pos, toscale)
{
    let scale = this.nodecontainer.scale;
    let gpos ;
    if(!toscale) {

        gpos = {
            x: pos.x * scale.x,
            y: pos.y * scale.y
        };

        let newx = scale.x + zoom * 0.2;
        let newy = scale.y + zoom * 0.2;

        if(newx <= 0.2 || newy <= 0.2 || newx > 15 || newy > 15)
        {
            return;
        }

        scale.x = newx;
        scale.y = newy;

    }else
        scale = toscale;

    this.nodecontainer.scale = scale;

    if(toscale) {
        this.display.x = 0;
        this.display.y = 0;
    } else {
        this.nodecontainer.updateTransform();

        let newgpos = {
            x: pos.x * scale.x,
            y: pos.y * scale.y
        };

        this.display.x += gpos.x - newgpos.x;
        this.display.y += gpos.y - newgpos.y;
    }

    for(let node of this.AllNodes)
    {
        node.Redrawlines();
    }

    this.drawbackground();

}

GraphCanvas.prototype.RemoveNodeInput = function() {
    if(this.SelectedNodes.length > 0)
    {
        for (let i = 0; i < this.SelectedNodes.length; i++)
        {
            let node = this.SelectedNodes[i];
            if(node){
                node.RemoveAllInputs();
            }
        }
    }
}

GraphCanvas.prototype.RemoveSelectedNodes = function()
{
    if(this.SelectedNodes.length > 0)
    {
        for (let i = 0; i < this.SelectedNodes.length; i++)
        {
            let node = this.SelectedNodes[i];
            ///从数据中删除先
            let index = this.graphData.blocks.indexOf(node.blockdata);
            if(index != -1)
            {
                this.graphData.blocks.splice(index,1);
                this._OnBlockDataChanged();
            }
            ///然后从显示列表中删除吧
            node.Dispose(true);
            this.nodecontainer.removeChild(node.display);
            index = this.AllNodes.indexOf(node);
            if (index != -1)
            {
                this.AllNodes.splice(index, 1);
            }
        }

        this.SelectedNodes.length = 0;
        this.graphapp.OnNodeChange(null);
    }
}

GraphCanvas.prototype._FoldNodes = function()
{
    for(let i = 0 ; i < this.AllNodes.length; i ++)
    {
        let node = this.AllNodes[i];
        if (node.IsFolded()) {
            this.AllNodes[i].FoldOutput(true);
        }
    }
}

GraphCanvas.prototype.Open = function (graphData)
{
    this.Clear();
    this.graphData = graphData;

    if(this.graphData)
    {
        if(!this.graphData.blocks)
        {
            this.graphData.blocks = [];
        }

        this.nodeidstart = this.graphData.blocks.length;
        this._CreateNodes(this.graphData.blocks);
        this._FoldNodes();
    }
}

GraphCanvas.prototype._OnBlockDataChanged = function () {
    this.Event.emit("onBlockDataChanged");
}

GraphCanvas.prototype.ToCenter = function (node) {
    ///先回到原来的位置
    this.ZoomContainer(0,null,{x:1,y:1});

    let screen = this.app.screen;
    let halfwidth = screen.width / 2;
    let halfheight = screen.height / 2;
    let nodecenterx = node.display.x + node.background.width / 2;
    let nodecentery = node.display.y + node.background.height / 2;
    let deltax = nodecenterx - halfwidth;
    let deltay = nodecentery - halfheight;
    this.display.position.x = -deltax;
    this.display.position.y = -deltay;
    this.drawbackground();
}
