---
title: MeshCore Etiquette
description: Community guidelines for running nodes on the NZ MeshCore network.
sidebar:
  order: 2
---

MeshCore is a shared network built on trust and cooperation. These guidelines help keep things working well for everyone - whether you're running your first node or managing a multi-hop backbone.

## Name your nodes clearly

Use a name that identifies your node's location or purpose - not just a callsign or random label. Other operators depend on node names to understand the network topology.

- ✅ Good: `Hamilton Hill Repeater`, `ZL2ABC/R Raglan`, `Waikato Gateway #1`
- ❌ Avoid: `node1`, `test123`, `my repeater`

## Set an accurate location

Nodes must be in fixed locations. A fixed, reasonably accurate location allows mesh users to understand real coverage, plan links, and connect to your node with a high probability of success.

- Don't leave the location as 0,0 or a default - a node with no location appears broken to everyone else.
- Location doesn't need to be exact for security reasons, but must be accurate enough that coverage modelling reflects reality. Street or immediate-area accuracy is sufficient; suburb level is the minimum acceptable.
- Portable or temporary deployments are fine, but identify them clearly in the node name.

:::tip
If someone can't tell from your location whether they can reach you, your location isn't accurate enough.
:::

## Choose a unique hex prefix

Your node's public key hex prefix is how the network routes packets. Shared prefixes cause conflicts where packets destined for one node may reach another.

- Use the 2-byte (4 char) prefix on firmware v1.14.0+ - 65,536 slots vs 256 in 1-byte mode. See [Hex Prefixes](/guides/hex-prefixes/).
- Before generating a key, check what's already in use with the [NZ Prefix Tool](https://meshcore.baird.io/#/analytics?tab=prefix-tool).
- If you discover a conflict, the newest node should re-key - this preserves the known topology of the existing mesh.

:::tip
Use the [Key Generator](https://gessaman.com/mc-keygen/) to generate keys until you find one with a free prefix.
:::

## Don't saturate the network

LoRa is a shared, limited-bandwidth medium. Every transmission affects everyone in range.

- Avoid sending unnecessary beacon or status packets at high frequency.
- Test new configurations during off-peak hours where possible.
- If running experiments, use a separate frequency or a test network.
- Don't flood the mesh with large messages; keep them short and purposeful.
- Use the `#testing` channel for small tests, or make your own channel. Be mindful not to create a lot of traffic on the national mesh during development.

## Telemetry, sensors & bots

At its roots, "MeshCore is a simple, secure, off-grid mesh communications system." Telemetry and automation get a back seat when it comes to airtime - **human communications always take priority.**

- **Experiment on a separate channel.** Limit your channel use and airtime during development.
- **Avoid auto-polling on the national network.** If it must be used, data should be on-demand only - not polled on a schedule.
- **Use of the national network must benefit the mesh.** An acceptable example: a single bot auto-replying to test messages in the dedicated `#testing` channel.
- **Avoid the Public channel for automation.** Community consensus must be reached before any automation is permitted there.
- **Never use FLOOD request paths for data.** A flood path ties up every repeater on the national mesh. Use a specific path - max 2 hops along the linear NZ backhaul, zero hops recommended.
- **If polling is required:** no more than 5 sensors adjacent to a path endpoint node, and no more than 2 polls in any 24-hour period. Push/activation-triggered data is always preferred - but keep activations important and high value. A door sensor on your high-site equipment room is worth transmitting; a driveway alert hundreds of kilometres from anyone who could act on it is not.

:::caution
If your use case doesn't clearly benefit the mesh community, reconsider whether the national network is the right place for it.
:::

## Keep firmware up to date

Outdated firmware on a node you operate can cause issues for everyone routing through it.

- Nodes running v1.13.0 or older will **silently drop** 2-byte and 3-byte packets.
- Subscribe to MeshCore release notes so you know when updates land.
- After updating, verify your node is still appearing and routing correctly.

## Communicate, collaborate & have fun

The national network is a loosely coordinated effort - no central authority dictates how it grows. The quality of the network is a direct reflection of how well the community works together.

- Introduce yourself - let people know where you are and what you're running.
- Share knowledge freely: antenna setups, site experiences, configuration tips.
- Experimenting with something new? Document it and share the results - good or bad.
- Help newer builders - you were there once too.

:::tip
A network built by people who know each other is far more resilient than one built by strangers.
:::

## Keep public chat appropriate

The mesh is a public space with a broad audience - young and old, technical and non-technical. Conduct yourself as you would in any public place. Keep out of public channels:

- **Politics** - divisive political discussion has no place on a shared communications network.
- **War and conflict** - commentary on conflicts or acts of violence.
- **Illegal activity** - discussion of, or coordination around, anything unlawful.
- **Sexual content** - any content of a sexual nature.

:::caution
If you wouldn't say it loudly in a room full of strangers of all ages, don't send it on the public mesh.
:::

## Respect privacy and security

The mesh can carry sensitive communications. Don't intercept, replay, or tamper with traffic that isn't yours.

- Don't publish or share private keys - ever.
- Don't run nodes or tools designed to disrupt or monitor other operators' traffic.
- If you find a security issue, report it privately to the affected operator first.
