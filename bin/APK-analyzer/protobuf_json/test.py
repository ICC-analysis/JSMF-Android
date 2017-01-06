#!/usr/bin/python3

import os
import sys
import json
from pprint import pprint
import protobuf_json
import test_pb2 as pb_test


def get_pb():
	# create and fill test message
	pb=pb_test.TestMessage()
	pb.id=123
	pb.b=b"\x08\xc8\x03\x12"
	pb.query="some text"
	pb.flag=True
	pb.test_enum=2
	msg=pb.nested_msg
	msg.id=1010
	msg.title="test title"
	msg.url="http://example.com/"

	msgs=pb.nested_msgs.add()
	msgs.id=456
	msgs.title="test title"
	msgs.url="http://localhost/"

	pb.rep_int.append(1)
	pb.rep_int.append(2)

	pb.bs.append(b"\x00\x01\x02\x03\x04");
	pb.bs.append(b"\x05\x06\x07\x08\x09");

	return pb


def test_json_and_back(enum_string=False):
	# convert it to JSON and back
	pb = get_pb()
	pprint(pb.SerializeToString())
	json_obj=protobuf_json.pb2json(pb, enum_string=enum_string)
	pprint(json_obj)
	pb2=protobuf_json.json2pb(pb_test.TestMessage(), json_obj)
	pprint(pb2.SerializeToString())
	assert pb == pb2


def test_json_and_back_with_enum_string():
	test_json_and_back(True)


if __name__ == "__main__":
        # here just for backward compat. use nosetests instead.
	try:
		test_json_and_back()
		test_json_and_back_with_enum_string()
		print("Test passed.")
	except AssertionError:
		print("Test FAILED!")
