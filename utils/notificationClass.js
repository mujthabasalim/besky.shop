const getNotificationIconClass = (title) => {
  switch (title) {
    case 'Order Placed':
      return 'bx bx-cart';
    case 'Order Shipped':
      return 'bx bx-package';
    case 'Order Delivered':
      return 'bx bx-check-circle';
    case 'Payment Received':
      return 'bx bx-money';
    case 'Refund Issued':
    case 'Return Requested':
      return 'bx bx-recycle';
    case 'Order Cancelled':
      return 'bx bx-x-circle';
    default:
      return 'bx bx-bell';
  }
};

module.exports = {
  getNotificationIconClass,
}