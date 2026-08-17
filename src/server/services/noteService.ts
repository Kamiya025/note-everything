import { supabase } from '../../lib/supabase';
import dayjs from 'dayjs';
import isToday from 'dayjs/plugin/isToday';
import { TimelineGroup } from '../../types';

dayjs.extend(isToday);

export const noteService = {
  async getNotes(layout: string) {
    if (!supabase) {
      throw new Error('Supabase is not configured');
    }

    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .order('createdAt', { ascending: false })
      .limit(200);

    if (error) throw error;
    
    if (layout === 'wall') {
      return { flat: data, grouped: undefined };
    }

    // Group notes by day for the Timeline view
    const groupedMap = new Map<string, any>();
    data.forEach(note => {
      const d = dayjs(note.createdAt);
      const timeGroup = d.format('YYYY-MM-DD');
      
      if (!groupedMap.has(timeGroup)) {
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

    return { flat: undefined, grouped };
  },

  async createNote(body: any) {
    if (!supabase) {
      throw new Error('Supabase is not configured');
    }

    const { content, author, color, shape } = body;

    if (!content) {
      throw new Error('Content is required');
    }

    // Ensure text-only and max 150 characters
    let cleanContent = content.trim().replace(/<[^>]*>?/gm, ''); // Strip HTML tags
    if (cleanContent.length > 150) {
      cleanContent = cleanContent.substring(0, 150);
    }
    if (!cleanContent) {
      throw new Error('Content is invalid');
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

    return data;
  }
};
