const managedCiMarkers = [
  'APPVEYOR',
  'BITBUCKET_BUILD_NUMBER',
  'BUILDKITE',
  'BUILD_BUILDID',
  'CIRCLECI',
  'GITHUB_ACTIONS',
  'GITLAB_CI',
  'JENKINS_URL',
  'TEAMCITY_VERSION',
  'TF_BUILD',
  'TRAVIS',
]

const isManagedCi = managedCiMarkers.some((key) => Boolean(process.env[key]))
const inheritedCi = `${process.env.CI || ''}`.toLowerCase()

if (!isManagedCi && inheritedCi && inheritedCi !== 'false') {
  delete process.env.CI
  console.log('Ignoring inherited CI environment for local build.')
}

require('react-scripts/scripts/build')