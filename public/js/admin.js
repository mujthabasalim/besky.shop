// TODO: USER MANAGEMENT
// Attach an event listener to the form
document.querySelectorAll('form[id^="status-form-"]').forEach(form => {
  form.addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent the default form submission
    
    const userId = form.getAttribute('data-user-id');
    const action = form.getAttribute('action');
    const formData = new FormData(form);
    
    // Send the POST request using Fetch API
    fetch(action, {
      method: 'POST',
      body: formData
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        // Update the button text based on the new status
        const button = form.querySelector('button');
        button.textContent = data.newStatus === 'Active' ? 'Block' : 'Unblock';
        
        // Optionally, you can also update the status text in the table row
        const statusCell = form.closest('tr').querySelector('td:nth-child(3)');
        statusCell.textContent = data.newStatus;
      } else {
        alert('Failed to update status: ' + data.message);
      }
    })
    .catch(error => {
      console.error('Error:', error);
    });
  });
});

// TODO: CATEGORY MANAGEMENT
document.addEventListener("DOMContentLoaded", function () {
  // Edit Category
  const editCategoryBtns = document.querySelectorAll(".edit-category-btn");
  const editCategoryModal = new bootstrap.Modal(document.getElementById("editCategoryModal"));

  editCategoryBtns.forEach(btn => {
    btn.addEventListener("click", function () {
      const row = this.closest("tr");
      const categoryId = row.dataset.categoryId;
      const categoryName = row.querySelector(".category-name").textContent.trim();
      const categoryStatus = row.querySelector(".category-status").textContent.trim();
      const parentCategoryId = row.dataset.parentCategoryId || "";

      document.getElementById("editCategoryName").value = categoryName;
      document.getElementById("editCategoryStatus").value = categoryStatus;
      document.getElementById("editCategoryId").value = categoryId;
      document.getElementById("editCategoryParent").value = parentCategoryId;

      // Update form action dynamically
      document.getElementById("editCategoryForm").action = `/admin/updateCategory/${categoryId}`;

      editCategoryModal.show();
    });
  });
});
function applyFilters() {
  const searchQuery = document.querySelector('input[placeholder="Search Categories..."]').value;
  const parentCategory = document.getElementById('parentCategoryFilter').value;
  const status = document.getElementById('statusFilter').value;

  let url = `/admin/categories?page=1`;

  if (searchQuery) {
    url += `&search=${searchQuery}`;
  }
  if (parentCategory) {
    url += `&parentCategory=${parentCategory}`;
  }
  if (status) {
    url += `&status=${status}`;
  }

  window.location.href = url;
}