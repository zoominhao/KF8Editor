/**************************

此类由KFData自动生成

***********************/

#pragma once


#include "KFData/Format/KFDataFormat.h"
#include "BaseAF.h"
#include "ClsBF.h"

namespace KF
{
    class BaseATypeDef
    {
    public:
     enum BaseATypeEnum
     {
        UNDEFINED = 0,
        KF_ST_ENUM_BaseA = 1004,
        KF_ST_ENUM_ClsB = 1005,
    };

    public:
        static BaseA* Create(uint32 keytype);
        static BaseA* Read(KFByteArray& buffarr);
        static void Write(KFByteArray& buffarr,BaseA* obj);
    };
}
