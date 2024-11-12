// Utility Functions

// Function to display error message for an element
function setError(elementId, message) {
  const errorElement = document.getElementById(`${elementId}Error`);
  const inputElement = document.getElementById(elementId);
  if (message) {
    errorElement.textContent = message;
    inputElement.classList.add('is-invalid');
  } else {
    errorElement.textContent = '';
    inputElement.classList.remove('is-invalid');
  }
}

// Function to validate required fields
function isRequired(value) {
  return value.trim() !== '';
}

// Function to validate email format
function validateEmail(email) {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email);
}

// Function to validate password strength
function validatePassword(password, minLength = 8) {
  return password.length >= minLength;
}

// Function to clear all errors
function clearErrors() {
  document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
  document.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
}

// Function to validate OTP fields
function validateOtp() {
  let isValid = true;
  for (let i = 1; i <= 6; i++) {
    const otpField = document.getElementById(`otp${i}`);
    const otpValue = otpField.value.trim();

    if (!otpValue || isNaN(otpValue) || otpValue.length !== 1) {
      document.getElementById(`otpError`).textContent = 'Please enter a valid digit.';
      otpField.classList.add('is-invalid');
      isValid = false;
    } else {
      document.getElementById(`otpError`).textContent = '';
      otpField.classList.remove('is-invalid');
    }
  }

  return isValid;
}

// General validation functions for individual forms

function validateLoginForm() {
  clearErrors();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  let isValid = true;

  if (!isRequired(email) || !validateEmail(email)) {
    setError('email', isRequired(email) ? 'Please enter a valid email address.' : 'Email is required.');
    isValid = false;
  }

  if (!isRequired(password)) {
    setError('password', 'Password is required.');
    isValid = false;
  }

  return isValid;
}

function validateRegisterForm() {
  clearErrors();
  const firstName = document.getElementById('firstName').value;
  const lastName = document.getElementById('lastName').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  // const terms = document.getElementById('terms').checked;
  let isValid = true;

  if (!isRequired(firstName)) setError('firstName', 'First name is required.'), isValid = false;
  if (!isRequired(lastName)) setError('lastName', 'Last name is required.'), isValid = false;

  if (!isRequired(email) || !validateEmail(email)) {
    setError('email', isRequired(email) ? 'Please enter a valid email address.' : 'Email is required.');
    isValid = false;
  }

  if (!isRequired(password) || !validatePassword(password, 8)) {
    setError('password', isRequired(password) ? 'Password must be at least 8 characters long.' : 'Password is required.');
    isValid = false;
  }

  if (password !== confirmPassword) {
    setError('confirmPassword', 'Passwords do not match.');
    isValid = false;
  }

  // if (!terms) {
  //   alert('You must agree to the terms and conditions.');
  //   isValid = false;
  // }

  return isValid;
}

function validateForgotForm() {
  clearErrors();
  const email = document.getElementById('email').value;
  let isValid = true;

  if (!isRequired(email) || !validateEmail(email)) {
    setError('email', isRequired(email) ? 'Please enter a valid email address.' : 'Email is required.');
    isValid = false;
  }

  return isValid;
}

function validateResetPasswordForm() {
  clearErrors();
  let isValid = validateOtp();

  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  if (!isRequired(password) || !validatePassword(password, 8)) {
    setError('password', isRequired(password) ? 'Password must be at least 8 characters long.' : 'Password is required.');
    isValid = false;
  }

  if (password !== confirmPassword) {
    setError('confirmPassword', 'Passwords do not match.');
    isValid = false;
  }

  return isValid;
}

function validateVerifyOtpForm() {
  clearErrors();
  return validateOtp();
}

// General form validation function
function validateForm(event) {
  let isValid = false;

  switch (event.target.id) {
    case 'loginForm':
      isValid = validateLoginForm();
      break;
    case 'registerForm':
      isValid = validateRegisterForm();
      break;
    case 'forgotPasswordForm':
      isValid = validateForgotForm();
      break;
    case 'resetPasswordForm':
      isValid = validateResetPasswordForm();
      break;
    case 'verifyOtpForm':
      isValid = validateVerifyOtpForm();
      break;
  }

  if (!isValid) {
    event.preventDefault();
  }
}


// Attach validation to both forms after the DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const forgotPasswordForm = document.getElementById('forgotPasswordForm');
  const resetPasswordForm = document.getElementById('resetPasswordForm');
  const verifyOtpForm = document.getElementById('verifyOtpForm');

  if (loginForm) {
    loginForm.addEventListener('submit', validateForm);
  } else if (registerForm) {
    registerForm.addEventListener('submit', validateForm);
  } else if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener('submit', validateForm);
  } else if (resetPasswordForm) {
    resetPasswordForm.addEventListener('submit', validateForm);
  } else if (verifyOtpForm) {
    verifyOtpForm.addEventListener('submit', validateForm);
  }
});

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


