const Nunjucks = require("nunjucks");
const markdownIt = require("markdown-it");
const fs = require("fs");
const path = require("path");
const postcss = require("postcss");
const tailwindcss = require("@tailwindcss/postcss");
const yaml = require("js-yaml");
const { glob } = require("glob");
const esbuild = require("esbuild");

const OUTPUT_PATH = "_site";

const FORCE_QR_REBUILD = process.env.FORCE_QR_REBUILD === "true";
const QR_BATCH_SIZE = process.env.QR_BATCH_SIZE ? parseInt(process.env.QR_BATCH_SIZE, 10) : 8;

async function processBatch(batch, generateFn) {
  return Promise.all(batch.map(generateFn));
}

async function processBatched(items, generateFn, batchSize = QR_BATCH_SIZE) {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    await processBatch(batch, generateFn);
  }
}

async function bundleJavaScript() {
  const entryPoints = await glob("src/assets/js/**/*.js", { nodir: true });

  if (entryPoints.length === 0) {
    return;
  }

  await esbuild.build({
    entryPoints,
    outdir: path.join(OUTPUT_PATH, "assets/js"),
    bundle: true,
    format: "esm",
    platform: "browser",
    target: ["es2020"],
    sourcemap: true,
    logLevel: "info",
    entryNames: "[dir]/[name]",
    outbase: "src/assets/js",
  });
}

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

    await bundleJavaScript();
  });
  eleventyConfig.addWatchTarget("src/assets/css/**/*.css");
  eleventyConfig.addWatchTarget("src/assets/js/**/*.js");

  // Configure Nunjucks
  eleventyConfig.setLibrary(
    "njk",
    new Nunjucks.Environment(new Nunjucks.FileSystemLoader("src/_includes"))
  );

  // hwidx data is now loaded automatically from src/_data/hwidx.js
  // which handles cascading YAML merges

  // Convert object to YAML string
  eleventyConfig.addFilter("toYAML", (value) => {
    // Remove keys prefixed with '_hwidx'
    const filtered = Object.keys(value).reduce((acc, key) => {
      if (!key.startsWith("_hwidx")) {
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
  eleventyConfig.addPassthroughCopy({ "src/assets/fonts": "assets/fonts" });


  // Generate our QR codes for each hwidx entity
  eleventyConfig.on("eleventy.after", async () => {
    const { qrCode, logoMark, logoMarkHorizontal, labelMark } = require("./mark-generator.js");
    const hwidx = await require("./src/_data/hwidx.js")();
    const outputDir = path.join(OUTPUT_PATH);

    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      console.log(`Creating output directory at ${outputDir}`);
      fs.mkdirSync(outputDir, { recursive: true });
    }

    eleventyConfig.logger.log(`Generating QR codes and marks for ${Object.keys(hwidx).length} entities...`);
    eleventyConfig.logger.log(`Batch size: ${QR_BATCH_SIZE}`);
    eleventyConfig.logger.log(`Force rebuild? ${FORCE_QR_REBUILD}`);

    /*const entities = Object.entries(hwidx);
    await processBatched(entities, async ([key, entity]) => {
      const imgRoot = path.join(outputDir, `${key}/`);

      await eleventyConfig.logger.log(`Generating images for ${key} in ${imgRoot}`);
      
      if( !fs.existsSync(path.join(imgRoot, "qr.png")) || FORCE_QR_REBUILD )
        await qrCode(path.join(imgRoot, "qr.png"), entity._hwidx, { margin: 1 });
      else
        await eleventyConfig.logger.log(`Skipping qr.png for ${key}, already exists.`);
      
      if( !fs.existsSync(path.join(imgRoot, "logo-mark.png")) || FORCE_QR_REBUILD )
        await logoMark(path.join(imgRoot, "logo-mark.png"), entity._hwidx, { margin: 1 });
      else
        await eleventyConfig.logger.log(`Skipping logo-mark.png for ${key}, already exists.`);

      if( !fs.existsSync(path.join(imgRoot, "logo-mark-horizontal.png")) || FORCE_QR_REBUILD )
        await logoMarkHorizontal(path.join(imgRoot, "logo-mark-horizontal.png"), entity._hwidx, { margin: 1 });
      else
        await eleventyConfig.logger.log(`Skipping logo-mark-horizontal.png for ${key}, already exists.`);

      if( !fs.existsSync(path.join(imgRoot, "logo-mark-horizontal-invert.png")) || FORCE_QR_REBUILD )
        await logoMarkHorizontal(path.join(imgRoot, "logo-mark-horizontal-invert.png"), entity._hwidx, { margin: 1 }, true);
      else
        await eleventyConfig.logger.log(`Skipping logo-mark-horizontal-invert.png for ${key}, already exists.`);

      if( !fs.existsSync(path.join(imgRoot, "label-mark.png")) || FORCE_QR_REBUILD )
        await labelMark(path.join(imgRoot, "label-mark.png"), entity._hwidx, { margin: 1 });
      else
        await eleventyConfig.logger.log(`Skipping label-mark.png for ${key}, already exists.`);

    }, QR_BATCH_SIZE);*/
  });


  // Eleventy configuration object
  return {
    // Pre-process *.md, *.html and global data files files with: (default: `liquid`)
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    dataTemplateEngine: "njk",

    // Optional (default is set): If your site deploys to a subdirectory, change `pathPrefix`, for example with with GitHub pages
    pathPrefix: "/",

    dir: {
      output: OUTPUT_PATH,
      input: "src",
      layouts: "_layouts",
    },
  };
};
