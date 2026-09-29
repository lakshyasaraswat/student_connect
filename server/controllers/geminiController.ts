import { Request, Response } from 'express';
import { GeminiService, getCollegeVerifiedPlaces } from '../services/geminiService.ts';
import { db } from '../config/db.ts';

export const GeminiController = {
  async handleChat(req: Request, res: Response) {
    try {
      const { message, history, campusId, collegeName, latLng, category } = req.body;

      if (!message || typeof message !== 'string' || !message.trim()) {
        return res.status(400).json({ success: false, message: 'Message text is required.' });
      }

      // Resolve campus using campusId or collegeName
      const campus = db.campuses.find((c: any) =>
        c.id === campusId ||
        c.id === `campus_${campusId}` ||
        c.id.replace('campus_', '') === campusId?.replace('campus_', '') ||
        (collegeName && c.name.toLowerCase() === collegeName.toLowerCase()) ||
        (collegeName && (c.name.toLowerCase().includes(collegeName.toLowerCase()) || collegeName.toLowerCase().includes(c.name.toLowerCase())))
      );

      const campusName = collegeName?.trim() || campus?.name || 'Stanford University';

      // Default lat/lng to campus center if not provided
      const resolvedLatLng = latLng || campus?.centerCoordinates || { lat: 37.4275, lng: -122.1697 };

      const result = await GeminiService.chatWithMaps({
        message: message.trim(),
        history: Array.isArray(history) ? history : [],
        campusName,
        latLng: resolvedLatLng,
        category: category || 'general'
      });

      res.json({
        success: true,
        text: result.text,
        places: result.places,
        groundingChunks: result.groundingChunks
      });
    } catch (err: any) {
      console.error('[GeminiController] chat error:', err);
      res.status(500).json({
        success: false,
        message: err.message || 'Failed to process AI Maps query.'
      });
    }
  },

  async getNearbyAssistance(req: Request, res: Response) {
    try {
      const { category, query, campusId, collegeName } = req.body;
      const campus = db.campuses.find((c: any) =>
        c.id === campusId ||
        c.id === `campus_${campusId}` ||
        c.id.replace('campus_', '') === campusId?.replace('campus_', '') ||
        (collegeName && c.name.toLowerCase() === collegeName.toLowerCase()) ||
        (collegeName && (c.name.toLowerCase().includes(collegeName.toLowerCase()) || collegeName.toLowerCase().includes(c.name.toLowerCase())))
      );

      const campusName = collegeName?.trim() || campus?.name || 'Stanford University';
      const latLng = campus?.centerCoordinates || { lat: 37.4275, lng: -122.1697 };

      const defaultPrompt =
        category === 'carpool'
          ? `Provide the best designated rideshare and carpool pickup points, transit stops, and commute routes near ${campusName}.`
          : category === 'pg'
          ? `Find nearby student PG rents, student hostels, and budget-friendly flats within 2 miles of ${campusName}, including typical rent prices.`
          : `Recommend top student neighborhoods, street corridors, and housing areas for matching roommates near ${campusName}.`;

      const prompt = query?.trim() ? `${query} near ${campusName}` : defaultPrompt;

      const result = await GeminiService.chatWithMaps({
        message: prompt,
        campusName,
        latLng,
        category: category || 'general'
      });

      res.json({
        success: true,
        text: result.text,
        places: result.places
      });
    } catch (err: any) {
      console.error('[GeminiController] locate nearby error:', err);
      res.status(500).json({
        success: false,
        message: err.message || 'Failed to retrieve nearby maps assistance.'
      });
    }
  },

  getVerifiedLocations(req: Request, res: Response) {
    try {
      const { collegeName, campusId, category } = req.query;
      const result = getCollegeVerifiedPlaces({
        collegeName: (collegeName as string) || undefined,
        campusId: (campusId as string) || undefined,
        category: (category as string) || undefined
      });
      res.json({
        success: true,
        collegeName: result.collegeName,
        locations: result.places
      });
    } catch (err: any) {
      console.error('[GeminiController] getVerifiedLocations error:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch verified campus locations.'
      });
    }
  }
};
