import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function GET() {
  if (!supabase) {
    return NextResponse.json({ count: 0 });
  }

  try {
    const { data, error } = await supabase
      .from('visitors')
      .select('count')
      .eq('id', 1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return NextResponse.json({ count: data?.count ?? 0 });
  } catch (error) {
    console.error('Error fetching visitor count:', error);
    return NextResponse.json({ count: 0 });
  }
}

export async function POST() {
  if (!supabase) {
    return NextResponse.json({ count: 0 });
  }

  try {
    // Upsert: increment count or create row with count=1
    const { data, error } = await supabase.rpc('increment_visitors');

    if (error) throw error;

    return NextResponse.json({ count: data ?? 0 });
  } catch (error) {
    console.error('Error incrementing visitor count:', error);
    return NextResponse.json({ count: 0 });
  }
}
