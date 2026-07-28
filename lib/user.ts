import { authClient } from "@/lib/auth-client" // import the auth client

export function User(){

    const {
        data: session,
        isPending, //loading state
        error, //error object
        refetch //refetch the session
    } = authClient.useSession()

    return (
        //...
    )
}


// import { authClient } from "@/lib/auth-client" // import the auth client

// const { data: session, error } = await authClient.getSession()


// import { auth } from "./auth"; // path to your Better Auth server instance
// import { headers } from "next/headers";

// const session = await auth.api.getSession({
//     headers: await headers() // you need to pass the headers object.
// })
