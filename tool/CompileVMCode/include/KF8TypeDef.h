//
// Created by gatesgao on 2021/11/23.
//

#ifndef KUNGFU8_KF8EXPORT_H
#define KUNGFU8_KF8EXPORT_H

#include <stdint.h>
#include <string>
#include <stdlib.h>

#include "KF8DebuggerDef.h"

#ifndef EMBED_VM_CODE

#define WASM_EXTERN_C extern "C"
#define WASM_EXPORT WASM_EXTERN_C __attribute__((used)) __attribute__((visibility ("default")))
#define WASM_IMPORT(MODULE,NAME) __attribute__((import_module(MODULE))) __attribute__((import_name(NAME)))

typedef unsigned char byte;
typedef unsigned char* bytes;

//typedef std::int64_t int64;
//typedef std::uint64_t uint64;

typedef signed long long int64;
typedef unsigned long long	uint64;

typedef std::uint32_t uint32;
typedef std::int32_t int32;
typedef std::uint32_t varuint;
typedef std::uint16_t uint16;
typedef std::int16_t int16;
typedef std::uint8_t uint8;
typedef std::int8_t  int8;

typedef float num1;
typedef float num32;
typedef double num2;
typedef double num64;

typedef std::string kfstr;
///原始对象的指针
typedef uint64 ObjectPtr;
using string = std::string;

#define null nullptr

///定义原始导出的函数

///NameValue
WASM_EXTERN_C  int32 _N(const char*);
WASM_EXTERN_C const char* _NS(int32);
WASM_EXTERN_C ObjectPtr _TI(const char*, int32);
WASM_EXTERN_C const char* _TS(ObjectPtr, int32);
WASM_EXTERN_C ObjectPtr _NewStr(ObjectPtr, int32);
WASM_EXTERN_C void _DeleteStr(ObjectPtr);
WASM_EXTERN_C int _GetStr(ObjectPtr);
WASM_EXTERN_C void _SetStr(ObjectPtr, const char*);
///Retain 1 Release -1 REFCOUNT 0
WASM_EXTERN_C int32 _R(ObjectPtr, int32);
///ObjectPtr thisobj, int32 name, num1* value, int32 className, int32 flagandat
///Float 2 int32 4 string 6 value 8 raw 10 userdata 12
WASM_EXTERN_C int32 _GetSet(ObjectPtr, int32, void*, int32, int32);
WASM_EXTERN_C void _CopyTo(ObjectPtr, ObjectPtr);
WASM_EXTERN_C ObjectPtr _As(ObjectPtr fromobj, int32 cls);
WASM_EXTERN_C ObjectPtr _AsFromTo(ObjectPtr fromobj, int32 fromcls, int32 tocls);
WASM_EXTERN_C ObjectPtr _Meta(ObjectPtr objptr);
//clsfunc(cls<<32|func)  paramPtr(retPtr,param_0,param_1... param_n)
WASM_EXTERN_C int32 _AnyCall(int64 clsfunc, ObjectPtr target, void* paramPtr, int32 paramSize , int32 paramflags);

inline int64 _VMMethod(const char* clsname, const char* funcname)
{
    int32 cls = _N(clsname);
    int32 func = _N(funcname);
    return ((int64)cls << 32 | func);
}

namespace AnyCallPackArgsHelper
{
	template<typename T>
	inline int32 PackOneArg(int64& param, const T& arg)
	{
		static_assert(sizeof(arg) <= sizeof(int64), "param size too big to pack into int64!");
		*(T*)&param = arg;
		return 0;
	}

	template<typename T>
	inline int32 PackOneArg(int64& param, T* arg) 
	{
		param = (int64)arg;
		return 1;
	}

	template<>
	inline int32 PackOneArg(int64& param, const char* arg) 
	{
		param = (int64)arg;
		return 2;
	}

	inline void PackArgs(int64 params[], int index, int32& paramsflag)
	{
	}

	template <typename T, typename ...Args>
	inline void PackArgs(int64 params[], int index, int32& paramsflag, T&& item, Args&&... args)
	{
		int32 flag = PackOneArg(params[index], std::forward<T>(item));
		paramsflag |= flag << (index * 2);
		PackArgs(params, index + 1, paramsflag, std::forward<Args>(args)...);
	}
};

template<typename ...Args>
inline void _AnyCallT(int64 clsfunc, ObjectPtr target, Args&&... args)
{
    int64 params[sizeof...(args)] = {0};
    int32 paramsflag = 0;
    AnyCallPackArgsHelper::PackArgs(params, 0, paramsflag, std::forward<Args>(args)...);
    _AnyCall(clsfunc, target, params, sizeof...(args), paramsflag);
}

template<typename ...Args>
inline void _AnyCallT(int32 clsid, const char* funcname, ObjectPtr target, Args&&... args)
{
    _AnyCallT(((int64)clsid << 32 | _N(funcname)), target, std::forward<Args>(args)...);
}

template<typename ...Args>
inline void _AnyCallT(const char* clsname, const char* funcname, ObjectPtr target, Args&&... args)
{
    _AnyCallT(_VMMethod(clsname, funcname), target, std::forward<Args>(args)...);
}

inline ObjectPtr _New(const char* cls, ObjectPtr copyTarget = 0)
{
    ObjectPtr newobj = 0;
	_AnyCallT(cls, "new", 0, &newobj, copyTarget);
    return newobj;
}

inline ObjectPtr _New(int32 clsid, ObjectPtr copyTarget = 0)
{
    ObjectPtr newobj = 0;
	_AnyCallT(clsid, "new", 0, &newobj, copyTarget);
    return newobj;
}

inline void _Delete(ObjectPtr target, const char* cls)
{
	_AnyCallT(cls, "delete", target, 0);
}

inline void _Delete(ObjectPtr target, int32 clsid)
{
	_AnyCallT(clsid, "delete", target, 0);
}

