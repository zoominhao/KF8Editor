function GraphApp(stagehtml)
{
	let stage = stagehtml.get(0);
    this.stage = stage;
    this.app = new PIXI.Application({width: 256, height: 256
		,backgroundColor:0xFFFFFF,antialias: true});
		
	stage.appendChild(this.app.view);
	
	this.app.resizeTo = stage;

	this.ticker = PIXI.Ticker.shared;
	this.stagetime = 0;
	this.stagefms = 100;
	this.g_Time = 0;
	this.stageWidth = stage.offsetWidth;
    this.stageHeight = stage.offsetHeight;
    this.eventpos = {x:0,y:0};
    let app = this;

	this.graphnodeattrib = new KFDEditor($("#graphnodeattrib"));
	this.graphnodeattrib.Event.on("OnDataChange",function (prop, needUpdate)
	{
		this.OnNodeDataChange(prop);

	},this);
    

	this.ticker.add(function (time) 
	{
		var timeNow = (new Date()).getTime(); 
		var timeDiff = timeNow - this.g_Time; 
		this.g_Time = timeNow;
		this.stagetime += timeDiff;

		if(this.stagetime >= this.stagefms)
		{
			this.stagetime -= this.stagefms;

            if(     stage.offsetWidth != 0 
                 && stage.offsetHeight != 0
                 && ( stage.offsetWidth != this.stageWidth
                 || stage.offsetHeight != this.stageHeight))
			{
				this.stageWidth = stage.offsetWidth;
				this.stageHeight = stage.offsetHeight;

				/// add delay set...
                this.app.resize();
                this.nodecanvas.resize();
                this.app.render();
			}
		}
    },this);

	///初始化
	/*let graphdata = {};

	if(_global && _global.editor)
	{
		this.Start(_global.editor.context);
		if(_global.editor.blkdata)
		{
			graphdata = _global.editor.blkdata.graph;
		}
	}*/

	//this.Open(graphdata);

	///========
    this.nodecanvas = new GraphCanvas(this);
    //let nodecontainer = this.nodecanvas.nodecontainer;
    ///
    //for(let i = 0 ;i < 20; i ++)
    //{
    //	let node = new GraphNode();
    //  	node.setposition(30*i,300);
    //  	nodecontainer.addChild(node.display);
    //}

	let graph = null;
	if(_global && _global.editor)
	{
		this.Start(_global.editor.context);
		if(_global.editor.blkdata)
		{
			graph = _global.editor.blkdata.graph;
		}
	}

	stagehtml.contextmenu(function (evt)
	{
		if(!app.nodecanvas.rightdragging) {

			evt.preventDefault();

			app.ProcMenu();

			$('#graphemnu').menu('show', {
				left: evt.pageX,
				top: evt.pageY
			});

			app.eventpos = CVEventPosition(evt);
		}
		else
			app.nodecanvas.cleardragging();
	});

	stagehtml.on('mousewheel', function(event) {
		let orgevt = event.originalEvent;

		let zoom = (orgevt.wheelDeltaY > 0 ? 1 : -1);
		let mousepos = CVEventPosition(event);

		let nodecanvas = app.nodecanvas;
		let loc = nodecanvas.nodecontainer.toLocal(mousepos);

		nodecanvas.ZoomContainer(zoom, loc);
	});

	this.InitDebugBreak();

	this.InitNodeTree();

	this.Open(graph);

	this.CheckAutoOpenAction();
}

GraphApp.prototype.OrgScale = function()
{
	this.nodecanvas.ZoomContainer(0,{x:0,y:0},{x:1,y:1});
}

GraphApp.prototype.Start = function (context)
{
	this.context = context;
	this.graphnodeattrib.kfdtable = context.kfdtable;
}

GraphApp.prototype.AddNode = function(type)
{
	if(_global.editor && _global.editor.edaction)
        _global.editor.edaction.AddAction();
	let nodecanvas = this.nodecanvas;
	let loc = nodecanvas.nodecontainer.toLocal(this.eventpos);
	nodecanvas.NewAddNode(type, loc);
}

