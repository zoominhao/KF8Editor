#pragma once

#include "Script/Data/KFScriptData.h"
#include "Script/Impl/KFScriptMacro.h"

///KFD(C,CLASS=FVector)
///KFD(P=1,NAME=X,TYPE=num1,NUMRANGE=0-0|1)
///KFD(P=2,NAME=Y,TYPE=num1,NUMRANGE=0-0|1)
///KFD(P=3,NAME=Z,TYPE=num1,NUMRANGE=0-0|1)
///KFD(*)

///KFD(C,CNAME=测试对象A)
class KFTestObjectA : public KFGCObject
{
public:
    ///KFD(P=1,CNAME=缩放,DEFAULT=X:0|Y:0|Z:1)
    FVector scale = FVector::OneVector;
    ///KFD(P=2,CNAME=数值1)
    float value1 = 1.f;

    ///KFD(M,NAME=AddToValue1,RETURN=float,PARAMS=float|float)
    float AddToValue1(float a, float b) const { 
        value1 += a;
        value1 += b;
        return value1; 
    }

    ///KFD(M)
    float AutoParseMethod(float a, float b) const; 

    ///KFD(*)
};

///KFD(C,CNAME=测试对象B)
class KFTestObjectB
{
public:
    ///KFD(P=1,NAME=objectA,CNAME=objectA,TYPE=mixobject,REFPTR=GetPtr,REFONE=_MoreThenOne,OTYPE=KFTestObjectA)
    kfRef<KFTestObjectA> objectA;
    ///KFD(P=2)
    kfRef<KFTestObjectA> objectB;
    ///KFD(P=3,NAME=objectA_array,CNAME=objectA_array,TYPE=mixarr,REFPTR=GetPtr,REFONE=_MoreThenOne,OTYPE=KFTestObjectA)
    kfVector<kfRef<KFTestObjectA>> objectA_array;
    ///KFD(P=4)
    kfVector<kfRef<KFTestObjectA>> objectB_array;
    ///KFD(P=5,NAME=objectA_map,CNAME=objectA_map,TYPE=mixmap,REFPTR=GetPtr,REFONE=_MoreThenOne,OTYPE=uint32|KFTestObjectA)
    kfMap<uint32, kfRef<KFTestObjectA>> objectA_map;
    ///KFD(P=6)
    kfMap<uint32, kfRef<KFTestObjectA>> objectB_map;

    ///KFD(*)
};
