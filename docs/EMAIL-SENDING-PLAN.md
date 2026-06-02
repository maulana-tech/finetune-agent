# 📧 Email Sending Implementation Plan

## 📊 **CURRENT STATE - What We Have:**

### ✅ **Already Implemented:**

#### 1. **Email Scraping** (DONE)
```
✅ Scrape emails from business websites
✅ Save to leads.emails (JSONB array)
✅ Filter junk emails
✅ 7 contact pages checked
```

#### 2. **AI Email Generation** (DONE)
```
✅ API: POST /leads/:id/email
✅ UI: GenerateEmailModal.tsx
✅ AI generates personalized cold email
✅ Uses lead data + workspace context
✅ Uses AI insights if available
```

#### 3. **Current User Flow:**
```
User clicks "Generate Outreach Draft"
    ↓
Modal opens
    ↓
Click "Generate Email"
    ↓
AI generates subject + body
    ↓
User clicks "Copy to Clipboard"  ← MANUAL STEP
    ↓
User opens Gmail/Outlook
    ↓
User pastes & sends manually
```

### ❌ **What's Missing:**

```
❌ Direct email sending from app
❌ Email delivery tracking (sent/delivered/opened/clicked)
❌ Send history per lead
❌ Batch sending (multiple leads at once)
❌ Email templates
❌ Schedule sending
❌ Follow-up sequences
❌ Reply detection
❌ Analytics dashboard
```

---

## 🎯 **IMPLEMENTATION PLAN:**

### **Phase 1: Basic Email Sending (Week 1)** ⭐ MVP

**Goal:** Replace "Copy to Clipboard" dengan "Send Email" button

#### **Backend Changes:**

**1.1 Install Resend SDK**
```bash
cd apps/api
pnpm add resend
```

**1.2 Create Email Outreach Table**
```sql
-- packages/db/src/schema/email_outreach.ts
CREATE TABLE email_outreach (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  lead_id UUID NOT NULL REFERENCES leads(id),
  
  -- Email details
  from_email TEXT NOT NULL,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  
  -- Delivery tracking
  status TEXT NOT NULL DEFAULT 'draft', 
    -- draft, queued, sent, delivered, bounced, failed
  
  -- Engagement tracking (from Resend webhooks)
  opened_at TIMESTAMP,
  clicked_at TIMESTAMP,
  replied_at TIMESTAMP,
  
  -- Metadata
  resend_email_id TEXT, -- For webhook matching
  error_message TEXT,
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMP
);

CREATE INDEX idx_email_outreach_lead ON email_outreach(lead_id);
CREATE INDEX idx_email_outreach_workspace ON email_outreach(workspace_id);
CREATE INDEX idx_email_outreach_status ON email_outreach(status);
```

**1.3 Create Email Service**
```typescript
// apps/api/src/email/email.service.ts
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private resend = new Resend(process.env.RESEND_API_KEY);

  async sendEmail(params: {
    leadId: string;
    workspaceId: string;
    toEmail: string;
    fromEmail: string;
    subject: string;
    body: string;
  }) {
    // 1. Save to database (status: queued)
    const [outreach] = await db
      .insert(emailOutreach)
      .values({
        workspaceId: params.workspaceId,
        leadId: params.leadId,
        fromEmail: params.fromEmail,
        toEmail: params.toEmail,
        subject: params.subject,
        body: params.body,
        status: 'queued',
      })
      .returning();

    try {
      // 2. Send via Resend
      const { data, error } = await this.resend.emails.send({
        from: params.fromEmail,
        to: params.toEmail,
        subject: params.subject,
        html: params.body,
        tags: [
          { name: 'workspace_id', value: params.workspaceId },
          { name: 'lead_id', value: params.leadId },
        ],
      });

      if (error) throw error;

      // 3. Update status (sent)
      await db
        .update(emailOutreach)
        .set({
          status: 'sent',
          sentAt: new Date(),
          resendEmailId: data.id,
        })
        .where(eq(emailOutreach.id, outreach.id));

      return { success: true, emailId: outreach.id };
    } catch (err) {
      // 4. Mark as failed
      await db
        .update(emailOutreach)
        .set({
          status: 'failed',
          errorMessage: err.message,
        })
        .where(eq(emailOutreach.id, outreach.id));

      throw err;
    }
  }
}
```

