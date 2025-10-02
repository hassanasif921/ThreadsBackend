# Dispute API Documentation

This API provides endpoints for users to file and manage disputes in the Stitch Dictionary mobile app.

## Overview

The Dispute API allows users to:
- File disputes for various issues
- Track dispute status and progress
- Update dispute information
- Cancel disputes
- Provide satisfaction ratings after resolution
- View dispute history and statistics

## Base URL
```
/api/disputes
```

## Authentication
All endpoints require user authentication via JWT token.

## Dispute Categories

The system supports the following dispute categories:

| Category | Description |
|----------|-------------|
| `billing` | Billing & Payments - Issues related to charges, refunds, or payment methods |
| `technical_issue` | Technical Issue - App crashes, bugs, or performance problems |
| `content_issue` | Content Issue - Problems with stitching patterns or instructions |
| `account_access` | Account Access - Login problems or account recovery |
| `privacy_concern` | Privacy Concern - Data privacy or security concerns |
| `inappropriate_content` | Inappropriate Content - Report inappropriate or offensive content |
| `feature_request` | Feature Request - Suggest new features or improvements |
| `other` | Other - Any other issues not covered above |

## Dispute Status Flow

```
open → in_progress → resolved → closed
  ↓
cancelled
```

- **open**: Newly created dispute
- **in_progress**: Being reviewed by support team
- **resolved**: Issue has been resolved
- **closed**: Dispute is closed (final state)
- **cancelled**: User cancelled the dispute

## API Endpoints

### Get Dispute Categories
```http
GET /api/disputes/categories
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "value": "billing",
      "label": "Billing & Payments",
      "description": "Issues related to charges, refunds, or payment methods"
    },
    {
      "value": "technical_issue",
      "label": "Technical Issue",
      "description": "App crashes, bugs, or performance problems"
    }
  ]
}
```

### Create Dispute
```http
POST /api/disputes/:userId
```

**Request Body:**
```json
{
  "category": "technical_issue",
  "subject": "App crashes when viewing stitch details",
  "description": "The app consistently crashes when I try to view the details of any stitch pattern. This started happening after the latest update.",
  "priority": "high",
  "contactInfo": {
    "email": "user@example.com",
    "phone": "+1234567890",
    "preferredContactMethod": "email"
  },
  "relatedItems": {
    "stitchId": "stitch_id_here",
    "orderId": "order_123",
    "transactionId": "txn_456"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Dispute created successfully",
  "data": {
    "disputeId": "DSP-1K2L3M4N5O-ABC12",
    "status": "open",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Get User Disputes
```http
GET /api/disputes/:userId?status=open&category=technical_issue&limit=20&offset=0
```

**Query Parameters:**
- `status` - Filter by status (optional)
- `category` - Filter by category (optional)
- `limit` - Number of results per page (default: 20)
- `offset` - Number of results to skip (default: 0)
- `sortBy` - Sort field (default: createdAt)
- `sortOrder` - Sort order: asc/desc (default: desc)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "dispute_id",
      "disputeId": "DSP-1K2L3M4N5O-ABC12",
      "category": "technical_issue",
      "subject": "App crashes when viewing stitch details",
      "description": "The app consistently crashes...",
      "priority": "high",
      "status": "open",
      "contactInfo": {
        "email": "user@example.com",
        "phone": "+1234567890",
        "preferredContactMethod": "email"
      },
      "relatedItems": {
        "stitchId": {
          "_id": "stitch_id",
          "name": "Basic Chain Stitch",
          "referenceNumber": "BCS001"
        }
      },
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "total": 5,
    "limit": 20,
    "offset": 0,
    "hasMore": false
  }
}
```

