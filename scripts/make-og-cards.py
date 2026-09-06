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

# Fonts are looked up rather than hard-coded: this project is written on
# Windows and built on Linux, and the original absolute DejaVu paths meant the
# script only ran on one of them. Each entry is tried in order and the first
# that exists wins. The Windows fallbacks (Georgia, Segoe UI) are the same
# faces the site's own --font-body / --font-ui stacks fall back to, so a card
# regenerated on either machine still looks like the site.
def _font(*candidates):
    for path in candidates:
        if os.path.exists(path):
            return path
    raise SystemExit(
        "No usable font found. Tried:\n  " + "\n  ".join(candidates) +
        "\nInstall DejaVu (Linux: fonts-dejavu-core) or add a path above."
    )


SERIF_B = _font("/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf",
                "C:/Windows/Fonts/georgiab.ttf")
SERIF = _font("/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf",
              "C:/Windows/Fonts/georgia.ttf")
SANS = _font("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
             "C:/Windows/Fonts/segoeui.ttf")
SANS_B = _font("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
               "C:/Windows/Fonts/seguisb.ttf")

MARGIN = 90

# One share card per section of the site. Colours are pulled from the era
# palette above so the whole set reads as one family rather than ten unrelated
# images: (slug, kicker, title, subtitle, accent).
SECTIONS = [
    ("history", "The chronicle", "The history, era by era",
     "Six eras from 1469 to today, each entry tied to its sources.", "#b45309"),
    ("map", "Where it happened", "The Atlas",
     "Every event in the history, plotted where it happened.", "#1e3a5f"),
    ("people", "The index of people", "The ten Gurus, and those who followed",
     "Five centuries of the faith, told through the people who carried it.", "#b91c1c"),
    ("places", "On the ground", "The places the history happened",
     "Cities, gurdwaras and battlefields, each with the events it holds.", "#a16207"),
    ("faith", "Belief and practice", "The Faith",
     "Core beliefs, practices and values — from One God to the Rehat Maryada.", "#047857"),
    ("culture", "Lived tradition", "Culture & Heritage",
     "Sacred music, langar, language and script, and a global community.", "#6b21a8"),
    ("glossary", "Plain definitions", "Glossary",
     "Key terms with Gurmukhi, transliteration and a sourced definition.", "#0e7490"),
    ("nitnem", "Daily practice", "Daily Prayers",
     "The nitnem — the banis a Sikh reads each day, with a sourced note on each.", "#6d28d9"),
    ("library", "The bibliography", "Every source, in one place",
     "Each work this site cites, and how many entries rest on it.", "#4d7c0f"),
    ("paths", "Start here", "Reading paths",
     "Short curated routes through the chronicle, for a first visit.", "#be185d"),
]


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

    # One card per section. Detail pages are not given their own card on
    # purpose: 112 PNGs in /public to save a generic share image is a bad
    # trade. Instead event pages borrow their era's card (see events/[id].astro)
    # and everything else lands on its section card or the default.
    for slug, kicker, title, subtitle, colour in SECTIONS:
        card(title, subtitle, kicker, colour, os.path.join(og, f"{slug}.png"))
