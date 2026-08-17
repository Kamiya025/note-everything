import { NextResponse } from 'next/server';
import { visitorService } from '../services/visitorService';

export const visitorController = {
  async getVisitorHandler() {
    const count = await visitorService.getVisitorCount();
    return NextResponse.json({ count });
  },

  async incrementVisitorHandler() {
    const count = await visitorService.incrementVisitorCount();
    return NextResponse.json({ count });
  }
};
