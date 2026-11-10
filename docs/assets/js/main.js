// Pawbby Reborn Landing Page JavaScript

document.addEventListener('DOMContentLoaded', () => {
  // 1. Mobile Menu Navigation Toggle
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', isOpen);
    });
  }

  // 2. Installation Guide Tabs
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-tab');

      // Update button states
      tabButtons.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      // Update panels
      tabPanels.forEach(panel => {
        if (panel.id === targetId) {
          panel.classList.add('active');
          panel.hidden = false;
        } else {
          panel.classList.remove('active');
          panel.hidden = true;
        }
      });
    });

    // Keyboard navigation for accessible tabs
    btn.addEventListener('keydown', (e) => {
      const tabs = Array.from(tabButtons);
      const index = tabs.indexOf(btn);
      let targetIndex = null;

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        targetIndex = (index + 1) % tabs.length;
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        targetIndex = (index - 1 + tabs.length) % tabs.length;
      }

      if (targetIndex !== null) {
        tabs[targetIndex].focus();
        tabs[targetIndex].click();
      }
    });
  });

  // 3. Copy Code Snippets
  const copyButtons = document.querySelectorAll('.copy-btn');

  copyButtons.forEach(button => {
    button.addEventListener('click', async () => {
      const targetSelector = button.getAttribute('data-target');
      const codeElement = targetSelector ? document.querySelector(targetSelector) : button.closest('.code-block-wrapper').querySelector('pre code');
      
      if (!codeElement) return;

      const codeText = codeElement.innerText;

      try {
        await navigator.clipboard.writeText(codeText);
        const originalContent = button.innerHTML;
        button.classList.add('copied');
        button.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg> Copied!
        `;

        setTimeout(() => {
          button.classList.remove('copied');
          button.innerHTML = originalContent;
        }, 2200);
      } catch (err) {
        console.error('Failed to copy: ', err);
      }
    });
  });

  // 4. Interactive Hero Mockup Simulation
  const actionButtons = document.querySelectorAll('.mockup-action-btn');
  const mockupStatus = document.getElementById('mockupStatus');
  const mockupWeight = document.getElementById('mockupWeight');

  if (actionButtons && mockupStatus) {
    actionButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.getAttribute('data-action');
        
        if (action === 'clean') {
          mockupStatus.innerHTML = `<span class="mockup-status-dot" style="background:#ddb67c;box-shadow:0 0 8px #ddb67c"></span> Drum Rotating...`;
          btn.style.opacity = '0.5';
          setTimeout(() => {
            mockupStatus.innerHTML = `<span class="mockup-status-dot" style="background:#4ade80;box-shadow:0 0 8px #4ade80"></span> Clean Complete!`;
            btn.style.opacity = '1';
            setTimeout(() => {
              mockupStatus.innerHTML = `<span class="mockup-status-dot"></span> Ready &amp; Idle`;
            }, 2500);
          }, 2000);
        } else if (action === 'tare') {
          const original = mockupWeight.innerHTML;
          mockupWeight.innerHTML = `0.00<span>kg</span>`;
          mockupStatus.innerHTML = `<span class="mockup-status-dot" style="background:#60a5fa;box-shadow:0 0 8px #60a5fa"></span> Scale Zeroed`;
          setTimeout(() => {
            mockupWeight.innerHTML = original;
            mockupStatus.innerHTML = `<span class="mockup-status-dot"></span> Ready &amp; Idle`;
          }, 2000);
        } else if (action === 'soft') {
          mockupStatus.innerHTML = `<span class="mockup-status-dot" style="background:#c084fc;box-shadow:0 0 8px #c084fc"></span> Soft Clumps Active`;
          setTimeout(() => {
            mockupStatus.innerHTML = `<span class="mockup-status-dot"></span> Ready &amp; Idle`;
          }, 2000);
        }
      });
    });
  }
});

