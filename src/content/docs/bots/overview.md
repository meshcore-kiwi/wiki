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

- **One bot per region.** Two bots answering the same trigger in the same area doubles the traffic and halves the usefulness. Check what already exists before you deploy.
- **Ask before you deploy.** Raise it in the [Discord](https://discord.com/channels/1495203904898728149/1495412712505606315) or the [Facebook group](https://www.facebook.com/groups/meshcorenz) first. Coordination is the whole point - see [Etiquette](/community/etiquette/).
- **Stay on the dedicated channel.** Ping and path bots belong in `#testing`. Never automate on the Public channel without community consensus.
- **Reply only when triggered.** No scheduled chatter, no polling, no unsolicited status messages. CAP bots are the exception and only because alerts are event-driven.
- **One short reply per trigger.** Everything the sender needs in a single message.
- **Never reply on a FLOOD path.** A flood reply ties up every repeater in the country. Reply on the path the message arrived on.
- **Human communications take priority.** If your bot is competing with people talking to each other, your bot is wrong.

:::caution
If your bot doesn't clearly benefit the mesh community, the national network isn't the right place for it. A bot that only serves you belongs on your own channel.
:::

## Running one well

Bots are nodes, so [Etiquette](/community/etiquette/) applies: an accurate location and a unique [hex prefix](/guides/hex-prefixes/). Naming is where they differ - a repeater wants a descriptive name, a bot wants a short one.

- **Keep the name short.** A node name is transmitted, so every character costs airtime. The trigger word alone (`wre`) or the trigger plus `bot` (`Wre Bot`) is plenty - people already know where it is from the code. `Wre Bot Whangarei` is wasted bytes.
- Keep it up. A bot that answers half the time teaches people the wrong thing about their link quality.
- Keep firmware and bot software current, and watch what it actually sends - a loop that retries on failure can saturate a channel fast.
- Say who runs it. When it misbehaves, people need to know who to tell.

## Software

Most NZ bots run [OwlShack](https://github.com/meshcore-go/OwlShack), which handles the trigger matching and was the first bot in NZ able to report real path information and reply at the sender's own path hash size. Some regions run custom code, and some use meshcore-ha.

The technology doesn't matter. Following the pattern does - see [Ping & path bots](/bots/ping-path-bots/) for the exact message format.
