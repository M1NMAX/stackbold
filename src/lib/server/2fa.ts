import { decryptToString, encryptString } from './encryption';
import { prisma } from './prisma';
import { generateRandomRecoveryCode } from './utils';

export async function resetUser2FAWithRecoveryCode(userId: string, recoveryCode: string) {
	return prisma.$transaction(async (tx) => {
		const result = await tx.user.findUnique({
			where: { id: userId },
			select: { recoveryCode: true }
		});
		if (result == null) return false;

		const userRecoveryCode = decryptToString(result.recoveryCode);
		if (recoveryCode !== userRecoveryCode) return false;

		const newRecoveryCode = generateRandomRecoveryCode();
		const encryptedNewRecoveryCode = encryptString(newRecoveryCode);
		await tx.session.updateMany({ where: { userId }, data: { twoFactorVerified: false } });

		const user = await tx.user.update({
			where: { id: userId, recoveryCode: result.recoveryCode },
			data: { recoveryCode: encryptedNewRecoveryCode, totpKey: null }
		});

		return user != null;
	});
}
