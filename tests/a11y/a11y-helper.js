/**
 * Accessibility Testing Helper for Playwright
not li * Uses axe-core to verify WCAG AA compliance
 */

/**
 * Check page accessibility with axe-core
 * @param {Page} page - Playwright page
 * @param {Object} options - Axe configuration
 */
export async function checkAccessibility(page, options = {}) {
  await page.addScriptTag({
    url: "https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.7.2/axe.min.js",
  });

  const results = await page.evaluate(({ config }) => {
    return new Promise((resolve) => {
      window.axe.run(config, (error, results) => {
        if (error) throw error;
        resolve({
          violations: results.violations,
          passes: results.passes,
          incomplete: results.incomplete,
        });
      });
    });
  }, { config: options });

  return results;
}

/**
 * Assert no accessibility violations
 * @param {Page} page - Playwright page
 * @param {Object} options - Axe configuration
 */
export async function expectNoAccessibilityViolations(page, options = {}) {
  const results = await checkAccessibility(page, options);
  
  if (results.violations.length > 0) {
    const details = results.violations
      .map(v => {
        const nodeDetails = v.nodes
          .map(n => `${n.html.substring(0, 80)}...`)
          .join('\n    - ');
        return `${v.id}: ${v.description} (${v.nodes.length} elements)\n    - ${nodeDetails}`;
      })
      .join('\n  - ');
    throw new Error(`Accessibility violations found:\n  - ${details}`);
  }
}
