# ArcRelease — Static Website

A fully static landing page for **ArcRelease** — Release Intelligence & Governance Layer.
Built with plain **HTML, CSS, and vanilla JavaScript**. No backend, no build step, no framework.

## Folder Structure

```
static/
├── index.html          # Entire page markup
├── css/
│   └── styles.css      # All styling
├── js/
│   └── main.js         # Animated background, modal, form, marquee
└── README.md
```

## Features

- Fully responsive landing page (mobile / tablet / desktop)
- Cinematic animated canvas background (constellation network, drifting nebulas,
  flow-field particles, shooting data streams, cursor spotlight)
- Sticky navbar with mobile menu
- "Book a Demo" modal with client-side form validation + toast notifications
- Marquee of 16 integrations
- 3-tier pricing, testimonials, CTA, footer

## Local Preview

Just open `index.html` in a browser, or run a tiny static server:

```bash
# from the static/ directory
python3 -m http.server 8080
# then visit http://localhost:8080
```

## Deploy to AWS S3 + CloudFront (recommended)

### 1. Create an S3 bucket

```bash
aws s3 mb s3://arcrelease-site --region us-east-1
```

### 2. Upload files

```bash
# from the parent folder
aws s3 sync ./static s3://arcrelease-site \
    --delete \
    --cache-control "public, max-age=3600"

# Long-cache for hashed/static assets (optional if you add hashes)
aws s3 cp s3://arcrelease-site s3://arcrelease-site \
    --recursive --exclude "*" --include "*.css" --include "*.js" \
    --metadata-directive REPLACE \
    --cache-control "public, max-age=31536000, immutable"
```

### 3. Enable static website hosting on the bucket

```bash
aws s3 website s3://arcrelease-site/ \
    --index-document index.html \
    --error-document index.html
```

### 4. Make it public via a bucket policy (if not using CloudFront OAC)

`bucket-policy.json`:
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "PublicReadGetObject",
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::arcrelease-site/*"
  }]
}
```

```bash
aws s3api put-bucket-policy --bucket arcrelease-site --policy file://bucket-policy.json
```

### 5. (Recommended) Put CloudFront in front for HTTPS + global CDN

- Origin: the S3 bucket (use **Origin Access Control** for private bucket)
- Default root object: `index.html`
- Viewer protocol policy: **Redirect HTTP → HTTPS**
- Cache policy: `CachingOptimized`
- Optional: attach an ACM certificate + your custom domain (Route 53)

### 6. (Optional) Single-command deploy script

`deploy.sh`:
```bash
#!/usr/bin/env bash
set -e
aws s3 sync ./static s3://arcrelease-site --delete --cache-control "public, max-age=3600"
aws cloudfront create-invalidation --distribution-id <YOUR_DIST_ID> --paths "/*"
```

## Customization

- **Pricing / copy / integrations** — edit `index.html` directly (or extract into a JSON file
  if you want).
- **Colors** — change CSS variables in `:root` at the top of `css/styles.css`.
- **Animation intensity** — tune `DUST_COUNT`, `NODE_COUNT`, `FLOW_COUNT` constants near the
  top of `js/main.js`. Respects `prefers-reduced-motion`.

## License

Private / All rights reserved © ArcRelease.
