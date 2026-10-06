"""Render AutixAI's original silent workflow explainer (Pillow + FFmpeg).

Run from the project root: python scripts/render-workflow-film.py
This is a diagram animation, not a recording of a live customer system.
"""
from pathlib import Path
import math
import shutil
import subprocess
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
MEDIA = ROOT / "dist" / "media"
MEDIA.mkdir(parents=True, exist_ok=True)
W, H, FPS, DURATION = 960, 540, 24, 36
BG, INK, OLIVE, MUTED = "#ede6d6", "#3b2c21", "#566132", "#6f604f"
FONT = ROOT / "dist" / "fonts"
body = lambda size: ImageFont.truetype(str(FONT / "caviar-dreams-regular.ttf"), size)
bold = lambda size: ImageFont.truetype(str(FONT / "caviar-dreams-bold.ttf"), size)
heading = ImageFont.truetype(str(FONT / "cinzel-medium.ttf"), 31)
brand, label, copy, small, number = bold(26), bold(17), body(20), body(14), bold(16)
scenes = [
    ("An inquiry becomes a starting point.", "A website form captures the request and contact details.", "01 / CAPTURE", 0),
    ("Give the request useful context.", "AI organises the inquiry and drafts qualifying questions.", "02 / QUALIFY", 1),
    ("Keep your tools in the loop.", "A structured lead record reaches the connected CRM.", "03 / CONNECT", 2),
    ("A person makes the important call.", "Your team reviews the proposed next step before approval.", "04 / HUMAN REVIEW", 3),
    ("Move the conversation forward.", "The approved follow-up is queued. The team is notified.", "05 / FOLLOW UP", 4),
    ("Less busywork. More business.", "Fewer manual handoffs. Your people keep control.", "THE CONNECTED BUSINESS", 5),
]
nodes = [("Website", "inquiry"), ("AI", "qualification"), ("CRM", "record"), ("Human", "approval"), ("Follow-up", "+ team alert")]
base = Image.new("RGB", (W, H), BG)
d = ImageDraw.Draw(base)
for x in range(0, W, 80):
    d.line((x, 270, x + 130, H), fill="#e5dccb", width=1)
for y in range(300, H, 50):
    d.line((0, y, W, y), fill="#e5dccb", width=1)
d.text((52, 30), "autixai.", font=brand, fill=INK)
d.text((W - 52, 41), "ILLUSTRATIVE WORKFLOW", anchor="ra", font=small, fill=MUTED)
d.line((52, 81, W - 52, 81), fill="#bcab93", width=1)

def render(t):
    image = base.copy()
    draw = ImageDraw.Draw(image)
    scene = min(5, int(t / 6))
    title, subtitle, stage, active = scenes[scene]
    local = (t % 6) / 6
    draw.text((52, 106), stage, font=small, fill=OLIVE)
    draw.text((52, 141), title, font=heading, fill=INK)
    draw.text((52, 196), subtitle, font=copy, fill=MUTED)
    xs = [52 + i * 174 for i in range(5)]
    y = 276
    for i, x in enumerate(xs):
        done = i < active or active == 5
        selected = i == active
        fill = OLIVE if selected else "#dce0c6" if done else "#f5efdf"
        text = BG if selected else INK
        draw.rounded_rectangle((x, y, x + 148, y + 128), radius=12, fill=fill, outline=INK, width=1)
        draw.text((x + 17, y + 14), f"0{i+1}", font=number, fill=text)
        draw.text((x + 74, y + 56), nodes[i][0], anchor="ma", font=label, fill=text)
        draw.text((x + 74, y + 82), nodes[i][1], anchor="ma", font=small, fill=text)
        if done:
            draw.line([(x+118,y+21),(x+122,y+25),(x+130,y+16)], fill=OLIVE, width=2)
        if selected:
            pulse = 4 + int(2 * (1 + math.sin(t * 3)))
            draw.ellipse((x+121-pulse,y+22-pulse,x+121+pulse,y+22+pulse), fill="#b8c28c")
        if i < 4:
            draw.line((x+149,y+64,x+173,y+64), fill=OLIVE if done else "#bcab93", width=2)
    # A travelling signal connects each completed handoff to the next stage.
    if 0 < active < 5:
        start = xs[active-1] + 148
        packet_x = start + 26 * min(1, local * 3)
        draw.ellipse((packet_x-4,y+60,packet_x+4,y+68), fill=OLIVE)
    note = "Approval required before the next step" if active == 3 else "Illustrative example. Tailored to your tools and review needs."
    draw.text((W/2, 430), note, font=small, anchor="ma", fill=MUTED)
    draw.line((52, 486, W-52, 486), fill="#bcab93", width=2)
    draw.line((52, 486, 52+(W-104)*min(1,t/DURATION), 486), fill=OLIVE, width=3)
    draw.text((52, 500), "AI AUTOMATION + WORKFLOW INTEGRATIONS", font=small, fill=MUTED)
    draw.text((W-52, 500), f"{min(36,int(t)):02d} / 36 sec", font=small, anchor="ra", fill=MUTED)
    return image

ffmpeg = shutil.which("ffmpeg")
if not ffmpeg:
    raise SystemExit("FFmpeg must be available on PATH.")
command = [ffmpeg, "-hide_banner", "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "pipe:0", "-an", "-c:v", "libx264", "-preset", "medium", "-crf", "22", "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(MEDIA / "lead-workflow.mp4")]
process = subprocess.Popen(command, stdin=subprocess.PIPE)
try:
    for frame in range(FPS * DURATION):
        process.stdin.write(render(frame / FPS).tobytes())
finally:
    process.stdin.close()
if process.wait() != 0:
    raise SystemExit("Video encoding failed.")
render(14.5).save(MEDIA / "workflow-poster.jpg", quality=90)
captions = ["WEBVTT", ""]
for i, (title, subtitle, _, _) in enumerate(scenes):
    def stamp(seconds):
        return f"00:00:{seconds:02d}.000"
    captions += [f"{stamp(i*6)} --> {stamp((i+1)*6)}", title, subtitle, ""]
(MEDIA / "lead-workflow.vtt").write_text("\n".join(captions), encoding="utf-8")
print(f"Rendered {DURATION}s / {FPS}fps film: {(MEDIA / 'lead-workflow.mp4').stat().st_size:,} bytes")
