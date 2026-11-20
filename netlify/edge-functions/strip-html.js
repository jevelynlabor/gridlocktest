// 301 every /*.html request to its extensionless URL in a single hop.
//   /about.html            -> /about
//   /index.html            -> /
//   /blog/x.html?a=1       -> /blog/x?a=1   (query string kept)
//
// Runs on the request URL only, so /about (served from about.html by Netlify)
// never re-enters this function - no redirect loop.
//
// Legacy URLs from the old site (/lessons/*, /learn/start-*, etc.) are excluded
// here and handled by _redirects, which sends them straight to their final
// extensionless destination - also a single hop.

export default async (request) => {
  const url = new URL(request.url);
  let path = url.pathname.replace(/\.html$/, "");
  if (path === "/index" || path.endsWith("/index")) path = path.slice(0, -"index".length);
  url.pathname = path;
  return Response.redirect(url.toString(), 301);
};

export const config = {
  path: "/*.html",
  excludedPath: [
    // Google Search Console verification file must stay at its exact URL.
    "/google8afdd436e030df28.html",
    // Legacy URLs - see _redirects.
    "/lessons/*",
    "/learn/choose-language.html",
    "/learn/start-*",
    "/guide.html",
    "/how-to-use.html",
    "/grid-vs-flexbox.html",
  ],
};
