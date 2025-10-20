const Nunjucks = require("nunjucks");
const markdownIt = require("markdown-it");
const fs = require("fs");
const path = require("path");
const postcss = require("postcss");
const tailwindcss = require("@tailwindcss/postcss");
const yaml = require("js-yaml");
const { glob } = require("glob");

module.exports = (eleventyConfig) => {

  // Preprocess Tailwind CSS before each build
  eleventyConfig.on("eleventy.before", async () => {
    const tailwindInputPath = path.resolve("src/assets/css/main.css");
    const tailwindOutputPath = "_site/assets/css/main.css";
    const cssContent = fs.readFileSync(tailwindInputPath, "utf8");
    const outputDir = path.dirname(tailwindOutputPath);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const result = await postcss([tailwindcss]).process(cssContent, {
      from: tailwindInputPath,
      to: tailwindOutputPath,
    });

    fs.writeFileSync(tailwindOutputPath, result.css);
  });
  eleventyConfig.addWatchTarget("src/assets/css/**/*.css");

  // Configure Nunjucks 
  eleventyConfig.setLibrary(
    "njk",
    new Nunjucks.Environment(new Nunjucks.FileSystemLoader("src/_includes"))
  );

  eleventyConfig.addGlobalData("hwidx", async (collectionsApi) => {
    const list = await glob("src/_data/hwidx/**/*.yml");

    const dict = {};
    list.forEach( (filepath, index) => {
      const data = yaml.load(fs.readFileSync(filepath, "utf8"));

      const relPath = path.relative( path.join(eleventyConfig.dir.input, "_data"), filepath );
      const hwidx = relPath.replace(/^hwidx\//, "").replace(/\.ya?ml$/, "").replace(/\//, ".");
      const hwidx_url = `https://hwidx.org/${hwidx}`;
      const hwidx_meta = `https://m.hwidx.org/${hwidx}`;

      data._hwidx_meta = hwidx_meta;
      data._hwidx = hwidx_url;
      data._hwidx_key = hwidx;

      dict[hwidx] = data;
    });
    return dict;
  });

  // Convert object to YAML string
  eleventyConfig.addFilter("toYAML", (value) => {

    // Remove keys prefixed with '_hwidx'
    const filtered = Object.keys(value).reduce((acc, key) => {
      if (!key.startsWith('_hwidx')) {
      acc[key] = value[key];
      }
      return acc;
    }, {});
    return yaml.dump(filtered);
  });

  // Configure Markdown-it with deflist plugin
  module.exports = function (eleventyConfig) {
    let options = {
      html: true,
      breaks: true,
      linkify: true,
    };

    const mdEngine = markdownIt(options);
    mdEngine.use(require("markdown-it-deflist"));

    eleventyConfig.setLibrary("md", mdEngine);
  };

  // Copy static assets to the output folder
  eleventyConfig.addPassthroughCopy({ "src/assets/img": "assets/img" });

  // Eleventy configuration object
  return {
    // Pre-process *.md, *.html and global data files files with: (default: `liquid`)
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    dataTemplateEngine: "njk",

    // Optional (default is set): If your site deploys to a subdirectory, change `pathPrefix`, for example with with GitHub pages
    pathPrefix: "/",

    dir: {
      output: "_site",
      input: "src",
      layouts: "_layouts",
    },
  };
};
