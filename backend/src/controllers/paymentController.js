const Stripe = require("stripe");
const MentoringSession = require("../models/MentoringSession");
const ChatRoom = require("../models/ChatRoom");
const MentorshipRequest = require("../models/MentorshipRequest");
const User = require("../models/User");
const PaymentRecord = require("../models/PaymentRecord");
const emailService = require("../services/emailService");

const stripeSecret = process.env.STRIPE_SECRET_KEY || "";
const stripe = stripeSecret ? new Stripe(stripeSecret) : null;

function formatInr(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));
}

function buildInvoiceNumber(sessionId) {
  const stamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
  return `INV-${stamp}-${String(sessionId).slice(-6).toUpperCase()}`;
}

async function ensureChatRoom(session) {
  const existing = await ChatRoom.findOne({ mentoringSession: session._id });
  if (existing) return existing;
  return ChatRoom.create({
    mentoringSession: session._id,
    mentor: session.mentorUser,
    jobseeker: session.jobseeker,
  });
}

async function sendInvoiceEmail({ session, student, mentor }) {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const startAt = new Date(session.startTime).toLocaleString();
  const invoiceNumber = session.invoiceNumber || buildInvoiceNumber(session._id);
  const subject = `Invoice ${invoiceNumber} - Mentorship Session Payment`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 640px; margin: auto; color: #111827;">
      <h2 style="margin-bottom: 4px;">Payment Invoice</h2>
      <p style="margin-top: 0; color: #6b7280;">HireMe mentorship payment receipt</p>
      <div style="border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px; margin: 16px 0;">
        <p><strong>Invoice Number:</strong> ${invoiceNumber}</p>
        <p><strong>Paid By:</strong> ${student.fullName} (${student.email})</p>
        <p><strong>Mentor:</strong> ${mentor.fullName} (${mentor.email})</p>
        <p><strong>Session ID:</strong> ${session._id}</p>
        <p><strong>Duration:</strong> ${session.minutes} minutes</p>
        <p><strong>Rate:</strong> ${formatInr((Number(session.pricePerMinuteAtBooking) || 0) * 60)} / hour</p>
        <p><strong>Total Amount Paid:</strong> ${formatInr(session.totalAmount)}</p>
        <p><strong>Payment Method:</strong> Stripe</p>
        <p><strong>Payment ID:</strong> ${session.stripePaymentIntentId || session.paymentId || "N/A"}</p>
        <p><strong>Paid At:</strong> ${new Date(session.paidAt || Date.now()).toLocaleString()}</p>
        <p><strong>Session Starts:</strong> ${startAt}</p>
      </div>
      <p style="color: #6b7280; font-size: 13px;">
        You can view session details on your dashboard:
        <a href="${frontendUrl}/student/dashboard">${frontendUrl}/student/dashboard</a>
      </p>
    </div>
  `;

  await emailService.sendEmail({
    to: student.email,
    subject,
    html,
  });
}

async function sendInvestorTopupInvoiceEmail({ user, record }) {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const subject = `Invoice ${record.invoiceNumber} - Wallet Recharge`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 640px; margin: auto; color: #111827;">
      <h2 style="margin-bottom: 4px;">Wallet Recharge Invoice</h2>
      <p style="margin-top: 0; color: #6b7280;">HireMe investor wallet top-up receipt</p>
      <div style="border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px; margin: 16px 0;">
        <p><strong>Invoice Number:</strong> ${record.invoiceNumber}</p>
        <p><strong>Paid By:</strong> ${user.fullName} (${user.email})</p>
        <p><strong>Amount Added:</strong> ${formatInr(record.amount)}</p>
        <p><strong>Payment Method:</strong> Stripe</p>
        <p><strong>Payment ID:</strong> ${record.stripePaymentIntentId || "N/A"}</p>
        <p><strong>Paid At:</strong> ${new Date(record.updatedAt || Date.now()).toLocaleString()}</p>
      </div>
      <p style="color: #6b7280; font-size: 13px;">
        View wallet balance:
        <a href="${frontendUrl}/investor/dashboard">${frontendUrl}/investor/dashboard</a>
      </p>
    </div>
  `;
  await emailService.sendEmail({ to: user.email, subject, html });
}

