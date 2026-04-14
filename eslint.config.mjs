import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

/**
 * Next.js 16 ships flat ESLint config — avoid FlatCompat + extends(), which can
 * trigger "Converting circular structure to JSON" under ESLint 9.
 * @see https://nextjs.org/docs/app/api-reference/config/eslint
 */
const eslintConfig = [...nextCoreWebVitals];
export default eslintConfig;
