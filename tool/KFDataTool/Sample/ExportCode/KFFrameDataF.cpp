#include "KFFrameDataF.h"

namespace KF
{
     KFFrameData* KFFrameDataF::Read(KFByteArray& buffarr,KFFrameData* obj)
     {
        if(obj == NULL)
        {
            obj = new KFFrameData();
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
                int32Read(buffarr,obj->index);
              }
              else
              {
                 buffarr.Skip(-1);
                 KFDataFormat::SkipValue(buffarr);
              }
                    break;
                case 2:

               if(buffarr.ReadUByte() == 12) 
              {
                //buffarr.Skip(1);/// type is base value
                boolRead(buffarr,obj->once);
              }
              else
              {
                 buffarr.Skip(-1);
                 KFDataFormat::SkipValue(buffarr);
              }
                    break;
                case 3:

               if(buffarr.ReadUByte() == 5) 
              {
                //buffarr.Skip(1);/// type is base value
                int32Read(buffarr,obj->startPC);
              }
              else
              {
                 buffarr.Skip(-1);
                 KFDataFormat::SkipValue(buffarr);
              }
                    break;
                case 4:

               if(buffarr.ReadUByte() == 5) 
              {
                //buffarr.Skip(1);/// type is base value
                int32Read(buffarr,obj->varsize);
              }
              else
              {
                 buffarr.Skip(-1);
                 KFDataFormat::SkipValue(buffarr);
              }
                    break;
                case 5:

               if(buffarr.ReadUByte() == 5) 
              {
                //buffarr.Skip(1);/// type is base value
                int32Read(buffarr,obj->paramsize);
              }
              else
              {
                 buffarr.Skip(-1);
                 KFDataFormat::SkipValue(buffarr);
              }
                    break;
                case 6:

                {
                    //buffarr.Skip(1); /// type is mixarray<KFScriptData>
                    uint8 valueType = buffarr.ReadUByte();
                    if(valueType == OT_MIXARRAY)
                    {
                        uint32 arrsize = buffarr.ReadVarUInt();

                        obj->ClearOne();

                        for(uint32 i = 0 ;i < arrsize; i ++)
                        {
                           KFScriptData* itm = KFScriptDataF::ReadKFScriptData(buffarr);
                           obj->scripts.push_back(itm);
                        }
                    }
                    else if(valueType == OT_OBJECT)
                    {
                        ///a virtual object
                       auto& arrval = obj->scripts;
                       auto arrsize = arrval.size();
                       auto arrindex = buffarr.ReadVarUInt(); /// OBJ_PROP_ID_BEGIN

                       while(arrindex != OBJ_PROP_ID_END)
                       {
                            if(arrindex != OBJ_PROP_ID_BEGIN)
                            {
                                arrindex = arrindex - (arrindex > OBJ_PROP_ID_BEGIN ? 2 : 1);

                                if(arrindex < arrsize)
                                {
                                    auto itm = obj->scripts[arrindex];

                                    KFScriptData* newitm = KFScriptDataF::ReadKFScriptData(buffarr,itm);
                                    if(newitm != itm)
                                    {
                                        /// clear old value
                                        obj->ClearOne(itm);
                                        /// set new value index
                                        itm = newitm;
                                        obj->scripts[arrindex] = itm;
                                    }


                                }
                                else
                                {
                                    KFScriptData* itm = KFScriptDataF::ReadKFScriptData(buffarr);
                                    obj->scripts.push_back(itm);
                                }
                            }
                            arrindex = buffarr.ReadVarUInt();
                       }
                    }
                    else
                    {
                        buffarr.Skip(-1);
                        KFDataFormat::SkipValue(buffarr);
                    }
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

     void KFFrameDataF::Write(KFByteArray& buffarr,KFFrameData* obj)
     {
        if(obj == NULL) return;
        buffarr.WriteVarUInt(OBJ_PROP_ID_BEGIN);


        buffarr.WriteVarUInt(1);///property id
        int32WriteVal(buffarr,obj->index);

        buffarr.WriteVarUInt(2);///property id
        boolWriteVal(buffarr,obj->once);

        buffarr.WriteVarUInt(3);///property id
        int32WriteVal(buffarr,obj->startPC);

        buffarr.WriteVarUInt(4);///property id
        int32WriteVal(buffarr,obj->varsize);

        buffarr.WriteVarUInt(5);///property id
        int32WriteVal(buffarr,obj->paramsize);

        buffarr.WriteVarUInt(6);///property id
        {
            buffarr.WriteByte(17);///write mixarr type
            auto& arritms = obj->scripts;
            uint32 arrsize = kf_2_uint32(arritms.size());
            buffarr.WriteVarUInt(arrsize);
            for(uint32 i = 0 ;i < arrsize; i ++)
            {
                KFScriptDataF::WriteKFScriptData(buffarr,arritms[i]);
            }
        }


        buffarr.WriteVarUInt(OBJ_PROP_ID_END);
     }


        KFFrameData* KFFrameDataF::ReadKFFrameData(KFByteArray& buffarr,KFFrameData* obj /*= nullptr*/)
        {
            uint8 valueType = buffarr.ReadUByte(); /// type is object
            if(valueType == OT_NULL)
            {
                return nullptr;
            }
            else if(valueType == OT_OBJECT)
            {
                return KFFrameDataF::Read(buffarr,obj);
            }
            else if(valueType == OT_MIXOBJECT)
            {
                uint32 clsid = buffarr.ReadVarUInt();///clsid
                return KFFrameDataF::Read(buffarr,obj);
            }
            else
            {
                buffarr.Skip(-1);
                KFDataFormat::SkipValue(buffarr);
            }

            return nullptr;
        }

        void KFFrameDataF::WriteKFFrameData(KFByteArray& buffarr,KFFrameData* obj)
        {
           if(obj == NULL)
            {
                buffarr.WriteByte(OT_NULL);
                return;
            }

            buffarr.WriteByte(OT_MIXOBJECT);///objecttype
            buffarr.WriteVarUInt(1000);
            KFFrameDataF::Write(buffarr,obj);
        }

}
