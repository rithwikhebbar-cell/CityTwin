export default function handler(req: any, res: any) {
  res.status(200).json({
    status: 'healthy',
    service: 'CityTwin Urban Simulation Server',
    geminiKeyConfigured: Boolean(process.env.GEMINI_API_KEY),
  });
}
