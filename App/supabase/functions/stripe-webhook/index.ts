import Stripe from "https://esm.sh/stripe@12.18.0?target=deno";

Deno.serve(async (req) => {
  const key = Deno.env.get("STRIPE_SECRET_KEY")!;
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;
  const stripe = new Stripe(key, { apiVersion: "2024-06-20" });

  const sig = req.headers.get("stripe-signature");
  const body = await req.text();

  try {
    const event = stripe.webhooks.constructEvent(body, sig!, webhookSecret);
    console.log("Stripe event received:", event.type);
  } catch (err) {
    return new Response(`Webhook Error: ${err}`, { status: 400 });
  }

  return new Response("ok", { status: 200 });
});
