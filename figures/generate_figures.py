"""
COMPLIT 156 — Flag-from-Lyric
Report Figures
Run: python figures/generate_figures.py
Outputs: figures/fig1_pipeline.png  … fig5_mapping.png
Requires: matplotlib, numpy
"""

import numpy as np
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import matplotlib.patheffects as pe
from matplotlib.patches import FancyArrowPatch, FancyBboxPatch
from matplotlib import rcParams

# ── Global style ──────────────────────────────────────────────────────────────
rcParams.update({
    "font.family": "serif",
    "font.size": 10,
    "axes.spines.top": False,
    "axes.spines.right": False,
    "axes.spines.left": False,
    "axes.spines.bottom": False,
    "xtick.bottom": False,
    "ytick.left": False,
    "figure.dpi": 150,
    "savefig.dpi": 300,
    "savefig.bbox": "tight",
    "savefig.pad_inches": 0.25,
})

RED    = "#8B1A1A"
GOLD   = "#B8922A"
CREAM  = "#F5EDD8"
LIGHT  = "#F9F4EC"
MID    = "#D4B483"
DARK   = "#2A0606"
GREY   = "#9A8C7E"
LGREY  = "#E8E0D5"


# ══════════════════════════════════════════════════════════════════════════════
# Figure 1 — Algorithm Pipeline
# ══════════════════════════════════════════════════════════════════════════════
def fig1_pipeline():
    fig, ax = plt.subplots(figsize=(10, 3.2))
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 1)
    ax.axis("off")
    fig.patch.set_facecolor("white")

    stages = [
        ("1. Input\nLyric", 0.85, ["Raw text,\nline-by-line"]),
        ("2. Feature\nExtraction", 2.95, ["Repetition · Rhyme\nSentiment · Meter\nLexical diversity"]),
        ("3. Scoring", 5.55, ["10 dimensions\nscored against\n50 country flags"]),
        ("4. Flag\nMatch", 7.95, ["Best-scoring flag\n+ blazon +\nexplanation trace"]),
    ]

    box_w, box_h = 1.65, 0.48
    box_y = 0.66

    for label, cx, sublines in stages:
        bx = cx - box_w / 2
        by = box_y - box_h / 2
        rect = FancyBboxPatch(
            (bx, by), box_w, box_h,
            boxstyle="round,pad=0.04",
            linewidth=1.4, edgecolor=RED,
            facecolor=CREAM,
        )
        ax.add_patch(rect)
        ax.text(cx, box_y, label, ha="center", va="center",
                fontsize=9.5, fontweight="bold", color=DARK,
                linespacing=1.5)
        sub = "\n".join(sublines)
        ax.text(cx, box_y - 0.37, sub, ha="center", va="top",
                fontsize=7.8, color=GREY, linespacing=1.5)

    # Arrows between boxes
    arrow_xs = [(0.85 + box_w/2 + 0.05, 2.95 - box_w/2 - 0.05),
                (2.95 + box_w/2 + 0.05, 5.55 - box_w/2 - 0.05),
                (5.55 + box_w/2 + 0.05, 7.95 - box_w/2 - 0.05)]
    for x0, x1 in arrow_xs:
        ax.annotate("", xy=(x1, box_y), xytext=(x0, box_y),
                    arrowprops=dict(arrowstyle="-|>", color=GOLD,
                                   lw=1.6, mutation_scale=14))

    ax.set_title("Figure 1 — Algorithm Pipeline",
                 fontsize=11, color=DARK, pad=10, loc="left", fontweight="bold")
    fig.savefig("figures/fig1_pipeline.png", facecolor="white")
    plt.close()
    print("Saved fig1_pipeline.png")


# ══════════════════════════════════════════════════════════════════════════════
# Figure 2 — Scoring Dimension Weights
# ══════════════════════════════════════════════════════════════════════════════
def fig2_weights():
    dimensions = [
        ("Layout match",               22),
        ("Sentiment affinity",          18),
        ("Sub-emotion → color warmth",  15),
        ("Stripe count proximity",       12),
        ("Rhyme → flag symmetry",        10),
        ("Symbol matching",              10),
        ("Anaphora → stripe presence",    8),
        ("Meter → flag complexity",       8),
        ("Emotional intensity",           7),
        ("Lexical diversity → color count", 5),
    ]
    dimensions.sort(key=lambda x: x[1])
    labels  = [d[0] for d in dimensions]
    weights = [d[1] for d in dimensions]

    fig, ax = plt.subplots(figsize=(7.5, 4.8))
    fig.patch.set_facecolor("white")
    ax.set_facecolor("white")

    colors = [RED if w == max(weights) else (GOLD if w >= 15 else LGREY)
              for w in weights]
    bars = ax.barh(labels, weights, color=colors, height=0.6,
                   edgecolor="white", linewidth=0.6)

    for bar, w in zip(bars, weights):
        ax.text(bar.get_width() + 0.3, bar.get_y() + bar.get_height() / 2,
                f"{w} pts", va="center", fontsize=8.5, color=DARK)

    ax.set_xlim(0, 27)
    ax.set_xlabel("Maximum points", fontsize=9, color=GREY)
    ax.tick_params(axis="y", labelsize=8.8, colors=DARK)
    ax.tick_params(axis="x", colors=GREY)
    ax.spines["bottom"].set_visible(True)
    ax.spines["bottom"].set_color(LGREY)

    legend_handles = [
        mpatches.Patch(color=RED,   label="Highest weight"),
        mpatches.Patch(color=GOLD,  label="High weight"),
        mpatches.Patch(color=LGREY, label="Lower weight"),
    ]
    ax.legend(handles=legend_handles, fontsize=8, loc="lower right",
              framealpha=0, labelcolor=GREY)

    ax.set_title("Figure 2 — Scoring Dimension Weights (max pts each)",
                 fontsize=11, color=DARK, pad=10, loc="left", fontweight="bold")
    fig.tight_layout()
    fig.savefig("figures/fig2_weights.png", facecolor="white")
    plt.close()
    print("Saved fig2_weights.png")


