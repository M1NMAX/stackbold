import { dev } from "$app/environment";
import { PrismaAdapter } from "@lucia-auth/adapter-prisma";
import { PrismaClient, Role } from "@prisma/client";
import { Lucia } from "lucia";


const client = new PrismaClient()

const adapter = new PrismaAdapter(client.session, client.user);


export const lucia = new Lucia(adapter, {
    sessionCookie: {
        attributes: {
            secure: !dev
        }
    },
    getUserAttributes: (attributes) => {
        return {
            name: attributes.name,
            email: attributes.email,
            emailVerified: attributes.emailVerified,
            role: attributes.role
        }
    },
    getSessionAttributes: (attributes) => {
        return {
            role: attributes.role
        }
    }
})


declare module "lucia" {
    interface Register {
        Lucia: typeof lucia;
        DatabaseUserAttributes: DatabaseUserAttributes;
        DatabaseSessionAttributes: DatabaseSessionAttributes;
    }
}

interface DatabaseUserAttributes {
    name: string;
    email: string;
    emailVerified: boolean;
    role: Role;
}

interface DatabaseSessionAttributes {
    role: Role;
}