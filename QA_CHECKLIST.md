# Callisto AI - QA Testing Checklist

## ✅ Visual & UI Testing

### Theme Switching
- [ ] Light theme displays correctly
- [ ] Dark theme displays correctly
- [ ] Theme toggle works smoothly
- [ ] Theme persists across page refreshes
- [ ] No color contrast issues in either theme
- [ ] All components visible in both themes

### Layout & Navigation
- [ ] Sidebar displays correctly on desktop
- [ ] Sidebar collapses on mobile (<768px)
- [ ] Mobile menu (Sheet) works correctly
- [ ] Navigation active states work correctly
- [ ] Logo and branding display properly
- [ ] Header sticky positioning works
- [ ] Scrollbar styling is consistent

### Dashboard (`/admin`)
- [ ] Stats cards display correctly
- [ ] Animations work smoothly (no jank)
- [ ] Tabs switch properly
- [ ] Recent activity list loads
- [ ] Platform distribution displays
- [ ] Responsive on mobile/tablet

### Clients Page (`/admin/clients`)
- [ ] Client list loads correctly
- [ ] Client cards display properly
- [ ] Hover states work (show/hide actions)
- [ ] Status badges display correctly
- [ ] Click to view details works
- [ ] Dropdown menu actions work
- [ ] Empty state displays correctly
- [ ] Loading state shows spinner
- [ ] Stats bar shows correct count

### Links Page (`/admin/links`)
- [ ] Link list loads correctly
- [ ] Link cards display properly
- [ ] Copy button works with feedback
- [ ] Status badges show correctly
- [ ] Open in new tab works
- [ ] Delete confirmation works
- [ ] Empty state displays correctly
- [ ] Stats bar shows correct count
- [ ] Link generator form works

### OAuth Connection Cards
- [ ] Cards display platform icons correctly
- [ ] Permission list shows properly
- [ ] Connection status updates
- [ ] Connect button works
- [ ] Loading state shows spinner
- [ ] Animations play smoothly
- [ ] Hover effects work

## 📱 Responsive Testing

### Mobile (< 768px)
- [ ] Sidebar converts to mobile menu
- [ ] All pages are readable
- [ ] Buttons are touch-friendly (min 44px)
- [ ] No horizontal scroll
- [ ] Text doesn't overflow
- [ ] Cards stack properly
- [ ] Navigation works smoothly

### Tablet (768px - 1024px)
- [ ] Layout adjusts appropriately
- [ ] Sidebar toggles correctly
- [ ] Grid layouts work
- [ ] All content accessible

### Desktop (> 1024px)
- [ ] Full sidebar visible
- [ ] Optimal layout spacing
- [ ] All features accessible
- [ ] No wasted space

## 🎬 Animation Testing

### Framer Motion Animations
- [ ] Dashboard stats cards stagger in
- [ ] Sidebar active indicator animates smoothly
- [ ] OAuth cards fade in on load
- [ ] No animation lag or jank
- [ ] Animations respect reduced motion preference

### CSS Animations
- [ ] Fade in animations work
- [ ] Slide in animations work
- [ ] Scale in animations work
- [ ] Spinner animations are smooth
- [ ] Transition durations feel right

## ♿ Accessibility Testing

### Keyboard Navigation
- [ ] Tab through all interactive elements
- [ ] Focus states are visible
- [ ] Escape key closes modals/dialogs
- [ ] Enter key activates buttons
- [ ] Arrow keys work in dropdowns

### Screen Reader
- [ ] ARIA labels present
- [ ] Semantic HTML used
- [ ] Headings in proper hierarchy
- [ ] Alt text on images/icons
- [ ] Form labels associated

### Color Contrast
- [ ] Text meets WCAG AA standards
- [ ] Interactive elements distinguishable
- [ ] Focus indicators visible
- [ ] Error messages clear

## 🔧 Functionality Testing

### User Actions
- [ ] Login/logout works
- [ ] Profile dropdown works
- [ ] Notification badge updates
- [ ] Create client works
- [ ] Create link works
- [ ] Delete actions require confirmation
- [ ] Edit actions save properly

### Data Loading
- [ ] Initial data loads
- [ ] Refresh button works
- [ ] Auto-refresh (if implemented) works
- [ ] Empty states show correctly
- [ ] Error states show correctly
- [ ] Loading states show correctly

### Forms
- [ ] All inputs work correctly
- [ ] Validation shows errors
- [ ] Submit buttons work
- [ ] Reset/cancel works
- [ ] Success feedback shows

## 🌐 Browser Testing

### Chrome/Edge (Chromium)
- [ ] All features work
- [ ] Animations smooth
- [ ] Styles correct
- [ ] No console errors

### Firefox
- [ ] All features work
- [ ] Animations smooth
- [ ] Styles correct
- [ ] No console errors

### Safari (macOS/iOS)
- [ ] All features work
- [ ] Animations smooth
- [ ] Styles correct
- [ ] No console errors
- [ ] Backdrop blur works

## ⚡ Performance Testing