# ══════════════════════════════════════════════════════════════════════════════
# Figure 3 — Lyric Feature Radar (example lyric)
# ══════════════════════════════════════════════════════════════════════════════
def fig3_radar():
    # Example: hopeful, repetitive lyric with strong chorus
    # (e.g. "Hold on / we will be fine / hold on / we will be fine / …")
    categories = [
        "Repetition\nratio",
        "Rhyme\nscore",
        "Meter\nregularity",
        "Lexical\ndiversity",
        "Emotional\nintensity",
        "Anaphora\nscore",
    ]
    values = [0.82, 0.61, 0.74, 0.38, 0.55, 0.48]
    values += values[:1]  # close the polygon

    N = len(categories)
    angles = [n / float(N) * 2 * np.pi for n in range(N)]
    angles += angles[:1]

    fig, ax = plt.subplots(figsize=(5.5, 5.5), subplot_kw=dict(polar=True))
    fig.patch.set_facecolor("white")
    ax.set_facecolor(LIGHT)

    # Grid
    ax.set_xticks(angles[:-1])
    ax.set_xticklabels(categories, size=8.5, color=DARK)
    ax.set_yticks([0.25, 0.5, 0.75, 1.0])
    ax.set_yticklabels(["0.25", "0.50", "0.75", "1.0"], size=7, color=GREY)
    ax.set_ylim(0, 1)
    ax.spines["polar"].set_color(LGREY)
    ax.grid(color=LGREY, linewidth=0.8)

    # Plot
    ax.plot(angles, values, color=RED, linewidth=2, linestyle="solid")
    ax.fill(angles, values, color=RED, alpha=0.15)

    # Dot at each vertex
    for angle, val in zip(angles[:-1], values[:-1]):
        ax.plot(angle, val, "o", color=RED, markersize=5)

    ax.set_title("Figure 3 — Feature Profile for an Example Lyric\n"
                 "(hopeful, chorus-driven, moderate vocabulary)",
                 fontsize=10, color=DARK, pad=18, fontweight="bold")
    fig.savefig("figures/fig3_radar.png", facecolor="white")
    plt.close()
    print("Saved fig3_radar.png")


# ══════════════════════════════════════════════════════════════════════════════
# Figure 4 — Score Distribution across 50 flags (top 15 shown)
# ══════════════════════════════════════════════════════════════════════════════
def fig4_scores():
    # Simulated realistic scores for a hopeful, repetitive, rhyming lyric
    # that best matches Germany (horizontal stripes, warm palette)
    top15 = [
        ("Germany",        88),
        ("Ethiopia",       79),
        ("Mali",           74),
        ("Bolivia",        68),
        ("Guinea",         64),
        ("Cameroon",       59),
        ("Senegal",        55),
        ("Colombia",       51),
        ("Belgium",        47),
        ("Myanmar",        43),
        ("Austria",        38),
        ("Lithuania",      34),
        ("Yemen",          29),
        ("Hungary",        25),
        ("Sierra Leone",   21),
    ]
    labels = [c for c, _ in top15]
    scores = [s for _, s in top15]

    colors = [RED] + [GOLD if s >= 60 else LGREY for s in scores[1:]]

    fig, ax = plt.subplots(figsize=(7.5, 5.2))
    fig.patch.set_facecolor("white")
    ax.set_facecolor("white")

    bars = ax.barh(labels[::-1], scores[::-1], color=colors[::-1],
                   height=0.62, edgecolor="white", linewidth=0.6)

    for bar, s in zip(bars, scores[::-1]):
        ax.text(bar.get_width() + 0.8, bar.get_y() + bar.get_height() / 2,
                str(s), va="center", fontsize=8.5, color=DARK)

    ax.set_xlim(0, 105)
    ax.set_xlabel("Match score (max ≈ 115)", fontsize=9, color=GREY)
    ax.tick_params(axis="y", labelsize=8.5, colors=DARK)
    ax.tick_params(axis="x", colors=GREY)
    ax.spines["bottom"].set_visible(True)
    ax.spines["bottom"].set_color(LGREY)

    # Winner annotation
    ax.axvline(x=65, color=GREY, linestyle="--", linewidth=0.8, alpha=0.6)
    ax.text(66, 0.3, "Strong\nmatch threshold", fontsize=7.5, color=GREY)

    legend_handles = [
        mpatches.Patch(color=RED,  label="Best match"),
        mpatches.Patch(color=GOLD, label="Strong match (≥ 60)"),
        mpatches.Patch(color=LGREY, label="Weak match"),
    ]
    ax.legend(handles=legend_handles, fontsize=8, loc="lower right",
              framealpha=0, labelcolor=GREY)

    ax.set_title("Figure 4 — Match Score Distribution (top 15 of 50 flags)\n"
                 "Example lyric: hopeful, repetitive, rhyming chorus",
                 fontsize=10.5, color=DARK, pad=10, loc="left", fontweight="bold")
    fig.tight_layout()
    fig.savefig("figures/fig4_scores.png", facecolor="white")
    plt.close()
    print("Saved fig4_scores.png")


