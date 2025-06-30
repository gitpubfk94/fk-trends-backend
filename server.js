const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

console.log("✅ Starting FK Trends backend...");
console.log("📦 Mail user from .env:", process.env.MAIL_USER);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '..'))); // Serve index.html, checkout.html etc

// Save order and send confirmation email
app.post('/api/order', (req, res) => {
  const order = req.body;

  // Save to orders.json
  fs.readFile('orders.json', 'utf8', (err, data) => {
    let orders = [];
    if (!err && data) {
      try {
        orders = JSON.parse(data);
      } catch (e) {
        orders = [];
      }
    }
    orders.push(order);
    fs.writeFile('orders.json', JSON.stringify(orders, null, 2), err => {
      if (err) {
        return res.status(500).send({ error: 'Failed to save order' });
      }

      // Email setup
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASS
        }
      });

      const itemsListHtml = order.items.map(item => `
        <li style="margin: 8px 0;"><strong>${item.name}</strong> – ₹${item.price}</li>
      `).join('');

      const mailOptions = {
        from: process.env.MAIL_USER,
        to: order.email,
        subject: `🧾 FK Trends Order Confirmation – ₹${order.total}`,
        html: `
          <div style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
            <h2 style="color: #2c3e50;">Thank you for your order, ${order.name}!</h2>
            <p>We’ve received your order and will ship it to:</p>
            <p style="margin: 10px 0; padding: 10px; background: #f4f4f4;">${order.address}</p>

            <h3 style="margin-top: 20px;">🛒 Order Summary</h3>
            <ul style="list-style-type: none; padding: 0;">
              ${itemsListHtml}
            </ul>

            <p><strong>Total Paid:</strong> ₹${order.total}</p>
            
            <p style="margin-top: 30px;">Thanks for shopping with FK Trends! 💖<br/>Stay stylish, stay trendy.</p>

            <hr/>
            <small style="color: #888;">This is an automated confirmation. No need to reply.</small>
          </div>
        `
      };

      transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
          console.error('Email failed:', err);
          return res.status(500).send({ error: 'Email failed' });
        }
        console.log('✅ Email sent:', info.response);
        res.send({ success: true });
      });
    });
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
