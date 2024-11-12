// Helper function to calculate the discounted price
function calculateDiscountedPrice(originalPrice, discountRate, discountType) {

  if (discountType === 'Percentage') {
    return originalPrice - (originalPrice * (discountRate / 100));
  } else if (discountType === 'Flat') {
    return originalPrice - discountRate;
  }
  return originalPrice;
}

// Function to apply the highest discount from the offers
const applyHighestDiscount = (product, offers) => {
  const applicableOffers = offers.filter((offer) => {
    if (offer.offerType === 'Category') {
      return (
        offer.typeId.toString() === product.parentCategory.toString() ||
        offer.typeId.toString() === product.subCategory.toString()
      );
    } else if (offer.offerType === 'Product') {
      return offer.typeId.toString() === product._id.toString();
    }
    return false;
  });

  let highestDiscountedPrice = product.price; 
  
  applicableOffers.forEach((offer) => {
    const discountedPrice = calculateDiscountedPrice(
      product.price,
      offer.discountRate,
      offer.discountType
    );
    highestDiscountedPrice = Math.min(highestDiscountedPrice, discountedPrice);
  });

  return highestDiscountedPrice;
};


module.exports = {
  applyHighestDiscount,
};