async function creditInvestorWalletFromCheckout(checkout) {
  const userId = checkout?.metadata?.userId;
  const amountInr = Number(checkout?.metadata?.amountInr || 0);
  if (!userId || !Number.isFinite(amountInr) || amountInr <= 0) {
    return null;
  }

  let record = await PaymentRecord.findOne({
    stripeCheckoutSessionId: checkout.id,
    purpose: "investor_wallet_topup",
  });

  if (!record) {
    record = await PaymentRecord.create({
      user: userId,
      purpose: "investor_wallet_topup",
      amount: amountInr,
      currency: "INR",
      stripeCheckoutSessionId: checkout.id,
      stripePaymentIntentId: checkout.payment_intent || null,
      status: "pending",
      metadata: { fromWebhook: true },
    });
  }

  if (record.status === "completed") {
    return { record, credited: false };
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $inc: { walletBalance: amountInr } },
    { new: true }
  ).select("fullName email walletBalance");
  if (!updatedUser) return null;

  record.status = "completed";
  record.invoiceNumber = record.invoiceNumber || buildInvoiceNumber(record._id);
  record.stripePaymentIntentId = checkout.payment_intent || record.stripePaymentIntentId;
  await record.save();

  await sendInvestorTopupInvoiceEmail({ user: updatedUser, record });
  return { record, credited: true, user: updatedUser };
}

async function markMentoringSessionPaid(session, paymentIntentId, checkoutSessionId) {
  if (session.status === "paid" || session.status === "scheduled" || session.status === "completed") {
    return { session, newlyPaid: false };
  }
  session.status = "paid";
  session.paymentMethod = "stripe";
  session.paymentId = paymentIntentId || session.paymentId;
  session.stripePaymentIntentId = paymentIntentId || session.stripePaymentIntentId;
  session.stripeCheckoutSessionId = checkoutSessionId || session.stripeCheckoutSessionId;
  session.paidAt = new Date();
  session.invoiceNumber = session.invoiceNumber || buildInvoiceNumber(session._id);
  await session.save();
  await ensureChatRoom(session);
  if (session.mentorshipRequest) {
    await MentorshipRequest.findByIdAndUpdate(session.mentorshipRequest, {
      status: "paid",
      mentoringSession: session._id,
    });
  }
  return { session, newlyPaid: true };
}

exports.createMentoringCheckoutSession = async (req, res, next) => {
  try {
    if (!stripe) {
      return res.status(500).json({ message: "Stripe is not configured on server." });
    }
    const { sessionId } = req.params;
    const appUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const session = await MentoringSession.findById(sessionId)
      .populate("mentorUser", "fullName email")
      .populate("jobseeker", "fullName email");
    if (!session) return res.status(404).json({ message: "Session not found" });
    if (String(session.jobseeker?._id || session.jobseeker) !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    if (session.status !== "pending_payment") {
      return res.status(400).json({ message: "Payment is already processed for this session." });
    }

    const checkout = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: session.jobseeker?.email || undefined,
      success_url: `${appUrl}/student/dashboard?payment=mentoring_success&sessionId=${session._id}&checkoutSessionId={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/student/dashboard?payment=mentoring_cancelled&sessionId=${session._id}`,
      metadata: {
        type: "mentoring_session",
        mentoringSessionId: String(session._id),
        jobseekerId: String(session.jobseeker?._id || session.jobseeker),
        mentorUserId: String(session.mentorUser?._id || session.mentorUser),
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "inr",
            unit_amount: Math.max(Math.round(Number(session.totalAmount || 0) * 100), 100),
            product_data: {
              name: `Mentorship Session with ${session.mentorUser?.fullName || "Mentor"}`,
              description: `${session.minutes} minutes @ ${formatInr(
                (Number(session.pricePerMinuteAtBooking) || 0) * 60
              )}/hour`,
            },
          },
        },
      ],
    });

    session.stripeCheckoutSessionId = checkout.id;
    await session.save();

    res.json({
      checkoutUrl: checkout.url,
      checkoutSessionId: checkout.id,
      amount: session.totalAmount,
      currency: "INR",
    });
  } catch (e) {
    next(e);
  }
};

exports.getMentoringPaymentStatus = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const session = await MentoringSession.findById(sessionId);
    if (!session) return res.status(404).json({ message: "Session not found" });
    if (String(session.jobseeker) !== req.user.id && String(session.mentorUser) !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    res.json({
      status: session.status,
      paymentMethod: session.paymentMethod || null,
      paidAt: session.paidAt || null,
      invoiceNumber: session.invoiceNumber || null,
    });
  } catch (e) {
    next(e);
  }
};

