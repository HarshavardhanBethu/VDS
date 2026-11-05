import React from 'react';
import { AlertTriangle, Trash2, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';

const ShopConflictModal = () => {
  const {
    shopConflictModal,
    currentShopName,
    replaceCartWithNewShopItem,
    cancelShopConflict,
  } = useCart();

  if (!shopConflictModal) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content shop-conflict-card">
        <div className="modal-icon-badge warning">
          <AlertTriangle size={32} />
        </div>

        <h3 className="modal-title">Replace items in cart?</h3>
        
        <p className="modal-body-text">
          Your cart currently contains items from <strong>{currentShopName || 'another village shop'}</strong>.
          <br /><br />
          Village Delivery System handles deliveries one shop at a time. Would you like to discard the previous items and start a new cart from <strong>{shopConflictModal.pendingShop.shop_name}</strong>?
        </p>

        <div className="modal-actions-row">
          <button
            type="button"
            onClick={cancelShopConflict}
            className="btn btn-outline"
          >
            Keep Existing Cart
          </button>
          <button
            type="button"
            onClick={replaceCartWithNewShopItem}
            className="btn btn-danger"
          >
            <Trash2 size={16} />
            <span>Clear & Add New</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShopConflictModal;

