# AI Code Review Assistant - Landing Page

This directory contains the landing page for the AI Code Review Assistant VS Code extension.

## 🌐 Live Site

The landing page is automatically deployed to GitHub Pages at:
`https://vuquangkhtn.github.io/ai-code-review-assistant/`

## 📁 Structure

- `index.html` - Main landing page HTML
- `styles.css` - CSS styling with modern design and animations
- `script.js` - JavaScript for interactivity and animations
- `.eslintrc.js` - ESLint configuration for JavaScript

## 🚀 Features

- **Modern Design**: Clean, professional layout with trending colors
- **Responsive**: Works perfectly on desktop, tablet, and mobile devices
- **Animated**: Smooth animations and interactive elements
- **Accessible**: Built with accessibility best practices
- **Performance Optimized**: Fast loading and smooth interactions
- **SEO Friendly**: Proper meta tags and semantic HTML

## 🛠️ Local Development

### Prerequisites
- A modern web browser
- Optional: Local web server for testing

### Running Locally

1. **Simple Method**: Open `index.html` directly in your browser
   ```bash
   open docs/index.html
   ```

2. **With Local Server** (recommended for full functionality):
   ```bash
   # Using Python 3
   cd docs
   python -m http.server 8000
   
   # Using Node.js (if you have npx)
   cd docs
   npx serve .
   
   # Using PHP
   cd docs
   php -S localhost:8000
   ```
   
   Then open `http://localhost:8000` in your browser.

## 🎨 Design System

### Colors
- **Primary**: Indigo (#6366f1)
- **Secondary**: Pink (#ec4899)
- **Accent**: Cyan (#06b6d4)
- **Success**: Emerald (#10b981)
- **Text**: Dark gray (#1a1a1a)
- **Background**: White (#ffffff)

### Typography
- **Font Family**: Inter (Google Fonts)
- **Weights**: 300, 400, 500, 600, 700

### Components
- Modern buttons with hover effects
- Animated feature cards
- Interactive navigation
- Responsive grid layouts
- Smooth scroll animations

## 📱 Responsive Breakpoints

- **Desktop**: 1200px+
- **Tablet**: 768px - 1199px
- **Mobile**: < 768px
- **Small Mobile**: < 480px

## 🔧 Customization

### Adding New Sections
1. Add HTML structure to `index.html`
2. Add corresponding styles to `styles.css`
3. Add any interactive functionality to `script.js`
4. Update navigation links if needed

### Modifying Colors
Update the CSS custom properties in `styles.css`:
```css
:root {
    --primary-color: #your-color;
    --secondary-color: #your-color;
    /* ... other colors */
}
```

### Adding Animations
Use the existing animation classes or create new ones:
```css
.your-animation {
    animation: your-keyframes 1s ease-in-out;
}

@keyframes your-keyframes {
    /* animation steps */
}
```

## 🚀 Deployment

The landing page is automatically deployed using GitHub Actions:

1. **Automatic Deployment**: Any push to the `main` branch with changes in the `docs/` folder triggers deployment
2. **Manual Deployment**: Use the "Actions" tab in GitHub to manually trigger deployment
3. **Pull Request Preview**: PRs show build status but don't deploy

### GitHub Pages Setup

1. Go to repository Settings → Pages
2. Source: "GitHub Actions"
3. The workflow will handle the rest automatically

## 📊 Performance

- **Lighthouse Score**: Optimized for 90+ scores
- **Loading Speed**: Minimal dependencies, optimized assets
- **Accessibility**: WCAG 2.1 AA compliant
- **SEO**: Semantic HTML and proper meta tags

## 🐛 Troubleshooting

### Common Issues

1. **Fonts not loading**: Check internet connection for Google Fonts
2. **Animations not working**: Ensure JavaScript is enabled
3. **Mobile menu not working**: Check for JavaScript errors in console
4. **Images not displaying**: Verify image paths are correct

### Browser Support

- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile**: iOS Safari 14+, Chrome Mobile 90+
- **Fallbacks**: Graceful degradation for older browsers

## 📝 Content Updates

### Extension Information
Update the following sections when the extension changes:
- Hero section statistics
- Features list
- Installation instructions
- GitHub links

### Demo Section
The demo section currently shows a placeholder. To add a real demo:
1. Replace the placeholder content in `index.html`
2. Add demo-specific styles to `styles.css`
3. Implement demo functionality in `script.js`

## 🤝 Contributing

To contribute to the landing page:
1. Fork the repository
2. Create a feature branch
3. Make your changes in the `docs/` folder
4. Test locally
5. Submit a pull request

## 📄 License

This landing page is part of the AI Code Review Assistant project and is licensed under the MIT License.

---

**Need help?** Open an issue in the main repository or check the [main README](../README.md) for more information about the extension itself.