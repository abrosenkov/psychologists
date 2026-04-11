import eslintConfigNext from "eslint-config-next";

const config = [
  ...eslintConfigNext,
  {
    ignores: ["node_modules/**"],
  },
];

export default config;
