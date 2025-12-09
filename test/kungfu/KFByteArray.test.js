require("../../libs/amd-loader");
const assert = require("assert");
const {Endian, KFByteArray} = require("../../libs/kf/KFData/Utils/FKByteArray");

describe('KFByteArray', function(){
    describe('#Endian', function(){
        it('CheckEndianString', function(){
            assert.strictEqual(Endian.LITTLE_ENDIAN, 'littleEndian');
            assert.strictEqual(Endian.BIG_ENDIAN, 'bigEndian');
        });
        it('CheckEndian', function(){
            let buffer = new KFByteArray(null, 0);
            assert.strictEqual(buffer.endian, Endian.BIG_ENDIAN);
            buffer.endian = Endian.LITTLE_ENDIAN;
            assert.strictEqual(buffer.endian, Endian.LITTLE_ENDIAN);
        });
    });

    describe('#KFByteArray', function(){
        it('CheckUInt64', function () {
            let buffer = new KFByteArray(null, 0);
            let value_w = 0x1234567890123456n;
            buffer.writeUInt64(value_w);
            assert.strictEqual(buffer.length, 8);
            buffer.SetPosition(0);
            let value_r = buffer.readUInt64();
            assert.strictEqual(value_r, value_w);
        });

        it('CheckInt64', function () {
            let buffer = new KFByteArray(null, 0);
            let value_w = -0x123456789012345n;
            buffer.writeInt64(value_w);
            assert.strictEqual(buffer.length, 8);
            buffer.SetPosition(0);
            let value_r = buffer.readInt64();
            assert.strictEqual(value_r, value_w);
        });

        it('CheckVarint', function () {
            let buffer = new KFByteArray(null, 0);
            let value_w = -0x123456789012345n;
            buffer.writevarint(value_w);
            buffer.SetPosition(0);
            let value_r = buffer.readvarint64();
            assert.strictEqual(value_r, value_w);
        });

        it('CheckVaruint', function () {
            let buffer = new KFByteArray(null, 0);
            let value_w = 0x123456789012345n;
            buffer.writevaruint(value_w);
            buffer.SetPosition(0);
            let value_r = buffer.readvaruint64();
            assert.strictEqual(value_r, value_w);
        });
    });
});