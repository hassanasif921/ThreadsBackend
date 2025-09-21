# Step Completion API Documentation

## Mark Single Step Complete

**Endpoint:** `POST /api/stitches/:id/steps/:stepId/complete`

**Description:** Marks a specific step as completed for a user, tracking progress with timestamps, notes, and optional metadata.

**Authentication:** Required (JWT Bearer Token)

### URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | String | Yes | The stitch ID (MongoDB ObjectId) |
| `stepId` | String | Yes | The step ID (MongoDB ObjectId) |

### Request Headers

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Request Body (Optional)

All fields in the request body are optional:

```json
{
  "notes": "This step was challenging but I managed to complete it",
  "difficultyRating": 4,
  "timeSpent": 1800
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `notes` | String | No | User notes about completing this step |
| `difficultyRating` | Number | No | User's difficulty rating (1-5 scale) |
| `timeSpent` | Number | No | Time spent on this step in seconds |

### Success Response

**Status Code:** `200 OK`

```json
{
  "success": true,
  "data": {
    "_id": "68c7d5291a9d8a0a7a69a788",
    "userId": "68c48d9b30271e909bc10a0e",
    "stitch": "68c7d5291a9d8a0a7a69a788",
    "completedSteps": [
      {
        "step": {
          "_id": "68cf4bfeec85981f32f24f8e",
          "stepNumber": 1,
          "title": "Getting Started",
          "instruction": "Begin by preparing your materials"
        },
        "completedAt": "2025-09-21T01:30:45.123Z",
        "notes": "This step was challenging but I managed to complete it",
        "difficultyRating": 4,
        "timeSpent": 1800,
        "_id": "68cf4bfeec85981f32f24f8f"
      }
    ],
    "isFavorite": false,
    "notes": "",
    "practiceCount": 3,
    "lastPracticed": "2025-09-21T01:30:45.123Z",
    "difficultyRating": null,
    "isActive": true,
    "createdAt": "2025-09-20T10:15:30.456Z",
    "updatedAt": "2025-09-21T01:30:45.123Z",
    "completionPercentage": 25,
    "totalSteps": 4
  },
  "message": "Step marked as complete"
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `completedSteps` | Array | Array of completed step objects with metadata |
| `completedSteps[].step` | Object | Populated step information |
| `completedSteps[].completedAt` | Date | Timestamp when step was completed |
| `completedSteps[].notes` | String | User notes for this step |
| `completedSteps[].difficultyRating` | Number | User's difficulty rating (1-5) |
| `completedSteps[].timeSpent` | Number | Time spent in seconds |
| `practiceCount` | Number | Total number of practice sessions |
| `lastPracticed` | Date | Timestamp of last practice session |
| `completionPercentage` | Number | Percentage of steps completed (0-100) |
| `totalSteps` | Number | Total number of steps in the stitch |

### Error Responses

#### 401 Unauthorized
```json
{
  "success": false,
  "message": "Access denied. No token provided."
}
```

#### 404 Stitch Not Found
```json
{
  "success": false,
  "message": "Stitch not found"
}
```

#### 404 Step Not Found
```json
{
  "success": false,
  "message": "Step not found"
}
```

#### 500 Server Error
```json
{
  "success": false,
  "message": "Error marking step complete",
  "error": "Detailed error message"
}
```

### Behavior Notes

1. **First Completion:** If this is the user's first interaction with the stitch, a new progress record is created
2. **Re-completion:** If the step was already completed, it updates the completion timestamp and metadata
3. **Practice Count:** Automatically increments the practice count each time a step is marked complete
4. **Progress Tracking:** Updates `lastPracticed` timestamp and calculates completion percentage
5. **Step Validation:** Verifies both stitch and step exist and are active before processing

### Example Usage

#### Basic Step Completion
```bash
curl -X POST \
  http://localhost:3000/api/stitches/68c7d5291a9d8a0a7a69a788/steps/68cf4bfeec85981f32f24f8e/complete \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  -H 'Content-Type: application/json'
```

#### Step Completion with Metadata
```bash
curl -X POST \
  http://localhost:3000/api/stitches/68c7d5291a9d8a0a7a69a788/steps/68cf4bfeec85981f32f24f8e/complete \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  -H 'Content-Type: application/json' \
  -d '{
    "notes": "Found this step tricky at first, but got the hang of it",
    "difficultyRating": 3,
    "timeSpent": 900
  }'
```

#### JavaScript/Fetch Example
```javascript
const response = await fetch('/api/stitches/68c7d5291a9d8a0a7a69a788/steps/68cf4bfeec85981f32f24f8e/complete', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    notes: 'Completed successfully!',
    difficultyRating: 2,
    timeSpent: 600
  })
});

const data = await response.json();
console.log('Progress:', data.data.completionPercentage + '%');
```

### Related Endpoints

- **Unmark Step:** `DELETE /api/stitches/:id/steps/:stepId/complete`
- **Get Progress:** `GET /api/stitches/:id/progress`
- **Update General Progress:** `POST /api/stitches/:id/progress`
- **Toggle Favorite:** `POST /api/stitches/:id/favorite`

### Integration Notes

This endpoint integrates with the user progress tracking system and automatically:
- Creates progress records for new users
- Updates completion timestamps
- Calculates progress percentages
- Tracks practice sessions
- Maintains step completion history with rich metadata
