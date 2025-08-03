import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    // Admin credentials
    const ADMIN_USERNAME = 'admindan';
    const ADMIN_PASSWORD_HASH = '$2y$10$gGp5Xjy0sRUSxkau.qczAOR5r8wJLDQr2S5clZT7y7xc22JVP/h1q';

    if (username !== ADMIN_USERNAME) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
    
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate a simple token (in production, use JWT)
    const token = Buffer.from(`${username}:${Date.now()}`).toString('base64');

    const user = {
      id: 1,
      username: ADMIN_USERNAME,
      role: 'admin' as const
    };

    return NextResponse.json({
      token,
      user
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}