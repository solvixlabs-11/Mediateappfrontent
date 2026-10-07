module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.ts"],
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: {
          rootDir: ".",
          jsx: "react",
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          types: ["jest", "node"],
        },
      },
    ],
  },
  moduleNameMapper: {
    "^react-native$": "<rootDir>/src/features/reports/__tests__/__mocks__/reactNative.ts",
    "^expo-file-system/legacy$": "<rootDir>/src/features/reports/__tests__/__mocks__/fileSystem.ts",
    "^expo-file-system$": "<rootDir>/src/features/reports/__tests__/__mocks__/fileSystem.ts",
    "^expo-sharing$": "<rootDir>/src/features/reports/__tests__/__mocks__/sharing.ts",
    "^expo-sqlite$": "<rootDir>/src/features/reports/__tests__/__mocks__/sqlite.ts",
    "^expo-secure-store$": "<rootDir>/src/features/reports/__tests__/__mocks__/secureStore.ts",
    "^@react-native-community/netinfo$": "<rootDir>/src/features/reports/__tests__/__mocks__/netinfo.ts",
  },
};
