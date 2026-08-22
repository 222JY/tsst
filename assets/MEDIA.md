# DROP YOUR MEDIA HERE

Put the real project files in this folder, then open `src/js/12-core.js`
and fill in the `media:` field for that project. That's the only edit —
it updates the thumbnail in ALL THREE realities at once.

    { media:'assets/otter.mp4',  id:'otter', t:"THE OTTER", ... }
    { media:'assets/blondie.jpg', id:'blondie', ... }

Accepted:
  .mp4 .webm .mov   -> renders as an autoplaying, muted, looping video thumbnail
  .jpg .png .webp   -> renders as a still
  any absolute URL or data: URI also works

Suggested filenames (matching the six projects):
  otter.mp4 / otter.jpg
  where.mp4 / where.jpg
  blondie.mp4 / blondie.jpg
  danny.mp4 / danny.jpg
  horn.mp4 / horn.jpg
  reel.mp4 / reel.jpg

Recommended: 16:10 or 16:9, ~1280px wide, H.264, no audio track.

After editing, run `node build.js` to regenerate `dist/index.html`.
Leave `media:''` and the slot falls back to the animated procedural field.
