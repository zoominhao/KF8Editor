require("../../libs/amd-loader");
const assert = require("assert");
const {KFMath} = require("../../libs/kf/Core/Math/KFMath");

describe('KFMath', function(){
    it('CheckV3New', function(){
        let v3_1 = KFMath.v3New();
        assert.strictEqual(v3_1.__cls__, "kfVector3");
        assert.ok(Math.abs(v3_1.x) < 0.0001);
        assert.ok(Math.abs(v3_1.y) < 0.0001);
        assert.ok(Math.abs(v3_1.z) < 0.0001);

        let v3_2 = KFMath.v3New(1.0, 2.0, 3.0);
        assert.strictEqual(v3_2.__cls__, "kfVector3");
        assert.ok(Math.abs(v3_2.x - 1.0) < 0.0001);
        assert.ok(Math.abs(v3_2.y - 2.0) < 0.0001);
        assert.ok(Math.abs(v3_2.z - 3.0) < 0.0001);
    });
    it('CheckV3Set', function(){
        let v3 = KFMath.v3New();
        KFMath.v3Setxyz(v3, 1.0, 2.0, 3.0);
        assert.ok(Math.abs(KFMath.v3Val("x", v3) - 1.0) < 0.0001);
        assert.ok(Math.abs(KFMath.v3Val("y", v3) - 2.0) < 0.0001);
        assert.ok(Math.abs(KFMath.v3Val("z", v3) - 3.0) < 0.0001);

        KFMath.v3Set("x", v3, 4.0);
        KFMath.v3Set("y", v3, 5.0);
        KFMath.v3Set("z", v3, 6.0);
        assert.ok(Math.abs(KFMath.v3Val("x", v3) - 4.0) < 0.0001);
        assert.ok(Math.abs(KFMath.v3Val("y", v3) - 5.0) < 0.0001);
        assert.ok(Math.abs(KFMath.v3Val("z", v3) - 6.0) < 0.0001);
    });
});