@echo off

chcp 65001

cd %~dp0

rd /S/Q dist

rem 判断electron-packager是否安装，没有就安装下
npm list -g | findstr packager >nul 2>nul
if %errorlevel% NEQ 0 (
	npm install electron-packager -g
	echo 安装了electron-packager，如果退出了，可以重试下
	timeout 5
)

rem 由于electron-packager执行完后，脚本会直接退出，这里需要临时建一个bat文件用于执行
del /Q run_only_packager.bat
echo electron-packager ./ --out=dist --platform=win32 --arch=x64 --overwrite --ignore=".vs|.idea|.svn" >> run_only_packager.bat
call run_only_packager.bat
del /Q run_only_packager.bat

if not exist dist\kfeditorh5-win32-x64 (
	echo electron-packager执行失败了 && pause && exit -1
)

set ToolPath=dist\kfeditorh5-win32-x64\resources\app\tool
rem rd /S/Q dist\kfeditorh5-win32-x64\resources\app\tool
rem mkdir dist\kfeditorh5-win32-x64\libs
rem xcopy /s/e/Y libs dist\kfeditorh5-win32-x64\libs
rem mkdir dist\kfeditorh5-win32-x64\src
rem xcopy /s/e/Y src dist\kfeditorh5-win32-x64\src
rem mkdir %ToolPath%\tool
mkdir %ToolPath%\KFMiddleServer
mkdir %ToolPath%\Python39
mkdir %ToolPath%\webserver
mkdir %ToolPath%\Debugger
mkdir %ToolPath%\CompileVMCode
mkdir %ToolPath%\wabt-1.0.27
mkdir %ToolPath%\wasi-sdk-14.0

del /Q exclude.txt
echo __pycache__ >> exclude.txt
echo .pyc >> exclude.txt
echo .idea >> exclude.txt
echo logs >> exclude.txt
xcopy /s/e/Y monaco-editor\node_modules\monaco-editor\min dist\kfeditorh5-win32-x64\resources\app\monaco-editor\node_modules\monaco-editor\min
xcopy /s/e/Y tool\KFMiddleServer %ToolPath%\KFMiddleServer /EXCLUDE:exclude.txt
xcopy /s/e/Y tool\Python39 %ToolPath%\Python39 /EXCLUDE:exclude.txt
xcopy /s/e/Y tool\webserver %ToolPath%\webserver /EXCLUDE:exclude.txt
xcopy /s/e/Y tool\Debugger %ToolPath%\Debugger /EXCLUDE:exclude.txt
xcopy /s/e/Y tool\CompileVMCode %ToolPath%\CompileVMCode /EXCLUDE:exclude.txt
xcopy /s/e/Y tool\wabt-1.0.27 %ToolPath%\wabt-1.0.27
xcopy /s/e/Y tool\wasi-sdk-14.0 %ToolPath%\wasi-sdk-14.0
del /Q exclude.txt

del /Q DateTimeCalculate.vbs
echo dt=date() > DateTimeCalculate.vbs
echo dts=right(year(dt),4) ^& right("0" ^& month(dt),2) ^& right("0" ^& day(dt),2) >> DateTimeCalculate.vbs
echo wscript.echo dts >> DateTimeCalculate.vbs
for /f %%a in ('cscript /nologo DateTimeCalculate.vbs') do (
  set Date=%%a
)

echo tm=time() > DateTimeCalculate.vbs
echo tms=right("0" ^& hour(tm),2) ^& right("0" ^& minute(tm),2) ^& right("0" ^& second(tm),2) >> DateTimeCalculate.vbs
echo wscript.echo tms >> DateTimeCalculate.vbs
for /f %%a in ('cscript /nologo DateTimeCalculate.vbs') do (
  set Time=%%a
)
del /Q DateTimeCalculate.vbs

echo %Date%%Time% > dist\kfeditorh5-win32-x64\pkg_version.txt

set zipfile=kfeditorh5_%Date%%Time%.zip

where powershell >nul 2>nul
set PowerShellError=%errorlevel%
if exist "c:\Program Files\7-Zip\7z.exe" (
	"c:\Program Files\7-Zip\7z.exe" a dist\%zipfile% dist\kfeditorh5-win32-x64
) else if %PowerShellError% == 0 (
	powershell Compress-Archive -Path dist\kfeditorh5-win32-x64 -DestinationPath dist\%zipfile%
) else (
	tar -cf dist\%zipfile% dist\kfeditorh5-win32-x64
)

pause
