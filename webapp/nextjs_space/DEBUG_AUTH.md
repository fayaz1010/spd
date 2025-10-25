# Authentication Debugging Guide

## Current 401 Error on Supplier Edit

### What We Fixed:
✅ Updated `/api/admin/suppliers/[id]/route.ts` to use `getAdminFromRequest`
✅ Uses correct JWT_SECRET from `/lib/auth-admin.ts`
✅ Added cache-busting settings

### If Still Getting 401:

#### Step 1: Check Your Token
Open browser console and run:
```javascript
localStorage.getItem('admin_token')
```

**If null/undefined:**
- You're not logged in
- Solution: Log out and log back in

**If shows a token:**
- Copy the token
- Go to https://jwt.io
- Paste token to decode
- Check if it's expired

#### Step 2: Check Server Logs
Look for these messages in terminal:
```
GET /api/admin/suppliers/supplier_sg_wholesale 401
```

**If you see:**
- `Token verification failed` → Token is invalid
- `No Bearer token found` → Token not being sent
- `Unauthorized` → Token verification failed

#### Step 3: Verify Auth Utility
Check if `/lib/auth-admin.ts` exists and has:
```typescript
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
```

#### Step 4: Check .env File
Verify `JWT_SECRET` in `.env`:
```
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

**Important:** All admin routes MUST use the SAME secret.

### Quick Fix: Re-login

1. Click Logout
2. Clear localStorage:
   ```javascript
   localStorage.clear()
   ```
3. Login again
4. Try editing supplier

### Verify Fix Worked

Run in browser console:
```javascript
fetch('/api/admin/suppliers/supplier_sg_wholesale', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
  }
})
.then(r => r.json())
.then(console.log)
```

**Expected:** Supplier data
**If 401:** Token is invalid

### Common Issues

#### Issue 1: Old Token
**Symptom:** Was working, now 401
**Cause:** Token expired or JWT_SECRET changed
**Fix:** Logout and login again

#### Issue 2: Mixed JWT Secrets
**Symptom:** Some routes work, others don't
**Cause:** Different routes using different secrets
**Fix:** All routes should use `getAdminFromRequest` from `/lib/auth-admin.ts`

#### Issue 3: Cached Code
**Symptom:** Changes not taking effect
**Cause:** `.next` folder has old compiled code
**Fix:** Delete `.next` and restart

### Files That Should Use getAdminFromRequest:

✅ `/app/api/admin/suppliers/[id]/route.ts`
✅ `/app/api/admin/suppliers/route.ts`
✅ `/app/api/admin/jobs/[id]/route.ts`
✅ `/app/api/admin/jobs/[id]/assign/route.ts`
✅ All other `/app/api/admin/*` routes

### Test All Routes:

```javascript
// Test supplier route
fetch('/api/admin/suppliers', {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('admin_token')}` }
}).then(r => console.log('Suppliers:', r.status));

// Test jobs route
fetch('/api/admin/jobs', {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('admin_token')}` }
}).then(r => console.log('Jobs:', r.status));
```

**All should return 200**

### Nuclear Option: Reset Everything

If nothing works:
```powershell
# Stop server (Ctrl+C)
Remove-Item -Recurse -Force .next
Remove-Item -Recurse -Force node_modules\.cache
npm run dev
```

Then:
1. Clear browser cache (Ctrl+Shift+Delete)
2. Logout
3. Login
4. Test

### PWA IndexedDB Errors (Unrelated)

The errors:
```
[PWA] Failed to get pending sync count: UnknownError
```

These are from the PWA feature and don't affect authentication. They can be ignored or fixed separately by:
1. Clearing browser data (Site settings → Clear data)
2. Disabling PWA temporarily
3. Fixing IndexedDB permissions
