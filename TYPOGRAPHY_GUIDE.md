# Typography Guide - Emotional Design System

## 🎨 Font Philosophy

Our typography system is designed to create emotional connection while maintaining clarity. Each font serves a specific purpose in telling your story.

---

## 📚 Font Families

### 1. **Poppins** - The Voice of Hope
**Purpose**: Headlines, important messages, calls to action

**When to use**:
- Main page titles
- Section headers
- Important statistics
- Button labels (primary)
- Campaign titles

**Characteristics**:
- Bold and confident
- Friendly and approachable
- Works in English and Nepali
- High readability

**Example Usage**:
```jsx
<h1 style={{ fontFamily: 'Poppins, sans-serif' }}>
  Every Dream Deserves A Chance to Grow
</h1>
```

**CSS Class**: `font-poppins`

---

### 2. **Inter** - The Voice of Clarity
**Purpose**: Body text, descriptions, explanations

**When to use**:
- Paragraph text
- Card descriptions
- User interface text
- Form labels
- Navigation items

**Characteristics**:
- Crystal clear readability
- Neutral and professional
- Modern and clean
- Optimized for screens

**Example Usage**:
```jsx
<p style={{ fontFamily: 'Inter, sans-serif' }}>
  From the hills of Pokhara to the valleys of Kathmandu, 
  your kindness can change a life today.
</p>
```

**CSS Class**: `font-inter`

---

### 3. **Crimson Text** - The Voice of Wisdom
**Purpose**: Quotes, testimonials, inspirational content

**When to use**:
- Inspirational quotes
- User testimonials
- Featured stories
- Success story excerpts
- Special messages

**Characteristics**:
- Elegant and distinguished
- Serif style for authority
- Emotional and warm
- Traditional yet modern

**Example Usage**:
```jsx
<blockquote className="text-quote" style={{ 
  fontFamily: 'Crimson Text, Georgia, serif',
  fontStyle: 'italic' 
}}>
  "A single act of kindness throws out roots in all directions,
  and the roots spring up and make new trees."
</blockquote>
```

**CSS Class**: `text-quote`

---

### 4. **Space Grotesk** - The Voice of Action
**Purpose**: Labels, tags, badges, captions

**When to use**:
- Status badges
- Category tags
- Small UI labels
- Timestamps
- Metadata

**Characteristics**:
- Technical but friendly
- Uppercase for emphasis
- Compact and efficient
- Modern tech feel

**Example Usage**:
```jsx
<span className="text-caption" style={{ 
  fontFamily: 'Space Grotesk, sans-serif',
  textTransform: 'uppercase',
  letterSpacing: '0.025em'
}}>
  When hearts unite, hope multiplies
</span>
```

**CSS Class**: `text-caption`

---

## 📏 Size Scale

### Desktop Sizes:
```css
/* Hero Headlines */
text-5xl md:text-6xl lg:text-7xl  /* 48px → 60px → 72px */

/* Section Headers */
text-4xl md:text-5xl              /* 36px → 48px */

/* Subheadings */
text-2xl md:text-3xl              /* 24px → 30px */

/* Body Text */
text-lg md:text-xl                /* 18px → 20px */

/* Small Text */
text-sm md:text-base              /* 14px → 16px */

/* Caption Text */
text-xs                           /* 12px */
```

### Mobile Adjustments:
- Headlines scale down by 1-2 sizes
- Body text remains readable (min 16px)
- Line height increases for easier reading
- Letter spacing adjusted for small screens

---

## 🎭 Emotional Hierarchy

### 1. **Inspire** (Top Level)
- **Font**: Poppins Bold
- **Size**: 48px - 72px
- **Purpose**: Capture attention, inspire action
- **Example**: "Every Dream Deserves A Chance to Grow"

### 2. **Reflect** (Mid Level)
- **Font**: Crimson Text Italic
- **Size**: 24px - 36px
- **Purpose**: Create emotional pause, wisdom
- **Example**: Inspirational quotes

### 3. **Inform** (Content Level)
- **Font**: Inter Regular/Medium
- **Size**: 16px - 20px
- **Purpose**: Explain, guide, inform
- **Example**: Descriptions, instructions

### 4. **Direct** (Action Level)
- **Font**: Inter Semibold
- **Size**: 16px - 18px
- **Purpose**: Call to action, buttons
- **Example**: "Start Your Story"

### 5. **Label** (Meta Level)
- **Font**: Space Grotesk
- **Size**: 12px - 14px
- **Purpose**: Categorize, tag, timestamp
- **Example**: "STORIES THAT NEED YOU"

---

## 💡 Best Practices

### DO:
✅ Use Poppins for emotional headlines
✅ Use Crimson Text for quotes (always italic)
✅ Use Inter for most body content
✅ Maintain consistent hierarchy
✅ Test readability on mobile
✅ Use proper line heights (1.5-1.75 for body)
✅ Consider translation length (Nepali text may be longer)

### DON'T:
❌ Mix more than 3 fonts in one section
❌ Use all caps for long text (hard to read)
❌ Make body text smaller than 16px on mobile
❌ Use decorative fonts for important info
❌ Forget font weights (vary between 400-700)
❌ Ignore contrast ratios (accessibility)

---

## 🌍 Localization Considerations

