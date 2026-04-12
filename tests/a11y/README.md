# Accessibility Tests (a11y)

Playwright-based accessibility tests with axe-core WCAG AA compliance verification.

## Tests

- **category.a11y.test.js** - Category management page accessibility
- **search.a11y.test.js** - Search form and results accessibility  
- **products-cart.a11y.test.js** - Product browsing and shopping cart accessibility

## Run Tests

```bash
npm run test:a11y
```

## How It Works

1. Tests navigate to real pages
2. Mock network requests when possible (inherited from playwright.config.js)
3. Use axe-core to verify WCAG AA compliance
4. Fail if any accessibility violations found

## Helper

`a11y-helper.js` provides:
- `checkAccessibility(page)` - Run axe-core scan
- `expectNoAccessibilityViolations(page)` - Assert no violations found
