const mongoose = require("mongoose");

const paymentRecordSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    purpose: {
      type: String,
      enum: ["investor_wallet_topup"],
      required: true,
      index: true,
    },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "INR" },
    stripeCheckoutSessionId: { type: String, required: true, unique: true, index: true },
    stripePaymentIntentId: { type: String, index: true },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
      index: true,
    },
    invoiceNumber: { type: String },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PaymentRecord", paymentRecordSchema);
