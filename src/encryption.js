import {qs, qsa } from "./utils/core";

/**
 * Encryption Parser
 * @class
 * @param {document} encryptionDocument XML
 */
class Encryption {
	constructor(encryptionDocument) {
		this.items = [];

		if (encryptionDocument) {
			this.parse(encryptionDocument);
		}
	}

	/**
	 * Parse XML
	 * @param  {document} encryptionDocument XML
	 * @return {Encryption} self
	 */
	parse(encryptionDocument) {
		if(!encryptionDocument) {
			return this;
		}

		const encryptionNode = qs(encryptionDocument, "encryption");
		if(!encryptionNode) {
			return this;
		} 

		const options = qsa(encryptionNode, "EncryptedData");
		const encryptionItems = [];

		options.forEach(ele => {
			const methodNode = qs(ele, "EncryptionMethod");
			const cipherRefNodes = qsa(ele, "CipherReference");
			const uris = [];
			const method = methodNode.attributes.Algorithm.value;

			cipherRefNodes.forEach(node => {
				uris.push(node.attributes.URI.value)
			});

			encryptionItems.push({
				method,
				uris
			});
		});

		this.items = encryptionItems;

		return this;
	}

	destroy() {
		this.items = undefined;
	}
}

export default Encryption;
