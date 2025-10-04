# Square Payment Methods Guide

## 🎯 **Overview**

Payment Method IDs (card nonces) are temporary tokens that represent payment information. They must be created on the frontend using Square's Web Payments SDK and then sent to your backend for processing.

## 🔧 **Frontend Implementation**

### **1. HTML Setup**

```html
<!DOCTYPE html>
<html>
<head>
    <title>Square Payment Form</title>
    <script type="text/javascript" src="https://sandbox-web.squarecdn.com/v1/square.js"></script>
</head>
<body>
    <div id="card-container"></div>
    <button id="card-button" type="button">Pay Now</button>

    <script>
        // Your Square application ID (from Square Dashboard)
        const appId = 'sandbox-sq0idb-YOUR_SANDBOX_APP_ID';
        const locationId = 'YOUR_LOCATION_ID';

        async function initializeCard(payments) {
            const card = await payments.card();
            await card.attach('#card-container');
            return card;
        }

        async function createPayment(token) {
            // Send the token to your backend
            const response = await fetch('/api/subscriptions/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userToken}`
                },
                body: JSON.stringify({
                    planId: 'BKWHGZNOZJ3NAYFHKK3GXWRK',
                    paymentMethodId: token
                })
            });

            const result = await response.json();
            if (result.success) {
                alert('Subscription created successfully!');
            } else {
                alert('Payment failed: ' + result.message);
            }
        }

        document.addEventListener('DOMContentLoaded', async function () {
            if (!window.Square) {
                throw new Error('Square.js failed to load properly');
            }

            let payments;
            try {
                payments = window.Square.payments(appId, locationId);
            } catch {
                const statusContainer = document.getElementById('payment-status-container');
                statusContainer.className = 'missing-credentials';
                statusContainer.style.visibility = 'visible';
                return;
            }

            let card;
            try {
                card = await initializeCard(payments);
            } catch (e) {
                console.error('Initializing Card failed', e);
                return;
            }

            // Checkpoint 2.
            async function handlePaymentMethodSubmission(event, paymentMethod) {
                event.preventDefault();

                try {
                    // disable the submit button as we await tokenization and make a payment request.
                    cardButton.disabled = true;
                    const token = await paymentMethod.tokenize();
                    if (token.status === 'OK') {
                        console.log(`Payment token is ${token.token}`);
                        // Send token to your backend
                        await createPayment(token.token);
                    }
                } catch (e) {
                    cardButton.disabled = false;
                    console.error(e.message);
                }
            }

            const cardButton = document.getElementById('card-button');
            cardButton.addEventListener('click', async function (event) {
                await handlePaymentMethodSubmission(event, card);
            });
        });
    </script>
</body>
</html>
```

### **2. React Implementation**

```jsx
import { useEffect, useState } from 'react';

const SquarePaymentForm = ({ onPaymentSuccess }) => {
    const [payments, setPayments] = useState(null);
    const [card, setCard] = useState(null);

    useEffect(() => {
        const initSquare = async () => {
            if (!window.Square) {
                console.error('Square.js not loaded');
                return;
            }

            const paymentsInstance = window.Square.payments(
                'sandbox-sq0idb-YOUR_SANDBOX_APP_ID', // Your app ID
                'YOUR_LOCATION_ID' // Your location ID
            );
            setPayments(paymentsInstance);

            try {
                const cardInstance = await paymentsInstance.card();
                await cardInstance.attach('#card-container');
                setCard(cardInstance);
            } catch (error) {
                console.error('Failed to initialize card:', error);
            }
        };

        initSquare();
    }, []);

    const handlePayment = async (planId) => {
        if (!card) return;

        try {
            const result = await card.tokenize();
            
            if (result.status === 'OK') {
                // Send to your backend
                const response = await fetch('/api/subscriptions/subscribe', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({
                        planId: planId,
                        paymentMethodId: result.token
                    })
                });

                const data = await response.json();
                if (data.success) {
                    onPaymentSuccess(data);
                } else {
                    console.error('Payment failed:', data.message);
                }
            } else {
                console.error('Tokenization failed:', result.errors);
            }
        } catch (error) {
            console.error('Payment error:', error);
        }
    };

    return (
        <div>
            <div id="card-container"></div>
            <button onClick={() => handlePayment('BKWHGZNOZJ3NAYFHKK3GXWRK')}>
                Subscribe Monthly ($9.99)
            </button>
            <button onClick={() => handlePayment('CQF77RXHW5LF6T7ISZ7VWVZ3')}>
                Subscribe Yearly ($99.99)
            </button>
        </div>
    );
};

