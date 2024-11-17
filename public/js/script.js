// Page loading logic
window.addEventListener("load", function() {
  var loading = document.getElementById("loading");
  var content = document.getElementById("content");

  // Add a slight delay for smoother loading
  setTimeout(function() {
    // Fade out the loading screen
    loading.classList.add("fade-out");

    // Show the main content after loader disappears
    setTimeout(function() {
      loading.style.display = "none";
      content.style.display = "block";
    }, 500);
  }, 1500);
});

// Function for capitalize first letter
function capitalizeFirstLetter (string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

// hide message after 5 seconds
function hideMessage(id) {
  setTimeout(() => {
    const elem = document.getElementById(id);
    if (elem) {
      elem.style.display = 'none';
    }
  }, 5000); 
}

if (document.getElementById('success-message')) hideMessage('success-message');
if (document.getElementById('error-message')) hideMessage('error-message');