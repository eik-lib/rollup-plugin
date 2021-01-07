import path from 'path';
import url from 'url';

export const dirname = (meta) => path.dirname(filename(meta));
export const filename = (meta) => url.fileURLToPath(meta.url);