### Get Dispute by ID
```http
GET /api/disputes/:userId/:disputeId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "dispute_id",
    "disputeId": "DSP-1K2L3M4N5O-ABC12",
    "category": "technical_issue",
    "subject": "App crashes when viewing stitch details",
    "description": "The app consistently crashes...",
    "priority": "high",
    "status": "in_progress",
    "contactInfo": {
      "email": "user@example.com",
      "phone": "+1234567890",
      "preferredContactMethod": "email"
    },
    "relatedItems": {
      "stitchId": {
        "_id": "stitch_id",
        "name": "Basic Chain Stitch",
        "referenceNumber": "BCS001"
      }
    },
    "resolution": {
      "resolvedBy": null,
      "resolvedAt": null,
      "resolutionNote": null,
      "satisfactionRating": null
    },
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T12:45:00.000Z"
  }
}
```

### Update Dispute
```http
PUT /api/disputes/:userId/:disputeId
```

**Request Body:**
```json
{
  "description": "Updated description with more details...",
  "contactInfo": {
    "phone": "+1987654321",
    "preferredContactMethod": "phone"
  },
  "priority": "urgent"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Dispute updated successfully",
  "data": {
    // Updated dispute object
  }
}
```

### Cancel Dispute
```http
DELETE /api/disputes/:userId/:disputeId
```

**Request Body:**
```json
{
  "reason": "Issue resolved on its own"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Dispute cancelled successfully"
}
```

### Add Satisfaction Rating
```http
POST /api/disputes/:userId/:disputeId/rating
```

**Request Body:**
```json
{
  "rating": 5,
  "feedback": "Excellent support! The issue was resolved quickly and professionally."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Thank you for your feedback"
}
```

### Get User Dispute Statistics
```http
GET /api/disputes/:userId/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 8,
    "byStatus": {
      "open": 2,
      "in_progress": 1,
      "resolved": 4,
      "closed": 1,
      "cancelled": 0
    }
  }
}
```

## Usage Examples

### Mobile App Integration

#### File a New Dispute
```javascript
async function fileDispute(userId, disputeData) {
  try {
    const response = await fetch(`/api/disputes/${userId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify(disputeData)
    });
    
    const result = await response.json();
    if (result.success) {
      // Show success message with dispute ID
      showSuccessMessage(`Dispute filed successfully. Reference: ${result.data.disputeId}`);
    }
  } catch (error) {
    console.error('Error filing dispute:', error);
  }
}

// Usage
const disputeData = {
  category: 'technical_issue',
  subject: 'App crashes on startup',
  description: 'The app crashes immediately when I try to open it...',
  priority: 'high',
  contactInfo: {
    email: 'user@example.com',
    preferredContactMethod: 'email'
  }
};

await fileDispute('user123', disputeData);
```

#### Load User Disputes
```javascript
async function loadUserDisputes(userId, filters = {}) {
  try {
    const queryParams = new URLSearchParams(filters);
    const response = await fetch(`/api/disputes/${userId}?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${userToken}`
      }
    });
    
    const result = await response.json();
    if (result.success) {
      displayDisputes(result.data);
      updatePagination(result.pagination);
    }
  } catch (error) {
    console.error('Error loading disputes:', error);
  }
}

// Usage
await loadUserDisputes('user123', {
  status: 'open',
  limit: 10,
  offset: 0
});
```

#### Track Dispute Status
```javascript
async function checkDisputeStatus(userId, disputeId) {
  try {
    const response = await fetch(`/api/disputes/${userId}/${disputeId}`, {
      headers: {
        'Authorization': `Bearer ${userToken}`
      }
    });
    
    const result = await response.json();
    if (result.success) {
      const dispute = result.data;
      updateDisputeUI(dispute);
      
      // Show rating form if resolved
      if (dispute.status === 'resolved' && !dispute.resolution.satisfactionRating) {
        showSatisfactionRatingForm(disputeId);
      }
    }
  } catch (error) {
    console.error('Error checking dispute status:', error);
  }
}
```

#### Submit Satisfaction Rating
```javascript
async function submitRating(userId, disputeId, rating, feedback) {
  try {
    const response = await fetch(`/api/disputes/${userId}/${disputeId}/rating`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({ rating, feedback })
    });
    
    const result = await response.json();
    if (result.success) {
      showThankYouMessage();
    }
  } catch (error) {
    console.error('Error submitting rating:', error);
  }
}
```

### Dispute Form Component Example

```javascript
// React Native component example
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Picker, Button, Alert } from 'react-native';

