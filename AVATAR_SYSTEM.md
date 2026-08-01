# 🎨 Avatar System - Implementation Guide

TaskTrack now features **custom SVG avatars** instead of emoji!

---

## What Changed

### ✨ Before
- Family members showed as emoji (👦 👧)
- Limited customization

### ✨ After  
- 6 unique hand-drawn avatars
- Diverse representation (different skin tones, hairstyles, features)
- Professional, cohesive look
- Easy to tell members apart

---

## 6 Avatar Options

| Name | Style | Features |
|------|-------|----------|
| **Alex** | Boy - Black Hair | Dark hair, blue shirt |
| **Maya** | Girl - Brown Hair | Brown pigtails, red shirt |
| **Lucas** | Boy - Blonde Hair | Blonde hair, green shirt |
| **Zara** | Girl - Curly Hair | Curly black hair, purple shirt |
| **Jordan** | Boy - Glasses | Glasses, blue shirt |
| **Emma** | Girl - Red Hair | Red hair, orange shirt |

---

## How It Works

### Adding a Family Member

**Before:** 
```
Click "Add Member" → Enter name → Done
(used random emoji)
```

**Now:**
```
Click "Add Member" 
  → Enter name (max 3 chars)
  → Pick avatar from 6 options (grid)
  → Save
```

### Displaying Avatars

**Leaderboard:**
- Shows avatar instead of emoji
- Size: 24px (small profile pic)
- Next to name and score

**Tasks (Tracker):**
- Shows avatar in task cards
- Size: 28px (medium, easy to tap)
- Shows in daily checklist
- Also in progress summary

---

## Files Changed/Created

### New Files
- ✅ `components/Avatars.jsx` - Avatar SVG components + helpers
- ✅ `components/AvatarPicker.jsx` - Grid picker UI
- ✅ `components/AddMemberModal.jsx` - Updated with avatar selection

### Updated Files
- ✅ `pages/Leaderboard.jsx` - Uses avatars, shows Add Member modal
- ✅ `pages/Tracker.jsx` - Displays avatars in task cards & summary
- ✅ `App.css` - CSS already supports avatar sizing (no changes needed)

---

## Code Structure

### Avatars.jsx
```javascript
// 6 avatar SVG components
export const Avatar1 = ({ size }) => <svg>...</svg>
export const Avatar2 = ({ size }) => <svg>...</svg>
// ... etc

// Helper to get component by ID
export const getAvatarComponent = (avatarId)

// Display component (easy to use)
export const AvatarDisplay = ({ avatarId, size = 80 })

// List of options
export const AVATAR_OPTIONS = [
  { id: 'avatar-1', name: 'Alex', label: 'Boy - Black Hair' },
  // ... etc
]
```

### AvatarPicker.jsx
```javascript
<AvatarPicker 
  selectedAvatar="avatar-1"
  onSelect={(avatarId) => {...}}
/>
```

### Usage Example
```javascript
import { AvatarDisplay } from '../components/Avatars';

// Display an avatar
<AvatarDisplay avatarId="avatar-1" size={24} />
```

---

## Sizing

| Use Case | Size | Location |
|----------|------|----------|
| Summary | 20px | Progress bar labels |
| Leaderboard | 24px | Rankings list |
| Tasks | 28px | Task cards (tap area) |
| Full | 80px | Avatar picker grid |

---

## Customization

### Add More Avatars?
1. Create new `export const Avatar7 = ({ size }) => <svg>...</svg>`
2. Add to `AVATARS` array in Avatars.jsx
3. Add option to `AVATAR_OPTIONS` list
4. Done!

### Change Avatar Colors?
Each `<rect>` and `<path>` has a fill color (hex code). 
Edit hex values in Avatars.jsx to change shirt color, hair color, etc.

### Change Avatar Style?
Update the SVG paths in each component. All avatars use:
- Simple shapes (circles, paths, rects)
- No gradients or complex effects
- Consistent style across all 6

---

## How Members Data Works

### Member Object
```javascript
{
  id: '1',
  name: 'Alx',        // Max 3 chars
  avatar: 'avatar-1'  // One of: avatar-1 through avatar-6
}
```

### Storing Avatars
Currently in demo mode - stores in React state.

When connected to Supabase, add `avatar_id` column to `family_members` table:
```sql
ALTER TABLE family_members ADD COLUMN avatar_id TEXT DEFAULT 'avatar-1';
```

---

## Dark Mode

Avatars work in both light and dark mode:
- SVG colors are hand-picked to look good always
- No CSS variables needed for avatar colors
- Consistent appearance across themes

---

## Performance

- ✅ **Lightweight:** SVG (not images)
- ✅ **Fast:** Renders instantly
- ✅ **Scalable:** Works on all devices
- ✅ **Accessible:** SVG with proper structure

---

## Testing

### In Leaderboard:
1. Click "Add Member"
2. Enter name: "Tes"
3. Pick different avatar
4. Click "Add Member"
5. See avatar appear in leaderboard ✓

### In Tracker:
1. Go to Tasks tab
2. See avatars in task cards ✓
3. See avatars in summary section ✓

---

## Future Enhancements (V2)

- Photo → Avatar conversion (AI)
- Custom avatar colors
- Avatar animations (waving, etc.)
- More avatar styles/options
- Avatar expressions based on mood/score

---

## Questions?

Check the code comments in:
- `components/Avatars.jsx` - SVG structure
- `components/AvatarPicker.jsx` - Selection UI
- `pages/Leaderboard.jsx` - Integration example

---

**Made with ❤️ by rydal**
