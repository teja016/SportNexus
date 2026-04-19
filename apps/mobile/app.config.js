const { withGradleProperties } = require('@expo/config-plugins')

/** @param {import('@expo/config').ConfigContext} ctx */
module.exports = ({ config }) => {
  // Reduce JVM heap on EAS free-tier (4 GB total RAM) and build arm64 only
  config = withGradleProperties(config, (gradleConfig) => {
    gradleConfig.modResults = gradleConfig.modResults.map((item) => {
      if (item.type === 'property' && item.key === 'org.gradle.jvmargs') {
        return { ...item, value: '-Xmx1536m -XX:MaxMetaspaceSize=512m' }
      }
      if (item.type === 'property' && item.key === 'reactNativeArchitectures') {
        return { ...item, value: 'arm64-v8a' }
      }
      return item
    })
    return gradleConfig
  })

  return config
}
