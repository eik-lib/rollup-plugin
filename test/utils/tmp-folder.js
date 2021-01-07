import os from 'os';
import fs from 'fs';
import path from 'path';

export default (namespace) => fs.promises.mkdtemp(path.join(os.tmpdir(), namespace));