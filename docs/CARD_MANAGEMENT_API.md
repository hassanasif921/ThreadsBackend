# Card Management API Documentation

## 🎯 **Overview**

Complete card management system for handling user payment methods with Square integration.

## 📋 **API Endpoints**

### **1. Get User's Saved Cards**
```bash
GET /api/cards
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "ccof:CA4SEgAUdmYghzgzlvJT7O9Hl5Rwog",
      "last4": "1111",
      "cardBrand": "VISA",
      "expMonth": 12,
      "expYear": 2025,
      "cardholderName": "John Doe",
      "enabled": true,
      "cardType": "CREDIT"
    }
  ],
  "message": "Cards retrieved successfully"
}
```

### **2. Add New Card**
```bash
POST /api/cards
Authorization: Bearer {token}
Content-Type: application/json

{
  "paymentMethodId": "cnon:card-nonce-ok",
  "setAsDefault": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "ccof:CA4SEgAUdmYghzgzlvJT7O9Hl5Rwog",
    "last4": "1111",
    "cardBrand": "VISA",
    "expMonth": 12,
    "expYear": 2025,
    "enabled": true
  },
  "message": "Card added successfully"
}
```

### **3. Get Default Card**
```bash
GET /api/cards/default
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "ccof:CA4SEgAUdmYghzgzlvJT7O9Hl5Rwog",
    "last4": "1111",
    "cardBrand": "VISA",
    "expMonth": 12,
    "expYear": 2025,
    "enabled": true
  },
  "message": "Default card retrieved"
}
```

### **4. Update Card (Set as Default)**
```bash
PUT /api/cards/{cardId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "setAsDefault": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "ccof:CA4SEgAUdmYghzgzlvJT7O9Hl5Rwog",
    "last4": "1111",
    "cardBrand": "VISA",
    "isDefault": true
  },
  "message": "Default card updated successfully"
}
```

### **5. Remove Card**
```bash
DELETE /api/cards/{cardId}
Authorization: Bearer {token}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Card removed successfully"
}
```

**Error Response (Card in Use):**
```json
{
  "success": false,
  "message": "Cannot remove card that is being used by an active subscription",
  "code": "CARD_IN_USE"
}
```

## 🧪 **Testing Examples**

### **Test 1: Add a Card**
```bash
curl -X POST http://localhost:3000/api/cards \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "paymentMethodId": "cnon:card-nonce-ok",
    "setAsDefault": true
  }'
```

### **Test 2: List All Cards**
```bash
curl -X GET http://localhost:3000/api/cards \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### **Test 3: Get Default Card**
```bash
curl -X GET http://localhost:3000/api/cards/default \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### **Test 4: Remove a Card**
```bash
curl -X DELETE http://localhost:3000/api/cards/CARD_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🔒 **Security Features**

### **1. Card Protection**
- ✅ **Cannot remove cards** used by active subscriptions
- ✅ **User isolation** - users can only access their own cards
- ✅ **Authentication required** for all endpoints
- ✅ **Secure tokenization** via Square

### **2. Data Privacy**
- ✅ **No full card numbers** stored or returned
- ✅ **Only last 4 digits** shown
- ✅ **PCI compliance** through Square
- ✅ **Encrypted storage** in Square vault

## 💳 **Frontend Integration**

### **Card Management Component Example:**
```javascript
class CardManager {
  constructor(apiBaseUrl, authToken) {
    this.apiBaseUrl = apiBaseUrl;
    this.authToken = authToken;
  }

  async getCards() {
    const response = await fetch(`${this.apiBaseUrl}/api/cards`, {
      headers: { Authorization: `Bearer ${this.authToken}` }
    });
    return response.json();
  }

  async addCard(paymentMethodId, setAsDefault = false) {
    const response = await fetch(`${this.apiBaseUrl}/api/cards`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ paymentMethodId, setAsDefault })
    });
    return response.json();
  }

  async removeCard(cardId) {
    const response = await fetch(`${this.apiBaseUrl}/api/cards/${cardId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${this.authToken}` }
    });
    return response.json();
  }

  async setDefaultCard(cardId) {
    const response = await fetch(`${this.apiBaseUrl}/api/cards/${cardId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ setAsDefault: true })
    });
    return response.json();
  }
}
```

## 🔄 **Subscription Integration**

### **Using Saved Cards for Subscriptions:**
```bash
# 1. Get user's cards
GET /api/cards

# 2. Use saved card for subscription
POST /api/subscriptions/subscribe
{
  "planId": "monthly",
  "paymentMethodId": "ccof:SAVED_CARD_ID"
}
```

## ⚠️ **Important Notes**

### **Card Removal Restrictions:**
- Cards used by **active subscriptions** cannot be removed
- Users must **cancel subscription** or **change payment method** first
- **Disabled cards** are hidden from user but kept for audit

### **Default Card Logic:**
- **First added card** becomes default automatically
- **Explicit setting** via API overrides automatic selection
- **Default card** used for new subscriptions if no card specified

### **Error Handling:**
- **Invalid card nonces** return clear error messages
- **Expired cards** are handled gracefully
- **Network failures** include retry suggestions

## 🚀 **Production Considerations**

### **1. Webhooks Integration**
Set up webhooks to handle:
- Card expiration notifications
- Failed payment updates
- Card status changes

### **2. User Experience**
- **Auto-save cards** during subscription signup
- **Card expiration warnings** before renewal
- **Easy card switching** in subscription settings

### **3. Compliance**
- **PCI DSS** compliance through Square
- **Data retention** policies for disabled cards
- **Audit logging** for card operations

This card management system provides a complete solution for handling user payment methods securely and efficiently! 🎉
