if(!self.define){let e,s={};const a=(a,i)=>(a=new URL(a+".js",i).href,s[a]||new Promise((s=>{if("document"in self){const e=document.createElement("script");e.src=a,e.onload=s,document.head.appendChild(e)}else e=a,importScripts(a),s()})).then((()=>{let e=s[a];if(!e)throw new Error(`Module ${a} didn’t register its module`);return e})));self.define=(i,n)=>{const c=e||("document"in self?document.currentScript.src:"")||location.href;if(s[c])return;let t={};const o=e=>a(e,c),r={module:{uri:c},exports:t,require:o};s[c]=Promise.all(i.map((e=>r[e]||o(e)))).then((e=>(n(...e),t)))}}define(["./workbox-4754cb34"],(function(e){"use strict";importScripts(),self.skipWaiting(),e.clientsClaim(),e.precacheAndRoute([{url:"/_next/app-build-manifest.json",revision:"935ebb6ca73acf427763d7385f2c55f6"},{url:"/_next/static/chunks/08ffe114-7e2b080cb2afc64d.js",revision:"oQEe2UVyqTvjYoRznZzIm"},{url:"/_next/static/chunks/173-1007a4f5628979e3.js",revision:"oQEe2UVyqTvjYoRznZzIm"},{url:"/_next/static/chunks/23-8eaeec2bccd53360.js",revision:"oQEe2UVyqTvjYoRznZzIm"},{url:"/_next/static/chunks/231-838028ec185d724c.js",revision:"oQEe2UVyqTvjYoRznZzIm"},{url:"/_next/static/chunks/39aecf79-7bc0f41635ae25d0.js",revision:"oQEe2UVyqTvjYoRznZzIm"},{url:"/_next/static/chunks/52-913343bb0fb1812c.js",revision:"oQEe2UVyqTvjYoRznZzIm"},{url:"/_next/static/chunks/9081a741-01abe2d3fddde500.js",revision:"oQEe2UVyqTvjYoRznZzIm"},{url:"/_next/static/chunks/956-740bcd2201e53a6b.js",revision:"oQEe2UVyqTvjYoRznZzIm"},{url:"/_next/static/chunks/a63740d3-7df0d52ac0b2b2ca.js",revision:"oQEe2UVyqTvjYoRznZzIm"},{url:"/_next/static/chunks/app/_not-found/page-67308e4085082ac9.js",revision:"oQEe2UVyqTvjYoRznZzIm"},{url:"/_next/static/chunks/app/about/page-8fcf9584effe6c00.js",revision:"oQEe2UVyqTvjYoRznZzIm"},{url:"/_next/static/chunks/app/contact/page-389d3e30101c8cd7.js",revision:"oQEe2UVyqTvjYoRznZzIm"},{url:"/_next/static/chunks/app/layout-749a45b0f4d69f00.js",revision:"oQEe2UVyqTvjYoRznZzIm"},{url:"/_next/static/chunks/app/page-60d973c72b94e717.js",revision:"oQEe2UVyqTvjYoRznZzIm"},{url:"/_next/static/chunks/app/posts/%5Bslug%5D/page-e58839c84e7d6d25.js",revision:"oQEe2UVyqTvjYoRznZzIm"},{url:"/_next/static/chunks/app/posts/page-30c7fbeab1b86dac.js",revision:"oQEe2UVyqTvjYoRznZzIm"},{url:"/_next/static/chunks/app/signin/page-b266ec3dae5ac3a2.js",revision:"oQEe2UVyqTvjYoRznZzIm"},{url:"/_next/static/chunks/b5c10047-5715b37e7b713f4d.js",revision:"oQEe2UVyqTvjYoRznZzIm"},{url:"/_next/static/chunks/fd9d1056-02d6dafb311b5b23.js",revision:"oQEe2UVyqTvjYoRznZzIm"},{url:"/_next/static/chunks/framework-b370f160bb96059c.js",revision:"oQEe2UVyqTvjYoRznZzIm"},{url:"/_next/static/chunks/main-1e437ac9ea297c15.js",revision:"oQEe2UVyqTvjYoRznZzIm"},{url:"/_next/static/chunks/main-app-cc6b8ba59ff9c04a.js",revision:"oQEe2UVyqTvjYoRznZzIm"},{url:"/_next/static/chunks/pages/_app-037b5d058bd9a820.js",revision:"oQEe2UVyqTvjYoRznZzIm"},{url:"/_next/static/chunks/pages/_error-6ae619510b1539d6.js",revision:"oQEe2UVyqTvjYoRznZzIm"},{url:"/_next/static/chunks/polyfills-78c92fac7aa8fdd8.js",revision:"79330112775102f91e1010318bae2bd3"},{url:"/_next/static/chunks/webpack-e7f45e5d3055138d.js",revision:"oQEe2UVyqTvjYoRznZzIm"},{url:"/_next/static/css/15cbae759d1218d5.css",revision:"15cbae759d1218d5"},{url:"/_next/static/css/771bfaa28bdb37a1.css",revision:"771bfaa28bdb37a1"},{url:"/_next/static/media/062522b8b7c3ad6a-s.woff2",revision:"0f347a32b2168180dbc514e104ab207c"},{url:"/_next/static/media/19e37deead9b3ec2-s.woff2",revision:"8f919c25620e7f246b5abcfa979922bf"},{url:"/_next/static/media/3d9ea938b6afa941-s.p.woff2",revision:"ee1b2a154fb9ea98a28413a839adedfb"},{url:"/_next/static/media/46392699924ae7e5-s.woff2",revision:"467f697ccbe92aebc38f6c1a433f6948"},{url:"/_next/static/media/6fed4e5749a3ea15-s.woff2",revision:"bd04001574d461203c7264ac27d8c504"},{url:"/_next/static/media/83651bee47cf14da-s.woff2",revision:"d2bb91b14d5895c91741b933a76be9c0"},{url:"/_next/static/media/9beef36ab83de3f0-s.woff2",revision:"82c2dc97217d32c57a029754fda91e4e"},{url:"/_next/static/media/dd4ab5b525bd804a-s.woff2",revision:"b505d29c0021c60e4a004de0b5fea45f"},{url:"/_next/static/media/e6f5886ae1242622-s.woff2",revision:"e64d3f79602912c46c2b4d7f26dcadb8"},{url:"/_next/static/media/faac4ac11aa3d97b-s.woff2",revision:"9cb88d5b1ed3ff5796eefc9e62af1b8e"},{url:"/_next/static/media/profile.36d0cbc6.jpg",revision:"0b3039ae57d82f941bbbb961581b9af5"},{url:"/_next/static/media/revicons.652e7269.eot",revision:"652e7269"},{url:"/_next/static/media/revicons.b96bdb22.ttf",revision:"b96bdb22"},{url:"/_next/static/media/revicons.ff59b316.woff",revision:"ff59b316"},{url:"/_next/static/oQEe2UVyqTvjYoRznZzIm/_buildManifest.js",revision:"a0ae24e7f29dd3809ab75b5dd91a79dc"},{url:"/_next/static/oQEe2UVyqTvjYoRznZzIm/_ssgManifest.js",revision:"b6652df95db52feb4daf4eca35380933"},{url:"/images/600X800 1.jpg",revision:"b65b208ff9266eabc9d0625c68d49af5"},{url:"/images/posts/auth.png",revision:"d3c5eb6282232649bf61b03831f1a695"},{url:"/images/posts/callback-promise-async.png",revision:"6f9e223ca0ec38d3c0ca374d5cd52fdb"},{url:"/images/posts/closure.png",revision:"512c3fe9b5c77f6aa8ba70049d19f173"},{url:"/images/posts/context.png",revision:"59069eeefcb99b8393dba708fe08c4e4"},{url:"/images/posts/csr-ssr.png",revision:"8fa88555193a24d84a69d38eae44eeb6"},{url:"/images/posts/dynamic-type.png",revision:"0d0ca635ac8c80f56049696cce8011ac"},{url:"/images/posts/encapsulation.png",revision:"1766a9e53b7d648bdd18723a382f584d"},{url:"/images/posts/event.png",revision:"a5649f30aeccc0ce982d9a7576c44d9f"},{url:"/images/posts/iterable-generator.png",revision:"fea98ff3c69ed99e5829fbad77778d2a"},{url:"/images/posts/jungle01.png",revision:"6496a3f6d2d29ea696652e6169cfc7a4"},{url:"/images/posts/jungle02.png",revision:"93d3f0e73658cc4432666ac3c7cfa360"},{url:"/images/posts/jungle03.png",revision:"93d3f0e73658cc4432666ac3c7cfa360"},{url:"/images/posts/jungle04.png",revision:"93d3f0e73658cc4432666ac3c7cfa360"},{url:"/images/posts/jungle05.png",revision:"93d3f0e73658cc4432666ac3c7cfa360"},{url:"/images/posts/jungle06.png",revision:"0ed4872ede365061a754042574c068d1"},{url:"/images/posts/jungle07.png",revision:"526938f80a3f610bd7f5f78bcd065bfc"},{url:"/images/posts/jungle08.png",revision:"e703157e2ca583aec90fec8859c4923c"},{url:"/images/posts/jungle09.png",revision:"d6a29d78e50cf0c694be28fad021baec"},{url:"/images/posts/jungle10.png",revision:"d6a29d78e50cf0c694be28fad021baec"},{url:"/images/posts/jungle11.png",revision:"d6a29d78e50cf0c694be28fad021baec"},{url:"/images/posts/jungle12.png",revision:"d6a29d78e50cf0c694be28fad021baec"},{url:"/images/posts/jungle13.png",revision:"d6a29d78e50cf0c694be28fad021baec"},{url:"/images/posts/jungle14.png",revision:"cac6b0e0f8f41b5e4ebc18043a59122d"},{url:"/images/posts/jungle15.png",revision:"cac6b0e0f8f41b5e4ebc18043a59122d"},{url:"/images/posts/jungle16.png",revision:"cac6b0e0f8f41b5e4ebc18043a59122d"},{url:"/images/posts/jungle17.png",revision:"cac6b0e0f8f41b5e4ebc18043a59122d"},{url:"/images/posts/jungle18.png",revision:"cac6b0e0f8f41b5e4ebc18043a59122d"},{url:"/images/posts/jungle19.png",revision:"7ab154b5a01e802fc4aa6fafdc1b83fd"},{url:"/images/posts/map.png",revision:"986dcfff598e0088e8e917d655061276"},{url:"/images/posts/mvc.png",revision:"cd7543f32fdfe7c623acea87e45dcf33"},{url:"/images/posts/next-10mistakes.png",revision:"b0068d21d0843ab9108734b8e9351144"},{url:"/images/posts/next-app-router.png",revision:"4cd0563221247b43711cc4344967a4c2"},{url:"/images/posts/next-cache-mechanism.png",revision:"170267b6985a31ec21eb51398cb84ed9"},{url:"/images/posts/next-page-router.png",revision:"bc7fd1942604052c481f362284cbb9d4"},{url:"/images/posts/next-router.png",revision:"6ab1b47a331601c263e0194449d22000"},{url:"/images/posts/next.js.png",revision:"36a5623d8c01b22a5b9448765aa92d01"},{url:"/images/posts/next12.png",revision:"e7b71dea36734bc1e3c43296768f2f64"},{url:"/images/posts/oop.png",revision:"2856b3da984418cde40c160a021ce44e"},{url:"/images/posts/prototype.png",revision:"4558c516287ab91dbac290d951313835"},{url:"/images/posts/react-alice-carousel.png",revision:"cc5321deaca40054ab76f62c0855d08d"},{url:"/images/posts/react-children-pattern.png",revision:"6b67dc1d5d676ce9f77b32e50d73f6f0"},{url:"/images/posts/react-closer.png",revision:"72dd88455dd6eda3d6b5abf2fb6a2636"},{url:"/images/posts/react-deep-dive-1.png",revision:"492fc83cbae1076be72da54bc5d93e3e"},{url:"/images/posts/react-deep-dive-10.png",revision:"90013aad6b826f293fe89c28cdbfdfca"},{url:"/images/posts/react-deep-dive-11.png",revision:"18a174ff9b533dfd30294e59f7dd6deb"},{url:"/images/posts/react-deep-dive-12.png",revision:"5ffee70d18ad5aac4caa841d0530cfb3"},{url:"/images/posts/react-deep-dive-13.png",revision:"02a277ba3013f8e9d107d34140fa7c19"},{url:"/images/posts/react-deep-dive-14.png",revision:"10ea55c3a49e7d5fc805f7c16903ad49"},{url:"/images/posts/react-deep-dive-15.png",revision:"8fb5f718d220cbc4b545e241adf87592"},{url:"/images/posts/react-deep-dive-16.png",revision:"9358bbb2f38891dadf329d44ab781a06"},{url:"/images/posts/react-deep-dive-17.png",revision:"3180eab04401024e23cd7723d060e972"},{url:"/images/posts/react-deep-dive-18.png",revision:"95acf66955e500e74c33e4261f109062"},{url:"/images/posts/react-deep-dive-19.png",revision:"a9a92e0dd3c1427e51c26e0425e56d65"},{url:"/images/posts/react-deep-dive-2.png",revision:"492fc83cbae1076be72da54bc5d93e3e"},{url:"/images/posts/react-deep-dive-20.png",revision:"b7c778a8097c2538308ed27b112e61f4"},{url:"/images/posts/react-deep-dive-21.png",revision:"5983c1fafcc21a2dd72e095488decb21"},{url:"/images/posts/react-deep-dive-22.png",revision:"ea8ac989e181223ca2be13fbe6a39fe5"},{url:"/images/posts/react-deep-dive-3.png",revision:"65f34668da6e3940aea9ae21639cee99"},{url:"/images/posts/react-deep-dive-4.png",revision:"ae52e402eb96da089c4546eb13fc592e"},{url:"/images/posts/react-deep-dive-5.png",revision:"ae52e402eb96da089c4546eb13fc592e"},{url:"/images/posts/react-deep-dive-6.png",revision:"ae52e402eb96da089c4546eb13fc592e"},{url:"/images/posts/react-deep-dive-7.png",revision:"ae52e402eb96da089c4546eb13fc592e"},{url:"/images/posts/react-deep-dive-8.png",revision:"594305d2d75629955c90a3158c03a33d"},{url:"/images/posts/react-deep-dive-9.png",revision:"5643b162efc4dbf25ed3e1a74da4d085"},{url:"/images/posts/react-dnd.png",revision:"fd109e6d70ceeea3fbc6948184a30063"},{url:"/images/posts/react-version18.png",revision:"73d712e109f7cafd77efbae654e31325"},{url:"/images/posts/reacthook(1).png",revision:"341035092b7dab0d5c6877b83eb39cd9"},{url:"/images/posts/reacthook(2).png",revision:"341035092b7dab0d5c6877b83eb39cd9"},{url:"/images/posts/redux.png",revision:"438d700e31b9f7b69eb997e123f23e2d"},{url:"/images/posts/streaming.png",revision:"9c4c650b085325c7cbc395f6d6ee398c"},{url:"/images/posts/tdd.png",revision:"3b2e1adf7b26b87b6ec621b1621b9941"},{url:"/images/posts/this.png",revision:"1c50795d5e67375556c5b5ff8683a7c3"},{url:"/images/posts/types.png",revision:"daf0eb9cf58f3e47c6ecf1f0cf584130"},{url:"/images/posts/typescript.png",revision:"379e69656c88b0497cc8826a848e0000"},{url:"/images/posts/variable.png",revision:"38024149cc312c01fcc89f858b7c4278"},{url:"/images/posts/zustand.png",revision:"91c697e05a37b016ef5aa51a57c6d761"},{url:"/images/profile.jpg",revision:"0b3039ae57d82f941bbbb961581b9af5"},{url:"/images/splash-img.png",revision:"642b24b7d0fa1dccfc0bd8a639eac0d2"}],{ignoreURLParametersMatching:[]}),e.cleanupOutdatedCaches(),e.registerRoute("/",new e.NetworkFirst({cacheName:"start-url",plugins:[{cacheWillUpdate:async({request:e,response:s,event:a,state:i})=>s&&"opaqueredirect"===s.type?new Response(s.body,{status:200,statusText:"OK",headers:s.headers}):s}]}),"GET"),e.registerRoute(/^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,new e.CacheFirst({cacheName:"google-fonts-webfonts",plugins:[new e.ExpirationPlugin({maxEntries:4,maxAgeSeconds:31536e3})]}),"GET"),e.registerRoute(/^https:\/\/fonts\.(?:googleapis)\.com\/.*/i,new e.StaleWhileRevalidate({cacheName:"google-fonts-stylesheets",plugins:[new e.ExpirationPlugin({maxEntries:4,maxAgeSeconds:604800})]}),"GET"),e.registerRoute(/\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,new e.StaleWhileRevalidate({cacheName:"static-font-assets",plugins:[new e.ExpirationPlugin({maxEntries:4,maxAgeSeconds:604800})]}),"GET"),e.registerRoute(/\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,new e.StaleWhileRevalidate({cacheName:"static-image-assets",plugins:[new e.ExpirationPlugin({maxEntries:64,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\/_next\/image\?url=.+$/i,new e.StaleWhileRevalidate({cacheName:"next-image",plugins:[new e.ExpirationPlugin({maxEntries:64,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:mp3|wav|ogg)$/i,new e.CacheFirst({cacheName:"static-audio-assets",plugins:[new e.RangeRequestsPlugin,new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:mp4)$/i,new e.CacheFirst({cacheName:"static-video-assets",plugins:[new e.RangeRequestsPlugin,new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:js)$/i,new e.StaleWhileRevalidate({cacheName:"static-js-assets",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:css|less)$/i,new e.StaleWhileRevalidate({cacheName:"static-style-assets",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\/_next\/data\/.+\/.+\.json$/i,new e.StaleWhileRevalidate({cacheName:"next-data",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:json|xml|csv)$/i,new e.NetworkFirst({cacheName:"static-data-assets",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute((({url:e})=>{if(!(self.origin===e.origin))return!1;const s=e.pathname;return!s.startsWith("/api/auth/")&&!!s.startsWith("/api/")}),new e.NetworkFirst({cacheName:"apis",networkTimeoutSeconds:10,plugins:[new e.ExpirationPlugin({maxEntries:16,maxAgeSeconds:86400})]}),"GET"),e.registerRoute((({url:e})=>{if(!(self.origin===e.origin))return!1;return!e.pathname.startsWith("/api/")}),new e.NetworkFirst({cacheName:"others",networkTimeoutSeconds:10,plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute((({url:e})=>!(self.origin===e.origin)),new e.NetworkFirst({cacheName:"cross-origin",networkTimeoutSeconds:10,plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:3600})]}),"GET")}));