GraphApp.prototype.RemoveNode = function()
{
	if(_global.editor && _global.editor.edaction)
        _global.editor.edaction.AddAction();
	this.nodecanvas.RemoveSelectedNodes();
}

GraphApp.prototype.RemoveNodeInput = function(){
	if(_global.editor && _global.editor.edaction)
        _global.editor.edaction.AddAction();
	this.nodecanvas.RemoveNodeInput();
}

GraphApp.prototype.OnNodeDataChange = function(prop)
{
	if(prop.name == "name" || prop.name == "outputs" || prop.name == "inputs")
	{
		this.nodecanvas.RefreshSelectedNodes();
	}
}

GraphApp.prototype.OnNodeChange = function(node)
{
	let outputs = false;
	let inputs = false;

	if(node && node.blockdata)
	{
		if (node.blockdata.type >= 5 || node.blockdata.type == 0)
		{
			outputs = {
				name: false, type: false, dest: false, label: false
			};
		}

		if(node.blockdata.type == 8)
		{
			inputs = {name: false, type: false, dest: false, label: false};
		}
	}

	_global.currentGraphNodeName = node ? node.blockdata.name.toString() : "";

	this.graphnodeattrib.Edit(node ?node.blockdata : null,
		{__ecls__:"KFGraphBlockData"
			, type:false,position:false//,execType:false
		,target:{__state__:"open",func:false/*, asseturl:{__enum__:"OnFileSelected"}*/}
		,frame:{__state__:"open",index:false}
		,inputs:inputs,outputs:outputs
	});

	if (node && node.blockdata) {
		_global.Event.emit("OnFrameDataSelectedByName", "frame", this.graphnodeattrib, false, node ? node.getLastSelectedSeqID(): null);
	} else {
		_global.Event.emit("OnFrameDataSelected", null, this.graphnodeattrib, false, null);
	}

	this.NotifyNodeTreeChange(node);
}

GraphApp.prototype.Open = function (graph)
{
	this.graph = graph;
	if(graph)
	{
		if(!graph.data)
		{
			graph.data = {__cls__:"KFGraphData"};
		}

		this.nodecanvas.Open(graph.data);
	}
	else
	{
		this.nodecanvas.Clear();
	}

	this.graphnodeattrib.Edit(null);
	_global.Event.emit("OnFrameDataSelected", null, this.graphnodeattrib, false, null);

	if (this.lastticknodes) {
		this.lastprocessednodes = null;
	}
	if (this.lastticklines) {
		this.lastticklines = null;
	}

	this.UpdateNodeTree();
}

GraphApp.prototype.Copy = function() {
	let CopiedBlocks = [];
	let SelectedNodes = this.nodecanvas.SelectedNodes;
	// 取第一个节点位置为相对基准位置
	let basev3 = KFMath.v3New();
	if (SelectedNodes.length > 0) {
		let relativenode = SelectedNodes[0];
		let pos = relativenode.blockdata.position;
		[basev3.x, basev3.y, basev3.z] = [pos.x, pos.y, pos.z];
	}

	let CopyBlockData = function(blockdata) {
		let bytearray = new KFByteArray();
		if (!blockdata.__cls__) {
			blockdata.__cls__ = "KFGraphBlockData";
		}
		KFDJson.write_value(bytearray, blockdata);
		bytearray.SetPosition(0);
		return KFDJson.read_value(bytearray);
	}

	let nodenames = {};
	for (let i in SelectedNodes) {
		let node = SelectedNodes[i];
		let newblockdata = CopyBlockData(node.blockdata);
		if (newblockdata) {
			CopiedBlocks.push(newblockdata);
			nodenames[newblockdata.name] = 1;
		}
	}

	// let new_pin = function () {
	// 	let new_pin = {"__cls__": "KFGraphBlockOPinData"};
	// 	let pinkfd = _global.editor.context.kfdtable.get_kfddata(new_pin.__cls__);
	// 	KFDJson.init_object(new_pin, pinkfd);
	// 	new_pin.func = {name:new KFDName("undefine")};
	// 	return new_pin;
	// }

	for(let i = 0; i < CopiedBlocks.length; ++i) {
		let newblockdata = CopiedBlocks[i];
		if (!newblockdata) {
			return;
		}

		// 设置相对位置
		let pos = newblockdata.position;
		[pos.x, pos.y, pos.z] = [pos.x - basev3.x, pos.y - basev3.y, pos.z - basev3.z];

		for (let m = 0; m < newblockdata.inputs.length; ++m) {
			let pin = newblockdata.inputs[m];
			if (pin.name) {
				if (!nodenames.hasOwnProperty(pin.name)) {
					// 输入节点名字在选择的节点里如果没有，直接new一个
					// newblockdata.inputs[m] = new_pin();
					delete pin.name
				}
			}
		}
		for (let m = 0; m < newblockdata.outputs.length; ++m) {
			let pin = newblockdata.outputs[m];
			if (pin.name) {
				if (!nodenames.hasOwnProperty(pin.name)) {
					// 输出节点名字在选择的节点里如果没有，直接new一个
					// newblockdata.outputs[m] = new_pin();
					delete pin.name
				}
			}
		}
	}
	ClipboardTool.SetClipboardOfKFDArray("GraphNode", CopiedBlocks);
}

