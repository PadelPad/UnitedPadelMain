import Stripe from "https://esm.sh/stripe@12.18.0?target=deno";

Deno.serve(async (req) => {
  const { priceId, mode } = await req.json().catch(() => ({}));
  const key = Deno.env.get("STRIPE_SECRET_KEY")!;
  const success = (Deno.env.get("APP_URL") || "http://localhost:3000") + "/?success=true";
  const cancel = (Deno.env.get("APP_URL") || "http://localhost:3000") + "/?canceled=true";

  if (!key || !priceId) {
    return new Response(JSON.stringify({ error: "Missing STRIPE_SECRET_KEY or priceId" }), { status: 400 });
  }

  const stripe = new Stripe(key, { apiVersion: "2024-06-20" });

  const session = await stripe.checkout.sessions.create({
    mode: (mode as "subscription" | "payment") || "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: success,
    cancel_url: cancel,
  });

  return new Response(JSON.stringify({ url: session.url }), {
    headers: { "Content-Type": "application/json" }
  });
});
