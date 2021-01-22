const { description } = require("../../package");

module.exports = {
  /**
   * Ref：https://v1.vuepress.vuejs.org/config/#title
   */
  title: "Deno Keyv",
  /**
   * Ref：https://v1.vuepress.vuejs.org/config/#description
   */
  description: description,

  /**
   * Extra tags to be injected to the page HTML `<head>`
   *
   * ref：https://v1.vuepress.vuejs.org/config/#head
   */
  head: [
    ["meta", { name: "theme-color", content: "#3eaf7c" }],
    ["meta", { name: "apple-mobile-web-app-capable", content: "yes" }],
    [
      "meta",
      { name: "apple-mobile-web-app-status-bar-style", content: "black" },
    ],
  ],

  /**
   * Theme configuration, here is the default theme configuration for VuePress.
   *
   * ref：https://v1.vuepress.vuejs.org/theme/default-theme-config.html
   */
  themeConfig: {
    repo: "https://github.com/tejasag/deno-keyv/tree/docs",
    editLinks: true,
    docsDir: "src",
    editLinkText: "Edit this page",
    lastUpdated: true,
    nav: [
      {
        text: "Docs",
        link: "/docs/",
      },
      {
        text: "Github",
        link: "https://github.com/tejasag/deno-keyv",
      },
    ],
    sidebar: {
      "/docs/": [
        {
          title: "Home",
          collapsable: false,
          children: [""],
        },
        {
          title: "Documentation",
          collapsable: false,
          children: ["providers/SqliteProvider"],
        },
      ],
    },
  },

  theme: "yuu",

  /**
   * Apply plugins，ref：https://v1.vuepress.vuejs.org/zh/plugin/
   */
  plugins: [
    "@vuepress/plugin-back-to-top",
    "@vuepress/plugin-medium-zoom",
    "@vuepress/plugin-search",
    "@vuepress/search",
  ],
};
