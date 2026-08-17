import { supabase } from '../../lib/supabase';

export const visitorService = {
  async getVisitorCount() {
    if (!supabase) {
      return 0;
    }

    try {
      const { data, error } = await supabase
        .from('visitors')
        .select('count')
        .eq('id', 1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      return data?.count ?? 0;
    } catch (error) {
      console.error('Error fetching visitor count:', error);
      return 0;
    }
  },

  async incrementVisitorCount() {
    if (!supabase) {
      return 0;
    }

    try {
      // Upsert: increment count or create row with count=1
      const { data, error } = await supabase.rpc('increment_visitors');

      if (error) throw error;

      return data ?? 0;
    } catch (error) {
      console.error('Error incrementing visitor count:', error);
      return 0;
    }
  }
};
