import React, { useEffect, useMemo, useState } from 'react'

export default function ChangelogPage() {
  const [content, setContent] = useState('Loading changelog...')
  const [hasError, setHasError] = useState(false)
  const [expandedSections, setExpandedSections] = useState({})

  const parseChangelog = (markdownText) => {
    const source = String(markdownText || '')
      .replace(/^\uFEFF/, '')
      .replace(/\r/g, '')

    const lines = source.split('\n')
    const sections = []
    let currentSection = null
    const introLines = []

    lines.forEach((line) => {
      const match = line.match(/^##\s*\[([^\]]+)\]\s*-\s*(.+?)\s*$/)
      if (match) {
        if (currentSection) {
          sections.push(currentSection)
        }

        currentSection = {
          version: match[1],
          date: match[2],
          body: []
        }
        return
      }

      if (currentSection) {
        currentSection.body.push(line)
      } else {
        introLines.push(line)
      }
    })

    if (currentSection) {
      sections.push(currentSection)
    }

    return {
      intro: introLines.join('\n').trim(),
      sections
    }
  }

  const { intro, sections } = useMemo(() => parseChangelog(content), [content])

  useEffect(() => {
    if (sections.length > 0) {
      setExpandedSections((prev) => {
        if (Object.keys(prev).length > 0) return prev
        return { section_0: true }
      })
    }
  }, [sections])

  const toggleSection = (index) => {
    const key = `section_${index}`
    setExpandedSections((prev) => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  useEffect(() => {
    const loadChangelog = async () => {
      try {
        const response = await fetch('/CHANGELOG.md', { cache: 'no-store' })
        if (!response.ok) {
          throw new Error('Unable to load changelog')
        }

        const markdown = await response.text()
        setContent(markdown || 'No changelog entries found.')
      } catch (error) {
        setHasError(true)
        setContent('Failed to load changelog. Please try again.')
      }
    }

    loadChangelog()
  }, [])

  return (
    <div className="container-fluid" style={{ paddingTop: '8px', paddingBottom: '12px' }}>
      <div className="panel panel-default card-view" style={{ marginTop: '8px' }}>
        <div className="panel-heading">
          <h6 className="panel-title txt-dark">Version Updates</h6>
        </div>
        <div className="panel-wrapper collapse in">
          <div className="panel-body" style={{ paddingTop: '8px' }}>
            {hasError ? (
              <pre
                style={{
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  margin: 0,
                  background: '#f7f7f7',
                  border: '1px solid #e5e5e5',
                  borderRadius: '8px',
                  padding: '12px',
                  fontSize: '13px',
                  lineHeight: 1.5,
                  color: '#a8071a'
                }}
              >
                {content}
              </pre>
            ) : (
              <div
                style={{
                  background: '#f7f7f7',
                  border: '1px solid #e5e5e5',
                  borderRadius: '8px',
                  padding: '12px'
                }}
              >
                {intro ? (
                  <pre
                    style={{
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      margin: '0 0 12px',
                      fontSize: '13px',
                      lineHeight: 1.5,
                      color: '#333',
                      background: 'transparent',
                      border: 'none',
                      padding: 0
                    }}
                  >
                    {intro}
                  </pre>
                ) : null}

                {sections.length === 0 ? (
                  <pre
                    style={{
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      margin: 0,
                      fontSize: '13px',
                      lineHeight: 1.5,
                      color: '#333',
                      background: 'transparent',
                      border: 'none',
                      padding: 0
                    }}
                  >
                    {content}
                  </pre>
                ) : (
                  sections.map((section, index) => (
                    <div
                      key={`${section.version}-${section.date}-${index}`}
                      style={{
                        marginBottom: '10px',
                        border: '1px solid #d9d9d9',
                        borderRadius: '8px',
                        background: '#fff'
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => toggleSection(index)}
                        style={{
                          cursor: 'pointer',
                          width: '100%',
                          textAlign: 'left',
                          padding: '10px 12px',
                          fontWeight: 600,
                          fontSize: '14px',
                          color: '#1f1f1f',
                          border: 'none',
                          borderRadius: '8px 8px 0 0',
                          borderBottom: expandedSections[`section_${index}`] ? '1px solid #f0f0f0' : 'none',
                          background: '#fafafa'
                        }}
                      >
                        <span style={{ marginRight: '8px', fontWeight: 700 }}>
                          {expandedSections[`section_${index}`] ? '-' : '+'}
                        </span>
                        {`Version ${section.version} - ${section.date}`}
                      </button>

                      {expandedSections[`section_${index}`] ? (
                        <pre
                          style={{
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            margin: 0,
                            padding: '10px 12px',
                            fontSize: '13px',
                            lineHeight: 1.5,
                            color: '#333',
                            background: 'transparent',
                            border: 'none'
                          }}
                        >
                          {section.body.join('\n').trim() || 'No details available.'}
                        </pre>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
