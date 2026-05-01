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
   * Trip toggle — One way pill (left) + Return trip iOS switch (right)
   * Switch ON  → round-trip: pill loses is-active, return cell visible
   * Switch OFF → one-way:    pill regains is-active, return cell hidden
   * Tapping the One way pill explicitly forces the switch OFF.
   */
  function initTripToggle() {
    var switchEl = document.getElementById('tripToggleSwitch');
    var oneWayPill = document.querySelector('.trip-toggle__pill[data-trip="oneway"]');
    var returnRow = document.getElementById('bookingReturnRow');
    if (!switchEl) return;

    function applyState(isReturn) {
      switchEl.setAttribute('aria-checked', isReturn ? 'true' : 'false');
      if (oneWayPill) oneWayPill.classList.toggle('is-active', !isReturn);
      if (returnRow) returnRow.hidden = !isReturn;
    }

    switchEl.addEventListener('click', function () {
      var isOn = switchEl.getAttribute('aria-checked') === 'true';
      applyState(!isOn);
    });

    if (oneWayPill) {
      oneWayPill.addEventListener('click', function () {
        applyState(false);
      });
    }
  }

  /**
   * Date cells — flatpickr-powered date + time picker on each Departure/Return cell.
   * Tapping the cell opens the picker (calendar grid + time selector + Done implicit on close).
   * Empty   → label shows default placeholder ("Departure" / "Return") in muted ink-500.
   * Filled  → label shows "Wed, Apr 30, 5:00 PM" formatted string in ink-900.
   * Booking form payload reads input.value (ISO-ish "Y-m-d H:i") on submit, downstream parses.
   */
  function initDateCells() {
    var cells = document.querySelectorAll('.booking-row__date-cell');
    cells.forEach(function (cell) {
      var input = cell.querySelector('.booking-row__date-input');
      var label = cell.querySelector('.booking-row__date-label');
      if (!input || !label) return;

      var defaultText = label.dataset.default || label.textContent;

      function applyDate(d) {
        if (d) {
          cell.setAttribute('data-has-value', '');
          var datePart = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
          var timePart = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
          label.textContent = datePart + ', ' + timePart;
        } else {
          cell.removeAttribute('data-has-value');
          label.textContent = defaultText;
        }
      }

      // Per-input label text shown below the flatpickr time row ("Departure time" / "Return time")
      var timeLabelText = input.id === 'bookingReturnDate' ? 'Return time' : 'Departure time';

      // Use flatpickr if loaded (CDN). Falls back to plain text input if not (graceful degradation).
      if (typeof flatpickr === 'function') {
        flatpickr(input, {
          enableTime: true,
          time_24hr: false,
          minuteIncrement: 15,
          minDate: 'today',
          dateFormat: 'Y-m-d H:i',
          defaultHour: 9,
          defaultMinute: 0,
          disableMobile: true, // force flatpickr UI on mobile (don't fall back to native), so date+time picker shows consistently
          onReady: function (selectedDates, dateStr, instance) {
            var calendar = instance.calendarContainer;
            if (!calendar) return;
            var timeRow = calendar.querySelector('.flatpickr-time');
            if (!timeRow || calendar.querySelector('.flatpickr-time-label')) return;
            var labelEl = document.createElement('div');
            labelEl.className = 'flatpickr-time-label';
            labelEl.textContent = timeLabelText;
            timeRow.parentNode.insertBefore(labelEl, timeRow.nextSibling);
          },
          onChange: function (selectedDates) {
            applyDate(selectedDates && selectedDates[0] ? selectedDates[0] : null);
          },
          onClose: function (selectedDates) {
            applyDate(selectedDates && selectedDates[0] ? selectedDates[0] : null);
          }
        });
      } else {
        // Fallback: plain text input, simple input listener (rare path — only if CDN fails)
        input.addEventListener('input', function () {
          applyDate(input.value ? new Date(input.value) : null);
        });
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

  /**
   * Routes tabs — Popular routes / Add stop / Day tour underline-style tab switcher.
   * Click a tab → flips is-active + aria-selected, shows its matching panel via [hidden] attribute.
   */
  function initRoutesTabs() {
    var tabBar = document.querySelector('.routes__tabs');
    if (!tabBar) return;
    var tabs = tabBar.querySelectorAll('.routes__tab');
    var panels = document.querySelectorAll('.routes__panel');
    var heading = document.getElementById('routesHeading');
    var subheading = document.querySelector('.routes .section-subheading');

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var target = tab.dataset.tab;
        tabs.forEach(function (t) {
          var isActive = t === tab;
          t.classList.toggle('is-active', isActive);
          t.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });
        panels.forEach(function (p) {
          p.hidden = p.dataset.panel !== target;
        });
        if (heading && tab.dataset.heading) heading.textContent = tab.dataset.heading;
        if (subheading && tab.dataset.subheading) subheading.textContent = tab.dataset.subheading;
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initSiteNav();
    initTripToggle();
    initDateCells();
    initPaxPopover();
    initBookingForm();
    initRoutesTabs();
    // Phase 4+ hooks will land here:
    //   initReviewsScroll();
  });
})();
