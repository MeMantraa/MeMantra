# MeMantra API Endpoints Documentation

This document provides a comprehensive overview of all RESTful API endpoints available in the MeMantra backend.

**Base URL:** `http://localhost:3000/api` (development)

---

## 📋 Table of Contents

1. [Authentication](#authentication)
2. [Mantras](#mantras)
3. [Categories](#categories)
4. [Collections](#collections)
5. [Likes](#likes)
6. [Reminders](#reminders)
7. [Recommendations](#recommendations)

---

## 🔐 Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### POST `/api/auth/register`

Register a new user account.

**Request Body:**

```json
{
  "username": "string (min 3 chars)",
  "email": "string (valid email)",
  "password": "string (min 8 chars)",
  "device_token": "string (optional)"
}
```

**Response:** `201 Created`

```json
{
  "status": "success",
  "message": "User registered successfully",
  "data": {
    "user": {
      "user_id": 1,
      "username": "johndoe",
      "email": "john@example.com"
    },
    "token": "jwt_token_string"
  }
}
```

### POST `/api/auth/login`

Authenticate user with email and password.

**Request Body:**

```json
{
  "email": "string",
  "password": "string"
}
```

**Response:** `200 OK`

```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "user": {
      "user_id": 1,
      "username": "johndoe",
      "email": "john@example.com"
    },
    "token": "jwt_token_string"
  }
}
```

### GET `/api/auth/me` 🔒

Get current authenticated user profile.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`

```json
{
  "status": "success",
  "data": {
    "user": {
      "user_id": 1,
      "username": "johndoe",
      "email": "john@example.com"
    }
  }
}
```

### POST `/api/auth/google`

Authenticate user with Google OAuth.

**Request Body:**

```json
{
  "idToken": "google_id_token_string"
}
```

**Response:** `200 OK`

```json
{
  "status": "success",
  "message": "Google authentication successful",
  "data": {
    "user": {
      "user_id": 1,
      "username": "johndoe",
      "email": "john@example.com"
    },
    "token": "jwt_token_string"
  }
}
```

---

## 🧘 Mantras

### GET `/api/mantras`

List all mantras with optional search and pagination.

**Query Parameters:**

- `search` (optional): Search term for title/key_takeaway
- `limit` (optional): Number of results (default: 20, max: 100)
- `offset` (optional): Pagination offset (default: 0)

**Example:** `/api/mantras?search=confidence&limit=10&offset=0`

**Response:** `200 OK`

```json
{
  "status": "success",
  "data": {
    "mantras": [
      {
        "mantra_id": 1,
        "title": "Building Confidence",
        "key_takeaway": "Believe in yourself",
        "background_author": "John Smith",
        "background_description": "...",
        "jamie_take": "...",
        "when_where": "Morning routine",
        "negative_thoughts": "Self-doubt",
        "cbt_principles": "Cognitive restructuring",
        "references": "...",
        "created_by": 1,
        "is_active": true,
        "created_at": "2025-01-15T10:00:00Z"
      }
    ],
    "pagination": {
      "limit": 20,
      "offset": 0,
      "count": 15
    }
  }
}
```

### GET `/api/mantras/:id`

Get a single mantra by ID.

**Parameters:**

- `id` (number): Mantra ID

**Response:** `200 OK`

```json
{
  "status": "success",
  "data": {
    "mantra": {
      "mantra_id": 1,
      "title": "Building Confidence",
      "key_takeaway": "Believe in yourself",
      ...
    }
  }
}
```

### GET `/api/mantras/popular`

Get most liked mantras.

**Query Parameters:**

- `limit` (optional): Number of results (default: 10)

**Response:** `200 OK`

```json
{
  "status": "success",
  "data": {
    "mantras": [
      {
        "mantra_id": 1,
        "title": "Building Confidence",
        "like_count": 125,
        ...
      }
    ]
  }
}
```

### GET `/api/mantras/category/:categoryId`

Get mantras by category.

**Parameters:**

- `categoryId` (number): Category ID

**Response:** `200 OK`

```json
{
  "status": "success",
  "data": {
    "mantras": [...],
    "count": 12
  }
}
```

### POST `/api/mantras` 🔒

Create a new mantra (requires authentication).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**

```json
{
  "title": "string (required, max 255 chars)",
  "key_takeaway": "string (required)",
  "background_author": "string (optional)",
  "background_description": "string (optional)",
  "jamie_take": "string (optional)",
  "when_where": "string (optional)",
  "negative_thoughts": "string (optional)",
  "cbt_principles": "string (optional)",
  "references": "string (optional)",
  "is_active": "boolean (optional, default: true)"
}
```

**Response:** `201 Created`

```json
{
  "status": "success",
  "message": "Mantra created successfully",
  "data": {
    "mantra": {...}
  }
}
```

### PUT `/api/mantras/:id` 🔒

Update a mantra (requires authentication).

**Parameters:**

- `id` (number): Mantra ID

**Request Body:** (All fields optional)

```json
{
  "title": "string",
  "key_takeaway": "string",
  ...
}
```

**Response:** `200 OK`

```json
{
  "status": "success",
  "message": "Mantra updated successfully",
  "data": {
    "mantra": {...}
  }
}
```

### DELETE `/api/mantras/:id` 🔒

Soft delete a mantra (requires authentication).

**Parameters:**

- `id` (number): Mantra ID

**Response:** `200 OK`

```json
{
  "status": "success",
  "message": "Mantra deleted successfully"
}
```

---

## 📂 Categories

### GET `/api/categories`

List all categories.

**Response:** `200 OK`

```json
{
  "status": "success",
  "data": {
    "categories": [
      {
        "category_id": 1,
        "name": "Anxiety",
        "description": "Mantras for anxiety relief",
        "category_type": "emotion",
        "image_url": "https://...",
        "is_active": true
      }
    ]
  }
}
```

### GET `/api/categories/:id`

Get a single category by ID.

**Parameters:**

- `id` (number): Category ID

**Response:** `200 OK`

```json
{
  "status": "success",
  "data": {
    "category": {...}
  }
}
```

### GET `/api/categories/type/:type`

Get categories by type.

**Parameters:**

- `type` (string): One of: `emotion`, `cbt`, `context`, `reference`

**Response:** `200 OK`

```json
{
  "status": "success",
  "data": {
    "categories": [...]
  }
}
```

### GET `/api/categories/:id/mantras`

Get all mantras in a category.

**Parameters:**

- `id` (number): Category ID

**Response:** `200 OK`

```json
{
  "status": "success",
  "data": {
    "mantras": [...]
  }
}
```

### POST `/api/categories` 🔒

Create a new category (requires authentication).

**Request Body:**

```json
{
  "name": "string (required, max 100 chars)",
  "description": "string (optional)",
  "category_type": "emotion | cbt | context | reference (required)",
  "image_url": "string (optional, must be valid URL)"
}
```

**Response:** `201 Created`

### PUT `/api/categories/:id` 🔒

Update a category (requires authentication).

**Response:** `200 OK`

### DELETE `/api/categories/:id` 🔒

Soft delete a category (requires authentication).

**Response:** `200 OK`

### POST `/api/categories/:id/mantras/:mantraId` 🔒

Add a mantra to a category (requires authentication).

**Parameters:**

- `id` (number): Category ID
- `mantraId` (number): Mantra ID

**Response:** `200 OK`

```json
{
  "status": "success",
  "message": "Mantra added to category successfully"
}
```

### DELETE `/api/categories/:id/mantras/:mantraId` 🔒

Remove a mantra from a category (requires authentication).

**Response:** `200 OK`

---

## 📚 Collections

All collection endpoints require authentication.

### GET `/api/collections` 🔒

Get current user's collections.

**Response:** `200 OK`

```json
{
  "status": "success",
  "data": {
    "collections": [
      {
        "collection_id": 1,
        "user_id": 1,
        "name": "Morning Mantras",
        "description": "Start the day right",
        "created_at": "2025-01-15T10:00:00Z"
      }
    ]
  }
}
```

### GET `/api/collections/:id` 🔒

Get a collection with all its mantras.

**Parameters:**

- `id` (number): Collection ID

**Response:** `200 OK`

```json
{
  "status": "success",
  "data": {
    "collection": {
      "collection_id": 1,
      "user_id": 1,
      "name": "Morning Mantras",
      "description": "Start the day right",
      "created_at": "2025-01-15T10:00:00Z"
    },
    "mantras": [...]
  }
}
```

### POST `/api/collections` 🔒

Create a new collection.

**Request Body:**

```json
{
  "name": "string (required, max 100 chars)",
  "description": "string (optional)"
}
```

**Response:** `201 Created`

```json
{
  "status": "success",
  "message": "Collection created successfully",
  "data": {
    "collection": {...}
  }
}
```

### PUT `/api/collections/:id` 🔒

Update a collection.

**Request Body:**

```json
{
  "name": "string (optional)",
  "description": "string (optional)"
}
```

**Response:** `200 OK`

### DELETE `/api/collections/:id` 🔒

Delete a collection.

**Response:** `200 OK`

### POST `/api/collections/:id/mantras/:mantraId` 🔒

Add a mantra to a collection.

**Parameters:**

- `id` (number): Collection ID
- `mantraId` (number): Mantra ID

**Response:** `200 OK`

```json
{
  "status": "success",
  "message": "Mantra added to collection successfully"
}
```

### DELETE `/api/collections/:id/mantras/:mantraId` 🔒

Remove a mantra from a collection.

**Response:** `200 OK`

---

## ❤️ Likes

### GET `/api/likes/popular`

Get most liked mantras (public).

**Query Parameters:**

- `limit` (optional): Number of results (default: 10, max: 50)

**Response:** `200 OK`

```json
{
  "status": "success",
  "data": {
    "mantras": [
      {
        "mantra_id": 1,
        "title": "Building Confidence",
        "like_count": 125,
        ...
      }
    ]
  }
}
```

### POST `/api/likes/:mantraId` 🔒

Like a mantra (requires authentication).

**Parameters:**

- `mantraId` (number): Mantra ID

**Response:** `201 Created`

```json
{
  "status": "success",
  "message": "Mantra liked successfully"
}
```

### DELETE `/api/likes/:mantraId` 🔒

Unlike a mantra (requires authentication).

**Response:** `200 OK`

```json
{
  "status": "success",
  "message": "Mantra unliked successfully"
}
```

### GET `/api/likes/mantras` 🔒

Get current user's liked mantras (requires authentication).

**Response:** `200 OK`

```json
{
  "status": "success",
  "data": {
    "mantras": [...]
  }
}
```

### GET `/api/likes/:mantraId/check` 🔒

Check if user has liked a mantra (requires authentication).

**Parameters:**

- `mantraId` (number): Mantra ID

**Response:** `200 OK`

```json
{
  "status": "success",
  "data": {
    "hasLiked": true
  }
}
```

---

## ⏰ Reminders

All reminder endpoints require authentication.

### GET `/api/reminders` 🔒

Get all user's reminders.

**Response:** `200 OK`

```json
{
  "status": "success",
  "data": {
    "reminders": [
      {
        "reminder_id": 1,
        "user_id": 1,
        "mantra_id": 5,
        "time": "2025-01-16T08:00:00Z",
        "frequency": "daily",
        "status": "active"
      }
    ]
  }
}
```

### GET `/api/reminders/active` 🔒

Get only active reminders.

**Response:** `200 OK`

### GET `/api/reminders/upcoming` 🔒

Get upcoming reminders within a time window.

**Query Parameters:**

- `hours` (optional): Hours ahead to look (default: 24, max: 168)

**Example:** `/api/reminders/upcoming?hours=48`

**Response:** `200 OK`

```json
{
  "status": "success",
  "data": {
    "reminders": [...],
    "hoursAhead": 48
  }
}
```

### GET `/api/reminders/frequency` 🔒

Get reminders by frequency.

**Query Parameters:**

- `frequency` (required): One of: `once`, `daily`, `weekly`, `monthly`, `custom`

**Response:** `200 OK`

### GET `/api/reminders/:id` 🔒

Get a single reminder by ID.

**Parameters:**

- `id` (number): Reminder ID

**Response:** `200 OK`

### POST `/api/reminders` 🔒

Create a new reminder.

**Request Body:**

```json
{
  "mantra_id": "number (required)",
  "time": "string (required, ISO 8601 datetime)",
  "frequency": "once | daily | weekly | monthly | custom (required)",
  "status": "active | paused | completed (optional, default: active)"
}
```

**Response:** `201 Created`

```json
{
  "status": "success",
  "message": "Reminder created successfully",
  "data": {
    "reminder": {...}
  }
}
```

### PUT `/api/reminders/:id` 🔒

Update a reminder.

**Request Body:** (All fields optional)

```json
{
  "mantra_id": "number",
  "time": "string (ISO 8601)",
  "frequency": "once | daily | weekly | monthly | custom",
  "status": "active | paused | completed"
}
```

**Response:** `200 OK`

### DELETE `/api/reminders/:id` 🔒

Delete a reminder.

**Response:** `200 OK`

---

## 🎯 Recommendations

All recommendation endpoints require authentication. These endpoints track and log mantra recommendations made to users.

### GET `/api/recommendations` 🔒

Get user's recommendation history with pagination.

**Query Parameters:**

- `limit` (optional): Number of results (default: 50, max: 100)
- `offset` (optional): Pagination offset (default: 0)

**Response:** `200 OK`

```json
{
  "status": "success",
  "data": {
    "recommendations": [
      {
        "rec_id": 1,
        "user_id": 1,
        "mantra_id": 5,
        "timestamp": "2025-01-15T10:00:00Z",
        "reason": "User expressed anxiety, this mantra helps with stress relief"
      }
    ],
    "pagination": {
      "limit": 50,
      "offset": 0,
      "count": 25
    }
  }
}
```

### GET `/api/recommendations/detailed` 🔒

Get recommendations with full mantra details (includes mantra titles).

**Query Parameters:**

- `limit` (optional): Number of results (default: 20)

**Response:** `200 OK`

```json
{
  "status": "success",
  "data": {
    "recommendations": [
      {
        "rec_id": 1,
        "user_id": 1,
        "mantra_id": 5,
        "timestamp": "2025-01-15T10:00:00Z",
        "reason": "User expressed anxiety...",
        "mantra_title": "Calming Breath"
      }
    ]
  }
}
```

### GET `/api/recommendations/recent` 🔒

Get recent recommendations within a specified time window.

**Query Parameters:**

- `days` (optional): Days to look back (default: 7, max: 365)

**Example:** `/api/recommendations/recent?days=30`

**Response:** `200 OK`

```json
{
  "status": "success",
  "data": {
    "recommendations": [...],
    "daysBack": 30
  }
}
```

### GET `/api/recommendations/stats` 🔒

Get recommendation statistics for the current user.

**Response:** `200 OK`

```json
{
  "status": "success",
  "data": {
    "totalRecommendations": 145,
    "recentRecommendations": 12,
    "recentDays": 7
  }
}
```

### GET `/api/recommendations/:id` 🔒

Get a single recommendation by ID.

**Parameters:**

- `id` (number): Recommendation ID

**Response:** `200 OK`

```json
{
  "status": "success",
  "data": {
    "recommendation": {
      "rec_id": 1,
      "user_id": 1,
      "mantra_id": 5,
      "timestamp": "2025-01-15T10:00:00Z",
      "reason": "User expressed anxiety..."
    }
  }
}
```

### POST `/api/recommendations` 🔒

Log a new recommendation.

**Request Body:**

```json
{
  "mantra_id": "number (required)",
  "reason": "string (required)"
}
```

**Response:** `201 Created`

```json
{
  "status": "success",
  "message": "Recommendation logged successfully",
  "data": {
    "recommendation": {
      "rec_id": 1,
      "user_id": 1,
      "mantra_id": 5,
      "timestamp": "2025-01-15T10:00:00Z",
      "reason": "User expressed anxiety..."
    }
  }
}
```

### DELETE `/api/recommendations/:id` 🔒

Delete a recommendation log entry.

**Parameters:**

- `id` (number): Recommendation ID

**Response:** `200 OK`

```json
{
  "status": "success",
  "message": "Recommendation deleted successfully"
}
```

---

## 🚨 Error Responses

All endpoints return errors in the following format:

**Error Response:** `4xx` or `5xx`

```json
{
  "status": "error",
  "message": "Error description"
}
```

### Common Error Codes:

- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (access denied)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error

---

## 📝 Notes

- 🔒 = Protected endpoint (requires authentication)
- All timestamps are in ISO 8601 format
- IDs are integers (not UUIDs)
- Soft deletes set `is_active` to `false` instead of removing records
- JWT tokens expire based on `JWT_EXPIRES_IN` environment variable

---

## 🔧 Development URLs

- **Backend API:** `http://localhost:3000`
- **Health Check:** `http://localhost:3000/health`
- **API Base:** `http://localhost:3000/api`

---

**Generated:** January 2025
**Version:** 1.0.0
