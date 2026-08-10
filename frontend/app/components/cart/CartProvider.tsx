"use client";

import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import { useAuth } from "@clerk/nextjs";

const LOCAL_STORAGE_KEY = "new_print_cart";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface CartItem {
  _id?: string;
  productId: string;
  itemKey: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  selections: Record<string, string>;
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  isInitializing: boolean;
  isUpdating: boolean;
  serverMessages: string[];
  addToCart: (product: any, selections: Record<string, string>, quantity?: number) => Promise<void>;
  updateQuantity: (itemIdOrKey: string, quantity: number) => Promise<void>;
  removeFromCart: (itemIdOrKey: string) => Promise<void>;
  clearCart: () => Promise<void>;
  clearServerMessages: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  
  const [items, setItems] = useState<CartItem[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [serverMessages, setServerMessages] = useState<string[]>([]);

  // =====================================================================
  // HELPER: Generate item key for local guest mapping
  // =====================================================================
  const generateItemKey = (productId: string, selections: Record<string, string> = {}) => {
    const sortedKeys = Object.keys(selections).sort();
    const selectionString = sortedKeys.map(k => `${k}:${selections[k]}`).join('|');
    return `${productId}${selectionString ? '|' + selectionString : ''}`;
  };

  // =====================================================================
  // INIT & MERGE
  // =====================================================================
  useEffect(() => {
    if (!isLoaded) return;

    const initializeCart = async () => {
      setIsInitializing(true);

      if (isSignedIn) {
        // Authenticated user logic
        const localItemsStr = localStorage.getItem(LOCAL_STORAGE_KEY);
        const token = await getToken();

        // 1. Merge if guest cart exists
        if (localItemsStr) {
          try {
            const guestItems = JSON.parse(localItemsStr);
            if (Array.isArray(guestItems) && guestItems.length > 0) {
              await fetch(`${API_URL}/api/cart/merge`, {
                method: "POST",
                headers: { 
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}` 
                },
                body: JSON.stringify({ items: guestItems })
              });
            }
            localStorage.removeItem(LOCAL_STORAGE_KEY);
          } catch (e) {
            console.error("Failed to parse or merge local cart", e);
            localStorage.removeItem(LOCAL_STORAGE_KEY);
          }
        }

        // 2. Fetch Server Cart
        try {
          const res = await fetch(`${API_URL}/api/cart`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await res.json();
          if (data.success && data.cart) {
            setItems(data.cart.items || []);
            if (data.messages && data.messages.length > 0) {
              setServerMessages(data.messages);
            }
          }
        } catch (e) {
          console.error("Failed to fetch server cart", e);
        }
      } else {
        // Guest user logic
        try {
          const localStr = localStorage.getItem(LOCAL_STORAGE_KEY);
          if (localStr) {
            setItems(JSON.parse(localStr) || []);
          } else {
            setItems([]);
          }
        } catch (e) {
          console.error("Failed to parse local cart", e);
          setItems([]);
        }
      }
      setIsInitializing(false);
    };

    initializeCart();
  }, [isLoaded, isSignedIn, getToken]);

  // =====================================================================
  // ACTIONS
  // =====================================================================
  const addToCart = async (product: any, selections: Record<string, string>, quantity: number = 1) => {
    setIsUpdating(true);
    const itemKey = generateItemKey(product._id, selections);

    if (isSignedIn) {
      const token = await getToken();
      try {
        const res = await fetch(`${API_URL}/api/cart/items`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ productId: product._id, quantity, selections })
        });
        const data = await res.json();
        if (data.success) {
          setItems(data.cart.items || []);
        } else {
          console.error("Failed to add to server cart:", data.message);
        }
      } catch (err) {
        console.error("Add error:", err);
      }
    } else {
      // Local addition
      const newItems = [...items];
      const existingIdx = newItems.findIndex(i => i.itemKey === itemKey);
      if (existingIdx > -1) {
        newItems[existingIdx].quantity += quantity;
      } else {
        newItems.push({
          productId: product._id,
          itemKey,
          name: product.name,
          image: product.images?.[0] || "",
          price: product.price,
          quantity,
          selections
        });
      }
      setItems(newItems);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newItems));
    }
    setIsUpdating(false);
  };

  const updateQuantity = async (itemIdOrKey: string, quantity: number) => {
    if (quantity < 1) return;
    setIsUpdating(true);

    if (isSignedIn) {
      const token = await getToken();
      try {
        const res = await fetch(`${API_URL}/api/cart/items/${itemIdOrKey}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ quantity })
        });
        const data = await res.json();
        if (data.success) {
          setItems(data.cart.items || []);
        }
      } catch (err) {
        console.error("Update quantity error:", err);
      }
    } else {
      const newItems = items.map(item => 
        item.itemKey === itemIdOrKey ? { ...item, quantity } : item
      );
      setItems(newItems);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newItems));
    }
    setIsUpdating(false);
  };

  const removeFromCart = async (itemIdOrKey: string) => {
    setIsUpdating(true);

    if (isSignedIn) {
      const token = await getToken();
      try {
        const res = await fetch(`${API_URL}/api/cart/items/${itemIdOrKey}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setItems(data.cart.items || []);
        }
      } catch (err) {
        console.error("Remove error:", err);
      }
    } else {
      const newItems = items.filter(item => item.itemKey !== itemIdOrKey);
      setItems(newItems);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newItems));
    }
    setIsUpdating(false);
  };

  const clearCart = async () => {
    setIsUpdating(true);
    if (isSignedIn) {
      const token = await getToken();
      try {
        const res = await fetch(`${API_URL}/api/cart`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) setItems([]);
      } catch (err) {
        console.error("Clear error:", err);
      }
    } else {
      setItems([]);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
    setIsUpdating(false);
  };

  const clearServerMessages = () => setServerMessages([]);

  // =====================================================================
  // CALCULATIONS
  // =====================================================================
  const itemCount = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + (item.price * item.quantity), 0), [items]);

  return (
    <CartContext.Provider value={{
      items,
      itemCount,
      subtotal,
      isInitializing,
      isUpdating,
      serverMessages,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      clearServerMessages
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}