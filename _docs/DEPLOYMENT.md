# Deployment

## Frontend

Build the PWA with:

```bash
npm --prefix frontend run build
```

Serve the generated `frontend/dist` directory over HTTPS. Service workers and install prompts require a secure origin outside localhost. No backend service or environment-specific API URL is required.

## Release Checks

- Run the frontend type check and production build.
- Verify touch interactions at 390x844px.
- Confirm localStorage survives reloads and the PWA service worker registers.
