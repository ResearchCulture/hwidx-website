---
layout: page.njk
title: The hwidx link checker
---

# The hwidx link checker

hwidx.org exists so that the short identifiers printed on hardware keep working. When someone follows one, our router sends them on to the device's documentation. If that documentation has moved or gone offline, the identifier would otherwise lead the visitor to an error page, so the [router](/router/) occasionally checks that the link still answers. If it doesn't, the visitor is brought to the device's [metapage](/what-is-link-rot) instead, with a note saying why.

If you run a site that hwidx.org links to, you may see this checker in your logs. This page explains what it does.

## What it is not

The link checker is **not a crawler, scanner or scraper**. It does not follow links, read or store your page content, or look at any page other than the single address an hwidx identifier points to. It does not probe for vulnerabilities, and it does not run on a schedule of its own.

## When it checks

- **Only for real visitors.** A check only happens when a person follows an hwidx.org identifier that points at your page. Identifiers nobody visits are never checked.
- **At most once every 24 hours per link.** After a check, the result is reused for the next 24 hours (the current setting, which may change), however many people follow the link. A busy identifier produces one request a day, not one per visitor.
- **One request each time.** A single `GET` request, with a short timeout. The response body is never read; only the status and a few headers are looked at, then the connection is closed.
- **Not stacked up.** If several visitors arrive while a check is running, they share that one check.

The router remembers its results across restarts, so restarting it does not trigger a round of checks.

## How it identifies itself

Requests carry this user agent:

```
hwidx-linkcheck/1.0 (+https://m.hwidx.org/link-checker/)
```

Look for `hwidx-linkcheck` in your logs. Requests come from the machine that runs the hwidx.org router.

## What counts as working

- **Working:** any success (2xx) or redirect (3xx) response. Redirects are not followed, since a redirect already shows the address is alive. If the page's headers change between checks, hwidx.org keeps sending visitors to you.
- **Not working:** an error response (4xx or 5xx), or no answer at all (the server can't be found, refuses the connection or takes too long).

While a link is not working, visitors to its identifier see the metapage and a message explaining that the documentation isn't responding. The next check after 24 hours will notice when the page is back, and visitors then go straight through again.

If your server answers our checks with an error such as 403 (for example because a firewall rejects unfamiliar user agents) while it works for ordinary browsers, your pages will look broken to us and visitors will be sent to the metapage. Allowing the user agent above avoids that.

## Blocking or allowing the checker

You can allow or block `hwidx-linkcheck` in your server or firewall like any other user agent. For example, to turn it away in nginx:

```
if ($http_user_agent ~* "hwidx-linkcheck") { return 403; }
```

Please note that blocking it will make your link look broken, and visitors will be sent to the metapage rather than to you. If you would rather we didn't check a particular link at all, [open an issue on GitHub](https://github.com/ResearchCulture/hwidx/issues) and we will look at it.
