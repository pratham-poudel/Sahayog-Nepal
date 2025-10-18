# Campaign Verification Email - Quick Reference

## What It Does
Automatically sends a professional, government-style email to campaign creators when their campaign is verified and goes live.

## Email Details

### Sender
- **Address:** `noreply@sahayognepal.org`
- **Name:** "Sahayog Nepal - Campaign Verification Team"

### Subject
```
🎉 Campaign Approved: "{Campaign Title}" is Now Live
```

### Campaign Link
```
http://localhost:5173/campaign/{campaignId}  (Development)
https://sahayognepal.com/campaign/{campaignId}  (Production)
```

## Files Modified/Created

### Created
- ✅ `backend/utils/sendCampaignVerificationEmail.js` - Email utility function

### Modified
- ✅ `backend/routes/employeeRoutes.js` - Added email sending to verify endpoint

## How It Works

### 1. Employee Verifies Campaign
```http
POST /api/employee/campaigns/{campaignId}/verify

Body:
{
  "tags": ["Urgent", "Medical"],
  "verificationNotes": "Campaign successfully verified",
  "featured": true
}
```

### 2. Email Automatically Sent
- Fetches campaign creator details
- Generates campaign URL
- Sends HTML email
- Logs success/failure

### 3. Email Not Received?
**Check:**
1. Spam/junk folder
2. User email in database
3. `ZEPTO_TOKEN_WELCOME` in `.env`
4. Console logs for errors

## Email Content Sections

### ✅ Header
- Sahayog Nepal logo
- Green success gradient
- Verification badge
- "Campaign Verified & Live" status

### ✅ Main Content
- Personalized greeting
- Campaign title with active badge
- Official verification notes (if provided)

### ✅ Next Steps (5 steps)
1. Campaign visibility
2. Social media sharing
3. Dashboard monitoring
4. Update posting
5. Withdrawal process

### ✅ Guidelines (5 warnings)
- Transparency mandatory
- Documentation required
- Honest communication
- Compliance obligation
- Response time requirements

### ✅ Call-to-Action
Large button: "VIEW YOUR LIVE CAMPAIGN"

### ✅ Footer
- Government registration info
- Campaign ID
- Verification date
- Support contacts

## Anti-Abuse Protection

### Throttling
- **Cooldown:** 6 hours per campaign
- **Storage:** Redis key `campaign-verification-email-freq:{campaignId}`
- **Behavior:** Silent skip with log warning

## Error Handling

### Email Failure
- ✅ Logged but doesn't block verification
- ✅ Campaign still becomes active
- ✅ Console error message shown

### Missing Data
- ✅ Graceful degradation
- ✅ Skips email send
- ✅ Logs reason

## Environment Variables

### Required
```env
ZEPTO_TOKEN_WELCOME=your_zeptomail_token_here
FRONTEND_URL=http://localhost:5173  # Or production URL
```

## Console Logs

### Success
```
[CAMPAIGN VERIFIED] ID: xxx by Employee: CV-0001 - Verification email sent to user@example.com
[CAMPAIGN VERIFICATION EMAIL SENT] Campaign: xxx, Title: Campaign Title, Email: user@example.com
```

### Throttled
```
[CAMPAIGN VERIFICATION EMAIL THROTTLED] Campaign: xxx, Email: user@example.com, Last sent: 120m ago
```

### Error
```
[CAMPAIGN VERIFICATION EMAIL ERROR] Campaign: xxx, Email: user@example.com, Error: {message}
Email send failed but campaign verification will proceed
```

## Testing Checklist

- [ ] Email sends when campaign verified
- [ ] Campaign URL is correct
- [ ] Verification notes show up
- [ ] Email received in inbox (not spam)
- [ ] All links work
- [ ] Logo image loads
- [ ] Mobile-responsive design
- [ ] Throttling works (can't send twice within 6h)

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Email not received | Check spam, verify email in DB, check token |
| Wrong URL | Set `FRONTEND_URL` environment variable |
| Email throttled | Wait 6 hours or clear Redis key |
| No verification notes | Pass `verificationNotes` in request body |
| Template broken | Check ZeptoMail logs for errors |

## Support Contacts (In Email)

- **Campaign Support:** campaigns@sahayognepal.org
- **Technical Support:** support@sahayognepal.org
- **Emergency:** +977-XXXX-XXXXXX

---

**Status:** ✅ Production Ready
**Last Updated:** October 18, 2025