exports.confirmMentoringPayment = async (req, res, next) => {
  try {
    if (!stripe) {
      return res.status(500).json({ message: "Stripe is not configured on server." });
    }
    const { sessionId } = req.params;
    const { checkoutSessionId } = req.body || {};
    if (!checkoutSessionId) {
      return res.status(400).json({ message: "checkoutSessionId is required" });
    }

    const session = await MentoringSession.findById(sessionId)
      .populate("jobseeker", "fullName email")
      .populate("mentorUser", "fullName email");
    if (!session) return res.status(404).json({ message: "Session not found" });
    if (String(session.jobseeker?._id || session.jobseeker) !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const checkout = await stripe.checkout.sessions.retrieve(checkoutSessionId);
    const paid = checkout.payment_status === "paid";
    const matches = String(checkout.metadata?.mentoringSessionId || "") === String(session._id);
    if (!matches) {
      return res.status(400).json({ message: "Checkout session does not match this mentoring session." });
    }
    if (!paid) {
      return res.status(400).json({ message: "Payment is not completed yet." });
    }

    const result = await markMentoringSessionPaid(session, checkout.payment_intent, checkout.id);
    if (result.newlyPaid) {
      await sendInvoiceEmail({
        session,
        student: session.jobseeker,
        mentor: session.mentorUser,
      });
    }

    return res.json({
      message: "Payment confirmed.",
      session: {
        id: session._id,
        status: session.status,
        invoiceNumber: session.invoiceNumber,
      },
    });
  } catch (e) {
    next(e);
  }
};

exports.createInvestorWalletCheckout = async (req, res, next) => {
  try {
    if (!stripe) {
      return res.status(500).json({ message: "Stripe is not configured on server." });
    }
    const amount = Number(req.body?.amount || 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ message: "amount must be a positive number" });
    }
    const amountInr = Math.round(amount);
    const user = await User.findById(req.user.id).select("fullName email");
    if (!user) return res.status(404).json({ message: "Investor not found" });
    const appUrl = process.env.FRONTEND_URL || "http://localhost:5173";

    const checkout = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: user.email || undefined,
      success_url: `${appUrl}/investor/dashboard?payment=wallet_success&checkoutSessionId={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/investor/dashboard?payment=wallet_cancelled`,
      metadata: {
        type: "investor_wallet_topup",
        userId: String(req.user.id),
        amountInr: String(amountInr),
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "inr",
            unit_amount: Math.max(amountInr * 100, 100),
            product_data: {
              name: "Investor Wallet Recharge",
              description: `Top-up wallet by ${formatInr(amountInr)}`,
            },
          },
        },
      ],
    });

    await PaymentRecord.create({
      user: req.user.id,
      purpose: "investor_wallet_topup",
      amount: amountInr,
      currency: "INR",
      stripeCheckoutSessionId: checkout.id,
      status: "pending",
      metadata: { createdBy: "checkout_api" },
    });

    return res.json({
      checkoutUrl: checkout.url,
      checkoutSessionId: checkout.id,
      amount: amountInr,
      currency: "INR",
    });
  } catch (e) {
    next(e);
  }
};

exports.confirmInvestorWalletRecharge = async (req, res, next) => {
  try {
    if (!stripe) {
      return res.status(500).json({ message: "Stripe is not configured on server." });
    }
    const checkoutSessionId = String(req.body?.checkoutSessionId || "").trim();
    if (!checkoutSessionId) {
      return res.status(400).json({ message: "checkoutSessionId is required" });
    }
    const checkout = await stripe.checkout.sessions.retrieve(checkoutSessionId);
    if (checkout.payment_status !== "paid") {
      return res.status(400).json({ message: "Payment is not completed yet." });
    }
    if (String(checkout?.metadata?.userId || "") !== String(req.user.id)) {
      return res.status(403).json({ message: "Checkout does not belong to this investor." });
    }
    const result = await creditInvestorWalletFromCheckout(checkout);
    const user = await User.findById(req.user.id).select("walletBalance");
    return res.json({
      message: result?.credited
        ? "Wallet recharge confirmed."
        : "Wallet recharge already processed.",
      walletBalance: user?.walletBalance ?? 0,
    });
  } catch (e) {
    next(e);
  }
};

exports.handleStripeWebhook = async (req, res) => {
  try {
    if (!stripe) return res.status(500).send("Stripe not configured");
    const sig = req.headers["stripe-signature"];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) return res.status(500).send("Missing STRIPE_WEBHOOK_SECRET");

    const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);

    if (event.type === "checkout.session.completed") {
      const checkout = event.data.object;
      const type = checkout?.metadata?.type;

      if (type === "investor_wallet_topup") {
        await creditInvestorWalletFromCheckout(checkout);
      } else {
        const sessionId = checkout?.metadata?.mentoringSessionId;
        if (sessionId) {
          const ms = await MentoringSession.findById(sessionId)
            .populate("jobseeker", "fullName email")
            .populate("mentorUser", "fullName email");
          if (ms) {
            const result = await markMentoringSessionPaid(ms, checkout.payment_intent, checkout.id);
            if (result.newlyPaid) {
              await sendInvoiceEmail({
                session: ms,
                student: ms.jobseeker,
                mentor: ms.mentorUser,
              });
            }
          }
        }
      }
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
};