**1.4 Add API Endpoint**
```typescript
// apps/api/src/leads/leads.controller.ts

@Post(':id/send-email')
async sendEmail(
  @Param('id') id: string,
  @Query('workspaceId') workspaceId: string,
  @Body() body: {
    toEmail: string;
    subject: string;
    body: string;
  },
) {
  return this.emailService.sendEmail({
    leadId: id,
    workspaceId,
    toEmail: body.toEmail,
    fromEmail: process.env.RESEND_FROM_EMAIL!,
    subject: body.subject,
    body: body.body,
  });
}
```

#### **Frontend Changes:**

**1.5 Update GenerateEmailModal.tsx**
```typescript
// Add send email function
const sendEmail = async () => {
  if (!email) return;
  
  setSending(true);
  try {
    const res = await fetch(
      `${apiUrl()}/leads/${leadId}/send-email?workspaceId=${workspaceId}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toEmail: leadEmail, // from lead.emails[0]
          subject: email.subject,
          body: email.body,
        }),
      }
    );
    
    if (!res.ok) throw new Error('Failed to send');
    
    toast.success('Email sent successfully!');
    onClose();
  } catch (err) {
    toast.error('Failed to send email');
  } finally {
    setSending(false);
  }
};

// Update button UI
<div className="flex gap-2">
  <button onClick={sendEmail} disabled={sending}>
    {sending ? 'Sending...' : 'Send Email'}
  </button>
  <button onClick={copyToClipboard}>
    Copy to Clipboard
  </button>
</div>
```

**1.6 Add Email History Section**
```typescript
// Show sent emails in lead detail
<section>
  <h3>Email History</h3>
  {emailHistory.map(email => (
    <div key={email.id}>
      <div>Subject: {email.subject}</div>
      <div>Status: {email.status}</div>
      <div>Sent: {email.sentAt}</div>
      {email.openedAt && <div>✅ Opened</div>}
      {email.clickedAt && <div>✅ Clicked</div>}
    </div>
  ))}
</section>
```

**Deliverables Phase 1:**
- ✅ Send email directly from app
- ✅ Track sent status in database
- ✅ Show email history per lead
- ✅ Error handling & retry

**Estimate:** 3-4 days

---

### **Phase 2: Email Tracking & Webhooks (Week 2)**

**Goal:** Track opens, clicks, bounces via Resend webhooks

**2.1 Webhook Endpoint**
```typescript
// apps/api/src/email/webhooks.controller.ts

@Post('webhooks/resend')
async handleWebhook(@Body() payload: any) {
  const { type, data } = payload;

  switch (type) {
    case 'email.sent':
      await this.updateEmailStatus(data.email_id, 'sent');
      break;
    
    case 'email.delivered':
      await this.updateEmailStatus(data.email_id, 'delivered');
      break;
    
    case 'email.opened':
      await this.markEmailOpened(data.email_id);
      // Update lead pipeline stage to "Engaged"
      break;
    
    case 'email.clicked':
      await this.markEmailClicked(data.email_id);
      break;
    
    case 'email.bounced':
      await this.updateEmailStatus(data.email_id, 'bounced');
      break;
  }
}
```

**2.2 Auto Pipeline Update**
```typescript
// When email opened → move lead to "Engaged"
if (type === 'email.opened') {
  await db
    .update(leads)
    .set({ pipelineStage: 'Engaged' })
    .where(eq(leads.id, email.leadId));
}
```

**2.3 UI Indicators**
```typescript
// Show engagement in lead card
<LeadCard>
  {lead.lastEmail?.openedAt && (
    <Badge>👁️ Opened {formatDistance(lead.lastEmail.openedAt)}</Badge>
  )}
