const https = require('https');

function doRequest(endpoint, payloadObj, onComplete) {
	let payload = JSON.stringify(payloadObj);

	let options = {
		method: 'POST',
		headers: {
			"Content-Type": "application/json",
			"Content-Length": payload.length
		}
	};

	let req = https.request("https://authserver.mojang.com/" + endpoint, options, response => {
		let data = "";

		response.on('data', d => {
			data += d;
		});

		response.on('end', () => {
			let result = {
				fail: (response.statusCode < 200 || response.statusCode > 299),
				statusCode: response.statusCode
			};

			if (result.fail) {
				try {
					result.error = JSON.parse(data);
				} catch (e) {
					result.error = {
						error: "UnknownError",
						errorMessage: "The server returned an unknown error.",
						cause: "Server Error"
					};
				}
			} else {
				result.raw = data;
			}

			onComplete(result);
		});
	});

	req.on('error', err => {
		onComplete({
			fail: true,
			error: {
				error: err.name,
				errorMessage: err.message,
				cause: "Internal Error"
			}
		});
	});

	req.write(payload);
	req.end();
}

function authenticate(email, pass, clientToken, onComplete) {
	let payload = {
		agent: {
			name: "Minecraft",
			version: 1
		},
		username: email,
		password: pass,
		requestUser: true
	};

	if (clientToken != null)
		payload.clientToken = clientToken;

	doRequest("authenticate", payload, (result) => {
		onComplete({
			...result,
			...(result.fail ? {} : JSON.parse(result.raw))
		});
	});
}

function refresh(accessToken, clientToken, onComplete) {
	let payload = {
		accessToken: accessToken,
		clientToken: clientToken,
		requestUser: true
	};

	doRequest("refresh", payload, (result) => {
		onComplete({
			...result,
			...(result.fail ? {} : JSON.parse(result.raw))
		});
	});
}

function signout(email, pass, onComplete) {
	let payload = {
		username: email,
		password: pass
	};

	doRequest("signout", payload, (result) => {
		onComplete({
			...result,
			success: result.statusCode == 204
		});
	});
}

function validate(accessToken, clientToken, onComplete) {
	let payload = {
		accessToken: accessToken,
		clientToken: clientToken
	};

	doRequest("validate", payload, (result) => {
		onComplete({
			...result,
			success: result.statusCode == 204
		});
	});
}

function invalidate(accessToken, clientToken, onComplete) {
	let payload = {
		accessToken: accessToken,
		clientToken: clientToken
	};

	doRequest("invalidate", payload, (result) => {
		onComplete({
			...result,
			success: result.statusCode == 204
		});
	});
}

exports.authenticate = authenticate;
exports.refresh = refresh;
exports.signout = signout;
exports.validate = validate;
exports.invalidate = invalidate;
