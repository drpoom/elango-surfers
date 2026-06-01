import packageJson from '../package.json';

export const VERSION: string = 'v' + packageJson.version;
export const VERSION_MAJOR_MINOR: string = VERSION.replace(/^(v\d+\.\d+)\.\d+$/, '$1').replace(/\./g, '_');