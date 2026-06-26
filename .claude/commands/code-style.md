# /code-style

Coding conventions for this project.

## JSDoc

Write one or two sentences describing what a function or class does. Never use numbered lists inside JSDoc — do not narrate the execution flow.

```ts
// ✅
/** Encrypts plaintext `.env.*` files in-place, backing up each to `.env.[env].unencrypted` first. */

// ❌
/**
 * 1. Reads the file.
 * 2. Backs up content.
 * 3. Encrypts in-place.
 */
```

## Inline comments

No inline comments. If the why is non-obvious, use a single-line JSDoc or a short block comment above the statement.

## Language

All code, comments, and JSDoc must be in English.
