---
title: Ping & Path Bots
description: "The trigger words and reply format used by regional path bots in the NZ #testing channel."
sidebar:
  order: 6
---

Ping and path bots answer a trigger word in the `#testing` channel with the route your message took to reach them. They are how you find out whether your node can reach a region, how many repeaters it went through, and which ones.

One path bot per region. All of them live in `#testing` - see [Channels](/community/channels/) for how to join it.

## Using a bot

Send `!bot` to `#testing`. Every bot in range answers with its own trigger word:

```
@[Your Node] Use "wre" for Whangarei
```

Then send that trigger word on its own to get a path report:

```
@[Your Node] 🦈=2 🦘=3 🛣️=1942, 0C37, E6D1
```

The markers are the bot owner's choice. Some use text instead, with the same fields:

```
@[Your Node] hash=2 hops=3 path=1942, 0C37, E6D1
```

The values change with the path. From a sender using 1-byte paths:

```
@[Your Node] 🦈=1 🦘=3 🛣️=CF, AB, 59
```

## Reading the reply

Every reply opens with `@[Your Node]` - your node name, so your client knows the reply is for you. Then three fields, in whichever marker set the bot uses:

| Marker | Text    | Meaning                                                                                                                                   |
| ------ | ------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 🦈     | `hash=` | Path hash size in bytes - how many bytes identify each repeater in the path. Matches the [1/2/3-byte prefix modes](/guides/hex-prefixes/) |
| 🦘     | `hops=` | Hops: how many repeaters the message passed through on its way to the bot                                                                 |
| 🛣️    | `path=` | The path itself, in order - the hex prefix of each repeater the message went through                                                      |

So `🦈=2 🦘=3 🛣️=1942, 0C37, E6D1`, or `hash=2 hops=3 path=1942, 0C37, E6D1`, means three hops, identified by 2-byte prefixes, via repeaters `1942`, `0C37`, then `E6D1`.

:::tip
The hex prefixes in the path are the same ones you can look up with the [NZ Prefix Tool](https://meshcore.baird.io/#/analytics?tab=prefix-tool) to find out which repeater is which.
:::

## Regional bots

Listed north to south.

| Trigger      | Region       | Software    | Owner                                               |
| ------------ | ------------ | ----------- | --------------------------------------------------- |
| `wre`        | Whangarei    | OwlShack    | <br />                                              |
| `akl`        | Auckland     | OwlShack    | [🐶Wes](https://meshcore.baird.io/#/nodes/c0c5414e) |
| `hlz`        | Hamilton     | Custom      | <br />                                              |
| `tga`        | Tauranga     | OwlShack    | <br />                                              |
| `npl`        | New Plymouth | meshcore-ha | <br />                                              |
| `wlg`        | Wellington   | OwlShack    | <br />                                              |
| `wlg karori` | Wellington   | OwlShack    | [be1a](https://meshcore.baird.io/#/nodes/bcb02909)  |

:::note
Community stub - this list is incomplete. Running a regional bot that's missing? [Add it](/community/contributing/), in its place north to south.
:::

Trigger words follow the same IATA-code scheme proposed for [regions](/community/channels/#regions).

## Writing a bot

If you are building or configuring one, match this pattern - people rely on the fields being the same everywhere. The markers are yours to choose; the fields and their order are not.

**Respond to `!bot`** with your trigger word and region name:

```
@[<Sender Name>] Use "<Regional Code>" for <Regional Name>
```

**Respond to your trigger word** with the path report:

```
@[<Sender Name>] 🦈=<Path hash size in bytes> 🦘=<Hops from sender to bot> 🛣️=<Path the message took>
```

or with text markers:

```
@[<Sender Name>] hash=<Path hash size in bytes> hops=<Hops from sender to bot> path=<Path the message took>
```

Pick one set and stay with it, so your region's replies look the same every time.

Reply at the **same path hash size the sender used**. A node testing on 1-byte paths needs a 1-byte answer to compare against; converting it to 2-byte makes the reply useless for the thing the sender was trying to measure. This is the single most important detail - check your bot software does it before you deploy.

Beyond that, the [rules for every bot](/bots/overview/) apply: one short reply per trigger, and nothing sent unprompted. Channel messages flood by nature, so every reply is carried by the whole mesh - that is what makes a chatty bot expensive.
