import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
    role: "admin" | "user" | "viewer";
  };
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<LoginResponse>> {
  try {
    const body: LoginRequest = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password required" },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    // Query users table
    const { data: users, error: queryError } = await supabase
      .from("users")
      .select("id, email, name, role, password")
      .eq("email", email)
      .single();

    if (queryError || !users) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Check password (in production, use proper hashing like bcrypt)
    if (users.password !== password) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          id: users.id,
          email: users.email,
          name: users.name,
          role: users.role,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}
