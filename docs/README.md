# Square Subscription Testing Documentation

This directory contains comprehensive testing documentation and tools for the Square subscription integration.

## 📁 Files Overview

### 📖 Documentation
- **`SUBSCRIPTION_TESTING_GUIDE.md`** - Complete testing guide with all API endpoints, test cases, and expected responses
- **`README.md`** - This file, overview of testing resources

### 🔧 Testing Tools
- **`Square_Subscriptions_API.postman_collection.json`** - Postman collection for API testing
- **`../scripts/testSubscriptionFlow.js`** - Automated test script
- **`../scripts/setupTesting.js`** - Test data setup script
- **`../scripts/listSquarePlans.js`** - List existing Square plans
- **`../scripts/getSquareLocations.js`** - Get Square location IDs

## 🚀 Quick Start Testing

### 1. **Environment Setup**
Ensure your `.env` file has:
```bash
SQUARE_ACCESS_TOKEN=your_sandbox_token
SQUARE_LOCATION_ID=your_location_id
SQUARE_MONTHLY_PLAN_ID=BKWHGZNOZJ3NAYFHKK3GXWRK
SQUARE_YEARLY_PLAN_ID=CQF77RXHW5LF6T7ISZ7VWVZ3
```

### 2. **Setup Test Data**
```bash
node scripts/setupTesting.js
```
This creates test users and sample stitches, and provides a JWT token.

### 3. **Run Automated Tests**
```bash
# Update userToken in the script first
node scripts/testSubscriptionFlow.js
```

### 4. **Manual Testing with Postman**
1. Import `Square_Subscriptions_API.postman_collection.json`
2. Update environment variables (baseUrl, userToken, etc.)
3. Run the collection

## 📋 Test Scenarios Covered

### ✅ **Basic Flow**
- [x] View subscription plans
- [x] View free content (unauthenticated)
- [x] Check user subscription status
- [x] Start free trial
- [x] Access premium content during trial
- [x] Create paid subscription
- [x] Access premium content with subscription
- [x] Cancel subscription

### ✅ **Payment Testing**
- [x] Successful payments
- [x] Declined payments
- [x] One-time payments
- [x] Subscription payments

### ✅ **Error Handling**
- [x] Invalid plan IDs
- [x] Duplicate subscriptions
- [x] Trial already used
- [x] Premium access without subscription
- [x] Authentication errors

### ✅ **Admin Features**
- [x] Subscription analytics
- [x] User management
- [x] Webhook handling

## 🧪 Square Sandbox Test Data

### Test Cards
- **Success**: `4111 1111 1111 1111`
- **Decline**: `4000 0000 0000 0002`
- **Insufficient Funds**: `4000 0000 0000 9995`

### Test Card Nonces
- **Success**: `cnon:card-nonce-ok`
- **Decline**: `cnon:card-nonce-declined`
- **Insufficient**: `cnon:card-nonce-insufficient-funds`

## 📊 Expected Results

### Free User
```json
{
  "subscriptionStatus": "free",
  "hasPremiumAccess": false,
  "trialUsed": false
}
```

### Trial User
```json
{
  "subscriptionStatus": "trial",
  "hasPremiumAccess": true,
  "premiumAccessUntil": "2025-10-11T07:23:18.000Z"
}
```

### Premium User
```json
{
  "subscriptionStatus": "premium_monthly",
  "hasPremiumAccess": true,
  "currentPeriodEnd": "2025-11-04T07:23:18.000Z"
}
```

## 🔍 Debugging Tips

### Common Issues
1. **401 Unauthorized**: Check JWT token and Square access token
2. **404 Plan Not Found**: Verify plan IDs in Square dashboard
3. **Payment Declined**: Use correct test card nonces
4. **Location Error**: Verify Square location ID

### Useful Commands
```bash
# Check Square plans
node scripts/listSquarePlans.js

# Check Square locations
node scripts/getSquareLocations.js

# View server logs
npm run dev

# Test specific endpoint
curl -X GET http://localhost:3000/api/subscriptions/plans
```

## 📈 Success Metrics

A successful test run should show:
- ✅ All public endpoints accessible
- ✅ Authentication working
- ✅ Free trial activation
- ✅ Premium content protection
- ✅ Payment processing
- ✅ Subscription management
- ✅ Proper error handling

## 🎯 Next Steps After Testing

1. **Production Setup**: Switch to production Square credentials
2. **Webhook Configuration**: Set up webhook endpoints
3. **Frontend Integration**: Connect with your frontend application
4. **Monitoring**: Set up logging and analytics
5. **Security Review**: Audit authentication and payment flows

## 📞 Support

If you encounter issues:
1. Check the detailed guide: `SUBSCRIPTION_TESTING_GUIDE.md`
2. Review server logs for errors
3. Verify Square dashboard configuration
4. Test with different user scenarios

---

**Happy Testing! 🚀**
