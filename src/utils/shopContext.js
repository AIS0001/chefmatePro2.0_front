/**
 * Shop Context Utilities
 * Manages selected shop ID in sessionStorage across the super admin dashboard
 */

/**
 * Get the currently selected shop ID from sessionStorage
 * @returns {string|null} Shop ID or null if not selected
 */
export const getSelectedShopId = () => {
  return sessionStorage.getItem('selected_shop_id');
};

/**
 * Set the selected shop ID in sessionStorage
 * @param {string} shopId - The shop ID to store
 */
export const setSelectedShopId = (shopId) => {
  if (shopId) {
    sessionStorage.setItem('selected_shop_id', shopId);
  }
};

/**
 * Clear the selected shop ID from sessionStorage
 */
export const clearSelectedShopId = () => {
  sessionStorage.removeItem('selected_shop_id');
};

/**
 * Get the shop ID as a query parameter object
 * Useful for including in axios requests
 * @returns {object} Object with shop_id if selected, empty object otherwise
 */
export const getShopParams = () => {
  const shopId = getSelectedShopId();
  return shopId ? { shop_id: shopId } : {};
};

/**
 * Check if a shop is selected
 * @returns {boolean} True if shop is selected
 */
export const isShopSelected = () => {
  return !!getSelectedShopId();
};

/**
 * Create axios params with shop_id included
 * @param {object} additionalParams - Any additional params to include
 * @returns {object} Combined params object
 */
export const createShopAwareParams = (additionalParams = {}) => {
  return {
    ...getShopParams(),
    ...additionalParams
  };
};
