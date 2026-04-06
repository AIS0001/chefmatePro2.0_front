import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function ChangelogPage() {
  const navigate = useNavigate()
  const [content, setContent] = useState('Loading changelog...')
  const [hasError, setHasError] = useState(false)
  const [expandedSections, setExpandedSections] = useState({})

  const palette = {
    pageBackground: '#f7f5f2',
    cardBackground: '#fffdf9',
    cardBorder: '#e7e1d8',
    mutedBorder: '#efe9df',
    softAccent: '#dbe7df',
    softAccentStrong: '#b8cec0',
    buttonBackground: '#d9e6de',
    buttonText: '#355148',
    heading: '#2f3a35',
    bodyText: '#56615d',
    subtleText: '#7b847f',
    errorBackground: '#fbf1ef',
    errorBorder: '#efd3cd',
    errorText: '#9a4f43'
  }

  const getDashboardPath = () => {
    const userType = (localStorage.getItem('usertype') || sessionStorage.getItem('usertype') || '').toLowerCase()

    if (userType === 'cashier') return '/dashboard/cashier'
    if (userType === 'account') return '/dashboard/account'
    if (userType === 'manager' || userType === 'admin') return '/dashboard/admin'
    if (userType === 'super_admin') return '/superadmin/dashboard'

    return '/login'
  }

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
    <div
      className="container-fluid"
      style={{
        minHeight: '100vh',
        paddingTop: '24px',
        paddingBottom: '24px',
        background: palette.pageBackground
      }}
    >
      <div style={{ maxWidth: '1100px', margin: '0 auto 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          <h3 style={{ margin: 0, color: palette.heading, fontWeight: 600, letterSpacing: '0.2px' }}>Version Updates</h3>
          <p style={{ margin: '6px 0 0', color: palette.subtleText, fontSize: '14px' }}>Review system changes in a cleaner, focused view.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate(getDashboardPath())}
          style={{
            border: `1px solid ${palette.softAccentStrong}`,
            borderRadius: '999px',
            background: palette.buttonBackground,
            color: palette.buttonText,
            padding: '10px 18px',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(120, 131, 125, 0.08)'
          }}
        >
          Go To Dashboard
        </button>
      </div>
      <div className="panel panel-default card-view" style={{ marginTop: '8px', maxWidth: '1100px', marginLeft: 'auto', marginRight: 'auto', borderRadius: '20px', overflow: 'hidden', border: `1px solid ${palette.cardBorder}`, boxShadow: '0 14px 40px rgba(87, 93, 90, 0.08)', background: palette.cardBackground }}>
        <div className="panel-heading" style={{ background: 'transparent', borderBottom: `1px solid ${palette.mutedBorder}`, padding: '18px 20px 12px' }}>
          <h6 className="panel-title txt-dark" style={{ color: palette.heading, fontSize: '15px', fontWeight: 600, margin: 0 }}>Version Updates</h6>
        </div>
        <div className="panel-wrapper collapse in">
          <div className="panel-body" style={{ padding: '16px 20px 20px' }}>
            {hasError ? (
              <pre
                style={{
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  margin: 0,
                  background: palette.errorBackground,
                  border: `1px solid ${palette.errorBorder}`,
                  borderRadius: '14px',
                  padding: '16px',
                  fontSize: '13px',
                  lineHeight: 1.5,
                  color: palette.errorText
                }}
              >
                {content}
              </pre>
            ) : (
              <div
                style={{
                  background: '#fcfaf7',
                  border: `1px solid ${palette.mutedBorder}`,
                  borderRadius: '16px',
                  padding: '16px'
                }}
              >
                {intro ? (
                  <pre
                    style={{
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      margin: '0 0 16px',
                      fontSize: '13px',
                      lineHeight: 1.7,
                      color: palette.bodyText,
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
                      lineHeight: 1.7,
                      color: palette.bodyText,
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
                        marginBottom: '12px',
                        border: `1px solid ${palette.mutedBorder}`,
                        borderRadius: '16px',
                        background: palette.cardBackground,
                        overflow: 'hidden'
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => toggleSection(index)}
                        style={{
                          cursor: 'pointer',
                          width: '100%',
                          textAlign: 'left',
                          padding: '14px 16px',
                          fontWeight: 600,
                          fontSize: '14px',
                          color: palette.heading,
                          border: 'none',
                          borderRadius: '0',
                          borderBottom: expandedSections[`section_${index}`] ? `1px solid ${palette.mutedBorder}` : 'none',
                          background: expandedSections[`section_${index}`] ? palette.softAccent : '#f9f6f1'
                        }}
                      >
                        <span style={{ marginRight: '10px', fontWeight: 700, color: palette.buttonText }}>
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
                            padding: '14px 16px 16px',
                            fontSize: '13px',
                            lineHeight: 1.7,
                            color: palette.bodyText,
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