export default SquarePaymentForm;
```

## 🧪 **Testing with Sandbox**

### **Test Card Nonces (No Frontend Required)**

For testing purposes, Square provides pre-generated card nonces:

```javascript
// Test nonces for different scenarios
const testNonces = {
    success: 'cnon:card-nonce-ok',
    declined: 'cnon:card-nonce-declined',
    insufficientFunds: 'cnon:card-nonce-insufficient-funds',
    cvvFailure: 'cnon:card-nonce-cvv-failure',
    avsFailure: 'cnon:card-nonce-avs-failure'
};

// Use in your API tests
curl -X POST http://localhost:3000/api/subscriptions/subscribe \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "planId": "BKWHGZNOZJ3NAYFHKK3GXWRK",
    "paymentMethodId": "cnon:card-nonce-ok"
  }'
```

### **Test Credit Cards (For Frontend Testing)**

```javascript
const testCards = {
    visa: {
        number: '4111 1111 1111 1111',
        cvv: '111',
        expiry: '12/25',
        postalCode: '12345'
    },
    mastercard: {
        number: '5555 5555 5555 4444',
        cvv: '111', 
        expiry: '12/25',
        postalCode: '12345'
    },
    amex: {
        number: '3782 822463 10005',
        cvv: '1111',
        expiry: '12/25',
        postalCode: '12345'
    },
    declined: {
        number: '4000 0000 0000 0002',
        cvv: '111',
        expiry: '12/25',
        postalCode: '12345'
    }
};
```

## 🔒 **Security Best Practices**

### **1. Never Store Card Data**
```javascript
// ❌ NEVER do this
const cardData = {
    number: '4111111111111111',
    cvv: '123',
    expiry: '12/25'
};

