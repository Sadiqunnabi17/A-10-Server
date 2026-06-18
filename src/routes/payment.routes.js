const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { verifyToken } = require("../middleware/verifyToken");
const Ebook = require("../models/Ebook");
const Transaction = require("../models/Transaction");

// CREATE CHECKOUT SESSION
router.post("/create-checkout-session", verifyToken, async (req, res) => {
  try {
    const { ebookId } = req.body;

    const ebook = await Ebook.findById(ebookId);
    if (!ebook) {
      return res.status(404).json({ message: "Ebook not found" });
    }

    // Prevent writer from buying their own ebook
    if (ebook.writer.toString() === req.user.id) {
      return res
        .status(400)
        .json({ message: "You cannot purchase your own ebook" });
    }

    // Check if already purchased
    const alreadyPurchased = await Transaction.findOne({
      buyer: req.user.id,
      ebook: ebookId,
      type: "purchase",
    });

    if (alreadyPurchased) {
      return res.status(400).json({ message: "Already purchased" });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: ebook.title,
              description: ebook.description,
              images: [ebook.coverImage],
            },
            unit_amount: Math.round(ebook.price * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}&ebook_id=${ebookId}`,
      cancel_url: `${process.env.CLIENT_URL}/ebooks/${ebookId}`,
      metadata: {
        ebookId: ebookId,
        buyerId: req.user.id,
      },
    });

    res.status(200).json({ url: session.url });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// CONFIRM PAYMENT (called after successful stripe payment)
router.post("/confirm", verifyToken, async (req, res) => {
  try {
    const { sessionId, ebookId } = req.body;

    // Verify session with Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return res.status(400).json({ message: "Payment not completed" });
    }

    // Check if transaction already recorded
    const existing = await Transaction.findOne({
      stripeSessionId: sessionId,
    });

    if (existing) {
      return res.status(200).json({ message: "Already recorded" });
    }

    const ebook = await Ebook.findById(ebookId);

    // Save transaction
    await Transaction.create({
      type: "purchase",
      buyer: req.user.id,
      ebook: ebookId,
      amount: ebook.price,
      stripeSessionId: sessionId,
    });

    res.status(201).json({ message: "Purchase confirmed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;