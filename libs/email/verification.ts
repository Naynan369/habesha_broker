export const getVerificationHtml = (
	name: string,
	code: string,
	appLink: string = "habeshabrokers.netlify.app"
) => `
		<div
			style="
				font-weight: normal;
				text-align: center;
				font-size: larger;
				font-family: 'Roboto', sans-serif;
			"
		>
			<h1 style="margin-bottom: 5px">Habesha Brokers</h1>
			<h2 style="margin-bottom: 1.4em; font-weight: normal">
				Hi ${name}!
			</h2>
			<h3>
				Your verification code is
				<p
					style="
						font-size: 1.8em;
						font-weight: bold;
						margin: 0;
						margin-top: 10px;
						letter-spacing: 0.1em;
						/* border: 2px solid salmon; */
					"
				>
					${code}
				</p>
			</h3>
			<h4 style="font-weight: normal">
				Enter this code in our website to activate your habesha brokers
				account. If you haven't request this email, please ignore this email
			</h4>
			<h4>
				Click here
				<a href="#" style="text-decoration: none">${appLink}</a>
				to open the website.
			</h4>
			<h4>If you have any questions, send us an email.</h4>
			<p
				style="
					margin-top: 30px;
					padding: 20px;
					background: #224;
					color: white;
				"
			>
				We're glad you're here! The Habesha Brokers team
			</p>
		</div>
`;
