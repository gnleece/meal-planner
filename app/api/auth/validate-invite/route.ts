import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { inviteCode } = await request.json();

    const validCode = process.env.INVITE_CODE;

    if (!validCode) {
      console.error('INVITE_CODE environment variable is not set');
      return NextResponse.json(
        { valid: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }

    if (inviteCode === validCode) {
      return NextResponse.json({ valid: true });
    }

    return NextResponse.json(
      { valid: false, error: 'Invalid invite code' },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { valid: false, error: 'Invalid request' },
      { status: 400 }
    );
  }
}
