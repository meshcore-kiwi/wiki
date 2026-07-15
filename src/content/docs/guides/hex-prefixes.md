---
title: Hex Prefixes (1/2/3-Byte)
description: Understanding prefix sizes and avoiding conflicts as the NZ network grows.
---

Your node's public key hex prefix is how the network routes packets. Understanding prefix sizes matters for avoiding conflicts as the network grows.

## Prefix size comparison

| Size | Hex chars | Combinations | Collision risk | Min firmware |
| --- | --- | --- | --- | --- |
| 1-Byte | 2 (e.g. `3a`) | 256 | High | All versions |
| **2-Byte ⭐** | 4 (e.g. `3a7f`) | 65,536 | Low | v1.14.0+ |
| 3-Byte | 6 (e.g. `3a7fb2`) | 16,777,216 | Very low | v1.14.0+ |

**Recommended: 2-byte prefix** - the best balance between collision avoidance and compatibility. If your network is on v1.14.0+, switch to 2-byte.

:::caution[Backward compatibility]
Any repeater on **v1.13.0 or older will silently drop** 2-byte or 3-byte prefix packets. Upgrade all repeaters along the path before migrating.
:::

## How it works

From a community post by Liam Cottle (MeshCore developer):

- **Firmware compatibility:** 1-byte packets work on all versions; 2/3-byte packets need v1.14.0+ repeaters.
- v1.14.0+ repeaters **forward packets as-is** - you don't need to change `path.hash.mode` unless you want the repeater's own adverts to be 2-byte too.
- **How repeaters add path bytes:** a 1-byte packet gets 1 byte added per hop, a 2-byte packet gets 2, a 3-byte packet gets 3.
- **The originator decides** - whoever created the packet controls the path size for that packet.
- **No coordination needed** - no one else has to change their settings. Simple rule: if they're on v1.14.0+, it works.

## Configuring your prefix size

Prefix size is configured per-device in the companion app. The sender controls the prefix size - repeaters match and forward using the same size.

1. Open the MeshCore companion app.
2. Go to **Settings → Path / Routing**.
3. Find the `path.hash.mode` setting.
4. Select 1-byte, 2-byte, or 3-byte.
5. If using 2 or 3-byte mode, make sure all repeaters your packets traverse are on v1.14.0+.

## Picking a free prefix

1. Check what's in use: [NZ Prefix Tool](https://meshcore.baird.io/#/analytics?tab=prefix-tool) / [collision matrix](https://meshcore.baird.io/#/analytics?tab=collisions&section=hashMatrixSection)
2. Generate keys with the [Key Generator](https://gessaman.com/mc-keygen/) until you get a free prefix.
3. Found a conflict later? The **newest node re-keys** - this preserves the existing mesh topology.