// ✅ Always use tokens
const paymentMethodId = 'cnon:card-nonce-ok'; // From Square SDK
```

### **2. Validate on Backend**
```javascript
// In your backend controller
exports.createSubscription = async (req, res) => {
    const { planId, paymentMethodId } = req.body;
    
    // Validate payment method ID format
    if (!paymentMethodId || !paymentMethodId.startsWith('cnon:')) {
        return res.status(400).json({
            success: false,
            message: 'Invalid payment method ID'
        });
    }
    
    // Process with Square
    // ...
};
```

## 📱 **Complete Frontend Example**

```html
<!DOCTYPE html>
<html>
<head>
    <title>Subscription Payment</title>
    <script src="https://sandbox-web.squarecdn.com/v1/square.js"></script>
    <style>
        .payment-form {
            max-width: 400px;
            margin: 50px auto;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 8px;
        }
        
        #card-container {
            margin: 20px 0;
            padding: 10px;
            border: 1px solid #ccc;
            border-radius: 4px;
        }
        
        .plan-button {
            width: 100%;
            padding: 12px;
            margin: 10px 0;
            background: #007cba;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
        
        .plan-button:hover {
            background: #005a87;
        }
        
        .plan-button:disabled {
            background: #ccc;
            cursor: not-allowed;
        }
    </style>
</head>
<body>
    <div class="payment-form">
        <h2>Choose Your Plan</h2>
        
        <div class="plan-option">
            <h3>Monthly Plan - $9.99/month</h3>
            <ul>
                <li>Access to all premium stitches</li>
                <li>High-quality images and videos</li>
                <li>Detailed instructions</li>
            </ul>
            <button id="monthly-button" class="plan-button">Subscribe Monthly</button>
        </div>
        
        <div class="plan-option">
            <h3>Yearly Plan - $99.99/year</h3>
            <ul>
                <li>All monthly features</li>
                <li>Save 17% with annual billing</li>
                <li>Priority support</li>
                <li>Early access to new patterns</li>
            </ul>
            <button id="yearly-button" class="plan-button">Subscribe Yearly (Recommended)</button>
        </div>
        
        <div id="card-container"></div>
        <div id="payment-status"></div>
    </div>

    <script>
        const APP_ID = 'sandbox-sq0idb-YOUR_SANDBOX_APP_ID';
        const LOCATION_ID = 'YOUR_LOCATION_ID';
        const USER_TOKEN = 'YOUR_USER_JWT_TOKEN'; // Get from login

        let payments, card;

        async function initializeSquare() {
            if (!window.Square) {
                throw new Error('Square.js failed to load');
            }

            payments = window.Square.payments(APP_ID, LOCATION_ID);
            card = await payments.card();
            await card.attach('#card-container');
        }

        async function processSubscription(planId, planName) {
            const statusDiv = document.getElementById('payment-status');
            const buttons = document.querySelectorAll('.plan-button');
            
            try {
                // Disable all buttons
                buttons.forEach(btn => btn.disabled = true);
                statusDiv.innerHTML = 'Processing payment...';

                // Tokenize the card
                const result = await card.tokenize();
                
                if (result.status === 'OK') {
                    // Send to backend
                    const response = await fetch('/api/subscriptions/subscribe', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${USER_TOKEN}`
                        },
                        body: JSON.stringify({
                            planId: planId,
                            paymentMethodId: result.token
                        })
                    });

                    const data = await response.json();
                    
                    if (data.success) {
                        statusDiv.innerHTML = `✅ Successfully subscribed to ${planName}!`;
                        statusDiv.style.color = 'green';
                        
                        // Redirect or update UI
                        setTimeout(() => {
                            window.location.href = '/dashboard';
                        }, 2000);
                    } else {
                        throw new Error(data.message);
                    }
                } else {
                    throw new Error('Payment tokenization failed');
                }
            } catch (error) {
                statusDiv.innerHTML = `❌ Error: ${error.message}`;
                statusDiv.style.color = 'red';
                
                // Re-enable buttons
                buttons.forEach(btn => btn.disabled = false);
            }
        }

        // Initialize when page loads
        document.addEventListener('DOMContentLoaded', async () => {
            try {
                await initializeSquare();
                
                document.getElementById('monthly-button').addEventListener('click', () => {
                    processSubscription('BKWHGZNOZJ3NAYFHKK3GXWRK', 'Monthly Plan');
                });
                
                document.getElementById('yearly-button').addEventListener('click', () => {
                    processSubscription('CQF77RXHW5LF6T7ISZ7VWVZ3', 'Yearly Plan');
                });
            } catch (error) {
                document.getElementById('payment-status').innerHTML = 
                    `❌ Failed to initialize payment form: ${error.message}`;
            }
        });
    </script>
</body>
</html>
```

## 🚀 **Quick Testing Steps**

1. **For API Testing (Backend Only):**
   ```bash
   # Use pre-generated test nonces
   curl -X POST http://localhost:3000/api/subscriptions/subscribe \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"planId": "BKWHGZNOZJ3NAYFHKK3GXWRK", "paymentMethodId": "cnon:card-nonce-ok"}'
   ```

2. **For Frontend Testing:**
   - Use the HTML example above
   - Replace `YOUR_SANDBOX_APP_ID` and `YOUR_LOCATION_ID` with your actual values
   - Use test credit card numbers provided

3. **Get Your Square Credentials:**
   - Go to [Square Developer Dashboard](https://developer.squareup.com/)
   - Navigate to your application
   - Copy the **Sandbox Application ID** and **Location ID**

## 📋 **Summary**

- **Payment Method IDs** are created on the frontend using Square's Web Payments SDK
- **Test nonces** like `cnon:card-nonce-ok` can be used for backend API testing
- **Real payment forms** require the Square.js library and proper tokenization
- **Never store** actual card data - always use tokens
- **Validate tokens** on your backend before processing

This approach ensures PCI compliance and secure payment processing! 🔒
