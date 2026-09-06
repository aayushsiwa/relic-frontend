# API Reference

All resource routes require authentication. Requests without a valid session return `401 Unauthorized`.

Auth is handled via `better-auth` session cookies (web) or `Authorization: Bearer <token>` header (API tokens).

---

## Relics

### `GET /api/relics` — List relics

**Query params:**

| Param          | Type    | Description                                  |
| -------------- | ------- | -------------------------------------------- |
| `q`            | string  | Search title, url, domain, description, note |
| `collectionId` | uuid    | Filter by collection                         |
| `tagId`        | uuid    | Filter by tag                                |
| `page`         | integer | Page number (default: `1`)                   |
| `limit`        | integer | Items per page, max `100` (default: `20`)    |

**Response `200`:**

```json
{
  "data": [
    {
      "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "userId": "user_abc123",
      "url": "https://example.com/article",
      "title": "Example Article",
      "description": "A sample article about things",
      "note": "My personal note about this",
      "domain": "example.com",
      "previewImage": "https://example.com/og-image.jpg",
      "favicon": "https://example.com/favicon.ico",
      "isProcessing": false,
      "contentType": "url",
      "createdAt": "2026-07-28T12:00:00.000Z",
      "updatedAt": "2026-07-28T12:00:00.000Z",
      "collections": [
        { "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479", "name": "Dev" }
      ],
      "tags": [
        { "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479", "name": "typescript" }
      ]
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20,
  "totalPages": 1
}
```

---

### `POST /api/relics` — Create a relic

**Request body:**

```json
{
  "url": "https://example.com/article",
  "title": "Example Article",
  "description": "A sample article about things",
  "note": "My personal note",
  "domain": "example.com",
  "previewImage": "https://example.com/og-image.jpg",
  "favicon": "https://example.com/favicon.ico",
  "contentType": "url",
  "collectionIds": ["f47ac10b-58cc-4372-a567-0e02b2c3d479"],
  "tagIds": ["f47ac10b-58cc-4372-a567-0e02b2c3d479"]
}
```

**Response `201`:**

```json
{
  "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "userId": "user_abc123",
  "url": "https://example.com/article",
  "title": "Example Article",
  "description": "A sample article about things",
  "note": "My personal note",
  "domain": "example.com",
  "previewImage": "https://example.com/og-image.jpg",
  "favicon": "https://example.com/favicon.ico",
  "contentType": "url",
  "createdAt": "2026-07-28T12:00:00.000Z",
  "updatedAt": "2026-07-28T12:00:00.000Z"
}
```

All fields except `contentType` are optional. `contentType` defaults to `"url"`; valid values: `url`, `note`, `file`.

**Enrichment:** When a relic is created with a `url` and `contentType` `"url"`, metadata (title, description, preview image, favicon, domain) is scraped **asynchronously** after the response returns. The created relic has `isProcessing: true` and is updated in the background; tags are derived from the page content and site name and auto-created.

**Response `409`:** A relic with the same URL (or title) already exists for this user.

---

### `GET /api/relics/[id]` — Get a relic

**Response `200`:**

```json
{
  "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "userId": "user_abc123",
  "url": "https://example.com/article",
  "title": "Example Article",
  "description": "A sample article about things",
  "note": "My personal note",
  "domain": "example.com",
  "previewImage": "https://example.com/og-image.jpg",
  "favicon": "https://example.com/favicon.ico",
  "contentType": "url",
  "createdAt": "2026-07-28T12:00:00.000Z",
  "updatedAt": "2026-07-28T12:00:00.000Z",
  "collections": [
    { "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479", "name": "Dev" }
  ],
  "tags": [
    { "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479", "name": "typescript" }
  ]
}
```

**Response `404`:**

```json
{ "error": "Not found" }
```

---

### `PUT /api/relics/[id]` — Update a relic

**Request body:**

```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "note": "Updated note",
  "collectionIds": ["f47ac10b-58cc-4372-a567-0e02b2c3d479"],
  "tagIds": []
}
```

Sending `collectionIds` or `tagIds` replaces the entire set. Omit them to leave relations unchanged.

**Response `200`:** Returns the updated relic object (same shape as GET).

**Response `404`:**

```json
{ "error": "Not found" }
```

---