### Load Times
- [ ] Initial page load < 2s
- [ ] First Contentful Paint < 1s
- [ ] Lighthouse score > 90
- [ ] No layout shift (CLS < 0.1)

### Runtime Performance
- [ ] Smooth scrolling (60fps)
- [ ] No memory leaks
- [ ] Fast navigation between pages
- [ ] Animations at 60fps

### Network
- [ ] Works on slow 3G
- [ ] Handles network errors gracefully
- [ ] Shows loading states
- [ ] Caches appropriately

## 🔒 Security Testing

### Authentication
- [ ] Protected routes redirect to login
- [ ] Session persists correctly
- [ ] Logout clears session
- [ ] Role-based access works

### Data Protection
- [ ] No sensitive data in URLs
- [ ] API tokens hidden
- [ ] XSS protection in place
- [ ] CSRF protection in place

## 🐛 Edge Cases

### Empty States
- [ ] No clients message shows
- [ ] No links message shows
- [ ] No notifications message shows
- [ ] Proper call-to-action shown

### Error States
- [ ] Network errors handled
- [ ] API errors displayed
- [ ] 404 pages work
- [ ] 500 errors handled

### Long Content
- [ ] Long names truncate properly
- [ ] Long lists scroll correctly
- [ ] Long URLs don't break layout
- [ ] Overflow handled correctly

### Special Characters
- [ ] Emoji display correctly
- [ ] Special chars don't break UI
- [ ] Unicode handles properly
- [ ] HTML entities escaped

## 📊 Data Integrity

### CRUD Operations
- [ ] Create works correctly
- [ ] Read displays accurate data
- [ ] Update saves changes
- [ ] Delete removes data
- [ ] Optimistic updates work

### Data Validation
- [ ] Required fields enforced
- [ ] Email validation works
- [ ] Date validation works
- [ ] URL validation works

## 🎨 Design Consistency

### Component Consistency
- [ ] All buttons same style
- [ ] All cards same spacing
- [ ] All icons same size
- [ ] All text consistent

### Spacing & Alignment
- [ ] Consistent padding
- [ ] Aligned elements
- [ ] Proper whitespace
- [ ] Visual hierarchy clear

### Color Usage
- [ ] Brand colors used correctly
- [ ] Semantic colors (success, error) clear
- [ ] Consistent color palette
- [ ] No color conflicts

## 📝 Content Testing

### Text Content
- [ ] No typos
- [ ] Clear messaging
- [ ] Helpful error messages
- [ ] Appropriate tone

### Icons & Images
- [ ] Icons display correctly
- [ ] Images load properly
- [ ] Fallbacks work
- [ ] Sizes appropriate

## 🔄 State Management

### Loading States
- [ ] Show during data fetch
- [ ] Show during mutations
- [ ] Smooth transitions
- [ ] Clear to user

### Error States
- [ ] Show on network error
- [ ] Show on API error
- [ ] Show on validation error
- [ ] Provide recovery action

### Success States
- [ ] Show after create
- [ ] Show after update
- [ ] Show after delete
- [ ] Auto-dismiss or manual

## 📱 PWA Testing (if applicable)

### Installation
- [ ] Can install as PWA
- [ ] Icon displays correctly
- [ ] Launches correctly
- [ ] Updates work

### Offline
- [ ] Offline page shows
- [ ] Cached data loads
- [ ] Syncs when online
- [ ] Proper error messages

## 🧪 Regression Testing

### After Updates
- [ ] Existing features still work
- [ ] No broken styles
- [ ] No broken animations
- [ ] No console errors
- [ ] Performance maintained

## 📋 Final Checks

### Pre-Production
- [ ] All environment variables set
- [ ] Production build works
- [ ] No console warnings
- [ ] No console errors
- [ ] Analytics tracking works
- [ ] Error tracking works

### Documentation
- [ ] README updated
- [ ] API docs current
- [ ] Component docs current
- [ ] Deployment guide current

### Team Review
- [ ] Code review complete
- [ ] Design review complete
- [ ] Product review complete
- [ ] Security review complete

---

## Testing Tools

### Recommended Tools
- **Chrome DevTools**: Performance, Network, Lighthouse
- **React DevTools**: Component inspection
- **Accessibility Insights**: WCAG compliance
- **BrowserStack**: Cross-browser testing
- **Postman**: API testing
- **Jest/Vitest**: Unit tests
- **Playwright**: E2E tests

### Lighthouse Targets
- Performance: > 90
- Accessibility: > 95
- Best Practices: > 95
- SEO: > 90

---

## Bug Reporting Template

```markdown
### Bug Description
[Clear description of the issue]

### Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. See error

### Expected Behavior
[What should happen]

### Actual Behavior
[What actually happens]

### Environment
- Browser: [e.g., Chrome 120]
- OS: [e.g., macOS 14]
- Screen Size: [e.g., 1920x1080]
- Theme: [Light/Dark]

### Screenshots
[If applicable]

### Console Errors
[Copy any errors from browser console]
```

---

**Status**: Ready for Testing ✅
**Last Updated**: [Date]
**Tester**: [Name]

