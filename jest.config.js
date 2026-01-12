const nextJest = require("next/jest");

const createJestConfig = nextJest({
  // Next.jsアプリのパスを指定
  dir: "./",
});

// Jestのカスタム設定
const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testEnvironment: "jest-environment-jsdom",
  moduleNameMapper: {
    // @/でsrcディレクトリを参照できるようにする
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testMatch: [
    "**/__tests__/**/*.[jt]s?(x)",
    "**/?(*.)+(spec|test).[jt]s?(x)",
  ],
  collectCoverageFrom: [
    "src/**/*.{js,jsx,ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/*.stories.{js,jsx,ts,tsx}",
    "!src/**/__tests__/**",
  ],
};

// createJestConfigは非同期関数なので、Next.jsの設定とマージするために使用
module.exports = createJestConfig(customJestConfig);