class DefaultNewDelete
{
public:
	static ObjectPtr New(int32 clsid, ObjectPtr copyTarget = 0)
	{
		return _New(clsid, copyTarget);
	}

	static void Delete(ObjectPtr target, int32 clsid)
	{
		_Delete(target, clsid);
	}
};

class vkfstr
{
public:
	vkfstr(ObjectPtr ptr = 0, bool autoDelete = false): m_ObjectPtr(ptr), m_AutoDelete(autoDelete) {}
	
	~vkfstr()
	{
		if (m_AutoDelete && m_ObjectPtr)
		{
			_DeleteStr(m_ObjectPtr);
		}
		Reset();
	}
	
	void Reset()
	{
		m_ObjectPtr = 0;
		m_AutoDelete = false;
	}
	
	vkfstr(const char* cstr): m_ObjectPtr(_NewStr((ObjectPtr)cstr, 0)), m_AutoDelete(true) {}
	
	vkfstr(const string& str): m_ObjectPtr(_NewStr((ObjectPtr)str.c_str(), 0)), m_AutoDelete(true) {}
	
	vkfstr(const vkfstr& vstr) { Set(vstr); }
	
	vkfstr(vkfstr&& vstr)
	{
		m_ObjectPtr = vstr.m_ObjectPtr;
		m_AutoDelete = vstr.m_AutoDelete;
		vstr.Reset();
	}
	
	vkfstr& operator=(const vkfstr& vstr)
	{
		if (this != &vstr)
		{
			if (m_AutoDelete && m_ObjectPtr)
			{
				_DeleteStr(m_ObjectPtr);
			}
			Set(vstr);
		}
		return *this;
	}
	
	vkfstr& operator=(vkfstr&& vstr)
	{
		if (this != &vstr)
		{
			m_ObjectPtr = vstr.m_ObjectPtr;
			m_AutoDelete = vstr.m_AutoDelete;
			vstr.Reset();
		}
		return *this;
	}
	
	ObjectPtr* RawObjectAddr(){return &m_ObjectPtr;}
	const ObjectPtr* RawObjectAddr() const {return &m_ObjectPtr;}
	ObjectPtr RawObjectPtr() const {return m_ObjectPtr;}
	
	string GetStr() const
	{
		if (m_ObjectPtr)
		{
			return (const char*)_GetStr(m_ObjectPtr);
		}
		return "";
	}

	operator string() const
    {
        return GetStr();
    }
	
	// 返回const char*用完即弃，不能缓存
	const char* c_str() const
	{
		if (m_ObjectPtr)
		{
			return (const char*)_GetStr(m_ObjectPtr);
		}
		return "";
	}
	
	void SetStr(const char* cstr)
	{
		if (m_ObjectPtr)
		{
			_SetStr(m_ObjectPtr, cstr);
		}
		else
		{
			m_ObjectPtr = _NewStr((ObjectPtr)cstr, 0);
			m_AutoDelete = true;
		}
	}

	vkfstr& operator=(const char* cstr)
    {
        SetStr(cstr);
        return *this;
    }

	vkfstr& operator=(const string& str)
    {
        return operator=(str.c_str());
    }
	
	void ClearStr()
	{
		if (m_ObjectPtr) _SetStr(m_ObjectPtr, 0);
	}

	void clear()
    {
        ClearStr();
    }
	
private:
	void Set(const vkfstr& vstr)
	{
		m_AutoDelete = vstr.m_AutoDelete;
		if (vstr.m_AutoDelete)
		{
			if (vstr.m_ObjectPtr)
			{
				m_ObjectPtr = _NewStr(vstr.m_ObjectPtr, 1);
			}
			else
			{
				m_ObjectPtr = 0;
			}
		}
		else
		{
			m_ObjectPtr = vstr.m_ObjectPtr;
		}
	}
	
private:
	ObjectPtr m_ObjectPtr = 0;
	bool m_AutoDelete = false;
};

class vkfname
{
public:
	vkfname(int32 nid): _name_id(nid) {}
	vkfname(const char* namestr): _name_id(_N(namestr)) {}
	
	operator int32() const {return _name_id;}
	int32 ToValue() const {return _name_id;}
    int32* ValueAddr() {return &_name_id;}
    const int32* ValueAddr() const {return &_name_id;}
	int32 RawObjectPtr() const {return _name_id;}
	// 返回const char*用完即弃，不能缓存
	const char* c_str() { return _NS(_name_id); }
private:
	int32 _name_id;
};

template<bool gcobject = false>
class vRawObjectT;
using vRawObject = vRawObjectT<false>;
using vRawGCObject = vRawObjectT<true>;

class vGCObject;
template <typename NewDelete = DefaultNewDelete>
class vAutoObjectT;
using vAutoObject = vAutoObjectT<>;

///原始指针对象引用
template<bool gcobject>
class vRawObjectT
{
public:

public:
    vRawObjectT(ObjectPtr ptr = 0, int32 cls = -1): m_ObjectPtr(ptr), m_ClassName(cls) {}
	
	// 不用虚函数
    ~vRawObjectT()
    {
        Reset();
    }
	
	void Reset()
	{
		m_ObjectPtr = 0;
        m_ClassName = 0;
	}

    num1 GetFloat(int32 index = 0, bool at = true) const
    {
        if (!m_ObjectPtr) return 0;
        num1 ret = 0;
        _GetSet(m_ObjectPtr, index, &ret, m_ClassName, MakeFlag(2, at, gcobject));
        return ret;
    }

	num1 GetFloat(const char* index, bool at = true) const
    {
        return GetFloat(_N(index), at);
    }

    void SetFloat(num1 value, int32 index = 0, bool at = true) const
    {
        if (!m_ObjectPtr) return;
        num1 ret = value;
        _GetSet(m_ObjectPtr, index, &ret, m_ClassName, MakeFlag(3, at, gcobject));
    }
	
