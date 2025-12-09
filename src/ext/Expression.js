// 来自 https://juejin.cn/post/6844903679829475336

class ExpressionParser {
    constructor(defines) {
        this.defines = defines;
        this.expr = "";
        this.tokens = undefined;
        this.index = 0;
        this.initDefinesExtra();
    }

    initDefinesExtra() {
        if (this.defines) {
            this.defines_extra = {};
            let self = this;
            let calcLength = function (key, item, func, lenName) {
                let value = self.defines[key];
                if (value && value[item]) {
                    let prop = {};
                    prop[lenName] = func(value[item]);
                    self.defines_extra[key] = prop;
                }
            }
            calcLength("Group", "BeginEnds", this.getMaxKeyLen, "maxBeginLength");
            calcLength("Variable", "BeginEnds", this.getMaxKeyLen, "maxBeginLength");
            calcLength("String", "BeginEnds", this.getMaxKeyLen, "maxBeginLength");
            calcLength("Number", "Includes", this.getMaxLen, "maxIncludesLength");
            calcLength("Space", "Includes", this.getMaxLen, "maxIncludesLength");
            calcLength("UnaryOperator", "Includes", this.getMaxLen, "maxIncludesLength");
            calcLength("BinaryOperator", "Includes", this.getMaxKeyLen, "maxIncludesLength");
        }
    }

    parse(expr) {
        try {
            if (typeof expr !== 'string' || expr.length === 0) {
                throw new Error("表达式需要为非空字符串")
            }
            this.expr = expr;
            this.index = 0;
            this.tokens = this.parseExpression();
            if (this.index < this.expr.length) {
                throw new Error("非法字符");
            }
        } catch (error) {
            this.tokens = undefined;
            if (this.onErrorCallback) {
                this.onErrorCallback(error.message, this.index, this.charAt());
                return null;
            }
        }
        return this;
    }

    parseExpression() {
        let left = this.parseToken();
        let operator = this.parseBinaryOperator();
        // 说明这个运算树只有左侧
        if (!operator) {
            return left;
        }
        let operatorInfo = {
            precedence: this.getOperatorPrecedence(operator), // 获取运算符优先级
            value: operator,
        };
        let right = this.parseToken();
        if (!right) {
            throw new Error(`"${operator}"运算符后应该为表达式`);
        }
        const stack = [left, operatorInfo, right];
        // 获取下一个运算符
        operator = this.parseBinaryOperator();
        while (operator) {
            const precedence = this.getOperatorPrecedence(operator);
            // 如果遇到了非法优先级
            if (precedence === 0) {
                break;
            }
            operatorInfo = {
                precedence,
                value: operator,
            };
            while (stack.length > 2 && precedence < stack[stack.length - 2].precedence) {
                right = stack.pop();
                operator = stack.pop().value;
                left = stack.pop();
                const node = this.createNode(operator, left, right);
                stack.push(node);
            }
            const node = this.parseToken();
            if (!node) {
                throw new Error(`"${operator}"运算符后应该为表达式`);
            }
            stack.push(operatorInfo, node);
            operator = this.parseBinaryOperator();
        }
        let i = stack.length - 1;
        let node = stack[i];
        while (i > 1) {
            node = this.createNode(stack[i - 1].value, stack[i - 2], node);
            i -= 2;
        }
        return node;
    }

    parseToken() {
        this.parseSpaces();
        // 变量
        let ret = this.checkVariableBegin();
        if (ret && ret.begin) {
            return this.parseVariable(ret.len);
        }
        // 数字
        if (this.checkNumberBegin()) {
            return this.parseNumber();
        }
        // 字符串
        let len = this.checkStringBegin()
        if (len > 0) {
            return this.parseString(len);
        }
        // 括号
        len = this.checkGroupBegin()
        if (len > 0) {
            return this.parseGroup(len);
        }
        // 单操作符
        len = this.checkUnaryOperator()
        if (len > 0) {
            return this.parseUnaryOperator(len);
        }

        throw Error("无法解析到Token");
    }

    checkInclude(key, item, maxLenName) {
        let value = this.defines[key];
        if (value && value[item]) {
            return this.checkMatchLength(value[item], this.defines_extra[key][maxLenName]);
        }
        return 0;
    }

    checkMatch(key, item, maxLenName) {
        let value = this.defines[key];
        if (value && value[item]) {
            return this.checkKeysMatchLength(value[item], this.defines_extra[key][maxLenName]);
        }
        return 0;
    }