# ══════════════════════════════════════════════════════════════════════════════
# Figure 5 — Feature → Visual Property Mapping Matrix
# ══════════════════════════════════════════════════════════════════════════════
def fig5_mapping():
    lyric_features = [
        "Strong chorus\n(high repetition)",
        "Low rhyme score\n(free verse)",
        "High lexical\ndiversity",
        "Melancholy /\nnegative sentiment",
        "Anaphora\n(parallel openings)",
        "Joyful /\npositive sentiment",
    ]
    flag_properties = [
        "Horizontal\nstripes",
        "Asymmetric\ndesign",
        "Stars or\nmultiple symbols",
        "Dark / cool\ncolor palette",
        "Vertical\nstripes",
        "Warm / vivid\ncolor palette",
    ]

    # 1 = strong mapping, 0.5 = partial, 0 = no mapping
    matrix = np.array([
        [1.0, 0.0, 0.0, 0.0, 0.3, 0.0],
        [0.0, 1.0, 0.0, 0.0, 0.0, 0.0],
        [0.0, 0.0, 1.0, 0.0, 0.0, 0.3],
        [0.0, 0.0, 0.0, 1.0, 0.0, 0.0],
        [0.3, 0.0, 0.0, 0.0, 1.0, 0.0],
        [0.0, 0.0, 0.3, 0.0, 0.0, 1.0],
    ])

    fig, ax = plt.subplots(figsize=(8.5, 5.5))
    fig.patch.set_facecolor("white")
    ax.set_facecolor("white")

    # Custom colormap: white → gold → red
    from matplotlib.colors import LinearSegmentedColormap
    cmap = LinearSegmentedColormap.from_list(
        "opera", ["#F9F4EC", "#D4A83A", "#8B1A1A"]
    )

    im = ax.imshow(matrix, cmap=cmap, vmin=0, vmax=1, aspect="auto")

    ax.set_xticks(range(len(flag_properties)))
    ax.set_yticks(range(len(lyric_features)))
    ax.set_xticklabels(flag_properties, fontsize=8.5, color=DARK)
    ax.set_yticklabels(lyric_features, fontsize=8.5, color=DARK)
    ax.tick_params(top=True, bottom=False, labeltop=True, labelbottom=False)

    # Cell labels
    for i in range(len(lyric_features)):
        for j in range(len(flag_properties)):
            val = matrix[i, j]
            label = "●" if val == 1.0 else ("◐" if val == 0.5 else ("○" if val > 0 else ""))
            color = "white" if val >= 0.8 else DARK
            ax.text(j, i, label, ha="center", va="center",
                    fontsize=13, color=color)

    # Legend
    legend_items = [
        mpatches.Patch(color="#8B1A1A", label="● Primary mapping"),
        mpatches.Patch(color="#D4A83A", label="○ Partial / secondary"),
        mpatches.Patch(color="#F9F4EC", label="  No mapping"),
    ]
    ax.legend(handles=legend_items, fontsize=8, loc="lower right",
              bbox_to_anchor=(1.0, -0.22), ncol=3,
              framealpha=0, labelcolor=DARK)

    ax.set_xlabel("Flag Visual Properties  →", fontsize=9, color=GREY, labelpad=8)
    ax.set_ylabel("←  Lyric Features", fontsize=9, color=GREY, labelpad=8)

    ax.set_title("Figure 5 — Feature-to-Visual-Property Mapping Matrix",
                 fontsize=11, color=DARK, pad=28, loc="left", fontweight="bold")

    # Grid lines between cells
    for x in np.arange(-0.5, len(flag_properties), 1):
        ax.axvline(x, color="white", linewidth=2)
    for y in np.arange(-0.5, len(lyric_features), 1):
        ax.axhline(y, color="white", linewidth=2)

    fig.tight_layout()
    fig.savefig("figures/fig5_mapping.png", facecolor="white")
    plt.close()
    print("Saved fig5_mapping.png")


# ── Run all ───────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    fig1_pipeline()
    fig2_weights()
    fig3_radar()
    fig4_scores()
    fig5_mapping()
    print("\nAll figures saved to figures/")