GraphApp.prototype.Paste = function() {
    let CopiedBlocks = ClipboardTool.GetClipboardOfKFDArray("GraphNode");
	if (CopiedBlocks && CopiedBlocks.length > 0) {
		if(_global.editor && _global.editor.edaction)
        	_global.editor.edaction.AddAction();
		let nodecanvas = this.nodecanvas;
		let loc = nodecanvas.nodecontainer.toLocal(this.eventpos);
		for (let i in CopiedBlocks) {
			let new_pos = CopiedBlocks[i].position;
			[new_pos.x, new_pos.y, new_pos.z] = [loc.x + new_pos.x, loc.y + new_pos.y, loc.z + new_pos.z];
		}
		nodecanvas.NewAddNodeWithBlockDatas(CopiedBlocks);
	}
}

GraphApp.prototype.UpdateDebugRuntime = function(runtime) {
	if (this.lastticknodes) {
		for (let name of this.lastticknodes) {
			let node = this.nodecanvas.FindNodeByStrName(name);
			if (!node) continue;
			node.drawbackground(false);
		}
		this.lastticknodes = null;
	}
	if (this.lastticklines) {
		for (let line of this.lastticklines) {
			line.updateioconnected();
		}
		this.lastticklines = null;
	}

	if (runtime) {
		let tickblocks = new Set();
		let ticklines = new Set();
		let frameindex = runtime.TickFrameIndex;
		let tickinterval = 1;
		if (runtime.LastTickFrameIndex)
		{
			frameindex = runtime.LastTickFrameIndex;
			tickinterval = 3;
		}

		if (frameindex > 0 && runtime.Graph && runtime.Graph.Blocks) {
			for (let i in runtime.Graph.Blocks) {
				let block = runtime.Graph.Blocks[i];
				if (block.LastRunFrameIndex >= frameindex - tickinterval + 1) {
					tickblocks.add(block.Name);
				}
			}
		}

		let ticknodes = new Set();
		let needprocessnodes = [];
		for (let name of tickblocks) {
			needprocessnodes.push(name);
		}

		while (needprocessnodes.length > 0) {
			let name = needprocessnodes.pop();
			if (ticknodes.has(name)) continue;
			ticknodes.add(name);
			let node = this.nodecanvas.FindNodeByStrName(name);
			if (!node) continue;
			// TODO 这里访问了很多内部细节，还没想到好的优化方法
			for (let ioindex in node.ioitems) {
				let ioitem = node.ioitems[ioindex];
				if (!ioitem || !ioitem.inlines) continue;
				for (let line of ioitem.inlines) {
					if (!line.outdata || line.outdata.name != name) continue;
					if (!line.outio || !line.outio.node || !line.outio.node.blockdata) continue;
					let prename = line.outio.node.blockdata.name.toString();
					if (!tickblocks.has(prename)) continue;
					if (!ticknodes.has(prename)) {
						needprocessnodes.push(prename);
					}
					ticklines.add(line);
				}
			}
		}

		for (let name of ticknodes) {
			let node = this.nodecanvas.FindNodeByStrName(name);
			if (!node) continue;
			node.drawbackground(true);
		}

		for (let line of ticklines) {
			line.updateioconnected(false, true);
		}

		this.lastticknodes = ticknodes;
		this.lastticklines = ticklines;
	}
}

