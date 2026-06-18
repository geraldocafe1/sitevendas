// Urgency Countdown Timer (Grão Nobre)
// Resets every 24h based on browser local storage persistence.
(function() {
  document.addEventListener('DOMContentLoaded', () => {
    initializeCountdown();
  });

  function initializeCountdown() {
    const countdownContainers = document.querySelectorAll('[data-countdown]');
    if (countdownContainers.length === 0) return;

    let targetTime = localStorage.getItem('urgency_target_time');
    
    // Check if target is not set or has already expired
    if (!targetTime || new Date(targetTime) <= new Date()) {
      // Set new target for exactly 24 hours from now
      const newTarget = new Date();
      newTarget.setHours(newTarget.getHours() + 24);
      targetTime = newTarget.toISOString();
      localStorage.setItem('urgency_target_time', targetTime);
    }

    const targetDate = new Date(targetTime);

    function updateTimer() {
      const now = new Date();
      const diffMs = targetDate - now;

      if (diffMs <= 0) {
        // Expired, reset the target and continue loop
        const nextTarget = new Date();
        nextTarget.setHours(nextTarget.getHours() + 24);
        localStorage.setItem('urgency_target_time', nextTarget.toISOString());
        initializeCountdown();
        return;
      }

      // Convert differences to hours, minutes, seconds
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      countdownContainers.forEach(container => {
        const hoursEl = container.querySelector('#countdown-hours');
        const minutesEl = container.querySelector('#countdown-minutes');
        const secondsEl = container.querySelector('#countdown-seconds');

        if (hoursEl) hoursEl.innerText = hours.toString().padStart(2, '0');
        if (minutesEl) minutesEl.innerText = minutes.toString().padStart(2, '0');
        if (secondsEl) secondsEl.innerText = seconds.toString().padStart(2, '0');
      });
    }

    // Run immediately
    updateTimer();

    // Start interval
    setInterval(updateTimer, 1000);
  }
})();