    checkMatchLength(arr, maxLen) {
        let toCheck = this.expr.substr(this.index, maxLen);
        let toCheckLength = toCheck.length;
        while (toCheckLength > 0) {
            if (arr.indexOf(toCheck) !== -1) {
                return toCheckLength;
            }
            toCheck = toCheck.substr(0, --toCheckLength);
            toCheckLength = toCheck.length;
        }
        return 0;
    }

    checkKeysMatchLength(obj, maxKeyLen) {
        let toCheck = this.expr.substr(this.index, maxKeyLen);
        let toCheckLength = toCheck.length;
        while (toCheckLength > 0) {
            if (obj.hasOwnProperty(toCheck)) {
                return toCheckLength;
            }
            toCheck = toCheck.substr(0, --toCheckLength);
            toCheckLength = toCheck.length;
        }
        return 0;
    }

    checkKeyword() {
        return this.checkMatch("Keyword", "Includes", "maxIncludesLength");
    }

    checkVariableBegin() {
        let ret = {begin: false, len: 0};
        let variable = this.defines.Variable;
        if (variable) {
            if (variable.CheckBegin) {
                ret.begin = variable.CheckBegin(this.expr.substring(this.index));
            } else {
                ret.len = this.checkMatch("Variable", "BeginEnds", "maxBeginLength")
                ret.begin = ret.len > 0;
            }
        }
        return ret;
    }

    checkNumberBegin() {
        let number = this.defines.Number;
        if (number && number.CheckBegin) {
            return number.CheckBegin(this.charAt()) ? 1 : 0;
        }
    }

    checkStringBegin() {
        return this.checkMatch("String", "BeginEnds", "maxBeginLength")
    }

    checkGroupBegin() {
        return this.checkMatch("Group", "BeginEnds", "maxBeginLength")
    }

    checkUnaryOperator() {
        return this.checkInclude("UnaryOperator", "Includes", "maxIncludesLength");
    }

    checkDefinesKeyValid(key, ...items) {
        let value = this.defines[key];
        if (!value) {
            throw Error(`没有定义${key}`);
        }
        for (let item of items) {
            if (!value[item]) {
                throw Error(`没有定义${key}.${item}`);
            }
        }
    }

    parseKeyword(len) {
        this.checkDefinesKeyValid("Keyword", "Includes");
        let keyword = this.subStr(len);
        this.index += len;
        return {
            type: 'KEYWORD',
            value: keyword,
            raw: beginChars + identifier + (endChars ? endChars : ""),
        };
    }

    parseVariable(len) {
        this.checkDefinesKeyValid("Variable", "CheckPart");
        let beginChars = this.subStr(len);
        let endChars = null;
        if (this.defines.Variable.BeginEnds) {
            endChars = this.defines.Variable.BeginEnds[beginChars];
        }
        this.index += len;
        const start = this.index;
        let end = this.index;
        while (this.index < this.expr.length) {
            const ch = this.charAt();
            if (this.defines.Variable.CheckPart(ch)) {
                this.index++;
                end = this.index;
            } else {
                end = this.index;
                if (endChars) {
                    const chs = this.subStr(endChars.length);
                    if (chs !== endChars) {
                        throw new Error('变量名没有匹结束符');
                    } else {
                        this.index += endChars.length;
                    }
                }
                break;
            }
        }
        const identifier = this.expr.slice(start, end);
        return {
            type: 'VARIABLE',
            value: identifier,
            raw: beginChars + identifier + (endChars ? endChars : ""),
        };
    }

    parseNumber() {
        this.checkDefinesKeyValid("Number", "CheckDigit");
        let checkDigit = this.defines.Number.CheckDigit;
        let checkNumber = this.defines.Number.CheckNumber;
        let number = '';
        if (checkNumber) {
            let len = checkNumber(this.expr.substring(this.index));
            if (len === 0) {
                throw new Error(`非法数字`);
            }
            number += this.subStr(len);
            this.index += len;
        }
        else
        {
            let ch = this.charAt();
            while (checkDigit(ch)) {
                number += ch;
                this.index++;
                ch = this.charAt();
            }
        }

        return {
            type: 'NUMBER',
            value: Number(number),
            raw: number,
        };
    }

