import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('vdsCart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [shopConflictModal, setShopConflictModal] = useState(null);

  useEffect(() => {
    localStorage.setItem('vdsCart', JSON.stringify(cartItems));
  }, [cartItems]);

  const currentShopId = cartItems.length > 0 ? cartItems[0].shop_id : null;
  const currentShopName = cartItems.length > 0 ? cartItems[0].shop_name : null;

  /**
   * Add product to cart with shop isolation enforcement
   */
  const addToCart = (product, shop = {}, quantityToAdd = 1) => {
    const shopId = product.shop_id || shop.id;
    const shopName = shop.shop_name || product.shop_name || 'Village Shop';

    if (currentShopId && currentShopId !== shopId) {
      // Conflict: Cart has items from another shop
      setShopConflictModal({
        pendingProduct: product,
        pendingShop: { id: shopId, shop_name: shopName },
        pendingQuantity: quantityToAdd,
      });
      return false;
    }

    setCartItems((prevItems) => {
      const existingIndex = prevItems.findIndex((item) => item.product_id === product.id);

      if (existingIndex > -1) {
        const updated = [...prevItems];
        updated[existingIndex].quantity += quantityToAdd;
        return updated;
      }

      return [
        ...prevItems,
        {
          product_id: product.id,
          product_name: product.product_name,
          price: parseFloat(product.price),
          mrp: product.mrp ? parseFloat(product.mrp) : null,
          quantity: quantityToAdd,
          image_url: product.image_url,
          unit: product.unit,
          shop_id: shopId,
          shop_name: shopName,
        },
      ];
    });

    return true;
  };

  /**
   * Overwrite cart with items from new shop when conflict is confirmed
   */
  const replaceCartWithNewShopItem = () => {
    if (!shopConflictModal) return;

    const { pendingProduct, pendingShop, pendingQuantity } = shopConflictModal;

    setCartItems([
      {
        product_id: pendingProduct.id,
        product_name: pendingProduct.product_name,
        price: parseFloat(pendingProduct.price),
        mrp: pendingProduct.mrp ? parseFloat(pendingProduct.mrp) : null,
        quantity: pendingQuantity || 1,
        image_url: pendingProduct.image_url,
        unit: pendingProduct.unit,
        shop_id: pendingShop.id,
        shop_name: pendingShop.shop_name,
      },
    ]);

    setShopConflictModal(null);
  };

  const cancelShopConflict = () => {
    setShopConflictModal(null);
  };

  const removeFromCart = (productId) => {
    setCartItems((prev) => prev.filter((item) => item.product_id !== productId));
  };

  const updateQuantity = (productId, delta) => {
    setCartItems((prev) => {
      return prev
        .map((item) => {
          if (item.product_id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean);
    });
  };

  const clearCart = () => {
    setCartItems([]);
  };

  // Calculations
  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const deliveryFee = subtotal >= 500 || cartItems.length === 0 ? 0 : 20;
  const discount = 0;
  const totalAmount = subtotal + deliveryFee - discount;
  const totalItemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        currentShopId,
        currentShopName,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        subtotal,
        deliveryFee,
        discount,
        totalAmount,
        totalItemCount,
        shopConflictModal,
        replaceCartWithNewShopItem,
        cancelShopConflict,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

