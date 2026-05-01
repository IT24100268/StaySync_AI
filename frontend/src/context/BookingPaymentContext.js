import React, { createContext, useContext, useMemo, useState } from "react";
import { createBookingRequest } from "../services/bookingRequestService";
import { processMockPayment } from "../services/paymentService";

const BookingPaymentContext = createContext(null);

function calculateAdvanceAmount(room) {
  if (!room) {
    return 0;
  }

  return Number(room.deposit ?? 0);
}

export function BookingPaymentProvider({ children }) {
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [advanceAmount, setAdvanceAmount] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState("idle");
  const [bookingStatus, setBookingStatus] = useState("idle");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("card");
  const [paymentReceipt, setPaymentReceipt] = useState(null);
  const [latestBookingRequest, setLatestBookingRequest] = useState(null);

  function startBookingFlow(room) {
    setSelectedRoom(room);
    setAdvanceAmount(calculateAdvanceAmount(room));
    setPaymentStatus("idle");
    setBookingStatus("idle");
    setSelectedPaymentMethod("card");
    setPaymentReceipt(null);
    setLatestBookingRequest(null);
  }

  function resetBookingFlow() {
    setSelectedRoom(null);
    setAdvanceAmount(0);
    setPaymentStatus("idle");
    setBookingStatus("idle");
    setSelectedPaymentMethod("card");
    setPaymentReceipt(null);
    setLatestBookingRequest(null);
  }

  async function confirmBookingPayment({ user, paymentMethod, cardDetails }) {
    if (!selectedRoom) {
      throw new Error("Please choose a room before making payment.");
    }

    setSelectedPaymentMethod(paymentMethod);
    setPaymentStatus("processing");

    try {
      const paymentResult = await processMockPayment({
        amount: advanceAmount,
        paymentMethod,
        roomTitle: selectedRoom.title,
        cardDetails,
      });

      setPaymentReceipt(paymentResult);
      setPaymentStatus("success");
      setBookingStatus("creating");

      const bookingRequest = await createBookingRequest({
        ownerId: selectedRoom.ownerId || "owner-1",
        roomId: selectedRoom.id,
        roomTitle: selectedRoom.title,
        studentId: user.id,
        studentName: user.name,
        studentContact: user.email,
        message: `Advance payment completed for ${selectedRoom.title}. Please review and confirm the booking.`,
        status: "Pending",
        bookingStatusLabel: "Pending Approval",
        paymentStatus: "Paid",
        paymentMethod,
        advanceAmount,
        transactionId: paymentResult.transactionId,
        paidAt: paymentResult.paidAt,
      });

      setLatestBookingRequest(bookingRequest);
      setBookingStatus("confirmed");

      return {
        paymentResult,
        bookingRequest,
      };
    } catch (error) {
      setPaymentStatus("failed");
      setBookingStatus("failed");
      throw error;
    }
  }

  const value = useMemo(
    () => ({
      selectedRoom,
      advanceAmount,
      paymentStatus,
      bookingStatus,
      selectedPaymentMethod,
      paymentReceipt,
      latestBookingRequest,
      startBookingFlow,
      resetBookingFlow,
      setSelectedPaymentMethod,
      confirmBookingPayment,
    }),
    [
      advanceAmount,
      bookingStatus,
      latestBookingRequest,
      paymentReceipt,
      paymentStatus,
      selectedPaymentMethod,
      selectedRoom,
    ]
  );

  return (
    <BookingPaymentContext.Provider value={value}>
      {children}
    </BookingPaymentContext.Provider>
  );
}

export function useBookingPayment() {
  const context = useContext(BookingPaymentContext);

  if (!context) {
    throw new Error("useBookingPayment must be used within BookingPaymentProvider");
  }

  return context;
}
