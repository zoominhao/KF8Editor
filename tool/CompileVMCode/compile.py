import os
import sys

if len(sys.argv) < 6:
    print(sys.argv[0], "AppPath", "IncludePath", "CodePaths", "OutPath", "TmpPath", "TmpOutNamePrefix")
    exit(-1)

AppPath = sys.argv[1]
IncludePath = sys.argv[2]
CodePaths = sys.argv[3].split("|")
WasmOutPath = sys.argv[4]
TmpPath = sys.argv[5]
TmpOutNamePrefix = sys.argv[6]
CompileVMCodeInclude = os.path.split(os.path.realpath(__file__))[0] + "/include"

TmpIncludePath = IncludePath + "/Generated"
DbgOutPath = TmpPath + "/Dbg/"
DbgOutFile = DbgOutPath + TmpOutNamePrefix + ".dbg"
DbgDumpFile = DbgOutPath + TmpOutNamePrefix + ".dwarf"
WasmTextPath = DbgOutPath + TmpOutNamePrefix + ".text"

DEBUG = 0

def GetCodePathStr(path):
    codeStr = " ";
    includeStr = ""
    if os.path.isdir(path):
        codeStr += path + "/*.cpp"
        includeStr += "-I " + path + " "
        files = os.listdir(path)
        for file in files:
            filePath = path + '/' + file
            if os.path.isdir(filePath):
                cstr, _ = GetCodePathStr(filePath);
                codeStr += cstr
    elif (os.path.exists(path)):
        codeStr += path
    
    return codeStr, includeStr


CodePathStr = ""
IncludePathStr = ""
for path in CodePaths:
    codeStr, includeStr = GetCodePathStr(path)
    CodePathStr += codeStr
    IncludePathStr += includeStr

DwarfOption=""
OptimizeOption="-O3"
if DEBUG != 0:
    DwarfOption="-gdwarf-4"
    OptimizeOption="-O0"

# -Wl,--export=malloc \
# -Wl,--export=free \
# 编译生成wasm文件
CompileCmd = f"""
{AppPath}/tool/wasi-sdk-14.0/bin/clang++.exe \
  --sysroot={AppPath}/tool/wasi-sdk-14.0/share/wasi-sysroot \
  {OptimizeOption} \
  --target=wasm32-wasi \
  -nostartfiles \
  -fno-exceptions \
  -Wl,--no-entry \
  -Wl,--export-dynamic \
  -Wl,--allow-undefined \
  -Wl,--export-all \
  {DwarfOption} \
  -I {IncludePath} \
  -I {TmpIncludePath} \
  -I {CompileVMCodeInclude} \
  {IncludePathStr} \
  -I ./ \
  {CodePathStr} \
  -o {WasmOutPath}
""";
print(CompileCmd)
if os.system(CompileCmd) != 0:
    exit(-2)

if DEBUG != 0:
    #提取dwarf调试信息
    if not os.path.isdir(DbgOutPath):
        os.makedirs(DbgOutPath)
    if os.system(f"""
    {AppPath}/tool/Python39/python.exe \
        {AppPath}/tool/Debugger/wasm2dbg.py \
        {WasmOutPath} \
        {DbgOutFile}
    """) != 0:
        exit(-3)

    # dump DWARF文本
    if os.system(f"""
    {AppPath}/tool/wasi-sdk-14.0/bin/llvm-dwarfdump.exe \
        {WasmOutPath} \
        -all \
        -o {DbgDumpFile}
    """) != 0:
        exit(-4)

    #wasm文本格式
    if os.system(f"""
    {AppPath}/tool/wabt-1.0.27/bin/wasm2wat.exe \
        --generate-names \
        -f \
        {WasmOutPath} \
        -o {WasmTextPath}
    """) != 0:
        exit(-5)

    #去除dwarf调试信息
    if os.system(f"""
    {AppPath}/tool/wabt-1.0.27/bin/wasm-strip.exe \
        {WasmOutPath}
    """) != 0:
        exit(-6)
