const { promises: fs } = require('fs');
const path = require('path');

const PREFIX = 'javascript: (() => {';
const SUFFIX = '})();';

const INPUT_DIR = 'bookmarklets';
const OUTPUT_DIR = 'bin';

async function buildFile(fileName) {
  const inputFilePath = path.join(INPUT_DIR, fileName);
  const content = await fs.readFile(inputFilePath, 'utf8');

  const newContent = PREFIX + content.trim() + SUFFIX;

  const outputFilePath = path.join(OUTPUT_DIR, fileName);
  await fs.writeFile(outputFilePath, newContent);
}

async function run() {
  const fileNames = await fs.readdir('bookmarklets');
  const buildJobs = fileNames.map(buildFile);
  await Promise.all(buildJobs);
}

run();