GraphApp.prototype.InitDebugBreak = function () {
    let app = this;
	_global.Event.on("OnDebugBreakPointHit", function(info) {
		if (info) {
			app.OnBreakPointChange(info.newbp);
			app.OnBreakPointChange(info.oldbp);
		}
	});

	_global.Event.on("OnDebugBreakPointsChanged", function (info) {
	    if (info && info.opbps) {
	        for (let bp of info.opbps) {
				app.OnBreakPointChange(bp);
			}
		}
	});
}

GraphApp.prototype.DebugBreak = function() {
	let SelectedNodes = this.nodecanvas.SelectedNodes;
	if (SelectedNodes.length != 1) return;

	let node = SelectedNodes[0];

	// 在结点上设置断点，如果有脚本并且脚本没有断点，优先设置第一个脚本断点, 如果已有脚本断点，则取消所有断点
	// 如果没有脚本，才将断点加在节点本身上
    let bps = node.CheckBreakPoints();
	_global.EmitToMainGlobal("OnSetBreakPoints", bps);
}

GraphApp.prototype.OnBreakPointChange = function(bp) {
	if (bp && (bp.__cls__ == "KF8GraphNodeBreakPoint" || bp.__cls__ == "KF8GraphScriptBreakPoint")) {
		let node = this.nodecanvas.FindNodeByStrName(bp.NodeName);
		if (node) {
		    node.UpdateBreakPointStatus();
		}
	}
}

GraphApp.prototype.InitNodeTree = function() {
    let app = this;
	this.nodetree = $('#nodetree');
	this.nodetree.tree({
		loader: function(param,success,error) {
			if (!param.id) return;
			let node = app.nodetree.tree('find', param.id);
			if (node) {
				if (node.assetname &&
					node.assetname.length > 4 &&
					node.assetname.substring(node.assetname.length - 4, node.assetname.length) == '.blk') {
					app.LoadNodeSubtree(node, success);
				} else {
					success(node.children);
				}
			}
		},
		onClick: function (node) {
		    app.OnNodeTreeSelected(node);
		},
		onExpand: function (node) {
			app.OnNodeTreeExpand(node);
		},
		onCollapse: function (node) {
			app.OnNodeTreeCollapse(node);
		}

	})

	this.nodecanvas.Event.on("onBlockDataChanged", function () {
		app.OnBlockDataChanged();
	});

	this.nodecanvas.Event.on("onChangeFold", function(node) {
		app.OnChangeFold(node);
	})

	this.graphnodeattrib.Event.on("OnDataChange",function () {
		app.OnBlockDataChanged();
	});

	_global.Event.on("OnSwitchToGraph", function () {
		app.OnGraphSwitched();
	});
}

GraphApp.prototype.GetGraphTreeNodes = function (blkdata) {
	let nodes = [];
	if (blkdata && blkdata.graph && blkdata.graph.data) {
		nodes = this.GetNormalGraphTreeNodes(blkdata.graph.data);
	}
	return nodes;
}

GraphApp.prototype.UpdateNodeTree = function () {
	let nodes = this.GetGraphTreeNodes(_global.editor.blkdata);
	this.nodetree.tree({data: nodes});

	let SelectedNodes = this.nodecanvas.SelectedNodes;
	if (SelectedNodes.length == 1) {
		let node = SelectedNodes[0];
		if (node && node.blockdata && node.blockdata.name) {
			let name = node.blockdata.name.toString();
			let treenode = this.nodetree.tree('find', NVal(name));
			if (treenode) {
				this.nodetree.tree('select', treenode.target);
			}
		}
	}
}

