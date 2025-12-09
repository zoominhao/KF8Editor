define(["require", "exports"],function(require, exports) {

    let AnimationCC = {};

    AnimationCC.PI_2 = Math.PI * 2;
    AnimationCC.decMatrix3d = function(mt3d){

        let transform = {};

        transform.skew = {};
        transform.position = {z:0};
        transform.scale = {z:1};
        transform.rotation = 0;

        // sort out rotation / skew..
        const a = mt3d.m00;
        const b = mt3d.m01;
        const c = mt3d.m10;
        const d = mt3d.m11;

        const skewX = -Math.atan2(-c, d);
        const skewY = Math.atan2(b, a);

        const delta = Math.abs(skewX + skewY);

        if (delta < 0.00001 || Math.abs(this.PI_2 - delta) < 0.00001)
        {
            transform.rotation= skewY;
            transform.skew.x = transform.skew.y = 0;
        }
        else
        {
            transform.skew.x = skewX;
            transform.skew.y = skewY;
        }

        // next set scale
        transform.scale.x = Math.sqrt((a * a) + (b * b));
        transform.scale.y = Math.sqrt((c * c) + (d * d));

        // next set position
        transform.position.x = mt3d.m30;
        transform.position.y = mt3d.m31;

        return transform;

    };


    // point • matrix
    AnimationCC.multiplyMatrixAndPoint= function(matrix, point) {
        // Give a simple variable name to each part of the matrix, a column and row number
        let c0r0 = matrix[ 0], c1r0 = matrix[ 1], c2r0 = matrix[ 2], c3r0 = matrix[ 3];
        let c0r1 = matrix[ 4], c1r1 = matrix[ 5], c2r1 = matrix[ 6], c3r1 = matrix[ 7];
        let c0r2 = matrix[ 8], c1r2 = matrix[ 9], c2r2 = matrix[10], c3r2 = matrix[11];
        let c0r3 = matrix[12], c1r3 = matrix[13], c2r3 = matrix[14], c3r3 = matrix[15];

        // Now set some simple names for the point
        let x = point[0];
        let y = point[1];
        let z = point[2];
        let w = point[3];

        // Multiply the point against each part of the 1st column, then add together
        let resultX = (x * c0r0) + (y * c0r1) + (z * c0r2) + (w * c0r3);

        // Multiply the point against each part of the 2nd column, then add together
        let resultY = (x * c1r0) + (y * c1r1) + (z * c1r2) + (w * c1r3);

        // Multiply the point against each part of the 3rd column, then add together
        let resultZ = (x * c2r0) + (y * c2r1) + (z * c2r2) + (w * c2r3);

        // Multiply the point against each part of the 4th column, then add together
        let resultW = (x * c3r0) + (y * c3r1) + (z * c3r2) + (w * c3r3);

        return [resultX, resultY, resultZ, resultW];
    };


    //matrixB • matrixA
    AnimationCC.multiplyMatrices = function(matrixA, matrixB) {
        // Slice the second matrix up into rows
        let row0 = [matrixB[ 0], matrixB[ 1], matrixB[ 2], matrixB[ 3]];
        let row1 = [matrixB[ 4], matrixB[ 5], matrixB[ 6], matrixB[ 7]];
        let row2 = [matrixB[ 8], matrixB[ 9], matrixB[10], matrixB[11]];
        let row3 = [matrixB[12], matrixB[13], matrixB[14], matrixB[15]];

        // Multiply each row by matrixA
        let result0 = this.multiplyMatrixAndPoint(matrixA, row0);
        let result1 = this.multiplyMatrixAndPoint(matrixA, row1);
        let result2 = this.multiplyMatrixAndPoint(matrixA, row2);
        let result3 = this.multiplyMatrixAndPoint(matrixA, row3);

        // Turn the result rows back into a single matrix
        return [
            result0[0], result0[1], result0[2], result0[3],
            result1[0], result1[1], result1[2], result1[3],
            result2[0], result2[1], result2[2], result2[3],
            result3[0], result3[1], result3[2], result3[3]
        ];
    };

    AnimationCC.multiplymt3d = function(mta, mtb) {

        let numarr = this.multiplyMatrices([ mta.m00,mta.m10,mta.m20,mta.m30,
                                        mta.m01,mta.m11,mta.m21,mta.m31,
                                        mta.m02,mta.m12,mta.m22,mta.m32,
                                        mta.m03,mta.m13,mta.m23,mta.m33]
            ,[  mtb.m00,mtb.m10,mtb.m20,mtb.m30,
                        mtb.m01,mtb.m11,mtb.m21,mtb.m31,
                        mtb.m02,mtb.m12,mtb.m22,mtb.m32,
                        mtb.m03,mtb.m13,mtb.m23,mtb.m33]);

        let names = [   'm00','m10','m20','m30',
                        'm01','m11','m21','m31',
                        'm02','m12','m22','m32',
                        'm03','m13','m23','m33'];
        let newmt = {};
        for(let i = 0;i < names.length; i ++){
            newmt[names[i]] = numarr[i];
        }
        return newmt;
    };


    exports.AnimationCC = AnimationCC;

});