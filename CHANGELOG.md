# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- CONTRIBUTING.md with development guidelines and PR conventions
- CI/CD pipeline with GitHub Actions (lint, typecheck, unit tests, E2E tests)
- Nightly scheduled runs for CI (3:00 AM UTC) and E2E (4:00 AM UTC)
- Manual workflow dispatch for all GitHub Actions
- CI and E2E status badges in README
- 37 unit and integration tests covering core components
- Playwright E2E tests for navigation flows
- Content Security Policy (CSP) meta tag
- Honeypot spam protection on contact form
- Zod-based contact form validation with sanitization
- Lazy loading and code splitting for all route pages
- Per-page SEO with dynamic meta tags and structured data (JSON-LD)
- Dynamic sitemap with all routes and multilingual alternates
- Accessibility improvements (skip-to-content, ARIA labels, focus management)
- Privacy-friendly analytics integration (Umami)
- Multilingual support (English, Finnish, Swedish)
- PageMeta component for managing document head per route

### Security

- Input sanitization to prevent XSS in form fields
- CSP headers restricting script and style sources
- Honeypot field to deter bot submissions
