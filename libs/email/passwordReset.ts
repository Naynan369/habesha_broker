export const getPasswordRestLink = (
	name: string,
	link: string
) => `<div style="text-align: center">
    <h1>Habesha Brokers</h1>
    <h3>Hi ${name}!</h3>
    <p>Here is password resetting link <p style="font-size: 1.3em; font-weight: bold; margin: 0;">${link}</p>.</p>
    <p>Go to the following link to change your password. if you haven't requested to change your password, please just ignore this message</p>
    <p>If you have any questions, send us an email.</p>
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
    </div>`;
