#include "BaseAF.h"
#include "BaseATypeDef.h"

namespace KF
{
     BaseA* BaseAF::Read(KFByteArray& buffarr,BaseA* obj)
     {
        if(obj == NULL)
        {
            obj = new BaseA();
        }

        int32 cpos = buffarr.GetPosition();
        uint32 id = buffarr.ReadVarUInt();
        ///Deal with problems if there is no inheritance before
        if(id != OBJ_PROP_ID_BEGIN)
        {
            buffarr.SetPosition(cpos);
            return obj;
        }


        cpos = buffarr.GetPosition();
        id = buffarr.ReadVarUInt();

        while(id != OBJ_PROP_ID_END)
        {
            switch(id)
            {

                case 1:

               if(buffarr.ReadUByte() == 5) 
              {
                //buffarr.Skip(1);/// type is base value
                int32Read(buffarr,obj->id);
              }
              else
              {
                 buffarr.Skip(-1);
                 KFDataFormat::SkipValue(buffarr);
              }
                    break;
                case 2:

               if(buffarr.ReadUByte() == 9) 
              {
                //buffarr.Skip(1);/// type is base value
                kfstrRead(buffarr,obj->name);
              }
              else
              {
                 buffarr.Skip(-1);
                 KFDataFormat::SkipValue(buffarr);
              }
                    break;
                case OBJ_PROP_ID_END:
                    break;
                case OBJ_PROP_ID_BEGIN:
                    ///Processing if there is a class inheritance before
                    ///Inheritance has disappeared
                    buffarr.Skip(-1);
                    KFDataFormat::SkipObject(buffarr);
                    break;
                default:
                    KFDataFormat::SkipValue(buffarr);
                    break;
            }

            id = buffarr.ReadVarUInt();
        }

        return obj;
     }

     void BaseAF::Write(KFByteArray& buffarr,BaseA* obj)
     {
        if(obj == NULL) return;
        buffarr.WriteVarUInt(OBJ_PROP_ID_BEGIN);


        buffarr.WriteVarUInt(1);///property id
        int32WriteVal(buffarr,obj->id);

        buffarr.WriteVarUInt(2);///property id
        kfstrWriteVal(buffarr,obj->name);


        buffarr.WriteVarUInt(OBJ_PROP_ID_END);
     }

        BaseA* BaseAF::ReadBaseA(KFByteArray& buffarr,BaseA* obj /*= nullptr*/)
        {
            return BaseATypeDef::Read(buffarr,obj);
        }

        void BaseAF::WriteBaseA(KFByteArray& buffarr,BaseA* obj)
        {
            BaseATypeDef::Write(buffarr,obj);
        }


}
