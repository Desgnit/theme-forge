# Torque — Premium Shopify OS 2.0 Theme for Fitness Gear & Apparel

**By Theme Forge · Version 1.0.0**

Torque is an editorial, image-led Shopify Online Store 2.0 theme for fitness equipment, training wear and accessory stores. Think print sports catalogue, not neon web: bone `#f4f2ed` surfaces, ink `#111111` type and rules, one signal-orange `#ff4d00` accent, hard 2px borders instead of shadows, square corners, and huge uppercase Archivo display headlines with magazine-style index numbering ("01 / GEAR"). Every line is original work — no code was copied from Dawn or any other theme — built on standard Shopify platform conventions (Liquid, JSON templates, section schemas).

## The Torque look

- **Bone / ink / signal orange** — light editorial surfaces with ink-filled rectangular buttons that invert to orange on hover. All five color tokens are theme settings.
- **Archivo display type** — headings default to Archivo 700 with an auto-loaded 900-weight display face for hero and section headlines; prices and countdown numbers are set big, tabular and heavy.
- **Index rules everywhere** — sections open on a 2px ink rule with a small-caps label, like a magazine table of contents; eyebrows carry orange tick marks and section numbers ("02 / The rack").
- **Outlined display text** — `.display-outline` renders oversized transparent type with a 2px ink (or white) stroke for section numbers and lookbook counters.
- **Ink-border imagery** — product cards, lookbook frames, tiles and galleries all sit in harsh 2px ink borders with hover reveals (second image swap, caption inversion to orange), no drop shadows anywhere.

## Signature sections

- **Split hero** — editorial 60/40 split: photography fills one side, oversized uppercase type the other, with an outlined index number, small-caps image caption, and an orange-underlined highlight word. Image/type sides are configurable.
- **Lookbook** — asymmetric editorial image grid: one tall frame plus stacked satellites, outlined corner numbers, small-caps captions with orange detail text, each look linkable. Up to five looks per section.

## Feature highlights

- **Mega menu with images** — full-width dropdown with menu columns plus up to two promotional image tiles per menu item, configured through header blocks.
- **Quick-view drawer** — product cards open a modal that fetches the product `.js` endpoint; variant selection, live price and add-to-cart without leaving the page.
- **Slide-out AJAX cart** — adds, quantity changes and removals via `/cart/add.js` and `/cart/change.js`; live count bubble; optional **free-shipping progress bar** with configurable threshold.
- **Sticky add-to-cart bar** — appears when the buy buttons scroll out of view (IntersectionObserver), synced to the selected variant's price and availability.
- **Conversion toolkit** — sale/sold-out badges with percent-off, promo tiles, countdown banner with live JS timer, testimonials slider, FAQ accordion, logo list, newsletter capture (footer + section), trust-icon multicolumn.
- **Full storefront filtering** on collections (Search & Discovery filters), sorting and numbered pagination.
- **29 JSON-configurable sections**, all with settings/blocks/presets, arrangeable in the theme editor.
- **Speed-first vanilla JS** — one small deferred file, no jQuery, no frameworks, no external dependencies.
- **Accessibility built in** — focus traps in drawers/modals, `aria-expanded` state, Escape-to-close, skip link, visually-hidden labels, `prefers-reduced-motion` respected.

## Sections

Split hero, Lookbook, Announcement bar, Header (mega menu), Footer (multi-column + newsletter + payment icons), Hero banner, Featured collection, Promo tiles, Image with text, Multicolumn, Testimonials, Newsletter signup, Collection list, Countdown banner, FAQ, Logo list, Rich text, plus the main templates: Product (gallery, variant pills, quantity, dynamic checkout, accordions, sticky ATC), Collection (filters/sort/pagination), Cart (line items, notes), Related products, Search, 404, Page, Contact, Blog, Article, List collections, Password.

## Installation

1. Zip the `torque` folder (the folder contents — `layout/`, `sections/`, etc. — must sit at the top level of the zip).
2. In Shopify admin go to **Online Store → Themes → Add theme → Upload zip file**.
3. Choose the zip, wait for it to process, then click **Customize** to open the theme editor.
4. Publish when you're ready.

## Customisation guide

- **Colors & type** — Theme settings → *Colors* / *Typography*. Ink, signal orange, bone, text and sale tokens feed CSS custom properties, so the whole theme recolors instantly. Headings default to Archivo; the theme automatically loads a 900-weight face for display headlines when the chosen family has one.
- **Layout** — Theme settings → *Layout* controls page width and button/card corner radius (Torque ships square at 0).
- **Split hero** — set the index number ("01 / GEAR"), the highlight word (orange underline), and which side the type sits on.
- **Lookbook** — the first look block renders as the tall editorial frame; toggle the outlined corner numbers per section.
- **Mega menu** — Header section → add a *Mega menu* block, set "Menu item" to the exact title of a top-level menu item (e.g. "Shop"). Nested menu links become columns; the block's two image slots become promotional tiles.
- **Free shipping bar** — Theme settings → *Cart*: toggle the bar and set the threshold in your base currency.
- **Countdown banner** — set the deadline as `YYYY-MM-DDTHH:MM`; the timer hides itself after expiry.
- **Badges & quick view** — Theme settings → *Product cards*.
- **Collection filters** — install Shopify's free **Search & Discovery** app to configure which filters appear.
- **Contact page** — create a page, assign the `page.contact` template.

## Originality & licence

Torque is 100% original work by Theme Forge. It does not include, copy or derive from Dawn or any other existing theme's code; it uses only the public Shopify platform APIs (Liquid objects/filters, section schema format, cart AJAX endpoints) that all themes share. The theme is licensed to the purchasing merchant under the marketplace terms of the store where it was bought: one licence per live storefront, modifications for your own store permitted, redistribution or resale of the code (modified or not) prohibited.

## Support

Documentation: https://themeforge.example.com/docs/torque
Support: https://themeforge.example.com/support
