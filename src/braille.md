---
layout: page.njk
title: Braille on PCBs
---

# Braille on PCBs

An hwidx identifier can be read by touch as well as by sight. Every device's metapage, and the [QR code generator](/make-a-qr-code/), shows the identifier's short address in braille, ready to be built into a circuit board as raised dots alongside the printed address and QR code.

For example, `hwidx.org/2/1/1.0` becomes:

<p class="braille-strip"><span class="braille" role="img" aria-label="hwidx.org/2/1/1.0 in braille">⠰⠰⠓⠺⠊⠙⠭⠲⠕⠗⠛⠸⠌⠼⠃⠸⠌⠼⠁⠸⠌⠼⠁⠲⠚</span></p>

## How raised solder braille works

Solder only sticks to bare copper. If the solder mask is opened in small circles over copper, laid out in the braille dot pattern, then wave soldering fills each opening with a rounded bead of solder. The result is a row of raised dots that can be felt, made in the same pass that solders the rest of the board.

1. Open the device's metapage (or the QR code generator) and choose **Download SVG (1:1 mm)**. The SVG is drawn at true size in millimetres, with one filled circle per dot.
2. In your PCB design tool, import the SVG onto the side of the board that goes through the wave, twice at the same position: once on the copper layer and once on the solder mask layer, so every dot becomes an exposed copper pad. In KiCad, use **File → Import → Graphics…** with a scale of 1, once for `B.Cu` and once for `B.Mask` (or `F.Cu` and `F.Mask`).
3. Keep the dots clear of components, vias, tracks and the board edge. They don't need to connect to any net.
4. Print the same short address on the silkscreen next to the dots, and keep the QR code nearby, so sighted readers and phones can use the identifier too.
5. Order a test board first, and check how the dots feel with braille readers before using it in production.

## Size

The dots follow standard braille spacing:

| Measurement | Size |
| --- | --- |
| Dot spacing within a cell | 2.5 mm |
| Cell spacing (one character to the next) | 6.25 mm |
| Dot diameter (each mask opening) | about 1.56 mm |
| Height of a line of braille | about 6.6 mm |

Embossed paper braille dots are usually around half a millimetre high. Solder beads can come out lower than that, depending on the process and how much solder each pad takes up, which is why testing a sample board matters.

Braille takes more room than printed text: `hwidx.org/2/1/1.0` is 25 cells, a little over 15 cm long. Each page that offers the braille also shows its length, so you can plan space along a long edge of the board before you commit to it.

## How the address is written in braille

Addresses are transcribed in Unified English Braille (UEB), uncontracted, so each character is spelled out in full:

- The address starts with the grade 1 indicator ⠰⠰, which tells the reader that no contractions are used.
- Each number starts with the numeric indicator ⠼, followed by the letters a–j standing for the digits 1–0. A full stop inside a number keeps it going, so `0.9` is ⠼⠚⠲⠊.
- The slash is written as two cells, ⠸⠌. The full stop is ⠲ and the hyphen is ⠤.
- A letter from a to j straight after a digit, as in `1a`, gets the ⠰ indicator so it isn't read as another digit.

The dots are drawn with the public domain [Braille CC0](https://creativecommons.org/publicdomain/zero/1.0/) font.
