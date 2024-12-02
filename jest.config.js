module.exports = {
  testEnvironment: "jsdom",
  moduleFileExtensions: ["js", "ts"],
  testMatch: ["**/__tests__/**/*.[jt]s", "**/?(*.)+(spec|test).[jt]s"],
  preset: "ts-jest",
  transform: {
    "^.+\\.(ts)?$": "ts-jest",
    "^.+\\.(js)$": "babel-jest",
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
};
