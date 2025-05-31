/// <reference types="vite/client" />

// Declare CSS modules for TypeScript
declare module '*.css' {
  const content: string;
  export default content;
} 