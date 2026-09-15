---
title: CAP Alert Bots
description: Bots relaying Common Alerting Protocol warnings from MetService, Civil Defence and other official sources onto the NZ mesh.
sidebar:
  order: 7
---

:::note
Community stub - the channel and format are still being worked out. Help settle it in the [Discord](https://discord.com/channels/1495203904898728149/1495412712505606315) or the [Facebook group](https://www.facebook.com/groups/meshcorenz), then [write it up here](/community/contributing/).
:::

CAP bots relay official warnings onto the mesh - severe weather from MetService, Civil Defence emergency alerts, and similar sources. [Common Alerting Protocol](https://en.wikipedia.org/wiki/Common_Alerting_Protocol) is the open standard those agencies already publish in, so a bot can consume the feed directly rather than scraping a website.

A CAP bot speaks without being asked, which is fine so long as it does it somewhere that asked for it - an alert is worth nothing after the event. It is not a free pass on airtime.

## Where they belong

A dedicated channel, to be decided. Several channels already carry overlapping traffic - `#alerts`, `#weather`, `#quakealerts`, and regional ones like `#wlg-weather` - so part of the decision is whether CAP alerts fold into those or get their own. See [Channels](/community/channels/).

Not the Public channel.

## Guidelines

- **Official sources only.** A CAP bot relays what an agency published. It does not editorialise, summarise loosely, or forward things it read somewhere else.
- **Alerts only, never a feed.** Warnings and emergencies, not routine forecasts. If it goes out several times a day, it's a feed and it belongs on a regional weather channel.
- **One message per alert.** Short enough to arrive in one packet. Where it is, what it is, how bad, when.
- **No repeats.** Re-sending the same alert doubles the cost and teaches people to ignore it. Send updates only when the alert itself changes.
- **Keep it local.** A Northland flood warning has no business waking up Invercargill. MeshCore [regions](/community/channels/#regions) would be the natural way to scope this, but NZ isn't using them yet - so for now the only lever is the channel. A regional alert belongs on a regional channel, not a national one.
- **One bot per source, per region.** Two bots on the same MetService feed means every warning goes out twice.

:::caution
People may act on these. A bot that relays alerts is taking on a responsibility - make sure it fails silently rather than sending something wrong, and make sure it's clear who runs it.
:::

The [rules for every bot](/bots/overview/) apply here too.
