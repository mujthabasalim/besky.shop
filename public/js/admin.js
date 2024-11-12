// TODO: sidebar
// Toggle backdrop visibility
function toggleBackdropVisibility(show) {
  const backdrop = document.getElementById('backdrop');
  backdrop.classList.toggle('show', show);
}

// Helper function to check if any of the target elements are visible
function isAnyDropdownVisible() {
  const sidebar = document.getElementById('sidebar');
  return sidebar.classList.contains('show');
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
// TODO: USER MANAGEMENT
// Attach an event listener to the form
document.querySelectorAll('form[id^="status-form-"]').forEach((form) => {
  form.addEventListener("submit", function (event) {
    event.preventDefault(); // Prevent the default form submission

    const userId = form.getAttribute("data-user-id");
    const action = form.getAttribute("action");
    const formData = new FormData(form);

    // Send the POST request using Fetch API
    fetch(action, {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          // Update the button text based on the new status
          const button = form.querySelector("button");
          button.textContent =
            data.newStatus === "Active" ? "Block" : "Unblock";

          // Optionally, you can also update the status text in the table row
          const statusCell = form
            .closest("tr")
            .querySelector("td:nth-child(3)");
          statusCell.textContent = data.newStatus;
        } else {
          alert("Failed to update status: " + data.message);
        }
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  });
});

