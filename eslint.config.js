import { defineConfig } from "eslint/config";
import agenticflowConfig from "@agenticflow/eslint-config";

export default defineConfig([
  // Apply the shared configuration
  ...agenticflowConfig,
  
  // Project-specific overrides
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    rules: {
      // Monorepo specific rules
      "no-console": "warn", // Allow console in development
      "@typescript-eslint/no-explicit-any": "warn", // Allow any during migration
    },
  },
  
  // Ignore build outputs and dependencies
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/.turbo/**",
      "**/coverage/**",
      "**/.next/**",
      "**/public/**",
    ],
  },
]); 