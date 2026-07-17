export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "scope-enum": [
      2,
      "always",
      ["app", "architecture", "build", "ci", "docs", "schemas", "security", "tests"],
    ],
  },
};