	void SetFloat(num1 value, const char* index, bool at = true) const
	{
        SetFloat(value, _N(index), at);
    }

    int32 GetInt32(int32 index = 0, bool at = true) const
    {
        if (!m_ObjectPtr) return 0;
        int32 ret = 0;
        _GetSet(m_ObjectPtr, index, &ret, m_ClassName, MakeFlag(4, at, gcobject));
        return ret;
    }

	int32 GetInt32(const char* index, bool at = true) const
	{
        return GetInt32(_N(index), at);
    }

    void SetInt32(int32 value, int32 index = 0, bool at = true) const
    {
        if (!m_ObjectPtr) return;
        int32 ret = value;
        _GetSet(m_ObjectPtr, index, &ret, m_ClassName, MakeFlag(5, at, gcobject));
    }

    void SetInt32(int32 value, const char* index, bool at = true) const
    {
        SetInt32(value, _N(index), at);
    }

    string GetString(int32 index = 0, bool at = true) const
    {
        if (!m_ObjectPtr) return "";
		int32 ret = 0;
        _GetSet(m_ObjectPtr, index, &ret, m_ClassName, MakeFlag(6, at, gcobject));
        return ret ? (const char*)ret : "";
    }

    string GetString(const char* index, bool at = true) const
    {
        return GetString(_N(index), at);
    }

    void SetString(const char* value, int32 index = 0, bool at = true) const
    {
        if (!m_ObjectPtr) return;
        char* ret = (char*) value;
        _GetSet(m_ObjectPtr, index, ret, m_ClassName, MakeFlag(7, at, gcobject));
    }

    void SetString(const char* value, const char* index, bool at = true) const
    {
        SetString(value, _N(index), at);
    }

    vAutoObject GetRawValue(int32 index = 0, bool at = true) const;
    vAutoObject GetRawValue(const char* index, bool at = true) const;

	template<typename T>
    T GetRawValueAs(const char* index, bool at = true) const
    {
        return GetRawValueAs<T>(_N(index), at);
    }

	template<typename T>
    T GetRawValueAs(int32 index = 0, bool at = true) const;

    void SetRawValue(const vAutoObject& value, int32 index = 0, bool at = true) const;

    void SetRawValue(const vAutoObject& value, const char* index, bool at = true) const
    {
        SetRawValue(value, _N(index), at);
    }

    vGCObject GetValue(int32 index = 0, bool at = true) const;
    vGCObject GetValue(const char* index, bool at = true) const;

	template<typename T> T GetValueAs(const char* index, bool at = true) const;
	template<typename T> T GetValueAs(int32 index = 0, bool at = true) const;

    void SetValue(const vGCObject& value, int32 index = 0, bool at = true) const;
    void SetValue(const vGCObject& value, const char* index, bool at = true) const;

    ObjectPtr RawObjectPtr() const {return m_ObjectPtr;}
	int32 ClassName() const { return m_ClassName; }
    ObjectPtr* RawObjectAddr() {return &m_ObjectPtr;}
    const ObjectPtr* RawObjectAddr() const {return &m_ObjectPtr;}
    //class vGCObject* AsGCObject(){ return nullptr;}
	
	template<typename ...Args>
	void Call(const char* funcname, Args&&... args) const
	{
		if (!m_ObjectPtr || m_ClassName <= 0)
		{
			LOG_ERROR("无效的对象指针地址，无法调用Call %s", funcname);
			return;
		}
		_AnyCallT(m_ClassName, funcname, m_ObjectPtr, std::forward<Args>(args)...);
	}
	
	explicit operator bool() const
	{
		return m_ObjectPtr != 0;
	}

protected:
	int32 MakeFlag(int8 flag, bool at, bool isgcobject) const
	{
		return flag + (at ? 256 : 0) + (isgcobject ? 512 : 0);
	}

protected:
    ///类的名称
    int32 m_ClassName = 0;
    ///对象的引用
    ObjectPtr m_ObjectPtr = 0;
};

///KFGCObject对象的引用
class vGCObject : public vRawGCObject
{
public:
    vGCObject(ObjectPtr ptr = 0, int32 cls = -1, bool noRef = false) : vRawGCObject(ptr, cls)
	{
		if(m_ObjectPtr && !noRef) _R(m_ObjectPtr, 1);
	}

    ~vGCObject()
    {
        if(m_ObjectPtr) _R(m_ObjectPtr, -1);
    }
	
	void Reset()
	{
        vRawGCObject::Reset();
	}

    vGCObject(const vGCObject& obj)
    {
        m_ObjectPtr = obj.m_ObjectPtr;
		m_ClassName = obj.m_ClassName;
        if(m_ObjectPtr) _R(m_ObjectPtr, 1);
    }
	
	vGCObject(vGCObject&& obj)
    {
        m_ObjectPtr = obj.m_ObjectPtr;
		m_ClassName = obj.m_ClassName;
		
		obj.Reset();
    }

    vGCObject& operator=(const vGCObject& obj)
    {
		if (this != &obj)
		{
			if(m_ObjectPtr)
			{
				_R(m_ObjectPtr, -1);
			}

			m_ObjectPtr = obj.m_ObjectPtr;
			m_ClassName = obj.m_ClassName;
			if(m_ObjectPtr) _R(m_ObjectPtr, 1);
		}
        return *this;
    }
	
	vGCObject& operator=(vGCObject&& obj)
    {
		if (this != &obj)
		{
			if(m_ObjectPtr)
			{
				_R(m_ObjectPtr, -1);
			}

			m_ObjectPtr = obj.m_ObjectPtr;
			m_ClassName = obj.m_ClassName;
			
			obj.Reset();
		}
        return *this;
    }
	
	void AutoCreate()
	{
		if(m_ObjectPtr)
		{
			_R(m_ObjectPtr, -1);
			m_ObjectPtr = 0;
		}
		if (m_ClassName > 0)
		{
			m_ObjectPtr = _New(m_ClassName);
		}
	}

