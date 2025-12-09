require("../../libs/amd-loader");
const assert = require("assert");
const {KFDNameStrings, KFDName} = require("../../libs/kf/KFData/Format/KFDName");

describe('KFDName', function() {
    describe('#KFDNameStrings', function() {
        it('CheckNone', function() {
            let name_strings = new KFDNameStrings();
            assert.strictEqual(name_strings.GetNameID(""), 0);
        });
        it('CheckNameID', function() {
            let name_strings = new KFDNameStrings();
            let name = "xxxxxx";
            assert.strictEqual(name_strings.GetNameID(name), 1);
        });
        it('CheckNameString', function() {
            let name_strings = new KFDNameStrings();
            let name = "xxxxxx";
            let name_id = name_strings.GetNameID(name);
            assert.strictEqual(name_strings.GetNameStr(name_id), name);
        });
    });

    describe('#KFDName', function() {
        it('CheckNone', function() {
            let none_name = new KFDName("");
            assert.strictEqual(none_name.toString(), "");
        });
        it('CheckNameId', function() {
            let name = "yyyyyyyyyyyyyy";
            let kfname = new KFDName(name);
            assert.strictEqual(kfname.value, KFDName.Val(name));
        });
        it('CheckNameString', function() {
            let name = "yyyyyyyyyyyyyy";
            let kfname = new KFDName(name);
            assert.strictEqual(kfname.toString(), name);
        });
    });
});