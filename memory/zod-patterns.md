# Zod Patterns and Common Mistakes

## Date: 2025-10-25

### Issue: `.default()` positioning with `.transform()` and `.pipe()`

**Problem:**
Cannot call `.default()` after `.pipe()` because the schema type has already been transformed.

**Wrong Pattern:**
```typescript
z.string().transform(Number).pipe(z.number()).default('60')
//                                           ^^^^^^^^^ ERROR: default must be before transform
```

**Correct Pattern:**
```typescript
z.string().default('60').transform(Number).pipe(z.number())
//         ^^^^^^^^^^^^^^ Correct: default comes first
```

**Explanation:**
- `.default()` must be called on the original input type (string)
- `.transform()` changes the type from string → number
- `.pipe()` validates the transformed type
- Once transformed, you can't apply string defaults to a number schema

**Affected Files:**
- `libs/shared/config/src/lib/env.config.ts` (lines 12, 43, 44, and similar patterns)

**Rule to Remember:**
When using Zod transformations:
1. Apply `.default()` FIRST on the input type
2. Then apply `.transform()` to change the type
3. Finally use `.pipe()` to validate the output type

---

## Other Zod Patterns

### String to Number Transformation
```typescript
// Environment variables are always strings, need transformation to numbers
PORT: z.string().default('3000').transform(Number).pipe(z.number().min(1).max(65535))
```

### String to Boolean Transformation
```typescript
USE_SSL: z.string().default('false').transform((val) => val === 'true').pipe(z.boolean())
```

### String Array from Comma-Separated
```typescript
CORS_ORIGINS: z.string().default('http://localhost:3000').transform((val) => val.split(',')).pipe(z.array(z.string()))
```

### z.record() - Always specify both key and value types
```typescript
// ❌ Wrong
z.record(z.unknown())

// ✅ Correct
z.record(z.string(), z.unknown())
```

### Deprecated: z.string().url()
The `.url()` method is deprecated in Zod v4. Use custom regex or other validation if needed.
Consider using `z.string().regex(/^https?:\/\//)` or just `z.string()` with description.

### ZodError has `.issues` not `.errors`
```typescript
// ❌ Wrong
catch (error) {
  if (error instanceof z.ZodError) {
    error.errors.map(...) // Property 'errors' does not exist
  }
}

// ✅ Correct
catch (error) {
  if (error instanceof z.ZodError) {
    error.issues.map(...) // Correct property name
  }
}
```