const DisputeForm = ({ userId, onSubmit }) => {
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    category: '',
    subject: '',
    description: '',
    priority: 'medium',
    contactInfo: {
      email: '',
      preferredContactMethod: 'email'
    }
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/disputes/categories');
      const result = await response.json();
      if (result.success) {
        setCategories(result.data);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleSubmit = async () => {
    if (!formData.category || !formData.subject || !formData.description) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch(`/api/disputes/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      if (result.success) {
        Alert.alert(
          'Success', 
          `Dispute filed successfully. Reference: ${result.data.disputeId}`
        );
        onSubmit(result.data);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to submit dispute');
    }
  };

  return (
    <View>
      <Text>Category *</Text>
      <Picker
        selectedValue={formData.category}
        onValueChange={(value) => setFormData({...formData, category: value})}
      >
        <Picker.Item label="Select a category" value="" />
        {categories.map(cat => (
          <Picker.Item key={cat.value} label={cat.label} value={cat.value} />
        ))}
      </Picker>

      <Text>Subject *</Text>
      <TextInput
        value={formData.subject}
        onChangeText={(text) => setFormData({...formData, subject: text})}
        placeholder="Brief description of the issue"
        maxLength={200}
      />

      <Text>Description *</Text>
      <TextInput
        value={formData.description}
        onChangeText={(text) => setFormData({...formData, description: text})}
        placeholder="Detailed description of the issue"
        multiline
        numberOfLines={4}
        maxLength={2000}
      />

      <Text>Priority</Text>
      <Picker
        selectedValue={formData.priority}
        onValueChange={(value) => setFormData({...formData, priority: value})}
      >
        <Picker.Item label="Low" value="low" />
        <Picker.Item label="Medium" value="medium" />
        <Picker.Item label="High" value="high" />
        <Picker.Item label="Urgent" value="urgent" />
      </Picker>

      <Text>Email *</Text>
      <TextInput
        value={formData.contactInfo.email}
        onChangeText={(text) => setFormData({
          ...formData, 
          contactInfo: {...formData.contactInfo, email: text}
        })}
        placeholder="your@email.com"
        keyboardType="email-address"
      />

      <Button title="Submit Dispute" onPress={handleSubmit} />
    </View>
  );
};
```

## Error Responses

### 400 - Bad Request
```json
{
  "success": false,
  "message": "Category, subject, description, and email are required"
}
```

### 404 - Dispute Not Found
```json
{
  "success": false,
  "message": "Dispute not found"
}
```

### 401 - Unauthorized
```json
{
  "success": false,
  "message": "Unauthorized access"
}
```

### 500 - Server Error
```json
{
  "success": false,
  "message": "Error creating dispute",
  "error": "Database connection failed"
}
```

## Best Practices

### For Mobile Apps
1. **Validate input** before sending to API
2. **Show progress indicators** during submission
3. **Cache dispute categories** to reduce API calls
4. **Provide clear feedback** on submission success/failure
5. **Allow users to track** dispute status easily
6. **Implement offline support** for viewing existing disputes

### For User Experience
1. **Pre-fill known information** (email, user details)
2. **Provide helpful category descriptions**
3. **Show character limits** for text fields
4. **Allow file attachments** for evidence (future enhancement)
5. **Send notifications** for status updates
6. **Make it easy to contact support** directly

### Security Considerations
1. **Validate user ownership** of disputes
2. **Sanitize all input** to prevent injection attacks
3. **Rate limit** dispute creation to prevent spam
4. **Log all actions** for audit purposes
5. **Protect sensitive information** in dispute details

## Notifications Integration

The system automatically sends notifications when:
- A dispute is submitted (confirmation)
- Status changes (in_progress, resolved, closed)
- Admin adds notes or requests more information

## Future Enhancements

Potential features to add:
- File attachment support
- Real-time chat with support
- Dispute escalation workflow
- Admin dashboard for managing disputes
- Automated responses based on category
- Integration with external support systems
