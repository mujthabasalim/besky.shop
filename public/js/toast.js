
  let hoverTimeout; // Timeout for hover effect

  function createToast(message, type = 'custom', duration = 5000) {
    // Create and configure toast element
    const toast = document.createElement('div');
    toast.classList.add('custom-toast', type);
    toast.innerHTML = `${message}`;

    const container = document.getElementById('custom-toast-container');
    container.appendChild(toast);

    // Set timer to auto-remove toast
    setTimeout(() => {
      toast.style.animation = 'fadeOutDown 0.3s ease forwards';
      setTimeout(() => toast.remove(), 300);
    }, duration);

    // Limit to last 3 toasts
    if (container.children.length > 3) {
      container.removeChild(container.children[0]);
    }

    clearTimeout(hoverTimeout); // Clear existing timeout if new toast is added
  }

  function removeAllToasts() {
    const container = document.getElementById('custom-toast-container');
    Array.from(container.children).forEach(toast => {
      toast.style.animation = 'fadeOutDown 0.3s ease forwards';
      setTimeout(() => toast.remove(), 300);
    });
  }

  // Event listeners for pause on hover
  const toastContainer = document.getElementById('custom-toast-container');
  toastContainer.addEventListener('mouseenter', () => clearTimeout(hoverTimeout));
  toastContainer.addEventListener('mouseleave', () => {
    hoverTimeout = setTimeout(removeAllToasts, 3000);
  });