    ObjectPtr GetUserData(const char* name, bool at = true) const
	{
        return GetUserData(_N(name), at);
    }
	
    ObjectPtr GetUserData(int32 index = 0, bool at = true) const
    {
        if (!m_ObjectPtr) return 0;
        ObjectPtr ret = 0;
        _GetSet(m_ObjectPtr, index, &ret, m_ClassName, MakeFlag(12, at, true));
        return ret;
    }

    void SetUserData(ObjectPtr value, const char* name, bool at = true) const
    {
        SetUserData(value, _N(name), at);
    }
	
    void SetUserData(ObjectPtr value, int32 index = 0 , bool at = true) const
    {
        if (!m_ObjectPtr) return;
        ObjectPtr ret = value;
        _GetSet(m_ObjectPtr, index, &ret, m_ClassName, MakeFlag(13, at, true));
    }

    ///数据拷贝到指定目标
    void CopyTo(const vGCObject& Dest) const {if(Dest) _CopyTo(m_ObjectPtr, Dest.RawObjectPtr());}
	
	vGCObject As(int32 cls) const
	{
		if (m_ObjectPtr && cls > 0)
		{
			ObjectPtr ptr = _As(m_ObjectPtr, cls);
			if (ptr)
			{
				return vGCObject(ptr, cls);
			}
		}
		return vGCObject();
	}
	
	vGCObject As(const char* clsname) const
	{
		return As(_N(clsname));
	}
	
	template<typename T>
	T As() const
	{
		return T(As(T::getClsID()));
	}
	
	ObjectPtr Meta() const
	{
		return m_ObjectPtr ? _Meta(m_ObjectPtr) : 0;
	}
};

using vKFGCObject = vGCObject;

template<typename T, typename Enable = typename std::enable_if<std::is_base_of<vGCObject, T>::value>::type>
class vkfRef
{
public:
	vkfRef(ObjectPtr ptr = 0, int32 cls = -1, bool noRef = false) : m_Obj(ptr, cls, noRef) {}
    vkfRef(const T& t) : m_Obj(t) {}
    vkfRef(T&& t) : m_Obj(std::forward<T>(t)) {}
	const T& GetObj() const { return m_Obj; }
	T& GetObj() { return m_Obj; }
	explicit operator bool() const { return bool(m_Obj); }
    T* operator->() { return &m_Obj; }
    const T* operator->() const { return &m_Obj; }

private:
	T m_Obj;
};

template<typename NewDelete>
class vAutoObjectT: public vRawObject
{
public:
    vAutoObjectT(ObjectPtr ptr = 0, int32 cls = -1, bool autoDelete = false): vRawObject(ptr, cls), m_AutoDelete(autoDelete) {}
	
    ~vAutoObjectT()
    {
		if (m_AutoDelete && m_ObjectPtr && m_ClassName > 0)
		{
			NewDelete::Delete(m_ObjectPtr, m_ClassName);
		}
    }
	
	void Reset()
	{
		m_AutoDelete = false;
		vRawObject::Reset();
	}
	
	vAutoObjectT(const vAutoObjectT& obj)
	{
		m_ClassName = obj.m_ClassName;
		m_AutoDelete = obj.m_AutoDelete;
		if (obj.m_AutoDelete && obj.m_ObjectPtr && obj.m_ClassName > 0)
		{
			m_ObjectPtr = NewDelete::New(obj.m_ClassName, obj.m_ObjectPtr);
		}
		else
		{
			m_ObjectPtr = obj.m_ObjectPtr;
		}
	}
	
	vAutoObjectT(vAutoObjectT&& obj)
	{
		m_ClassName = obj.m_ClassName;
		m_ObjectPtr = obj.m_ObjectPtr;
		m_AutoDelete = obj.m_AutoDelete;
		
		obj.Reset();
	}
	
	vAutoObjectT& operator=(const vAutoObjectT& obj)
	{
		if (this != &obj)
		{
			if (m_AutoDelete && m_ObjectPtr && m_ClassName > 0)
			{
				NewDelete::Delete(m_ObjectPtr, m_ClassName);
			}
			m_ClassName = obj.m_ClassName;
			m_AutoDelete = obj.m_AutoDelete;
			if (obj.m_AutoDelete && obj.m_ObjectPtr && obj.m_ClassName > 0)
			{
				m_ObjectPtr = NewDelete::New(obj.m_ClassName, obj.m_ObjectPtr);
			}
			else
			{
				m_ObjectPtr = obj.m_ObjectPtr;
			}
		}
		return *this;
	}
	
	vAutoObjectT& operator=(vAutoObjectT&& obj)
	{
		if (this != &obj)
		{
			if (m_AutoDelete && m_ObjectPtr && m_ClassName > 0)
			{
				NewDelete::Delete(m_ObjectPtr, m_ClassName);
			}
			m_ClassName = obj.m_ClassName;
			m_ObjectPtr = obj.m_ObjectPtr;
			m_AutoDelete = obj.m_AutoDelete;
			
			obj.Reset();
		}
		return *this;
	}
	
	void SetAutoDelete(bool flag = true)
	{
		m_AutoDelete = flag;
	}
		
	void AutoCreate()
	{
		if (m_AutoDelete && m_ObjectPtr && m_ClassName > 0)
		{
			NewDelete::Delete(m_ObjectPtr, m_ClassName);
			m_ObjectPtr = 0;
		}

		if (m_ClassName > 0)
		{
			m_ObjectPtr = NewDelete::New(m_ClassName);
			m_AutoDelete = true;
		}
	}

protected:
	///自动释放
	bool m_AutoDelete = false;
};

