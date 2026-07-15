---
title: Observers
description: MQTT observers feeding NZ mesh traffic to maps, dashboards, and analysis tools.
sidebar:
  order: 4
---

Observers are software services that listen to MeshCore traffic and forward packets to internet tools - maps, dashboards, and analysers - usually over MQTT. They give the community visibility of the network: coverage, routing, and node health.

Observers are receive-only by design. They should **not** inject messages into the mesh, bridge internet chat onto LoRa, or automate replies back onto the radio network.

## NZ observer destinations

| Service | Host | Port | Transport | Auth | Format |
| --- | --- | --- | --- | --- | --- |
| LetsMesh | `mqtt-us-v1.letsmesh.net` | 443 | WebSockets + TLS | MeshCore auth token (Ed25519 JWT) | `meshcore/{IATA}/{PUBLIC_KEY}/packets` |
| MeshMapper | `mqtt.meshmapper.net` | 443 | WebSockets + TLS | MeshCore auth token (Ed25519 JWT) | `meshcore/{IATA}/{PUBLIC_KEY}/packets` |
| waev | `mqtt.waev.app` | 443 | WebSockets + TLS | MeshCore auth token (Ed25519 JWT) | `meshcore/{IATA}/{PUBLIC_KEY}/packets` |
| CoreScope | `meshcore-mqtt-1.baird.io` | 443 | WebSockets + TLS | MeshCore auth token (Ed25519 JWT) | `meshcore/{IATA}/{PUBLIC_KEY}/packets` |

- `{IATA}` is your nearest town or city's IATA code (`akl`, `hlz`, `wre`, `tga`, `chc`, ...) - the same codes proposed for [regions](/community/channels/#regions). It groups topics so tools can filter by area. `{PUBLIC_KEY}` is your observer node's public key.
- **LetsMesh**: see the [onboarding guide](https://analyzer.letsmesh.net/observer/onboard).
- **MeshMapper**: see the [config docs](https://wiki.meshmapper.net/mqtt-main/); the NZ map is at [nz.meshmapper.net](http://nz.meshmapper.net).
- **waev**: supports openHop, observer firmware, Python packet capture, Home Assistant, and meshcoretomqtt - the [setup guide](https://waev.app/#/connect) covers each.
- **CoreScope**: self-hosted by a community member at [meshcore.baird.io](https://meshcore.baird.io/). WebSocket path `/`, status topic `meshcore/{IATA}/{PUBLIC_KEY}/status`, JWT audience `meshcore-mqtt-1.baird.io`, TLS required.

## Notes

- Use observers to improve visibility of the mesh, not as another active node.
- Anything an observer hears may end up on the public internet - a good reason to [treat public channels as public](/community/channels/).
- Thinking of deploying a new public observer? Talk to the community first in the [NZ Discord thread](https://discord.com/channels/1495203904898728149/1495412712505606315).
