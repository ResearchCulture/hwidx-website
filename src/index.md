{% extends 'base.njk' %}

{% block content %}
An open organization that helps create stable, consistent, and shareable identifiers for [artifacts](/what-is-an-artifact) deployed at moderate to large scales.
These identifiers make it easy to uniquely recognize and reference artifacts anywhere. Think of them as forwarding addresses for hardware documentation.

[Link Rot](/what-is-link-rot) is still a problem, even when authors have the best intentions of keeping the URLs stable. Web frameworks change, pages get updated and content gets moved or updated and the addresses printed on a device drift to unusability, leaving users to guess or search for what a device is, and how it should be used.

## Features

**Single**
: A one-to-one mapping between an Artifact and its documentation. We strongly encourage that devices should include a version as their final identifier component to completely cement this.

**Stable**
: Once allocated, an identifier can _never change_ and will refer to that specific artifact for all time. 

**Open**
: Anyone can request an identifier and the index is freely available.

## How do I get a hwidx.org identifier?

We manage the index through our [Github Repository](https://github.com/ResearchCulture/hwidx) which has more detailed instructions on requesting an identifier, but in brief simply raising a [pull request](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-pull-requests) with your information in YAML format is usually enough.

Identifiers follow the format `/organisation-id/device-id/major.minor` where organisations and devices are represented by arbitrary integer identifiers (e.g., `/123/456/1.0`), and the version is a 2-digit major/minor version number. You can also include `index.yml` files in organization or device directories to provide shared context that will be inherited by all descendant identifiers. See [this organisation subtree on Github](https://github.com/ResearchCulture/hwidx/tree/main/2) for an example of how to do this.

We encourage the use of purely numeric identifiers for versions, but the standard also supports variations on this which may use additional specifiers, such as semver (1.2.3), or release formats (1.2-rc0), and others. The only expressly forbidden characters are the forward and back slashes (`/` and `\`).

Once we have your pull request, one of our reviewers will either merge your identifier into the index, ask any follow up questions, or request any specific changes to comply with our identifier requirements.

## I have a hwidx.org identifier - How should I display it on my "Artifact"?

The suggested format is to use a QR code with either the top or bottom (or both) borders containing a short-form URL (without https://) of the same hwidx address contained in the QR code.

![An example of the hwidx.org QR](/assets/img/example-hwidx-1.png)

This is to allow for both automatic identification through the QR code, and to allow anyone without a QR reader to access the same URL through the text. However, this is just a suggestion (albeit a strongly recommended one) and integration into other logomarks and designs is also permissable.

Every identifier metapage includes a number of reasonably high resolution samples which can be directly used on PCB silkscreens. The one used above matches [hwidx.org/2/1/1.0/](/2/1/1.0)

## I have a hwidx.org identifier - How do I use it?
Identifiers are the URL you use to access the linked resource. Simply visit `hwidx.org/` with the identifier appended to be taken to the current forward URL.

For example, if I have the identifier `/123/456/1.0` visiting the address `hwidx.org/123/456/1.0` will take you to the correct URL.

We also provide a metadata record service through `m.hwidx.org` which uses the same path, in this case `m.hwidx.org/123/456/1.0` which can be used as a device ['vcard'](https://en.wikipedia.org/wiki/VCard) of sorts.

## Artifacts in the Index

To view the full catalog of devices in the index, click the button below.

<div class="w-full flex justify-center">
    <a href="/catalog" class="button">The Device Catalog</a>
</div>

{% endblock content %}