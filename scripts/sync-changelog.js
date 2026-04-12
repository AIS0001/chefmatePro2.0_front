const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..')
const sourcePath = path.join(projectRoot, 'CHANGELOG.md')
const targetPath = path.join(projectRoot, 'public', 'CHANGELOG.md')

if (!fs.existsSync(sourcePath)) {
  throw new Error('CHANGELOG.md not found. Create it manually before running build/start.')
}

const sourceContent = fs.readFileSync(sourcePath, 'utf8')

fs.mkdirSync(path.dirname(targetPath), { recursive: true })
fs.writeFileSync(targetPath, sourceContent, 'utf8')
console.log('Synced CHANGELOG.md to public/CHANGELOG.md')
