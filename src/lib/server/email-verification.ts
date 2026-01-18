import { prisma } from './prisma';
import sendgrid from '@sendgrid/mail';
import { SENDGRID_API_KEY, SB_EMAIL } from '$env/static/private';
import { dev } from '$app/environment';
import type { RequestEvent } from '@sveltejs/kit';
import { generateRandomOTP } from './utils';

export async function sendEmailVerificationCode(email: string, code: string) {
	const msg = {
		to: email,
		from: SB_EMAIL,
		subject: 'Confirm Your Email Address',
		html: `
         <h2>Stackbold - Confirm your email</h2>
         <p>Please confirm your email address by entering this code: <b> ${code}</b></p>
         <p> Thank you,</p>
         <p> Stackbold </p>
         `
	};

	await sendEmail(msg);
}

export async function sendPasswordResetToken(email: string, code: string) {
	const msg = {
		to: email,
		from: SB_EMAIL,
		subject: 'Password Reset Request',
		html: `
        <h2>Stackbold - password reset</h2>
        <p>Use the code bellow to reset your password:</p>
        <b>${code} </b>
        <p>If you did not request this, please ignore this email</p>
        <p> Thank you,</p>
        <p> Stackbold </p>
        `
	};

	await sendEmail(msg);
}

export async function sendEmail(msg: sendgrid.MailDataRequired) {
	if (dev) {
		console.log(msg);
		return;
	}

	sendgrid.setApiKey(SENDGRID_API_KEY);
	await sendgrid.send(msg);
}

export async function createEmailVerificationRequest(userId: string, email: string) {
	await prisma.emailVerification.deleteMany({ where: { userId } });

	return await prisma.emailVerification.create({
		data: {
			userId,
			email,
			code: generateRandomOTP(),
			expiresAt: new Date(Date.now() + 1000 * 60 * 10)
		}
	});
}

export async function getUserEmailVerificationRequest(userId: string, id: string) {
	return await prisma.emailVerification.findFirst({ where: { id, userId } });
}

export async function getUserEmailVerificationRequestFromRequest(event: RequestEvent) {
	if (event.locals.user === null) return null;

	const id = event.cookies.get('email_verification') ?? null;
	if (id === null) return null;

	const request = await getUserEmailVerificationRequest(event.locals.user.id, id);
	if (request == null) deleteEmailVerificationRequestCookie(event);

	return request;
}

export async function deleteUserEmailVerificationRequest(userId: string) {
	await prisma.emailVerification.deleteMany({ where: { userId } });
}

export function setEmailVerificationRequestCookie(
	event: RequestEvent,
	request: { id: string; expiresAt: Date }
): void {
	event.cookies.set('email_verification', request.id, {
		httpOnly: true,
		path: '/',
		secure: import.meta.env.PROD,
		sameSite: 'lax',
		expires: request.expiresAt
	});
}

export function deleteEmailVerificationRequestCookie(event: RequestEvent): void {
	event.cookies.set('email_verification', '', {
		httpOnly: true,
		path: '/',
		secure: import.meta.env.PROD,
		sameSite: 'lax',
		maxAge: 0
	});
}
