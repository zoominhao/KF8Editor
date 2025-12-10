function Include() {
	AddPath("libs/libsbefore.js");
	AddPath("libs/jquery.min.js");
	AddPath("libs/jquery.easyui.min.js");
	AddPath("libs/pixi.min.js");
	AddPath("libs/xlsx.full.min.js");
	AddPath("libs/require.js");
	AddPath("libs/jquery.color.js");
	AddPath("libs/base64.js");

	// Configuration modules
	AddPath("src/config/WindowConfig.js");
	AddPath("src/config/ToolbarConfig.js");

	// Core modules
	AddPath("src/core/CommonInit.js");

	// Utility modules
	AddPath("src/utils/WindowUtils.js");

	AddPath("src/ext/Native.js");
	AddPath("src/ext/CommonUtil.js");
	AddPath("src/ext/Expression.js");
	AddPath("src/utils/hdNumHelper.js");
	AddPath("src/utils/CommTool.js");
	AddPath("src/utils/ClipboardTool.js");
	AddPath("src/Init.js");
	AddPath("src/KFEditTool.js");
	AddPath("src/KFDPropTool.js");
	AddPath("src/KFDEditor.js");
	AddPath("src/editorui/KFDEditorCustom.js");
	AddPath("src/editorui/KFDEditorScriptUI.js");
	AddPath("src/editorui/DynExecWrapper.js");
	AddPath("src/editorui/KFDEditorDebug.js");
	AddPath("src/net/LevelControl.js");
	AddPath("src/net/Plot.js");
	AddPath("src/net/TOD.js");
	AddPath("src/net/EditorNetworkMgr.js");

	AddPath("src/Timeline.js");
	AddPath("src/timeline/TimelineDrawer.js");
	AddPath("src/timeline/TimelineRenderBlock.js");
	AddPath("src/timeline/TimelinePlot.js");
	AddPath("src/timeline/TimelineTOD.js");
	AddPath("src/timeline/TimelineInput.js");
	AddPath("src/timeline/TimelineOpenAction.js");
	AddPath("src/timeline/TimelineDesc.js");
	AddPath("src/timeline/TimelineDescDrawer.js");
	AddPath("src/GraphNode.js");
	AddPath("src/GraphApp.js");
	AddPath("src/graph/GraphDesc.js");
	AddPath("src/IPCPreview/IPCPreview.js");

	AddPath("libs/extends/datagrid-dnd.js");
	AddPath("libs/extends/datagrid-detailview.js");
	AddPath("src/editorui/ScriptDescParser.js");
	AddPath("src/FrameDataWindow.js");

	AddPath("src/EditorContext.js");
	AddPath("src/BlkLibrary.js");
	AddPath("src/RemoteObjectLibrary.js");
	AddPath("src/code/KF8Coder.js")

	AddPath("src/buff/BuffEditor.js");

	AddPath("src/net/NetObjSelector.js");
	AddPath("src/debug/DebugComm.js");
}

function AddPath(url) {
	document.write("<script type=\"text/javascript\" src="+url+"></script>");
}

Include();                            