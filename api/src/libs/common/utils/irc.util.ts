import { generateSlugUtil } from '@/libs/common/utils'

export const generateIrcNames = (title: string, chatId: string): string => {
	const slug = generateSlugUtil(title)

	const uniqueSuffix = chatId.split('-')[0]

	const safeSlug = slug.substring(0, 30)

	return `#${safeSlug}-${uniqueSuffix}`
}
