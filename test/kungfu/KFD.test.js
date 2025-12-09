require("../../libs/amd-loader");
const assert = require("assert");
const KFD = require("../../libs/kf/KFData/Format/KFD");

describe('KFD', function(){
    it('Is_Integer', function(){
        assert.ok(KFD.KFDataType.Is_Integer(KFD.KFDataType.OT_INT32));
    });

    it('Is_Float', function(){
        assert.ok(KFD.KFDataType.Is_Float(KFD.KFDataType.OT_FLOAT));
        assert.ok(KFD.KFDataType.Is_Float(KFD.KFDataType.OT_DOUBLE));
    });

    it('Is_Number', function(){
        assert.ok(KFD.KFDataType.Is_Number(KFD.KFDataType.OT_VARUINT));
        assert.ok(KFD.KFDataType.Is_Number(KFD.KFDataType.OT_DOUBLE));
    });

    it('GetTypeId', function(){
        assert.strictEqual(KFD.KFDataType.GetTypeID("float"), KFD.KFDataType.OT_FLOAT);
        assert.strictEqual(KFD.KFDataType.GetTypeID("varuint"), KFD.KFDataType.OT_VARUINT);
        assert.strictEqual(KFD.KFDataType.GetTypeID("VarUint"), KFD.KFDataType.OT_UNKNOW);
    });

    it('Is_BaseTypeStr', function(){
        assert.ok(KFD.KFDataType.Is_BaseTypeStr("varuint"));
        assert.ok(KFD.KFDataType.Is_BaseTypeStr("float"));
        assert.ok(KFD.KFDataType.Is_BaseTypeStr("kfBytes"));
    });
});
