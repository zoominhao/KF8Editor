class hdNumHelper {
    static wholeBits = 31n;
    static fractionBits = 32n;
    static fractionMask = (1n << hdNumHelper.fractionBits) - 1n;
    static floatScale = 4294967296;
    static minRawValue = -(1n << (hdNumHelper.wholeBits + hdNumHelper.fractionBits - 1n));
    static maxRawValue = (1n << (hdNumHelper.wholeBits + hdNumHelper.fractionBits - 1n)) - 1n;

    constructor(value) {
        let type =  typeof value;
        if (type === 'bigint') {
            this.rawValue = value;
        } else if (type === 'number'){
            this.FromNumber(value);
        } else if (type === 'object' && value.hasOwnProperty('rawValue')) {
            this.rawValue = value.rawValue;
        } else {
            this.rawValue = 0;
        }
    }

    GetWhole() {
        if (this.rawValue > 0) {
            return Number(this.rawValue >> hdNumHelper.fractionBits);
        } else {
            return Number(-((-this.rawValue) >> hdNumHelper.fractionBits));
        }
    }

    // return unsigned
    GetFraction() {
        if (this.rawValue > 0) {
            return Number(this.rawValue & hdNumHelper.fractionMask);
        } else {
            return Number((-this.rawValue) & hdNumHelper.fractionMask);
        }
    }

    ToNumber() {
        return Number(this.rawValue) / hdNumHelper.floatScale;
    }

    FromNumber(value) {
        if (value >= 0) {
            let fValue = value * hdNumHelper.floatScale + 0.5;
            let rawValue = BigInt(Math.floor(fValue));
            this.rawValue = (rawValue < hdNumHelper.maxRawValue ? rawValue : hdNumHelper.maxRawValue);
        } else {
            let fValue = value * hdNumHelper.floatScale - 0.5;
            this.rawValue = (fValue > Number(hdNumHelper.minRawValue) ? BigInt(Math.ceil(fValue)): hdNumHelper.minRawValue);
        }
    }

    FromNumberWholeAndFraction(whole, fraction) {
        whole = BigInt(Math.floor(whole));
        fraction = BigInt(Math.floor(fraction));
        if (whole >= 0) {
            this.rawValue = (whole << hdNumHelper.fractionBits) | fraction;
        } else {
            this.rawValue = -(((-whole) << hdNumHelper.fractionBits) | fraction);
        }
    }

    FromNumberABC(a, b, c) {
        a = BigInt(Math.floor(a));
        b = BigInt(Math.floor(b));
        c = BigInt(Math.floor(c));
        if (a >= 0) {
            this.rawValue = (a << hdNumHelper.fractionBits) | ((b << hdNumHelper.fractionBits) / c);
        } else {
            this.rawValue = -(((-a) << hdNumHelper.fractionBits) | (((b << hdNumHelper.fractionBits) / c)));
        }
    }

    GetRawValue() {
        return this.rawValue;
    }
}

function hdNumRaw(hdnum) {
    return hdnum && hdnum.hasOwnProperty('rawValue') ? hdnum.rawValue : 0n;
}

function hdNumToNumber(hdnum) {
    let numHelper = new hdNumHelper(hdnum);
    return numHelper.ToNumber();
}

function hdNumFromRaw(value) {
    return new hdNumHelper(value);
}

function hdNumFromNumber(value) {
    return {rawValue: hdNumRawValueFromNumber(value)};
}

function hdNumRawValueFromNumber(value) {
    let hdnumHelper = new hdNumHelper(value);
    return hdnumHelper.GetRawValue();
}

function hdNumRawValueFromNumberWholeAndFraction(whole, fraction) {
    let hdnumHelper = new hdNumHelper(0);
    hdnumHelper.FromNumberWholeAndFraction(whole, fraction);
    return hdnumHelper.GetRawValue();
}

function hdNumFromNumberWholeAndFraction(whole, fraction) {
    return {rawValue: hdNumRawValueFromNumberWholeAndFraction(whole, fraction)};
}

function hdNumRawValueFromNumberABC(a, b, c) {
    let hdnumHelper = new hdNumHelper(0);
    hdnumHelper.FromNumberABC(a, b, c);
    return hdnumHelper.GetRawValue();
}

function hdNumFromNumberABC(a, b, c) {
    return {rawValue: hdNumRawValueFromNumberABC(a, b, c)};
}

function hdNumZero() {
    return {rawValue: 0};
}

function hdNumFromDefaultStr(defaultStr) {
    if (defaultStr) {
        let index = defaultStr.indexOf('hdNum');
        if (index === -1) {
            return hdNumFromNumber(Number(defaultStr.replaceAll('.f', '').replaceAll('f', '')));
        } else {
            index = index + 5;
            if (defaultStr[index] === '(') {
                index += 1;
                let endIndex = defaultStr.indexOf(')', index);
                if (endIndex !== -1) {
                    let params = defaultStr.substring(index, endIndex).split(',');
                    if (params.length > 0) {
                        params.map(x => x.trim());
                        switch (params.length) {
                            case 1: return hdNumFromNumber(Number(params[0]));
                            case 2: return hdNumFromNumberWholeAndFraction(Number(params[0]), Number(params[1]));
                            case 3: return hdNumFromNumberABC(Number(params[0]), Number(params[1]), Number(params[2]));
                            default: break;
                        }
                    }
                }
            } else if (defaultStr[index] === ':') {
                index += 2;
                let endIndex = defaultStr.indexOf('(', index);
                if (endIndex !== -1) {
                    let funcName = defaultStr.substring(index, endIndex);
                    switch (funcName) {
                        case 'Zero': return hdNumZero();
                        case 'Half': return hdNumFromRaw(1n << (hdNumHelper.fractionBits - 1n));
                        case 'Quarter': return hdNumFromRaw(1n << (hdNumHelper.fractionBits - 2n));
                        case 'Eighth': return hdNumFromRaw(1n << (hdNumHelper.fractionBits - 3n));
                        case 'One': return hdNumFromRaw(1n << hdNumHelper.fractionBits);
                        case 'Two': return hdNumFromRaw(1n << (hdNumHelper.fractionBits + 1n));
                        default: break;
                    }
                }
            }
        }
    }
    return hdNumZero();
}

function hdNumClone(hdNum) {
    return $.extend(true, {}, hdNum);
}
