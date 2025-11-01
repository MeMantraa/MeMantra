# Kysely ORM Guide for MeMantra

## Overview

Kysely is a type-safe TypeScript SQL query builder. This project uses Kysely with PostgreSQL for all database operations.

## Setup Complete ✓

Your Kysely setup includes:

- ✅ Kysely v0.28.7 installed
- ✅ PostgreSQL dialect configured
- ✅ Type definitions in `src/types/database.types.ts`
- ✅ Database instance exported from `src/db/index.ts`
- ✅ kysely-codegen for automatic type generation
- ✅ Configuration file `.kyselyrc.json`

## Database Connection

The database connection is configured in `src/db/index.ts` using environment variables:

```typescript
import { db } from '../db';

// db is now available for queries
```

**Environment Variables Required:**

- `DB_HOST` - Database host (default: localhost)
- `DB_PORT` - Database port (default: 5432)
- `DB_USER` - Database user (default: postgres)
- `DB_PASSWORD` - Your PostgreSQL password
- `DB_NAME` - Database name (me_mantra_db)
- `DATABASE_URL` - Full connection string (for kysely-codegen): `postgresql://user:password@host:port/database`

## Type-Safe Operations

Kysely provides three helper types for each table:

```typescript
import { User, NewUser, UserUpdate } from '../types/database.types';

// Selectable<T> - For reading from database
type User = Selectable<UserTable>;

// Insertable<T> - For inserting new rows
type NewUser = Insertable<UserTable>;

// Updateable<T> - For updating existing rows
type UserUpdate = Updateable<UserTable>;
```

## Basic CRUD Operations

### CREATE (Insert)

```typescript
// Simple insert
const newUser = await db
  .insertInto('User')
  .values({
    username: 'john_doe',
    email: 'john@example.com',
    password_hash: hashedPassword,
    created_at: new Date().toISOString(),
  })
  .returningAll() // Return the inserted row
  .executeTakeFirstOrThrow();

// Insert multiple rows
const users = await db
  .insertInto('User')
  .values([
    { username: 'user1', email: 'user1@example.com', ... },
    { username: 'user2', email: 'user2@example.com', ... },
  ])
  .returningAll()
  .execute();
```

### READ (Select)

```typescript
// Select single row
const user = await db.selectFrom('User').where('user_id', '=', 123).selectAll().executeTakeFirst(); // Returns User | undefined

// Select multiple rows
const users = await db.selectFrom('User').where('is_active', '=', true).selectAll().execute(); // Returns User[]

// Select specific columns
const userEmails = await db.selectFrom('User').select(['user_id', 'email']).execute();

// With ordering and pagination
const mantras = await db
  .selectFrom('Mantra')
  .selectAll()
  .orderBy('created_at', 'desc')
  .limit(10)
  .offset(20)
  .execute();
```

### UPDATE

```typescript
// Update single row
const updated = await db
  .updateTable('User')
  .set({
    email: 'newemail@example.com',
    last_login: new Date().toISOString(),
  })
  .where('user_id', '=', 123)
  .returningAll()
  .executeTakeFirst();

// Conditional update
const result = await db
  .updateTable('Mantra')
  .set({ is_active: false })
  .where('mantra_id', '=', 456)
  .where('created_by', '=', adminId)
  .execute();

console.log(`Updated ${result.numUpdatedRows} rows`);
```

### DELETE

```typescript
// Delete rows
const result = await db
  .deleteFrom('Like')
  .where('user_id', '=', 123)
  .where('mantra_id', '=', 456)
  .execute();

// We generally prefer soft deletes:
await db.updateTable('Mantra').set({ is_active: false }).where('mantra_id', '=', id).execute();
```

## Advanced Queries

### Joins

```typescript
// Inner join
const mantrasWithCategories = await db
  .selectFrom('Mantra')
  .innerJoin('MantraCategory', 'Mantra.mantra_id', 'MantraCategory.mantra_id')
  .innerJoin('Category', 'MantraCategory.category_id', 'Category.category_id')
  .select(['Mantra.mantra_id', 'Mantra.title', 'Category.name as category_name'])
  .execute();

// Left join
const mantrasWithLikes = await db
  .selectFrom('Mantra')
  .leftJoin('Like', 'Mantra.mantra_id', 'Like.mantra_id')
  .select(['Mantra.title', 'Like.user_id'])
  .execute();
```

### Aggregation

```typescript
// Count
const userCount = await db
  .selectFrom('User')
  .select((eb) => eb.fn.count('user_id').as('total_users'))
  .executeTakeFirst();

// Group by with aggregation
const likesByMantra = await db
  .selectFrom('Like')
  .select(['mantra_id', (eb) => eb.fn.count('like_id').as('like_count')])
  .groupBy('mantra_id')
  .having((eb) => eb.fn.count('like_id'), '>', 5)
  .execute();
```

### Complex WHERE Clauses

```typescript
// OR conditions
const results = await db
  .selectFrom('Mantra')
  .where((eb) =>
    eb.or([eb('title', 'ilike', '%meditation%'), eb('key_takeaway', 'ilike', '%mindfulness%')]),
  )
  .selectAll()
  .execute();

// AND + OR combinations
const filtered = await db
  .selectFrom('Mantra')
  .where('is_active', '=', true)
  .where((eb) => eb.or([eb('created_by', '=', adminId), eb('is_public', '=', true)]))
  .selectAll()
  .execute();

// IN clause
const users = await db
  .selectFrom('User')
  .where('user_id', 'in', [1, 2, 3, 4, 5])
  .selectAll()
  .execute();
```

