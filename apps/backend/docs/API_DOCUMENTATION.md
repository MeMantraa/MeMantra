# MeMantra API Documentation

Base URL: `http://localhost:4000/api`

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

---

## Authentication Endpoints

### POST /auth/register

Register a new user account.

**Request Body:**

```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securepassword123",
  "device_token": "optional_fcm_token"
}
```

**Response (201):**

```json
{
  "status": "success",
  "message": "User registered successfully",
  "data": {
    "user": {
      "user_id": 1,
      "username": "john_doe",
      "email": "john@example.com"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### POST /auth/login

Login with email and password.

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response (200):**

```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "user": {
      "user_id": 1,
      "username": "john_doe",
      "email": "john@example.com"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### POST /auth/google

Authenticate with Google OAuth.

**Request Body:**

```json
{
  "idToken": "google_id_token_here"
}
```

**Response (200):**

```json
{
  "status": "success",
  "message": "Google authentication successful",
  "data": {
    "user": {
      "user_id": 1,
      "username": "john_doe",
      "email": "john@example.com"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### GET /auth/me

Get current authenticated user profile.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**

```json
{
  "status": "success",
  "data": {
    "user": {
      "user_id": 1,
      "username": "john_doe",
      "email": "john@example.com"
    }
  }
}
```

---

## Mantra Endpoints

### GET /mantras

Get all mantras with optional filtering and pagination.

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `category_id` (optional): Filter by category ID
- `search` (optional): Search in title and key takeaway

**Response (200):**

```json
{
  "status": "success",
  "data": {
    "mantras": [
      {
        "mantra_id": 1,
        "title": "Breathing Meditation",
        "key_takeaway": "Focus on your breath to calm your mind",
        "background_author": "Dr. Sarah Johnson",
        "background_description": "Studies show...",
        "jamie_take": "This technique helped me during...",
        "when_where": "Best used in the morning or before bed",
        "negative_thoughts": "I can't focus, my mind is too busy",
        "cbt_principles": "Mindfulness, Present Moment Awareness",
        "references": "Journal of Mindfulness, 2023",
        "created_by": 1,
        "is_active": true,
        "created_at": "2025-01-15T10:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 15
    }
  }
}
```

### GET /mantras/search

Search mantras by title or key takeaway.

**Query Parameters:**

- `q` (required): Search query
- `limit` (optional): Max results (default: 20)

**Response (200):**

```json
{
  "status": "success",
  "data": {
    "mantras": [...],
    "count": 5
  }
}
```

### GET /mantras/popular

Get most liked mantras.

**Query Parameters:**

- `limit` (optional): Max results (default: 20)

**Response (200):**

```json
{
  "status": "success",
  "data": {
    "mantras": [
      {
        "mantra_id": 1,
        "title": "Breathing Meditation",
        "like_count": 42,
        ...
      }
    ]
  }
}
```

### GET /mantras/:id

Get a single mantra by ID.

**Response (200):**

```json
{
  "status": "success",
  "data": {
    "mantra": {
      "mantra_id": 1,
      "title": "Breathing Meditation",
      ...
    }
  }
}
```

### POST /mantras

Create a new mantra (admin only).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**

```json
{
  "title": "New Mantra",
  "key_takeaway": "Main lesson",
  "background_author": "Dr. Jane Smith",
  "background_description": "Research shows...",
  "jamie_take": "Personal perspective",
  "when_where": "Best used when...",
  "negative_thoughts": "Common negative thoughts",
  "cbt_principles": "CBT principles addressed",
  "references": "Sources",
  "is_active": true,
  "category_ids": [1, 2]
}
```

**Response (201):**

```json
{
  "status": "success",
  "message": "Mantra created successfully",
  "data": {
    "mantra": {...}
  }
}
```

### PATCH /mantras/:id

Update a mantra (admin only).

**Headers:** `Authorization: Bearer <token>`

**Request Body:** (all fields optional)

```json
{
  "title": "Updated Title",
  "is_active": false
}
```

**Response (200):**

```json
{
  "status": "success",
  "message": "Mantra updated successfully",
  "data": {
    "mantra": {...}
  }
}
```

### DELETE /mantras/:id

Soft delete a mantra (admin only).

**Headers:** `Authorization: Bearer <token>`

**Response (200):**

```json
{
  "status": "success",
  "message": "Mantra deleted successfully"
}
```

---

## Collection Endpoints

### GET /collections

Get all collections for the authenticated user.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**

```json
{
  "status": "success",
  "data": {
    "collections": [
      {
        "collection_id": 1,
        "user_id": 1,
        "name": "Morning Routine",
        "description": "Mantras for starting the day",
        "created_at": "2025-01-15T08:00:00.000Z"
      }
    ]
  }
}
```

### GET /collections/:id

Get a single collection with its mantras.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**

```json
{
  "status": "success",
  "data": {
    "collection": {
      "collection_id": 1,
      "user_id": 1,
      "name": "Morning Routine",
      "description": "Mantras for starting the day",
      "created_at": "2025-01-15T08:00:00.000Z",
      "mantras": [...]
    }
  }
}
```

### GET /collections/:id/mantras

Get all mantras in a collection.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**

```json
{
  "status": "success",
  "data": {
    "mantras": [...]
  }
}
```

### POST /collections

Create a new collection.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**

```json
{
  "name": "Evening Calm",
  "description": "Mantras for winding down"
}
```

**Response (201):**

```json
{
  "status": "success",
  "message": "Collection created successfully",
  "data": {
    "collection": {...}
  }
}
```

### PATCH /collections/:id

Update a collection.

**Headers:** `Authorization: Bearer <token>`

**Request Body:** (all fields optional)

```json
{
  "name": "Updated Name",
  "description": "Updated description"
}
```

**Response (200):**

```json
{
  "status": "success",
  "message": "Collection updated successfully",
  "data": {
    "collection": {...}
  }
}
```

### DELETE /collections/:id

Delete a collection.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**

```json
{
  "status": "success",
  "message": "Collection deleted successfully"
}
```

### POST /collections/:id/mantras

Add a mantra to a collection.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**

```json
{
  "mantra_id": 5
}
```

**Response (200):**

```json
{
  "status": "success",
  "message": "Mantra added to collection successfully"
}
```

### DELETE /collections/:id/mantras/:mantraId

Remove a mantra from a collection.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**

```json
{
  "status": "success",
  "message": "Mantra removed from collection successfully"
}
```

---

## Like Endpoints

### GET /likes

Get all liked mantras for the authenticated user.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**

```json
{
  "status": "success",
  "data": {
    "mantras": [
      {
        "mantra_id": 1,
        "title": "Breathing Meditation",
        "liked_at": "2025-01-15T10:30:00.000Z",
        ...
      }
    ]
  }
}
```

### POST /likes

Like a mantra.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**

```json
{
  "mantra_id": 5
}
```

**Response (201):**

```json
{
  "status": "success",
  "message": "Mantra liked successfully",
  "data": {
    "like": {
      "like_id": 1,
      "user_id": 1,
      "mantra_id": 5,
      "created_at": "2025-01-15T12:00:00.000Z"
    }
  }
}
```

### DELETE /likes

Unlike a mantra.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**

```json
{
  "mantra_id": 5
}
```

**Response (200):**

```json
{
  "status": "success",
  "message": "Mantra unliked successfully"
}
```

### POST /likes/toggle

Toggle like on a mantra (like if not liked, unlike if liked).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**

```json
{
  "mantra_id": 5
}
```

**Response (200):**

```json
{
  "status": "success",
  "message": "Mantra liked successfully",
  "data": {
    "liked": true
  }
}
```

### GET /likes/status/:mantraId

Check if user has liked a specific mantra.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**

```json
{
  "status": "success",
  "data": {
    "liked": true
  }
}
```

### GET /likes/count/:mantraId

Get like count for a mantra (public endpoint).

**Headers:** `Authorization: Bearer <token>`

**Response (200):**

```json
{
  "status": "success",
  "data": {
    "mantra_id": 5,
    "like_count": 42
  }
}
```

---

## Reminder Endpoints

### GET /reminders

Get all reminders for the authenticated user.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**

- `with_mantras` (optional): Include mantra details (true/false)

**Response (200):**

```json
{
  "status": "success",
  "data": {
    "reminders": [
      {
        "reminder_id": 1,
        "user_id": 1,
        "mantra_id": 5,
        "time": "2025-01-16T07:00:00.000Z",
        "frequency": "daily",
        "status": "active"
      }
    ]
  }
}
```

### GET /reminders/active

Get only active reminders for the authenticated user.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**

```json
{
  "status": "success",
  "data": {
    "reminders": [...]
  }
}
```

### GET /reminders/:id

Get a single reminder by ID.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**

- `with_mantra` (optional): Include mantra details (true/false)

**Response (200):**

```json
{
  "status": "success",
  "data": {
    "reminder": {
      "reminder_id": 1,
      "user_id": 1,
      "time": "2025-01-16T07:00:00.000Z",
      "frequency": "daily",
      "status": "active",
      "mantra_id": 5,
      "title": "Breathing Meditation",
      "key_takeaway": "..."
    }
  }
}
```

### POST /reminders

Create a new reminder.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**

```json
{
  "mantra_id": 5,
  "time": "2025-01-16T07:00:00.000Z",
  "frequency": "daily",
  "status": "active"
}
```

**Frequency options:** `once`, `daily`, `weekly`, `monthly`
**Status options:** `active`, `inactive`, `completed`

**Response (201):**

```json
{
  "status": "success",
  "message": "Reminder created successfully",
  "data": {
    "reminder": {...}
  }
}
```

### PATCH /reminders/:id

Update a reminder.

**Headers:** `Authorization: Bearer <token>`

**Request Body:** (all fields optional)

```json
{
  "time": "2025-01-16T08:00:00.000Z",
  "frequency": "weekly",
  "status": "inactive"
}
```

**Response (200):**

```json
{
  "status": "success",
  "message": "Reminder updated successfully",
  "data": {
    "reminder": {...}
  }
}
```

### DELETE /reminders/:id

Delete a reminder.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**

```json
{
  "status": "success",
  "message": "Reminder deleted successfully"
}
```

---

## Category Endpoints

### GET /categories

Get all categories.

**Query Parameters:**

- `with_count` (optional): Include mantra count (true/false)

**Response (200):**

```json
{
  "status": "success",
  "data": {
    "categories": [
      {
        "category_id": 1,
        "name": "Mindfulness",
        "description": "Practices for staying present",
        "mantra_count": 15
      }
    ]
  }
}
```

### GET /categories/:id

Get a single category by ID.

**Response (200):**

```json
{
  "status": "success",
  "data": {
    "category": {
      "category_id": 1,
      "name": "Mindfulness",
      "description": "Practices for staying present"
    }
  }
}
```

### GET /categories/:id/mantras

Get all mantras in a category.

**Response (200):**

```json
{
  "status": "success",
  "data": {
    "mantras": [...]
  }
}
```

### POST /categories

Create a new category (admin only).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**

```json
{
  "name": "Stress Relief",
  "description": "Techniques for managing stress"
}
```

**Response (201):**

```json
{
  "status": "success",
  "message": "Category created successfully",
  "data": {
    "category": {...}
  }
}
```

### PATCH /categories/:id

Update a category (admin only).

**Headers:** `Authorization: Bearer <token>`

**Request Body:** (all fields optional)

```json
{
  "name": "Updated Name",
  "description": "Updated description"
}
```

**Response (200):**

```json
{
  "status": "success",
  "message": "Category updated successfully",
  "data": {
    "category": {...}
  }
}
```

### DELETE /categories/:id

Delete a category (admin only).

**Headers:** `Authorization: Bearer <token>`

**Response (200):**

```json
{
  "status": "success",
  "message": "Category deleted successfully"
}
```

---

## Error Responses

All endpoints return errors in this format:

**Response (4xx/5xx):**

```json
{
  "status": "error",
  "message": "Error description",
  "errors": [] // Optional validation errors array
}
```

### Common Error Codes:

- `400` - Bad Request (validation errors, invalid input)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## Testing with cURL

### Register a new user

```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Login

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Get mantras (with auth)

```bash
curl -X GET http://localhost:4000/api/mantras \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Like a mantra

```bash
curl -X POST http://localhost:4000/api/likes \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"mantra_id": 1}'
```

---

## Notes

- All timestamps are in ISO 8601 format (UTC)
- All IDs are positive integers
- Pagination starts at page 1
- Default limit for paginated endpoints is 20
- Admin endpoints require additional admin middleware (TODO)
- Soft deletes are used for mantras (sets `is_active = false`)
