const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const projectRoot = __dirname
const monorepoRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)

// Only watch the shared packages that mobile imports — NOT the entire monorepo
config.watchFolders = [
  path.resolve(monorepoRoot, 'packages/types'),
  path.resolve(monorepoRoot, 'packages/utils'),
]

// Tell Metro where to find node_modules (root + local)
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
]

// Exclude admin build artifacts and API from watching
config.resolver.blockList = [
  /.*\/apps\/admin\/.*/,
  /.*\/apps\/api\/.*/,
  /.*\\apps\\admin\\.*/,
  /.*\\apps\\api\\.*/,
]

module.exports = config