</LeadCard>
```

**Deliverables Phase 2:**
- ✅ Real-time delivery tracking
- ✅ Open & click tracking
- ✅ Auto pipeline stage updates
- ✅ Engagement indicators in UI

**Estimate:** 2-3 days

---

### **Phase 3: Batch Sending & Templates (Week 3)**

**Goal:** Send to multiple leads at once with templates

**3.1 Batch Send Endpoint**
```typescript
@Post('leads/batch-send-email')
async batchSend(@Body() body: {
  leadIds: string[];
  templateId?: string;
  subject: string;
  body: string;
}) {
  // Queue all emails
  for (const leadId of body.leadIds) {
    await this.emailService.sendEmail({...});
  }
}
```

**3.2 Email Templates Table**
```sql
CREATE TABLE email_templates (
  id UUID PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  variables JSON, -- ["company_name", "industry"]
  created_at TIMESTAMP DEFAULT NOW()
);
```

**3.3 Template UI**
```typescript
<TemplateSelector>
  <option>Cold Outreach - Coffee Shop</option>
  <option>Follow-up - No Response</option>
  <option>Follow-up - Opened But No Reply</option>
</TemplateSelector>
```

**Deliverables Phase 3:**
- ✅ Batch email sending
- ✅ Email templates
- ✅ Template variables
- ✅ Template management UI

**Estimate:** 3-4 days

---

### **Phase 4: Scheduling & Sequences (Week 4)**

**Goal:** Schedule emails and auto follow-ups

**4.1 Schedule Sending**
```typescript
await emailService.sendEmail({
  ...
  scheduledFor: new Date('2024-06-10T10:00:00Z'),
});

// Cron job checks every minute
setInterval(async () => {
  const dueEmails = await getDueScheduledEmails();
  for (const email of dueEmails) {
    await sendNow(email);
  }
}, 60000);
```

**4.2 Email Sequences**
```sql
CREATE TABLE email_sequences (
  id UUID PRIMARY KEY,
  workspace_id UUID,
  name TEXT,
  steps JSON -- [
    { day: 0, template_id: '...' },
    { day: 3, template_id: '...', condition: 'not_opened' },
    { day: 7, template_id: '...', condition: 'opened_no_reply' }
  ]
);
```

**Deliverables Phase 4:**
- ✅ Schedule email sending
- ✅ Email sequences (drip campaigns)
- ✅ Conditional follow-ups
- ✅ Sequence analytics

**Estimate:** 4-5 days

---

## 📋 **CHECKLIST - Phase 1 (MVP):**

### **Backend:**
- [ ] Install Resend SDK
- [ ] Create `email_outreach` table schema
- [ ] Generate & run migration
- [ ] Create `EmailService` with `sendEmail()` method
- [ ] Add `POST /leads/:id/send-email` endpoint
- [ ] Add `GET /leads/:id/emails` (history)
- [ ] Add error handling & retry logic
- [ ] Add environment variables (RESEND_API_KEY, RESEND_FROM_EMAIL)

### **Frontend:**
- [ ] Update `GenerateEmailModal.tsx` with "Send Email" button
- [ ] Add loading/success/error states
- [ ] Add email validation (check if lead has email)
- [ ] Create `EmailHistorySection` component
- [ ] Add toast notifications
- [ ] Show engagement indicators in lead cards

### **Infrastructure:**
- [ ] Get Resend API key (free tier)
- [ ] Verify domain in Resend
- [ ] Add DNS records (SPF, DKIM)
- [ ] Test email deliverability
- [ ] Set up webhook endpoint
- [ ] Configure Resend webhook URL

---

## 🎨 **UI MOCKUP - Updated Flow:**

### **Before (Current):**
```
┌────────────────────────────────┐
│ Generate Outreach Draft        │
├────────────────────────────────┤
│ Subject: Hey coffee shop...    │
│ Body: I noticed your...        │
├────────────────────────────────┤
│ [ Copy to Clipboard ]          │
│ [ Regenerate ]                 │
└────────────────────────────────┘
```

### **After (Phase 1):**
```
┌────────────────────────────────┐
│ Generate Outreach Draft        │
├────────────────────────────────┤
│ To: hello@coffeeshop.com ✓     │
│ Subject: Hey coffee shop...    │
│ Body: I noticed your...        │
├────────────────────────────────┤
│ [ Send Email ] ⭐ NEW!          │
│ [ Copy to Clipboard ]          │
│ [ Regenerate ]                 │
└────────────────────────────────┘

