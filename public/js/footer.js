// Sidebar toggle
document
.getElementById("sidebarToggle")
.addEventListener("click", function () {
  document.getElementById("sidebar").classList.toggle("active");
  document.getElementById("overlay").classList.toggle("active");
});

// Sidebar close
document
.getElementById("sidebarClose")
.addEventListener("click", function () {
  document.getElementById("sidebar").classList.remove("active");
  document.getElementById("overlay").classList.remove("active");
});

// Overlay close
document.getElementById("overlay").addEventListener("click", function () {
document.getElementById("sidebar").classList.remove("active");
document.getElementById("overlay").classList.remove("active");
});