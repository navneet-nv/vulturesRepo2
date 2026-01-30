# 🎤 Voice Input Setup Guide - Bharat Biz-Agent

## Why "Microphone Access Denied"?

The browser is blocking microphone access for security reasons. This is normal and can be easily fixed!

---

## ✅ Quick Fix - Enable Microphone Access

### **Option 1: Chrome / Edge / Brave**

1. Click the **🔒 lock icon** (or 🎤 microphone icon) in the address bar
2. Find **"Microphone"** in the dropdown
3. Change from **"Block"** to **"Allow"**
4. Refresh the page
5. Try recording again!

**Alternative:**
1. Click the three dots menu (⋮) → Settings
2. Search for "Site settings"
3. Click "Microphone"
4. Find your site in the "Blocked" list
5. Move it to "Allowed"

---

### **Option 2: Firefox**

1. Click the **🔒 lock icon** in the address bar
2. Click the **">"** arrow next to "Connection secure"
3. Click **"More information"**
4. Go to **"Permissions"** tab
5. Find **"Use the Microphone"**
6. Uncheck **"Use Default"**
7. Select **"Allow"**
8. Close and refresh

**Alternative:**
1. Go to `about:preferences#privacy`
2. Scroll to "Permissions"
3. Click "Settings" next to Microphone
4. Find your site and change to "Allow"

---

### **Option 3: Safari (Mac)**

1. Safari menu → **"Settings for This Website"**
2. Find **"Microphone"**
3. Change to **"Allow"**
4. Refresh the page

**Or:**
1. Safari → Settings → Websites
2. Click **"Microphone"** in the left sidebar
3. Find your website
4. Change dropdown to **"Allow"**

---

## 🌐 Browser Requirements

### **Supported Browsers:**
✅ Chrome 50+ (recommended)
✅ Edge 79+
✅ Firefox 52+
✅ Safari 11+
✅ Brave (Chromium-based)

### **⚠️ Important Requirements:**

1. **HTTPS or Localhost Required**
   - Microphone only works on:
     - `https://` sites (secure)
     - `http://localhost` (development)
   - Does NOT work on `http://` public sites

2. **Check Your URL:**
   - ✅ `https://dashboard-biz.preview.emergentagent.com` - WORKS
   - ✅ `http://localhost:3000` - WORKS
   - ❌ `http://example.com` - BLOCKED

---

## 🎤 Testing Your Microphone

### **Step 1: Check Hardware**
1. Make sure microphone is plugged in (if external)
2. Test microphone in another app (Zoom, Google Meet)
3. Check volume levels in system settings

### **Step 2: Check Browser Permissions**
1. Go to browser settings
2. Search "microphone"
3. Make sure global microphone access is enabled
4. Check site-specific permissions

### **Step 3: Test in Bharat Biz-Agent**
1. Open AI Agent Chat
2. Click microphone button (🎤)
3. Browser should show permission popup
4. Click "Allow"
5. Speak: "Kitne invoices hain?"
6. Wait for transcription

---

## 🔧 Troubleshooting Common Issues

### **Issue 1: "No microphone found"**
**Solution:**
- Plug in your microphone
- Check if microphone is enabled in system settings
- Try a different USB port (if external mic)
- Restart browser

### **Issue 2: "Microphone is being used by another app"**
**Solution:**
- Close other apps using microphone (Zoom, Teams, Skype)
- Close other browser tabs with microphone access
- Restart browser

### **Issue 3: "Permission denied" even after allowing**
**Solution:**
- Clear browser cache and cookies
- Restart browser completely
- Check system microphone permissions:
  - **Windows:** Settings → Privacy → Microphone
  - **Mac:** System Preferences → Security & Privacy → Microphone
  - Make sure your browser is allowed

### **Issue 4: "Voice recording not working"**
**Solution:**
- Check if you're on HTTPS or localhost
- Try incognito/private browsing mode
- Update browser to latest version
- Try different browser

### **Issue 5: Recording stops immediately**
**Solution:**
- Check microphone volume (might be too low)
- Try external microphone instead of built-in
- Check if browser has sufficient permissions

