<div align="center">

<a href="https://farhan6667.github.io/portfolio/">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="readme-assets/preview-dark.webp">
    <img src="readme-assets/preview-light.webp" width="100%" alt="Syed Farhan Ahmed portfolio, home section">
  </picture>
</a>

# Syed Farhan Ahmed, portfolio

Cyber security · Digital forensics · Detection engineering

**[Open the live site](https://farhan6667.github.io/portfolio/)** ·
[Download the CV](Syed_Farhan_Ahmed_CV.pdf) ·
[LinkedIn](https://www.linkedin.com/in/sfa6667)

</div>

## What is on the site

A one-page personal site with a light and a dark theme. The sections are:

- **About** and **Experience**: who I am and the career path.
- **Certifications**, **Expertise** and **Training**: credentials, the tools behind them and completed courses.
- **Projects**: five open source tools, live from the GitHub API.
- **Hall of Fame**, **FAQ** and **LinkedIn**: bug bounty recognition, quick answers and the same career in the format recruiters read.
- **Contact**: email, phone, LinkedIn and WhatsApp.

The CV is a two page PDF and sits in this repository next to the page.

## How it is built

The site is a static `index.html` plus one small `ribbon.js` animation file. There is no build step and no framework to install, and GitHub Pages serves it as it is. To work on it locally, open `index.html` in a browser. The page carries a Content Security Policy and loads libraries only from a short list of known CDNs; inline scripts are allow-listed by hash, so an edit to a `<script>` block in `index.html` needs its CSP hash recomputed too, or the browser will refuse to run it.

| File | Purpose |
|---|---|
| `index.html` | The page, with its styles and scripts |
| `ribbon.js` | The glowing ribbon animation behind the page |
| `Syed_Farhan_Ahmed_CV.pdf` | Downloadable CV |
| `about-dark.jpg`, `about-light.jpg`, `hero-wide.jpg`/`.webp`, `portrait.jpg`/`.webp`, `linkedin-cover.webp`, `linkedin-photo.webp` | Photos used across the page |
| `sfa-mark.webp`, `sfa-logo-nav.webp`, `favicon-64.png`, `apple-touch-icon.png`, `og-card.jpg` | Marks, favicon and the social preview image |
| `robots.txt`, `sitemap.xml`, `llms.txt` | Metadata for search crawlers and AI assistants |
| `readme-assets/` | Images for this README only |

## Other work

- [no-api-media-mcp](https://github.com/farhan6667/no-api-media-mcp): make images and videos from Claude Code, Cursor or Codex with the subscriptions you already pay for.
- [HexSwarm](https://github.com/farhan6667/hexswarm): runs a swarm of AI agents against authorised penetration testing and CTF targets, gated by a scope file.
- [SFA Monitor](https://github.com/farhan6667/sfa-monitor): a performance widget and task manager for the Linux desktop. Free, not open source.
- [Wazuh RuleGuard](https://github.com/farhan6667/wazuh-ruleguard): test Wazuh detection changes before they ship.
- [Wazuh NoiseLens](https://github.com/farhan6667/wazuh-noiselens): see which alerts a proposed exception would hide.

## Ownership

This is a personal site. The text, photos and CV belong to Syed Farhan Ahmed, so please don't copy them.

---

<div align="center">

<a href="https://nexaforge.eu.cc/">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="readme-assets/nexaforge-lockup-dark.webp">
    <img src="readme-assets/nexaforge-lockup-light.webp" height="48" alt="NexaForge">
  </picture>
</a>
&nbsp;&nbsp;
<img src="readme-assets/sfa-logo.webp" height="64" alt="SFA logo">

**Built by [Syed Farhan Ahmed](https://github.com/farhan6667) (SFA)** at **[NexaForge](https://nexaforge.eu.cc/)**<br>
Cyber security · Vibe coding · Web development and IT infrastructure

[Website](https://nexaforge.eu.cc/) ·
[LinkedIn](https://www.linkedin.com/in/sfa6667) ·
[Email](mailto:nexaforge.services@gmail.com)

</div>
