---
title: Bots on the NZ Mesh
description: The kinds of bots running on the New Zealand MeshCore network, where they belong, and the rules for adding one.
sidebar:
  order: 5
---

A bot is an automated node that replies without a human involved. Used well, bots make the mesh easier to test and give people early warning of things that matter. Used badly, they are airtime nobody asked for - on a shared, limited-bandwidth medium that cost is paid by everyone in range.

New Zealand runs two kinds:

| Kind                                      | What it does                                                        | Where it lives                    |
| ----------------------------------------- | ------------------------------------------------------------------- | --------------------------------- |
| [Ping & path bots](/bots/ping-path-bots/) | Reply to a trigger word with the path your message took to reach it | `#testing`                        |
| [CAP alert bots](/bots/cap-bots/)         | Relay official alerts from MetService, Civil Defence and similar    | Dedicated channel - to be decided |

Anything else is not an established pattern on the national mesh. Talk to the community first.

## The rules

These apply to every bot, of every kind.

- **Don't crowd a region.** A region can run a path bot, a CAP bot, a weather bot, and more than one path bot where the coverage earns it - four path bots to a region is about the practical limit. Each one needs a trigger nobody else is using and a listing on its page saying where it is and who runs it. Check what already exists before you deploy.
- **Ask before you deploy.** Raise it in the [Discord](https://discord.com/channels/1495203904898728149/1495412712505606315) or the [Facebook group](https://www.facebook.com/groups/meshcorenz) first. Coordination is the whole point - see [Etiquette](/community/etiquette/).
- **Stay on the dedicated channel.** Ping and path bots belong in `#testing`. Never automate on the Public channel without community consensus.
- **Something has to trigger it.** A message, an alert feed, or a schedule are all legitimate triggers - a path bot answers a message, a CAP bot answers a feed, a regional weather bot can run to a clock. What is not legitimate is a bot talking on a channel that did not ask for it. Anything that speaks unprompted needs a channel set up for it, and putting it on a standard channel takes full community consensus.
- **One short reply per trigger.** Everything the sender needs in a single message.
- **Remember that every channel message floods.** A channel message has no single destination, so it cannot be path-routed - it goes out flood and every repeater that hears it rebroadcasts it. That is the real cost behind the rule above: a bot that answers twice has flooded the mesh twice. Where a bot does send a direct message, use a specific path rather than flood.
- **Human communications take priority.** If your bot is competing with people talking to each other, your bot is wrong.

:::tip
Running something just for yourself? Use your own channel. If it takes up much airtime, move it to another frequency.
:::

## Running one well

Bots are nodes, so [Etiquette](/community/etiquette/) applies: an accurate location and a unique [hex prefix](/guides/hex-prefixes/). Naming is where they differ - a repeater wants a descriptive name, a bot wants a short one.

- **Keep the name short.** A node name is transmitted, so every character costs airtime. The trigger word alone (`wre`) or the trigger plus `bot` (`Wre Bot`) is plenty - people already know where it is from the code. `Wre Bot Whangarei` is wasted bytes.
- Keep it up. A bot that answers half the time teaches people the wrong thing about their link quality.
- Keep firmware and bot software current, and watch what it actually sends - a loop that retries on failure can saturate a channel fast.
- Say who runs it. When it misbehaves, people need to know who to tell.

## Software

The technology doesn't matter. Following the pattern does - see [Ping & path bots](/bots/ping-path-bots/) for the exact message format.

What people run in New Zealand:

| Software                                                   | Notes                                                                    |
| ---------------------------------------------------------- | ------------------------------------------------------------------------ |
| [OwlShack](https://github.com/meshcore-go/OwlShack)        | Runs companion and repeater nodes; auto-responders live on its Bots page |
| [meshcore-ha](https://github.com/meshcore-dev/meshcore-ha) | Home Assistant integration; bots are built as HA automations             |
| Custom code                                                | Several regions run their own                                            |

:::note
Community stub - running something that isn't listed? [Add it](/community/contributing/).
:::
