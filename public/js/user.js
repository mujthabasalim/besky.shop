
document.addEventListener('DOMContentLoaded', function() {
  // Update the cart item count when the page loads
  updateCartItemCount();
    const cartIconDesktop = document.getElementById('cartIconDesktop');
    const cartIconMobile = document.getElementById('cartIconMobile');
  
    // Function to toggle icons on hover
    const toggleCartIcon = (cartIcon) => {
      cartIcon.addEventListener('mouseover', () => {
        cartIcon.classList.remove('bi-bag');
        cartIcon.classList.add('bi-bag-fill');
      });
  
      cartIcon.addEventListener('mouseout', () => {
        cartIcon.classList.remove('bi-bag-fill');
        cartIcon.classList.add('bi-bag');
      });
    };
  
    // Apply to both desktop and mobile icons
    toggleCartIcon(cartIconDesktop);
    toggleCartIcon(cartIconMobile);
  });
  
  
  
  function updateCartItemCount() {
    // Fetch the updated cart data
    fetch('/protected/cart/data', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data.cartItems && data.cartItems.length > 0) {
        const itemCount = data.cartItems.length;
        
        // Update the badge count for desktop
        const cartItemCountDesktop = document.getElementById('cartItemCountDesktop');
        if (cartItemCountDesktop) {
          cartItemCountDesktop.textContent = itemCount;
          cartItemCountDesktop.style.display = itemCount > 0 ? 'block' : 'none';
        }
  
        // Update the badge count for mobile
        const cartItemCountMobile = document.getElementById('cartItemCountMobile');
        if (cartItemCountMobile) {
          cartItemCountMobile.textContent = itemCount;
          cartItemCountMobile.style.display = itemCount > 0 ? 'block' : 'none';
        }
      } else {
        // Hide badge when cart is empty for both desktop and mobile
        const cartItemCountDesktop = document.getElementById('cartItemCountDesktop');
        const cartItemCountMobile = document.getElementById('cartItemCountMobile');
        
        if (cartItemCountDesktop) {
          cartItemCountDesktop.textContent = '';
        }
        
        if (cartItemCountMobile) {
          cartItemCountMobile.textContent = '';
        }
      }
    })
    .catch(error => console.error('Error fetching cart data:', error));
  }
  