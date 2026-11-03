---
layout: page.njk
title: The hwidx router
---

# The hwidx router

Every hwidx identifier, like `hwidx.org/1/0/0.9`, is handled by the **hwidx router**. It looks the identifier up in the [open dataset](https://github.com/ResearchCulture/hwidx) and sends the visitor on with a temporary (302) redirect, so the identifier printed on a device can keep working even when the documentation it points to moves.

## Where an identifier goes

- **To the device's documentation**, when the entry has a documentation address and that address is working.
- **To its metapage** on this site, when the entry has no documentation address yet, is marked as pending, or its documentation address isn't responding. The metapage lists everything the index knows about the device.
- **To the metapage for a group**, when the identifier is an organisation, a device or any other part of the index with entries below it (for example `hwidx.org/1` or `hwidx.org/1/0`).
- **Nowhere**, if the identifier isn't in the index. The router answers with a 404.

## Checking links

The router occasionally checks that documentation addresses still answer. When one doesn't, visitors are brought to the metapage with a note explaining why, rather than to an error page. It checks at most once every 24 hours per link, and only when a real visitor follows it. [Read how the link checker works](/link-checker/), including how to recognise or block it.

## Usage counts

The router counts how often each identifier sends visitors to documentation or to its metapage, over the current day, week and month. Only the counts are kept, not who visited. They appear on each metapage.

## Open data

The same dataset the router uses is available as JSON at [`/api/v1/`](/api/v1/popular), for example `/api/v1/1/0/0.9` for one entry, and `/api/v1/catalog` and `/api/v1/search?q=` for listings. It can be read from any origin.

### Rate limits

The API is free to use, but requests from outside this website are limited to **300 per IP address every 15 minutes** (the current setting, which may change). Go over and you will get a `429` response with a JSON error until the window passes; the `RateLimit-*` response headers say how many requests you have left and when the count resets. Responses may be cached for a minute, so repeating the same request straight away is rarely needed. If you need to read a lot of the index, please take a copy of the [dataset](https://github.com/ResearchCulture/hwidx) rather than calling the API for every entry.

The redirects themselves (`hwidx.org/<identifier>`) have their own, lower limit of 100 requests per IP every 15 minutes.
