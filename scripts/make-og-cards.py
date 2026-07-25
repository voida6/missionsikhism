"""
Generate the static Open Graph share cards for Mission Sikhism.

Deliberately a one-off script rather than a build-time dependency: satori /
resvg-js ship platform-specific native binaries, and this project is developed
on Windows and built on Linux (Cloudflare). Baking flat PNGs into /public keeps
the build boring and portable.

Output: public/og/default.png  (site-wide card)
        public/og/era-<id>.png (one per era, tinted with that era's colour)
"""

from PIL import Image, ImageDraw, ImageFont
import os

W, H = 1200, 630

# Tokens lifted from src/styles/global.css so the cards stay in the same world
# as the site itself.
BG = "#f7f2e7"
INK = "#24211a"
INK_2 = "#4e483c"
MUTED = "#7a7263"
ACCENT = "#d97706"
BORDER = "#cfc4a9"

# Era colours, in chronological order — the same sequence as the chronicle
# ribbon that runs across the top of every entry page.
ERAS = [
    ("guru-period", "#b45309", "Era 1 — The Guru Period"),
    ("sovereignty-banda-singh", "#b91c1c", "Era 2 — Sovereignty & Banda Singh"),
    ("misl-period", "#a16207", "Era 3 — The Misl Period"),
    ("sikh-empire", "#1e3a5f", "Era 4 — The Sikh Empire"),
    ("singh-sabha-reform", "#047857", "Era 5 — The Singh Sabha Reform"),
    ("modern-era", "#6b21a8", "Era 6 — The Modern Era"),
]

SERIF_B = "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf"
SERIF = "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf"
SANS = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
SANS_B = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

MARGIN = 90


def rounded(d, box, r, fill):
    d.rounded_rectangle(box, radius=r, fill=fill)


def card(title, subtitle, kicker, accent, out):
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)

    # Top rule — the site's own header border, in this card's accent colour.
    d.rectangle([0, 0, W, 12], fill=accent)

    # Brand mark: the favicon's geometry (deep-blue tile, saffron circle and
    # vertical stroke), drawn rather than rasterised so it stays crisp.
    m = 78
    mx, my = MARGIN, 96
    rounded(d, [mx, my, mx + m, my + m], 16, "#1e3a5f")
    cx, cy = mx + m / 2, my + m / 2
    r = m * 0.22
    d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=ACCENT, width=6)
    d.line([cx, my + m * 0.12, cx, my + m * 0.88], fill=ACCENT, width=6)

    f_brand = ImageFont.truetype(SERIF_B, 40)
    d.text((mx + m + 26, my + m / 2), "Mission Sikhism", font=f_brand,
           fill=INK, anchor="lm")

    # Kicker — era name, or the site's promise on the default card.
    y = 258
    if kicker:
        f_k = ImageFont.truetype(SANS_B, 22)
        d.text((MARGIN, y), kicker.upper(), font=f_k, fill=accent)
        y += 46

    # Title, wrapped by measured width rather than character count.
    f_t = ImageFont.truetype(SERIF_B, 62)
    words, lines, line = title.split(), [], ""
    for w in words:
        trial = (line + " " + w).strip()
        if d.textlength(trial, font=f_t) > W - MARGIN * 2 and line:
            lines.append(line)
            line = w
        else:
            line = trial
    lines.append(line)
    for ln in lines[:3]:
        d.text((MARGIN, y), ln, font=f_t, fill=INK)
        y += 76

    # Subtitle
    y += 14
    f_s = ImageFont.truetype(SERIF, 30)
    words, lines, line = subtitle.split(), [], ""
    for w in words:
        trial = (line + " " + w).strip()
        if d.textlength(trial, font=f_s) > W - MARGIN * 2 - 40 and line:
            lines.append(line)
            line = w
        else:
            line = trial
    lines.append(line)
    for ln in lines[:2]:
        d.text((MARGIN, y), ln, font=f_s, fill=INK_2)
        y += 42

    # Chronicle ribbon along the foot — the site's core motif: one continuous
    # 550-year story, six eras. The current era's segment is full height.
    rib_y, rib_h, gap = H - 74, 16, 6
    span = W - MARGIN * 2
    seg = (span - gap * (len(ERAS) - 1)) / len(ERAS)
    x = MARGIN
    for _, colour, _label in ERAS:
        # The default card speaks for the whole chronicle, so every era stays
        # at full strength; an era card raises its own and quietens the rest.
        on = (kicker is None) or (colour == accent)
        h = rib_h if on else rib_h - 6
        top = rib_y + (0 if on else 3)
        d.rounded_rectangle([x, top, x + seg, top + h], radius=3,
                            fill=colour if on else colour + "")
        if not on:
            # Quieten the eras that aren't this card's, without losing the arc.
            ov = Image.new("RGBA", (int(seg) + 1, h + 1), BG + "aa")
            img.paste(Image.alpha_composite(
                img.crop((int(x), top, int(x + seg) + 1, top + h + 1)).convert("RGBA"), ov
            ).convert("RGB"), (int(x), top))
        x += seg + gap

    f_f = ImageFont.truetype(SANS, 21)
    d.text((MARGIN, H - 38), "1469", font=f_f, fill=MUTED)
    d.text((W - MARGIN, H - 38), "Today", font=f_f, fill=MUTED, anchor="ra")

    os.makedirs(os.path.dirname(out), exist_ok=True)
    img.save(out, "PNG", optimize=True)
    print(out, os.path.getsize(out) // 1024, "KB")


if __name__ == "__main__":
    root = os.environ.get("SITE_ROOT", ".")
    og = os.path.join(root, "public", "og")

    card(
        "A history of the Sikh faith, told with its sources",
        "1469 to today — every fact tied to a citation, free to read.",
        None, ACCENT, os.path.join(og, "default.png"),
    )

    for era_id, colour, label in ERAS:
        card(
            label.split("—")[1].strip(),
            "Part of one continuous chronicle, from Guru Nanak to the present day.",
            label.split("—")[0].strip(), colour,
            os.path.join(og, f"era-{era_id}.png"),
        )