template<bool gcobject>
vAutoObject vRawObjectT<gcobject>::GetRawValue(int32 index, bool at) const
{
	if (!m_ObjectPtr) return 0;
	ObjectPtr ret = 0;
	int32 clsname = _GetSet(m_ObjectPtr, index, &ret, m_ClassName, MakeFlag(10, at, gcobject));
	return vAutoObject(ret, clsname > 0 ? clsname : -1, false);
}

template<bool gcobject>
vAutoObject vRawObjectT<gcobject>::GetRawValue(const char* index, bool at) const
{
	return GetRawValue(_N(index), at);
}

template<bool gcobject>
template<typename T>
T vRawObjectT<gcobject>::GetRawValueAs(int32 index, bool at) const
{
	static_assert(std::is_base_of<vAutoObject, T>::value, "T is not derive from vAutoObject");
	auto value = GetRawValue(index, at);
    ObjectPtr ret = 0;
	if (value.ClassName() == T::getClsID())
	{
        ret = value.RawObjectPtr();
	}
    else
    {
        ret = _AsFromTo(value.RawObjectPtr(), value.ClassName(), T::getClsID());
	}
	return T(ret, -1, false);
}

template<bool gcobject>
void vRawObjectT<gcobject>::SetRawValue(const vAutoObject& value, int32 index, bool at) const
{
	if (!m_ObjectPtr) return;
	unsigned char valueBuff[sizeof(ObjectPtr) + sizeof(int32)] = {0};
	*(ObjectPtr*)valueBuff = value.RawObjectPtr();
	*(int32*)(((ObjectPtr*)valueBuff) + 1) = value.ClassName();
	_GetSet(m_ObjectPtr, index, valueBuff, m_ClassName, MakeFlag(11, at, gcobject));
}

template<bool gcobject>
vGCObject vRawObjectT<gcobject>::GetValue(int32 index, bool at) const
{
	if (!m_ObjectPtr) return 0;
	ObjectPtr ret = 0;
	_GetSet(m_ObjectPtr, index, &ret, m_ClassName, MakeFlag(8, at, gcobject));
	return ret;
}

template<bool gcobject>
vGCObject vRawObjectT<gcobject>::GetValue(const char* index, bool at) const
{
	return GetValue(_N(index), at);
}

template<bool gcobject>
void vRawObjectT<gcobject>::SetValue(const vGCObject& value, int32 index, bool at) const
{
	if (!m_ObjectPtr) return;
    ObjectPtr ret = value.RawObjectPtr();
	_GetSet(m_ObjectPtr, index, &ret, m_ClassName, MakeFlag(9, at, gcobject));
}

template<bool gcobject>
void vRawObjectT<gcobject>::SetValue(const vGCObject& value, const char* index, bool at) const
{
	SetValue(value, _N(index), at);
}

template<bool gcobject>
template<typename T>
T vRawObjectT<gcobject>::GetValueAs(const char* index, bool at) const
{
	return GetValueAs<T>(_N(index), at);
}

template<bool gcobject>
template<typename T>
T vRawObjectT<gcobject>::GetValueAs(int32 index, bool at) const
{
	static_assert(std::is_base_of<vGCObject, T>::value, "T is not derive from vGCObject");
	return GetValue(index, at).template As<T>();
}
	
class vUObject : public vRawObject
{
public:
    vUObject(ObjectPtr ptr = 0, int32 cls = -1, bool strongRef = false) : vRawObject(ptr, cls), m_StrongRef(strongRef)
	{
		RetainRef();
	}

    ~vUObject()
    {
        ReleaseRef();
    }
	
	void Reset()
	{
		m_RefPtr = 0;
		m_StrongRef = false;
        vRawObject::Reset();
	}

	vUObject(const vUObject& obj)
    {
        m_ObjectPtr = obj.RawObjectPtr();
		m_ClassName = obj.m_ClassName;
		m_StrongRef = obj.m_StrongRef;
		RetainRef();
    }
	
	vUObject(vUObject&& obj)
    {
        m_ObjectPtr = obj.m_ObjectPtr;
		m_ClassName = obj.m_ClassName;
		m_RefPtr = obj.m_RefPtr;
		m_StrongRef = obj.m_StrongRef;
		obj.Reset();
    }

    vUObject& operator=(const vUObject& obj)
    {
		if (this != &obj)
		{
			ReleaseRef();
			m_ObjectPtr = obj.RawObjectPtr();
			m_ClassName = obj.m_ClassName;
			m_StrongRef = obj.m_StrongRef;
			RetainRef();
		}
        return *this;
    }
	
	vUObject& operator=(vUObject&& obj)
    {
		if (this != &obj)
		{
			ReleaseRef();
			m_ObjectPtr = obj.m_ObjectPtr;
			m_ClassName = obj.m_ClassName;
			m_RefPtr = obj.m_RefPtr;
			m_StrongRef = obj.m_StrongRef;
			obj.Reset();
		}
        return *this;
    }

	ObjectPtr RawObjectPtr() const
	{
		if (m_StrongRef) return m_ObjectPtr;
		bool valid = false;
		_AnyCallT(m_ClassName, "IsRefValid", 0, &valid, m_RefPtr);
		if (valid) return m_ObjectPtr;
		return 0;
	}
	
	
	void AutoCreate(const vUObject& outer, const char* name)
	{
		ReleaseRef();
		m_ObjectPtr = 0;
		m_StrongRef = true;
		if (m_ClassName > 0)
		{
			New(outer, name);
			RetainRef();
		}
	}
protected:
	void RetainRef()
	{
		if (m_ObjectPtr && m_ClassName > 0)
		{
			_AnyCallT(m_ClassName, "retain_ref", m_ObjectPtr, &m_RefPtr, m_StrongRef);
		}
	}
	void ReleaseRef()
	{
		if (m_ClassName > 0 && m_RefPtr)
		{
			_AnyCallT(m_ClassName, "release_ref", m_RefPtr, 0, m_StrongRef);
		}
		m_RefPtr = 0;
	}

