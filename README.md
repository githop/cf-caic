# CAIC AI Assistant

![](./cf-caic-diagram.png)

An AI-powered chat interface for accessing Colorado Avalanche Information Center (CAIC) data. Built with React Router v7 and deployed on Cloudflare Workers.

## Features

- **AI Chat Interface**: Interactive chat to query avalanche forecasts and conditions.
- **CAIC Integration**: Direct integration with CAIC's Avid API for real-time avalanche data.
- **Location Awareness**: Geocoding tools to find forecasts by city, trailhead, or coordinates.
- **Modern Stack**:
  - [React Router v7](https://reactrouter.com/) for the framework.
  - [Cloudflare Workers](https://workers.cloudflare.com/) for serverless hosting.
  - [Tailwind CSS 4](https://tailwindcss.com/) for styling.
  - [Vercel AI SDK](https://sdk.vercel.ai/) for AI capabilities.
  - [Radix UI](https://www.radix-ui.com/) for accessible components.

## Getting Started

### Prerequisites

- [pnpm](https://pnpm.io/)
- [Wrangler](https://developers.cloudflare.com/workers/wrangler/) (for deployment)
- Google Maps API Key (for geocoding)

### Installation

```bash
pnpm install
```

### Development

For local development, the app uses Ollama for AI by default (see `app/routes/api.chat.ts`).

Start the development server:

```bash
pnpm run dev
```

### Deployment

Set up your secrets in Cloudflare:

```bash
npx wrangler secret put GOOGLE_MAPS_API_KEY
```

Deploy to Cloudflare Workers:

```bash
pnpm run deploy
```

## Project Structure

- `app/chat`: Chat interface components.
- `app/lib/caic`: CAIC API client and data formatters.
- `app/lib/tools`: AI tools for the assistant (avalanche info, geocoding).
- `app/routes`: API and page routes.
- `workers/app.ts`: Cloudflare Workers entry point.

---

Built with ❤️ using React Router and Cloudflare.
