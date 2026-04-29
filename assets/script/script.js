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

  document.addEventListener('DOMContentLoaded', function () {
    initSiteNav();
    // Phase 3+ hooks will land here:
    //   initTripToggle();
    //   initPaxPopover();
    //   initBookingForm();
    //   initReviewsScroll();
  });
})();