---

## 🗣️ Voice Input Best Practices

### **For Best Transcription Quality:**

1. **Speak Clearly**
   - Normal conversational pace
   - Don't shout or whisper
   - Pause briefly between sentences

2. **Reduce Background Noise**
   - Close windows
   - Turn off fans/AC
   - Find quiet space

3. **Microphone Position**
   - 6-12 inches from mouth
   - Don't cover microphone
   - Position at chin level

4. **Language Mixing**
   - Feel free to mix Hindi and English!
   - "Mujhe 5 invoices dikhao" ✅
   - "कितने pending payments हैं?" ✅
   - "Show me total revenue" ✅

---

## 📱 Mobile Device Setup

### **Android (Chrome/Samsung Internet):**
1. Open site in browser
2. When microphone prompt appears, tap "Allow"
3. If blocked: Settings → Site settings → Microphone → Allow

### **iOS (Safari):**
1. Open site in Safari (not in-app browser)
2. When microphone prompt appears, tap "Allow"
3. If blocked: Settings → Safari → Website Settings → Microphone → Allow

---

## 🎯 Verification Steps

After enabling microphone, verify it's working:

1. **Visual Indicator**
   - Microphone button should pulse/animate when recording
   - You should see "Recording..." text

2. **Recording Status**
   - Red dot or recording indicator visible
   - Stop button available

3. **Transcription**
   - Text appears in chat box after recording
   - Shows "Transcribing..." while processing

4. **Response**
   - AI responds to your command
   - Action executes (if applicable)

---

## 🔐 Privacy & Security

### **Your Voice Data:**
- ✅ Recorded locally in browser
- ✅ Sent to OpenAI Whisper API for transcription only
- ✅ NOT stored permanently
- ✅ Deleted after transcription
- ✅ End-to-end encrypted (HTTPS)

### **Permissions:**
- Microphone access is ONLY for voice input
- No background recording
- No data collection
- Permission can be revoked anytime

---

## 💬 Alternative: Type Instead of Voice

If microphone isn't working, you can always type your commands:

**Simply type in the text box:**
- "Kitne invoices hain?"
- "मेरी revenue कितनी है?"
- "Show pending payments"

Voice is optional - typing works perfectly too! 🎯

---

## 🆘 Still Having Issues?

### **Quick Diagnostic Checklist:**

- [ ] Using supported browser (Chrome/Firefox/Edge/Safari)?
- [ ] On HTTPS or localhost?
- [ ] Microphone permission granted in browser?
- [ ] Microphone working in other apps?
- [ ] No other apps using microphone?
- [ ] Browser updated to latest version?
- [ ] System microphone permissions enabled?

### **If All Else Fails:**

1. **Try Different Browser**
   - Chrome usually has best support
   - Firefox is great alternative

2. **Use Incognito Mode**
   - Tests without extensions/cache
   - Helps identify permission issues

3. **Check Browser Console**
   - Press F12 → Console tab
   - Look for error messages
   - Share errors for support

4. **Type Your Commands**
   - Voice is optional
   - Typing works 100% reliably

---

## 🌟 Pro Tips

### **For Indian Languages:**

1. **Hindi Works Best When:**
   - Speaking clearly in Devanagari pronunciation
   - Using standard Hindi (not heavy regional dialect)

2. **Hinglish Tips:**
   - Mix freely: "Mujhe 5 invoices chahiye"
   - Natural code-mixing supported
   - No need to be formal

3. **English:**
   - Indian accent fully supported
   - No need for American/British accent
   - Speak naturally

### **Command Structure:**
- **Short & Clear:** "Pending payments dikhao"
- **Natural:** "Rahul ko reminder bhejo"
- **Mixed:** "मेरी total revenue कितनी है?"

---

## 📞 Support

**If you continue to have issues:**
1. Check the error message in the notification
2. Follow the specific instructions provided
3. Try the troubleshooting steps above
4. Use typing as alternative

**Remember:** Voice input is a convenience feature. All functionality works perfectly with typing too! 🎯

---

**🎤 Happy Voice Commanding! 🇮🇳**
