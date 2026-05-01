/**
 * ToursVan Homepage - Vanilla JavaScript
 *
 * Responsibilities (kept tiny):
 *   1. Trip-type pill toggle (oneway <-> return)
 *   2. Mobile hamburger nav toggle
 *   3. Pax/luggage popover open-close + steppers
 *   4. Booking form submit handler (preventDefault + console.log)
 *   5. Optional reviews horizontal scroll arrows
 *
 * No framework, no build step, no npm.
 */
(function () {
  'use strict';

  /**
   * Site nav — mobile hamburger toggle + scroll shadow on header
   */
  function initSiteNav() {
    var header = document.getElementById('siteHeader');
    var nav = document.getElementById('siteNav');
    var hamburger = document.getElementById('siteHeaderHamburger');
    if (!header || !nav || !hamburger) return;

    hamburger.addEventListener('click', function () {
      var isOpen = nav.classList.toggle('site-nav--open');
      document.body.classList.toggle('has-nav-open', isOpen);
      hamburger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      hamburger.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
    });

    // Close drawer when a nav link is clicked (mobile)
    nav.addEventListener('click', function (e) {
      if (e.target.matches('.site-nav__link') && nav.classList.contains('site-nav--open')) {
        nav.classList.remove('site-nav--open');
        document.body.classList.remove('has-nav-open');
        hamburger.setAttribute('aria-expanded', 'false');
        hamburger.setAttribute('aria-label', 'Open menu');
      }
    });

    // Add scroll shadow when scrolled past 8px
    var scrolled = false;
    function onScroll() {
      var shouldScroll = window.scrollY > 8;
      if (shouldScroll !== scrolled) {
        scrolled = shouldScroll;
        header.classList.toggle('is-scrolled', scrolled);
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /**
   * Trip toggle — One way pill (left, always active) + Return trip iOS switch (right)
   * Shows/hides the return-date booking row based on switch state.
   */
  function initTripToggle() {
    var switchEl = document.getElementById('tripToggleSwitch');
    var returnRow = document.getElementById('bookingReturnRow');
    if (!switchEl) return;

    switchEl.addEventListener('click', function () {
      var isOn = switchEl.getAttribute('aria-checked') === 'true';
      var next = !isOn;
      switchEl.setAttribute('aria-checked', next ? 'true' : 'false');
      if (returnRow) {
        returnRow.hidden = !next;
      }
    });
  }

  /**
   * Pax / luggage / carry-on popover with steppers
   * - Toggle popover open via trigger button
   * - Click outside closes popover
   * - Stepper buttons increment/decrement with clamps
   * - Trigger summary chip updates live
   */
  function initPaxPopover() {
    var trigger = document.getElementById('paxTrigger');
    var popover = document.getElementById('paxPopover');
    var doneBtn = document.getElementById('paxPopoverDone');
    var luggageTotalEl = document.getElementById('luggageTotalDisplay');
    if (!trigger || !popover) return;

    var clamps = {
      pax:     { min: 1, max: 9, valueEl: document.getElementById('paxCount'),     displayEl: document.getElementById('paxCountDisplay') },
      luggage: { min: 0, max: 9, valueEl: document.getElementById('luggageCount'), displayEl: null },
      carryon: { min: 0, max: 9, valueEl: document.getElementById('carryonCount'), displayEl: null }
    };

    function updateLuggageTotal() {
      if (!luggageTotalEl) return;
      var l = clamps.luggage.valueEl ? parseInt(clamps.luggage.valueEl.textContent, 10) || 0 : 0;
      var c = clamps.carryon.valueEl ? parseInt(clamps.carryon.valueEl.textContent, 10) || 0 : 0;
      luggageTotalEl.textContent = String(l + c);
    }

    function open() {
      popover.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');
    }
    function close() {
      popover.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
    }
    function toggle() {
      if (popover.hidden) open(); else close();
    }

    trigger.addEventListener('click', function (e) {
      e.stopPropagation();
      toggle();
    });

    // Click outside closes
    document.addEventListener('click', function (e) {
      if (popover.hidden) return;
      if (popover.contains(e.target) || trigger.contains(e.target)) return;
      close();
    });

    if (doneBtn) {
      doneBtn.addEventListener('click', close);
    }

    // Stepper handlers
    popover.addEventListener('click', function (e) {
      var btn = e.target.closest('.pax-stepper__btn');
      if (!btn) return;

      var step = parseInt(btn.dataset.step, 10) || 0;
      var target = btn.dataset.target;
      var clamp = clamps[target];
      if (!clamp || !clamp.valueEl) return;

      var current = parseInt(clamp.valueEl.textContent, 10) || 0;
      var next = Math.max(clamp.min, Math.min(clamp.max, current + step));
      if (next === current) return;

      clamp.valueEl.textContent = String(next);
      if (clamp.displayEl) clamp.displayEl.textContent = String(next);
      if (target === 'luggage' || target === 'carryon') updateLuggageTotal();

      // Disable buttons at clamp edges
      updateClampButtons(target);
    });

    function updateClampButtons(target) {
      var clamp = clamps[target];
      if (!clamp || !clamp.valueEl) return;
      var current = parseInt(clamp.valueEl.textContent, 10) || 0;
      var minusBtn = popover.querySelector('.pax-stepper__btn[data-target="' + target + '"][data-step="-1"]');
      var plusBtn = popover.querySelector('.pax-stepper__btn[data-target="' + target + '"][data-step="1"]');
      if (minusBtn) minusBtn.disabled = current <= clamp.min;
      if (plusBtn) plusBtn.disabled = current >= clamp.max;
    }

    // Initialize button states + combined luggage total
    Object.keys(clamps).forEach(updateClampButtons);
    updateLuggageTotal();
  }

  /**
   * Booking form submit handler — preventDefault, log payload, alert summary.
   * Backend integration will replace this in a later phase.
   */
  function initBookingForm() {
    var form = document.getElementById('bookingForm');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var switchEl = document.getElementById('tripToggleSwitch');
      var tripType = (switchEl && switchEl.getAttribute('aria-checked') === 'true') ? 'return' : 'oneway';

      function val(id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; }
      function num(id) { var el = document.getElementById(id); return el ? parseInt(el.textContent, 10) || 0 : 0; }

      var payload = {
        tripType:   tripType,
        from:       val('bookingFrom'),
        to:         val('bookingTo'),
        date:       val('bookingDate'),
        returnDate: tripType === 'return' ? val('bookingReturnDate') : null,
        pax:        num('paxCount'),
        luggage:    num('luggageCount'),
        carryon:    num('carryonCount')
      };

      console.log('[ToursVan] Booking payload:', payload);

      // Simple validation
      var missing = [];
      if (!payload.from) missing.push('From');
      if (!payload.to) missing.push('To');
      if (!payload.date) missing.push('Departure date');
      if (tripType === 'return' && !payload.returnDate) missing.push('Return date');

      if (missing.length) {
        alert('Please fill in: ' + missing.join(', '));
        return;
      }

      // Stub success message — backend integration replaces this later
      var summary = 'Searching ' + payload.from + ' to ' + payload.to +
                    ' on ' + payload.date +
                    (payload.returnDate ? ' (return ' + payload.returnDate + ')' : '') +
                    ' for ' + payload.pax + ' passenger(s).';
      alert(summary);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initSiteNav();
    initTripToggle();
    initPaxPopover();
    initBookingForm();
    // Phase 4+ hooks will land here:
    //   initReviewsScroll();
  });
})();
