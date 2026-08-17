import { NextRequest, NextResponse } from 'next/server';
import { shareService } from '../services/shareService';

export const shareController = {
  async createSessionHandler(request: NextRequest) {
    try {
      const { notes } = await request.json();
      const port = new URL(request.url).port || "3000";
      
      const sessionData = shareService.createSession(notes, port);
      return NextResponse.json(sessionData);
    } catch (error: any) {
      if (error.message === 'Invalid payload') {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  },

  async getSessionHandler(request: NextRequest) {
    try {
      const token = request.nextUrl.searchParams.get("token") ?? "";
      const sessionData = shareService.getSession(token);
      
      return NextResponse.json(sessionData);
    } catch (error: any) {
      if (error.message === 'Session expired or not found') {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  },

  async mergeSessionHandler(request: NextRequest) {
    try {
      const { token, notes } = await request.json();
      const sessionData = shareService.mergeSession(token, notes);
      
      return NextResponse.json(sessionData);
    } catch (error: any) {
      if (error.message === 'Session expired or not found') {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  }
};