    parseString(len) {
        this.checkDefinesKeyValid("String", "BeginEnds");
        let str = '';
        const beginChars = this.subStr(len);
        let endChars = this.defines.String.BeginEnds[beginChars];
        if (!endChars) {
            throw new Error('字符串没有配置结束符');
        }
        this.index += len;
        let closed = false;
        while (this.index < this.expr.length) {
            let chs = this.subStr(endChars.length);
            if (chs === endChars) {
                this.index += endChars.length;
                closed = true;
                break;
            } else {
                let ch = this.charAt(this.index++);
                if (this.defines.String.EscapeChar.length !== 0) {
                    if (ch === this.defines.String.EscapeChar) {
                        ch = this.charAt(this.index++);
                        if (this.defines.String.EscapeReturn) {
                            str += this.defines.String.EscapeReturn(ch);
                        } else {
                            throw Error("没有定义转义返回函数");
                        }
                    } else {
                        str += ch;
                    }
                } else {
                    str += ch;
                }
            }
        }

        if (!closed) {
            throw new Error(`字符"${str}"缺少闭合括号`);
        }

        return {
            type: 'STRING',
            value: str,
            raw: beginChars + str + endChars,
        };
    }

    parseGroup(len) {
        this.checkDefinesKeyValid("Group", "BeginEnds");
        let beginChars = this.subStr(len);
        let endChars = this.defines.Group.BeginEnds[beginChars];
        if (!endChars) {
            throw new Error('分组没有配置闭合');
        }
        this.index += len;
        const node = this.parseExpression();
        this.parseSpaces();
        const chs = this.subStr(endChars.length);
        if (chs !== endChars) {
            throw new Error('分组没有闭合');
        } else {
            this.index += endChars.length;
            return node;
        }
    }

    parseSpaces() {
        let len = 0;
        while (len = this.checkInclude("Space", "Includes", "maxIncludesLength")) {
            this.index += len;
        }
    }

    parseUnaryOperator(len) {
        let op = this.subStr(len);
        this.index += len;
        return {
            type: 'UNARY_EXP',
            operator: op,
            argument: this.parseToken(),
        };
    }

    parseBinaryOperator() {
        this.parseSpaces();
        let len = this.checkMatch("BinaryOperator", "Includes", "maxIncludesLength");
        if (len === 0) {
            return false;
        }
        let op = this.subStr(len);
        this.index += len;
        return op;
    }

    getOperatorPrecedence(operator) {
        this.checkDefinesKeyValid("BinaryOperator", "Includes");
        let prop = this.defines.BinaryOperator.Includes[operator];
        return prop ? prop.Precedence || 0 : 0;
    }

    createNode(operator, left, right) {
        this.checkDefinesKeyValid("BinaryOperator", "Includes");
        const props = this.defines.BinaryOperator.Includes[operator];
        const type = props.Logic ? 'LOGICAL_EXP' : 'BINARY_EXP';
        return {type, operator, left, right};
    }

    onError(callback) {
        this.onErrorCallback = callback;
        return this;
    }

    onGetVariableValue(callback) {
        this.onGetVariableCallback = callback;
        return this;
    }

    charAt(index = this.index) {
        return this.expr.charAt(index);
    }

    charCodeAt(index = this.index) {
        return this.expr.charCodeAt(index);
    }

    subStr(num = 1, index = this.index) {
        return this.expr.substring(index, index + num);
    }

    evaluate() {
        if (this.tokens == null) {
            return undefined;
        }
        return this.getNodeValue(this.tokens);
    }

    getNodeValue(node) {
        let self = this;
        const { type, value, left, right, operator } = node;
        if (type === 'VARIABLE') {
            return this.onGetVariableCallback ? this.onGetVariableCallback(value) : null;
        } else if (type === 'NUMBER' || type === 'STRING') {
            return value;
        } else if (type === 'LOGICAL_EXP') {
            const leftValue = this.getNodeValue(left);
            if (this.defines.OnGetLogicOpValue) {
                return this.defines.OnGetLogicOpValue(leftValue, operator, function () {
                    return self.getNodeValue(right)
                });
            }
        } else if (type === 'BINARY_EXP') {
            const leftValue = this.getNodeValue(left);
            const rightValue = this.getNodeValue(right);
            if (this.defines.OnGetBinaryOpValue) {
                return this.defines.OnGetBinaryOpValue(leftValue, operator, rightValue);
            }
        } else if (type === 'UNARY_EXP') {
            let value = this.getNodeValue(node.argument);
            if (this.defines.OnGetUnaryOpValue) {
                return this.defines.OnGetUnaryOpValue(value, operator);
            }
        }
    }

    // 获取对象键的最大长度
    getMaxKeyLen = function (obj) {
        let max = 0;
        Object.keys(obj).forEach((key) => {
            if (key.length > max && obj.hasOwnProperty(key)) {
                max = key.length;
            }
        });
        return max;
    };

