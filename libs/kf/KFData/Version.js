/*

2020.02.24:

KFDTable.find_extend_kfddata 增加可以提定KFDTABLE实例

2020.03.01:

支持KFDName的直接读写吧

2020.03.04:

所有对象读入的json对象都设置了__cls__名称

2020.03.05:

对写入对象规则修改，在已经KFD情况下并不是用__cls__来判定是否为mixobject [为了修正之前对所有object对象加__cls__]
修正之前对空对象写支持但对空对象写不支持的BUG
将读取特性调整只有mixobject加__cls__

2020.03.08:

如果kfdata上增加 __init__ 则会进行初始化操作

2020.03.09:

修正写个BYTES是的BUG,没有写入长度
修正如果MIXOBJECT是对象属性，则需要通过对象获取类型

增加 读取对象时可以在kfdata中设置一个__new__的构造函数

2020.03.21:

增加增量写入接口
name 指定属性名称
attribFlags {name:{w:true}}
同时支持了下数组的增量读写

2022.02.26:

增加64位varint编码，并梳理varint相关功能，C++写入整型时采用varint编码，其他保持不变

2022.03.07

C++支持map容器，并处理差量比对以及差量写入

2022.03.17

支持网络标记NET，可选值为：never、only
支持类似反射的机制，可通过字段名读写字段值

*/
var KFDVersion = "2022.03.17";
