package.json已经添加相关配置和mocha包

如果想使用 Mocha 单独进行单元测试，下面可参考
npm install -g mocha

WebStorm:
1、Unresolved function or method describe() / it()问题
打开 File - Settings - Languages&Frameworks - JavaScript - Libraries - Download
选择下载 mocha

2、运行设置(Run/Debug Configurations)
增加新配置，选择Mocha，测试目前选择待测试目录: {workdir}/KF8Editor/test

