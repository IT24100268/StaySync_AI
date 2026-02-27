export const formatCurrency = (amount) => {
  return `Rs ${parseFloat(amount).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};
