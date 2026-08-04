// Force pnpm to install optional dependencies on all platforms.
// This ensures @rollup/rollup-linux-x64-gnu is available on Cloudflare Pages (Linux).
function readPackage(pkg, context) {
  return pkg;
}

module.exports = {
  hooks: {
    readPackage,
  },
};
