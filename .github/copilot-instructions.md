# UI/UX Pro Max

This repository must follow the UI/UX Pro Max workflow for any UI/UX-related request, design change, build task, review, or improvement.

## Required workflow

1. Analyze the request
   - Product type: SaaS, e-commerce, portfolio, dashboard, landing page, etc.
   - Style keywords: minimal, playful, professional, elegant, dark mode, luxurious, etc.
   - Industry: healthcare, fintech, gaming, education, beauty, service, etc.
   - Stack: default to html-tailwind unless the user specifies another stack.

2. Generate a design system first
   - Define pattern, style, palette, typography, elevation, spacing, motion, and interaction behavior.
   - Favor cohesive design decisions over isolated tweaks.
   - Include anti-patterns to avoid.

3. Use the right design domains when needed
   - product, style, typography, color, landing, chart, ux, web, react, nextjs, prompt, etc.
   - Search multiple times when necessary to refine the direction.

4. Implement with stack-aware best practices
   - Default to html-tailwind for web UI if no stack is specified.
   - For Next.js work, prefer modern, responsive, accessible patterns and reusable components.
   - Keep the design system consistent across the app.

5. Translate the design system into code
   - Put colors and typography into reusable CSS variables or theme tokens when relevant.
   - Prefer reusable component patterns instead of repeating utility classes.
   - Add dark-mode overrides when relevant.

## Quality bar

- Be specific and intentional with design choices.
- Prefer accessibility, clarity, and strong hierarchy.
- Keep spacing, contrast, typography, and UI rhythm consistent.
- Avoid noisy layouts, weak visual hierarchy, or inconsistent styling.
- Favor responsive, modern UX patterns and concise interaction design.

## Default interpretation

When a request involves UI, UX, design, styling, layout, landing pages, components, or visual polish, treat this as a mandatory UI/UX Pro Max workflow task.
