import packageJson from '../package.json';

export const VERSION = 'v' + packageJson.version;
export const VERSION_MAJOR_MINOR = VERSION.replace(/^(v\d+\.\d+)\.\d+$/, '$1').replace(/\./g, '_');
