document.addEventListener('DOMContentLoaded', function() {
  const cartIconDesktop = document.getElementById('cartIconDesktop');
  const cartIconMobile = document.getElementById('cartIconMobile');
  const cartDropdown = document.getElementById('cartDropdown');
  const backdrop = document.getElementById('backdrop');

  const handleCartIconClick = async function() {
    const isActive = !cartDropdown.classList.contains('show');
    cartDropdown.classList.toggle('show', isActive);
    toggleBackdropVisibility(isAnyDropdownVisible());

    if (isActive) {
      try {
        const response = await fetch('/protected/cart/data', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.cartItems && data.cartItems.length > 0) {
            cartDropdown.innerHTML = `
              <p>You have ${data.cartItems.length} items in your cart</p>
              ${data.cartItems.map(item => `
                <div class="cart-item">
                  <img src="${item.image}" alt="${item.name}" width="60">
                  <div>
                    <p class="m-0">${item.name}</p>
                    <p class="m-0">${item.quantity} x $${item.discountedPrice.toFixed(2)}<br>Size: ${item.size}</p>
                  </div>
                </div>
              `).join('')}
              <hr>
              <div class="text-center">
                <a href="/protected/cart" class="btn btn-outline-dark w-100 mb-2">View Cart</a>
                <a href="/protected/checkout/shipping" class="btn btn-dark w-100">Checkout</a>
              </div>`;
          } else {
            cartDropdown.innerHTML = '<p>Your cart is empty.</p>';
          }
        } else if (response.status === 401) {
          cartDropdown.innerHTML = 'Please <a href="/auth/login">login</a> to view your cart.';
        }
      } catch (error) {
        console.error('Error fetching cart:', error);
        cartDropdown.innerHTML = '<p>Error loading cart. Please try again later.</p>';
      }
    }
  };

  // Event listeners for both cart icons
  cartIconDesktop.addEventListener('click', handleCartIconClick);
  cartIconMobile.addEventListener('click', handleCartIconClick);

  // Toggle backdrop visibility
  function toggleBackdropVisibility(show) {
    const backdrop = document.getElementById('backdrop');
    backdrop.classList.toggle('show', show);
  }

  // Helper function to check if any of the target elements are visible
  function isAnyDropdownVisible() {
    const sidebar = document.getElementById('sidebar');
    const cartDropdown = document.getElementById('cartDropdown');
    return sidebar.classList.contains('show') || cartDropdown.classList.contains('show');
  }

  // Sidebar toggle
  document.getElementById('sidebarToggle').addEventListener('click', function () {
    const sidebar = document.getElementById('sidebar');
    const isActive = !sidebar.classList.contains('show');
    sidebar.classList.toggle('show', isActive);
    toggleBackdropVisibility(isAnyDropdownVisible());
  });

  // Sidebar close
  document.getElementById('sidebarClose').addEventListener('click', function () {
    document.getElementById('sidebar').classList.remove('show');
    toggleBackdropVisibility(isAnyDropdownVisible());
  });

  // Backdrop click closes both sidebar and cart dropdown
  backdrop.addEventListener('click', function () {
    document.getElementById('sidebar').classList.remove('show');
    cartDropdown.classList.remove('show');
    toggleBackdropVisibility(false);
  });

  // Close dropdown and backdrop if clicked outside
  document.addEventListener('click', function (event) {
    const cartIconDesktop = document.getElementById('cartIconDesktop');
    const cartIconMobile = document.getElementById('cartIconMobile');
    const cartDropdown = document.getElementById('cartDropdown');

    if (!cartIconDesktop.contains(event.target) && !cartIconMobile.contains(event.target) && !cartDropdown.contains(event.target)) {
      if (cartDropdown.classList.contains('show')) {
        cartDropdown.classList.remove('show');
      }
      toggleBackdropVisibility(isAnyDropdownVisible());
    }
  });
});
