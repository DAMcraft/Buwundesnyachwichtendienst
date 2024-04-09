const proxyTo = 'bnd.bund.de'; // The domain you want to proxy/uwuify
const proxyFrom = 'bnd.tf'; // The domain you want to proxy from





// Add blushing to the BND logo
let newLogo = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2600 572.46">
	<defs>
		<radialGradient id="fade" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
			<stop offset="0%" style="stop-color:rgba(255, 0, 242,1);stop-opacity:1"/>
			<stop offset="100%" style="stop-color:rgba(255, 0, 242,0);stop-opacity:0"/>
		</radialGradient>
	</defs>
	$1
	<circle cx="220" cy="134" r="25" fill="url(#fade)"/>
	<text x="1500" y="473" font-size="480" font-family="Arial" fill="currentColor" font-weight="bold" class="bnd_font">UwU</text>
</svg>
`
let newLogo2 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 617.34 617.69">
	<defs>
		<radialGradient id="fade" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
			<stop offset="0%" style="stop-color:rgba(255, 0, 242,1);stop-opacity:1"/>
			<stop offset="100%" style="stop-color:rgba(255, 0, 242,0);stop-opacity:0"/>
		</radialGradient>
	</defs>
	$1
	<circle cx="276" cy="134" r="25" fill="url(#fade)"/>
</svg>
`



// Text that should always be replaced
const alwaysReplaceMap = new Map<RegExp, string>([
	[new RegExp('(www\\.)?' + proxyTo.replace(/\./g, '\\.'), 'gi'), proxyFrom],
	// Regex matching the BND logo
	[/<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 1528\.43 572\.46">(.*?)<\/svg>/s, newLogo],
	[/<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 617\.34 617\.69">(.*?)<\/svg>/s, newLogo2],
]);


// Text that should ONLY be replaced in text content
const textReplaceMap = new Map<RegExp, string>([
	[/Bundesnachrichtendienst/g, "Buwudesnyachwichtendienst"],
	[/BND/g, "BNDUwU"],
	[/[rl]/g, "w"],
	[/[RL]/g, "W"],
	[/n([aeiou])/g, "ny$1"],
	[/N([aeiou])/g, "Ny$1"],
	[/N([AEIOU])/g, "NY$1"],
	[/ove/g, "uv"],
]);

export default {
	async fetch(request: Request): Promise<Response> {
		const url = new URL(request.url);

		let res = await fetch("https://" + proxyTo + url.pathname + url.search, request);

		const contentType = res.headers.get('content-type');
		if (contentType && !contentType.startsWith('text')) {
			return res;
		}

		if (res.status === 301 || res.status === 302) {
			let location = res.headers.get('location') || '';
			location = location.replace(new RegExp('(www\\.)?' + proxyTo, 'gi'), proxyFrom);
			let newResponse = new Response(res.body, {
				status: res.status,
				statusText: res.statusText,
				headers: res.headers,
			});
			newResponse.headers.set('location', location);
			return newResponse;
		}

		let newText = await res.text();
		alwaysReplaceMap.forEach((value, key) => {
			newText = newText.replace(key, value);
		});

		newText = await new HTMLRewriter().on('*', {
			// Replace text content
			text(text) {
				let textContent = text.text;
				textReplaceMap.forEach((value, key) => {
					textContent = textContent.replace(key, value);
				});
				text.replace(textContent, {html: true});
			},

			element(element) {
				if (element.getAttribute('id') === "header") {
					// Satire disclaimer
					element.prepend(`
						<div class="row" id="satire-disclaimer">
							<p>
								Die Inhalte dieser Seite sind satirisch und nicht ernst gemeint.
								Die echte Seite des Bundesnachrichtendienstes finden Sie unter <a href="https://www.bnd.bund.de">bnd.bund.de</a>
							</p>
					    </div>
					    <style>
							#satire-disclaimer {
								text-align: center;
								background-color: rgba(255,0,0,0.48);
								color: white;
								width: 100%;
								display: flex;
								justify-content: center;
							}
							#satire-disclaimer p {
								text-align: center;
							}
							#header {
								margin-top: 0;
							}
						</style>
					`, {html: true});
				}

				if (['og:url', 'og:image'].includes(element.getAttribute('property') || '') || element.getAttribute('name') === 'twitter:image') {
					element.remove();
					return;
				}

				let prop = ["og:title", "og:description", "og:site_name"];
				let twitter = ["twitter:title", "twitter:description", "twitter:site"];
				if (element.tagName === 'meta' && element.getAttribute('content')) {
					if (twitter.includes(element.getAttribute('name') || '')) {
						let content = element.getAttribute('content');
						if (!content) return;
						textReplaceMap.forEach((value, key) => {
							// @ts-ignore
							content = content.replace(key, value);
						});
						element.setAttribute('content', content);
					} else if (prop.includes(element.getAttribute('property') || '')) {
						let content = element.getAttribute('content');
						if (!content) return;
						textReplaceMap.forEach((value, key) => {
							// @ts-ignore
							content = content.replace(key, value);
						});
						element.setAttribute('content', content);
					}
				}
			}
		}).transform(new Response(newText)).text();

		return new Response(newText, {
			status: res.status,
			statusText: res.statusText,
			headers: res.headers,
		});
	},
};
