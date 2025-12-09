///二进制处理器
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });

    let Endian = /** @class */ (function () {
        function Endian() {
        }

        Endian.LITTLE_ENDIAN = "littleEndian";
        Endian.BIG_ENDIAN = "bigEndian";
        return Endian;
    }());
    exports.Endian = Endian;

    let ByteError = function () {
        let args = [];
        for (let _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        console.error("ByteError:" + args);
    };
    let ByteException = function () {
        ByteError(...arguments);
        console.trace("ByteException:");
        process.exit(-1);
    };

    let KFByteArray = /** @class */ (function () {
        function KFByteArray(buffer = null, bufferExtSize = 0) {
            if (bufferExtSize === void 0) { bufferExtSize = 0; }
            this.bufferExtSize = 0; //Buffer expansion size
            this.EOF_byte = -1;
            this.EOF_code_point = -1;
            if (bufferExtSize < 0) {
                bufferExtSize = 0;
            }
            this.bufferExtSize = bufferExtSize;
            let bytes, wpos = 0;
            if (buffer) { //有数据，则可写字节数从字节尾开始
                let uint8;
                if (buffer instanceof Uint8Array) {
                    uint8 = buffer;
                    wpos = buffer.length;
                }
                else {
                    wpos = buffer.byteLength;
                    uint8 = new Uint8Array(buffer);
                }
                if (bufferExtSize === 0) {
                    bytes = new Uint8Array(wpos);
                }
                else {
                    let multi = (wpos / bufferExtSize | 0) + 1;
                    bytes = new Uint8Array(multi * bufferExtSize);
                }
                bytes.set(uint8);
            }
            else {
                bytes = new Uint8Array(bufferExtSize);
            }
            this.write_position = wpos;
            this._position = 0;
            this._bytes = bytes;
            this.data = new DataView(bytes.buffer);
            this.endian = Endian.BIG_ENDIAN;
        }

        Object.defineProperty(KFByteArray.prototype, "endian", {
            get: function () {
                return this.$endian === 1 /* LITTLE_ENDIAN */ ? Endian.LITTLE_ENDIAN : Endian.BIG_ENDIAN;
            },
            set: function (value) {
                this.$endian = value === Endian.LITTLE_ENDIAN ? 1 /* LITTLE_ENDIAN */ : 2 /* BIG_ENDIAN */;
            },
            enumerable: true,
            configurable: true
        });

        Object.defineProperty(KFByteArray.prototype, "GetBuffAvailable", {
            get: function () {
                return this.write_position - this._position;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(KFByteArray.prototype, "buffer", {
            get: function () {
                return this.data.buffer.slice(0, this.write_position);
            },
            set: function (value) {
                let wpos = value.byteLength;
                let uint8 = new Uint8Array(value);
                let bufferExtSize = this.bufferExtSize;
                let bytes;
                if (bufferExtSize === 0) {
                    bytes = new Uint8Array(wpos);
                }
                else {
                    let multi = (wpos / bufferExtSize | 0) + 1;
                    bytes = new Uint8Array(multi * bufferExtSize);
                }
                bytes.set(uint8);
                this.write_position = wpos;
                this._bytes = bytes;
                this.data = new DataView(bytes.buffer);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(KFByteArray.prototype, "rawBuffer", {
            get: function () {
                return this.data.buffer;
            },
            enumerable: true,
            configurable: true
        });
        KFByteArray.prototype.GetBuff = function () {
            return this._bytes;
        };
        Object.defineProperty(KFByteArray.prototype, "dataView", {
            get: function () {
                return this.data;
            },
            set: function (value) {
                this.buffer = value.buffer;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(KFByteArray.prototype, "bufferOffset", {
            get: function () {
                return this.data.byteOffset;
            },
            enumerable: true,
            configurable: true
        });
        KFByteArray.prototype.GetPosition = function () {
            return this._position;
        };
        KFByteArray.prototype.SetPosition = function (value) {
            this._position = value;
            if (value > this.write_position) {
                this.write_position = value;
            }
        };
        KFByteArray.prototype.Skip = function (count) {
            let nextpos = this._position + count;
            if (nextpos < this.write_position) {
                this._position = nextpos;
            }
        };
        Object.defineProperty(KFByteArray.prototype, "length", {
            get: function () {
                return this.write_position;
            },
            set: function (value) {
                this.write_position = value;
                if (this.data.byteLength > value) {
                    this._position = value;
                }
                this._validateBuffer(value);
            },
            enumerable: true,
            configurable: true
        });
        KFByteArray.prototype.GetByteSize = function () { return this.write_position; };
        KFByteArray.prototype._validateBuffer = function (value) {
            if (this.data.byteLength < value) {
                let be = this.bufferExtSize;
                let tmp;
                if (be === 0) {
                    tmp = new Uint8Array(value);
                }
                else {
                    let nLen = ((value / be >> 0) + 1) * be;
                    tmp = new Uint8Array(nLen);
                }
                tmp.set(this._bytes);
                this._bytes = tmp;
                this.data = new DataView(tmp.buffer);
            }
        };
        Object.defineProperty(KFByteArray.prototype, "bytesAvailable", {
            get: function () {
                return this.data.byteLength - this._position;
            },
            enumerable: true,
            configurable: true
        });
        KFByteArray.prototype.clear = function () {
            let buffer = new ArrayBuffer(this.bufferExtSize);
            this.data = new DataView(buffer);
            this._bytes = new Uint8Array(buffer);
            this._position = 0;
            this.write_position = 0;
        };
        KFByteArray.prototype.readBoolean = function () {
            if (this.validate(1 /* SIZE_OF_BOOLEAN */)) {
                let ret = !!this._bytes[this._position];
                this.SetPosition(this._position + 1);
                return ret;
            }
        };
        KFByteArray.prototype.readByte = function () {
            if (this.validate(1 /* SIZE_OF_INT8 */)) {
                let ret = this.data.getInt8(this._position);
                this.SetPosition(this._position + 1);
                return ret;
            }
        };
        KFByteArray.prototype.readBytes = function (bytes, offset, length) {
            if (offset === void 0) { offset = 0; }
            if (length === void 0) { length = 0; }
            if (!bytes) { //由于bytes不返回，所以new新的无意义
                return;
            }
            let pos = this._position;
            let available = this.write_position - pos;
            if (available < 0) {
                ByteError(1025);
                return;
            }
            if (length === 0) {
                length = available;
            }
            else if (length > available) {
                ByteError(1025);
                return;
            }
            let position = bytes._position;
            bytes._position = 0;
            bytes.validateBuffer(offset + length);
            bytes._position = position;
            bytes._bytes.set(this._bytes.subarray(pos, pos + length), offset);
            this.SetPosition(this._position + length);
        };
        KFByteArray.prototype.readDouble = function () {
            if (this.validate(8 /* SIZE_OF_FLOAT64 */)) {
                let value = this.data.getFloat64(this._position, this.$endian === 1 /* LITTLE_ENDIAN */);
                this.SetPosition(this._position + 8 /* SIZE_OF_FLOAT64 */);
                return value;
            }
        };
        KFByteArray.prototype.readFloat = function () {
            if (this.validate(4 /* SIZE_OF_FLOAT32 */)) {
                let value = this.data.getFloat32(this._position, this.$endian === 1 /* LITTLE_ENDIAN */);
                this.SetPosition(this._position + 4 /* SIZE_OF_FLOAT32 */);
                return value;
            }
        };
        KFByteArray.prototype.readvaruint64 = function () {
            const B = 128n;
            let nextval = BigInt(this.readUnsignedByte());
            let varval = nextval & 127n;
            let readtimes = 0n;
            while (nextval >= B && readtimes < 9n) {
                readtimes += 1n;
                nextval = BigInt(this.readUnsignedByte());
                varval = varval | ((nextval & 127n) << (7n * readtimes));
            }
            return varval;
        };
        KFByteArray.prototype.readvarint64 = function () {
            let varval = this.readvaruint64();
            varval = (varval >> 1n) ^ -(varval & 1n);
            return varval;
        }
        KFByteArray.prototype.readvaruint = function () {
            let varval = this.readvaruint64();
            varval = Number(varval & 0xffffffffn);
            return varval;
        };
        KFByteArray.prototype.readstring = function () {
            let len = this.readvaruint();
            return this.readUTFBytes(len);
        };
        KFByteArray.prototype.readkfbytes = function (kfbuff) {
            if (kfbuff === void 0) { kfbuff = null; }
            let bytesize = this.readvaruint();
            if (kfbuff == null)
                kfbuff = new KFByteArray();
            if (bytesize > 0) {
                this.readBytes(kfbuff, 0, bytesize);
            }
            return kfbuff;
        };
        KFByteArray.prototype.skipstring = function () {
            let strlen = this.readvaruint();
            this.Skip(strlen);
        };
        KFByteArray.prototype.readInt = function () {
            if (this.validate(4 /* SIZE_OF_INT32 */)) {
                let value = this.data.getInt32(this._position, this.$endian === 1 /* LITTLE_ENDIAN */);
                this.SetPosition(this._position + 4 /* SIZE_OF_INT32 */);
                return value;
            }
        };
        KFByteArray.prototype.readShort = function () {
            if (this.validate(2 /* SIZE_OF_INT16 */)) {
                let value = this.data.getInt16(this._position, this.$endian === 1 /* LITTLE_ENDIAN */);
                this.SetPosition(this._position + 2 /* SIZE_OF_INT16 */);
                return value;
            }
        };
        KFByteArray.prototype.readInt64 = function () {
            let varval = this.readUInt64();
            if ((varval & (1n << 63n)) !== 0n) {
                varval = varval | ~0xffffffffffffffffn;
            }
            return varval;
        };

        KFByteArray.prototype.readUInt64 = function () {
            const value_length = 8;
            if (this.validate(value_length /* SIZE_OF_UINT64 */)) {
                let value = BigInt(0);
                if (this.$endian === 1 /* LITTLE_ENDIAN */) {
                    for (let n = 0; n < value_length; ++n) {
                        value |= BigInt(this._bytes[this._position + n]) << BigInt(8 * n);
                    }
                } else {
                    for (let n = 0; n < value_length; ++n) {
                        value |= BigInt(this._bytes[this._position + n]) << BigInt(8 * (8 - n - 1));
                    }
                }
                this.SetPosition(this._position + value_length /* SIZE_OF_UINT64 */);
                return value;
            }
        };

        KFByteArray.prototype.readUnsignedByte = function () {
            if (this.validate(1 /* SIZE_OF_UINT8 */)) {
                let ret = this._bytes[this._position];
                this.SetPosition(this._position + 1);
                return ret;
            }
        };
        KFByteArray.prototype.readUnsignedInt = function () {
            if (this.validate(4 /* SIZE_OF_UINT32 */)) {
                let value = this.data.getUint32(this._position, this.$endian === 1 /* LITTLE_ENDIAN */);
                this.SetPosition(this._position + 4 /* SIZE_OF_UINT32 */);
                return value;
            }
        };
        KFByteArray.prototype.readUnsignedShort = function () {
            if (this.validate(2 /* SIZE_OF_UINT16 */)) {
                let value = this.data.getUint16(this._position, this.$endian === 1 /* LITTLE_ENDIAN */);
                this.SetPosition(this._position + 2 /* SIZE_OF_UINT16 */);
                return value;
            }
        };
        KFByteArray.prototype.readUTF = function () {
            let length = this.readUnsignedShort();
            if (length > 0) {
                return this.readUTFBytes(length);
            }
            else {
                return "";
            }
        };
        KFByteArray.prototype.readUTFBytes = function (length) {
            if (!this.validate(length)) {
                return;
            }
            let data = this.data;
            let bytes = new Uint8Array(data.buffer, data.byteOffset + this._position, length);
            this.SetPosition(this._position + length);
            return this.decodeUTF8(bytes);
        };
        KFByteArray.prototype.writeBoolean = function (value) {
            this.validateBuffer(1 /* SIZE_OF_BOOLEAN */);
            this._bytes[this._position] = +value;
            this.SetPosition(this._position + 1);
        };
        KFByteArray.prototype.writeByte = function (value) {
            this.validateBuffer(1 /* SIZE_OF_INT8 */);
            this._bytes[this._position] = value & 0xff;
            this.SetPosition(this._position + 1);
        };
        KFByteArray.prototype.writekfBytes = function (bytes) {
            let len = bytes.length;
            this.writevaruint(len);
            if (len > 0) {
                this.writeBytes(bytes);
            }
        };
        KFByteArray.prototype.writeBytes = function (bytes, offset, length) {
            if (offset === void 0) { offset = 0; }
            if (length === void 0) { length = 0; }
            let writeLength;
            if (offset < 0) {
                return;
            }
            if (length < 0) {
                return;
            }
            else if (length === 0) {
                writeLength = bytes.length - offset;
            }
            else {
                writeLength = Math.min(bytes.length - offset, length);
            }
            if (writeLength > 0) {
                this.validateBuffer(writeLength);
                this._bytes.set(bytes._bytes.subarray(offset, offset + writeLength), this._position);
                this.SetPosition(this._position + writeLength);
            }
        };
        KFByteArray.prototype.writeDouble = function (value) {
            this.validateBuffer(8 /* SIZE_OF_FLOAT64 */);
            this.data.setFloat64(this._position, value, this.$endian === 1 /* LITTLE_ENDIAN */);
            this.SetPosition(this._position + 8 /* SIZE_OF_FLOAT64 */);
        };
        KFByteArray.prototype.writeFloat = function (value) {
            this.validateBuffer(4 /* SIZE_OF_FLOAT32 */);
            this.data.setFloat32(this._position, value, this.$endian === 1 /* LITTLE_ENDIAN */);
            this.SetPosition(this._position + 4 /* SIZE_OF_FLOAT32 */);
        };
        KFByteArray.prototype.writeInt = function (value) {
            this.validateBuffer(4 /* SIZE_OF_INT32 */);
            this.data.setInt32(this._position, value, this.$endian === 1 /* LITTLE_ENDIAN */);
            this.SetPosition(this._position + 4 /* SIZE_OF_INT32 */);
        };

        const bit7 = 1n << 7n;
        const bit14 = 1n << 14n;
        const bit21 = 1n << 21n;
        const bit28 = 1n << 28n;
        const bit35 = 1n << 35n;
        const bit42 = 1n << 42n;
        const bit49 = 1n << 49n;
        const bit56 = 1n << 56n;
        const bit63 = 1n << 63n;

        KFByteArray.prototype.GetVarUIntSize = function (value) {
            value = BigInt(value) & 0xffffffffffffffffn;

            if (value < bit7) return 1;
            else if (value < bit14) return 2;
            else if (value < bit21) return 3;
            else if (value < bit28) return 4;
            else if (value < bit35) return 5;
            else if (value < bit42) return 6;
            else if (value < bit49) return 7;
            else if (value < bit56) return 8;
            else if (value < bit63) return 9;
            else return 10;
        };
        KFByteArray.prototype.writevaruint = function (value) {
            if (BigInt(value) > 0xffffffffffffffffn) {
                ByteException(101, "value is overflow");
            }
            value = BigInt(value) & 0xffffffffffffffffn;

            const B = 128n;
            let n;
            this.validateBuffer(this.GetVarUIntSize(value));
            for (n = 0; value > 127n; ++n)
            {
                this._bytes[this._position + n] = Number(((value & 127n) | B) & 0xffn);
                value = value >> 7n;
            }
            this._bytes[this._position + n] = Number(value & 0xffn);
            ++n;
            this.SetPosition(this._position + n);
        };
        KFByteArray.prototype.writevarint = function (value) {
            if (BigInt(value) <= -0x7fffffffffffffffn) {
                ByteException(101, "value is overflow");
            }
            value = BigInt(value);
            value = (value << 1n) ^ (value >> 63n);
            this.writevaruint(value);
        }
        KFByteArray.prototype.writeInt64 = function (value) {
            if (BigInt(value) <= -0x7fffffffffffffffn) {
                ByteException(101, "value is overflow");
            }
            this.writeUInt64(value);
        };

        KFByteArray.prototype.writeUInt64 = function (value) {
            if (BigInt(value) > 0xffffffffffffffffn) {
                ByteException(101, "value is overflow");
            }
            value = BigInt(value) & 0xffffffffffffffffn;
            const value_length = 8;
            this.validateBuffer(value_length /* SIZE_OF_UINT84 */);
            if (this.$endian === 1 /* LITTLE_ENDIAN */) {
                for (let n = 0; n < value_length; ++n) {
                    this._bytes[this._position + n] = Number((value >> BigInt(8 * n)) & 0xffn);
                }
            } else {
                for (let n = 0; n < value_length; ++n) {
                    this._bytes[this._position + n] = Number((value >> BigInt(56 - 8 * n)) & 0xffn);
                }
            }
            this.SetPosition(this._position + value_length /* SIZE_OF_UINT64 */);
        };

        KFByteArray.prototype.writeShort = function (value) {
            this.validateBuffer(2 /* SIZE_OF_INT16 */);
            this.data.setInt16(this._position, value, this.$endian === 1 /* LITTLE_ENDIAN */);
            this.SetPosition(this._position + 2 /* SIZE_OF_INT16 */);
        };
        KFByteArray.prototype.writeUnsignedInt = function (value) {
            this.validateBuffer(4 /* SIZE_OF_UINT32 */);
            this.data.setUint32(this._position, value, this.$endian === 1 /* LITTLE_ENDIAN */);
            this.SetPosition(this._position + 4 /* SIZE_OF_UINT32 */);
        };
        KFByteArray.prototype.writeUnsignedShort = function (value) {
            this.validateBuffer(2 /* SIZE_OF_UINT16 */);
            this.data.setUint16(this._position, value, this.$endian === 1 /* LITTLE_ENDIAN */);
            this.SetPosition(this._position + 2 /* SIZE_OF_UINT16 */);
        };
        KFByteArray.prototype.writeUTF = function (value) {
            let utf8bytes = this.encodeUTF8(value);
            let length = utf8bytes.length;
            this.validateBuffer(2 /* SIZE_OF_UINT16 */ + length);
            this.data.setUint16(this._position, length, this.$endian === 1 /* LITTLE_ENDIAN */);
            this.SetPosition(this._position + 2 /* SIZE_OF_UINT16 */);
            this._writeUint8Array(utf8bytes, false);
        };
        ///返回写入的长度
        KFByteArray.prototype.writeUTFBytes = function (value) {
            let strbuff = this.encodeUTF8(value);
            let strlen = strbuff.length;
            this._writeUint8Array(strbuff);
            return strlen;
        };
        KFByteArray.prototype.writestring = function (value) {
            let strbuff = this.encodeUTF8(value);
            this.writevaruint(strbuff.length);
            this._writeUint8Array(strbuff);
        };
        KFByteArray.prototype.toString = function () {
            return "[ByteArray] length:" + this.length + ", bytesAvailable:" + this.bytesAvailable;
        };
        KFByteArray.prototype._writeUint8Array = function (bytes, validateBuffer) {
            if (validateBuffer === void 0) { validateBuffer = true; }
            let pos = this._position;
            let npos = pos + bytes.length;
            if (validateBuffer) {
                this.validateBuffer(npos);
            }
            this._bytes.set(bytes, pos);
            this.SetPosition(npos);
        };
        KFByteArray.prototype.validate = function (len) {
            let bl = this._bytes.length;
            if (bl > 0 && this._position + len <= bl) {
                return true;
            }
            else {
                ByteError(1025);
            }
        };
        KFByteArray.prototype.validateBuffer = function (len) {
            this.write_position = len > this.write_position ? len : this.write_position;
            len += this._position;
            this._validateBuffer(len);
        };

        KFByteArray.prototype.encodeUTF8 = function (str) {
            let pos = 0;
            let codePoints = this.stringToCodePoints(str);
            let outputBytes = [];
            while (codePoints.length > pos) {
                let code_point = codePoints[pos++];
                if (this.inRange(code_point, 0xD800, 0xDFFF)) {
                    this.encoderError(code_point);
                }
                else if (this.inRange(code_point, 0x0000, 0x007f)) {
                    outputBytes.push(code_point);
                }
                else {
                    let count = void 0, offset = void 0;
                    if (this.inRange(code_point, 0x0080, 0x07FF)) {
                        count = 1;
                        offset = 0xC0;
                    }
                    else if (this.inRange(code_point, 0x0800, 0xFFFF)) {
                        count = 2;
                        offset = 0xE0;
                    }
                    else if (this.inRange(code_point, 0x10000, 0x10FFFF)) {
                        count = 3;
                        offset = 0xF0;
                    }
                    outputBytes.push(this.div(code_point, Math.pow(64, count)) + offset);
                    while (count > 0) {
                        let temp = this.div(code_point, Math.pow(64, count - 1));
                        outputBytes.push(0x80 + (temp % 64));
                        count -= 1;
                    }
                }
            }
            return new Uint8Array(outputBytes);
        };
        KFByteArray.prototype.decodeUTF8 = function (data) {
            let fatal = false;
            let pos = 0;
            let result = "";
            let code_point;
            let utf8_code_point = 0;
            let utf8_bytes_needed = 0;
            let utf8_bytes_seen = 0;
            let utf8_lower_boundary = 0;
            while (data.length > pos) {
                let _byte = data[pos++];
                if (_byte === this.EOF_byte) {
                    if (utf8_bytes_needed !== 0) {
                        code_point = this.decoderError(fatal);
                    }
                    else {
                        code_point = this.EOF_code_point;
                    }
                }
                else {
                    if (utf8_bytes_needed === 0) {
                        if (this.inRange(_byte, 0x00, 0x7F)) {
                            code_point = _byte;
                        }
                        else {
                            if (this.inRange(_byte, 0xC2, 0xDF)) {
                                utf8_bytes_needed = 1;
                                utf8_lower_boundary = 0x80;
                                utf8_code_point = _byte - 0xC0;
                            }
                            else if (this.inRange(_byte, 0xE0, 0xEF)) {
                                utf8_bytes_needed = 2;
                                utf8_lower_boundary = 0x800;
                                utf8_code_point = _byte - 0xE0;
                            }
                            else if (this.inRange(_byte, 0xF0, 0xF4)) {
                                utf8_bytes_needed = 3;
                                utf8_lower_boundary = 0x10000;
                                utf8_code_point = _byte - 0xF0;
                            }
                            else {
                                this.decoderError(fatal);
                            }
                            utf8_code_point = utf8_code_point * Math.pow(64, utf8_bytes_needed);
                            code_point = null;
                        }
                    }
                    else if (!this.inRange(_byte, 0x80, 0xBF)) {
                        utf8_code_point = 0;
                        utf8_bytes_needed = 0;
                        utf8_bytes_seen = 0;
                        utf8_lower_boundary = 0;
                        pos--;
                        code_point = this.decoderError(fatal, _byte);
                    }
                    else {
                        utf8_bytes_seen += 1;
                        utf8_code_point = utf8_code_point + (_byte - 0x80) * Math.pow(64, utf8_bytes_needed - utf8_bytes_seen);
                        if (utf8_bytes_seen !== utf8_bytes_needed) {
                            code_point = null;
                        }
                        else {
                            let cp = utf8_code_point;
                            let lower_boundary = utf8_lower_boundary;
                            utf8_code_point = 0;
                            utf8_bytes_needed = 0;
                            utf8_bytes_seen = 0;
                            utf8_lower_boundary = 0;
                            if (this.inRange(cp, lower_boundary, 0x10FFFF) && !this.inRange(cp, 0xD800, 0xDFFF)) {
                                code_point = cp;
                            }
                            else {
                                code_point = this.decoderError(fatal, _byte);
                            }
                        }
                    }
                }
                //Decode string
                if (code_point !== null && code_point !== this.EOF_code_point) {
                    if (code_point <= 0xFFFF) {
                        if (code_point > 0)
                            result += String.fromCharCode(code_point);
                    }
                    else {
                        code_point -= 0x10000;
                        result += String.fromCharCode(0xD800 + ((code_point >> 10) & 0x3ff));
                        result += String.fromCharCode(0xDC00 + (code_point & 0x3ff));
                    }
                }
            }
            return result;
        };
        KFByteArray.prototype.encoderError = function (code_point) {
            ByteError(1026, code_point);
        };
        KFByteArray.prototype.decoderError = function (fatal, opt_code_point) {
            if (fatal) {
                ByteError(1027);
            }
            return opt_code_point || 0xFFFD;
        };
        KFByteArray.prototype.inRange = function (a, min, max) {
            return min <= a && a <= max;
        };
        KFByteArray.prototype.div = function (n, d) {
            return Math.floor(n / d);
        };
        KFByteArray.prototype.stringToCodePoints = function (string) {
            /** @type {Array.<number>} */
            let cps = [];
            // Based on http://www.w3.org/TR/WebIDL/#idl-DOMString
            let i = 0, n = string.length;
            while (i < string.length) {
                let c = string.charCodeAt(i);
                if (!this.inRange(c, 0xD800, 0xDFFF)) {
                    cps.push(c);
                }
                else if (this.inRange(c, 0xDC00, 0xDFFF)) {
                    cps.push(0xFFFD);
                }
                else { // (inRange(c, 0xD800, 0xDBFF))
                    if (i === n - 1) {
                        cps.push(0xFFFD);
                    }
                    else {
                        let d = string.charCodeAt(i + 1);
                        if (this.inRange(d, 0xDC00, 0xDFFF)) {
                            let a = c & 0x3FF;
                            let b = d & 0x3FF;
                            i += 1;
                            cps.push(0x10000 + (a << 10) + b);
                        }
                        else {
                            cps.push(0xFFFD);
                        }
                    }
                }
                i += 1;
            }
            return cps;
        };
        return KFByteArray;
    }());
    exports.KFByteArray = KFByteArray;
});