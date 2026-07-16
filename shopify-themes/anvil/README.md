# Anvil — Premium Shopify OS 2.0 Theme

**By Theme Forge · Version 1.0.0**

Anvil is a conversion-focused, speed-first Shopify Online Store 2.0 theme. Every line is original work — no code was copied from Dawn or any other theme — built on standard Shopify platform conventions (Liquid, JSON templates, section schemas).

## Feature highlights

- **Mega menu with images** — full-width dropdown with menu columns plus up to two promotional image tiles per menu item, configured through header blocks.
- **Quick-view drawer** — product cards open a modal that fetches the product `.js` endpoint; variant selection, live price and add-to-cart without leaving the page.
- **Slide-out AJAX cart** — adds, quantity changes and removals via `/cart/add.js` and `/cart/change.js`; live count bubble; optional **free-shipping progress bar** with configurable threshold.
- **Sticky add-to-cart bar** — appears when the buy buttons scroll out of view (IntersectionObserver), synced to the selected variant's price and availability.
- **Conversion toolkit** — sale/sold-out badges with percent-off, promo tiles, countdown banner with live JS timer, testimonials slider, FAQ accordion, logo list, newsletter capture (footer + section), trust-icon multicolumn.
- **Full storefront filtering** on collections (Search & Discovery filters), sorting and numbered pagination.
- **27 JSON-configurable sections**, all with settings/blocks/presets, arrangeable in the theme editor.
- **Speed-first vanilla JS** — one small deferred file, no jQuery, no frameworks, no external dependencies.
- **Accessibility built in** — focus traps in drawers/modals, `aria-expanded` state, Escape-to-close, skip link, visually-hidden labels, `prefers-reduced-motion` respected.

## Sections

Announcement bar, Header (mega menu), Footer (multi-column + newsletter + payment icons), Hero banner, Featured collection, Promo tiles, Image with text, Multicolumn, Testimonials, Newsletter signup, Collection list, Countdown banner, FAQ, Logo list, Rich text, plus the main templates: Product (gallery, variant pills, quantity, dynamic checkout, accordions, sticky ATC), Collection (filters/sort/pagination), Cart (line items, notes), Related products, Search, 404, Page, Contact, Blog, Article, List collections, Password.

## Installation

1. Zip the `anvil` folder (the folder contents — `layout/`, `sections/`, etc. — must sit at the top level of the zip).
2. In Shopify admin go to **Online Store → Themes → Add theme → Upload zip file**.
3. Choose the zip, wait for it to process, then click **Customize** to open the theme editor.
4. Publish when you're ready.

## Customisation guide

- **Colors & type** — Theme settings → *Colors* / *Typography*. All tokens (primary, accent, background, text, sale) feed CSS custom properties, so the whole theme recolors instantly.
- **Layout** — Theme settings → *Layout* controls page width and button/card corner radius.
- **Mega menu** — Header section → add a *Mega menu* block, set "Menu item" to the exact title of a top-level menu item (e.g. "Shop"). Nested menu links become columns; the block's two image slots become promotional tiles.
- **Free shipping bar** — Theme settings → *Cart*: toggle the bar and set the threshold in your base currency.
- **Countdown banner** — set the deadline as `YYYY-MM-DDTHH:MM`; the timer hides itself after expiry.
- **Badges & quick view** — Theme settings → *Product cards*.
- **Collection filters** — install Shopify's free **Search & Discovery** app to configure which filters appear.
- **Contact page** — create a page, assign the `page.contact` template.

## Originality & licence

Anvil is 100% original work by Theme Forge. It does not include, copy or derive from Dawn or any other existing theme's code; it uses only the public Shopify platform APIs (Liquid objects/filters, section schema format, cart AJAX endpoints) that all themes share. The theme is licensed to the purchasing merchant under the marketplace terms of the store where it was bought: one licence per live storefront, modifications for your own store permitted, redistribution or resale of the code (modified or not) prohibited.

## Support

Documentation: https://themeforge.example.com/docs/anvil
Support: https://themeforge.example.com/support
