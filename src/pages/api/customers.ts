import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Forward the user's auth token to preserve RLS policies
    const authHeader = req.headers.authorization;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: authHeader ? { Authorization: authHeader } : {},
      },
    });

    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("first_name", { ascending: true });

    if (error) {
      console.error("[API /customers] Supabase error:", error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json(data || []);
  } catch (err: any) {
    console.error("[API /customers] Error:", err);
    return res.status(500).json({ error: err.message });
  }
}
