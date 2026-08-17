import { NextRequest, NextResponse } from 'next/server';
import { noteService } from '../services/noteService';

export const noteController = {
  async getNotesHandler(request: NextRequest) {
    try {
      const layout = request.nextUrl.searchParams.get('layout') || 'wall';
      const result = await noteService.getNotes(layout);

      return NextResponse.json(result, {
        headers: {
          'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=59'
        }
      });
    } catch (error: any) {
      console.error('API Error fetching notes:', error);
      if (error.message === 'Supabase is not configured') {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
    }
  },

  async createNoteHandler(request: Request) {
    try {
      const body = await request.json();
      const result = await noteService.createNote(body);
      return NextResponse.json(result, { status: 201 });
    } catch (error: any) {
      console.error('API Error inserting note:', error);
      if (error.message === 'Supabase is not configured') {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      if (error.message === 'Content is required' || error.message === 'Content is invalid') {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      return NextResponse.json({ error: 'Failed to create note', details: error }, { status: 500 });
    }
  }
};
