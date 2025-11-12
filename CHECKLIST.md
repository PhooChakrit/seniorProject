# ✅ Getting Started Checklist

Use this checklist to set up and verify your JBrowse 2 application.

## 📋 Setup Checklist

### Step 1: Install Dependencies
- [ ] Run `npm install` in the project root
- [ ] Wait for all packages to download (this may take a few minutes)
- [ ] Verify no error messages in the terminal

### Step 2: Configure Environment
- [ ] Check `.env` file exists with:
  - DATABASE_URL
  - JWT_SECRET
  - PORT
- [ ] (Optional) Update JWT_SECRET to a secure random string

### Step 3: Database Setup
- [ ] Run `npm run prisma:generate`
- [ ] Run `npm run prisma:migrate`
- [ ] Enter migration name when prompted (e.g., "init")
- [ ] Verify `prisma/dev.db` file was created

### Step 4: Start Development Server
- [ ] Run `npm run dev`
- [ ] Verify frontend starts on http://localhost:5173
- [ ] Verify backend starts on http://localhost:3000
- [ ] Check terminal for "Server is running" message

### Step 5: Access Application
- [ ] Open browser to http://localhost:5173
- [ ] Verify login page loads correctly
- [ ] No console errors in browser DevTools

## 🧪 Verification Checklist

### Test Authentication
- [ ] Click "Don't have an account? Sign up"
- [ ] Enter test user details:
  - Name: Test User
  - Email: test@example.com
  - Password: password123
- [ ] Click "Sign Up"
- [ ] Verify redirect to dashboard
- [ ] Verify welcome message shows your name/email
- [ ] Verify navigation menu appears

### Test Dashboard
- [ ] Verify stats cards display correctly
- [ ] Verify icons render (Dna, Database, Users, Activity)
- [ ] Verify "Quick Actions" section appears
- [ ] Verify "Recent Activity" section appears
- [ ] Check responsive design (resize browser)

### Test JBrowse Page
- [ ] Click "JBrowse" in navigation
- [ ] Wait for JBrowse to load (may take 10-15 seconds)
- [ ] Verify genome browser displays
- [ ] Verify you can navigate the genome
- [ ] Verify track information shows below browser
- [ ] No errors in browser console

### Test Data Page
- [ ] Click "Data" in navigation
- [ ] Verify page loads (may show "No genome data available")
- [ ] Check loading spinner appeared briefly
- [ ] No errors displayed

### Test Navigation
- [ ] Click between Dashboard, JBrowse, and Data tabs
- [ ] Verify active tab highlights
- [ ] Verify smooth navigation (no page reloads)

### Test Logout
- [ ] Click "Logout" button in header
- [ ] Verify redirect to login page
- [ ] Verify cannot access /dashboard directly (redirects to login)

### Test Login (Existing User)
- [ ] Use credentials from earlier (test@example.com / password123)
- [ ] Click "Sign In"
- [ ] Verify successful login
- [ ] Verify redirect to dashboard

## 🔍 Troubleshooting Checklist

### If Frontend Won't Start
- [ ] Check if port 5173 is in use: `netstat -ano | findstr :5173`
- [ ] Kill process if needed: `taskkill /PID <PID> /F`
- [ ] Delete `node_modules` and run `npm install` again
- [ ] Check for TypeScript errors (should disappear after install)

### If Backend Won't Start
- [ ] Check if port 3000 is in use: `netstat -ano | findstr :3000`
- [ ] Kill process if needed
- [ ] Verify `.env` file exists
- [ ] Check `prisma/dev.db` exists
- [ ] Re-run `npm run prisma:generate`

### If Database Errors
- [ ] Delete `prisma/dev.db` and `prisma/dev.db-journal`
- [ ] Run `npm run prisma:migrate` again
- [ ] Check DATABASE_URL in `.env`

### If JBrowse Won't Load
- [ ] Check browser console for errors
- [ ] Verify internet connection (JBrowse loads data from external URLs)
- [ ] Wait longer (initial load can take 15-20 seconds)
- [ ] Try refreshing the page

### If Authentication Fails
- [ ] Check browser console for API errors
- [ ] Verify backend is running on port 3000
- [ ] Check Network tab in DevTools for failed requests
- [ ] Verify database has User table

## 📊 Optional: Add Sample Data

### Using Prisma Studio
- [ ] Run `npm run prisma:studio`
- [ ] Open http://localhost:5555
- [ ] Click "GenomeData" model
- [ ] Click "Add record"
- [ ] Fill in:
  - name: "Human GRCh38"
  - assembly: "GRCh38"
  - description: "Human reference genome"
  - userId: 1 (your user ID)
- [ ] Click "Save 1 change"
- [ ] Go to /data page and verify data appears
- [ ] Test pagination (add more records)

## 🎯 Feature Verification

### Login Page Features
- [ ] Toggle between Login/Register
- [ ] Form validation works
- [ ] Error messages display
- [ ] Loading state shows on submit
- [ ] Password field is masked
- [ ] Responsive design

### Dashboard Features
- [ ] Stats cards display numbers
- [ ] Icons render correctly
- [ ] Links are clickable
- [ ] Layout is responsive
- [ ] User email shows in header

### JBrowse Features
- [ ] Genome browser loads
- [ ] Can zoom in/out
- [ ] Can pan left/right
- [ ] Tracks display
- [ ] Browser information shows
- [ ] Loading state appears

### Data Page Features
- [ ] Data list displays
- [ ] Pagination appears (if >10 records)
- [ ] Loading state shows
- [ ] Empty state handles gracefully
- [ ] Card layout is clean

### Layout Features
- [ ] Navigation highlights active page
- [ ] Logout button works
- [ ] User email displays
- [ ] Header is sticky/fixed
- [ ] Responsive on mobile

## 🚀 Next Steps

After verification:
- [ ] Read README.md for full documentation
- [ ] Review ARCHITECTURE.md to understand structure
- [ ] Check COMMANDS.md for quick reference
- [ ] Explore code in `src/` folder
- [ ] Customize for your needs

## 📝 Development Workflow

### Daily Development
1. [ ] `npm run dev` to start servers
2. [ ] Make code changes
3. [ ] See hot reload in action
4. [ ] Test in browser
5. [ ] Commit changes

### Adding Features
1. [ ] Create new components in `src/components/`
2. [ ] Add pages in `src/pages/`
3. [ ] Update routes in `src/App.tsx`
4. [ ] Add API endpoints in `server/routes/`
5. [ ] Update Prisma schema if needed
6. [ ] Run migrations

### Customization Ideas
- [ ] Change color scheme (tailwind.config.js)
- [ ] Add more genome assemblies
- [ ] Implement file upload
- [ ] Add user roles
- [ ] Create admin panel
- [ ] Add more JBrowse tracks

## ✨ Success Criteria

You're ready to develop when:
- ✅ All setup steps complete
- ✅ All authentication tests pass
- ✅ All pages load without errors
- ✅ JBrowse genome browser works
- ✅ Database operations successful
- ✅ No console errors

## 📞 Support

If stuck:
1. Check error messages in terminal
2. Check browser console (F12)
3. Review error in Network tab
4. Check this checklist
5. Review documentation files

---

**Happy coding! 🎉 Your JBrowse 2 app is ready to go!**

Mark items as you complete them to track progress.