	void New(const vUObject& outer, const char* name)
	{
		_AnyCallT(m_ClassName, "new", 0, &m_ObjectPtr, outer.RawObjectPtr(), name);
	}

protected:
	ObjectPtr m_RefPtr = 0;
	bool m_StrongRef = false;
};

template <typename T>
T MakeObject()
{
	static_assert(std::is_base_of<vGCObject, T>::value || std::is_base_of<vAutoObject, T>::value, "T is not derive from vGCObject or vAutoObject");
	return T(_New(T::getClsID()), T::getClsID(), true);
}

#define MakeInstance(T) MakeObject<T>()

template<bool reverse>
class IteratorNewDelete
{
public:
	static ObjectPtr New(int32 clsid, ObjectPtr copyTarget = 0)
	{
		ObjectPtr newobj = 0;
		_AnyCallT(clsid, "new_iterator", 0, &newobj, reverse, copyTarget);
		return newobj;
	}

	static void Delete(ObjectPtr target, int32 clsid)
	{
		_AnyCallT(clsid, "delete_iterator", target, 0, reverse);
	}
};

namespace CallParamHelper
{
	template<typename T, typename Enable = void>
	struct TypeName;

	template<typename T>
	struct TypeName<T, typename std::enable_if<std::is_base_of<vAutoObject, T>::value>::type>
	{
		static const string& name()
		{
			static const string type_name = T::clsname;
			return type_name;
		}
	};

	template<typename T>
	struct TypeName<T, typename std::enable_if<std::is_base_of<vGCObject, T>::value>::type>
	{
		static const string& name()
		{
			static const string type_name = string(T::clsname) + "_";
			return type_name;
		}
	};

	template<typename T>
	struct TypeName<vkfRef<T>>
	{
		static const string& name()
		{
			static const string type_name = string("kfRef_") + T::clsname;
			return type_name;
		}
	};

	template<>
	struct TypeName<vkfRef<vKFGCObject>>
	{
		static const string& name()
		{
			static const string type_name = string("kfRef_") + "KFGCObject";
			return type_name;
		}
	};

	template<>
	struct TypeName<int8>
	{
		static const string& name()
		{
			static const string type_name = "int8";
			return type_name;
		}
	};

	template<>
	struct TypeName<uint8>
	{
		static const string& name()
		{
			static const string type_name = "uint8";
			return type_name;
		}
	};

	template<>
	struct TypeName<int16>
	{
		static const string& name()
		{
			static const string type_name = "int16";
			return type_name;
		}
	};

	template<>
	struct TypeName<uint16>
	{
		static const string& name()
		{
			static const string type_name = "uint16";
			return type_name;
		}
	};

	template<>
	struct TypeName<int32>
	{
		static const string& name()
		{
			static const string type_name = "int32";
			return type_name;
		}
	};

	template<>
	struct TypeName<uint32>
	{
		static const string& name()
		{
			static const string type_name = "uint";
			return type_name;
		}
	};

	template<>
	struct TypeName<int64>
	{
		static const string& name()
		{
			static const string type_name = "int64";
			return type_name;
		}
	};

	template<>
	struct TypeName<uint64>
	{
		static const string& name()
		{
			static const string type_name = "uint64";
			return type_name;
		}
	};

	template<>
	struct TypeName<float>
	{
		static const string& name()
		{
			static const string type_name = "num1";
			return type_name;
		}
	};

	template<>
	struct TypeName<double>
	{
		static const string& name()
		{
			static const string type_name = "num2";
			return type_name;
		}
	};

	template<>
	struct TypeName<bool>
	{
		static const string& name()
		{
			static const string type_name = "bool";
			return type_name;
		}
	};

	template<>
	struct TypeName<vkfstr>
	{
		static const string& name()
		{
			static const string type_name = "kfstr";
			return type_name;
		}
	};

	template<>
	struct TypeName<vkfname>
	{
		static const string& name()
		{
			static const string type_name = "kfname";
			return type_name;
		}
	};

	template<typename T, typename Enable=void>
	struct CallParamType
	{
		using type = T;
	};

	template<>
	struct CallParamType<vkfstr>
	{
		using type = ObjectPtr;
	};

	template<>
	struct CallParamType<vkfname>
	{
		using type = int32;
	};

	template<typename T>
	struct CallParamType<vkfRef<T>>
	{
		using type = ObjectPtr;
	};

	template<typename T>
	struct CallParamType<T, typename std::enable_if<std::is_base_of<vGCObject, T>::value || std::is_base_of<vAutoObject, T>::value>::type>
	{
		using type = ObjectPtr;
	};

	// 这个只用于传入参数，传出用上面的类型定义并在返回前构建对象，否则可能会导致引用计数错误
	template<typename T>
	inline typename std::enable_if<!std::is_base_of<vGCObject, T>::value && !std::is_base_of<vAutoObject, T>::value, T>::type
	GetCallParam(const T& t)
	{
		return t;
	}

	inline ObjectPtr GetCallParam(const vkfstr& t)
	{
		return t.RawObjectPtr();
	}

	inline int32 GetCallParam(const vkfname& t)
	{
		return t.ToValue();
	}

	template<typename T>
	inline ObjectPtr GetCallParam(const vkfRef<T>& t)
	{
		return t.GetObj().RawObjectPtr();
	}

	template<typename T>
	inline typename std::enable_if<std::is_base_of<vGCObject, T>::value || std::is_base_of<vAutoObject, T>::value, ObjectPtr>::type
	GetCallParam(const T& t)
	{
		return t.RawObjectPtr();
	}
};

template <typename T>
class vkfVector : public vAutoObject
{
public:
	using value_type = T;
	
	template<bool reverse>
	class vcomm_iterator : public vAutoObjectT<IteratorNewDelete<reverse>>
	{
	public:
        vcomm_iterator(ObjectPtr ptr = 0, int32 clsid = -1, bool autoDelete = false): 
			vAutoObjectT<IteratorNewDelete<reverse>>(ptr, clsid == -1 ? vkfVector::getClsID() : clsid, autoDelete){}
		
