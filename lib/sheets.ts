export async function syncTransactionToSheets(transaction: any) {
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  if (!webhookUrl) {
    console.log("Google Sheets Sync: No webhook URL configured.");
    return;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: transaction.id,
        date: transaction.issuedAt,
        merchant: transaction.merchant,
        name: transaction.name,
        total: transaction.total / 100, // Convert cents to units
        currency: transaction.currencyCode,
        category: transaction.categoryCode,
        project: transaction.projectCode,
        note: transaction.note,
        text: transaction.text,
      }),
    });

    if (!response.ok) {
      console.error("Google Sheets Sync Error:", await response.text());
    } else {
      console.log("Google Sheets Sync: Success for transaction", transaction.id);
    }
  } catch (error) {
    console.error("Google Sheets Sync Exception:", error);
  }
}
