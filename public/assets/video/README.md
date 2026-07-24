# Project tour videos

Drop your walkthrough videos in this folder using these exact filenames. They are
played inline on the Gallery page ("Project video tour") — nothing is uploaded to
YouTube or Instagram, and no external player is loaded.

| Filename       | Card shown |
|----------------|------------|
| `bedroom.mp4`  | Bedroom    |
| `kitchen.mp4`  | Kitchen    |
| `living.mp4`   | Living     |
| `foyer.mp4`    | Foyer      |
| `dining.mp4`   | Dining     |
| `balcony.mp4`  | Balcony    |

You can add them one at a time. A card whose file is missing keeps showing its
poster image with a "video coming soon" note; the other cards still play.

To change the list, titles or posters, edit `TOURS` in `js/app.js`.

## Keep the files small

These load in the browser, so large files make the page slow. Aim for **under
10 MB each**:

- Format: **MP4 (H.264 video + AAC audio)** — plays everywhere.
- Resolution: **1080p is plenty**; 720p is fine for short clips.
- Length: 15–40 seconds works best for a walkthrough.

Videos use `preload="none"`, so nothing downloads until someone actually presses
play on a card.

**Important:** copy the same files into `public/assets/video/` as well — the site
is served from `public/`.
