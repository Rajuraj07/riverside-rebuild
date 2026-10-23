document.addEventListener('DOMContentLoaded', () => {
    //1. Desktop Smooth Shared Dropdown Controller
    const navContainer = document.getElementById('desktop-nav');
    const menuBtns = document.querySelectorAll('.nav-menu-btn');
    const sharedContainer = document.getElementById('shared-dropdown-container');
    const panels = document.querySelectorAll('.dropdown-panel');

    let hideTimeout = null;
    let activeMenu = null;

    function showPanel(menuName, shouldFocusContent = false) {
      clearTimeout(hideTimeout);
      const targetPanel = document.querySelector(`[data-panel="${menuName}"]`);
      const targetBtn = document.querySelector(`[data-menu="${menuName}"]`);
      if (!targetPanel || !targetBtn) return;

      // Close state reset for non-active buttons
      menuBtns.forEach(b => {
        b.setAttribute('aria-expanded', 'false');
        const chev = b.querySelector('.chevron');
        if (chev) chev.classList.remove('rotate-180');
      });

      panels.forEach(p => p.classList.add('opacity-0', 'invisible'));
      targetPanel.classList.remove('opacity-0', 'invisible');

      const panelWidth = targetPanel.offsetWidth;
      const panelHeight = targetPanel.offsetHeight;

      const navRect = navContainer.getBoundingClientRect();
      const btnRect = targetBtn.getBoundingClientRect();
      const xOffset = btnRect.left - navRect.left;

      sharedContainer.style.width = `${panelWidth}px`;
      sharedContainer.style.height = `${panelHeight}px`;
      sharedContainer.style.transform = `translateX(${xOffset}px)`;

      sharedContainer.classList.remove('opacity-0', 'invisible', 'pointer-events-none');
      targetBtn.setAttribute('aria-expanded', 'true');
      
      const targetChevron = targetBtn.querySelector('.chevron');
      if (targetChevron) targetChevron.classList.add('rotate-180');

      activeMenu = menuName;

      // When triggered via Keyboard (Enter/Space), shift focus to the first link inside panel
      if (shouldFocusContent) {
        const firstFocusable = targetPanel.querySelector('a, button');
        if (firstFocusable) {
          setTimeout(() => firstFocusable.focus(), 100);
        }
      }
    }

    function hideDropdown() {
      hideTimeout = setTimeout(() => {
        sharedContainer.classList.add('opacity-0', 'invisible', 'pointer-events-none');
        panels.forEach(p => p.classList.add('opacity-0', 'invisible'));
        menuBtns.forEach(b => {
          b.setAttribute('aria-expanded', 'false');
          const chev = b.querySelector('.chevron');
          if (chev) chev.classList.remove('rotate-180');
        });
        activeMenu = null;
      }, 150);
    }

    menuBtns.forEach(btn => {
      const menuName = btn.getAttribute('data-menu');

      // 1. Mouse hover opens dropdown smoothly
      btn.addEventListener('mouseenter', () => showPanel(menuName));

      // 2. Keyboard Tab Focus DOES NOT open dropdown (only focuses button)
      btn.addEventListener('focus', () => {
        // Dropdown stays closed on Tab focus
      });

      // 3. Click or Enter / Space Key opens/toggles dropdown
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        if (activeMenu === menuName) {
          hideDropdown();
        } else {
          // If triggered by keyboard click (e.detail === 0), shift focus to inner panel
          const isKeyboardClick = e.detail === 0;
          showPanel(menuName, isKeyboardClick);
        }
      });

      btn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (activeMenu === menuName) {
            hideDropdown();
          } else {
            showPanel(menuName, true);
          }
        }
      });
    });

    navContainer.addEventListener('mouseleave', hideDropdown);
    sharedContainer.addEventListener('mouseenter', () => clearTimeout(hideTimeout));
    sharedContainer.addEventListener('mouseleave', hideDropdown);

    // Close Dropdown when Tab moves outside the navigation
    document.addEventListener('focusin', (e) => {
      if (!navContainer.contains(e.target) && !sharedContainer.contains(e.target)) {
        hideDropdown();
      }
    });

    // Close on Escape Key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        hideDropdown();
      }
    });

    //2. Mobile Navigation Controls
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const closeMobileBtn = document.getElementById('close-mobile-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileBackdrop = document.getElementById('mobile-backdrop');

    const toggleMobileMenu = (open) => {
      if (open) {
        mobileMenu.classList.remove('-translate-y-full');
        mobileBackdrop.classList.remove('opacity-0', 'pointer-events-none');
        document.body.style.overflow = 'hidden';
      } else {
        mobileMenu.classList.add('-translate-y-full');
        mobileBackdrop.classList.add('opacity-0', 'pointer-events-none');
        document.body.style.overflow = '';
      }
    };

    mobileMenuBtn?.addEventListener('click', () => toggleMobileMenu(true));
    closeMobileBtn?.addEventListener('click', () => toggleMobileMenu(false));
    mobileBackdrop?.addEventListener('click', () => toggleMobileMenu(false));

    // Mobile Accordion Toggle
    document.querySelectorAll('.mobile-accordion-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const panel = btn.nextElementSibling;
        const icon = btn.querySelector('svg');
        panel.classList.toggle('hidden');
        icon.classList.toggle('rotate-180');
      });
    });
    //3. Nav Scroll Function
    const nav = document.querySelector(".nav_component");
    window.addEventListener("scroll", () => {
      if (window.scrollY > 0) {
        nav.classList.add("cc-scrolled");
      } else {
        nav.classList.remove("cc-scrolled");
      }
    });

});