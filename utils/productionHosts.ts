// Hostnames whose traffic counts as real visitors. Anything else that still
// runs a production build (e.g. `npx serve .output/public` on localhost) is
// tagged traffic_type=internal for GA4 and never loads Clarity.
export const PRODUCTION_HOSTS = ['wbmband.com', 'www.wbmband.com']
