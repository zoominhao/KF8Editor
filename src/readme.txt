Init.js 全局变量表的初始化
KFEditorApp.js, Windows.js 主从窗口进程
BlkLibrary.js，RemoteObjectLibrary.js 本地及网络的blk对象库
EditorContext.js 当前加载的blk上下文内容
KFDEditor.js 属性编辑展示
KFDPropTool.js kfd的属性标签能力定义实现
KFEditTool.js 整个编辑器的公共操作逻辑，如复制粘贴，撤销等
GraphApp.js，GraphNode.js 流程图
Timeline.js 时间轴
FrameDataWindow.js 脚本窗口

IPCPreview excel展示部分
window 新建基于kfedit的窗口基类
net 网络部分内容，比如剧情同步，关卡同步
ext 基础依赖类，方法，导入
debug 编辑器调试能力相关
m module文件夹

BuffEditor.js BUFF分表、总表保存逻辑，单项配置编辑、折叠
BuffWindow.js 单项配置编辑自定义窗口，暂时没用

注意：
1、新建窗口建议基于KFDEdtWrapWindow
2、Timeline重构中。。。