GraphApp.prototype.GetNormalGraphTreeNodes = function (data) {
	let nodes = [];
	let cache = {};
	let getCacheNode = function (name) {
		let node = cache[name];
		if (!node) {
			node = {};
			node.iconCls = "";
			node.id = NVal(name);
			node.name = name;
			node.text = name;
            node.children = [];
			node.refcount = 0;
			cache[name] = node;
		}
		return node;
	}
	let maybeaddedloop = false;
	let pushchild = function(arr, child) {
		child.refcount += 1;
		// 保护一下
		if (child.refcount >= 100) {
			Nt("节点[" + child.name + "]引用过多，可能存在异常");
			maybeaddedloop = true;
			return;
		}
		// 判断父节点有没有自己
		let parentname = child.parentname;
		while (parentname && parentname.length > 0)
		{
			let parent = getCacheNode(parentname);
			if (parent) {
				if (parent == child) {
					Nt("节点[" + child.name + "]存在循环引用，可能存在异常");
					maybeaddedloop = true;
					return;
				}
				parentname = parent.parentname;
			} else {
				parentname = null;
			}
		}
		arr.push(child);
	}
	if (data && data.blocks) {
		for (let block of data.blocks) {
			let name = block.name.toString();
			let node = getCacheNode(name);
			if (block.target && block.target.asseturl && block.target.asseturl.length > 0) {
				let submodulename = ((block.target.instname ? block.target.instname.toString() : "") + "[" + block.target.asseturl + "]");
				let vnode = getCacheNode(submodulename);
				vnode.state = 'closed';
				vnode.assetname = block.target.asseturl;
				vnode.parentname = name;
				node.children.push(vnode);
			}
			if (block.outputs) {
				for (let i in block.outputs) {
					let out = block.outputs[i];
					if (!out.name) continue;
					let outname = out.name.toString();
					let childnode = getCacheNode(outname);
					childnode.parentname = name;
					pushchild(node.children, childnode);
					if (GraphNode.IsFolded(block.name)) {
						node.state = "closed";
					}
				}
			}
		}
		for (let name in cache) {
			let node = cache[name];
			if (!node.parentname) {
				pushchild(nodes, node);
			}
		}
		if (maybeaddedloop) {
			nodes = [{text:"节点可能存在异常",iconCls:"icon-tip"}];
		}
	}
	return nodes;
}

GraphApp.prototype.LoadNodeSubtree = function (vnode, success) {
	if (vnode && vnode.assetname && vnode.assetname.length > 0) {
	    vnode.children = [];
		_global.editor.context.LoadBlk(vnode.assetname, function (ret, blkdata, blkpath) {
			if (ret) {
				let nodes = this.GetGraphTreeNodes(blkdata);
				success(nodes);
			}
		}.bind(this), true);
	}
}

GraphApp.prototype.OnBlockDataChanged = function () {
	this.UpdateNodeTree();
}

GraphApp.prototype.OnNodeTreeSelected = function (treenode) {
	let nodeselected = false;
	while (treenode) {
		let node = this.nodecanvas.FindNodeByStrName(treenode.name);
		if (!node || !node.IsVisible()) {
			if (treenode.parentname) {
				treenode = this.nodetree.tree('find', NVal(treenode.parentname));
				continue;
			}
		} else {
			this.nodecanvas.OnSelectNode(null);
			this.nodecanvas.OnSelectNode(node);
			this.nodecanvas.ToCenter(node);
			nodeselected = true;
		}
		break;
	}
	if (!nodeselected) {
		this.nodecanvas.OnSelectNode(null);
	}
}

GraphApp.prototype.NotifyNodeTreeChange = function (node) {
	if (node && node.blockdata && node.blockdata.name) {
		let name = node.blockdata.name.toString();
		let treenode = this.nodetree.tree('find', NVal(name));
		if (treenode) {
			this.nodetree.tree('expandTo', treenode.target);
			this.nodetree.tree('select', treenode.target);
			this.nodetree.tree('scrollTo', treenode.target);
		}
	}
}

GraphApp.prototype.OnNodeTreeExpand = function (treenode) {
	if (treenode) {
		let node = this.nodecanvas.FindNodeByStrName(treenode.name);
		if (node && node.IsFolded()) {
			node.ChangeFold(true);
			node.ClearFold();
		}
	}
}

GraphApp.prototype.OnNodeTreeCollapse = function (treenode) {
	if (treenode) {
		let node = this.nodecanvas.FindNodeByStrName(treenode.name);
		if (node && !node.IsFolded()) {
			node.ChangeFold(true);
		}
	}
}