    // 获取数组内元素的最大长度
    getMaxLen = function (arr) {
        let max = 0;
        arr.forEach((item) => {
            if (item.length > max) {
                max = item.length;
            }
        });
        return max;
    };
}

/*
// 测试
let rules_defines = {
    Group: {
        BeginEnds: {
            '(':')'
        },
    },
    Variable: {
        CheckBegin: function (expr) {
            let cc = expr.charCodeAt();
            // a..zA..Z
            return (cc >= 65 && cc <= 90) || (cc >= 97 && cc <= 122);
        },
        CheckPart: function (ch) {
            let cc = ch.charCodeAt();
            return (cc >= 65 && cc <= 90) || // A...Z
                (cc >= 97 && cc <= 122) || // a...z
                (cc >= 48 && cc <= 57); // 0...9
        },
    },
    Number: {
        CheckBegin: function (ch) {
            let cc = ch.charCodeAt();
            return cc >= 48 && cc <= 57; // 0...9
        },
        CheckDigit: function (ch) {
            let cc = ch.charCodeAt();
            return cc >= 48 && cc <= 57; // 0...9
        },
        CheckNumber:null
    },
    String: {
        BeginEnds: {
            "'":"'",
            '"':'"'
        },
        EscapeChar: '\\',
        EscapeReturn: function (ch) {
            let ret = '';
            switch (ch) {
                case 'n':
                    ret = '\n';
                    break;
                case 'r':
                    ret = '\r';
                    break;
                case 't':
                    ret = '\t';
                    break;
                case 'b':
                    ret = '\b';
                    break;
                case 'f':
                    ret = '\f';
                    break;
                case 'v':
                    ret = '\x0B';
                    break;
                default:
                    ret = ch;
            }
            return ret;
        }

    },
    Space: {
        Includes: [' ', '\t', '\n', '\r']
    },
    UnaryOperator: {
        Includes: ['!', '-', '+']
    },
    BinaryOperator: {
        Includes: {
            '||': {Precedence: 1, Logic: true},
            '&&': {Precedence: 2, Logic: true},
            '===': {Precedence: 6, Logic: true},
            '!==': {Precedence: 6, Logic: true},
            '<': {Precedence: 7, Logic: true},
            '>': {Precedence: 7, Logic: true},
            '<=': {Precedence: 7, Logic: true},
            '>=': {Precedence: 7, Logic: true},
            '+': {Precedence: 9},
            '-': {Precedence: 9},
            '*': {Precedence: 10},
            '/': {Precedence: 10},
            '%': {Precedence: 10},
            'include': {Precedence: 11},
        }
    },
    OnGetLogicOpValue: function (leftValue, operator, getRight) {
        // 如果是逻辑运算的&&和||，那么可能不需要解析右边的值
        if (operator === '&&' && !leftValue) {
            return false;
        }
        if (operator === '||' && !!leftValue) {
            return true;
        }
        const rightValue = getRight();
        switch (operator) {
            case '&&': return leftValue && rightValue;
            case '||': return leftValue || rightValue;
            case '>': return leftValue > rightValue;
            case '>=': return leftValue >= rightValue;
            case '<': return leftValue < rightValue;
            case '<=': return leftValue <= rightValue;
            case '===': return leftValue === rightValue;
            case '!==': return leftValue !== rightValue;
            case 'include': return leftValue.toString &&
                rightValue.toString &&
                leftValue.toString().indexOf(rightValue.toString()) !== -1;
            // skip default case
        }
    },
    OnGetBinaryOpValue: function (leftValue, operator, rightValue) {
        switch (operator) {
            case '+': return leftValue + rightValue;
            case '-': return leftValue - rightValue;
            case '*': return leftValue * rightValue;
            case '/': return leftValue - rightValue;
            case '%': return leftValue % rightValue;
            // skip default case
        }
    },
    OnGetUnaryOpValue: function (value, operator) {
        switch (operator) {
            case '!': return !value;
            case '+': return +value;
            case '-': return -value;
            // skip default case
        }
    }
}

const expression = new ExpressionParser(rules_defines);
expression.onError((message, index, ch) => {
    console.log(message, index, ch);
}).onGetVariableValue((name) => {
    let values = {load: 5};
    return values[name];
});
expression.parse('load + -100 +-- 100 * (1 + 3)');
console.log(expression.evaluate());

expression.parse('\'abcdef\' + 1 + " world"');
console.log(expression.evaluate());

expression.parse('1<2&&(3>4||(5<6 && 1!==2))');
console.log(expression.evaluate());

*/
