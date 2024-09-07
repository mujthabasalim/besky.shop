// Function to validate email format
function validateEmail(email) {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email);
}

// Function to validate password strength (optional: modify as needed)
function validatePassword(password) {
  return password.length >= 6; // Password must be at least 6 characters long
}

// Function to clear previous errors
function clearErrors() {
  document.querySelectorAll('.error-message').forEach(function (el) {
    el.textContent = '';
  });
  document.querySelectorAll('.is-invalid').forEach(function (el) {
    el.classList.remove('is-invalid');
  });
}

// Validate the login form
function validateLoginForm() {
  clearErrors();
  let isValid = true;

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();

  // Email validation
  if (!email) {
    document.getElementById('emailError').textContent = 'Email is required.';
    document.getElementById('email').classList.add('is-invalid');
    isValid = false;
  } else if (!validateEmail(email)) {
    document.getElementById('emailError').textContent = 'Please enter a valid email address.';
    document.getElementById('email').classList.add('is-invalid');
    isValid = false;
  }

  // Password validation
  if (!password) {
    document.getElementById('passwordError').textContent = 'Password is required.';
    document.getElementById('password').classList.add('is-invalid');
    isValid = false;
  }

  return isValid;
}

// Validate the registration form
function validateRegisterForm() {
  clearErrors();
  let isValid = true;

  const firstName = document.getElementById('firstName').value.trim();
  const lastName = document.getElementById('lastName').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();
  const confirmPassword = document.getElementById('confirmPassword').value.trim();
  const terms = document.getElementById('terms').checked;

  // First Name validation
  if (!firstName) {
    document.getElementById('firstNameError').textContent = 'First name is required.';
    document.getElementById('firstName').classList.add('is-invalid');
    isValid = false;
  }

  // Last Name validation
  if (!lastName) {
    document.getElementById('lastNameError').textContent = 'Last name is required.';
    document.getElementById('lastName').classList.add('is-invalid');
    isValid = false;
  }

  // Email validation
  if (!email) {
    document.getElementById('emailError').textContent = 'Email is required.';
    document.getElementById('email').classList.add('is-invalid');
    isValid = false;
  } else if (!validateEmail(email)) {
    document.getElementById('emailError').textContent = 'Please enter a valid email address.';
    document.getElementById('email').classList.add('is-invalid');
    isValid = false;
  }

  // Password validation
  if (!password) {
    document.getElementById('passwordError').textContent = 'Password is required.';
    document.getElementById('password').classList.add('is-invalid');
    isValid = false;
  } 
  // else if (!validatePassword(password)) {
  //   document.getElementById('passwordError').textContent = 'Password must be at least 6 characters long.';
  //   document.getElementById('password').classList.add('is-invalid');
  //   isValid = false;
  // }
    
  // Confirm Password validation
  if (confirmPassword !== password) {
    document.getElementById('confirmPasswordError').textContent = 'Passwords do not match.';
    document.getElementById('confirmPassword').classList.add('is-invalid');
    isValid = false;
  }

  // Terms and Conditions validation
  // if (!terms) {
  //   document.getElementById('terms').classList.add('is-invalid');
  //   alert('You must agree to the terms and conditions.');
  //   isValid = false;
  // }

  return isValid;
}

// General form validation function
function validateForm(event) {
  const formId = event.target.id;
  let isValid = false;

  if (formId === 'loginForm') {
    isValid = validateLoginForm();
  } else if (formId === 'registerForm') {
    isValid = validateRegisterForm();
  }

  if (!isValid) {
    event.preventDefault(); // Prevent form submission if validation fails
  }
}

// Toggle password visibility
function togglePassword(id) {
  const passwordField = document.getElementById(id);
  const icon = document.getElementById('toggle' + capitalize(id) + 'Icon');
  if (passwordField.type === 'password') {
    passwordField.type = 'text';
    icon.classList.remove('bi-eye-slash');
    icon.classList.add('bi-eye');
  } else {
    passwordField.type = 'password';
    icon.classList.remove('bi-eye');
    icon.classList.add('bi-eye-slash');
  }
}

// Helper function to capitalize first letter of string
function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// Attach validation to both forms after the DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');

  if (loginForm) {
    loginForm.addEventListener('submit', validateForm);
  }

  if (registerForm) {
    registerForm.addEventListener('submit', validateForm);
  }
});