	public:
		value_type value() const
		{
			typename CallParamHelper::CallParamType<value_type>::type ret = 0;
			Call("iterator_value", &ret, reverse);
			return value_type(ret);
		}

		value_type operator*() const
        {
            return value();
        }
		
		bool operator==(const vcomm_iterator& it) const
		{
			bool ret = false;
			Call("iterator_compare", &ret, reverse, 1, it.RawObjectPtr());
			return ret;
		}
		
		bool operator!=(const vcomm_iterator& it) const
		{
            return !operator==(it);
		}

		bool operator>(const vcomm_iterator& it) const
		{
			bool ret = false;
			Call("iterator_compare", &ret, reverse, 2, it.RawObjectPtr());
			return ret;
		}

		bool operator<(const vcomm_iterator& it) const
		{
			bool ret = false;
			Call("iterator_compare", &ret, reverse, 3, it.RawObjectPtr());
			return ret;
		}

		bool operator>=(const vcomm_iterator& it) const
		{
            return !operator<(it);
		}

		bool operator<=(const vcomm_iterator& it) const
        {
            return !operator>(it);
		}

		vcomm_iterator& operator+=(int32 i)
		{
			Call("iterator_inc", 0, reverse, i, RawObjectAddr());
			return *this;
		}

		vcomm_iterator& operator-=(int32 i)
		{
            return operator+=(-i);
		}
		
		vcomm_iterator& operator++()
		{
            return operator+=(1);
		}

		vcomm_iterator operator++(int)
		{
            viterator tmp = *this;
            operator+=(1);
            return tmp;
		}

		vcomm_iterator& operator--()
		{
            return operator+=(-1);
		}

		vcomm_iterator operator--(int)
		{
            viterator tmp = *this;
            operator+=(-1);
            return tmp;
		}

		int32 operator-(const vcomm_iterator& it)
        {
            int32 ret = 0;
			Call("iterator_diff", &ret, reverse, it.RawObjectPtr());
            return ret;
        }
	};

	using viterator = vcomm_iterator<false>;
	using vreverse_iterator = vcomm_iterator<true>;

public:
	vkfVector(ObjectPtr ptr = 0, bool autoDelete = false): vAutoObject(ptr, getClsID(), autoDelete) {}
	explicit vkfVector(const vAutoObject& obj, bool autoDelete = false)
        : vAutoObject(obj.RawObjectPtr(), obj.ClassName() > 0 ? obj.ClassName() : getClsID(), autoDelete) {}
	
	int32 size() const 
	{
		int32 ret = 0;
		Call("size", &ret);
		return ret; 
	}
	
	void resize(int32 size) const
	{
		Call("resize", 0, size);
	}

	void resize(int32 size, const value_type& val) const
	{
		Call("resize", 0, size, CallParamHelper::GetCallParam(val));
	}

	void reserve(int32 n) const
	{
		Call("reserve", 0, n);
	}
	
	value_type get(int32 idx) const
	{
		typename CallParamHelper::CallParamType<value_type>::type ret = 0;
		Call("get", &ret, idx);
		return value_type(ret);
	}
	
	const value_type operator [](int32 idx) const
	{
		return get(idx);
	}
	
	void set(int32 idx, const value_type& val) const
	{
		Call("set", 0, idx, CallParamHelper::GetCallParam(val));
	}
	
	void push_back(const value_type& val) const
	{
		Call("push_back", 0, CallParamHelper::GetCallParam(val));
	}

	void pop_back() const
	{
		Call("pop_back", 0);
	}
	
	viterator find(const value_type& val) const
	{
        ObjectPtr ret = 0;
		Call("find", &ret, false, CallParamHelper::GetCallParam(val));
		return viterator(ret, -1, true);
	}

	vreverse_iterator rfind(const value_type& val) const
	{
        ObjectPtr ret = 0;
		Call("find", &ret, true, CallParamHelper::GetCallParam(val));
		return vreverse_iterator(ret, -1, true);
	}

	viterator insert(const viterator& position, const value_type& val)
    {
        ObjectPtr ret = 0;
		Call("insert_val", &ret, position.RawObjectPtr(), 1, CallParamHelper::GetCallParam(val));
		return viterator(ret, -1, true);
    }

	viterator insert(const viterator& position, int32 n, const value_type& val)
    {
        ObjectPtr ret = 0;
		Call("insert_val", &ret, position.RawObjectPtr(), n, CallParamHelper::GetCallParam(val));
		return viterator(ret, -1, true);
    }

	viterator insert(const viterator& position, const viterator& input_first, const viterator& input_last)
    {
        ObjectPtr ret = 0;
		Call("insert_range", &ret, position.RawObjectPtr(), input_first.RawObjectPtr(), input_last.RawObjectPtr());
		return viterator(ret, -1, true);
    }

	viterator erase(const viterator& position)
    {
        ObjectPtr ret = 0;
		Call("erase_range", &ret, position.RawObjectPtr(), 0);
		return viterator(ret, -1, true);
    }

	viterator erase(const viterator& first, const viterator& last)
    {
        ObjectPtr ret = 0;
		Call("erase_range", &ret, first.RawObjectPtr(), last.RawObjectPtr());
		return viterator(ret, -1, true);
    }

	void swap(const vkfVector& x)
    {
		Call("swap", 0, x.RawObjectPtr());
    }

	void clear()
    {
		Call("clear", 0);
    }
	
	viterator begin() const
	{
        ObjectPtr ret = 0;
		Call("begin", &ret, false);
		return viterator(ret, -1, true);
	}
	
	viterator end() const
	{
        ObjectPtr ret = 0;
		Call("end", &ret, false);
		return viterator(ret, -1, true);
	}
	
