import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderNotificationRequest {
  orderId: string;
  customerEmail: string;
  customerName: string;
  status: 'accepted' | 'rejected';
  items: Array<{ product: { title: string; price: number }; quantity: number }>;
  total: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId, customerEmail, customerName, status, items, total }: OrderNotificationRequest = await req.json();

    console.log(`Sending ${status} notification for order ${orderId} to ${customerEmail}`);

    const statusColor = status === 'accepted' ? '#22c55e' : '#ef4444';
    const statusText = status === 'accepted' ? 'Accepted' : 'Rejected';
    const statusMessage = status === 'accepted' 
      ? 'Great news! Your order has been accepted and will be shipped soon.'
      : 'We regret to inform you that your order has been rejected. Please contact us for more details.';

    const itemsHtml = items.map(item => 
      `<tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.product.title}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">Rs. ${(item.product.price * item.quantity).toFixed(2)}</td>
      </tr>`
    ).join('');

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #E41B17; }
          .logo { color: #E41B17; font-size: 28px; font-weight: bold; }
          .status-badge { display: inline-block; padding: 10px 20px; border-radius: 8px; color: white; font-weight: bold; font-size: 16px; background-color: ${statusColor}; }
          .order-details { background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .items-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          .items-table th { background: #E41B17; color: white; padding: 10px; text-align: left; }
          .total-row { font-weight: bold; font-size: 18px; }
          .footer { text-align: center; padding: 20px; color: #888; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">ZoomZone.Cars</div>
            <p style="color: #888; margin: 5px 0;">Your Destination for Die-Cast Treasures</p>
          </div>
          
          <div style="text-align: center; padding: 30px 0;">
            <span class="status-badge">Order ${statusText}</span>
          </div>
          
          <p>Dear ${customerName},</p>
          <p>${statusMessage}</p>
          
          <div class="order-details">
            <h3 style="margin-top: 0;">Order Details</h3>
            <p><strong>Order ID:</strong> #${orderId.slice(0, 8).toUpperCase()}</p>
            
            <table class="items-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th style="text-align: center;">Qty</th>
                  <th style="text-align: right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
                <tr class="total-row">
                  <td colspan="2" style="padding: 12px 8px; text-align: right;">Total:</td>
                  <td style="padding: 12px 8px; text-align: right; color: #E41B17;">Rs. ${total.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <p>If you have any questions, please don't hesitate to contact us.</p>
          <p>Thank you for shopping with ZoomZone.Cars!</p>
          
          <div class="footer">
            <p>ZoomZone.Cars | Your Destination for Die-Cast Treasures</p>
            <p>Contact: contact@zoomzone.cars</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "ZoomZone.Cars <onboarding@resend.dev>",
        to: [customerEmail],
        subject: `Order ${statusText} - ZoomZone.Cars #${orderId.slice(0, 8).toUpperCase()}`,
        html: emailHtml,
      }),
    });

    const data = await res.json();
    console.log("Resend API response:", data);

    if (!res.ok) {
      // Log error but don't throw - return success so order acceptance works
      console.error("Resend API error:", data.message);
      return new Response(
        JSON.stringify({ success: true, emailSent: false, error: data.message }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    return new Response(JSON.stringify({ success: true, emailSent: true, data }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-order-notification function:", error);
    // Return 200 with error info so order acceptance still works
    return new Response(
      JSON.stringify({ success: true, emailSent: false, error: error.message }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
