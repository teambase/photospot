const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// firebase(v10+)는 package.json "exports" 맵을 사용해 서브패키지를 노출하는데,
// Metro가 기본으로 이를 못 읽어 모듈을 못 찾는 문제가 있어 명시적으로 켠다.
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
