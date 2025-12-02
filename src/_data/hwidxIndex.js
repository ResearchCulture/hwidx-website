const path = require("path");

module.exports = async function () {
  // Load resolved hwidx entries
  const hwidx = await require("./hwidx.js")();
  const keys = Object.keys(hwidx);

  // Build index: dirPath -> Set(children)
  const dirMap = new Map();

  for (const key of keys) {
    const segs = key.split("/");
    for (let i = 0; i < segs.length; i++) {
      const parent = segs.slice(0, i).join("/");
      const child = segs[i];

      // Skip root-level index (empty parent) to avoid clobbering homepage
      if (parent === "") continue;
      if (!dirMap.has(parent)) dirMap.set(parent, new Set());
      dirMap.get(parent).add(child);
    }
  }

  // Helper function to find highest version device name under a path
  const findHighestVersionDeviceName = (basePath) => {

    // Find all leaf entries that start with this path
    const matchingLeaves = keys
      .filter(k => k.startsWith(basePath + "/"))
      .map(k => {
        const version = k.substring(basePath.length + 1);
        return { key: k, version, name: hwidx[k]?.name };
      })
      .filter(item => item.name); // Only include entries with names
    
    if (matchingLeaves.length === 0) return undefined;
    
    // Sort by version (numeric comparison) and take the last one (highest)
    matchingLeaves.sort((a, b) => {
      const aParts = a.version.split('/').map(p => parseFloat(p) || 0);
      const bParts = b.version.split('/').map(p => parseFloat(p) || 0);
      for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
        const diff = (bParts[i] || 0) - (aParts[i] || 0);
        if (diff !== 0) return diff;
      }
      return 0;
    });
    
    return matchingLeaves[0].name;
  };

  // Create list form with URL and children details
  const list = Array.from(dirMap.entries()).map(([dir, childrenSet]) => {
    const children = Array.from(childrenSet).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    const items = children.map((slug) => {
      const childPath = [dir, slug].filter(Boolean).join("/");
      const url = `/${childPath}/`;
      const leaf = Object.prototype.hasOwnProperty.call(hwidx, childPath);
      const title = leaf && hwidx[childPath]?.name ? hwidx[childPath].name : undefined;

      // For non-leaf nodes, find the highest version device name
      const deviceName = !leaf ? findHighestVersionDeviceName(childPath) : title;
      return { slug, path: childPath, url, isLeaf: leaf, title, deviceName };
    });
    const parentSegs = dir.split("/");
    const parentPath = parentSegs.length > 1 ? parentSegs.slice(0, -1).join("/") : null;
    const parentUrl = parentPath ? `/${parentPath}/` : null;

    // Compute merged index data for this directory from index.yml files along the path
    let mergedIndex = {};
    const hwidxDataDir = path.join(__dirname, "hwidx");
    const segs = dir.split("/").filter(Boolean);
    for (let i = 0; i < segs.length; i++) {
      const indexPath = path.join(hwidxDataDir, ...segs.slice(0, i + 1), "index.yml");
      if (require("fs").existsSync(indexPath)) {
        try {
          const idxYaml = require("js-yaml").load(require("fs").readFileSync(indexPath, "utf8"));
          mergedIndex = { ...mergedIndex, ...idxYaml };
        } catch (_) {
          // ignore YAML parse errors for index files
        }
      }
    }
    
    // Determine directory depth/level: 1 = org, 2 = device
    const depth = segs.length;
    return { path: dir, url: `/${dir}/`, parentPath, parentUrl, children: items, data: mergedIndex, depth };
  });

  // Split lists by depth for different templates
  const orgList = list.filter(d => d.depth === 1);
  const deviceList = list.filter(d => d.depth === 2);
  const otherList = list.filter(d => d.depth > 2);
  
  return { 
    map: Object.fromEntries(Array.from(dirMap.entries()).map(([k, v]) => [k, Array.from(v)])), 
    list,
    orgList,
    deviceList,
    otherList
  };
};
