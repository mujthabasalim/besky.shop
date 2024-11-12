document.addEventListener("DOMContentLoaded", function () {
  let cropper;
  let currentImageInput;
  const maxVariants = 6;

  const variantsContainer = document.getElementById('variantsContainer');
  if (variantsContainer) {
    // Initialize variantCount from the data attribute
    let variantCount = parseInt(
      document
        .getElementById("variantsContainer")
        .getAttribute("data-initial-count")
    );
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
            <input type="text" class="form-control" id="variantStock-${variantIndex}" name="variants[${variantIndex}][stocks]" data-required="true">
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
      // The imageIndex should start from the currentImageCount (last index of existing images)
      const imageIndex = currentImageCount;
      const imageInputHtml = `
        <div class="form-group d-flex flex-column position-relative">
          <img class="img-preview custom-image mb-2" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/klWNhAAAAAASUVORK5CYII=" />
          <input type="file" class="image-input" name="variants[${variantIndex}][newImages][${imageIndex}]" />
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
        const newFile = new File([blob], currentImageInput.files[0].name, {
          type: "image/jpeg",
        });

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
  }


  /////////////////////



  // Fetch subcategories based on selected category
  document
    .getElementById("parentCategory")
    .addEventListener("change", function () {
      const categoryId = this.value;

      fetch(`/admin/subcategories/${categoryId}`)
        .then((response) => response.json())
        .then((subcategories) => {
          const subCategorySelect = document.getElementById("subCategory");
          subCategorySelect.innerHTML = "";

          subcategories.forEach((subcategory) => {
            const option = document.createElement("option");
            option.value = subcategory._id;
            option.textContent = subcategory.name;
            subCategorySelect.appendChild(option);
          });
        });
    });

  // delete image
  const deleteConfirmationModal = document.getElementById('deleteConfirmationModal');
  if (deleteConfirmationModal) {
    let imageToDelete;
  let variantIndexToDelete;
  const deleteModal = new bootstrap.Modal(
    document.getElementById("deleteConfirmationModal")
  );
  const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");

  document.addEventListener("click", (event) => {
    // Check if the click was on a delete button or within its child elements
    const deleteButton = event.target.closest(".delete-image-btn");

    if (deleteButton) {
      event.preventDefault();
      // Retrieve the image and variant indices from the delete button's data attributes
      imageToDelete = deleteButton.getAttribute("data-image-index");
      variantIndexToDelete = deleteButton.getAttribute("data-variant-index");

      deleteModal.show();
    }
  });

  confirmDeleteBtn.addEventListener("click", async () => {
    if (imageToDelete !== undefined && variantIndexToDelete !== undefined) {
      // Get product ID from the page or pass it via a data attribute
      const productId = document.getElementById("product-id").value;

      try {
        // Send a DELETE request to the backend to remove the image
        const response = await fetch(
          `/admin/delete-image/${productId}/${variantIndexToDelete}/${imageToDelete}`,
          {
            method: "DELETE",
          }
        );

        if (response.ok) {
          // Remove the corresponding image element from the DOM
          document
            .querySelector(
              `[data-image-index='${imageToDelete}'][data-variant-index='${variantIndexToDelete}']`
            )
            .closest(".form-group")
            .remove();
        } else {
          alert("Failed to delete image.");
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        deleteModal.hide();
      }
    }
  });
  }
});