// admin side validation
document.addEventListener('DOMContentLoaded', () => {
  function validateForm(formElement) {
    formElement.addEventListener("submit", function (event) {
      event.preventDefault();
  
      // Clear previous error messages
      formElement.querySelectorAll(".error-message").forEach(function (el) {
        el.textContent = "";
      });
      formElement.querySelectorAll(".is-invalid").forEach(function (el) {
        el.classList.remove("is-invalid");
      });
  
      // Perform validation checks
      let isValid = true;
      const requiredFields = formElement.querySelectorAll('[data-required="true"]');
  
      requiredFields.forEach(function (field) {
        // Check for empty or invalid input
        if (field.tagName === 'SELECT' && (field.value === "" || field.value === "None")) {
          isValid = false;
          field.classList.add("is-invalid");
          formElement.querySelector(`#${field.id}Error`).textContent = "Please select a valid option."; // Error for selecting 'None'
        } else if (field.tagName !== 'SELECT' && field.value.trim() === "") {
          isValid = false;
          field.classList.add("is-invalid");
          formElement.querySelector(`#${field.id}Error`).textContent = "This field is required.";
        }
      });
  
      // Date Validation
      if (formElement.id === "offerForm" || formElement.id === "couponForm") {
        const startDateField = formElement.querySelector("#startDate");
        const endDateField = formElement.querySelector("#endDate");
        const discountRateField = formElement.querySelector("#discountRate");
        const discountTypeField = formElement.querySelector("#discountType");

        // Get current date and set time to 00:00 to compare dates properly
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);  // Reset time for comparison

        // Check if start date and end date are selected
        if (!startDateField.value.trim()) {
          isValid = false;
          startDateField.classList.add("is-invalid");
          formElement.querySelector("#startDateError").textContent = "Please select a start date.";
        }

        if (!endDateField.value.trim()) {
          isValid = false;
          endDateField.classList.add("is-invalid");
          formElement.querySelector("#endDateError").textContent = "Please select an end date.";
        }

        // Ensure end date is not earlier than start date and dates are not earlier than today
        if (startDateField.value && endDateField.value) {
          const startDate = new Date(startDateField.value);
          const endDate = new Date(endDateField.value);

          // Check if start date is earlier than current date
          // if (startDate < currentDate) {
          //   isValid = false;
          //   startDateField.classList.add("is-invalid");
          //   formElement.querySelector("#startDateError").textContent = "Start date cannot be earlier than today.";
          // }

          // Check if end date is earlier than current date
          if (endDate < currentDate) {
            isValid = false;
            endDateField.classList.add("is-invalid");
            formElement.querySelector("#endDateError").textContent = "End date cannot be earlier than today.";
          }

          // Check if end date is earlier than start date
          if (endDate < startDate) {
            isValid = false;
            endDateField.classList.add("is-invalid");
            formElement.querySelector("#endDateError").textContent = "End date cannot be earlier than the start date.";
          }
        }

        // Discount Type and Discount Rate Validation
        if (discountTypeField && discountRateField && discountRateField.value.trim() !== "") {
          const discountRate = parseFloat(discountRateField.value);
          const discountType = discountTypeField.value;

          // Validate percentage discounts
          if (discountType === "Percentage" && (discountRate < 0 || discountRate > 100)) {
            isValid = false;
            discountRateField.classList.add("is-invalid");
            formElement.querySelector("#discountRateError").textContent = "Percentage discount must be between 0% and 100%.";
          }
          // Validate flat rate discounts (must be non-negative)
          else if (discountType === "Flat" && discountRate < 0) {
            isValid = false;
            discountRateField.classList.add("is-invalid");
            formElement.querySelector("#discountRateError").textContent = "Flat discount must be a positive value.";
          }
        }
      }
  
      // Additional validation for product forms (if applicable)
      if (formElement.id === "productForm") {
        formElement.querySelectorAll(".variant-section").forEach(function (variantSection) {
          const images = variantSection.querySelectorAll(".image-input");
          if (images.length === 0) {
            isValid = false;
            const errorMessage = document.createElement("div");
            errorMessage.className = "error-message";
            errorMessage.textContent = "At least one image is required for each variant.";
            variantSection.querySelector(".form-group.mb-3").appendChild(errorMessage);
          }
        });

        // Price Validation for Product Form
        const productPriceField = formElement.querySelector("#price");
        if (productPriceField) {
          const productPrice = parseFloat(productPriceField.value);
          if (isNaN(productPrice) || productPrice <= 0) {
            isValid = false;
            productPriceField.classList.add("is-invalid");
            formElement.querySelector("#priceError").textContent = "Price must be a valid number greater than 0.";
          }
        }
      }
  
      // If all checks pass, submit the form
      if (isValid) {
        formElement.submit();
      }
    });
  }

  const productForm = document.getElementById("productForm");
  if (productForm) {
    validateForm(productForm);
  }

  const offerForm = document.getElementById("offerForm");
  if (offerForm) {
    validateForm(offerForm);
  }

  const couponForm = document.getElementById("couponForm");
  if (couponForm) {
    validateForm(couponForm);
  }
});



