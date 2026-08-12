import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';
import dayjs from 'dayjs';
import isToday from 'dayjs/plugin/isToday';
import { TimelineGroup } from '../../../types';

dayjs.extend(isToday);

export async function GET(request: NextRequest) {
  const layout = request.nextUrl.searchParams.get('layout') || 'wall';
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
    
    if (layout === 'wall') {
      return NextResponse.json({
        flat: data,
        grouped: undefined
      }, {
        headers: {
          'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=59'
        }
      });
    }

    // Group notes by day for the Timeline view (only when layout=timeline)
    const groupedMap = new Map<string, any>();
    data.forEach(note => {
      const d = dayjs(note.createdAt);
      // Create a sorting key like "YYYY-MM-DD"
      const timeGroup = d.format('YYYY-MM-DD');
      
      if (!groupedMap.has(timeGroup)) {
        // Create a human-readable label
        let label = d.format('DD/MM/YYYY');
        if (d.isToday()) {
          label = 'Today';
        }
        
        groupedMap.set(timeGroup, {
          timeGroup,
          label,
          notes: []
        });
      }
      
      groupedMap.get(timeGroup).notes.push(note);
    });

    const grouped: TimelineGroup[] = Array.from(groupedMap.values());

    return NextResponse.json({
      flat: undefined, // Save payload size by not sending flat when timeline is requested
      grouped: grouped
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=59'
      }
    });
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
    const { content, author, color, shape } = body;

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
          shape: shape || 'rectangle',
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
