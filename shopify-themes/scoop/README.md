# Scoop — Premium Shopify OS 2.0 Theme for Supplement Brands

**By Theme Forge · Version 1.0.0**

Scoop is a dark-first, image-led Shopify Online Store 2.0 theme built for sports supplement and protein powder stores. Near-black `#0a0a0a` surfaces, an acid-volt `#c8ff16` accent and oversized Space Grotesk display type give it the energy of a supplement drop with the precision of a lab. Built on the Anvil engine — every line original work by Theme Forge, no code copied from Dawn or any other theme.

## Design system

- **Palette** — near-black surfaces, acid volt accent, white type. Volt is used with intent: buttons, sale badges, stat numerals, prices and separators.
- **Typography** — Space Grotesk (500/700) display + Inter body, loaded from Google Fonts (toggle in Theme settings → Typography to fall back to Shopify font pickers). Display headings clamp up to 7rem on heroes, tight leading, uppercase kickers with wide tracking.
- **Image-led** — full-bleed heroes with dark gradient overlays for legibility, hover zoom on product cards and tiles.
- **Sharp geometry** — buttons and cards ship as 0-radius rectangles; volt fill with black text.

## Signature sections

- **Marquee** — a scrolling uppercase text strip ("LAB TESTED • 27G PROTEIN • ZERO JUNK •"). Pure CSS animation, seamless loop, volt or dark scheme, optional hollow-outline items, direction and speed controls. Fully static under `prefers-reduced-motion`.
- **Benefits panel** — nutrition-fact styling straight off a supplement tub: thick 8px rules, uppercase labels, mono volt numerals. One block per benefit line (icon, value, label), plus panel title, serving subtitle and footnote.

## Feature highlights (Anvil engine)

- **Mega menu with images** — full-width dropdown with menu columns plus up to two promotional image tiles per menu item.
- **Quick-view drawer** — product cards open a modal with variant selection, live price and add-to-cart.
- **Slide-out AJAX cart** — live count bubble and optional free-shipping progress bar with configurable threshold.
- **Sticky add-to-cart bar** — appears when the buy buttons scroll out of view, synced to the selected variant.
- **Conversion toolkit** — volt sale badges with percent-off, promo tiles, countdown banner, testimonials slider, FAQ accordion, logo list, newsletter capture, trust-icon multicolumn.
- **Full storefront filtering** on collections (Search & Discovery filters), sorting and numbered pagination.
- **29 JSON-configurable sections**, all with settings/blocks/presets, arrangeable in the theme editor.
- **Speed-first vanilla JS** — one small deferred file, no jQuery, no frameworks.
- **Accessibility built in** — focus traps, `aria-expanded` state, Escape-to-close, skip link, `prefers-reduced-motion` respected (including the marquee).

## Sections

Announcement bar (volt strip), Header (mega menu), Footer, Hero banner (7rem display type + gradient overlay), **Marquee**, **Benefits panel**, Featured collection, Promo tiles, Image with text, Multicolumn, Testimonials, Newsletter signup, Collection list, Countdown banner, FAQ, Logo list, Rich text, plus the main templates: Product, Collection, Cart, Related products, Search, 404, Page, Contact, Blog, Article, List collections, Password.

## Installation

1. Zip the `scoop` folder (the folder contents — `layout/`, `sections/`, etc. — must sit at the top level of the zip).
2. In Shopify admin go to **Online Store → Themes → Add theme → Upload zip file**.
3. Choose the zip, wait for it to process, then click **Customize** to open the theme editor.
4. Publish when you're ready.

## Customisation guide

- **Colors & type** — Theme settings → *Colors* / *Typography*. Scoop ships dark-first; all tokens feed CSS custom properties, so the whole theme recolors instantly. Untick "Use Scoop brand fonts" to pick any Shopify library font instead of Space Grotesk/Inter.
- **Marquee** — add items as blocks; set scheme (volt strip or dark with volt separators), direction, loop duration and text size. Tick "Outline style" on alternating items for the hollow-type look.
- **Benefits panel** — one block per line: pick an icon, a value ("27g") and a label ("Protein per scoop"). Panel title/subtitle/footnote complete the supplement-label framing.
- **Layout** — Theme settings → *Layout* controls page width and button/card radius (0px out of the box — keep it sharp).
- **Mega menu** — Header section → add a *Mega menu* block, set "Menu item" to the exact title of a top-level menu item.
- **Free shipping bar** — Theme settings → *Cart*: toggle the bar and set the threshold.
- **Badges & quick view** — Theme settings → *Product cards*. Sale badges render volt with black text.
- **Collection filters** — install Shopify's free **Search & Discovery** app to configure which filters appear.

## Preview

`preview/index.html` is a self-contained static mock of the Scoop homepage (announcement bar, header, hero, marquee, product grid, benefits panel, image break, testimonial, footer) for design review and marketplace screenshots. It is a static artifact only — the real theme runs on Shopify.

## Originality & licence

Scoop is 100% original work by Theme Forge, built on our own Anvil engine. It does not include, copy or derive from Dawn or any other existing theme's code; it uses only the public Shopify platform APIs that all themes share. Licensed to the purchasing merchant under the marketplace terms of the store where it was bought: one licence per live storefront, modifications for your own store permitted, redistribution or resale of the code prohibited.

## Support

Documentation: https://themeforge.example.com/docs/scoop
Support: https://themeforge.example.com/support
