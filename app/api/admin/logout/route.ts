import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });
  // Define o cookie com data de expiração no passado para removê-lo
  response.cookies.set('admin-token', '', { expires: new Date(0), path: '/' });
  return response;
}