### `DELETE /api/relics/[id]` — Delete a relic

**Response `204`:** No body.

**Response `404`:**

```json
{ "error": "Not found" }
```

---

## Collections

### `GET /api/collections` — List collections

**Query params:** `page`, `limit` (same pagination as relics).

**Response `200`:**

```json
{
  "data": [
    {
      "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "userId": "user_abc123",
      "name": "Dev",
      "description": "Development resources",
      "color": "#3b82f6",
      "createdAt": "2026-07-28T12:00:00.000Z",
      "relicCount": 3
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20,
  "totalPages": 1
}
```

`relicCount` is an integer count of relics linked to each collection in the
list response. Single collection routes return the base collection object
without that field.

---

### `POST /api/collections` — Create a collection

**Request body:**

```json
{
  "name": "Dev",
  "description": "Development resources",
  "color": "#3b82f6"
}
```

Only `name` is required.

**Response `201`:** Returns the created collection object (same shape as GET).

**Response `400`:**

```json
{ "error": "Name is required" }
```

---

### `GET /api/collections/[id]` — Get a collection

**Response `200`:** Returns the collection object (same shape as list).

**Response `404`:**

```json
{ "error": "Not found" }
```

---

### `PUT /api/collections/[id]` — Update a collection

**Request body:**

```json
{
  "name": "Development",
  "description": "Updated description",
  "color": "#10b981"
}
```

**Response `200`:** Returns the updated collection object.

---

### `DELETE /api/collections/[id]` — Delete a collection

**Response `204`:** No body. Relics in the collection are **not** deleted (junction rows cascade).

---

## Tags

### `GET /api/tags` — List tags

**Query params:** `page`, `limit` (same pagination, default limit `50`).

**Response `200`:**

```json
{
  "data": [
    {
      "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "name": "typescript",
      "createdAt": "2026-07-28T12:00:00.000Z",
      "relicCount": 3
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 50,
  "totalPages": 1
}
```

`relicCount` is an integer count of relics linked to each tag in the list
response. Single tag routes return the base tag object without that field.

Tags are normally created automatically when saving relics (explicit `tagIds` or derived from page metadata/site name). They can also be created manually:

### `POST /api/tags` — Create a tag

**Request body:**

```json
{ "name": "typescript" }
```

**Response `201`:** Returns the created tag.

**Response `400`:**

```json
{ "error": "Tag name is required" }
```

**Response `409`:**

```json
{ "error": "A tag with this name already exists." }
```

---

## Auth

Auth routes are handled by `better-auth` at `/api/auth/[...all]`. Common endpoints:

| Endpoint                   | Method | Description                 |
| -------------------------- | ------ | --------------------------- |
| `/api/auth/sign-in/email`  | POST   | Email/password login        |
| `/api/auth/sign-up/email`  | POST   | Email/password registration |
| `/api/auth/sign-out`       | POST   | Sign out                    |
| `/api/auth/session`        | GET    | Get current session         |
| `/api/auth/sign-in/github` | POST   | GitHub OAuth login          |

See [better-auth docs](https://www.better-auth.com) for full auth API reference.

---

## Error responses

All endpoints return errors as JSON:

```json
{ "error": "Unauthorized" }
```

| Status | Meaning |
|---|---|---|
| `400` | Bad request (e.g., missing required field) |
| `401` | Not authenticated |
| `404` | Resource not found or not owned by user |
| `409` | Conflict (e.g., duplicate URL/title/name) |
| `204` | Success (no content — DELETE) |

---

## Browser extension auth

Requests from the browser extension authenticate via the `Authorization` header using the [bearer plugin](https://www.better-auth.com/docs/plugins/bearer).

### Getting your token

1. Log in to the web app
2. Go to **Settings** (`/settings`)
3. Copy the session token shown there

### Token format

The token is the `better-auth.session_token` cookie value. Send it as:

```
Authorization: Bearer <token>
```

**Example:**

```
POST /api/relics
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{"url": "https://example.com/article"}
```

### CORS

API routes accept cross-origin requests from any origin. CORS headers are handled automatically by the middleware.

### Token security

- The token grants full access to your account
- Treat it like a password — do not share it or commit it to source control
- Revoke by signing out (which invalidates the session) or clearing sessions from the better-auth admin panel
