const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..')
const sourcePath = path.join(projectRoot, 'CHANGELOG.md')
const targetPath = path.join(projectRoot, 'public', 'CHANGELOG.md')
const packageJsonPath = path.join(projectRoot, 'package.json')

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
const appVersion = packageJson.version || '0.0.0'
const today = new Date().toISOString().split('T')[0]

const defaultContent = `# Changelog\n\nAll notable changes to this project will be documented in this file.\n\nFormat: [version] - YYYY-MM-DD\n\n---\n\n## [${appVersion}] - ${today}\n\n### Added\n- Initial changelog entry\n`

let sourceContent = fs.existsSync(sourcePath)
  ? fs.readFileSync(sourcePath, 'utf8')
  : defaultContent

if (!fs.existsSync(sourcePath)) {
  fs.writeFileSync(sourcePath, sourceContent, 'utf8')
  console.log('Created CHANGELOG.md from package version')
}

const hasCurrentVersion = new RegExp(`^##\\s*\\[${appVersion.replace(/\./g, '\\.')}\\]\\s*-\\s*`, 'm').test(sourceContent)

if (!hasCurrentVersion) {
  const newEntry = `\n## [${appVersion}] - ${today}\n\n### Added\n- Update changelog for release ${appVersion}\n\n---\n`
  const normalized = sourceContent.replace(/\r/g, '')
  const separator = '---\n\n'

  if (normalized.includes(separator)) {
    sourceContent = normalized.replace(separator, `${separator}${newEntry}`)
  } else {
    sourceContent = `${normalized.trim()}\n\n---${newEntry}`
  }

  fs.writeFileSync(sourcePath, sourceContent, 'utf8')
  console.log(`Added missing version entry [${appVersion}] to CHANGELOG.md`)
}

fs.mkdirSync(path.dirname(targetPath), { recursive: true })
fs.writeFileSync(targetPath, sourceContent, 'utf8')
console.log('Synced CHANGELOG.md to public/CHANGELOG.md')
