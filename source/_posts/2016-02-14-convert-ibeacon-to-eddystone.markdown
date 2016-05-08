---
layout: post
title: "Convert iBeacon to Eddystone"
date: 2016-02-14 12:04:08 +0530
comments: true
categories:
- iBeacon
- Eddystone
- Beacon
---

Beacons are new way for contextual suggestions to the users. Beacons uses
BLE to transmit the information. This post is to explain how can you use
Google Eddystone protocol without actually converting them into the
Eddystone.

To get started with this article, you must know little knowledge of the
Beacons and iBeacon & Eddystone Protocol.

* **The Repository is:** [Beacons](https://github.com/rajatguptarg/beacon-registry)

Here is my logic to convert iBeacon to Eddystone Advertised id in Python:

```
def advertised_id(self):
    """
    Convert uuid, major, minor into advertised id
    """
    namespace = '0x' + self.uuid[:8] + self.uuid[-12:]
    major, minor = map(int, (self.major, self.minor))
    temp_instance = self._append_hex(major, minor)
    instance = self._add_padding(temp_instance)
    beacon_id = self._append_hex(int(namespace, 16), instance)
    return base64.b64encode(self.long_to_bytes(beacon_id))

def _add_padding(self, instance):
    """
    Append padding of desired size
    """
    bit_length = (len(hex(instance)) - 2) * 4
    desired_padding_size = self.desired_instance_bits - bit_length
    padding = (2 ** desired_padding_size) - 1
    return self._append_hex(padding, instance)

def _append_hex(self, a, b):
    """
    Append hex number a in front of b
    """
    sizeof_b = 0

    # Count the number of bits in b
    while((b >> sizeof_b) > 0):
        sizeof_b += 1

    # make number of bits perfectly divisible by 4
    sizeof_b += 4 - ((sizeof_b % 4) or 4)

    return (a << sizeof_b) | b

def long_to_bytes(self, value, endianness='big'):
    """
    Convert hexadecimal into byte array
    """
    width = value.bit_length()
    width += 8 - ((width % 8) or 8)
    fmt = '%%0%dx' % (width // 4)
    s = unhexlify(fmt % value)

    if endianness == 'little':
        s = s[::-1]

    return s
```

For any doubt please write in comments.