	vreverse_iterator rbegin() const
	{
        ObjectPtr ret = 0;
		Call("begin", &ret, true);
		return vreverse_iterator(ret, -1, true);
	}
	
	vreverse_iterator rend() const
	{
        ObjectPtr ret = 0;
		Call("end", &ret, true);
		return vreverse_iterator(ret, -1, true);
	}

public:
	static int32 getClsID()
	{
		static int32 id = 0;
		if (id == 0)
		{
			string clsname = "kfVector_" + CallParamHelper::TypeName<value_type>::name();
			id = _N(clsname.c_str());
		}
		return id;
	}
};

template <typename Key, typename T, bool unorder>
class vkfCommMap : public vAutoObject
{
public:
	using key_type = Key;
	using value_type = T;
	
	template<bool reverse>
	class vcomm_iterator : public vAutoObjectT<IteratorNewDelete<reverse>>
	{
	public:
        vcomm_iterator(ObjectPtr ptr = 0, int32 clsid = -1, bool autoDelete = false) : 
			vAutoObjectT<IteratorNewDelete<reverse>>(ptr, clsid == -1 ? vkfCommMap::getClsID() : clsid, autoDelete) {}
		
	public:		
		key_type first() const
		{
			typename CallParamHelper::CallParamType<key_type>::type ret = 0;
			Call("iterator_first", &ret, reverse);
			return key_type(ret);
		}
		
		value_type second() const
		{
			typename CallParamHelper::CallParamType<value_type>::type ret = 0;
			Call("iterator_second", &ret, reverse);
			return value_type(ret);;
		}
		
		bool operator==(const vcomm_iterator& it) const
		{
			bool ret = false;
			Call("iterator_eq", &ret, reverse, it.RawObjectPtr());
			return ret;
		}
		
		bool operator!=(const vcomm_iterator& it) const
        {
            return !operator==(it);
		}
		
		vcomm_iterator& operator++()
		{
			Call("iterator_inc", RawObjectAddr(), reverse);
			return *this;
		}

		vcomm_iterator& operator++(int)
		{
            viterator tmp = *this;
            operator++();
            return tmp;
		}

		vcomm_iterator& operator--()
		{
			Call("iterator_dec", RawObjectAddr(), reverse);
			return *this;
		}

		vcomm_iterator& operator--(int)
		{
            vcomm_iterator tmp = *this;
            operator--();
            return tmp;
		}
	};

	using viterator = vcomm_iterator<false>;
	using vreverse_iterator = vcomm_iterator<true>;

public:
	vkfCommMap(ObjectPtr ptr = 0, bool autoDelete = false): vAutoObject(ptr, getClsID(), autoDelete) {}
	explicit vkfCommMap(const vAutoObject& obj, bool autoDelete = false)
        : vAutoObject(obj.RawObjectPtr(), obj.ClassName() > 0 ? obj.ClassName() : getClsID(), autoDelete) {}
		
	int32 size() const 
	{
		int32 ret = 0;
		Call("size", &ret);
		return ret;
	}
	
	viterator find(const key_type& key) const
	{
        ObjectPtr ret = 0;
		Call("find", &ret, CallParamHelper::GetCallParam(key));
		return viterator(ret, -1, true);
	}

	const value_type operator [](const key_type& key) const
	{
		typename CallParamHelper::CallParamType<value_type>::type ret = 0;
		Call("access", &ret, CallParamHelper::GetCallParam(key));
		return value_type(ret);;
	}
	
	void set(const key_type& key, const value_type& val) const
	{
        Call("set", 0, CallParamHelper::GetCallParam(key), CallParamHelper::GetCallParam(val));
	}
	
	bool insert(const key_type& key, const value_type& val) const
	{
		bool ret = false;
        Call("insert", &ret, CallParamHelper::GetCallParam(key), CallParamHelper::GetCallParam(val));
		return ret;
	}

	int32 erase(const key_type& key)
    {
        int32 ret = 0;
		Call("erase", &ret, CallParamHelper::GetCallParam(key));
		return viterator(ret, -1, true);
    }

	viterator erase(const viterator& position)
    {
        ObjectPtr ret = 0;
		Call("erase_range", &ret, position.RawObjectPtr(), 0);
		return viterator(ret, -1, true);
    }

	viterator erase(const viterator& first, const viterator& last)
    {
        ObjectPtr ret = 0;
		Call("erase_range", &ret, first.RawObjectPtr(), last.RawObjectPtr());
		return viterator(ret, -1, true);
    }

	void swap(const vkfCommMap& x)
    {
		Call("swap", 0, x.RawObjectPtr());
    }

	void clear()
    {
		Call("clear", 0);
    }
	
	viterator begin() const
	{
        ObjectPtr ret = 0;
		Call("begin", &ret, false);
		return viterator(ret, -1, true);
	}
	
	viterator end() const
	{
        ObjectPtr ret = 0;
		Call("end", &ret, false);
		return viterator(ret, -1, true);
	}

	vreverse_iterator rbegin() const
	{
        ObjectPtr ret = 0;
		Call("begin", &ret, true);
		return vreverse_iterator(ret, -1, true);
	}
	
	vreverse_iterator rend() const
	{
        ObjectPtr ret = 0;
		Call("end", &ret, true);
		return vreverse_iterator(ret, -1, true);
	}
	
public:
	static int32 getClsID()
	{
		static int32 id = 0;
		if (id == 0)
		{
            string clsname = (unorder ? "kfMap_" : "kfOMap_") + 
				CallParamHelper::TypeName<key_type>::name() + "_" + 
				CallParamHelper::TypeName<value_type>::name();
			id = _N(clsname.c_str());
		}
		return id;
	}
};

template <typename Key, typename T>
using vkfMap = vkfCommMap<Key, T, true>;

template <typename Key, typename T>
using vkfOMap = vkfCommMap<Key, T, false>;

#else

#endif
#endif //KUNGFU8_KF8EXPORT_H
