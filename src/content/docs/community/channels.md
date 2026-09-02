---
title: Channels
description: Public and hashtag channels in use on the NZ MeshCore network.
sidebar:
  order: 3
---

Channels are shared chat rooms on the mesh. Everyone using the same channel name (and key) sees the same messages.

## Channel types

| Type | How it works | Typical use |
| --- | --- | --- |
| Public | The default channel, built into every device | General chat, saying hello |
| Hashtag | Named channels like `#testing` - the key is derived from the name, so anyone who adds the same name joins the same channel | Topic or region chat |
| Private | Shared secret key, only holders of the key can read | Small groups, families, clubs |

:::caution
Treat Public and hashtag channels as public spaces. Repeaters, observers, and internet-connected tools may all hear them. See [MeshCore Etiquette](/community/etiquette/) for conduct guidelines.
:::

## Current NZ channels

| Channel | Purpose |
| --- | --- |
| Public | General nationwide chat |
| `#testing` | Connection testing and bots. Send `!bot` to find which bots you can reach - standard ones include `akl`, `hlz`, `wre`, `tga` |
| `#emergency` | Emergency communications |
| `#weather` | Weather reports and warnings |
| `#alerts` | Notices that matter to the mesh community |
| `#jokes` | Keep it light (and appropriate) |
| `#ham` | Ham radio chat |
| `#quakealerts` | NZ wide earthquakes notficattions as the come in from GeoNet |
| `#wlg-weather` | Wellington, Kapiti, and Blenheim weather forecasts at 6am & 7pm + realtime Metservice alerts |
| `#wlg-marine` | Wellington marine forecast, tides, and current sea temp at 5am & 12pm daily |



Know of a channel that's missing? [Add it](/community/contributing/).

## Regions

NZ doesn't use [regions](https://docs.meshcore.io/cli_commands/#region-examples) yet - how to structure them is currently under discussion in the community.

The current idea is a hierarchy of country, island, then town/city using IATA codes:

- `nz`
  - `ni` - North Island
    - `wre` - Whangarei
    - `akl` - Auckland
    - `hlz` - Hamilton
    - `tga` - Tauranga
    - etc.
  - `si` - South Island
    - `nsn` - Nelson
    - `chc` - Christchurch
    - `dud` - Dunedin
    - `zqn` - Queenstown
    - `ivc` - Invercargill
    - etc.

Want to weigh in? Join the discussion in the [NZ Discord thread](https://discord.com/channels/1495203904898728149/1495412712505606315) or the [Facebook group](https://www.facebook.com/groups/meshcorenz).