### Subqueries

```typescript
// Subquery in WHERE
const popularMantras = await db
  .selectFrom('Mantra')
  .where('mantra_id', 'in', (eb) =>
    eb
      .selectFrom('Like')
      .select('mantra_id')
      .groupBy('mantra_id')
      .having((eb) => eb.fn.count('like_id'), '>', 10),
  )
  .selectAll()
  .execute();
```

## Transactions

```typescript
import { db } from '../db';

// Transaction example
async function createUserWithCollection(userData: NewUser, collectionName: string) {
  return await db.transaction().execute(async (trx) => {
    // Create user
    const user = await trx
      .insertInto('User')
      .values(userData)
      .returningAll()
      .executeTakeFirstOrThrow();

    // Create default collection for user
    const collection = await trx
      .insertInto('Collection')
      .values({
        user_id: user.user_id,
        name: collectionName,
        created_at: new Date().toISOString(),
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return { user, collection };
  });
}
```

## Auto-generating Types from Database

When you modify the database schema, regenerate types:

```bash
# 1. Update database schema
psql -U postgres -d me_mantra_db -f apps/backend/database/init.sql

# 2. Regenerate TypeScript types
pnpm --filter backend db:generate-types
```

This will update `src/types/database.types.ts` based on your actual database schema.

## Model Pattern (Recommended)

Create models in `src/models/` for each table:

```typescript
// src/models/collection.model.ts
import { db } from '../db';
import { Collection, NewCollection, CollectionUpdate } from '../types/database.types';

export const CollectionModel = {
  async create(data: NewCollection): Promise<Collection> {
    return await db
      .insertInto('Collection')
      .values({
        ...data,
        created_at: new Date().toISOString(),
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  },

  async findByUserId(userId: number): Promise<Collection[]> {
    return await db
      .selectFrom('Collection')
      .where('user_id', '=', userId)
      .selectAll()
      .orderBy('created_at', 'desc')
      .execute();
  },

  async addMantraToCollection(collectionId: number, mantraId: number): Promise<void> {
    await db
      .insertInto('CollectionMantra')
      .values({ collection_id: collectionId, mantra_id: mantraId })
      .execute();
  },

  async getCollectionWithMantras(collectionId: number) {
    const collection = await db
      .selectFrom('Collection')
      .where('collection_id', '=', collectionId)
      .selectAll()
      .executeTakeFirst();

    if (!collection) return null;

    const mantras = await db
      .selectFrom('Mantra')
      .innerJoin('CollectionMantra', 'Mantra.mantra_id', 'CollectionMantra.mantra_id')
      .where('CollectionMantra.collection_id', '=', collectionId)
      .selectAll('Mantra')
      .execute();

    return { ...collection, mantras };
  },
};
```

## Best Practices

1. **Use Type Helpers**: Always use `Selectable`, `Insertable`, and `Updateable` types
2. **Avoid `selectAll()` in Production**: Select only needed columns for performance
3. **Use Transactions**: For operations that must succeed or fail together
4. **Pagination**: Always use `limit()` and `offset()` for large result sets
5. **Soft Deletes**: Prefer `is_active = false` over actual deletion
6. **Indexes**: Create database indexes for frequently queried columns
7. **Type Safety**: Let TypeScript catch errors at compile time

## Common Patterns in MeMantra

### Get User's Liked Mantras

```typescript
const likedMantras = await db
  .selectFrom('Mantra')
  .innerJoin('Like', 'Mantra.mantra_id', 'Like.mantra_id')
  .where('Like.user_id', '=', userId)
  .selectAll('Mantra')
  .execute();
```

### Get Mantra with Categories

```typescript
async function getMantraWithCategories(mantraId: number) {
  const mantra = await db
    .selectFrom('Mantra')
    .where('mantra_id', '=', mantraId)
    .selectAll()
    .executeTakeFirst();

  if (!mantra) return null;

  const categories = await db
    .selectFrom('Category')
    .innerJoin('MantraCategory', 'Category.category_id', 'MantraCategory.category_id')
    .where('MantraCategory.mantra_id', '=', mantraId)
    .selectAll('Category')
    .execute();

  return { ...mantra, categories };
}
```

### Create Reminder for User

```typescript
const reminder = await db
  .insertInto('Reminder')
  .values({
    user_id: userId,
    mantra_id: mantraId,
    time: reminderTime,
    frequency: 'daily',
    status: 'active',
  })
  .returningAll()
  .executeTakeFirstOrThrow();
```

## Troubleshooting

### Database Connection Issues

```bash
# Test connection
psql -U postgres -d me_mantra_db

# Check if tables exist
\dt

# Verify .env configuration
cat apps/backend/.env
```

### Type Errors After Schema Changes

```bash
# Regenerate types
pnpm --filter backend db:generate-types

# Rebuild TypeScript
pnpm --filter backend build
```

### Query Not Returning Expected Results

```typescript
// Add logging to see generated SQL
const result = await db.selectFrom('User').selectAll().execute();

// Use .compile() to see the SQL without executing
const query = db.selectFrom('User').selectAll().compile();

console.log(query.sql, query.parameters);
```

## Resources

- [Kysely Documentation](https://kysely.dev/)
- [Kysely Examples](https://kysely.dev/docs/examples/select)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## Example Models

See these files for working examples:

- `src/models/user.model.ts` - Basic CRUD operations
- `src/models/mantra.model.ts` - Advanced queries with joins and aggregations
