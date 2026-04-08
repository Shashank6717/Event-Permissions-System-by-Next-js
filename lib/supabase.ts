import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";

// Create a Supabase client for use in client components
const supabase = createClientComponentClient<Database>();

export default supabase;
