import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function GET() {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 500 });
  }

  try {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .order('createdAt', { ascending: false })
      .limit(200);

    if (error) throw error;
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('API Error fetching notes:', error);
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { content, author, color } = body;

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // Ensure text-only and max 150 characters
    let cleanContent = content.trim().replace(/<[^>]*>?/gm, ''); // Strip HTML tags
    if (cleanContent.length > 150) {
      cleanContent = cleanContent.substring(0, 150);
    }
    if (!cleanContent) {
      return NextResponse.json({ error: 'Content is invalid' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('notes')
      .insert([
        {
          content: cleanContent,
          author: author?.trim() || 'Anonymous',
          color: color,
        }
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('API Error inserting note:', error);
    return NextResponse.json({ error: 'Failed to create note', details: error }, { status: 500 });
  }
}
