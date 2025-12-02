const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const { glob } = require("glob");

module.exports = async function() {
  const hwidxDataDir = path.join(__dirname, "hwidx");
  const allYamlFiles = await glob("**/*.yml", { cwd: hwidxDataDir });
  
  const dict = {};
  
  // Process each YAML file
  allYamlFiles.forEach((filepath) => {
    const fullPath = path.join(hwidxDataDir, filepath);
    const data = yaml.load(fs.readFileSync(fullPath, "utf8"));
    
    // Parse the path to get the hwidx key
    // e.g., "1/1/3.5.yml" -> "1/1/3.5"
    const hwidxKey = filepath.replace(/\.ya?ml$/, "");
    
    // Build cascading data by merging all index.yml files in parent directories
    const pathParts = filepath.split(path.sep);
    let mergedData = {};
    
    // Walk through the path and merge any index.yml files
    for (let i = 0; i < pathParts.length; i++) {
      const partialPath = pathParts.slice(0, i + 1);
      const indexPath = path.join(hwidxDataDir, ...partialPath.slice(0, -1), "index.yml");
      
      // If this is the final file itself, merge it last
      if (i === pathParts.length - 1) {
        mergedData = { ...mergedData, ...data };
      } 
      // Otherwise, check for index.yml in parent directories
      else if (fs.existsSync(indexPath)) {
        const indexData = yaml.load(fs.readFileSync(indexPath, "utf8"));
        mergedData = { ...mergedData, ...indexData };
      }
    }
    
    // Skip index.yml files themselves from being pages
    if (filepath.endsWith("index.yml")) {
      return;
    }
    
    // Add metadata
    const hwidx = hwidxKey.replace(/\\/g, "/");
    mergedData._hwidx = `https://hwidx.org/${hwidx}`;
    mergedData._hwidx_meta = `https://m.hwidx.org/${hwidx}`;
    mergedData._hwidx_key = hwidx;
    
    dict[hwidx] = mergedData;
  });
  
  return dict;
};
