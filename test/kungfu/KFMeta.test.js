require("../../libs/amd-loader");
const assert = require("assert");
const {IKFMeta, AMeta, KFMetaManager} = require("../../libs/kf/Core/Meta/KFMetaManager");
const {KFDName} = require("../../libs/kf/KFData/Format/KFDName");

function TestObject() {
}

TestObject.Meta = new IKFMeta("TestObject", function () {
    return new TestObject();
});

describe('KFMeta', function(){
    it('CheckMeta', function() {
        assert.ok(TestObject.Meta instanceof AMeta);
        assert.strictEqual(TestObject.Meta.name.toString(), "TestObject");
        assert.strictEqual(TestObject.Meta.execSide, 3);
    });
    it('CheckGetMetaType', function() {
        let meta = KFMetaManager.GetMetaType(TestObject.Meta.type);
        assert.ok(meta);
        assert.strictEqual(meta, TestObject.Meta);
    });
    it('CheckGetMetaName', function() {
        let meta = KFMetaManager.GetMetaName(TestObject.Meta.name);
        assert.ok(meta);
        assert.strictEqual(meta, TestObject.Meta);
    });
    it('CheckInstantiate', function() {
        let test_object = TestObject.Meta.instantiate();
        assert.ok(test_object instanceof TestObject);
    });
});