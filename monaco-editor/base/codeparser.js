// 目前只有导出函数，先简单处理
class CodeParser {
    static kfdregex = /\/\/\/KFD\(([A-Z])(.*,.*)?\)/;
    static wasmexportmethod = /WASM_EXPORT\s+void\s+([a-zA-Z0-9_]+)\s*\(ObjectPtr\s+__ci\s*,\s*ObjectPtr\s+__ti\s*\).*/;

    constructor(codedata) {
        this.codedata = codedata;
        this.currindex = 0;
        this.methods = [];
        this.errors = null;
        this.Parse();
    }

    GetMethods() {
        return this.methods;
    }

    Parse() {
        let line = this.getNextLine();
        while(line !== null) {
            let matched = line.match(CodeParser.kfdregex)
            if (matched) {
                this.parseDispatch(matched[1], matched[2]);
            }
            line = this.getNextLine();
        }
    }

    getNextLine() {
        if (this.currindex >= this.codedata.length) return null;
        let index = this.codedata.indexOf('\n', this.currindex);
        if (index === -1)  index = this.codedata.length;
        let currindex = this.currindex;
        this.currindex = index + 1;
        return this.codedata.substring(currindex, index);
    }


    parseDispatch(type, kvstr) {
        switch (type) {
            case 'M':
                this.parseMethod(kvstr);
                break;
            default:
                break;
        }
    }

    parseMethod() {
        let line = this.getNextLine();
        if (line) {
            let matched = line.match(CodeParser.wasmexportmethod);
            if (matched) {
                this.methods.push(matched[1]);
            }
        }
    }
}