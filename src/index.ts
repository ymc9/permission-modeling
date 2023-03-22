import { PrismaClient } from '@prisma/client';
import express, { type Request } from 'express';
import { ZenStackMiddleware } from '@zenstackhq/server/express';
import { withPresets } from '@zenstackhq/runtime';

const prisma = new PrismaClient();
const app = express();

app.use(express.json());

function getSessionUser(request: Request) {
    // TODO: Get user id from request
    return 'user1';
}

app.use(
    '/api',
    ZenStackMiddleware({
        getPrisma: async (request) => {
            const uid = getSessionUser(request);

            // fetch full user from db
            const dbUser = await prisma.user.findUnique({ where: { id: uid } });

            // find the group with global post permission for the current user
            const memberOfPostAdminGroup = await prisma.groupUser.findFirst({
                include: { group: true },
                where: {
                    userId: uid,
                    group: {
                        postPermission: {
                            not: null,
                        },
                    },
                },
            });

            const user = {
                id: uid,
                postPermission: dbUser?.postPermission,
                groupPostPermission: memberOfPostAdminGroup?.group.postPermission,
            };
            withPresets(prisma, { user });
        },
    })
);

app.get('/', async (req, res) => {
    return res.json({ message: 'Hello World!' });
});

const server = app.listen(3000, () =>
    console.log(`
🚀 Server ready at: http://localhost:3000
⭐️ See sample requests: http://pris.ly/e/ts/rest-express#3-using-the-rest-api`)
);
