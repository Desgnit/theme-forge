/**
 * Anvil — global.js
 * Speed-first vanilla JS. No jQuery, no frameworks.
 * Modules: money formatting, focus trap, header (mega menu, search, mobile nav),
 * AJAX cart + drawer, quick view, variant picker, sticky ATC, countdown, sliders.
 */
(function () {
  'use strict';

  var config = window.Anvil || { strings: {}, routes: {} };

  /* ------------------------------------------------------------------ *
   * Utilities
   * ------------------------------------------------------------------ */

  function formatMoney(cents, format) {
    if (typeof cents === 'string') cents = cents.replace('.', '');
    var pattern = /\{\{\s*(\w+)\s*\}\}/;
    var moneyFormat = format || config.moneyFormat || '${{amount}}';

    function withDelimiters(number, precision, thousands, decimal) {
      precision = precision == null ? 2 : precision;
      thousands = thousands || ',';
      decimal = decimal || '.';
      if (isNaN(number) || number == null) return '0';
      number = (number / 100).toFixed(precision);
      var parts = number.split('.');
      var whole = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + thousands);
      return whole + (parts[1] ? decimal + parts[1] : '');
    }

    var value = '';
    switch ((moneyFormat.match(pattern) || [, 'amount'])[1]) {
      case 'amount': value = withDelimiters(cents, 2); break;
      case 'amount_no_decimals': value = withDelimiters(cents, 0); break;
      case 'amount_with_comma_separator': value = withDelimiters(cents, 2, '.', ','); break;
      case 'amount_no_decimals_with_comma_separator': value = withDelimiters(cents, 0, '.', ','); break;
      case 'amount_with_apostrophe_separator': value = withDelimiters(cents, 2, "'", '.'); break;
      default: value = withDelimiters(cents, 2);
    }
    return moneyFormat.replace(pattern, value);
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str == null ? '' : String(str);
    return div.innerHTML;
  }

  function dispatch(name, detail) {
    document.dispatchEvent(new CustomEvent(name, { detail: detail || {} }));
  }

  var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  var focusTrap = {
    active: null,
    lastFocused: null,
    activate: function (container) {
      this.deactivate();
      this.lastFocused = document.activeElement;
      this.active = container;
      document.addEventListener('keydown', this.onKeydown);
      var panel = container.querySelector('[role="dialog"]') || container;
      var first = panel.querySelector(FOCUSABLE);
      (first || panel).focus({ preventScroll: true });
    },
    deactivate: function (restore) {
      if (!this.active) return;
      document.removeEventListener('keydown', this.onKeydown);
      this.active = null;
      if (restore !== false && this.lastFocused && document.contains(this.lastFocused)) {
        this.lastFocused.focus({ preventScroll: true });
      }
      this.lastFocused = null;
    },
    onKeydown: function (event) {
      if (event.key !== 'Tab' || !focusTrap.active) return;
      var focusable = Array.prototype.filter.call(
        focusTrap.active.querySelectorAll(FOCUSABLE),
        function (el) { return el.offsetParent !== null; }
      );
      if (!focusable.length) return;
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  };

  function lockScroll(lock) {
    document.documentElement.style.overflow = lock ? 'hidden' : '';
  }

  /* ------------------------------------------------------------------ *
   * Header: mega menu / dropdowns, search toggle, mobile nav
   * ------------------------------------------------------------------ */

  function initHeader() {
    var header = document.querySelector('[data-header]');
    if (!header) return;

    // Desktop nav: open on hover/focus, toggle with click for touch + a11y
    var items = header.querySelectorAll('[data-nav-item]');
    Array.prototype.forEach.call(items, function (item) {
      var trigger = item.querySelector('[data-nav-trigger]');
      var panel = item.querySelector('.mega-menu, .dropdown-menu');
      if (!trigger || !panel) return;

      var closeTimer;
      function open() {
        clearTimeout(closeTimer);
        closeAll(item);
        item.classList.add('is-open');
        trigger.setAttribute('aria-expanded', 'true');
      }
      function close() {
        item.classList.remove('is-open');
        trigger.setAttribute('aria-expanded', 'false');
      }
      function closeAll(except) {
        Array.prototype.forEach.call(items, function (other) {
          if (other === except) return;
          other.classList.remove('is-open');
          var t = other.querySelector('[data-nav-trigger]');
          if (t) t.setAttribute('aria-expanded', 'false');
        });
      }

      item.addEventListener('mouseenter', open);
      item.addEventListener('mouseleave', function () {
        closeTimer = setTimeout(close, 120);
      });
      trigger.addEventListener('click', function (event) {
        event.preventDefault();
        item.classList.contains('is-open') ? close() : open();
      });
      item.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
          close();
          trigger.focus();
        }
      });
      item.addEventListener('focusout', function (event) {
        if (!item.contains(event.relatedTarget)) close();
      });
    });

    // Header search toggle
    var searchToggle = header.querySelector('[data-search-toggle]');
    var searchBar = header.querySelector('[data-header-search]');
    if (searchToggle && searchBar) {
      var searchInput = searchBar.querySelector('input[type="search"]');
      searchToggle.addEventListener('click', function () {
        var isOpen = searchBar.classList.toggle('is-open');
        searchToggle.setAttribute('aria-expanded', String(isOpen));
        if (isOpen && searchInput) searchInput.focus();
      });
      var searchClose = searchBar.querySelector('[data-search-close]');
      if (searchClose) {
        searchClose.addEventListener('click', function () {
          searchBar.classList.remove('is-open');
          searchToggle.setAttribute('aria-expanded', 'false');
          searchToggle.focus();
        });
      }
      searchBar.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
          searchBar.classList.remove('is-open');
          searchToggle.setAttribute('aria-expanded', 'false');
          searchToggle.focus();
        }
      });
    }

    // Mobile navigation drawer
    var mobileToggle = header.querySelector('[data-mobile-nav-toggle]');
    var mobileNav = document.querySelector('[data-mobile-nav]');
    if (mobileToggle && mobileNav) {
      function openNav() {
        mobileNav.hidden = false;
        mobileToggle.setAttribute('aria-expanded', 'true');
        lockScroll(true);
        focusTrap.activate(mobileNav);
      }
      function closeNav() {
        mobileNav.hidden = true;
        mobileToggle.setAttribute('aria-expanded', 'false');
        lockScroll(false);
        focusTrap.deactivate();
      }
      mobileToggle.addEventListener('click', openNav);
      mobileNav.addEventListener('click', function (event) {
        if (event.target.closest('[data-mobile-nav-close]')) closeNav();
      });
      mobileNav.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') closeNav();
      });
    }
  }

  /* ------------------------------------------------------------------ *
   * Cart: AJAX add/change + slide-out drawer rendering
   * ------------------------------------------------------------------ */

  var cartDrawer = {
    el: null,
    init: function () {
      this.el = document.querySelector('[data-cart-drawer]');
      var self = this;

      document.addEventListener('click', function (event) {
        var openTrigger = event.target.closest('[data-cart-drawer-open]');
        if (openTrigger && self.el) {
          event.preventDefault();
          self.open();
          return;
        }
        if (!self.el) return;
        if (event.target.closest('[data-cart-drawer-close]')) self.close();

        var checkout = event.target.closest('[data-cart-checkout]');
        if (checkout) window.location.href = (config.routes.cart || '/cart') + '/checkout';

        var remove = event.target.closest('[data-cart-remove]');
        if (remove) self.changeLine(remove.getAttribute('data-line-key'), 0, remove);

        var minus = event.target.closest('[data-cart-qty-minus]');
        var plus = event.target.closest('[data-cart-qty-plus]');
        if (minus || plus) {
          var btn = minus || plus;
          var key = btn.getAttribute('data-line-key');
          var input = self.el.querySelector('[data-cart-qty-input][data-line-key="' + key + '"]');
          if (input) {
            var next = parseInt(input.value, 10) + (plus ? 1 : -1);
            self.changeLine(key, Math.max(next, 0), btn);
          }
        }
      });

      document.addEventListener('change', function (event) {
        if (!self.el) return;
        var input = event.target.closest('[data-cart-qty-input]');
        if (input && self.el.contains(input)) {
          self.changeLine(input.getAttribute('data-line-key'), Math.max(parseInt(input.value, 10) || 0, 0), input);
        }
      });

      if (this.el) {
        this.el.addEventListener('keydown', function (event) {
          if (event.key === 'Escape') self.close();
        });
      }

      this.fetchState();
    },
    open: function () {
      if (!this.el) return;
      this.el.hidden = false;
      lockScroll(true);
      focusTrap.activate(this.el);
      dispatch('anvil:cart-drawer:open');
    },
    close: function () {
      if (!this.el || this.el.hidden) return;
      this.el.hidden = true;
      lockScroll(false);
      focusTrap.deactivate();
    },
    fetchState: function () {
      var self = this;
      return fetch(config.routes.cart + '.js')
        .then(function (r) { return r.json(); })
        .then(function (cart) { self.render(cart); return cart; })
        .catch(function () {});
    },
    changeLine: function (key, quantity, sourceEl) {
      var self = this;
      var line = sourceEl && sourceEl.closest('.cart-line');
      if (line) line.classList.add('is-loading');
      fetch(config.routes.cartChange + '.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: key, quantity: quantity })
      })
        .then(function (r) { return r.json(); })
        .then(function (cart) { self.render(cart); })
        .catch(function () {
          if (line) line.classList.remove('is-loading');
          self.announce(config.strings.cartError);
        });
    },
    add: function (variantId, quantity, button) {
      var self = this;
      var originalText;
      if (button) {
        originalText = button.textContent;
        button.setAttribute('aria-disabled', 'true');
        button.textContent = config.strings.adding || 'Adding…';
      }
      return fetch(config.routes.cartAdd + '.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: [{ id: variantId, quantity: quantity || 1 }] })
      })
        .then(function (r) {
          if (!r.ok) return r.json().then(function (data) { throw data; });
          return r.json();
        })
        .then(function () {
          if (button) {
            button.textContent = config.strings.added || 'Added';
            setTimeout(function () {
              button.textContent = originalText;
              button.removeAttribute('aria-disabled');
            }, 1400);
          }
          return self.fetchState().then(function (cart) {
            quickView.close();
            self.open();
            return cart;
          });
        })
        .catch(function (error) {
          if (button) {
            button.textContent = originalText;
            button.removeAttribute('aria-disabled');
          }
          self.announce((error && error.description) || config.strings.cartError);
        });
    },
    announce: function (message) {
      if (!message) return;
      var region = document.querySelector('[data-cart-status]');
      if (!region) {
        region = document.createElement('div');
        region.setAttribute('data-cart-status', '');
        region.setAttribute('role', 'status');
        region.className = 'visually-hidden';
        document.body.appendChild(region);
      }
      region.textContent = '';
      window.setTimeout(function () { region.textContent = message; }, 50);
    },
    render: function (cart) {
      if (!cart) return;

      // Header bubbles (all instances)
      Array.prototype.forEach.call(document.querySelectorAll('[data-cart-count]'), function (bubble) {
        bubble.textContent = cart.item_count;
        bubble.setAttribute('data-count', cart.item_count);
      });

      if (!this.el) return;
      var count = this.el.querySelector('[data-cart-drawer-count]');
      if (count) count.textContent = cart.item_count;

      var subtotal = this.el.querySelector('[data-cart-drawer-subtotal]');
      if (subtotal) subtotal.textContent = formatMoney(cart.total_price);

      var footer = this.el.querySelector('[data-cart-drawer-footer]');
      if (footer) footer.hidden = cart.item_count === 0;

      this.renderShippingBar(cart);
      this.renderItems(cart);
      dispatch('anvil:cart:updated', { cart: cart });
    },
    renderShippingBar: function (cart) {
      var bar = this.el.querySelector('[data-shipping-bar]');
      if (!bar || !config.showFreeShippingBar) return;
      var threshold = config.freeShippingThreshold || 0;
      if (!threshold) { bar.hidden = true; return; }
      bar.hidden = false;
      var text = bar.querySelector('[data-shipping-bar-text]');
      var fill = bar.querySelector('[data-shipping-bar-fill]');
      var progress = Math.min((cart.total_price / threshold) * 100, 100);
      if (fill) fill.style.width = progress + '%';
      if (text) {
        if (cart.total_price >= threshold) {
          text.innerHTML = '<strong>' + escapeHtml(config.strings.shippingUnlocked) + '</strong>';
        } else {
          var remaining = formatMoney(threshold - cart.total_price);
          text.innerHTML = (config.strings.shippingRemaining || '[amount]').replace('[amount]', '<strong>' + remaining + '</strong>');
        }
      }
    },
    renderItems: function (cart) {
      var body = this.el.querySelector('[data-cart-drawer-items]');
      if (!body) return;

      if (!cart.items.length) {
        body.innerHTML =
          '<div class="cart-drawer__empty" data-cart-drawer-empty>' +
          '<p class="cart-drawer__empty-title">' + escapeHtml(config.strings.cartEmpty || 'Your cart is empty') + '</p>' +
          '</div>';
        return;
      }

      var html = cart.items.map(function (item) {
        var image = item.image
          ? '<img src="' + item.image.replace(/(\.[a-z]{3,4})(\?|$)/, '_160x$1$2') + '" alt="" width="80" height="80" loading="lazy">'
          : '';
        var variant = item.variant_title
          ? '<p class="cart-line__variant">' + escapeHtml(item.variant_title) + '</p>'
          : '';
        return (
          '<div class="cart-line" data-line-key="' + item.key + '">' +
            '<a href="' + item.url + '" class="cart-line__media" tabindex="-1" aria-hidden="true">' + image + '</a>' +
            '<div class="cart-line__details">' +
              '<a class="cart-line__title" href="' + item.url + '">' + escapeHtml(item.product_title) + '</a>' +
              variant +
              '<div class="cart-line__row">' +
                '<div class="quantity quantity--small" data-quantity>' +
                  '<button type="button" class="quantity__button" data-cart-qty-minus data-line-key="' + item.key + '" aria-label="−">' +
                    '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14"/></svg>' +
                  '</button>' +
                  '<input class="quantity__input" type="number" value="' + item.quantity + '" min="0" inputmode="numeric" data-cart-qty-input data-line-key="' + item.key + '" aria-label="' + escapeHtml(config.strings.quantity || 'Quantity') + '">' +
                  '<button type="button" class="quantity__button" data-cart-qty-plus data-line-key="' + item.key + '" aria-label="+">' +
                    '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>' +
                  '</button>' +
                '</div>' +
                '<span class="cart-line__price">' + formatMoney(item.final_line_price) + '</span>' +
              '</div>' +
            '</div>' +
            '<button type="button" class="cart-line__remove btn-icon" data-cart-remove data-line-key="' + item.key + '" aria-label="Remove ' + escapeHtml(item.product_title) + '">' +
              '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 7h14M9.5 7V5.4A1.4 1.4 0 0 1 10.9 4h2.2a1.4 1.4 0 0 1 1.4 1.4V7m2.7 0-.8 11.3a1.4 1.4 0 0 1-1.4 1.3H9a1.4 1.4 0 0 1-1.4-1.3L6.8 7"/></svg>' +
            '</button>' +
          '</div>'
        );
      }).join('');

      body.innerHTML = html;
    }
  };

  // Product form submissions (main product, quick view, sticky bar)
  function initProductForms() {
    document.addEventListener('submit', function (event) {
      var form = event.target.closest('form[data-product-form]');
      if (!form) return;
      if (config.cartType === 'page') return; // fall through to normal submit
      event.preventDefault();
      var variantInput = form.querySelector('[name="id"]');
      var qtyInput = form.querySelector('[name="quantity"]');
      var button = form.querySelector('[data-add-to-cart]');
      if (!variantInput || !variantInput.value) return;
      cartDrawer.add(variantInput.value, qtyInput ? parseInt(qtyInput.value, 10) || 1 : 1, button);
    });
  }

  /* ------------------------------------------------------------------ *
   * Quantity steppers (product page + cart page)
   * ------------------------------------------------------------------ */

  function initQuantitySteppers() {
    document.addEventListener('click', function (event) {
      var minus = event.target.closest('[data-quantity-minus]');
      var plus = event.target.closest('[data-quantity-plus]');
      if (!minus && !plus) return;
      var wrapper = (minus || plus).closest('[data-quantity]');
      var input = wrapper && wrapper.querySelector('input');
      if (!input || input.hasAttribute('data-cart-qty-input')) return;
      var min = parseInt(input.min, 10) || 0;
      var value = parseInt(input.value, 10) || min;
      input.value = Math.max(value + (plus ? 1 : -1), min);
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }

  /* ------------------------------------------------------------------ *
   * Quick view
   * ------------------------------------------------------------------ */

  var quickView = {
    modal: null,
    init: function () {
      this.modal = document.getElementById('QuickViewModal');
      if (!this.modal) return;
      var self = this;

      document.addEventListener('click', function (event) {
        var trigger = event.target.closest('[data-quick-view-trigger]');
        if (trigger) {
          event.preventDefault();
          self.open(trigger.getAttribute('data-product-url'));
          return;
        }
        if (event.target.closest('[data-quick-view-close]')) self.close();
      });

      this.modal.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') self.close();
      });
    },
    open: function (productUrl) {
      if (!this.modal || !productUrl) return;
      var content = this.modal.querySelector('[data-quick-view-content]');
      content.innerHTML = '<div class="quick-view__loading"><span class="spinner"></span></div>';
      this.modal.hidden = false;
      lockScroll(true);
      focusTrap.activate(this.modal);

      var url = productUrl.split('?')[0] + '.js';
      var self = this;
      fetch(url)
        .then(function (r) { return r.json(); })
        .then(function (product) { self.render(product, productUrl); })
        .catch(function () { self.close(); window.location.href = productUrl; });
    },
    close: function () {
      if (!this.modal || this.modal.hidden) return;
      this.modal.hidden = true;
      lockScroll(false);
      focusTrap.deactivate();
    },
    render: function (product, productUrl) {
      var content = this.modal.querySelector('[data-quick-view-content]');
      var image = product.featured_image
        ? '<img src="' + product.featured_image + '" alt="' + escapeHtml(product.title) + '" width="600" height="600" loading="eager">'
        : '';

      var optionsHtml = '';
      var hasRealVariants = product.variants.length > 1 || product.options.length > 1 ||
        (product.options[0] && product.options[0].toLowerCase() !== 'title');
      if (hasRealVariants) {
        optionsHtml = product.options.map(function (optionName, index) {
          var values = [];
          product.variants.forEach(function (v) {
            var val = v.options[index];
            if (values.indexOf(val) === -1) values.push(val);
          });
          var opts = values.map(function (v) {
            return '<option value="' + escapeHtml(v) + '">' + escapeHtml(v) + '</option>';
          }).join('');
          return (
            '<div class="field">' +
              '<label class="field__label" for="QuickViewOption' + index + '">' + escapeHtml(optionName) + '</label>' +
              '<select id="QuickViewOption' + index + '" data-qv-option data-index="' + index + '">' + opts + '</select>' +
            '</div>'
          );
        }).join('');
      }

      var firstAvailable = null;
      for (var i = 0; i < product.variants.length; i++) {
        if (product.variants[i].available) { firstAvailable = product.variants[i]; break; }
      }
      var current = firstAvailable || product.variants[0];

      content.innerHTML =
        '<div class="quick-view__grid">' +
          '<div class="quick-view__media">' + image + '</div>' +
          '<div class="quick-view__info">' +
            '<h2 class="quick-view__title">' + escapeHtml(product.title) + '</h2>' +
            '<div class="price price--large" data-qv-price></div>' +
            '<form data-product-form data-qv-form>' +
              optionsHtml +
              '<input type="hidden" name="id" value="' + current.id + '">' +
              '<input type="hidden" name="quantity" value="1">' +
              '<button type="submit" class="btn btn--primary btn--full" data-add-to-cart></button>' +
            '</form>' +
            '<a class="quick-view__link" href="' + productUrl + '">' + escapeHtml(config.strings.viewFullDetails || 'View full details') + '</a>' +
          '</div>' +
        '</div>';

      var priceEl = content.querySelector('[data-qv-price]');
      var idInput = content.querySelector('[name="id"]');
      var addButton = content.querySelector('[data-add-to-cart]');
      var selects = content.querySelectorAll('[data-qv-option]');

      function syncVariant() {
        var selected = Array.prototype.map.call(selects, function (s) { return s.value; });
        var match = null;
        for (var i = 0; i < product.variants.length; i++) {
          var v = product.variants[i];
          var ok = true;
          for (var j = 0; j < selected.length; j++) {
            if (v.options[j] !== selected[j]) { ok = false; break; }
          }
          if (ok) { match = v; break; }
        }
        if (match) {
          idInput.value = match.id;
          var compare = match.compare_at_price && match.compare_at_price > match.price
            ? ' <span class="price__compare"><s>' + formatMoney(match.compare_at_price) + '</s></span>'
            : '';
          priceEl.innerHTML = '<span class="price__current">' + formatMoney(match.price) + '</span>' + compare;
          priceEl.classList.toggle('price--on-sale', Boolean(compare));
          addButton.disabled = !match.available;
          addButton.textContent = match.available ? config.strings.addToCart : config.strings.soldOut;
        } else {
          addButton.disabled = true;
          addButton.textContent = config.strings.unavailable;
        }
      }

      if (selects.length && current) {
        Array.prototype.forEach.call(selects, function (select, index) {
          select.value = current.options[index];
          select.addEventListener('change', syncVariant);
        });
      }
      syncVariant();

      var panel = this.modal.querySelector('.quick-view__panel');
      if (panel) panel.focus({ preventScroll: true });
    }
  };

  /* ------------------------------------------------------------------ *
   * Variant picker (main product) — reads product JSON from a script tag
   * ------------------------------------------------------------------ */

  function initVariantPickers() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-variant-picker]'), function (picker) {
      var jsonEl = document.getElementById(picker.getAttribute('data-product-json'));
      if (!jsonEl) return;
      var product;
      try { product = JSON.parse(jsonEl.textContent); } catch (e) { return; }

      var section = picker.closest('[data-product-section]') || document;
      var idInput = section.querySelector('form[data-product-form] [name="id"]');
      var priceCurrent = section.querySelector('[data-main-price] [data-price]');
      var priceCompare = section.querySelector('[data-main-price] [data-compare-price]');
      var priceWrap = section.querySelector('[data-main-price]');
      var addButton = section.querySelector('[data-add-to-cart]');
      var skuEl = section.querySelector('[data-product-sku]');
      var badgeEl = section.querySelector('[data-sale-badge]');
      var stickyPrice = section.querySelector('[data-sticky-price]');

      function currentSelection() {
        var values = [];
        Array.prototype.forEach.call(picker.querySelectorAll('[data-option-index]'), function (group) {
          var index = parseInt(group.getAttribute('data-option-index'), 10);
          var checked = group.querySelector('input[type="radio"]:checked');
          var select = group.querySelector('select');
          values[index] = checked ? checked.value : (select ? select.value : null);
        });
        return values;
      }

      function findVariant(values) {
        return product.variants.find(function (v) {
          return values.every(function (value, index) {
            return value == null || v.options[index] === value;
          });
        });
      }

      function update() {
        var variant = findVariant(currentSelection());

        // Update option label values
        Array.prototype.forEach.call(picker.querySelectorAll('[data-option-index]'), function (group) {
          var label = group.querySelector('[data-selected-value]');
          var checked = group.querySelector('input[type="radio"]:checked');
          if (label && checked) label.textContent = checked.value;
        });

        if (!variant) {
          if (addButton) {
            addButton.disabled = true;
            addButton.textContent = config.strings.unavailable;
          }
          return;
        }

        if (idInput) idInput.value = variant.id;

        var onSale = variant.compare_at_price && variant.compare_at_price > variant.price;
        if (priceCurrent) priceCurrent.textContent = formatMoney(variant.price);
        if (priceCompare) {
          priceCompare.hidden = !onSale;
          priceCompare.innerHTML = onSale ? '<s>' + formatMoney(variant.compare_at_price) + '</s>' : '';
        }
        if (priceWrap) priceWrap.classList.toggle('price--on-sale', Boolean(onSale));
        if (badgeEl) badgeEl.hidden = !onSale;
        if (stickyPrice) stickyPrice.textContent = formatMoney(variant.price);
        if (skuEl) {
          skuEl.hidden = !variant.sku;
          skuEl.textContent = variant.sku ? 'SKU: ' + variant.sku : '';
        }

        if (addButton) {
          addButton.disabled = !variant.available;
          addButton.textContent = variant.available ? config.strings.addToCart : config.strings.soldOut;
        }

        // Swap gallery image if the variant has one
        if (variant.featured_media) {
          var thumb = section.querySelector('[data-gallery-thumb][data-media-id="' + variant.featured_media.id + '"]');
          if (thumb) thumb.click();
        }

        // Update URL without reloading
        if (window.history.replaceState) {
          var url = new URL(window.location.href);
          url.searchParams.set('variant', variant.id);
          window.history.replaceState({}, '', url.toString());
        }
      }

      picker.addEventListener('change', update);
    });
  }

  /* ------------------------------------------------------------------ *
   * Product gallery thumbnails
   * ------------------------------------------------------------------ */

  function initGalleries() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-product-gallery]'), function (gallery) {
      var main = gallery.querySelector('[data-gallery-main] img');
      gallery.addEventListener('click', function (event) {
        var thumb = event.target.closest('[data-gallery-thumb]');
        if (!thumb || !main) return;
        var full = thumb.getAttribute('data-full-src');
        var alt = thumb.getAttribute('data-full-alt') || '';
        if (full) {
          main.src = full;
          main.alt = alt;
        }
        Array.prototype.forEach.call(gallery.querySelectorAll('[data-gallery-thumb]'), function (t) {
          t.classList.toggle('is-active', t === thumb);
          t.setAttribute('aria-current', t === thumb ? 'true' : 'false');
        });
      });
    });
  }

  /* ------------------------------------------------------------------ *
   * Sticky add-to-cart bar
   * ------------------------------------------------------------------ */

  function initStickyAtc() {
    var bar = document.querySelector('[data-sticky-atc]');
    if (!bar || !('IntersectionObserver' in window)) return;
    var target = document.querySelector('[data-buy-buttons]');
    if (!target) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        bar.classList.toggle('is-visible', !entry.isIntersecting && entry.boundingClientRect.top < 0);
      });
    }, { threshold: 0 });
    observer.observe(target);

    var proxyButton = bar.querySelector('[data-sticky-add]');
    if (proxyButton) {
      proxyButton.addEventListener('click', function () {
        var realButton = document.querySelector('[data-buy-buttons] [data-add-to-cart]');
        if (realButton && !realButton.disabled) realButton.click();
      });
    }
  }

  /* ------------------------------------------------------------------ *
   * Countdown timers
   * ------------------------------------------------------------------ */

  function initCountdowns() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-countdown]'), function (el) {
      var deadline = new Date(el.getAttribute('data-deadline')).getTime();
      if (isNaN(deadline)) return;
      var units = {
        days: el.querySelector('[data-countdown-days]'),
        hours: el.querySelector('[data-countdown-hours]'),
        minutes: el.querySelector('[data-countdown-minutes]'),
        seconds: el.querySelector('[data-countdown-seconds]')
      };

      function pad(n) { return n < 10 ? '0' + n : String(n); }

      function tick() {
        var diff = deadline - Date.now();
        if (diff <= 0) {
          el.closest('.countdown-banner') && el.closest('.countdown-banner').classList.add('is-expired');
          clearInterval(timer);
          return;
        }
        var days = Math.floor(diff / 86400000);
        var hours = Math.floor((diff % 86400000) / 3600000);
        var minutes = Math.floor((diff % 3600000) / 60000);
        var seconds = Math.floor((diff % 60000) / 1000);
        if (units.days) units.days.textContent = pad(days);
        if (units.hours) units.hours.textContent = pad(hours);
        if (units.minutes) units.minutes.textContent = pad(minutes);
        if (units.seconds) units.seconds.textContent = pad(seconds);
      }

      tick();
      var timer = setInterval(tick, 1000);
    });
  }

  /* ------------------------------------------------------------------ *
   * Testimonial slider arrows (scroll-snap based)
   * ------------------------------------------------------------------ */

  function initSliders() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-slider]'), function (slider) {
      var track = slider.querySelector('[data-slider-track]');
      if (!track) return;
      slider.addEventListener('click', function (event) {
        var prev = event.target.closest('[data-slider-prev]');
        var next = event.target.closest('[data-slider-next]');
        if (!prev && !next) return;
        var item = track.firstElementChild;
        var amount = item ? item.getBoundingClientRect().width + 16 : track.clientWidth * 0.8;
        track.scrollBy({ left: next ? amount : -amount, behavior: 'smooth' });
      });
    });
  }

  /* ------------------------------------------------------------------ *
   * Collection facets: auto-submit + close panels on outside click
   * ------------------------------------------------------------------ */

  function initFacets() {
    var form = document.querySelector('[data-facets-form]');
    if (!form) return;

    form.addEventListener('change', function (event) {
      if (event.target.matches('input[type="checkbox"], select')) form.submit();
    });

    document.addEventListener('click', function (event) {
      Array.prototype.forEach.call(document.querySelectorAll('.facet[open]'), function (facet) {
        if (!facet.contains(event.target)) facet.removeAttribute('open');
      });
    });
  }

  /* ------------------------------------------------------------------ *
   * Boot
   * ------------------------------------------------------------------ */

  function init() {
    initHeader();
    cartDrawer.init();
    initProductForms();
    initQuantitySteppers();
    quickView.init();
    initVariantPickers();
    initGalleries();
    initStickyAtc();
    initCountdowns();
    initSliders();
    initFacets();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.Anvil = window.Anvil || {};
  window.Anvil.cartDrawer = cartDrawer;
  window.Anvil.formatMoney = formatMoney;
})();
