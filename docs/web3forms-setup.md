# Web3Forms Contact Form Setup Guide

## Quick Setup (5 minutes)

### Step 1: Get Your Free API Key

1. Go to https://web3forms.com
2. Click "Get Started Free"
3. Enter your email address (wbmbandofficial@gmail.com)
4. Check your email and verify
5. Copy your API key

### Step 2: Add API Key to Config

Open `config/general.ts` and replace:

```typescript
web3formsApiKey: "YOUR_WEB3FORMS_API_KEY_HERE",
```

With your actual API key:

```typescript
web3formsApiKey: "abc123-your-real-api-key-here",
```

### Step 3: Test the Form

1. Go to your Contacts section
2. Fill out the form
3. Click "Send Message"
4. You should receive the email at wbmbandofficial@gmail.com

## Features

✅ **Free Forever** - Unlimited form submissions
✅ **No Backend Needed** - Works with static sites
✅ **Spam Protection** - Built-in spam filtering
✅ **Email Notifications** - Instant email delivery
✅ **Custom Redirect** - Can redirect after submission
✅ **File Uploads** - Support for attachments (if needed)

## Configuration Options

In the Web3Forms dashboard you can:

- Change the email where submissions are sent
- Enable/disable spam filtering
- Set up custom email templates
- Add webhooks for integrations
- View submission history

## Troubleshooting

**Form not submitting?**

- Check that you added the correct API key to `config/general.ts`
- Make sure you verified your email address
- Check browser console for errors

**Not receiving emails?**

- Check your spam folder
- Verify the email address in Web3Forms dashboard
- Make sure email verification is complete

## Alternative Configuration

If you want to send to a different email than wbmbandofficial@gmail.com:

1. Log in to Web3Forms dashboard
2. Update the email address in settings
3. Verify the new email address

That's it! Your contact form is now fully functional.
