import { createContext, useContext, useState } from 'react';

const OrderContext = createContext(null);

export function OrderProvider({ children }) {
  const [order, setOrder] = useState({
    // Personal
    fullName:      '',
    phone:         '',
    email:         '',
    dob:           '',
    address:       '',
    pincode:       '',
    city:          '',
    state:         '',
    // Order
    quantity:      1,
    unitPrice:     399,
    productName:   'Sample Collection Kit',
    // Payment (set at checkout)
    paymentMethod: '',
    paymentStatus: 'Pending',
    razorpayId:    '',
    upiRef:        '',
    // Generated
    orderId:       '',
    totalAmount:   399,
  });

  const updateOrder = (fields) =>
    setOrder((prev) => ({ ...prev, ...fields }));

  return (
    <OrderContext.Provider value={{ order, updateOrder }}>
      {children}
    </OrderContext.Provider>
  );
}

export function useOrder() {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error('useOrder must be used within OrderProvider');
  return ctx;
}