┌────────────────────────────────┐
│ Email History                  │
├────────────────────────────────┤
│ ✅ Sent 2h ago                 │
│    "Hey coffee shop owner"     │
│    Status: Delivered           │
│    👁️ Opened 1h ago            │
└────────────────────────────────┘
```

---

## 💰 **COST ESTIMATION:**

### **Resend Free Tier:**
- 3,000 emails/month
- All features included
- Webhook support
- $0/month

### **When to Upgrade:**
- Pro: $20/month → 50,000 emails
- Business: $250/month → 1M emails

---

## 📊 **SUCCESS METRICS:**

### **Phase 1 (MVP):**
- [ ] 90%+ email delivery rate
- [ ] <1s send latency
- [ ] Email history visible in UI
- [ ] Zero email sending errors

### **Phase 2 (Tracking):**
- [ ] Track open rate (industry avg: 20-25%)
- [ ] Track click rate (industry avg: 2-5%)
- [ ] Auto pipeline updates working
- [ ] Webhook <5s latency

### **Phase 3 (Batch & Templates):**
- [ ] Send to 10+ leads at once
- [ ] 3+ email templates created
- [ ] Template variables working

### **Phase 4 (Sequences):**
- [ ] Auto follow-up working
- [ ] Sequence completion rate >80%
- [ ] Reply detection working

---

## 🚀 **QUICK START - MVP Implementation:**

### **Day 1-2: Backend**
1. Install Resend: `pnpm add resend`
2. Create schema: `email_outreach.ts`
3. Run migration: `pnpm db:generate && pnpm db:migrate`
4. Create `EmailService`
5. Add API endpoint

### **Day 3: Frontend**
1. Update `GenerateEmailModal.tsx`
2. Add "Send Email" button
3. Add email history section
4. Test end-to-end

### **Day 4: Testing & Polish**
1. Domain verification in Resend
2. Test deliverability
3. Error handling
4. UI polish
5. Deploy to staging

---

## ✅ **FINAL DELIVERABLES:**

**Week 1 (MVP):**
- ✅ Send email directly from app
- ✅ Email tracking in database
- ✅ Email history per lead
- ✅ Error handling

**Week 2:**
- ✅ Open/click tracking via webhooks
- ✅ Auto pipeline updates
- ✅ Engagement indicators

**Week 3:**
- ✅ Batch sending
- ✅ Email templates
- ✅ Template management

**Week 4:**
- ✅ Scheduled sending
- ✅ Email sequences
- ✅ Conditional follow-ups

---

## 🎯 **RECOMMENDATION:**

**Start with Phase 1 (MVP) - 3-4 days of work:**

1. Replace clipboard copy with actual email sending
2. Track sent emails in database
3. Show email history
4. Basic error handling

**This gives immediate value:**
- ✅ No more manual copy-paste
- ✅ All emails tracked
- ✅ Professional sending (not from personal email)
- ✅ Better deliverability

**Then iterate to Phase 2-4 based on user feedback.**

---

**Want me to start implementing Phase 1 (MVP) now?** 🚀
