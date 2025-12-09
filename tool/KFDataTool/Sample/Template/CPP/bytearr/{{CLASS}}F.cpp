
#include "{{data.class}}F.h"
{% if data.typedef == 1 %}
#include "{{data.class}}TypeDef.h"
{%end%}

namespace {{NS}}
{
     {{data.class}}* {{data.class}}F::Read(KFByteArray& buffarr,{{data.class}}* obj)
     {
        if(obj == NULL)
        {
            obj = new {{data.class}}();
        }

        int32 cpos = buffarr.GetPosition();
        uint32 id = buffarr.ReadVarUInt();
        ///Deal with problems if there is no inheritance before
        if(id != OBJ_PROP_ID_BEGIN)
        {
            buffarr.SetPosition(cpos);
            return obj;
        }

    {% if data.extend %}
        {{data.extend}}F::Read(buffarr,obj);
    {%end%}

        cpos = buffarr.GetPosition();
        id = buffarr.ReadVarUInt();

        while(id != OBJ_PROP_ID_END)
        {
            switch(id)
            {

{% for index, prop in data.propertys%}
                case {{prop.id}}:

      {% if prop.type == "arr" %}
                {
                    //buffarr.Skip(1); /// type is array or object
                    uint8 valueType = buffarr.ReadUByte();
                    if(valueType == OT_ARRAY)
                    {
                        uint32 arrsize = buffarr.ReadVarUInt();
                        buffarr.Skip(1); /// array object type
                        obj->{{prop.name}}.clear();/// clear arr
                        {% if baseids[prop.otype] == None %}
                        for(uint32 i = 0 ;i < arrsize; i ++)
                        {
                            obj->{{prop.name}}.push_back({{prop.otype}}());
                            auto& itm = obj->{{prop.name}}.back();
                            {{prop.otype}}F::Read(buffarr,&itm);
                        }
                        {% else %}
                        for(uint32 i = 0 ;i < arrsize; i ++)
                        {
                            {{prop.otype}} itm;
                            {{prop.otype}}Read(buffarr,itm);
                            obj->{{prop.name}}.push_back(itm);
                        }
                        {%end%}
                    }
                    else if(valueType == OT_OBJECT)
                    {
                       ///a virtual object
                       auto& arrval = obj->{{prop.name}};
                       auto arrsize = arrval.size();
                       auto arrindex = buffarr.ReadVarUInt(); /// OBJ_PROP_ID_BEGIN

                       while(arrindex != OBJ_PROP_ID_END)
                       {
                            if(arrindex != OBJ_PROP_ID_BEGIN)
                            {
                                arrindex = arrindex - (arrindex > OBJ_PROP_ID_BEGIN ? 2 : 1);

                                if(arrindex < arrsize)
                                {
                                    auto& itm = obj->{{prop.name}}[arrindex];
                                    {% if baseids[prop.otype] == None %}
                                    {{prop.otype}}F::Read(buffarr,&itm);
                                    {% else %}
                                    {{prop.otype}}Read(buffarr,itm);
                                    {% end %}
                                }
                                else
                                {
                                    {% if baseids[prop.otype] == None %}
                                    obj->{{prop.name}}.push_back({{prop.otype}}());
                                    auto& itm = obj->{{prop.name}}.back();
                                    {{prop.otype}}F::Read(buffarr,&itm);
                                    {% else %}
                                    {{prop.otype}} itm;
                                    {{prop.otype}}Read(buffarr,itm);
                                    obj->{{prop.name}}.push_back(itm);
                                    {% end %}
                                }
                            }
                            arrindex = buffarr.ReadVarUInt();
                       }
                    }else
                    {
                        buffarr.Skip(-1);
                        KFDataFormat::SkipValue(buffarr);
                    }
                }
    {% elif prop.type == "mixarr" %}
                {
                    //buffarr.Skip(1); /// type is mixarray<{{prop.otype}}>
                    uint8 valueType = buffarr.ReadUByte();
                    if(valueType == OT_MIXARRAY)
                    {
                        uint32 arrsize = buffarr.ReadVarUInt();

                        {% if prop.clear_ != None %}
                        obj->{{prop.clear_}}();
                        {% else %}
                        obj->{{prop.name}}.clear();/// clear arr Memory Leak
                        {% end %}

                        {% if baseids[prop.otype] == None %}
                        for(uint32 i = 0 ;i < arrsize; i ++)
                        {
                           {{prop.otype}}* itm = {{prop.otype}}F::Read{{prop.otype}}(buffarr);
                           {% if prop.call != None %}
                            obj->{{prop.call}}(itm);
                           {% end %}
                           obj->{{prop.name}}.push_back(itm);
                        }
                        {% else %}
                        <<mixarr Only supports the definition of the Object type>>
                        {% end %}
                    }
                    else if(valueType == OT_OBJECT)
                    {
                        ///a virtual object
                       auto& arrval = obj->{{prop.name}};
                       auto arrsize = arrval.size();
                       auto arrindex = buffarr.ReadVarUInt(); /// OBJ_PROP_ID_BEGIN

                       while(arrindex != OBJ_PROP_ID_END)
                       {
                            if(arrindex != OBJ_PROP_ID_BEGIN)
                            {
                                arrindex = arrindex - (arrindex > OBJ_PROP_ID_BEGIN ? 2 : 1);

                                if(arrindex < arrsize)
                                {
                                    auto itm = obj->{{prop.name}}[arrindex];
                                    {% if baseids[prop.otype] == None %}

                                    {{prop.otype}}* newitm = {{prop.otype}}F::Read{{prop.otype}}(buffarr,itm);
                                    if(newitm != itm)
                                    {
                                        /// clear old value
                                        {% if prop.clear_ != None%}
                                        obj->{{prop.clear_}}(itm);
                                        {% else %}
                                        kfDel(itm);
                                        {% end %}
                                        /// set new value index
                                        itm = newitm;
                                        obj->{{prop.name}}[arrindex] = itm;
                                    }

                                    {% if prop.call != None %}
                                    /// call itm update...
                                    obj->{{prop.call}}(itm);
                                    {% end %}

                                    {% else %}
                                    <<mixarr Only supports the definition of the Object type>>
                                    {%end%}
                                }
                                else
                                {
                                    {% if baseids[prop.otype] == None %}
                                    {{prop.otype}}* itm = {{prop.otype}}F::Read{{prop.otype}}(buffarr);
                                    {% if prop.call != None %}
                                    obj->{{prop.call}}(itm);
                                    {% end %}
                                    obj->{{prop.name}}.push_back(itm);
                                    {% else %}
                                    <<mixarr Only supports the definition of the Object type>>
                                    {%end%}
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
    {% elif prop.type == "object" %}
                
                if(buffarr.ReadUByte() == OT_OBJECT)
                {
                    {{prop.otype}}F::Read(buffarr,&obj->{{prop.name}});
                }
                else
                {
                    buffarr.Skip(-1);
                    KFDataFormat::SkipValue(buffarr);
                }

    {% elif prop.type == "mixobject" %}

                {
                    ///mix object self checking 
                    auto oldval = obj->{{prop.name}};
                    auto newval = {{prop.otype}}F::Read{{prop.otype}}(buffarr,oldval);

                    if(oldval != newval)
                    {
                        {% if prop.clear_ != None%}
                        obj->{{prop.clear_}}();
                        {% else %}
                        kfDel(obj->{{prop.name}});
                        {% end %}
                        obj->{{prop.name}} = newval;
                    }
                }
    {% else %}
               if(buffarr.ReadUByte() == {{baseids[prop.type]}}) 
              {
                //buffarr.Skip(1);/// type is base value
                {{prop.type}}Read(buffarr,obj->{{prop.name}});
              }
              else
              {
                 buffarr.Skip(-1);
                 KFDataFormat::SkipValue(buffarr);
              }
    {%end%}
                    break;
{%end%}
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

     void {{data.class}}F::Write(KFByteArray& buffarr,{{data.class}}* obj)
     {
        if(obj == NULL) return;
        buffarr.WriteVarUInt(OBJ_PROP_ID_BEGIN);
 {% if data.extend %}
        {{data.extend}}F::Write(buffarr,obj);
 {%end%}


{% for index, prop in data.propertys%}
        buffarr.WriteVarUInt({{prop.id}});///property id
    {% if prop.type == "arr" %}
        {
            buffarr.WriteByte({{typeids[prop.type]}});///write arr type
            
            auto& arritms = obj->{{prop.name}};
            uint32 arrsize = kf_2_uint32(arritms.size());
            buffarr.WriteVarUInt(arrsize);

            {% if baseids[prop.otype] == None %}
            buffarr.WriteByte(OT_OBJECT);///write object type
            for(uint32 i = 0 ;i < arrsize; i ++)
            {
                {{prop.otype}}F::Write(buffarr,&arritms[i]);
            }
            {% else %}
            buffarr.WriteByte({{baseids[prop.otype]}});///write base value type
            for(uint32 i = 0 ;i < arrsize; i ++)
            {
                {{prop.otype}}Write(buffarr,arritms[i]);
            }
            {%end%}
        }
    {% elif prop.type == "mixarr" %}
        {
            buffarr.WriteByte({{typeids[prop.type]}});///write mixarr type
            auto& arritms = obj->{{prop.name}};
            uint32 arrsize = kf_2_uint32(arritms.size());
            buffarr.WriteVarUInt(arrsize);
            for(uint32 i = 0 ;i < arrsize; i ++)
            {
                {{prop.otype}}F::Write{{prop.otype}}(buffarr,arritms[i]);
            }
        }
    {% elif prop.type == "object" %}
        buffarr.WriteByte(OT_OBJECT);///write object type
        {{prop.otype}}F::Write(buffarr,&obj->{{prop.name}});
    {% elif prop.type == "mixobject" %}
        {{prop.otype}}F::Write{{prop.otype}}(buffarr,obj->{{prop.name}});
    {% else %}
        {{prop.type}}WriteVal(buffarr,obj->{{prop.name}});
    {%end%}

{%end%}

        buffarr.WriteVarUInt(OBJ_PROP_ID_END);
     }

{% if data.typedef == 1 %}
        {{data.class}}* {{data.class}}F::Read{{data.class}}(KFByteArray& buffarr,{{data.class}}* obj /*= nullptr*/)
        {
            return {{data.class}}TypeDef::Read(buffarr,obj);
        }

        void {{data.class}}F::Write{{data.class}}(KFByteArray& buffarr,{{data.class}}* obj)
        {
            {{data.class}}TypeDef::Write(buffarr,obj);
        }

{% else %}

        {{data.class}}* {{data.class}}F::Read{{data.class}}(KFByteArray& buffarr,{{data.class}}* obj /*= nullptr*/)
        {
            uint8 valueType = buffarr.ReadUByte(); /// type is object
            if(valueType == OT_NULL)
            {
                return nullptr;
            }
            else if(valueType == OT_OBJECT)
            {
                return {{data.class}}F::Read(buffarr,obj);
            }
            else if(valueType == OT_MIXOBJECT)
            {
                uint32 clsid = buffarr.ReadVarUInt();///clsid
                return {{data.class}}F::Read(buffarr,obj);
            }
            else
            {
                buffarr.Skip(-1);
                KFDataFormat::SkipValue(buffarr);
            }

            return nullptr;
        }

        void {{data.class}}F::Write{{data.class}}(KFByteArray& buffarr,{{data.class}}* obj)
        {
           if(obj == NULL)
            {
                buffarr.WriteByte(OT_NULL);
                return;
            }

            buffarr.WriteByte(OT_MIXOBJECT);///objecttype
            buffarr.WriteVarUInt({{data.clsid}});
            {{data.class}}F::Write(buffarr,obj);
        }
{%end%}

}