### For Nepali Translation:
1. **Font Compatibility**: All fonts support Devanagari script
2. **Size Adjustments**: May need 10-15% larger for readability
3. **Line Height**: Increase by 0.1-0.2 for better clarity
4. **Word Length**: Nepali words may be longer - allow space

### Font Loading Order:
```html
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Poppins:wght@400;500;600;700;800&family=Crimson+Text:ital,wght@0,400;0,600;1,400;1,600&family=Space+Grotesk:wght@400;500;600;700&display=swap');
```

---

## 🎨 Color Pairing

### Poppins (Headlines)
- Default: `text-gray-900 dark:text-white`
- Emphasis: `text-[#8B2325]` (Nepal Red)
- Gradient: `bg-gradient-to-r from-[#8B2325] to-blue-600 bg-clip-text text-transparent`

### Inter (Body)
- Default: `text-gray-600 dark:text-gray-300`
- Strong: `text-gray-900 dark:text-white`
- Muted: `text-gray-500 dark:text-gray-400`

### Crimson Text (Quotes)
- Default: `text-gray-800 dark:text-gray-100`
- Emphasis: `text-[#8B2325] dark:text-red-400`

### Space Grotesk (Labels)
- Default: `text-gray-600 dark:text-gray-400`
- Active: `text-[#8B2325] dark:text-red-400`

---

## 📱 Responsive Typography

### Mobile (<768px):
```css
/* Reduce headline sizes */
.text-display { font-size: 2.5rem; }  /* was 4rem */
.text-h1 { font-size: 2rem; }         /* was 3rem */
.text-h2 { font-size: 1.75rem; }      /* was 2.5rem */

/* Maintain body readability */
.text-body { font-size: 1rem; }       /* stays 1rem */
```

### Tablet (768px-1024px):
```css
/* Scale proportionally */
.text-display { font-size: 3rem; }
.text-h1 { font-size: 2.5rem; }
.text-h2 { font-size: 2rem; }
```

---

## 🎯 Component Examples

### Hero Section:
```jsx
{/* Tag */}
<span className="text-sm" style={{ fontFamily: 'Space Grotesk' }}>
  WHEN HEARTS UNITE, HOPE MULTIPLIES
</span>

{/* Headline */}
<h1 className="text-5xl md:text-6xl font-bold" 
    style={{ fontFamily: 'Poppins' }}>
  Every Dream Deserves A Chance to Grow
</h1>

{/* Body */}
<p className="text-lg md:text-xl" 
   style={{ fontFamily: 'Inter' }}>
  From the hills of Pokhara to the valleys of Kathmandu...
</p>

{/* Quote */}
<blockquote className="text-lg italic" 
            style={{ fontFamily: 'Crimson Text' }}>
  "A single act of kindness throws out roots..."
</blockquote>
```

### Stats Card:
```jsx
{/* Number */}
<span className="text-5xl font-black" 
      style={{ fontFamily: 'Poppins' }}>
  1,250+
</span>

{/* Label */}
<h3 className="text-xl font-bold" 
    style={{ fontFamily: 'Poppins' }}>
  Kind Souls
</h3>

{/* Description */}
<p className="text-sm" 
   style={{ fontFamily: 'Inter' }}>
  Ordinary people doing extraordinary things together
</p>
```

---

## 🔍 Accessibility

### Minimum Requirements:
- **Body Text**: 16px minimum
- **Line Height**: 1.5 minimum
- **Contrast Ratio**: 4.5:1 for body, 3:1 for large text
- **Letter Spacing**: Adequate for readability
- **Font Weight**: Not too thin (400+ recommended)

### Screen Reader Friendly:
- Use semantic HTML (`<h1>`, `<p>`, `<blockquote>`)
- Proper heading hierarchy
- Alt text for decorative quotes
- ARIA labels when needed

---

## ⚡ Performance Tips

### Font Loading Strategy:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
```

### Font Display:
```css
font-display: swap; /* Prevents invisible text */
```

### Only Load What You Need:
```
✅ Inter: 300,400,500,600,700
✅ Poppins: 400,500,600,700,800
✅ Crimson Text: 400,600,400i,600i
✅ Space Grotesk: 400,500,600,700

❌ Don't load 100,200,900 if not used
```

---

## 📊 Usage Statistics

### Current Font Distribution:
- **Inter**: ~60% (body text, UI)
- **Poppins**: ~25% (headlines, CTAs)
- **Space Grotesk**: ~10% (labels, tags)
- **Crimson Text**: ~5% (quotes, special)

This distribution ensures:
- Fast loading times
- Consistent experience
- Emotional hierarchy
- Brand identity

---

## 🎨 Quick Reference

| Element | Font | Weight | Size |
|---------|------|--------|------|
| Page Title | Poppins | 700-800 | 48-72px |
| Section Header | Poppins | 600-700 | 36-48px |
| Quote | Crimson Text | 400 italic | 24-36px |
| Body Text | Inter | 400-500 | 16-20px |
| Button | Inter | 600 | 16-18px |
| Label | Space Grotesk | 500 | 12-14px |

---

**Remember**: Typography isn't just about looking good—it's about creating emotional connection and guiding users through their journey with care and clarity.

---

*"Good typography is invisible. Great typography makes you feel."*
