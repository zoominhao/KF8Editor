#!/usr/bin/python3
# _*_ coding: utf-8 _*_

import os
import unittest
import sys
sys.path.append(os.path.realpath(os.path.dirname(os.path.realpath(__file__)) + '/..'))

from pyKFD.pyKFDataType import KFDataType

gArrayObjectTypes = [
    KFDataType.OT_ARRAY,
    KFDataType.OT_MIXARRAY,
    KFDataType.OT_OBJECT,
    KFDataType.OT_MIXOBJECT
]

class DataTypeTest(unittest.TestCase):
    def setUp(self) -> None:
        KFDataType.Init()
        return super().setUp()

    def test_lengths(self):
        self.assertGreaterEqual(len(KFDataType.Base_Type_ids), 21)
        self.assertGreaterEqual(len(KFDataType.Type_to_ids), 25)
        self.assertEqual(len(KFDataType.ID_to_types), 20)
        self.assertEqual(len(KFDataType.NumIntEnum), 8)
        pass

    def test_is_integer(self):
        self.assertTrue(KFDataType.Is_numInt(KFDataType.OT_INT8))
        self.assertTrue(KFDataType.Is_numInt(KFDataType.OT_UINT8))
        self.assertTrue(KFDataType.Is_numInt(KFDataType.OT_INT16))
        self.assertTrue(KFDataType.Is_numInt(KFDataType.OT_UINT16))
        self.assertTrue(KFDataType.Is_numInt(KFDataType.OT_INT32))
        self.assertTrue(KFDataType.Is_numInt(KFDataType.OT_UINT32))
        self.assertTrue(KFDataType.Is_numInt(KFDataType.OT_INT64))
        self.assertTrue(KFDataType.Is_numInt(KFDataType.OT_UINT64))

        self.assertFalse(KFDataType.Is_numInt(KFDataType.OT_BOOL))
        self.assertFalse(KFDataType.Is_numInt(KFDataType.OT_VARINT))
        self.assertFalse(KFDataType.Is_numInt(KFDataType.OT_VARUINT))

        pass

    def test_is_float(self):
        self.assertTrue(KFDataType.Is_numFloat(KFDataType.OT_FLOAT))
        self.assertTrue(KFDataType.Is_numFloat(KFDataType.OT_DOUBLE))
        pass

    def test_is_bool(self):
        self.assertTrue(KFDataType.Is_Bool(KFDataType.OT_BOOL))
        pass

    def test_is_string(self):
        self.assertTrue(KFDataType.Is_Str(KFDataType.OT_STRING))
        pass

    def test_is_basetype(self):
        self.assertFalse(KFDataType.Is_BaseType(KFDataType.OT_UNKNOW))
        for type in KFDataType.Base_Type_ids.values():
            self.assertTrue(KFDataType.Is_UnknowOrBaseType(type))
        for type in gArrayObjectTypes:
            self.assertFalse(KFDataType.Is_UnknowOrBaseType(type))
        pass

    def test_is_unknown_or_basetype(self):
        self.assertTrue(KFDataType.Is_UnknowOrBaseType(KFDataType.OT_UNKNOW))
        for type in KFDataType.Base_Type_ids.values():
            self.assertTrue(KFDataType.Is_UnknowOrBaseType(type))
        for type in gArrayObjectTypes:
            self.assertFalse(KFDataType.Is_UnknowOrBaseType(type))
        pass

    def test_is_array_or_object(self):
        for type in gArrayObjectTypes:
            self.assertTrue(KFDataType.Is_ArrayOrObjectType(type))
        pass

if __name__ == '__main__':
    unittest.main(verbosity=2)
