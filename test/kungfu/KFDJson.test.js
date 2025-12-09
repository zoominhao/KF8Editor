require("../../libs/amd-loader");
const assert = require("assert");
const {KFByteArray} = require("../../libs/kf/KFData/Utils/FKByteArray");
const {KFDJson} = require("../../libs/kf/KFData/Format/KFDJson");
const {KFDataType} = require("../../libs/kf/KFData/Format/KFD");
const {KFDTable} = require("../../libs/kf/KFData/Format/KFDTable");

describe('KFDJson', function(){
    it('CheckNullObject', function(){
        let bytearray = new KFByteArray();
        KFDJson.write_value(bytearray, null);
        bytearray.SetPosition(0);
        let robject = KFDJson.read_value(bytearray, false);
        assert.strictEqual(robject, null);
    });

    it('WriteAndReadIntegerField', function(){
        let kfd = {
            "includes":["TestObject.h"],
            "class":"TestObject",
            "propertys":[
                {"id": 1, "default": "false", "name": "v_bool", "type": "bool"},
                {"id": 2, "default": "0", "name": "v_int32", "type": "int32"},
                {"id": 3, "default": "0", "name": "v_uint32", "type": "uint32"},
                {"id": 4, "default": "0", "name": "v_int64", "type": "int64"},
                {"id": 5, "default": "0", "name": "v_uint64", "type": "uint64"},
                {"id": 6, "default": "0", "name": "v_varint", "type": "varint"},
                {"id": 7, "default": "0", "name": "v_varuint", "type": "varuint"},
            ],
            "clsid":1001
        };
        KFDTable.kfdTB.add_kfd(kfd);

        let wobject = {
            "__cls__": "TestObject",
            "v_bool": true,
            "v_int32": -99,
            "v_uint32": 199,
            "v_int64": -99,
            "v_uint64": 199,
            "v_varint": -99,
            "v_varuint": 1999999999,
        };
        let bytearray = new KFByteArray();
        KFDJson.write_value(bytearray, wobject);
        bytearray.SetPosition(0);
        let robject = KFDJson.read_value(bytearray, false);

        KFDTable.kfdTB.delete_kfd(kfd["class"]);

        assert.strictEqual(robject["__cls__"], "TestObject");
        assert.strictEqual(robject["v_bool"], true);
        assert.strictEqual(robject["v_int32"], -99);
        assert.strictEqual(robject["v_uint32"], 199);
        assert.strictEqual(robject["v_int64"], -99);
        assert.strictEqual(robject["v_uint64"], 199);
        assert.strictEqual(robject["v_varint"], -99);
        assert.strictEqual(robject["v_varuint"], 1999999999);
    });

    it('WriteAndReadFloatField', function(){
        let kfd = {
            "includes":["TestObject.h"],
            "class":"TestObject",
            "propertys":[
                {"id": 1, "default": "0.0", "name": "v_float", "type": "float"},
                {"id": 2, "default": "0.0", "name": "v_double", "type": "double"},
            ],
            "clsid":1001
        };
        KFDTable.kfdTB.add_kfd(kfd);

        let wobject = {
            "__cls__": "TestObject",
            "v_float": 99.9,
            "v_double": 99.9,
        };
        let bytearray = new KFByteArray();
        KFDJson.write_value(bytearray, wobject);
        bytearray.SetPosition(0);
        let robject = KFDJson.read_value(bytearray, false);

        KFDTable.kfdTB.delete_kfd(kfd["class"]);

        assert.strictEqual(robject["__cls__"], "TestObject");
        assert.ok(Math.abs(robject["v_float"] - 99.9) < 0.0001);
        assert.ok(Math.abs(robject["v_double"] - 99.9) < 0.0001);
    });
});