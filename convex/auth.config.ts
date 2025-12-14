

// Custom auth configuration
// Using Convex mutations for authentication instead of Better Auth component

export default {
    providers: [
        {
            domain: process.env.CONVEX_SITE_URL,
            applicationID: "convex",
        },
    ],
};

