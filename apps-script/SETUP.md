# Setting up the feedback Sheet

About 10 minutes, once. You need a Google account.

## 1. Create the Sheet

1. Go to [sheets.new](https://sheets.new) and name it **Bearing feedback**.
2. Open **Extensions → Apps Script**.

## 2. Add the script

1. Delete what's in the editor and paste in the whole of `Code.gs`.
2. Click **Save** (the disk icon).
3. In the function dropdown at the top, choose **setup** and click **Run**.
4. Google asks for permission. Choose your account, then **Advanced → Go to (unsafe)** → **Allow**. The warning appears because it's your own unpublished script; it only gets access to this one spreadsheet.
5. Back in the Sheet, there's now a **Responses** tab with headers and a **Summary** tab.

## 3. Deploy it as a web app

1. In Apps Script, click **Deploy → New deployment**.
2. Click the gear next to "Select type" and choose **Web app**.
3. Set **Execute as: Me** and **Who has access: Anyone**. "Anyone" lets the app send to it without people signing in; it can only add rows, not read them.
4. Click **Deploy** and copy the **Web app URL**. It looks like `https://script.google.com/macros/s/…/exec`.
5. Paste that URL into a browser tab. You should see "Bearing feedback receiver is running."

## 4. Connect the app

Open `config.js` in the app folder and paste the URL between the quotes:

```js
window.BEARING_FEEDBACK_URL = 'https://script.google.com/macros/s/…/exec';
```

Push the change to GitHub. The feedback card appears on the results page once that URL is set. It stays hidden on the claude.ai preview, which can't send data out.

## Day to day

- **Responses** has one row per submission. The `answers_json` column holds the full anonymous answers for deeper analysis later.
- **Summary** shows how often the direction lands ("hit rate"), overall and by direction.
- **Deleting a submission:** in Apps Script, open `deleteSubmission`, paste the person's ID where it says, and Run.
- **Changing the script:** after editing, use **Deploy → Manage deployments → Edit → Version: New version**. That keeps the same URL, so the app doesn't need updating.
