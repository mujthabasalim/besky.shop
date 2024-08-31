// page loading 
window.addEventListener("load", function() {
  var loading = document.getElementById("loading");
  var content = document.getElementById("content");

  // Hide the loading animation
  loading.style.display = "none";

  // Show the main content
  content.style.display = "block";
});