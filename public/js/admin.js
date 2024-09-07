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
  const editCategoryBtns = document.querySelectorAll(".edit-category-btn");
  const editCategoryModal = new bootstrap.Modal(document.getElementById("editCategoryModal"));

  editCategoryBtns.forEach(btn => {
      btn.addEventListener("click", function () {
          const row = this.closest("tr");
          const categoryId = row.dataset.categoryId;
          const parentCategoryId = row.dataset.parentCategoryId || "";
          const categoryName = row.querySelector(".category-name").textContent.trim();
          const categoryStatus = row.querySelector(".category-status").textContent.trim();

          // Populate the modal fields with the data from the table row
          document.getElementById("editCategoryName").value = categoryName;
          document.getElementById("editCategoryParent").value = parentCategoryId;
          document.getElementById("editCategoryStatus").value = categoryStatus;
          document.getElementById("editCategoryId").value = categoryId;

          // Update form action
          document.getElementById("editCategoryForm").action = `/admin/updateCategory/${categoryId}`;

          // Show the modal
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


// ////////////////////
document.addEventListener("DOMContentLoaded", function () {
  let cropper;
  let currentImageInput;
  const maxVariants = 6;

  // Initialize variantCount from the data attribute
  let variantCount = parseInt(document.getElementById("variantsContainer").getAttribute("data-initial-count"));

  if (variantCount === 0) {
    // Add initial variant
    addVariant();
  }

  // Add Variant Button Click
  document
  .getElementById("addVariantBtn")
  .addEventListener("click", function () {
    if (variantCount < maxVariants) {
      addVariant();
    } else {
      alert("Maximum of 6 variants allowed.");
    }
  });

  // Function to add variant form
  function addVariant() {
    const variantIndex = variantCount;
    const variantHtml = `
  <div class="variant-section" data-variant-index="${variantIndex}">
    <div class="d-flex justify-content-between align-items-center">
            <h5>Variant ${variantIndex + 1}</h5>
            <button type="button" class="btn btn-outline-danger btn-sm remove-variant-btn">Remove</button>
        </div>
      <div class="d-lg-flex justify-content-between gap-3">
        <div class="w-100 mb-3">
          <label for="variantColor-${variantIndex}">Color<span class="required-star">*</span></label>
          <input type="text" class="form-control" id="variantColor-${variantIndex}" name="variants[${variantIndex}][color]" data-required="true">
          <div class="error-message" id="variantColorError"></div>
        </div>
        <div class="w-100 mb-3">
          <label for="variantSizes-${variantIndex}">Sizes<span class="required-star">*</span> (comma separated)</label>
          <input type="text" class="form-control" id="variantSizes-${variantIndex}" name="variants[${variantIndex}][sizes]" data-required="true">
          <div class="error-message" id="variantSizesError"></div>
        </div>
        <div class="w-100 mb-3">
          <label for="variantStock-${variantIndex}">Stock<span class="required-star">*</span> (comma separated)</label>
          <input type="text" class="form-control" id="variantStock-${variantIndex}" name="variants[${variantIndex}][stock]" data-required="true">
          <div class="error-message" id="variantStockError"></div>
        </div>
      </div>
      <label>Images<span class="required-star">*</span> (Maximum 6)</label>
    <div class="form-group mb-3">
      <div class="variant-images-container d-flex flex-wrap gap-3 mb-2" data-variant-index="${variantIndex}">
        <!-- Image inputs will be added here -->
      </div>
      <button type="button" class="btn btn-outline-dark btn-sm add-image-btn" data-variant-index="${variantIndex}">Add Image</button>
    </div>
    <div class="form-check">
      <input type="checkbox" class="form-check-input" id="variantIsActive-${variantIndex}" name="variants[${variantIndex}][isActive]" checked />
      <label class="form-check-label" for="variantIsActive-${variantIndex}">Active</label>
    </div>
  </div>
`;
    document
      .getElementById("variantsContainer")
      .insertAdjacentHTML("beforeend", variantHtml);
    variantCount++;

    // Add initial 1 image inputs
    addImageInput(variantIndex);
  }

  // Function to add image input
  function addImageInput(variantIndex) {
    const imagesContainer = document.querySelector(
      `.variant-images-container[data-variant-index="${variantIndex}"]`
    );

    const currentImageCount = imagesContainer.children.length;
    if (currentImageCount < 6) {
      const imageInputHtml = `
  <div class="form-group d-flex flex-column position-relative">
    <img class="img-preview custom-image mb-2" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/klWNhAAAAAASUVORK5CYII=" />
    <input type="file" class="image-input" name="variants[${variantIndex}][images][]" />
    <label class="image-label btn btn-dark">Upload File</label>
    <button type="button" class="btn btn-outline-danger btn-sm remove-image-btn">X</button>
  </div>
`;
      imagesContainer.insertAdjacentHTML("beforeend", imageInputHtml);
    } else {
      alert("Maximum of 6 images per variant allowed.");
    }
  }

  // upload file button
  document.addEventListener("click", function (event) {
    if (event.target.classList.contains("image-label")) {
      event.target.previousElementSibling.click();
    }
  });

  // Add Image Button Click
  document.addEventListener("click", function (event) {
    if (event.target.classList.contains("add-image-btn")) {
      const variantIndex = event.target.dataset.variantIndex;
      addImageInput(variantIndex);
    }

    // Remove Image Button Click
    if (event.target.classList.contains("remove-image-btn")) {
      event.target.closest(".form-group").remove();
    }

    // Remove Variant Button Click
    if (event.target.classList.contains("remove-variant-btn")) {
      event.target.closest(".variant-section").remove();
      variantCount--;
    }
  });

      // Open Cropper Modal when an image is selected
        document.addEventListener("change", function (event) {
          if (event.target.matches('input[type="file"]')) {
            const files = event.target.files;
            if (files && files.length > 0) {
              currentImageInput = event.target;

              const reader = new FileReader();
              reader.onload = function (e) {
                document.getElementById("imageToCrop").src = e.target.result;
                const cropperModal = new bootstrap.Modal(
                  document.getElementById("cropperModal")
                );
                cropperModal.show();
              };
              reader.readAsDataURL(files[0]);
            }
          }
        });

            // Initialize CropperJS when the modal is shown
        document
          .getElementById("cropperModal")
          .addEventListener("shown.bs.modal", function () {
            const image = document.getElementById("imageToCrop");
            cropper = new Cropper(image, {
              aspectRatio: 1, // Adjust aspect ratio as needed
              viewMode: 1,
            });
          });

              // Destroy CropperJS when the modal is hidden
        document
          .getElementById("cropperModal")
          .addEventListener("hidden.bs.modal", function () {
            cropper.destroy();
            cropper = null;
          });

          // Handle image cropping
        document
          .getElementById("cropImageBtn")
          .addEventListener("click", function () {
            const canvas = cropper.getCroppedCanvas({
              width: cropper.getImageData().naturalWidth * 2,
              height: cropper.getImageData().naturalHeight * 2,
            });

            canvas.toBlob(function (blob) {
              const newFile = new File(
                [blob],
                currentImageInput.files[0].name,
                { type: "image/jpeg" }
              );

              // Replace the current file input with the cropped image
              const dataTransfer = new DataTransfer();
              dataTransfer.items.add(newFile);
              currentImageInput.files = dataTransfer.files;

              // Show the cropped image in the preview
              const previewImage =
                currentImageInput.parentNode.querySelector(".img-preview");
              const reader = new FileReader();
              reader.onload = function (e) {
                previewImage.src = e.target.result; // Update the src with the selected image data
              };

              reader.readAsDataURL(newFile);

              // Hide the modal
              const cropperModal = bootstrap.Modal.getInstance(
                document.getElementById("cropperModal")
              );
              cropperModal.hide();
            }, "image/jpeg");
          });

  /////////////////////

  document.getElementById('productForm').addEventListener('submit', function (event) {
    // Prevent form submission for validation
    event.preventDefault();

    // Clear previous error messages
    document.querySelectorAll('.error-message').forEach(function (el) {
      el.textContent = '';
    });
    document.querySelectorAll('.is-invalid').forEach(function (el) {
      el.classList.remove('is-invalid');
    });

    // Perform validation checks
    let isValid = true;
    const requiredFields = document.querySelectorAll('[data-required="true"]');

    requiredFields.forEach(function (field) {
      if (field.value.trim() === '') {
        isValid = false;
        field.classList.add('is-invalid');
        document.getElementById(field.id + 'Error').textContent = 'This field is required.';
      }
    });

    // Check if each variant has at least one image
    document.querySelectorAll('.variant-section').forEach(function (variantSection) {
      const images = variantSection.querySelectorAll('.image-input');
      if (images.length === 0) {
        isValid = false;
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error-message';
        errorMessage.textContent = 'At least one image is required for each variant.';
        variantSection.querySelector('.form-group.mb-3').appendChild(errorMessage);
      }
    });

    // If all checks pass, submit the form
    if (isValid) {
      event.target.submit();
    }
  });

    // Fetch subcategories based on selected category
      document.getElementById('parentCategory').addEventListener('change', function () {
        const categoryId = this.value;

        fetch(`/admin/subcategories/${categoryId}`)
          .then(response => response.json())
          .then(subcategories => {
            const subCategorySelect = document.getElementById('subCategory');
            subCategorySelect.innerHTML = '';

            subcategories.forEach(subcategory => {
              const option = document.createElement('option');
              option.value = subcategory._id;
              option.textContent = subcategory.name;
              subCategorySelect.appendChild(option);
            });
          });
      });


      // delete image
      let imageToDelete;
      const deleteModal = new bootstrap.Modal(document.getElementById('deleteConfirmationModal'));
      const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

      document.addEventListener('click', (event) => {
        // Check if the click was on a delete button or within its child elements
        const deleteButton = event.target.closest('.delete-image-btn');

        if (deleteButton) {
          event.preventDefault();
          // Retrieve the image ID from the delete button
          imageToDelete = deleteButton.getAttribute('data-image-id');
          deleteModal.show();
        }
      });

      confirmDeleteBtn.addEventListener('click', async () => {
        if (imageToDelete) {
          try {
            const response = await fetch(`/admin/delete-image/${imageToDelete}`, {
              method: 'DELETE'
            });
            if (response.ok) {
              // Remove the corresponding image element from the DOM
              document.querySelector(`[data-image-id='${imageToDelete}']`).closest('.form-group').remove();
            } else {
              alert('Failed to delete image.');
            }
          } catch (error) {
            console.error('Error:', error);
          } finally {
            deleteModal.hide();
          }
        }
      });
});