GraphApp.prototype.OnChangeFold = function (node) {
	if (node && node.blockdata && node.blockdata.name) {
		let name = node.blockdata.name.toString();
		let treenode = this.nodetree.tree('find', NVal(name));
		if (treenode) {
		    if (node.IsFolded()) {
				this.nodetree.tree('collapse', treenode.target);
			} else {
				this.nodetree.tree('expand', treenode.target);
			}
		}
	}
}

GraphApp.prototype.OnGraphSwitched = function () {
	let framedata = null;
	let selected = this.nodetree.tree('getSelected');
	if (selected) {
		let node = this.nodecanvas.FindNodeByStrName(selected.name);
		if (node) {
			framedata = node.blockdata.frame;
		}
	}
	_global.Event.emit("OnFrameDataSelected", framedata, this.graphnodeattrib);
}

GraphApp.prototype.CheckAutoOpenAction = function () {
	if (_global.autographsubpath) {
		let subpath = _global.autographsubpath;
		if (subpath.NodeName) {
			let node = this.nodecanvas.FindNodeByStrName(subpath.NodeName);
			if (node) {
				this.nodecanvas.OnSelectNode(node);
				this.nodecanvas.ToCenter(node);

				if (subpath.ScriptId >= 0) {
					let framedata = node.blockdata ? node.blockdata.frame: null;
					_global.Event.emit("OnFrameDataSelected", framedata, this.graphnodeattrib, true, subpath.ScriptId, subpath.FieldPath);
				} else if (subpath.FieldPath) {
					this.graphnodeattrib.SelectFieldPath(subpath.FieldPath);
				}
			}
		}
		_global.autographsubpath = null;
	}
}

GraphApp.prototype.OpenNodeTarget = function() {
	let SelectedNodes = this.nodecanvas.SelectedNodes;
	if (SelectedNodes.length > 0) {
		let node = SelectedNodes[0];
		if (node) {
			node.OpenNodeChild();
		}
	}
}

GraphApp.menuItems = {
	none: ['#graphorgscale'],
	onlyone: ['#graphbreakpoint', '#graphbreakpointsep'],
	leastone: ['#graphbreakinput', '#graphbreakinputsep',
		'#graphnodedelete', '#graphnodedeletesep',
		'#graphnodecopy',
		"#graphbreakinput", "#graphbreakinputsep",
		'#graphnodecolor', '#graphnodecolorsep',
	],
	always: ['#graphnodepaste', '#graphnodecopysep']
}

GraphApp.prototype.ProcMenu = function () {
  let menuui = $('#graphemnu');
	CommTool.ShowMenu(menuui, GraphApp.menuItems.always, true);
	let length = this.nodecanvas.SelectedNodes.length;
	if (length === 0) {
		CommTool.ShowMenu(menuui, GraphApp.menuItems.none, true);
		CommTool.ShowMenu(menuui, GraphApp.menuItems.onlyone, false);
		CommTool.ShowMenu(menuui, GraphApp.menuItems.leastone, false);
	} else if (length === 1) {
		CommTool.ShowMenu(menuui, GraphApp.menuItems.none, false);
		CommTool.ShowMenu(menuui, GraphApp.menuItems.onlyone, true);
		CommTool.ShowMenu(menuui, GraphApp.menuItems.leastone, true);
	} else {
		CommTool.ShowMenu(menuui, GraphApp.menuItems.none, false);
		CommTool.ShowMenu(menuui, GraphApp.menuItems.onlyone, false);
		CommTool.ShowMenu(menuui, GraphApp.menuItems.leastone, true);
	}

	CommTool.ShowMenu(menuui, ['#graphopennodetarget', '#graphopennodetargetsep'], false);

	let SelectedNodes = this.nodecanvas.SelectedNodes;
	if (SelectedNodes.length > 0) {
		let node = SelectedNodes[0];
		if (node && node.CanOpenNodeChild()) {
			CommTool.ShowMenu(menuui, ['#graphopennodetarget', '#graphopennodetargetsep'], true);
		}
	}
}
