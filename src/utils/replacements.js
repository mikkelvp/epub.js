import { qs, qsa } from "./core";
import Url from "./url";
import Path from "./path";

export function replaceBase(doc, section){
	var base;
	var head;
	var url = section.url;
	var absolute = (url.indexOf("://") > -1);

	if(!doc){
		return;
	}

	head = qs(doc, "head");
	base = qs(head, "base");

	if(!base) {
		base = doc.createElement("base");
		head.insertBefore(base, head.firstChild);
	}

	// Fix for Safari crashing if the url doesn't have an origin
	if (!absolute && window && window.location) {
		url = window.location.origin + url;
	}

	base.setAttribute("href", url);
}

export function replaceCanonical(doc, section){
	var head;
	var link;
	var url = section.canonical;

	if(!doc){
		return;
	}

	head = qs(doc, "head");
	link = qs(head, "link[rel='canonical']");

	if (link) {
		link.setAttribute("href", url);
	} else {
		link = doc.createElement("link");
		link.setAttribute("rel", "canonical");
		link.setAttribute("href", url);
		head.appendChild(link);
	}
}

export function replaceMeta(doc, section){
	var head;
	var meta;
	var id = section.idref;
	if(!doc){
		return;
	}

	head = qs(doc, "head");
	meta = qs(head, "link[property='dc.identifier']");

	if (meta) {
		meta.setAttribute("content", id);
	} else {
		meta = doc.createElement("meta");
		meta.setAttribute("name", "dc.identifier");
		meta.setAttribute("content", id);
		head.appendChild(meta);
	}
}

// TODO: move me to Contents
export function replaceLinks(contents, fn) {

	var links = contents.querySelectorAll("a[href]");

	if (!links.length) {
		return;
	}

	var base = qs(contents.ownerDocument, "base");
	var location = base ? base.getAttribute("href") : undefined;
	var replaceLink = function(link){
		var href = link.getAttribute("href");

		if(href.indexOf("mailto:") === 0){
			return;
		}

		var absolute = (href.indexOf("://") > -1);

		if(absolute){

			link.setAttribute("target", "_blank");

		}else{
			var linkUrl;
			try {
				linkUrl = new Url(href, location);	
			} catch(error) {
				// NOOP
			}

			link.onclick = function(){

				if(linkUrl && linkUrl.hash) {
					fn(linkUrl.Path.path + linkUrl.hash);
				} else if(linkUrl){
					fn(linkUrl.Path.path);
				} else {
					fn(href);
				}

				return false;
			};
		}
	}.bind(this);

	for (var i = 0; i < links.length; i++) {
		replaceLink(links[i]);
	}


}

export function substitute(content, urls, replacements) {
	urls.forEach(function(url, i){
		if (url && replacements[i]) {
			if (url.indexOf('%') !== -1) {
				url = decodeURIComponent(url);
			}
			let _url = url;
			// Account for special characters in the file name.
			// See https://stackoverflow.com/a/6318729.
			_url = _url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

			let regex = new RegExp(`"[^"]*?(${_url}")`, "g");

			if (url.indexOf('&amp;') === -1 && !regex.test(content)) {
				_url = url.replace(/&/g, '&amp;');
				_url = _url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
				regex = new RegExp(`"[^"]*?(${_url}")`, "g");
			}
			// replace relative urls like `../path.jpg`
			content = content.replace(regex, `"${replacements[i]}"`);
			// replace remaining
			content = content.replace(new RegExp(_url, "g"), replacements[i]);
		}
	});
	return content;
}

export function substituteCss(content, urls, replacements) {
	urls.forEach(function(url, i){
		if (url && replacements[i]) {
			const urlSegments = url.split('/');
			// Account for special characters in the file name.
			// See https://stackoverflow.com/a/6318729.
			const fileName = urlSegments[urlSegments.length - 1].replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
			const regex = new RegExp(`url\\(.*?${fileName}*.\\)`, 'ig');

			content = content.replace(regex, `url(${replacements[i]})`);
		}
	});

	// replace css imports - does not support identical filenames in different folders
	const importRegex = /@import\s*"(.*?)"/gm;
	const imports = [];
	let res;
	while ((res = importRegex.exec(content)) !== null) {
		imports.push(res[1])
	}

	imports.forEach(path => {
		const segments = path.split('/');
		const filename = segments[segments.length - 1];
		const index = urls.findIndex(url => url.includes(filename));
		const regex = new RegExp(path);
		content = content.replace(regex, replacements[index]);
	})

	// remove invalid selectors (uppercased DOM elements)
	const regex = /^[^.][A-Z]+\s*[{].*?[}]/gsm;
	content = content.replace(regex, '');

	return content;
}
