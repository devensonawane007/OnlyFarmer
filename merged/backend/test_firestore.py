from firebase import db

from firebase import rtdb

ref = rtdb.reference("test")
new_doc = ref.push({"msg": "hello realtime db"})
print("✅ RTDB write success. key:", new_doc.key)