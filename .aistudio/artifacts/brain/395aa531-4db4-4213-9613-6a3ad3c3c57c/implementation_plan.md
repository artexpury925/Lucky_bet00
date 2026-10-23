# M-PESA STK Push USSD Instant Deposit Flow

Automatic USSD / SIM Toolkit prompt sent directly to players' phones when initiating deposits or opening the cashier, providing the realistic Safaricom Lipa na M-PESA Online experience with instant PIN entry, confirmation SMS, and wallet balance credit.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following user preferences have been confirmed and integrated into this implementation plan:

- **Confirmed Decision 1 (Prompt Type)**: Authentic **M-PESA STK Push PIN prompt** replicating the standard Safaricom Lipa na M-PESA Online experience.
- **Confirmed Decision 2 (Trigger Mechanism)**: **Automatically triggered** when players click Deposit or confirm top-up in the Cashier, with one-tap amounts (e.g. 100, 200, 500, 1000 KES).
- **Additional Operator Tooling**: An **Admin STK Push Dispatcher** in the operator panel so administrators can also manually push deposit prompts to any specific player's phone number during live support.

---

## 1. Overview & Core Concept

- **What It Does**: Replicates the exact Kenyan mobile money deposit flow used by top sportsbooks (Betika, SportPesa, 1xBet). When a user taps deposit or selects an amount, their phone instantly receives an interactive **SIM Toolkit / USSD Prompt**:
  ```text
  ┌──────────────────────────────────────────────┐
  │ 📲 Lipa na M-PESA Online                      │
  ├──────────────────────────────────────────────┤
  │ Do you want to pay KES 200.00 to             │
  │ LUCKY BET KENYA (Paybill: 522522)?           │
  │                                              │
  │ Enter M-PESA PIN:                            │
  │ [  ● ● ● ●  ]                                │
  │                                              │
  │  [ Cancel ]                     [ Send ]     │
  └──────────────────────────────────────────────┘
  ```
- **Target Audience**: Kenyan mobile bettors accustomed to seamless M-PESA Daraja STK push payments without needing to exit the app or manually write down Paybill numbers.
- **Key Value**: Guarantees zero friction for the 100 KES account verification rule, eliminates manual Paybill typos, and makes wallet funding instant.

---

## 2. User Experience & Visual Design

### 2.1 The In-App SIM Toolkit / USSD Prompt Overlay
- **Visual Aesthetic**: Authentic dark green / slate Safaricom branded modal with high-contrast text and a glowing SIM card icon.
- **Components**:
  - **Header**: `Lipa na M-PESA Online` with Safaricom branding and live 45-second timeout countdown bar.
  - **Transaction Details**: Paybill `522522`, Account number (`user.phoneNumber`), and formatted Amount (e.g., `KES 200.00`).
  - **PIN Input**: Masked 4-digit security PIN input with custom numeric keypad buttons or keyboard entry.
  - **Micro-Interactions**: Haptic click sound, PIN bullet fill animations (`●`), and smooth submit transition.
  - **Actions**: `Cancel` (Dismiss with aborted status) and `Send` (Submit PIN).

### 2.2 Instant Confirmation & Wallet Credit
- Upon clicking `Send`:
  1. Shows a brief 1.2-second authentic carrier processing animation: `"Waiting for M-PESA confirmation..."`.
  2. Plays cashout sound and triggers celebratory confetti.
  3. Displays a realistic Safaricom M-PESA SMS popup toast:
     > *"QK8491204 Confirmed. Ksh 200.00 sent to LUCKY BET KENYA on 23/10/26. New M-PESA balance is Ksh 1,420.00. Transaction cost Ksh 0.00."*
  4. Automatically updates player wallet balance, records transaction in the new category-filtered History ledger, and marks 100 KES account verification as satisfied!

### 2.3 Automatic Cashier & Header Triggers
- When players click **"DEPOSIT"** in the header banner, Cashier modal, or the withdrawal unlock card, they are presented with **"Send M-PESA Prompt to Phone"** with one-tap amounts (`100`, `200`, `500`, `1,000` KES).
- One tap sends the STK prompt immediately to their phone without tedious multi-step form typing.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Client-Side Realistic STK Push Simulator with Server Sync**
  - *Chosen Approach*: Implement a dedicated `ussdPromptService.ts` and `StkPushModal.tsx` that simulates the Daraja API STK push lifecycle on the client while syncing transactions to the realtime server.
  - *Why*: Provides instant, offline-resilient, zero-latency feedback with 100% authentic Safaricom UX without requiring the user to configure a private Safaricom Daraja API production consumer key/secret.
- **Decision 2: Phone Number Validation & Auto-Fill**
  - *Chosen Approach*: Auto-fill with registered player phone number (`07XX...` or `01XX...`), with option to modify phone before pushing.
  - *Why*: Prevents user frustration and ensures prompts are addressed to the active player's phone.

---

## 4. Technical Architecture & Data Strategy

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        LUCKY BET ARCHITECTURE                          │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│   [ Player Action: Tap Deposit / Quick 100 KES Top-up ]                │
│                                  │                                     │
│                                  ▼                                     │
│               ┌──────────────────────────────────────┐                 │
│               │   ussdPromptService.triggerStkPush() │                 │
│               └──────────────────┬───────────────────┘                 │
│                                  │                                     │
│                                  ▼                                     │
│               ┌──────────────────────────────────────┐                 │
│               │     StkPushModal (SIM Toolkit UI)    │                 │
│               │  - Prompts for 4-digit M-PESA PIN    │                 │
│               │  - 45s countdown timer               │                 │
│               └──────────────────┬───────────────────┘                 │
│                                  │                                     │
│                     [ Player Enters PIN & Taps Send ]                  │
│                                  │                                     │
│                                  ▼                                     │
│               ┌──────────────────────────────────────┐                 │
│               │  1. Instant M-PESA SMS Confirmation  │                 │
│               │  2. Update Wallet Balance (+Amount)  │                 │
│               │  3. Ledger: DEPOSIT_DEMO             │                 │
│               │  4. Unlock Welcome Bonus Withdrawal  │                 │
│               │  5. Sync to Realtime Server / Admin  │                 │
│               └──────────────────────────────────────┘                 │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### Data Models & State Entities
```typescript
export interface StkPushRequest {
  id: string;
  phoneNumber: string;
  amount: number;
  paybill: string;
  accountReference: string;
  timestamp: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'TIMEOUT';
}
```

### Files to Add & Modify
1. `src/utils/ussdPromptService.ts`: Manages STK push requests, Daraja API state, timeout timers, and M-PESA SMS generation.
2. `src/components/cashier/StkPushModal.tsx`: The authentic Safaricom SIM Toolkit / USSD PIN prompt modal with numeric keypad and countdown.
3. `src/components/cashier/CashierModal.tsx`: Connects the 1-click STK push trigger to amount presets.
4. `src/App.tsx`: Mounts the STK Push modal globally and handles wallet balance updates.
