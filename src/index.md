{% extends 'base.njk' %}

{% block content %}
An open organization that helps create stable, consistent, and shareable identifiers for [artifacts](/what-is-an-artifact) deployed at moderate to large scales.
We aim to align to the [DOI](https://www.doi.org/) style identifiers described in ISO 26324, but are not strictly bound by this standard.
These identifiers make it easy to uniquely recognize and reference artifacts anywhere. Think of them as forwarding addresses for hardware documentation.

[Link Rot](/what-is-link-rot) is still a problem, even when authors have the best intentions of keeping the URLs stable. Web frameworks change, pages get updated and content gets moved or updated and the addresses printed on a device drift to unusability, leaving users to guess or search for what a device is, and how it should be used.

## Features

**Single**
: A one-to-one mapping between an Artifact and its documentation

**Stable**
: Once allocated, an identifier can _never change_ and will refer to that specific artifact for all time

**Open**
: Anyone can request an identifier and the index is freely available

## How do I get a hwidx.org identifier?

We manage the index through out [Github Repository](https://github.com/ResearchCulture/hwidx) which has more detailed instructions on requesting an identifier, but in brief simply raising a [pull request](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-pull-requests) with your information in YAML format is usually enough.

Once we have your pull request, one of our reviewers will either merge your identifier into the index, ask any follow up questions, or request any specific changes to comply with our identifier requirements.

## I have a hwidx.org identifier - How should I display it on my "Artifact"?

The suggested format is to use a QR code surrounded by a solid border, with either the top or bottom border containing a short-form URL (without https://) of the same hwidx address contained in the QR code.

![An example of the hwidx.org QR](/assets/img/example-hwidx-1.png)

This is to allow for both automatic identification through the QR code, and to allow anyone without a QR reader to access the same URL through the text. However, this is just a suggestion (albeit a strongly recommended one) and integration into other logomarks and designs is also permissable.

The above design was created using [qrcodeonly.com/](https://qrcodeonly.com/) in its 'link' mode, then downloaded into [KiCAD](https://www.kicad.org/) to be converted into a silkscreen element on the PCB.

## I have a hwidx.org identifier - How do I use it?
Identifiers are the URL you use to access the linked resource. Simply visit `hwidx.org/` with the identifier appended to be taken to the current forward URL.

For example, if I have the identifier `10.100/1234` visiting the address `hwidx.org/10.100/1234` will take you to the correct URL.

We also provide a metadata record service through `m.hwidx.org` which uses the same path, in this case `m.hwidx.org/10.100/1234` which can be used as a device ['vcard'](https://en.wikipedia.org/wiki/VCard) of sorts.

## Example items in the index

<table>
<thead>
    <tr>
        <th>hwidx</th>
        <th>Title / Name</th>
        <th>Organisation</th>
        <th>Group</th>
    </tr>
</thead>
<tbody>
{%- for key, entity in hwidx | dictsort -%}
<tr>
    <td>
        <a href="/{{ entity._hwidx_key }}">{{ entity._hwidx }}</a>
    </td>
    <td>{{ entity.name }}</td>
    <td>
        {%- if entity.org and entity.org.name and entity.org.url -%}
            <a href={{ entity.org.url }}>{{ entity.org.name }}</a>
        {%- elif entity.org and entity.org.name -%}
            {{ entity.org.name }}
        {%- elif entity.org and entity.org.url -%}
            <a href={{ entity.org.url }}>{{ entity.org.url }}</a>
        {%- endif -%}
    </td>
    <td>
        {%- if entity.group and entity.group.name and entity.group.url -%}
            <a href={{ entity.group.url }}>{{ entity.group.name }}</a>
        {%- elif entity.group and entity.group.name -%}
            {{ entity.group.name }}
        {%- elif entity.group and entity.group.url -%}
            <a href={{ entity.group.url }}>{{ entity.group.url }}</a>
        {%- endif -%}
    </td>
</tr>
{%- endfor -%}
</tbody>
</table>

{% endblock content %}