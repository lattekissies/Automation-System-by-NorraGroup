import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabase } from "@/lib/supabase";
import { Resend } from "resend";

// Function to validate Lynk.id webhook signature
function validateLynkSignature(
  refId: string,
  amount: string,
  messageId: string,
  receivedSignature: string,
  secretKey: string
) {
  const signatureString = amount + refId + messageId + secretKey;
  const calculatedSignature = crypto
    .createHash("sha256")
    .update(signatureString)
    .digest("hex");
    
  return calculatedSignature === receivedSignature;
}

export async function POST(req: Request) {
  try {
    // Read the signature from headers
    const signature = req.headers.get("X-Lynk-Signature") || req.headers.get("x-lynk-signature");
    if (!signature) {
      return NextResponse.json({ error: "Missing X-Lynk-Signature header" }, { status: 401 });
    }

    const payload = await req.json();

    // Verify it's the correct event
    if (payload.event !== "payment.received") {
      return NextResponse.json({ message: "Ignored event type" }, { status: 200 });
    }

    const eventData = payload.data;
    if (!eventData || eventData.message_action !== "SUCCESS") {
      return NextResponse.json({ message: "Ignored incomplete or failed transaction" }, { status: 200 });
    }

    const { message_id, message_data } = eventData;
    const { refId, totals, customer, items, voucherCode, createdAt } = message_data;

    // Validate Signature
    const lynkSecretKey = process.env.LYNK_SECRET_KEY;
    if (!lynkSecretKey) {
      console.error("LYNK_SECRET_KEY is not configured in environment variables.");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    // Amount must be a string for validation, matching exactly what the webhook expects
    const amountStr = String(totals.grandTotal);
    
    const isValid = validateLynkSignature(
      refId,
      amountStr,
      message_id,
      signature,
      lynkSecretKey
    );

    if (!isValid) {
      console.error(`Invalid webhook signature for refId: ${refId}`);
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Extract item details
    const primaryItem = items?.[0] || {};
    const itemTitle = primaryItem.title || "Unknown Product";

    // 1. Idempotency Check: Verify if this payment was already processed
    const { data: existingPayment } = await supabase
      .from("lynk_payments")
      .select("message_id")
      .eq("message_id", message_id)
      .single();

    if (existingPayment) {
      console.log(`Payment ${message_id} already processed. Ignoring.`);
      return NextResponse.json({ message: "Already processed" }, { status: 200 });
    }

    // 2. Check if the purchased product qualifies for automatic code delivery
    const validActivationProducts = [
      "NorraClip Activation Code | Life Time Access (Windows)",
      "NorraClip Activation Code | Life Time Access (MacOS Silicon)",
      "NorraClip Activation Code | Life Time Access (MacOS Intel)"
    ];

    const isActivationCodeProduct = validActivationProducts.includes(itemTitle);

    if (isActivationCodeProduct) {
      // 3. Fetch an unused activation code
      const { data: codeData, error: codeError } = await supabase
        .from("activation_codes")
        .select("*")
        .eq("status", "unused")
        .order("created_at", { ascending: true })
        .limit(1)
        .single();

      if (codeError || !codeData) {
        console.error("Critical: No unused codes available in the database!");
        return NextResponse.json({ error: "Out of stock - No codes available" }, { status: 500 });
      }

      // 4. Update the code to mark it as used by this customer
      const { error: updateError } = await supabase
        .from("activation_codes")
        .update({
          status: "used",
          owner_email: customer.email,
          used_by: customer.name || "Customer",
          used_at: new Date().toISOString()
        })
        .eq("code", codeData.code);

      if (updateError) {
        console.error("Failed to update activation code status:", updateError);
        return NextResponse.json({ error: "Failed to assign activation code" }, { status: 500 });
      }

      // 5. Send the email via Resend
      const resend = new Resend(process.env.RESEND_API_KEY);
      const { error: emailError } = await resend.emails.send({
        from: "NorraClip <norragroup@norraclip.com>",
        to: [customer.email],
        subject: "Kode Aktivasi NorraClip Pro Anda",
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px 20px; color: #1e1030; background-color: #ffffff;">
            
            <!-- Logo / Header -->
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #3b82f6; font-size: 28px; margin: 0; letter-spacing: -0.5px;">NorraClip Pro</h1>
              <p style="color: #64748b; font-size: 14px; margin-top: 5px;">Your AI-Powered Assistant</p>
            </div>

            <p style="font-size: 16px; line-height: 1.5;">Halo <strong>${customer.name || "Kak"}</strong>,</p>
            <p style="font-size: 16px; line-height: 1.5;">Terima kasih telah melakukan pembelian kode aktivasi NorraClip Pro. Berikut adalah kode eksklusif Anda:</p>
            
            <!-- Code Box -->
            <div style="padding: 24px; background: #eff6ff; border: 1px solid rgba(59,130,246,0.3); border-radius: 12px; font-family: 'Courier New', Courier, monospace; font-size: 24px; font-weight: bold; letter-spacing: 4px; margin: 30px 0; text-align: center; color: #2563eb; box-shadow: 0 4px 20px -8px rgba(59,130,246,0.15);">
              ${codeData.code.toUpperCase()}
            </div>
            
            <!-- Community & Support -->
            <h3 style="color: #1e1030; font-size: 18px; margin-top: 35px;">Bergabung dengan Komunitas Kami</h3>
            <p style="font-size: 15px; line-height: 1.6; color: #334155;">
              Dapatkan update terbaru, tips penggunaan, dan bantuan langsung dari tim kami serta pengguna lain di grup resmi Telegram NorraClip:
            </p>
            <div style="text-align: center; margin: 25px 0;">
              <a href="https://t.me/+gB3UC0TLNAc3ZjM1" style="background-color: #3b82f6; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px; display: inline-block;">Masuk Grup Telegram</a>
            </div>

            <p style="font-size: 15px; line-height: 1.6; color: #334155;">
              Jika Anda mengalami kendala saat aktivasi, silakan hubungi kami di <a href="mailto:norragroup@norraclip.com" style="color: #3b82f6; text-decoration: none; font-weight: 500;">norragroup@norraclip.com</a> atau cukup <strong>balas email ini</strong> agar kami dapat segera membantu Anda.
            </p>

            <!-- Affiliate -->
            <div style="background-color: #f8fafc; border-left: 4px solid #60a5fa; padding: 16px 20px; margin: 30px 0; border-radius: 0 8px 8px 0;">
              <h4 style="margin: 0 0 8px 0; color: #1e1030; font-size: 15px;">🤝 Program Afiliasi</h4>
              <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #475569;">
                Dapatkan komisi hingga <strong>30%</strong> dengan menjadi affiliator NorraClip. Tertarik? Cukup balas email ini dan tim kami akan memberikan detailnya.
              </p>
            </div>

            <!-- Notes -->
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
            <h4 style="margin: 0 0 10px 0; color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Catatan Penting:</h4>
            <ul style="font-size: 13px; line-height: 1.6; color: #64748b; padding-left: 20px; margin: 0;">
              <li style="margin-bottom: 6px;">Pembelian ini bersifat <em>non-refundable</em> (tidak dapat dikembalikan).</li>
              <li style="margin-bottom: 6px;">Aplikasi saat ini masih dalam tahap <em>Early Access</em>, kami memohon maaf apabila Anda menemukan <em>bug</em> dalam penggunaan.</li>
              <li>Untuk diskusi teknis dan pelaporan <em>bug</em>, silakan manfaatkan grup Telegram di atas.</li>
            </ul>

            <!-- Footer -->
            <div style="margin-top: 40px; padding-top: 20px; text-align: left;">
              <p style="font-size: 15px; color: #334155; margin-bottom: 5px;">Terima kasih atas dukungan Anda,</p>
              <p style="font-size: 16px; font-weight: bold; color: #1e1030; margin: 0;">Edwin & Naurra</p>
            </div>
            
          </div>
        `,
      });

      if (emailError) {
        console.error("Failed to send email via Resend:", emailError);
      }
    } else {
      console.log(`Product purchased "${itemTitle}" is not an activation code. Skipping email sending.`);
    }

    // 6. Insert into Supabase lynk_payments table (Always log the revenue)
    const { error: dbError } = await supabase.from("lynk_payments").insert([
      {
        message_id: message_id,
        ref_id: refId,
        customer_name: customer.name || "Unknown",
        customer_email: customer.email || "Unknown",
        customer_phone: customer.phone || null,
        grand_total: totals.grandTotal || 0,
        total_price: totals.totalPrice || 0,
        convenience_fee: totals.convenienceFee || 0,
        discount: totals.discount || 0,
        voucher_code: voucherCode === "" || voucherCode === "unlimited" ? null : voucherCode,
        event: itemTitle,
        created_at: new Date().toISOString() // Use current time or createdAt from payload
      }
    ]);

    if (dbError) {
      console.error("Supabase Insertion Error:", dbError);
      // Note: we still return 200 below if DB fails to insert payment, 
      // because we already assigned the code and (tried to) send the email.
    }

    const responseMsg = isActivationCodeProduct 
      ? "Payment processed, code assigned, and email sent." 
      : "Payment processed, no code required.";

    return NextResponse.json({ success: true, message: responseMsg }, { status: 200 });

  } catch (error: any) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
