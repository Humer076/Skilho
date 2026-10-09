# Skilho UI upgrade notes

## Included
- Responsive CSS refinements for desktop, tablet and mobile layouts.
- Consistent logo sizing, object-fit and vertical alignment. Existing `/skilho-logo.png` references are preserved; include the original logo asset in your project's `public/` folder.
- A local FAQ support chatbot mounted globally. It makes no network requests and uses no API key. To connect an AI provider later, call it through a protected backend endpoint; never expose secret keys in browser code.
- Employer package checkout modal with an explicit demo-only simulation. It does not request card data or process money; activation uses the existing development-only test endpoint.

## Important
The supplied `app.zip` contained the `app/` source tree but did not include a package manifest or `public/skilho-logo.png`. Merge this `app/` tree into the complete Next.js project and retain its original dependencies/assets. This bundle cannot replace missing project configuration.

Before production: integrate a payment provider with server-side signature/webhook verification, use a server-side AI proxy for chatbot credentials, review auth/session storage, enable HTTPS, and run the project's tests/build.
