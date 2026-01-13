# 🚀 KIOSK Quick Start Guide

## ✅ Already Set Up!
The KIOSK page is ready to use - it's already added to App.js as a public route.

## 🔗 Access URLs

### Development
```
http://localhost:3000/kiosk
```

### Production
```
http://your-domain.com/kiosk
```

## 🔓 No Login Required!
The KIOSK is a **public route** - customers can access it directly without any authentication.

## 🖥️ Quick Launch in Kiosk Mode

### Windows - Chrome Fullscreen
Create a batch file `launch-kiosk.bat`:
```batch
@echo off
start chrome.exe --kiosk "http://localhost:3000/kiosk" --no-first-run --disable-session-crashed-bubble
```

### Mac - Chrome Fullscreen
Create a script file:
```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --kiosk "http://localhost:3000/kiosk"
```

### Manual Fullscreen
1. Open: `http://localhost:3000/kiosk`
2. Press `F11` (fullscreen)

## ⚙️ Quick Configuration

### Update API URL
Edit `src/views/pos/Kiosk.jsx`:
```javascript
const baseURL = 'http://localhost:4402';  // Change to your API URL
```

### Customize Colors
Edit `src/views/pos/Kiosk.css`:
- Change primary color: `#1890ff`
- Change success color: `#52c41a`
- Update gradient backgrounds

## 📱 Testing Checklist

- [ ] Can access `/kiosk` without login
- [ ] Categories load correctly
- [ ] Subcategories appear when category clicked
- [ ] Items display with images
- [ ] Add to cart works
- [ ] Cart shows correct items and total
- [ ] Quantity +/- buttons work
- [ ] Place order succeeds
- [ ] Order number displays
- [ ] Cart clears after successful order

## 🔧 Troubleshooting

### Can't access /kiosk
- Check if app is running (`npm start`)
- Verify route was added to App.js
- Clear browser cache

### Images not loading
- Check `baseURL` matches API server
- Verify images exist in `/uploads` folder
- Check API server is running

### Orders not saving
- Check API connection
- Verify database is running
- Check browser console for errors

## 📚 Full Documentation
See `KIOSK_SYSTEM_DOCUMENTATION.md` for complete details.

## 🎯 Recommended Hardware Setup

### Minimum Requirements
- Touch screen display (15" or larger)
- Windows 10/11 or Linux
- 4GB RAM
- Network connection

### Optimal Setup
- 21-24" touch screen display
- Desktop PC or NUC
- 8GB+ RAM
- Ethernet connection (more stable than WiFi)
- UPS for power backup

### Tablet Option
- iPad Pro 12.9" or similar
- Use Safari/Chrome in fullscreen
- Guided Access mode (iOS)
- Kiosk mode app (Android)

## 🚦 Go Live Checklist

- [ ] Update API baseURL to production server
- [ ] Test all features thoroughly
- [ ] Configure fullscreen/kiosk mode
- [ ] Disable browser navigation
- [ ] Set auto-start on boot
- [ ] Test payment flow (if applicable)
- [ ] Train staff on basic troubleshooting
- [ ] Set up monitoring/alerts
- [ ] Create backup/recovery plan

## 💡 Tips

1. **Regular Restart**: Schedule daily restarts to clear memory
2. **Idle Reset**: Consider adding auto-reset after inactivity
3. **Remote Access**: Set up TeamViewer or similar for remote support
4. **Backup Tablet**: Keep a backup tablet for emergencies
5. **Clear Instructions**: Add visual guides for customers
6. **Test Mode**: Test orders regularly to verify functionality

## 📞 Support
For issues or questions, refer to the main documentation or contact your development team.

---
**Version**: 1.0.0  
**Last Updated**: January 2026
